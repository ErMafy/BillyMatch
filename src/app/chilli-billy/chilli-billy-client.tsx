"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import { TripCard } from "@/components/chilli-billy/trip-card";
import { HighlightReel } from "@/components/chilli-billy/highlight-reel";
import { SagaCounters, type SagaStats } from "@/components/chilli-billy/saga-counters";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const TravelMap = dynamic(
  () => import("@/components/chilli-billy/travel-map"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[320px] sm:h-[420px] lg:h-[560px] rounded-xl bg-card border border-border animate-pulse" />
    ),
  }
);

const GlobeView = dynamic(
  () => import("@/components/chilli-billy/globe-view"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <span className="text-white/40 text-sm animate-pulse">Caricamento globo...</span>
      </div>
    ),
  }
);

interface TripLocationData {
  lat: number;
  lng: number;
  label: string | null;
  category: string | null;
  sequence?: number;
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

export function ChilliBillyClient({
  trips,
  sagaStats,
}: {
  trips: Trip[];
  sagaStats: SagaStats;
}) {
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [focusedTripId, setFocusedTripId] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [globeMode, setGlobeMode] = useState(false);

  // Refs for IntersectionObserver
  const tripRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const sentinelRef = useRef<HTMLDivElement | null>(null);

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

  // Trips with locations for the cinematic map
  const mapTrips = useMemo(
    () =>
      trips
        .filter((t) => t.locations && t.locations.length > 0)
        .map((t) => ({ ...t, locations: t.locations || [] })),
    [trips]
  );

  /* ── IntersectionObserver: sync map with scrolled trip ─────────── */
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-trip-id");
            if (id) setFocusedTripId(id);
          }
        }
      },
      { threshold: 0.35, rootMargin: "0px 0px -25% 0px" }
    );

    for (const trip of filtered) {
      const el = tripRefs.current.get(trip.id);
      if (el) io.observe(el);
    }

    // Sentinel: zoom out when past all trips
    const endIo = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setFocusedTripId(null); },
      { threshold: 0.5 }
    );
    const sentinel = sentinelRef.current;
    if (sentinel) endIo.observe(sentinel);

    return () => {
      io.disconnect();
      endIo.disconnect();
    };
    // deps: filtered trip ids (stable string if order/content didn't change)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered.map((t) => t.id).join(",")]);

  /* ── Fullscreen: ESC key + body overflow ───────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = fullscreen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [fullscreen]);

  const openFullscreen = useCallback(() => setFullscreen(true), []);
  const closeFullscreen = useCallback(() => setFullscreen(false), []);

  /* ── Parallax Effect for Hero ─────────────────────────────────── */
  const heroRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 600], [0, prefersReducedMotion ? 0 : 50]);

  return (
    <div className="space-y-8">
      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section 
        ref={heroRef}
        className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden"
      >
        {/* Parallax Background Container */}
        <motion.div 
          className="absolute inset-0"
          style={{ y: parallaxY }}
        >
          {/* Extra height for parallax movement */}
          <div className="absolute inset-0 -top-[60px] -bottom-[60px]">
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
            <img
              src="/chilli-billy/hero/hero.jpg"
              alt=""
              className="absolute inset-0 w-full h-full object-cover hidden"
              aria-hidden="true"
            />
          </div>
        </motion.div>

        {/* Cinematic Gradient Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(
              to top,
              rgba(0,0,0,0.78) 0%,
              rgba(0,0,0,0.52) 30%,
              rgba(0,0,0,0.22) 58%,
              transparent 82%
            )`
          }}
        />

        {/* Hero Content - Positioned Lower */}
        <div className="relative flex flex-col items-center justify-end h-[320px] sm:h-[420px] md:h-[520px] text-center px-4 pb-10 sm:pb-14 md:pb-20">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] mb-2 tracking-tight"
          >
            EL CHILLI BILLY
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
            className="text-base sm:text-lg md:text-xl lg:text-2xl text-amber-400 font-bold drop-shadow-lg mb-1.5 tracking-wide"
          >
            I NOSTRI VIAGGI
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="text-xs sm:text-sm text-amber-200/70 font-mono"
          >
            Dal primo viaggio all&apos;ultimo delirio
          </motion.p>
        </div>
      </section>

      {/* ── Intro Text ─────────────────────────────────────────────── */}
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

      {/* ── Saga Counters ──────────────────────────────────────────── */}
      <SagaCounters {...sagaStats} />

      {/* ── Highlight Reel ─────────────────────────────────────────── */}
      <HighlightReel />

      {/* ── Rotte dei Viaggi (full-width map section) ──────────────── */}
      <section>
        <h2 className="text-xl font-bold text-center mb-4">🗺️ Rotte dei Viaggi</h2>
        {mapTrips.length > 0 ? (
          <TravelMap
            trips={mapTrips}
            focusedTripId={focusedTripId}
            onRequestFullscreen={openFullscreen}
          />
        ) : (
          <div className="h-[320px] sm:h-[400px] rounded-xl bg-card border border-border flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Nessuna rotta disponibile ancora 🗺️</p>
          </div>
        )}
      </section>

      {/* ── Filters ─────────────────────────────────────────────────── */}
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
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Cerca trip..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* ── Timeline ─────────────────────────────────────────────────── */}
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
          {/* Center spine line (desktop only) */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2" />

          <div className="space-y-6 md:space-y-0">
            {filtered.map((trip, i) => (
              <motion.div
                key={trip.id}
                ref={(el) => { tripRefs.current.set(trip.id, el); }}
                data-trip-id={trip.id}
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

          {/* Sentinel: resets map focus when user scrolls past all trips */}
          <div ref={sentinelRef} className="h-2" />
        </div>
      )}

      {/* ── Fullscreen Modal ───────────────────────────────────────── */}
      {fullscreen && (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
          {/* Top bar – flex-none so map starts below it, not underneath */}
          <div className="flex-none flex items-center justify-between px-4 py-3 bg-black/90 backdrop-blur-sm border-b border-white/10 z-[100]">
            <span className="text-white font-bold text-sm">
              🗺️ Rotte dei Viaggi
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setGlobeMode((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-xs font-medium hover:bg-white/20 transition-all backdrop-blur-sm"
              >
                {globeMode ? "🗺 Mappa" : "🌍 Globo 3D"}
              </button>
              <button
                onClick={closeFullscreen}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-xs font-medium hover:bg-white/20 transition-all backdrop-blur-sm"
              >
                ✕ Chiudi
              </button>
            </div>
          </div>

          {/* Map fills all remaining height */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {globeMode ? (
              <GlobeView trips={mapTrips} />
            ) : (
              <TravelMap
                trips={mapTrips}
                focusedTripId={focusedTripId}
                isFullscreen
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

