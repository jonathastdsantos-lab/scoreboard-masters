import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { decodeQuiz } from "@/lib/share";
import { GuessGame } from "@/components/GuessGame";

type Search = { d?: string };

export const Route = createFileRoute("/play/custom")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    d: typeof s.d === "string" ? s.d : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Desafio personalizado — Escalação" },
      { name: "description", content: "Um desafio de escalação criado por um amigo." },
      { property: "og:title", content: "Topa o desafio? — Escalação" },
      { property: "og:description", content: "Adivinhe os 11 titulares dessa partida." },
    ],
  }),
  component: PlayCustom,
});

function PlayCustom() {
  const { d } = Route.useSearch();
  const quiz = useMemo(() => (d ? decodeQuiz(d) : null), [d]);

  if (!quiz) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="display text-3xl">Link inválido</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Não consegui ler esse desafio. Peça pro seu amigo gerar outro link.
        </p>
        <Link to="/" className="mt-4 inline-block text-sm underline">
          Voltar
        </Link>
      </div>
    );
  }
  return <GuessGame quiz={quiz} />;
}
