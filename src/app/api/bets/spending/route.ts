import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActiveSeason } from "@/lib/stats";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const season = await getActiveSeason();
    const teams = await prisma.team.findMany();
    const bets = await prisma.bet.findMany({
      where: season ? { seasonId: season.id } : {},
      include: {
        match: true,
      },
    });

    const spending = teams.map((team) => {
      let totalSpent = 0;
      let totalEarned = 0;

      bets.forEach((bet) => {
        if (!bet.match) {
          // No match associated, split evenly
          totalSpent += bet.totalCost / 2;
          totalEarned += bet.totalCost / 2;
          return;
        }

        const isWinner = bet.match.winnerTeamId === team.id;
        const isLoser = bet.match.loserTeamId === team.id;
        if (!isWinner && !isLoser) return;

        switch (bet.payerMode) {
          case "WINNER":
            if (isWinner) totalSpent += bet.totalCost;
            if (isLoser) totalEarned += bet.totalCost;
            break;
          case "LOSER":
            if (isLoser) totalSpent += bet.totalCost;
            if (isWinner) totalEarned += bet.totalCost;
            break;
          case "SPLIT":
            totalSpent += bet.totalCost / 2;
            totalEarned += bet.totalCost / 2;
            break;
          case "MANUAL":
            if (isWinner) {
              totalSpent += bet.costWinner;
              totalEarned += bet.costLoser;
            }
            if (isLoser) {
              totalSpent += bet.costLoser;
              totalEarned += bet.costWinner;
            }
            break;
        }
      });

      return {
        teamId: team.id,
        teamName: team.name,
        totalSpent: Math.round(totalSpent * 100) / 100,
        totalEarned: Math.round(totalEarned * 100) / 100,
        netBalance: Math.round((totalEarned - totalSpent) * 100) / 100,
      };
    });

    return NextResponse.json(spending);
  } catch (error) {
    console.error("Errore calcolo spese:", error);
    return NextResponse.json([]);
  }
}
