import { prisma } from "./db";

export interface TeamStats {
  teamId: string;
  teamName: string;
  teamSlug: string;
  photoUrl: string | null;
  matchWins: number;
  matchLosses: number;
  totalMatches: number;
  setWins: number;
  setLosses: number;
  betWins: number;
  spent: number;
  currentStreak: number;
  maxStreak: number;
  winRate: number;
}

export async function getTeamStats(seasonId?: string): Promise<TeamStats[]> {
  const teams = await prisma.team.findMany({
    include: { players: true },
  });

  const seasonFilter = seasonId ? { seasonId } : {};

  const matches = await prisma.match.findMany({
    where: seasonFilter,
    orderBy: { playedAt: "asc" },
  });

  const bets = await prisma.bet.findMany({
    where: seasonFilter,
    include: { match: true },
  });

  return teams.map((team) => {
    const wins = matches.filter((m) => m.winnerTeamId === team.id);
    const losses = matches.filter((m) => m.loserTeamId === team.id);
    const totalMatches = wins.length + losses.length;

    // Set wins: somma winnerScore quando mode=SETS e questo team ha vinto
    const setWins = wins
      .filter((m) => m.mode === "SETS")
      .reduce((sum: number, m) => sum + m.winnerScore, 0);
    const setLosses = losses
      .filter((m) => m.mode === "SETS")
      .reduce((sum: number, m) => sum + m.loserScore, 0);

    // Bet wins: quante scommesse questo team ha "vinto" (pagata dal perdente)
    const betWins = bets.filter((b) => {
      if (!b.match) return false;
      if (b.payerMode === "LOSER" && b.match.winnerTeamId === team.id) return true;
      if (b.payerMode === "WINNER" && b.match.loserTeamId === team.id) return true;
      return false;
    }).length;

    // Spent: quanto ha speso
    let spent = 0;
    bets.forEach((b) => {
      if (!b.match) {
        // Scommessa senza match: split equo
        spent += b.totalCost / 2;
        return;
      }
      const isWinner = b.match.winnerTeamId === team.id;
      const isLoser = b.match.loserTeamId === team.id;
      if (!isWinner && !isLoser) return;

      switch (b.payerMode) {
        case "WINNER":
          if (isWinner) spent += b.totalCost;
          break;
        case "LOSER":
          if (isLoser) spent += b.totalCost;
          break;
        case "SPLIT":
          spent += b.totalCost / 2;
          break;
        case "MANUAL":
          if (isWinner) spent += b.costWinner;
          if (isLoser) spent += b.costLoser;
          break;
      }
    });

    // Streak calculation
    const teamMatches = matches.filter(
      (m) => m.winnerTeamId === team.id || m.loserTeamId === team.id
    );
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;

    for (const m of teamMatches) {
      if (m.winnerTeamId === team.id) {
        tempStreak++;
        maxStreak = Math.max(maxStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    // Current streak = streak dal fondo
    currentStreak = 0;
    for (let i = teamMatches.length - 1; i >= 0; i--) {
      if (teamMatches[i].winnerTeamId === team.id) {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      teamId: team.id,
      teamName: team.name,
      teamSlug: team.slug,
      photoUrl: team.photoUrl,
      matchWins: wins.length,
      matchLosses: losses.length,
      totalMatches,
      setWins,
      setLosses,
      betWins,
      spent: Math.round(spent * 100) / 100,
      currentStreak,
      maxStreak,
      winRate: totalMatches > 0 ? Math.round((wins.length / totalMatches) * 100) : 0,
    };
  });
}

export async function getActiveSeason() {
  return prisma.season.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRecentMatches(limit = 10, seasonId?: string) {
  return prisma.match.findMany({
    where: seasonId ? { seasonId } : {},
    include: {
      winnerTeam: true,
      loserTeam: true,
    },
    orderBy: { playedAt: "desc" },
    take: limit,
  });
}

export async function getHallOfShame(seasonId?: string) {
  const matches = await prisma.match.findMany({
    where: seasonId ? { seasonId } : {},
    include: {
      winnerTeam: true,
      loserTeam: true,
    },
    orderBy: { playedAt: "desc" },
  });

  // Top 5 sconfitte più nette: differenza score più alta
  return matches
    .map((m) => ({
      ...m,
      diff: m.winnerScore - m.loserScore,
    }))
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 5);
}
