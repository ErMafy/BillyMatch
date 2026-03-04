import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get("teamId");

  const players = await prisma.player.findMany({
    where: teamId ? { teamId } : {},
    include: { team: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(players);
}
