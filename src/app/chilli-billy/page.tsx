import { prisma } from "@/lib/db";
import { ChilliBillyClient } from "./chilli-billy-client";

export const dynamic = "force-dynamic";

/* ── Haversine distance (km) ─────────────────────────────────────── */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const NOVARA = [45.4453, 8.6227] as const; // home base

export default async function ChilliBillyPage() {
  const trips = await prisma.trip.findMany({
    include: { heroMedia: true, media: true, locations: { orderBy: { sequence: "asc" } } },
    orderBy: { startDate: "asc" },
  });

  /* ── Saga Stats ──────────────────────────────────────────────────── */
  const countries = new Set<string>();
  let totalKm = 0;

  for (const trip of trips) {
    // Extract country from "City, Country" format or whole string
    const parts = trip.location.split(",");
    const country = parts[parts.length - 1].trim().toLowerCase();
    if (country) countries.add(country);

    // Km: Novara → loc[0] → … → loc[n] → Novara
    const locs = [...trip.locations].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
    if (locs.length > 0) {
      totalKm += haversineKm(NOVARA[0], NOVARA[1], locs[0].lat, locs[0].lng);
      for (let i = 0; i < locs.length - 1; i++) {
        totalKm += haversineKm(locs[i].lat, locs[i].lng, locs[i + 1].lat, locs[i + 1].lng);
      }
      totalKm += haversineKm(locs[locs.length - 1].lat, locs[locs.length - 1].lng, NOVARA[0], NOVARA[1]);
    }
  }

  const sagaStats = {
    tripCount: trips.length,
    countriesCount: countries.size,
    kmTotal: Math.round(totalKm),
  };

  return (
    <ChilliBillyClient
      trips={JSON.parse(JSON.stringify(trips))}
      sagaStats={sagaStats}
    />
  );
}
