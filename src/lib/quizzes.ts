export type Position = "GOL" | "ZAG" | "LAT" | "VOL" | "MEI" | "ATA" | "TEC";

export type Player = {
  name: string;
  position: Position;
  /** Optional accepted aliases (lowercase, no accents) */
  aliases?: string[];
};

export type Quiz = {
  id: string;
  /** Short headline like "7-1" or "38-0" */
  badge: string;
  title: string;
  subtitle: string;
  context: string;
  date: string;
  competition: string;
  homeTeam: string;
  awayTeam?: string;
  score?: string;
  /** Optional: team color hexes used as gradient hints */
  accent?: string;
  players: Player[];
};

export const PRESET_QUIZZES: Quiz[] = [
  {
    id: "brasil-1x7-alemanha",
    badge: "1 × 7",
    title: "Brasil 1 × 7 Alemanha",
    subtitle: "Semifinal — Copa do Mundo 2014",
    context:
      "O Mineirazo. Acerte os 11 titulares escalados por Felipão na noite mais traumática da seleção.",
    date: "08 jul 2014",
    competition: "Copa do Mundo",
    homeTeam: "Brasil",
    awayTeam: "Alemanha",
    score: "1 — 7",
    accent: "from-yellow-400 to-green-700",
    players: [
      { name: "Júlio César", position: "GOL", aliases: ["julio cesar"] },
      { name: "Maicon", position: "LAT" },
      { name: "Dante", position: "ZAG" },
      { name: "David Luiz", position: "ZAG" },
      { name: "Marcelo", position: "LAT" },
      { name: "Luiz Gustavo", position: "VOL" },
      { name: "Fernandinho", position: "VOL" },
      { name: "Hulk", position: "ATA" },
      { name: "Oscar", position: "MEI" },
      { name: "Bernard", position: "MEI" },
      { name: "Fred", position: "ATA" },
    ],
  },
  {
    id: "palmeiras-2022-libertadores-final",
    badge: "INVICTO",
    title: "Palmeiras — Final Brasileirão 2022",
    subtitle: "Campeão com 81 pontos",
    context:
      "O time do Abel que dominou o Brasileiro de 2022. Acerte os 11 mais usados na campanha do título.",
    date: "2022",
    competition: "Brasileirão Série A",
    homeTeam: "Palmeiras",
    score: "Campeão",
    players: [
      { name: "Weverton", position: "GOL" },
      { name: "Marcos Rocha", position: "LAT" },
      { name: "Gustavo Gómez", position: "ZAG", aliases: ["gustavo gomez", "gomez"] },
      { name: "Murilo", position: "ZAG" },
      { name: "Piquerez", position: "LAT" },
      { name: "Zé Rafael", position: "VOL", aliases: ["ze rafael"] },
      { name: "Danilo", position: "VOL" },
      { name: "Raphael Veiga", position: "MEI", aliases: ["veiga"] },
      { name: "Dudu", position: "ATA" },
      { name: "Rony", position: "ATA" },
      { name: "Gustavo Scarpa", position: "MEI", aliases: ["scarpa"] },
    ],
  },
  {
    id: "barcelona-6x1-psg",
    badge: "6 × 1",
    title: "Barcelona 6 × 1 PSG",
    subtitle: "Oitavas — Champions League 2016/17",
    context: "A Remontada. Acerte os 11 titulares do Barça na noite histórica do Camp Nou.",
    date: "08 mar 2017",
    competition: "UEFA Champions League",
    homeTeam: "Barcelona",
    awayTeam: "PSG",
    score: "6 — 1",
    players: [
      { name: "Ter Stegen", position: "GOL" },
      { name: "Sergi Roberto", position: "LAT" },
      { name: "Piqué", position: "ZAG", aliases: ["pique"] },
      { name: "Mascherano", position: "ZAG" },
      { name: "Jordi Alba", position: "LAT" },
      { name: "Busquets", position: "VOL" },
      { name: "Rakitić", position: "MEI", aliases: ["rakitic"] },
      { name: "Iniesta", position: "MEI" },
      { name: "Messi", position: "ATA" },
      { name: "Neymar", position: "ATA" },
      { name: "Luis Suárez", position: "ATA", aliases: ["suarez", "luis suarez"] },
    ],
  },
  {
    id: "corinthians-mundial-2012",
    badge: "🏆",
    title: "Corinthians — Final Mundial 2012",
    subtitle: "1 × 0 Chelsea — Yokohama",
    context: "Acerte os 11 do Tite que bateram o Chelsea de Drogba e foram campeões do mundo.",
    date: "16 dez 2012",
    competition: "Mundial de Clubes FIFA",
    homeTeam: "Corinthians",
    awayTeam: "Chelsea",
    score: "1 — 0",
    players: [
      { name: "Cássio", position: "GOL", aliases: ["cassio"] },
      { name: "Alessandro", position: "LAT" },
      { name: "Chicão", position: "ZAG", aliases: ["chicao"] },
      { name: "Paulo André", position: "ZAG", aliases: ["paulo andre"] },
      { name: "Fábio Santos", position: "LAT", aliases: ["fabio santos"] },
      { name: "Ralf", position: "VOL" },
      { name: "Paulinho", position: "VOL" },
      { name: "Jorge Henrique", position: "MEI" },
      { name: "Danilo", position: "MEI" },
      { name: "Emerson Sheik", position: "ATA", aliases: ["emerson", "sheik"] },
      { name: "Guerrero", position: "ATA", aliases: ["paolo guerrero"] },
    ],
  },
];

export function findQuiz(id: string): Quiz | undefined {
  return PRESET_QUIZZES.find((q) => q.id === id);
}
