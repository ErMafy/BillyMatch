import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const matches = await prisma.match.findMany({
    include: { winnerTeam: true, loserTeam: true },
    orderBy: { playedAt: "desc" },
  });

  const header = "Data,Vincitore,Perdente,PunteggioVincitore,PunteggioPerdente,Modalità,Note\n";
  const rows = matches.map((m) => {
    const date = new Date(m.playedAt).toISOString();
    const notes = (m.notes || "").replace(/"/g, '""');
    return `"${date}","${m.winnerTeam.name}","${m.loserTeam.name}",${m.winnerScore},${m.loserScore},"${m.mode}","${notes}"`;
  });

  const csv = header + rows.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="billy-match-matches.csv"',
    },
  });
}
