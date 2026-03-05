import { prisma } from "@/lib/db";
import { ChilliBillyClient } from "./chilli-billy-client";

export const dynamic = "force-dynamic";

export default async function ChilliBillyPage() {
  const trips = await prisma.trip.findMany({
    include: { heroMedia: true, media: true },
    orderBy: { startDate: "asc" },
  });

  return <ChilliBillyClient trips={JSON.parse(JSON.stringify(trips))} />;
}
