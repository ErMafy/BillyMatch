import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[àáâãäå]/g, "a")
    .replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i")
    .replace(/[òóôõö]/g, "o")
    .replace(/[ùúûü]/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// GET all trips (public)
export async function GET() {
  const trips = await prisma.trip.findMany({
    include: {
      heroMedia: true,
      media: true,
    },
    orderBy: { startDate: "asc" },
  });
  return NextResponse.json(trips);
}

// POST create trip (admin)
export async function POST(req: NextRequest) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, location, startDate, endDate, status, description, quote, heroMedia: heroMediaData, galleryItems, slug: customSlug,
    // Legacy compat
    heroMediaPath: legacyHeroPath, galleryPaths: legacyGalleryPaths } = body;

  // Support both new format (objects with fit/focal) and legacy (plain paths)
  const heroMediaPath = heroMediaData?.path || legacyHeroPath;
  const heroFit = heroMediaData?.fit || "COVER";
  const heroFocalX = heroMediaData?.focalX ?? 50;
  const heroFocalY = heroMediaData?.focalY ?? 50;

  if (!title || !location || !startDate || !status || !description) {
    return NextResponse.json({ error: "Campi obbligatori mancanti" }, { status: 400 });
  }

  const slug = customSlug || slugify(title);

  // Check uniqueness
  const existing = await prisma.trip.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug già esistente" }, { status: 400 });
  }

  // Create trip
  const trip = await prisma.$transaction(async (tx) => {
    // Create hero media if provided
    let heroMediaId: string | null = null;
    if (heroMediaPath) {
      const kind = heroMediaPath.match(/\.(mp4|webm|mov)$/i) ? "VIDEO" : "IMAGE";
      const heroMedia = await tx.tripMedia.create({
        data: { kind: kind as "IMAGE" | "VIDEO", path: heroMediaPath, fit: heroFit, focalX: heroFocalX, focalY: heroFocalY },
      });
      heroMediaId = heroMedia.id;
    }

    const newTrip = await tx.trip.create({
      data: {
        title,
        slug,
        location,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status,
        description,
        quote: quote || null,
        heroMediaId,
      },
    });

    // Create gallery media
    const gallery = galleryItems || (legacyGalleryPaths || []).map((p: string) => ({ path: p }));
    if (gallery.length > 0) {
      for (const item of gallery) {
        const kind = item.path.match(/\.(mp4|webm|mov)$/i) ? "VIDEO" : "IMAGE";
        await tx.tripMedia.create({
          data: {
            tripId: newTrip.id,
            kind: kind as "IMAGE" | "VIDEO",
            path: item.path,
            fit: item.fit || "COVER",
            focalX: item.focalX ?? 50,
            focalY: item.focalY ?? 50,
          },
        });
      }
    }

    return tx.trip.findUnique({
      where: { id: newTrip.id },
      include: { heroMedia: true, media: true },
    });
  });

  return NextResponse.json(trip, { status: 201 });
}
