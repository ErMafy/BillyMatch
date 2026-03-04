import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: "Non autorizzato" }, { status: 401 });
  }

  try {
    const { playerId, photoUrl, photoTitle, photoDescription } = await req.json();

    if (!playerId) {
      return NextResponse.json({ success: false, error: "playerId richiesto" }, { status: 400 });
    }

    await prisma.player.update({
      where: { id: playerId },
      data: {
        photoUrl: photoUrl || null,
        photoTitle: photoTitle || null,
        photoDescription: photoDescription || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Errore aggiornamento foto giocatore:", error);
    return NextResponse.json({ success: false, error: "Errore interno" }, { status: 500 });
  }
}
