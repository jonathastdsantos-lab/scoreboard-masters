import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { findQuiz } from "@/lib/quizzes";
import { GuessGame } from "@/components/GuessGame";

export const Route = createFileRoute("/play/$id")({
  head: ({ params }) => {
    const q = findQuiz(params.id);
    const title = q ? `${q.title} — Escalação` : "Escalação";
    const desc = q ? q.subtitle : "Adivinhe os 11 titulares.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: PlayPreset,
  errorComponent: () => <NotPlayable />,
  notFoundComponent: () => <NotPlayable />,
});

function PlayPreset() {
  const { id } = useParams({ from: "/play/$id" });
  const quiz = findQuiz(id);
  if (!quiz) return <NotPlayable />;
  return <GuessGame quiz={quiz} />;
}

function NotPlayable() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="display text-3xl">Partida não encontrada</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Esse desafio não existe (ou expirou).
      </p>
      <Link to="/" className="mt-4 inline-block text-sm underline">
        Voltar
      </Link>
    </div>
  );
}
