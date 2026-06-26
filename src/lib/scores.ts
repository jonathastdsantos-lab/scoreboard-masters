export type ScoreEntry = {
  quizId: string;
  name: string;
  correct: number;
  total: number;
  seconds: number;
  at: number;
};

const KEY = "escalacao.scores.v1";

function read(): ScoreEntry[] {
  if (typeof localStorage === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveScore(entry: ScoreEntry) {
  if (typeof localStorage === "undefined") return;
  const all = read();
  all.push(entry);
  localStorage.setItem(KEY, JSON.stringify(all.slice(-200)));
}

export function leaderboard(quizId: string): ScoreEntry[] {
  return read()
    .filter((s) => s.quizId === quizId)
    .sort((a, b) => b.correct - a.correct || a.seconds - b.seconds)
    .slice(0, 10);
}

export function recentScores(limit = 5): ScoreEntry[] {
  return read().sort((a, b) => b.at - a.at).slice(0, limit);
}
