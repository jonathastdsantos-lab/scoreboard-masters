import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Copy, Share2, Trash2, Plus } from "lucide-react";
import type { Player, Position, Quiz } from "@/lib/quizzes";
import { encodeQuiz } from "@/lib/share";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Criar desafio — Escalação" },
      { name: "description", content: "Monte sua própria escalação e desafie os amigos por link." },
    ],
  }),
  component: Create,
});

const POSITIONS: Position[] = ["GOL", "ZAG", "LAT", "VOL", "MEI", "ATA", "TEC"];

function emptyPlayer(): Player {
  return { name: "", position: "MEI" };
}

function Create() {
  const [title, setTitle] = useState("");
  const [badge, setBadge] = useState("XI");
  const [subtitle, setSubtitle] = useState("");
  const [competition, setCompetition] = useState("");
  const [date, setDate] = useState("");
  const [score, setScore] = useState("");
  const [context, setContext] = useState("");
  const [players, setPlayers] = useState<Player[]>(
    Array.from({ length: 11 }, emptyPlayer),
  );
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const validPlayers = players.filter((p) => p.name.trim().length > 0);
  const canShare = title.trim().length > 0 && validPlayers.length >= 3;

  const quiz: Quiz = useMemo(
    () => ({
      id: "custom",
      badge: badge.trim() || "XI",
      title: title.trim() || "Desafio",
      subtitle: subtitle.trim(),
      context: context.trim(),
      date: date.trim(),
      competition: competition.trim(),
      homeTeam: "",
      score: score.trim(),
      players: validPlayers.map((p) => ({
        name: p.name.trim(),
        position: p.position,
      })),
    }),
    [badge, title, subtitle, context, date, competition, score, validPlayers],
  );

  function updatePlayer(i: number, patch: Partial<Player>) {
    setPlayers((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }

  function addPlayer() {
    setPlayers((prev) => [...prev, emptyPlayer()]);
  }

  function removePlayer(i: number) {
    setPlayers((prev) => prev.filter((_, idx) => idx !== i));
  }

  function generate() {
    const token = encodeQuiz(quiz);
    const url = `${window.location.origin}/play/custom?d=${token}`;
    setShareUrl(url);
    setCopied(false);
    setTimeout(() => {
      document.getElementById("share-box")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }

  async function copy() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function shareNative() {
    if (!shareUrl) return;
    if (navigator.share) {
      navigator
        .share({
          title: `Escalação: ${quiz.title}`,
          text: `Topa adivinhar a escalação de "${quiz.title}"?`,
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      copy();
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link to="/" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
        ← voltar
      </Link>
      <h1 className="display text-4xl mt-4">Crie o seu desafio</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Monte a escalação de um jogo marcante (do seu time, seleção, várzea...) e mande o link
        pros amigos.
      </p>

      {/* Match info */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            placeholder="Ex: Flamengo — Final Libertadores 2019"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="badge">Selo (placar curto)</Label>
          <Input
            id="badge"
            placeholder="2 × 1"
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
            maxLength={8}
          />
        </div>
        <div>
          <Label htmlFor="score">Placar / resultado</Label>
          <Input
            id="score"
            placeholder="Campeão"
            value={score}
            onChange={(e) => setScore(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="competition">Competição</Label>
          <Input
            id="competition"
            placeholder="Libertadores"
            value={competition}
            onChange={(e) => setCompetition(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="date">Data</Label>
          <Input
            id="date"
            placeholder="23 nov 2019"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="subtitle">Subtítulo</Label>
          <Input
            id="subtitle"
            placeholder="Virada nos minutos finais"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="context">Dica / contexto (opcional)</Label>
          <Textarea
            id="context"
            rows={2}
            placeholder="Um parágrafo que situe o jogo, sem dar resposta."
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />
        </div>
      </div>

      {/* Players */}
      <div className="mt-10">
        <div className="flex items-end justify-between">
          <h2 className="display text-2xl">Escalação</h2>
          <Button variant="outline" size="sm" onClick={addPlayer}>
            <Plus className="size-3" /> adicionar
          </Button>
        </div>
        <div className="mt-3 space-y-2">
          {players.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="scoreboard w-8 text-right text-xs text-muted-foreground">
                {(i + 1).toString().padStart(2, "0")}
              </span>
              <Input
                placeholder="Nome do jogador"
                value={p.name}
                onChange={(e) => updatePlayer(i, { name: e.target.value })}
                className="flex-1"
              />
              <Select
                value={p.position}
                onValueChange={(v) => updatePlayer(i, { position: v as Position })}
              >
                <SelectTrigger className="w-[92px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((pos) => (
                    <SelectItem key={pos} value={pos}>
                      {pos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                type="button"
                onClick={() => removePlayer(i)}
                className="text-muted-foreground hover:text-destructive p-2"
                aria-label="Remover"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Generate */}
      <div className="mt-8 flex flex-wrap items-center gap-2">
        <Button onClick={generate} disabled={!canShare} size="lg">
          <Share2 className="size-4" /> Gerar link do desafio
        </Button>
        {!canShare && (
          <span className="text-xs text-muted-foreground">
            preencha um título e pelo menos 3 jogadores
          </span>
        )}
      </div>

      {shareUrl && (
        <div
          id="share-box"
          className="mt-6 rounded-2xl border-2 border-accent/60 bg-accent/10 p-4 shadow-glow"
        >
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Seu desafio está pronto
          </div>
          <div className="mt-2 break-all rounded-md bg-background p-3 font-mono text-xs">
            {shareUrl}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={copy} variant="default">
              <Copy className="size-4" /> {copied ? "Copiado!" : "Copiar link"}
            </Button>
            <Button onClick={shareNative} variant="outline">
              <Share2 className="size-4" /> Compartilhar
            </Button>
            <Button asChild variant="ghost">
              <a href={shareUrl} target="_blank" rel="noreferrer">
                Testar
              </a>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            O desafio é codificado direto no link — qualquer pessoa com o link consegue jogar,
            sem cadastro.
          </p>
        </div>
      )}
    </div>
  );
}
