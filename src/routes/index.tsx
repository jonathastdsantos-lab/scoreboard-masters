import { createFileRoute, Link } from "@tanstack/react-router";
import { PRESET_QUIZZES } from "@/lib/quizzes";
import { Button } from "@/components/ui/button";
import { Plus, Share2, Trophy } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Escalação — adivinhe o time" },
      { name: "description", content: "Acerte os 11 titulares das partidas mais marcantes do futebol. Crie seus próprios desafios e jogue com amigos." },
      { property: "og:title", content: "Escalação — adivinhe o time" },
      { property: "og:description", content: "Acerte os 11 titulares das partidas mais marcantes do futebol." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <header className="border-b">
        <div className="mx-auto max-w-5xl px-4 pt-14 pb-12">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
            <span className="inline-block size-2 rounded-full bg-accent" />
            o jogo da escalação
          </div>
          <h1 className="display text-5xl md:text-7xl mt-3 leading-[0.95]">
            38&nbsp;×&nbsp;0. 7&nbsp;×&nbsp;1.
            <br />
            <span className="text-muted-foreground">qual é o XI?</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground">
            Acerte os onze titulares das partidas que entraram pra história. Crie sua própria
            escalação e desafie a galera por link.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild size="lg">
              <Link to="/play/$id" params={{ id: PRESET_QUIZZES[0].id }}>
                <Trophy className="size-4" /> Começar a jogar
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/create">
                <Plus className="size-4" /> Criar desafio
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Featured */}
      <section className="mx-auto max-w-5xl px-4 py-12">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="display text-2xl">Partidas em destaque</h2>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            {PRESET_QUIZZES.length} jogos
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {PRESET_QUIZZES.map((q) => (
            <Link
              key={q.id}
              to="/play/$id"
              params={{ id: q.id }}
              className="group relative overflow-hidden rounded-2xl border bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-glow"
            >
              <div className="flex items-stretch">
                <div className="flex w-24 flex-col items-center justify-center bg-primary text-primary-foreground">
                  <span className="display text-2xl leading-none">{q.badge}</span>
                </div>
                <div className="flex-1 p-4">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {q.competition}
                  </div>
                  <div className="display text-xl mt-1 leading-tight">{q.title}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{q.subtitle}</div>
                  <div className="mt-3 flex items-center gap-3 text-xs">
                    <span className="scoreboard rounded-md bg-secondary px-2 py-1">
                      {q.score ?? "—"}
                    </span>
                    <span className="text-muted-foreground">{q.players.length} jogadores</span>
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-accent scale-x-0 origin-left transition-transform group-hover:scale-x-100" />
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t bg-secondary/40">
        <div className="mx-auto max-w-5xl px-4 py-12 grid gap-6 sm:grid-cols-3">
          {[
            { n: "01", t: "Escolha a partida", d: "Finais, viradas, vexames — tudo o que ficou na memória." },
            { n: "02", t: "Digite os nomes", d: "Aceita sobrenome. Sem dica, sem letra revelada. É memória pura." },
            { n: "03", t: "Compartilhe o link", d: "Crie sua própria escalação e mande pros amigos no grupo." },
          ].map((s) => (
            <div key={s.n}>
              <div className="scoreboard text-xs text-accent-foreground/60">{s.n}</div>
              <h3 className="display text-xl mt-1">{s.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto max-w-5xl px-4 py-6 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>Escalação · feito pra resenha de bar</span>
          <Link to="/create" className="inline-flex items-center gap-1 hover:text-foreground">
            <Share2 className="size-3" /> criar um desafio
          </Link>
        </div>
      </footer>
    </div>
  );
}
