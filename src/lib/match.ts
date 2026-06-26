import type { Player, Quiz } from "./quizzes";

export function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Try to match a typed guess against any remaining player. Returns index or -1. */
export function matchGuess(
  guess: string,
  players: Player[],
  solved: boolean[],
): number {
  const g = normalize(guess);
  if (g.length < 2) return -1;
  for (let i = 0; i < players.length; i++) {
    if (solved[i]) continue;
    const p = players[i];
    const candidates = [p.name, ...(p.aliases ?? [])].map(normalize);
    // exact or "contains" against last name token
    for (const c of candidates) {
      if (c === g) return i;
      const tokens = c.split(" ");
      const last = tokens[tokens.length - 1];
      if (last && last === g) return i;
      if (c.includes(g) && g.length >= 4) return i;
    }
  }
  return -1;
}

export function emptySolved(quiz: Quiz): boolean[] {
  return quiz.players.map(() => false);
}
