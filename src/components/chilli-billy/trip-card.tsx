"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar } from "lucide-react";

interface TripCardProps {
  trip: {
    id: string;
    title: string;
    slug: string;
    location: string;
    startDate: string;
    endDate?: string | null;
    status: "PAST" | "UPCOMING" | "IDEA";
    description: string;
    heroMedia?: {
      kind: "IMAGE" | "VIDEO";
      path: string;
      fit?: "COVER" | "CONTAIN";
      focalX?: number;
      focalY?: number;
    } | null;
  };
  index: number;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  PAST: { label: "Fatto", color: "bg-green-600/80" },
  UPCOMING: { label: "In Arrivo", color: "bg-amber-500/80" },
  IDEA: { label: "Idea", color: "bg-purple-500/80" },
};

function formatTripDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function TripCard({ trip, index }: TripCardProps) {
  const statusInfo = statusLabels[trip.status] || statusLabels.IDEA;
  const isLeft = index % 2 === 0;

  const heroFit = trip.heroMedia?.fit === "CONTAIN" ? "contain" : "cover";
  const heroPos =
    trip.heroMedia?.fit !== "CONTAIN"
      ? `${trip.heroMedia?.focalX ?? 50}% ${trip.heroMedia?.focalY ?? 50}%`
      : undefined;

  return (
    <div className={`flex items-start gap-4 ${isLeft ? "md:flex-row" : "md:flex-row-reverse"}`}>
      {/* Timeline dot */}
      <div className="hidden md:flex flex-col items-center flex-shrink-0">
        <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-background shadow-lg shadow-amber-500/30" />
        <div className="w-0.5 flex-1 bg-border" />
      </div>

      {/* Card */}
      <Link
        href={`/chilli-billy/${trip.slug}`}
        className="group flex-1 block"
      >
        <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-amber-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10">
          {/* Hero media */}
          <div className="relative aspect-video overflow-hidden">
            {trip.heroMedia ? (
              trip.heroMedia.kind === "IMAGE" ? (
                <Image
                  src={trip.heroMedia.path}
                  alt={trip.title}
                  fill
                  className="group-hover:scale-105 transition-transform duration-500"
                  style={{ objectFit: heroFit as "cover" | "contain", objectPosition: heroPos }}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <video
                  src={trip.heroMedia.path}
                  muted
                  loop
                  playsInline
                  autoPlay
                  className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                  style={{ objectFit: heroFit as "cover" | "contain", objectPosition: heroPos }}
                />
              )
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="text-muted-foreground text-sm">No media</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <Badge className={`absolute top-3 right-3 ${statusInfo.color} text-white border-0 text-xs`}>
              {statusInfo.label}
            </Badge>
          </div>

          {/* Content */}
          <div className="p-4 space-y-2">
            <h3 className="text-lg font-bold text-foreground group-hover:text-amber-400 transition-colors">
              {trip.title}
            </h3>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {trip.location}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {formatTripDate(trip.startDate)}
                {trip.endDate && ` — ${formatTripDate(trip.endDate)}`}
              </span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {trip.description}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}
