import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Shield, Play } from 'lucide-react';

export const Route = createFileRoute('/solo-mode')({
  component: SoloModeSelect,
});

interface LeaguePool {
  id: string;
  name: string;
  description: string;
}

function SoloModeSelect() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [pools, setPools] = useState<LeaguePool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !session) {
      navigate({ to: '/login' });
    } else if (session) {
      fetchPools();
    }
  }, [session, authLoading, navigate]);

  const fetchPools = async () => {
    try {
      const { data, error } = await supabase
        .from('league_pools')
        .select('id, name, description')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setPools(data || []);
    } catch (err) {
      console.error('Erro ao buscar ligas:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !session) return null;

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Escolha sua Liga</h1>
        <p className="text-zinc-400 mt-1">Selecione o pacote de jogadores para iniciar seu Draft.</p>
      </header>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      ) : pools.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-12 text-center shadow-lg backdrop-blur-sm">
          <Shield className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
          <h3 className="text-lg font-medium text-white">Nenhuma liga disponível no momento</h3>
          <p className="text-zinc-500 mt-2">O servidor está processando a importação de novas temporadas. Volte em breve!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pools.map((pool) => (
            <div key={pool.id} className="group relative overflow-hidden rounded-xl border border-white/10 bg-zinc-900/40 p-6 shadow-lg backdrop-blur-sm transition-all hover:border-emerald-500/30 hover:bg-zinc-800/60">
              <div className="absolute right-0 top-0 h-32 w-32 -translate-y-16 translate-x-16 rounded-full bg-emerald-500/10 blur-3xl transition-opacity group-hover:bg-emerald-500/20" />
              
              <h3 className="text-xl font-bold text-white mb-2">{pool.name}</h3>
              <p className="text-sm text-zinc-400 mb-6 min-h-[40px]">{pool.description}</p>
              
              <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2.5 text-sm font-bold text-emerald-400 transition-colors group-hover:bg-emerald-500 group-hover:text-black">
                <Play className="h-4 w-4" />
                Iniciar Draft
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
