import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Flag, RotateCcw, Share2, Timer, Trophy } from "lucide-react";
import type { Quiz } from "@/lib/quizzes";
import { emptySolved, matchGuess } from "@/lib/match";
import { saveScore } from "@/lib/scores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const POS_COLORS: Record<string, string> = {
  GOL: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  ZAG: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  LAT: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  VOL: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  MEI: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  ATA: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  TEC: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/30",
};

function fmt(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const r = (s % 60).toString().padStart(2, "0");
  return `${m}:${r}`;
}

export function GuessGame({ quiz }: { quiz: Quiz }) {
  const [solved, setSolved] = useState<boolean[]>(() => emptySolved(quiz));
  const [given, setGiven] = useState(false);
  const [guess, setGuess] = useState("");
  const [flash, setFlash] = useState<"ok" | "no" | null>(null);
  const [seconds, setSeconds] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const correct = solved.filter(Boolean).length;
  const total = quiz.players.length;
  const done = correct === total || given;

  useEffect(() => {
    setSolved(emptySolved(quiz));
    setGiven(false);
    setSeconds(0);
    setGuess("");
  }, [quiz]);

  useEffect(() => {
    if (done) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [done]);

  useEffect(() => {
    if (done) {
      saveScore({
        quizId: quiz.id,
        name: localStorage.getItem("escalacao.player") ?? "Você",
        correct,
        total,
        seconds,
        at: Date.now(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (done || !guess.trim()) return;
    const idx = matchGuess(guess, quiz.players, solved);
    if (idx >= 0) {
      const next = solved.slice();
      next[idx] = true;
      setSolved(next);
      setFlash("ok");
    } else {
      setFlash("no");
    }
    setGuess("");
    setTimeout(() => setFlash(null), 350);
  }

  function reset() {
    setSolved(emptySolved(quiz));
    setGiven(false);
    setSeconds(0);
    setGuess("");
    inputRef.current?.focus();
  }

  function share() {
    const text = `Fiz ${correct}/${total} em "${quiz.title}" no Escalação ⚽\n${window.location.href}`;
    if (navigator.share) {
      navigator.share({ title: quiz.title, text, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text);
    }
  }

  const grouped = useMemo(() => {
    const order = ["GOL", "ZAG", "LAT", "VOL", "MEI", "ATA", "TEC"];
    return order
      .map((pos) => ({
        pos,
        items: quiz.players
          .map((p, i) => ({ p, i }))
          .filter(({ p }) => p.position === pos),
      }))
      .filter((g) => g.items.length > 0);
  }, [quiz]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/" className="text-xs text-muted-foreground uppercase tracking-widest hover:text-foreground">
        ← voltar
      </Link>

      {/* Scoreboard */}
      <div className="mt-4 overflow-hidden rounded-2xl border bg-primary text-primary-foreground shadow-card">
        <div className="flex items-stretch">
          <div className="flex flex-col justify-center bg-accent px-5 py-4 text-accent-foreground">
            <span className="display text-3xl leading-none">{quiz.badge}</span>
          </div>
          <div className="flex-1 px-5 py-4">
            <div className="text-[10px] uppercase tracking-[0.2em] opacity-70">
              {quiz.competition} · {quiz.date}
            </div>
            <h1 className="display text-2xl md:text-3xl mt-1">{quiz.title}</h1>
            <p className="text-sm opacity-80">{quiz.subtitle}</p>
          </div>
          <div className="hidden sm:flex flex-col items-end justify-center px-5 py-4 border-l border-white/10">
            <div className="text-[10px] uppercase tracking-[0.2em] opacity-70">Placar</div>
            <div className="scoreboard text-2xl">{quiz.score}</div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 bg-black/20 px-5 py-2.5 text-xs">
          <div className="flex items-center gap-2">
            <Trophy className="size-3.5" />
            <span className="scoreboard">
              {correct.toString().padStart(2, "0")} / {total}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Timer className="size-3.5" />
            <span className="scoreboard">{fmt(seconds)}</span>
          </div>
        </div>
      </div>

      {!done && (
        <p className="mt-4 text-sm text-muted-foreground">{quiz.context}</p>
      )}

      {/* Input */}
      <form onSubmit={submit} className="mt-5 flex gap-2">
        <Input
          ref={inputRef}
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder={done ? "Partida encerrada" : "Digite o nome de um jogador…"}
          disabled={done}
          autoFocus
          className={`h-12 text-base transition ${
            flash === "ok"
              ? "ring-2 ring-success border-success"
              : flash === "no"
                ? "ring-2 ring-destructive border-destructive"
                : ""
          }`}
        />
        <Button type="submit" disabled={done} size="lg" className="h-12">
          Chutar
        </Button>
      </form>

      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>Vale o último sobrenome também.</span>
        {!done && (
          <button
            type="button"
            onClick={() => setGiven(true)}
            className="inline-flex items-center gap-1 hover:text-destructive"
          >
            <Flag className="size-3" /> entregar
          </button>
        )}
      </div>

      {/* Players list grouped by position */}
      <div className="mt-6 space-y-5">
        {grouped.map(({ pos, items }) => (
          <div key={pos}>
            <div className="mb-2 flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-widest ${POS_COLORS[pos]}`}
              >
                {pos}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {items.map(({ p, i }) => {
                const isSolved = solved[i];
                const reveal = isSolved || given;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
                      isSolved
                        ? "border-success/40 bg-success/10"
                        : reveal
                          ? "border-destructive/30 bg-destructive/5"
                          : "border-dashed bg-muted/40"
                    }`}
                  >
                    <div
                      className={`flex size-9 items-center justify-center rounded-lg scoreboard text-sm ${
                        isSolved
                          ? "bg-success text-success-foreground"
                          : reveal
                            ? "bg-destructive/80 text-destructive-foreground"
                            : "bg-background text-muted-foreground"
                      }`}
                    >
                      {isSolved ? <Check className="size-4" /> : (i + 1).toString().padStart(2, "0")}
                    </div>
                    <div className="flex-1 min-w-0">
                      {reveal ? (
                        <div className="font-semibold truncate">{p.name}</div>
                      ) : (
                        <div className="font-mono text-muted-foreground">
                          {p.name.replace(/[^\s]/g, "•")}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* End state */}
      {done && (
        <div className="mt-8 rounded-2xl border bg-card p-5 text-center shadow-card">
          <div className="display text-4xl">
            {correct} <span className="text-muted-foreground">/ {total}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            em <span className="scoreboard">{fmt(seconds)}</span>
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button onClick={share} variant="default">
              <Share2 className="size-4" /> Compartilhar
            </Button>
            <Button onClick={reset} variant="secondary">
              <RotateCcw className="size-4" /> Tentar de novo
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Outros jogos</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
