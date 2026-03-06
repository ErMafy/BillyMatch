import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET: Fetch decision history and stats
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode"); // "PLAYER" | "TEAM" | null (all)
  const limit = parseInt(searchParams.get("limit") || "50");

  const where = mode ? { mode: mode as "PLAYER" | "TEAM" } : {};

  // Get history
  const history = await prisma.decisionHistory.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  // Get stats (count per resultName & mode)
  const stats = await prisma.decisionHistory.groupBy({
    by: ["resultName", "resultId", "mode"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  // Separate player and team stats
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

  return NextResponse.json({
    history,
    playerStats,
    teamStats,
  });
}

// POST: Record a new decision
export async function POST(req: NextRequest) {
  try {
    const { mode, question, resultName, resultId } = await req.json();

    if (!mode || !question || !resultName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const decision = await prisma.decisionHistory.create({
      data: {
        mode,
        question,
        resultName,
        resultId: resultId || null,
      },
    });

    return NextResponse.json(decision);
  } catch (error) {
    console.error("Error creating decision:", error);
    return NextResponse.json(
      { error: "Failed to create decision" },
      { status: 500 }
    );
  }
}

// DELETE: Clear history (optional admin function)
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode");

  if (mode) {
    await prisma.decisionHistory.deleteMany({
      where: { mode: mode as "PLAYER" | "TEAM" },
    });
  } else {
    await prisma.decisionHistory.deleteMany();
  }

  return NextResponse.json({ success: true });
}
