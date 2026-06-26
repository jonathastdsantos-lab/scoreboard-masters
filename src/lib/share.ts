import type { Quiz } from "./quizzes";

/** Base64-url encode UTF-8 JSON. */
export function encodeQuiz(quiz: Quiz): string {
  const json = JSON.stringify(quiz);
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function decodeQuiz(token: string): Quiz | null {
  try {
    const b64 = token.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const bin = atob(padded);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as Quiz;
    if (!parsed.players || !Array.isArray(parsed.players)) return null;
    return parsed;
  } catch {
    return null;
  }
}
