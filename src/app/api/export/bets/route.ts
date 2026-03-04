import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const bets = await prisma.bet.findMany({
    include: {
      match: {
        include: { winnerTeam: true, loserTeam: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const header = "Data,Descrizione,CostoTotale,ChiPaga,CostoVincitore,CostoPerdente,Match\n";
  const rows = bets.map((b) => {
    const date = new Date(b.createdAt).toISOString();
    const desc = b.description.replace(/"/g, '""');
    const matchInfo = b.match
      ? `${b.match.winnerTeam.name} vs ${b.match.loserTeam.name}`
      : "N/A";
    return `"${date}","${desc}",${b.totalCost},"${b.payerMode}",${b.costWinner},${b.costLoser},"${matchInfo}"`;
  });

  const csv = header + rows.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="billy-match-scommesse.csv"',
    },
  });
}
