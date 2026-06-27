import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'https://v3.football.api-sports.io';
const API_KEY = process.env.API_FOOTBALL_KEY!;

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service role: só roda no servidor, nunca no client
);

// Mapeamento de posições da API-Football para o enum do nosso banco
const POSITION_MAP: Record<string, 'GK' | 'DF' | 'MF' | 'FW'> = {
  Goalkeeper: 'GK',
  Defender: 'DF',
  Midfielder: 'MF',
  Attacker: 'FW',
};

interface ApiFootballPlayerResponse {
  player: {
    id: number;
    name: string;
    firstname: string;
    lastname: string;
    birth: { date: string };
    nationality: string;
  };
  statistics: Array<{
    team: { id: number; name: string };
    league: { id: number; season: number };
    games: { position: string; appearences: number; rating: string | null };
    goals: { total: number | null; assists: number | null };
    passes: { total: number | null; accuracy: number | null };
    tackles: { total: number | null; interceptions: number | null };
    duels: { total: number | null; won: number | null };
    dribbles: { attempts: number | null; success: number | null };
    shots: { total: number | null; on: number | null };
    cards: { yellow: number; red: number };
  }>;
}

async function fetchPlayersByLeagueSeason(leagueId: number, season: number) {
  let page = 1;
  let allPlayers: ApiFootballPlayerResponse[] = [];

  // A API pagina os resultados — precisamos iterar até não haver mais páginas
  while (true) {
    const res = await fetch(
      `${API_BASE}/players?league=${leagueId}&season=${season}&page=${page}`,
      { headers: { 'x-apisports-key': API_KEY } }
    );

    if (!res.ok) {
      throw new Error(`API-Football retornou ${res.status} para liga ${leagueId}/${season}`);
    }

    const data = await res.json();
    allPlayers = allPlayers.concat(data.response);

    const totalPages = data.paging?.total ?? 1;
    if (page >= totalPages) break;
    page++;

    // Respeitar rate limit (ajuste conforme seu plano)
    await new Promise((r) => setTimeout(r, 600));
  }

  return allPlayers;
}

async function upsertPlayer(p: ApiFootballPlayerResponse['player'], position: 'GK' | 'DF' | 'MF' | 'FW') {
  const { data, error } = await supabase
    .from('players')
    .upsert(
      {
        external_id: p.id, // guardar o ID original da API para evitar duplicados em re-importações
        full_name: p.name,
        position: position,
        nationality: p.nationality,
        birth_date: p.birth.date,
      },
      { onConflict: 'external_id' }
    )
    .select('id')
    .single();

  if (error) throw error;
  return data.id as string;
}

async function upsertClub(teamId: number, teamName: string, leagueDbId: string) {
  const { data, error } = await supabase
    .from('clubs')
    .upsert(
      {
        external_id: teamId,
        name: teamName,
        league_id: leagueDbId,
      },
      { onConflict: 'external_id' }
    )
    .select('id')
    .single();

  if (error) throw error;
  return data.id as string;
}

async function insertPlayerSeason(
  playerDbId: string,
  clubDbId: string,
  leagueDbId: string,
  season: number,
  stats: ApiFootballPlayerResponse['statistics'][number]
) {
  const statsRaw = {
    appearances: stats.games.appearences ?? 0,
    position_raw: stats.games.position,
    goals: stats.goals.total ?? 0,
    assists: stats.goals.assists ?? 0,
    passes_total: stats.passes.total ?? 0,
    passes_accuracy: stats.passes.accuracy ?? 0,
    tackles: stats.tackles.total ?? 0,
    interceptions: stats.tackles.interceptions ?? 0,
    duels_total: stats.duels.total ?? 0,
    duels_won: stats.duels.won ?? 0,
    dribbles_attempts: stats.dribbles.attempts ?? 0,
    dribbles_success: stats.dribbles.success ?? 0,
    shots_total: stats.shots.total ?? 0,
    shots_on_target: stats.shots.on ?? 0,
    avg_match_rating: stats.games.rating ? parseFloat(stats.games.rating) : null,
    yellow_cards: stats.cards.yellow,
    red_cards: stats.cards.red,
  };

  const { error } = await supabase.from('player_seasons').upsert(
    {
      player_id: playerDbId,
      club_id: clubDbId,
      league_id: leagueDbId,
      season_year: season,
      stats_raw: statsRaw,
    },
    { onConflict: 'player_id,club_id,league_id,season_year' }
  );

  if (error) throw error;
}

export async function importLeagueSeason(
  apiLeagueId: number,
  leagueDbId: string,
  season: number
) {
  console.log(`Importando liga ${apiLeagueId}, temporada ${season}...`);
  const players = await fetchPlayersByLeagueSeason(apiLeagueId, season);

  for (const entry of players) {
    // Posição mandatória — sem posição não conseguimos encaixar no draft
    const position = POSITION_MAP[entry.statistics[0]?.games.position ?? ''];
    if (!position) continue;

    const playerDbId = await upsertPlayer(entry.player, position);

    for (const stat of entry.statistics) {
      // Pular estatísticas de ligas diferentes da que estamos importando agora
      if (stat.league.id !== apiLeagueId || stat.league.season !== season) continue;
      if (!stat.team) continue;

      const clubDbId = await upsertClub(stat.team.id, stat.team.name, leagueDbId);
      await insertPlayerSeason(playerDbId, clubDbId, leagueDbId, season, stat);
    }
  }

  console.log(`Importação concluída: ${players.length} jogadores processados.`);
}

// Exemplo de uso — rode isso por liga/temporada que quiser importar
async function main() {
  const leaguesToImport = [
    // { apiLeagueId: 71, leagueDbId: 'UUID_DO_BRASILEIRAO_NO_SEU_BANCO', season: 2025 },
    // { apiLeagueId: 39, leagueDbId: 'UUID_DA_PREMIER_LEAGUE_NO_SEU_BANCO', season: 2025 },
  ];

  if (leaguesToImport.length === 0) {
    console.log("Nenhuma liga configurada para importar. Por favor, adicione os IDs no array leaguesToImport.");
  }

  for (const league of leaguesToImport) {
    await importLeagueSeason(league.apiLeagueId, league.leagueDbId, league.season);
  }
}

// Start se rodado diretamente no CLI via Node/tsx/Bun
if (require.main === module || (typeof process !== "undefined" && process.argv[1]?.includes('import-players'))) {
  main().catch(console.error);
}
