"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { TripCard } from "@/components/chilli-billy/trip-card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const TravelMap = dynamic(
  () => import("@/components/chilli-billy/travel-map"),
  { ssr: false, loading: () => <div className="w-full h-[300px] sm:h-[400px] lg:h-[500px] rounded-xl bg-card border border-border animate-pulse" /> }
);

interface TripLocationData {
  lat: number;
  lng: number;
  label: string | null;
  category: string | null;
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
  heroMedia?: { kind: "IMAGE" | "VIDEO"; path: string } | null;
  locations?: TripLocationData[];
}

const tabs = [
  { key: "ALL", label: "Tutti" },
  { key: "PAST", label: "Fatti" },
  { key: "UPCOMING", label: "In Arrivo" },
  { key: "IDEA", label: "Idee" },
] as const;

export function ChilliBillyClient({ trips }: { trips: Trip[] }) {
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = trips;
    if (activeTab !== "ALL") {
      result = result.filter((t) => t.status === activeTab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.location.toLowerCase().includes(q)
      );
    }
    return result.sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  }, [trips, activeTab, search]);

  // Collect all trip locations for the map
  const mapPins = useMemo(() => {
    const pins: { lat: number; lng: number; label: string | null; category: string | null; tripTitle: string; tripSlug: string }[] = [];
    for (const trip of trips) {
      if (trip.locations) {
        for (const loc of trip.locations) {
          pins.push({ lat: loc.lat, lng: loc.lng, label: loc.label, category: loc.category, tripTitle: trip.title, tripSlug: trip.slug });
        }
      }
    }
    return pins;
  }, [trips]);

  return (
    <div className="space-y-8">
      {/* ── HERO with Background Media ── */}
      <section className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden">
        {/* Background media */}
        <div className="absolute inset-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            poster="/chilli-billy/hero/hero.jpg"
          >
            <source src="/chilli-billy/hero/hero.mp4" type="video/mp4" />
          </video>
          {/* Fallback image via poster + noscript */}
          <img
            src="/chilli-billy/hero/hero.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover hidden"
            aria-hidden="true"
          />
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-background" />
        </div>

        <div className="relative flex flex-col items-center justify-center h-[320px] sm:h-[420px] md:h-[520px] text-center px-4">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] mb-3"
          >
            🌶️ EL CHILLI BILLY
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg sm:text-xl md:text-2xl text-amber-400 font-bold drop-shadow-lg mb-2"
          >
            I NOSTRI VIAGGI
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="text-sm text-amber-200/70 font-mono"
          >
            Dal primo viaggio all&apos;ultimo delirio
          </motion.p>
        </div>
      </section>

      {/* ── Intro Text ── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="text-center max-w-2xl mx-auto"
      >
        <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
          Da Napoli a Marrakech, da Amsterdam a Bodrum — ogni viaggio una storia leggendaria.
          Esplora la mappa per scoprire tutte le tappe della crew. 🌍
        </p>
      </motion.section>

      {/* ── Travel Map ── */}
      {mapPins.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-center mb-4">🗺️ Mappa dei Viaggi</h2>
          <TravelMap pins={mapPins} />
        </section>
      )}

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="flex gap-1 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-amber-500 text-black"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cerca trip..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* ── Timeline ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">Nessun viaggio trovato 🌵</p>
          <p className="text-muted-foreground text-sm mt-1">
            {trips.length === 0
              ? "Aggiungi il primo trip dall'admin!"
              : "Prova a cambiare filtro o ricerca."}
          </p>
        </div>
      ) : (
        <div className="relative">
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2" />

          <div className="space-y-6 md:space-y-0">
            {filtered.map((trip, i) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="md:grid md:grid-cols-2 md:gap-8 md:py-4"
              >
                {i % 2 === 0 ? (
                  <>
                    <div className="md:pr-8">
                      <TripCard trip={trip} index={i} />
                    </div>
                    <div className="hidden md:flex items-center">
                      <div className="text-xs text-muted-foreground font-mono">
                        {new Date(trip.startDate).toLocaleDateString("it-IT", {
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="hidden md:flex items-center justify-end">
                      <div className="text-xs text-muted-foreground font-mono">
                        {new Date(trip.startDate).toLocaleDateString("it-IT", {
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                    <div className="md:pl-8">
                      <TripCard trip={trip} index={i} />
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
