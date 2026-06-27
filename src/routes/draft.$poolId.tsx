import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const Route = createFileRoute('/draft/$poolId')({
  component: DraftMode,
});

interface DraftPlayer {
  player_id: string;
  player_season_id: string;
  full_name: string;
  overall: number;
  avatar_url: string;
  position?: string;
}

const TARGETS = { GK: 1, DF: 4, MF: 4, FW: 2 };
type Position = keyof typeof TARGETS;

const POS_LABELS: Record<Position, string> = {
  GK: 'Goleiro',
  DF: 'Defensor',
  MF: 'Meio-Campo',
  FW: 'Atacante'
};

function DraftMode() {
  const { poolId } = Route.useParams();
  const { session } = useAuth();
  const navigate = useNavigate();

  const [squad, setSquad] = useState<DraftPlayer[]>([]);
  const [currentChoices, setCurrentChoices] = useState<DraftPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Determine which position to draft next
  const getNextPosition = (): Position | null => {
    const counts = { GK: 0, DF: 0, MF: 0, FW: 0 };
    squad.forEach(p => {
      if (p.position && counts[p.position as Position] !== undefined) {
        counts[p.position as Position]++;
      }
    });

    for (const pos of ['GK', 'DF', 'MF', 'FW'] as Position[]) {
      if (counts[pos] < TARGETS[pos]) return pos;
    }
    return null;
  };

  const nextPos = getNextPosition();

  const rollPlayers = async (position: Position) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('roll_draft_players', {
        p_position: position,
        p_limit: 3
      });
      if (error) throw error;
      setCurrentChoices(data || []);
    } catch (err: any) {
      console.error(err);
      alert('Erro ao buscar jogadores: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (nextPos && currentChoices.length === 0 && !loading) {
      rollPlayers(nextPos);
    }
  }, [nextPos, squad]);

  const handlePick = (player: DraftPlayer) => {
    if (!nextPos) return;
    setSquad([...squad, { ...player, position: nextPos }]);
    setCurrentChoices([]); // Clear choices to trigger the next roll
  };

  const saveSquad = async () => {
    if (!session) return;
    setSaving(true);
    try {
      // 1. Create solo_squad
      const { data: squadData, error: squadErr } = await supabase
        .from('solo_squads')
        .insert({
          profile_id: session.user.id,
          league_pool_id: poolId,
          active: true
        })
        .select('id')
        .single();
        
      if (squadErr) throw squadErr;

      // 2. Insert players
      const inserts = squad.map(p => ({
        solo_squad_id: squadData.id,
        player_season_id: p.player_season_id,
        position_in_formation: p.position,
        is_starting_xi: true
      }));

      const { error: playersErr } = await supabase
        .from('solo_squad_players')
        .insert(inserts);

      if (playersErr) throw playersErr;

      alert('Squad salvo com sucesso! Boa sorte na liga.');
      navigate({ to: '/' });
    } catch (err: any) {
      alert('Erro ao salvar o time: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!nextPos && squad.length === 11) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8">
        <h1 className="text-4xl font-bold text-emerald-400 mb-8">Seu Elenco Está Fechado!</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {squad.map((p, i) => (
            <div key={i} className="bg-zinc-900 border border-emerald-500/30 p-4 rounded-xl flex items-center gap-4">
              <img src={p.avatar_url} alt={p.full_name} className="w-12 h-12 rounded-full" />
              <div>
                <div className="text-white font-bold">{p.full_name}</div>
                <div className="text-emerald-400 text-sm">{p.position} - {p.overall} OVR</div>
              </div>
            </div>
          ))}
        </div>
        <button 
          onClick={saveSquad}
          disabled={saving}
          className="bg-emerald-500 text-black font-bold py-3 px-8 rounded-full hover:bg-emerald-400 transition"
        >
          {saving ? 'Salvando...' : 'Confirmar e Ir pro Jogo'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col p-8">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-3xl font-bold text-white">
          Draft <span className="text-emerald-400">11-0</span>
        </h1>
        <div className="text-zinc-400">
          Progresso: {squad.length} / 11 Jogadores
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto w-full">
        {nextPos && (
          <h2 className="text-2xl font-semibold text-white mb-8">
            Escolha um <span className="text-emerald-400 underline decoration-2">{POS_LABELS[nextPos]}</span>
          </h2>
        )}

        {loading ? (
          <div className="animate-pulse flex gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-64 h-96 bg-zinc-900 rounded-2xl border border-white/5"></div>
            ))}
          </div>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-8 w-full justify-center">
            {currentChoices.map(player => (
              <button
                key={player.player_id}
                onClick={() => handlePick(player)}
                className="group relative w-64 h-96 bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden hover:border-emerald-500 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all flex flex-col text-left"
              >
                {/* OVR Badge */}
                <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 z-10">
                  <span className="text-2xl font-black text-emerald-400">{player.overall}</span>
                </div>
                
                {/* Photo Placeholder */}
                <div className="h-2/3 bg-zinc-800 flex items-center justify-center relative overflow-hidden">
                  <img 
                    src={player.avatar_url} 
                    alt={player.full_name}
                    className="absolute bottom-0 w-48 h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent"></div>
                </div>

                {/* Details */}
                <div className="p-6 flex-1 flex flex-col justify-end relative z-10">
                  <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{player.full_name}</h3>
                  <div className="text-zinc-400 text-sm font-medium">{POS_LABELS[nextPos!]}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mini-squad preview bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-zinc-900/90 backdrop-blur-xl border-t border-white/10 flex items-center px-8 gap-2 overflow-x-auto">
        {squad.map((p, i) => (
          <div key={i} className="flex-shrink-0 flex items-center bg-black rounded-lg p-2 border border-white/5">
            <span className="text-emerald-500 font-bold text-xs mr-2">{p.position}</span>
            <span className="text-white text-sm max-w-[80px] truncate">{p.full_name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
