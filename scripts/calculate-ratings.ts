import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service role: só roda no servidor
);

interface StatsRaw {
  appearances: number;
  goals: number;
  assists: number;
  passes_total: number;
  passes_accuracy: number;
  tackles: number;
  interceptions: number;
  duels_total: number;
  duels_won: number;
  dribbles_attempts: number;
  dribbles_success: number;
  shots_total: number;
  shots_on_target: number;
  avg_match_rating: number | null;
}

type Position = 'GK' | 'DF' | 'MF' | 'FW';

const RATING_FORMULA_VERSION = 'v1.0.0'; // sempre versionar mudanças na fórmula

// Minutos estimados por aparição
const ESTIMATED_MINUTES_PER_APPEARANCE = 75;

function per90(value: number, appearances: number): number {
  if (appearances === 0) return 0;
  const totalMinutes = appearances * ESTIMATED_MINUTES_PER_APPEARANCE;
  return (value / totalMinutes) * 90;
}

function scaleToRating(value: number, midpoint: number, steepness: number): number {
  const sigmoid = 1 / (1 + Math.exp(-steepness * (value - midpoint)));
  return Math.round(40 + sigmoid * 59); // piso 40, teto 99
}

export function calculatePlayerAttributes(stats: StatsRaw, position: Position) {
  const goalsP90 = per90(stats.goals, stats.appearances);
  const assistsP90 = per90(stats.assists, stats.appearances);
  const shotsOnTargetP90 = per90(stats.shots_on_target, stats.appearances);
  const tacklesP90 = per90(stats.tackles, stats.appearances);
  const interceptionsP90 = per90(stats.interceptions, stats.appearances);
  const duelsWonPct = stats.duels_total > 0 ? stats.duels_won / stats.duels_total : 0;
  const dribbleSuccessPct =
    stats.dribbles_attempts > 0 ? stats.dribbles_success / stats.dribbles_attempts : 0;

  // --- Finishing (finalização) ---
  const finishing = scaleToRating(goalsP90 + shotsOnTargetP90 * 0.3, 0.4, 2.5);

  // --- Passing (passe) ---
  const passingAccuracyScore = scaleToRating(stats.passes_accuracy, 78, 0.15);
  const assistsScore = scaleToRating(assistsP90, 0.25, 3);
  const passing = Math.round(passingAccuracyScore * 0.6 + assistsScore * 0.4);

  // --- Defending (defesa) ---
  const defending = scaleToRating(
    tacklesP90 * 0.5 + interceptionsP90 * 0.5 + duelsWonPct * 2,
    1.2,
    1.5
  );

  // --- Physical (físico) ---
  const physical = scaleToRating(duelsWonPct * 100, 50, 0.08);

  // --- Pace (ritmo) ---
  const pace = scaleToRating(dribbleSuccessPct * 100, 45, 0.1);

  // --- Overall: pesos diferentes por posição ---
  const weights: Record<Position, Record<string, number>> = {
    FW: { finishing: 0.4, passing: 0.15, defending: 0.05, physical: 0.15, pace: 0.25 },
    MF: { finishing: 0.15, passing: 0.4, defending: 0.2, physical: 0.15, pace: 0.1 },
    DF: { finishing: 0.05, passing: 0.2, defending: 0.5, physical: 0.2, pace: 0.05 },
    GK: { finishing: 0, passing: 0.2, defending: 0.6, physical: 0.2, pace: 0 },
  };

  const w = weights[position];
  const overall = Math.round(
    finishing * w.finishing +
      passing * w.passing +
      defending * w.defending +
      physical * w.physical +
      pace * w.pace
  );

  return {
    overall: clamp(overall),
    finishing: clamp(finishing),
    passing: clamp(passing),
    defending: clamp(defending),
    physical: clamp(physical),
    pace: clamp(pace),
    rating_formula_version: RATING_FORMULA_VERSION,
  };
}

function clamp(value: number): number {
  return Math.max(1, Math.min(99, value));
}

// Lógica de iteração no banco de dados (Batch Worker)
async function main() {
  console.log('Iniciando cálculo de ratings no Supabase...');

  let page = 0;
  const pageSize = 500;
  let hasMore = true;
  let processed = 0;

  while (hasMore) {
    // Fazemos inner join em players para pegar a posição
    const { data: seasons, error } = await supabase
      .from('player_seasons')
      .select(`
        id,
        stats_raw,
        players!inner(position)
      `)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('Erro ao buscar player_seasons:', error);
      break;
    }
    
    if (!seasons || seasons.length === 0) {
      hasMore = false;
      break;
    }

    for (const season of seasons) {
      // Supabase TS bindings podem precisar de casting para joins aninhados
      const playerObj = Array.isArray(season.players) ? season.players[0] : season.players;
      const position = playerObj?.position as Position;
      const stats = season.stats_raw as unknown as StatsRaw;

      // Ignora se não houver posição (pois não tem peso mapeado) ou se não tiver stats
      if (!position || !stats) continue;

      const attributes = calculatePlayerAttributes(stats, position);

      // Usando upsert garantido pela UNIQUE constraint `unique_player_season_rating` da Migration 005
      const { error: upsertError } = await supabase
        .from('player_ratings')
        .upsert({
          player_season_id: season.id,
          overall: attributes.overall,
          finishing: attributes.finishing,
          passing: attributes.passing,
          defending: attributes.defending,
          physical: attributes.physical,
          pace: attributes.pace,
          rating_formula_version: attributes.rating_formula_version
        }, { onConflict: 'player_season_id' }); 
        
      if (upsertError) {
        console.error(`Erro ao salvar rating para a season ${season.id}:`, upsertError);
      } else {
        processed++;
      }
    }
    
    console.log(`Página ${page} concluída. Total de ratings salvos/atualizados: ${processed}...`);
    page++;
  }

  console.log(`✅ Pipeline de Cálculo concluído: ${processed} ratings gerados usando a fórmula ${RATING_FORMULA_VERSION}.`);
}

// Start se rodado diretamente via Node/tsx/Bun
if (require.main === module || (typeof process !== "undefined" && process.argv[1]?.includes('calculate-ratings'))) {
  main().catch(console.error);
}
