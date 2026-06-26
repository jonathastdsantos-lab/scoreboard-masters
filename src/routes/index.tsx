import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, Activity, Users, Star, ArrowRight } from 'lucide-react';

export const Route = createFileRoute('/')({
  component: Dashboard,
});

function Dashboard() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [elo, setElo] = useState<number>(1000);
  const [findingMatch, setFindingMatch] = useState(false);

  const handleFindMatch = async () => {
    setFindingMatch(true);
    try {
      const { data, error } = await supabase.functions.invoke('matchmaking', {
        body: { action: 'find_match', pvp_squad_id: null } // using null for now since squad drafting isn't built
      });
      if (error) throw error;
      
      alert(`Matchmaking acionado! Status/Match ID: ${JSON.stringify(data)}`);
    } catch (err: any) {
      alert('Erro no matchmaking: ' + err.message);
    } finally {
      setFindingMatch(false);
    }
  };

  useEffect(() => {
    if (!loading && !session) {
      navigate({ to: '/login' });
    }
  }, [session, loading, navigate]);

  if (loading || !session) return null;

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Bem-vindo, Manager!</h1>
        <p className="text-zinc-400 mt-1">Aqui está o seu resumo da temporada.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Card: Elo Rating */}
        <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-6 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <Star className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Rating (Elo)</p>
              <h2 className="text-2xl font-bold text-white">{elo}</h2>
            </div>
          </div>
        </div>

        {/* Card: Partidas Jogadas */}
        <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-6 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Partidas Solo</p>
              <h2 className="text-2xl font-bold text-white">0</h2>
            </div>
          </div>
        </div>

        {/* Card: Ligas Privadas */}
        <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-6 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Ligas Privadas</p>
              <h2 className="text-2xl font-bold text-white">0</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2 mt-8">
        <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-8 shadow-lg backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent transition-opacity group-hover:opacity-100 opacity-50" />
          <h3 className="text-xl font-bold text-white mb-2 relative z-10">Temporada Perfeita</h3>
          <p className="text-zinc-400 mb-6 relative z-10 text-sm">
            Selecione uma liga, monte seu *Dream Team* do Draft e tente vencer todos os jogos sem perder. O desafio supremo do Modo Solo.
          </p>
          <Link
            to="/solo-mode"
            className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20 relative z-10 border border-white/10"
          >
            <Trophy className="h-4 w-4" />
            Jogar Modo Solo
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>

        <div className="rounded-xl border border-white/5 bg-zinc-900/20 p-8 shadow-lg backdrop-blur-sm relative overflow-hidden">
          <h3 className="text-xl font-bold text-white mb-2">PvP Ranqueado</h3>
          <p className="text-zinc-400 mb-6 text-sm">
            Enfrente outros managers em tempo real. Ajuste táticas no intervalo e suba no ranking global.
          </p>
          <button
            onClick={handleFindMatch}
            disabled={findingMatch}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 border border-emerald-500/50 px-4 py-2 text-sm font-bold text-emerald-400 transition-colors hover:bg-emerald-500 hover:text-black disabled:opacity-50 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
          >
            {findingMatch ? 'Buscando adversário...' : 'Buscar Partida'}
          </button>
        </div>
      </div>
    </div>
  );
}
