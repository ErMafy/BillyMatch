import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { getActiveSeason } from "@/lib/stats";

export const dynamic = "force-dynamic";

export async function GET() {
  const bets = await prisma.bet.findMany({
    include: {
      match: {
        include: {
          winnerTeam: true,
          loserTeam: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(bets);
}

export async function POST(req: NextRequest) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: "Non autorizzato" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { description, totalCost, payerMode, costWinner, costLoser, matchId } = body;

    if (!description || totalCost === undefined || !payerMode) {
      return NextResponse.json({ success: false, error: "Campi obbligatori mancanti" }, { status: 400 });
    }

    if (!["WINNER", "LOSER", "SPLIT", "MANUAL"].includes(payerMode)) {
      return NextResponse.json({ success: false, error: "PayerMode invalido" }, { status: 400 });
    }

    const season = await getActiveSeason();
    if (!season) {
      return NextResponse.json({ success: false, error: "Nessuna stagione attiva" }, { status: 400 });
    }

    // Calculate costs based on payerMode
    let finalCostWinner = costWinner || 0;
    let finalCostLoser = costLoser || 0;

    if (payerMode === "WINNER") {
      finalCostWinner = totalCost;
      finalCostLoser = 0;
    } else if (payerMode === "LOSER") {
      finalCostWinner = 0;
      finalCostLoser = totalCost;
    } else if (payerMode === "SPLIT") {
      finalCostWinner = totalCost / 2;
      finalCostLoser = totalCost / 2;
    }

    const bet = await prisma.bet.create({
      data: {
        seasonId: season.id,
        matchId: matchId || null,
        description,
        totalCost: parseFloat(totalCost),
        payerMode,
        costWinner: parseFloat(finalCostWinner),
        costLoser: parseFloat(finalCostLoser),
      },
      include: {
        match: {
          include: {
            winnerTeam: true,
            loserTeam: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, bet });
  } catch (error) {
    console.error("Errore creazione scommessa:", error);
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
    const { id, description, totalCost, payerMode, costWinner, costLoser, matchId } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID richiesto" }, { status: 400 });
    }

    if (!description || totalCost === undefined || !payerMode) {
      return NextResponse.json({ success: false, error: "Campi obbligatori mancanti" }, { status: 400 });
    }

    if (!["WINNER", "LOSER", "SPLIT", "MANUAL"].includes(payerMode)) {
      return NextResponse.json({ success: false, error: "PayerMode invalido" }, { status: 400 });
    }

    // Calculate costs based on payerMode
    let finalCostWinner = costWinner || 0;
    let finalCostLoser = costLoser || 0;

    if (payerMode === "WINNER") {
      finalCostWinner = totalCost;
      finalCostLoser = 0;
    } else if (payerMode === "LOSER") {
      finalCostWinner = 0;
      finalCostLoser = totalCost;
    } else if (payerMode === "SPLIT") {
      finalCostWinner = totalCost / 2;
      finalCostLoser = totalCost / 2;
    }

    const bet = await prisma.bet.update({
      where: { id },
      data: {
        description,
        totalCost: parseFloat(totalCost),
        payerMode,
        costWinner: parseFloat(finalCostWinner),
        costLoser: parseFloat(finalCostLoser),
        matchId: matchId && matchId !== "none" ? matchId : null,
      },
      include: {
        match: {
          include: {
            winnerTeam: true,
            loserTeam: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, bet });
  } catch (error) {
    console.error("Errore modifica scommessa:", error);
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

    await prisma.bet.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Errore eliminazione scommessa:", error);
    return NextResponse.json({ success: false, error: "Errore interno" }, { status: 500 });
  }
}
