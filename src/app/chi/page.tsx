import { prisma } from "@/lib/db";
import { ChiClient } from "./chi-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Chi? | Billy-Match",
  description: "Decide chi si sacrifica. Il ferro deciderà.",
};

export default async function ChiPage() {
  // Fetch teams with players from DB
  const teams = await prisma.team.findMany({
    include: {
      players: true,
      _count: {
        select: {
          matchesWon: true,
          matchesLost: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Fetch all players
  const players = await prisma.player.findMany({
    include: { team: true },
    orderBy: { name: "asc" },
  });

  // Fetch decision history and stats
  const history = await prisma.decisionHistory.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const stats = await prisma.decisionHistory.groupBy({
    by: ["resultName", "resultId", "mode"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  type GroupedStat = (typeof stats)[number];

  const playerStats = stats
    .filter((s: GroupedStat) => s.mode === "PLAYER")
    .map((s: GroupedStat) => ({
      name: s.resultName,
      id: s.resultId,
      count: s._count.id,
    }));

  const teamStats = stats
    .filter((s: GroupedStat) => s.mode === "TEAM")
    .map((s: GroupedStat) => ({
      name: s.resultName,
      id: s.resultId,
      count: s._count.id,
    }));

  return (
    <ChiClient
      teams={JSON.parse(JSON.stringify(teams))}
      players={JSON.parse(JSON.stringify(players))}
      initialHistory={JSON.parse(JSON.stringify(history))}
      initialPlayerStats={playerStats}
      initialTeamStats={teamStats}
    />
  );
}
