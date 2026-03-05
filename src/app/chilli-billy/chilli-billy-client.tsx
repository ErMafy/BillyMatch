"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { TripCard } from "@/components/chilli-billy/trip-card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

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
    // Always oldest -> newest (startDate ASC)
    return result.sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  }, [trips, activeTab, search]);

  return (
    <div className="space-y-8">
      {/* Cinematic Hero */}
      <section className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden">
        <div className="relative flex flex-col items-center justify-center py-20 sm:py-28 md:py-36 text-center px-4 bg-gradient-to-b from-black via-zinc-900/90 to-background">
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
            className="text-lg sm:text-xl text-amber-400 font-bold drop-shadow-lg mb-2"
          >
            Le avventure della crew
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

      {/* Filters */}
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

      {/* Timeline */}
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
          {/* Timeline line */}
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
                {/* On even indices, card on the left. On odd, on the right */}
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
