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

// GET single trip by id
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const trip = await prisma.trip.findUnique({
    where: { id: params.id },
    include: { heroMedia: true, media: true },
  });
  if (!trip) {
    return NextResponse.json({ error: "Trip non trovato" }, { status: 404 });
  }
  return NextResponse.json(trip);
}

// PUT update trip
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, location, startDate, endDate, status, description, quote, heroMedia: heroMediaData, galleryItems, slug: customSlug,
    heroMediaPath: legacyHeroPath, galleryPaths: legacyGalleryPaths } = body;

  const heroMediaPath = heroMediaData?.path ?? legacyHeroPath;
  const heroFit = heroMediaData?.fit || "COVER";
  const heroFocalX = heroMediaData?.focalX ?? 50;
  const heroFocalY = heroMediaData?.focalY ?? 50;

  const existing = await prisma.trip.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Trip non trovato" }, { status: 404 });
  }

  const slug = customSlug || slugify(title || existing.title);

  // Check slug uniqueness (excluding current trip)
  if (slug !== existing.slug) {
    const slugTaken = await prisma.trip.findUnique({ where: { slug } });
    if (slugTaken) {
      return NextResponse.json({ error: "Slug già esistente" }, { status: 400 });
    }
  }

  const trip = await prisma.$transaction(async (tx) => {
    // Handle hero media
    let heroMediaId = existing.heroMediaId;
    if (heroMediaPath !== undefined) {
      // Remove old hero media if it exists and is different
      if (existing.heroMediaId) {
        const oldHero = await tx.tripMedia.findUnique({ where: { id: existing.heroMediaId } });
        if (oldHero && oldHero.path !== heroMediaPath) {
          await tx.trip.update({ where: { id: params.id }, data: { heroMediaId: null } });
          await tx.tripMedia.delete({ where: { id: existing.heroMediaId } });
        }
      }

      if (heroMediaPath) {
        const kind = heroMediaPath.match(/\.(mp4|webm|mov)$/i) ? "VIDEO" : "IMAGE";
        const newHero = await tx.tripMedia.create({
          data: { kind: kind as "IMAGE" | "VIDEO", path: heroMediaPath, fit: heroFit, focalX: heroFocalX, focalY: heroFocalY },
        });
        heroMediaId = newHero.id;
      } else {
        heroMediaId = null;
      }
    }

    // Handle gallery
    const gallery = galleryItems || (legacyGalleryPaths ? legacyGalleryPaths.map((p: string) => ({ path: p })) : undefined);
    if (gallery !== undefined) {
      // Delete old gallery media
      await tx.tripMedia.deleteMany({ where: { tripId: params.id } });
      // Create new gallery media
      for (const item of gallery) {
        const kind = item.path.match(/\.(mp4|webm|mov)$/i) ? "VIDEO" : "IMAGE";
        await tx.tripMedia.create({
          data: {
            tripId: params.id,
            kind: kind as "IMAGE" | "VIDEO",
            path: item.path,
            fit: item.fit || "COVER",
            focalX: item.focalX ?? 50,
            focalY: item.focalY ?? 50,
          },
        });
      }
    }

    return tx.trip.update({
      where: { id: params.id },
      data: {
        title: title || existing.title,
        slug,
        location: location || existing.location,
        startDate: startDate ? new Date(startDate) : existing.startDate,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : existing.endDate,
        status: status || existing.status,
        description: description || existing.description,
        quote: quote !== undefined ? (quote || null) : existing.quote,
        heroMediaId,
      },
      include: { heroMedia: true, media: true },
    });
  });

  return NextResponse.json(trip);
}

// DELETE trip
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.trip.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Trip non trovato" }, { status: 404 });
  }

  // Clear hero relation first, then delete media, then trip
  await prisma.$transaction(async (tx) => {
    if (existing.heroMediaId) {
      await tx.trip.update({ where: { id: params.id }, data: { heroMediaId: null } });
      await tx.tripMedia.delete({ where: { id: existing.heroMediaId } });
    }
    await tx.tripMedia.deleteMany({ where: { tripId: params.id } });
    await tx.trip.delete({ where: { id: params.id } });
  });

  return NextResponse.json({ success: true });
}
