import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { getActiveSeason } from "@/lib/stats";
import { generateChecksum } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const matches = await prisma.match.findMany({
    include: {
      winnerTeam: true,
      loserTeam: true,
    },
    orderBy: { playedAt: "desc" },
  });
  return NextResponse.json(matches);
}

export async function POST(req: NextRequest) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: "Non autorizzato" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { winnerTeamId, loserTeamId, mode, winnerScore, loserScore, notes, playedAt } = body;

    if (!winnerTeamId || !loserTeamId || !mode || winnerScore === undefined || loserScore === undefined) {
      return NextResponse.json({ success: false, error: "Campi obbligatori mancanti" }, { status: 400 });
    }

    if (winnerTeamId === loserTeamId) {
      return NextResponse.json({ success: false, error: "Non puoi giocare contro te stesso!" }, { status: 400 });
    }

    if (!["SETS", "GOALS"].includes(mode)) {
      return NextResponse.json({ success: false, error: "Modo invalido" }, { status: 400 });
    }

    const season = await getActiveSeason();
    if (!season) {
      return NextResponse.json({ success: false, error: "Nessuna stagione attiva" }, { status: 400 });
    }

    const matchDate = playedAt ? new Date(playedAt) : new Date();
    const checksum = generateChecksum(matchDate, winnerTeamId, winnerScore, loserScore, mode);

    // Check duplicato
    const existing = await prisma.match.findUnique({ where: { checksum } });
    if (existing) {
      return NextResponse.json({
        success: false,
        error: "Match duplicato! Stesso risultato e orario già registrato.",
      }, { status: 409 });
    }

    const match = await prisma.match.create({
      data: {
        seasonId: season.id,
        playedAt: matchDate,
        winnerTeamId,
        loserTeamId,
        mode,
        winnerScore: parseInt(winnerScore),
        loserScore: parseInt(loserScore),
        notes: notes || null,
        checksum,
      },
      include: {
        winnerTeam: true,
        loserTeam: true,
      },
    });

    return NextResponse.json({ success: true, match });
  } catch (error) {
    console.error("Errore creazione match:", error);
    return NextResponse.json({ success: false, error: "Errore interno" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: "Non autorizzato" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, winnerTeamId, loserTeamId, mode, winnerScore, loserScore, notes, playedAt } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID richiesto" }, { status: 400 });
    }

    if (!winnerTeamId || !loserTeamId || !mode || winnerScore === undefined || loserScore === undefined) {
      return NextResponse.json({ success: false, error: "Campi obbligatori mancanti" }, { status: 400 });
    }

    if (winnerTeamId === loserTeamId) {
      return NextResponse.json({ success: false, error: "Non puoi giocare contro te stesso!" }, { status: 400 });
    }

    if (!["SETS", "GOALS"].includes(mode)) {
      return NextResponse.json({ success: false, error: "Modo invalido" }, { status: 400 });
    }

    const matchDate = playedAt ? new Date(playedAt) : undefined;
    const checksum = generateChecksum(
      matchDate || new Date(),
      winnerTeamId,
      parseInt(winnerScore),
      parseInt(loserScore),
      mode
    );

    const match = await prisma.match.update({
      where: { id },
      data: {
        winnerTeamId,
        loserTeamId,
        mode,
        winnerScore: parseInt(winnerScore),
        loserScore: parseInt(loserScore),
        notes: notes || null,
        ...(matchDate && { playedAt: matchDate }),
        checksum,
      },
      include: {
        winnerTeam: true,
        loserTeam: true,
      },
    });

    return NextResponse.json({ success: true, match });
  } catch (error) {
    console.error("Errore modifica match:", error);
    return NextResponse.json({ success: false, error: "Errore interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: "Non autorizzato" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "ID richiesto" }, { status: 400 });
    }

    await prisma.match.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Errore eliminazione match:", error);
    return NextResponse.json({ success: false, error: "Errore interno" }, { status: 500 });
  }
}
