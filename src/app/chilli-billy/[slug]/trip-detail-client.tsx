"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Calendar, Quote } from "lucide-react";
import { useState } from "react";

interface TripMedia {
  id: string;
  kind: "IMAGE" | "VIDEO";
  path: string;
  caption?: string | null;
  fit?: "COVER" | "CONTAIN";
  focalX?: number;
  focalY?: number;
}

interface Trip {
  id: string;
  title: string;
  slug: string;
  location: string;
  startDate: string;
  endDate?: string | null;
  status: "PAST" | "UPCOMING" | "IDEA";
  description: string;
  quote?: string | null;
  heroMedia?: TripMedia | null;
  media: TripMedia[];
}

const statusLabels: Record<string, { label: string; color: string }> = {
  PAST: { label: "Fatto", color: "bg-green-600/80" },
  UPCOMING: { label: "In Arrivo", color: "bg-amber-500/80" },
  IDEA: { label: "Idea", color: "bg-purple-500/80" },
};

const momentAwards = [
  "🏆 Miglior Cibo",
  "😂 Momento Più Cringe",
  "🍕 Pizza Award",
  "🎉 Party Legend",
  "📸 Foto Dell'Anno",
  "🗺️ Esploratore",
  "😴 Dormitore Seriale",
  "🎤 Karaoke King",
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function TripDetailClient({ trip }: { trip: Trip }) {
  const statusInfo = statusLabels[trip.status] || statusLabels.IDEA;
  const [lightboxMedia, setLightboxMedia] = useState<TripMedia | null>(null);

  // Hero display helpers
  const heroFit = trip.heroMedia?.fit === "CONTAIN" ? "contain" : "cover";
  const heroPos =
    trip.heroMedia?.fit !== "CONTAIN"
      ? `${trip.heroMedia?.focalX ?? 50}% ${trip.heroMedia?.focalY ?? 50}%`
      : undefined;

  return (
    <div className="space-y-8">
      {/* Back button */}
      <Link href="/chilli-billy">
        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
          <ArrowLeft size={16} /> Torna ai trip
        </Button>
      </Link>

      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden"
      >
        <div className="relative aspect-video max-h-[70vh] w-full">
          {trip.heroMedia ? (
            trip.heroMedia.kind === "IMAGE" ? (
              <Image
                src={trip.heroMedia.path}
                alt={trip.title}
                fill
                style={{ objectFit: heroFit as "cover" | "contain", objectPosition: heroPos }}
                sizes="100vw"
                priority
              />
            ) : (
              <video
                src={trip.heroMedia.path}
                controls
                playsInline
                className="w-full h-full"
                style={{ objectFit: heroFit as "cover" | "contain", objectPosition: heroPos }}
              />
            )
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-zinc-800 to-zinc-900 flex items-center justify-center min-h-[300px]">
              <span className="text-4xl">🌶️</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
            <Badge className={`${statusInfo.color} text-white border-0 mb-3`}>
              {statusInfo.label}
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg">
              {trip.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-white/80">
              <span className="flex items-center gap-1">
                <MapPin size={14} /> {trip.location}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {formatDate(trip.startDate)}
                {trip.endDate && ` — ${formatDate(trip.endDate)}`}
              </span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Description & Quote */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="max-w-3xl mx-auto space-y-6"
      >
        <p className="text-foreground leading-relaxed whitespace-pre-line">
          {trip.description}
        </p>
        {trip.quote && (
          <blockquote className="border-l-4 border-amber-500 pl-4 py-2 bg-amber-500/5 rounded-r-lg">
            <div className="flex gap-2 items-start">
              <Quote size={18} className="text-amber-500 flex-shrink-0 mt-1" />
              <p className="text-amber-200 italic font-medium">&ldquo;{trip.quote}&rdquo;</p>
            </div>
          </blockquote>
        )}
      </motion.section>

      {/* Gallery */}
      {trip.media.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold mb-4">📸 Gallery</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {trip.media.map((m, i) => {
              const mFit = m.fit === "CONTAIN" ? "contain" : "cover";
              const mPos = m.fit !== "CONTAIN" ? `${m.focalX ?? 50}% ${m.focalY ?? 50}%` : undefined;
              return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="relative aspect-video rounded-xl overflow-hidden border border-border hover:border-amber-500/50 transition-all cursor-pointer group"
                onClick={() => setLightboxMedia(m)}
              >
                {m.kind === "IMAGE" ? (
                  <Image
                    src={m.path}
                    alt={m.caption || trip.title}
                    fill
                    className="group-hover:scale-105 transition-transform duration-300"
                    style={{ objectFit: mFit as "cover" | "contain", objectPosition: mPos }}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <video
                    src={m.path}
                    muted
                    loop
                    playsInline
                    autoPlay
                    className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                    style={{ objectFit: mFit as "cover" | "contain", objectPosition: mPos }}
                  />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                {m.caption && (
                  <p className="absolute bottom-2 left-2 right-2 text-xs text-white bg-black/50 rounded px-2 py-1 truncate">
                    {m.caption}
                  </p>
                )}
              </motion.div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* Lightbox */}
      {lightboxMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxMedia(null)}
        >
          <div className="relative max-w-5xl w-full max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            {lightboxMedia.kind === "IMAGE" ? (
              <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
                <Image
                  src={lightboxMedia.path}
                  alt={lightboxMedia.caption || ""}
                  fill
                  className="rounded-lg"
                  style={{
                    objectFit: lightboxMedia.fit === "COVER" ? "cover" : "contain",
                    objectPosition:
                      lightboxMedia.fit !== "CONTAIN"
                        ? `${lightboxMedia.focalX ?? 50}% ${lightboxMedia.focalY ?? 50}%`
                        : undefined,
                  }}
                  sizes="100vw"
                />
              </div>
            ) : (
              <video
                src={lightboxMedia.path}
                controls
                autoPlay
                playsInline
                className="w-full max-h-[85vh] rounded-lg"
              />
            )}
            <button
              onClick={() => setLightboxMedia(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white text-sm"
            >
              ✕ Chiudi
            </button>
          </div>
        </div>
      )}

      {/* Moment Awards */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45 }}
      >
        <h2 className="text-2xl font-bold mb-4">🏅 Moment Awards</h2>
        <div className="flex flex-wrap gap-2">
          {momentAwards.map((award) => (
            <Badge
              key={award}
              variant="outline"
              className="py-1.5 px-3 text-sm border-amber-500/30 text-amber-200 bg-amber-500/5"
            >
              {award}
            </Badge>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
