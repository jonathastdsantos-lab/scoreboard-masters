import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const Route = createFileRoute('/match/$matchId')({
  component: MatchLive,
});

function MatchLive() {
  const { matchId } = Route.useParams();
  const { session } = useAuth();
  const navigate = useNavigate();

  const [match, setMatch] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tactic, setTactic] = useState('');
  const [tacticSubmitted, setTacticSubmitted] = useState(false);

  const isHost = session?.user.id === match?.player_a_id;
  const tickInterval = useRef<any>(null);

  useEffect(() => {
    if (!session) return;

    // Load initial data
    const loadMatch = async () => {
      const { data: m } = await supabase.from('pvp_matches').select('*').eq('id', matchId).single();
      if (!m) {
        alert('Partida não encontrada');
        return navigate({ to: '/' });
      }
      setMatch(m);

      const { data: evts } = await supabase.from('pvp_match_events').select('*').eq('match_id', matchId).order('minute', { ascending: true });
      setEvents(evts || []);
      setLoading(false);
    };

    loadMatch();

    // Subscribe to events
    const channel = supabase.channel(`match_${matchId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pvp_match_events', filter: `match_id=eq.${matchId}` }, (payload) => {
        setEvents((prev) => [...prev, payload.new]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pvp_matches', filter: `id=eq.${matchId}` }, (payload) => {
        setMatch(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, session]);

  // Host Ticking Engine
  useEffect(() => {
    if (!isHost || !match) return;

    if (match.status === 'starting' || match.status === 'first_half' || match.status === 'second_half') {
      tickInterval.current = setInterval(async () => {
        try {
          await supabase.functions.invoke('simulate-match', {
            body: { match_id: matchId }
          });
        } catch (e) {
          console.error("Tick failed", e);
        }
      }, 5000);
    } else {
      if (tickInterval.current) clearInterval(tickInterval.current);
    }

    return () => {
      if (tickInterval.current) clearInterval(tickInterval.current);
    };
  }, [match, isHost, matchId]);

  const submitTactic = async (selectedTactic: string) => {
    setTactic(selectedTactic);
    setTacticSubmitted(true);
    await supabase.from('pvp_tactical_changes').insert({
      match_id: matchId,
      player_id: session!.user.id,
      tactic: selectedTactic
    });
    
    // In a full implementation, if both submitted, the Edge Function resumes.
    // For now, if host submits, we can forcefully resume for testing purposes.
    if (isHost) {
      await supabase.from('pvp_matches').update({ status: 'second_half' }).eq('id', matchId);
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-emerald-500">Carregando...</div>;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      {/* Header Placar */}
      <div className="h-32 bg-zinc-900 border-b border-white/10 flex items-center justify-center gap-12 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-black to-black opacity-50"></div>
        
        <div className="flex flex-col items-center z-10">
          <div className="text-zinc-500 text-sm mb-1 uppercase tracking-widest">Time A</div>
          <div className="text-2xl font-bold text-white">Você {isHost ? '(Host)' : ''}</div>
        </div>

        <div className="flex items-center gap-4 z-10">
          <div className="text-5xl font-black text-emerald-400 font-mono bg-black/50 px-6 py-2 rounded-lg border border-emerald-500/30">
            {match.score_a}
          </div>
          <div className="text-2xl text-zinc-600 font-black">X</div>
          <div className="text-5xl font-black text-emerald-400 font-mono bg-black/50 px-6 py-2 rounded-lg border border-emerald-500/30">
            {match.score_b}
          </div>
        </div>

        <div className="flex flex-col items-center z-10">
          <div className="text-zinc-500 text-sm mb-1 uppercase tracking-widest">Time B</div>
          <div className="text-2xl font-bold text-white">Adversário</div>
        </div>
        
        {/* Status indicator */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {match.status === 'finished' ? (
            <span className="text-zinc-500 font-bold uppercase text-xs tracking-wider">Partida Encerrada</span>
          ) : match.status === 'halftime' ? (
            <span className="text-amber-500 font-bold uppercase text-xs tracking-wider">Intervalo</span>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-emerald-500 font-bold uppercase text-xs tracking-wider">Ao Vivo</span>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex p-8 gap-8 max-w-7xl mx-auto w-full relative">
        
        {/* Pitch / Campo Esquerdo */}
        <div className="flex-1 bg-[#0a150e] rounded-2xl border border-emerald-900/50 relative overflow-hidden flex flex-col">
          {/* Pitch lines */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white/20 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/30 rounded-full"></div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-32 h-64 border-2 border-l-0 border-white/20"></div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-32 h-64 border-2 border-r-0 border-white/20"></div>

          <div className="relative z-10 p-6 flex flex-col h-full justify-center items-center text-center">
            {match.status === 'halftime' && (
               <div className="bg-black/80 backdrop-blur p-8 rounded-2xl border border-amber-500/30 max-w-md w-full">
                 <h2 className="text-2xl font-bold text-amber-500 mb-2">Fim do Primeiro Tempo</h2>
                 <p className="text-zinc-400 mb-6">Ajuste a sua tática para os próximos 45 minutos.</p>
                 
                 {tacticSubmitted ? (
                   <div className="text-emerald-400 font-bold animate-pulse">Tática confirmada! Aguardando adversário...</div>
                 ) : (
                   <div className="flex flex-col gap-3">
                     <button onClick={() => submitTactic('equilibrado')} className="p-3 rounded bg-zinc-900 border border-white/10 hover:border-white/40 transition">Equilibrado</button>
                     <button onClick={() => submitTactic('ataque')} className="p-3 rounded bg-emerald-900/20 border border-emerald-500/30 hover:border-emerald-500 transition text-emerald-400 font-bold">Focar no Ataque</button>
                     <button onClick={() => submitTactic('retranca')} className="p-3 rounded bg-blue-900/20 border border-blue-500/30 hover:border-blue-500 transition text-blue-400 font-bold">Retranca Total</button>
                   </div>
                 )}
               </div>
            )}

            {match.status === 'finished' && (
              <div className="bg-black/80 backdrop-blur p-8 rounded-2xl border border-emerald-500/50 max-w-md w-full">
                <h2 className="text-3xl font-black text-white mb-2">Fim de Jogo</h2>
                <div className="text-5xl font-mono text-emerald-400 my-6">{match.score_a} - {match.score_b}</div>
                <button onClick={() => navigate({ to: '/' })} className="w-full bg-emerald-500 text-black font-bold py-3 rounded-lg hover:bg-emerald-400">Voltar ao Dashboard</button>
              </div>
            )}
          </div>
        </div>

        {/* Timeline Direita */}
        <div className="w-96 bg-zinc-900/50 rounded-2xl border border-white/5 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-zinc-900">
            <h3 className="font-bold text-white flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path></svg>
              Timeline da Partida
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {events.length === 0 ? (
              <div className="text-zinc-500 text-sm text-center mt-10">Aguardando início...</div>
            ) : (
              events.map((ev, i) => (
                <div key={i} className="flex gap-4 items-start animate-fade-in-up">
                  <div className="text-emerald-500 font-mono font-bold text-sm pt-1">{ev.minute}'</div>
                  <div className={`flex-1 p-3 rounded-xl border ${ev.event_type === 'goal' ? 'bg-emerald-900/20 border-emerald-500/50' : 'bg-black/40 border-white/5'}`}>
                    {ev.event_type === 'goal' && <div className="text-emerald-400 font-bold text-xs uppercase mb-1">Gol!</div>}
                    <div className="text-sm text-zinc-300">{ev.description}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
