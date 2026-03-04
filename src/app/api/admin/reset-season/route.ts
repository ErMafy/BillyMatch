import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

export async function POST() {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: "Non autorizzato" }, { status: 401 });
  }

  try {
    // Disattiva tutte le stagioni attive
    await prisma.season.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Conta stagioni per il nome
    const count = await prisma.season.count();

    // Crea nuova stagione
    const newSeason = await prisma.season.create({
      data: {
        name: `Stagione ${count + 1} - La Rivincita`,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      seasonName: newSeason.name,
      seasonId: newSeason.id,
    });
  } catch (error) {
    console.error("Errore reset stagione:", error);
    return NextResponse.json({ success: false, error: "Errore interno" }, { status: 500 });
  }
}
