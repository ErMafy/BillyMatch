import { TeamStats } from "./stats";

interface QuoteResult {
  teamName: string;
  quota: number;
  motivazione: string;
}

// Seeded random number generator (deterministico per giorno)
function seededRandom(seed: number): number {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getDaySeed(): number {
  const now = new Date();
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

const frasiCasuali = [
  "Il ferro è caldo, chi oserà?",
  "Oggi si gioca con il destino.",
  "Le probabilità sono scritte nel fumo del bar.",
  "Il bookmaker del quartiere ha parlato.",
  "Quota calcolata con metodo scientifico (lancio di dado).",
  "Il barista conferma: oggi si scommette grosso.",
  "Fonte: il cugino del cugino che sa tutto.",
  "Pronostico basato sulle fasi lunari.",
  "Il gatto del bar ha scelto.",
  "Algoritmo segreto: sensazione di pancia.",
];

export function calcolaQuote(stats: TeamStats[]): QuoteResult[] {
  if (stats.length < 2) return [];

  const [teamA, teamB] = stats;
  const totalMatches = teamA.totalMatches; // Stessi match tra 2 squadre
  const daySeed = getDaySeed();

  // Fase 1: poche partite (<5)
  if (totalMatches < 5) {
    const randA = seededRandom(daySeed + 1);
    const randB = seededRandom(daySeed + 2);
    const randFrase1 = seededRandom(daySeed + 3);
    const randFrase2 = seededRandom(daySeed + 4);

    // Quote casuali tra 1.60 e 2.40
    const quotaA = Math.round((1.60 + randA * 0.80) * 100) / 100;
    const quotaB = Math.round((1.60 + randB * 0.80) * 100) / 100;

    const frase1 = frasiCasuali[Math.floor(randFrase1 * frasiCasuali.length)];
    const frase2 = frasiCasuali[Math.floor(randFrase2 * frasiCasuali.length)];

    return [
      { teamName: teamA.teamName, quota: quotaA, motivazione: frase1 },
      { teamName: teamB.teamName, quota: quotaB, motivazione: frase2 },
    ];
  }

  // Fase 2: calcolo statistico con Laplace smoothing
  const winsA = teamA.matchWins;
  const winsB = teamB.matchWins;
  const matches = totalMatches; // totalMatches di A = totalMatches di B (giocano tra loro)

  // p = (wins + 2) / (matches + 4)
  let pA = (winsA + 2) / (matches + 4);

  // Clamp [0.15, 0.85]
  pA = Math.max(0.15, Math.min(0.85, pA));
  let pB = 1 - pA;
  pB = Math.max(0.15, Math.min(0.85, pB));

  // Ricalcola per coerenza
  const total = pA + pB;
  pA = pA / total;
  pB = pB / total;

  // quota = 1 / p * 1.06 (margine banco 6%)
  const quotaA = Math.round((1 / pA) * 1.06 * 100) / 100;
  const quotaB = Math.round((1 / pB) * 1.06 * 100) / 100;

  // Motivazioni basate su stats
  const motA = buildMotivazione(teamA);
  const motB = buildMotivazione(teamB);

  return [
    { teamName: teamA.teamName, quota: quotaA, motivazione: motA },
    { teamName: teamB.teamName, quota: quotaB, motivazione: motB },
  ];
}

function buildMotivazione(s: TeamStats): string {
  const parts: string[] = [];
  if (s.currentStreak > 0) parts.push(`streak ${s.currentStreak}`);
  if (s.winRate > 0) parts.push(`winrate ${s.winRate}%`);
  if (s.setWins > 0) parts.push(`${s.setWins} set vinti`);
  if (s.spent > 0) parts.push(`€${s.spent.toFixed(2)} spesi`);
  return parts.length > 0 ? parts.join(", ") : "Dati in raccolta...";
}
