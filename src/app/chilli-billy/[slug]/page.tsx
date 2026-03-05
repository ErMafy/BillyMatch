import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { TripDetailClient } from "./trip-detail-client";

export const dynamic = "force-dynamic";

export default async function TripDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const trip = await prisma.trip.findUnique({
    where: { slug: params.slug },
    include: { heroMedia: true, media: true },
  });

  if (!trip) notFound();

  return <TripDetailClient trip={JSON.parse(JSON.stringify(trip))} />;
}
