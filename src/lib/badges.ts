import { TeamStats } from "./stats";
import { prisma } from "./db";

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export async function getBadgesForTeam(
  teamStats: TeamStats,
  allStats: TeamStats[],
  seasonId?: string
): Promise<Badge[]> {
  const badges: Badge[] = [];

  // Mano Calda: streak >= 3
  if (teamStats.currentStreak >= 3) {
    badges.push({
      id: "mano-calda",
      name: "🔥 Mano Calda",
      icon: "🔥",
      description: `Streak di ${teamStats.currentStreak} vittorie consecutive!`,
    });
  }

  // Pelo sul Ferro: ha vinto almeno un match 2-1 in SETS
  const matches = await prisma.match.findMany({
    where: {
      winnerTeamId: teamStats.teamId,
      mode: "SETS",
      winnerScore: 2,
      loserScore: 1,
      ...(seasonId ? { seasonId } : {}),
    },
  });
  if (matches.length > 0) {
    badges.push({
      id: "pelo-sul-ferro",
      name: "😰 Pelo sul Ferro",
      icon: "😰",
      description: `${matches.length} vittorie tirate al filo (2-1 in set)!`,
    });
  }

  // Recuperone: da 0-1 a 2-1 in SETS (team ha vinto ma loserScore=1 e mode=SETS)
  // Approssimiamo: vittorie 2-1 in SETS
  if (matches.length > 0) {
    badges.push({
      id: "recuperone",
      name: "💪 Recuperone",
      icon: "💪",
      description: "Rimonte epiche da 0-1 a 2-1!",
    });
  }

  // Spilorcio: spende meno di tutti
  const minSpender = allStats.reduce((min, s) => (s.spent < min.spent ? s : min), allStats[0]);
  if (minSpender.teamId === teamStats.teamId && teamStats.spent > 0) {
    badges.push({
      id: "spilorcio",
      name: "🤑 Spilorcio",
      icon: "🤑",
      description: "La squadra che spende meno. Tirchio è chi tirchio fa!",
    });
  }

  // Sponsor del Bar: spende di più
  const maxSpender = allStats.reduce((max, s) => (s.spent > max.spent ? s : max), allStats[0]);
  if (maxSpender.teamId === teamStats.teamId && teamStats.spent > 0) {
    badges.push({
      id: "sponsor-bar",
      name: "🍺 Sponsor del Bar",
      icon: "🍺",
      description: "La squadra che spende di più! Grazie per il contributo.",
    });
  }

  // Max streak badge
  if (teamStats.maxStreak >= 5) {
    badges.push({
      id: "inarrestabile",
      name: "⚡ Inarrestabile",
      icon: "⚡",
      description: `Record di ${teamStats.maxStreak} vittorie consecutive nella storia!`,
    });
  }

  return badges;
}
