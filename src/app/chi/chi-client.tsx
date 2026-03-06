"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, X } from "lucide-react";

/* ── Types ───────────────────────────────────────────────────────── */
interface Team {
  id: string;
  name: string;
  slug: string;
  photoUrl: string | null;
  players: Player[];
  _count: {
    matchesWon: number;
    matchesLost: number;
  };
}

interface Player {
  id: string;
  name: string;
  nickname: string | null;
  photoUrl: string | null;
  teamId: string;
  team?: { name: string };
}

interface Decision {
  id: string;
  mode: "PLAYER" | "TEAM";
  question: string;
  resultName: string;
  resultId: string | null;
  createdAt: string;
}

interface StatEntry {
  name: string;
  id: string | null;
  count: number;
}

type Mode = "PLAYER" | "TEAM";

/* ── Placeholder Examples ────────────────────────────────────────── */
const PLACEHOLDER_EXAMPLES = [
  "Chi guida stasera?",
  "Chi paga la pizza?",
  "Chi scende a comprare?",
  "Chi fa la fila?",
  "Chi porta le birre?",
  "Chi sceglie il film?",
  "Chi prende il campo migliore?",
];

/* ── Props ───────────────────────────────────────────────────────── */
interface ChiClientProps {
  teams: Team[];
  players: Player[];
  initialHistory: Decision[];
  initialPlayerStats: StatEntry[];
  initialTeamStats: StatEntry[];
}

export function ChiClient({
  teams,
  players,
  initialHistory,
  initialPlayerStats,
  initialTeamStats,
}: ChiClientProps) {
  const [mode, setMode] = useState<Mode>("PLAYER");
  const [question, setQuestion] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(players.map((p) => p.id))
  );
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentSpinIndex, setCurrentSpinIndex] = useState(0);
  const [result, setResult] = useState<{
    item: Player | Team;
    action: string;
  } | null>(null);
  const [history, setHistory] = useState<Decision[]>(initialHistory);
  const [playerStats, setPlayerStats] = useState<StatEntry[]>(initialPlayerStats);
  const [teamStats, setTeamStats] = useState<StatEntry[]>(initialTeamStats);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showSpotlight, setShowSpotlight] = useState(false);

  const spinIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const spinCountRef = useRef(0);

  // Update placeholder periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % PLACEHOLDER_EXAMPLES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  /* ── Get current items based on mode ───────────────────────────── */
  const currentItems = useMemo(() => {
    return mode === "PLAYER" ? players : teams;
  }, [mode, players, teams]);

  const eligibleItems = useMemo(() => {
    return currentItems.filter((item) => selectedIds.has(item.id));
  }, [currentItems, selectedIds]);

  /* ── Toggle Selection ──────────────────────────────────────────── */
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 2) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  /* ── Switch Mode ───────────────────────────────────────────────── */
  const switchMode = useCallback(
    (newMode: Mode) => {
      setMode(newMode);
      setResult(null);
      // Select all items in new mode
      const items = newMode === "PLAYER" ? players : teams;
      setSelectedIds(new Set(items.map((i) => i.id)));
    },
    [players, teams]
  );

  /* ── Extract Action from Question ──────────────────────────────── */
  const extractAction = (q: string): string => {
    let action = q
      .replace(/^chi\s+/i, "")
      .replace(/\?+$/, "")
      .trim();
    if (!action) action = "è stato scelto";
    return action.toUpperCase();
  };

  /* ── Save Decision to API ──────────────────────────────────────── */
  const saveDecision = async (
    item: Player | Team,
    questionText: string
  ): Promise<Decision | null> => {
    try {
      const res = await fetch("/api/chi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          question: questionText,
          resultName: item.name,
          resultId: item.id,
        }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error("Failed to save decision:", e);
    }
    return null;
  };

  /* ── Slot Machine Animation ────────────────────────────────────── */
  const startSpin = useCallback(async () => {
    if (eligibleItems.length < 2) return;

    const q = question.trim() || "Chi?";
    setResult(null);
    setShowSpotlight(false);
    setIsSpinning(true);
    spinCountRef.current = 0;

    // Longer animation: ~2.5-3 seconds total with 35-45 spins
    const totalSpins = 35 + Math.floor(Math.random() * 10);
    const winnerIndex = Math.floor(Math.random() * eligibleItems.length);
    const winner = eligibleItems[winnerIndex];

    let currentIndex = 0;
    let delay = 40; // Start very fast

    const spin = async () => {
      setCurrentSpinIndex(currentIndex % eligibleItems.length);
      spinCountRef.current++;

      if (spinCountRef.current >= totalSpins) {
        setCurrentSpinIndex(eligibleItems.indexOf(winner));
        setIsSpinning(false);
        setShowSpotlight(true);

        const action = extractAction(q);
        
        // Dramatic pause before showing result
        setTimeout(() => {
          setResult({ item: winner, action });
        }, 500);

        // Save to DB
        const saved = await saveDecision(winner, q);
        if (saved) {
          setHistory((prev) => [saved, ...prev.slice(0, 49)]);

          // Update stats
          if (mode === "PLAYER") {
            setPlayerStats((prev) => {
              const existing = prev.find((s) => s.id === winner.id);
              if (existing) {
                return prev
                  .map((s) =>
                    s.id === winner.id ? { ...s, count: s.count + 1 } : s
                  )
                  .sort((a, b) => b.count - a.count);
              }
              return [...prev, { name: winner.name, id: winner.id, count: 1 }].sort(
                (a, b) => b.count - a.count
              );
            });
          } else {
            setTeamStats((prev) => {
              const existing = prev.find((s) => s.id === winner.id);
              if (existing) {
                return prev
                  .map((s) =>
                    s.id === winner.id ? { ...s, count: s.count + 1 } : s
                  )
                  .sort((a, b) => b.count - a.count);
              }
              return [...prev, { name: winner.name, id: winner.id, count: 1 }].sort(
                (a, b) => b.count - a.count
              );
            });
          }
        }

        return;
      }

      // Progressive slowdown for dramatic effect
      const progress = spinCountRef.current / totalSpins;
      if (progress > 0.85) {
        // Final stretch - very slow
        delay = Math.min(delay * 1.4, 500);
      } else if (progress > 0.7) {
        // Slowing down
        delay = Math.min(delay * 1.25, 300);
      } else if (progress > 0.5) {
        // Starting to slow
        delay = Math.min(delay * 1.1, 150);
      }

      currentIndex++;
      spinIntervalRef.current = setTimeout(spin, delay);
    };

    spin();
  }, [eligibleItems, question, mode]);

  /* ── Quick Preset: Campo Migliore ──────────────────────────────── */
  const launchCampoMigliore = useCallback(() => {
    switchMode("TEAM");
    setQuestion("Chi prende il campo migliore?");
  }, [switchMode]);

  /* ── Stats Calculations ────────────────────────────────────────── */
  const currentStats = mode === "PLAYER" ? playerStats : teamStats;
  const totalDecisions = currentStats.reduce((a, b) => a + b.count, 0);

  // Chi è uscito di più (most selected)
  const mostSelected = [...currentStats].sort((a, b) => b.count - a.count);

  // Chi non esce mai (least selected, only those in current items)
  const leastSelected = useMemo(() => {
    const itemsWithCounts = currentItems.map((item) => {
      const stat = currentStats.find((s) => s.id === item.id);
      return { name: item.name, id: item.id, count: stat?.count || 0 };
    });
    return itemsWithCounts.sort((a, b) => a.count - b.count);
  }, [currentItems, currentStats]);

  /* ── Player name to photo filename mapping ─────────────────────── */
  const PLAYER_PHOTO_MAP: Record<string, string> = {
    "rinoghen": "rino",
    "lupo": "lupo",
    "valdes": "mino",
    "barthez": "mino",
    "mazza il codone di stop": "mazza",
    // Fallback shortcuts
    "rino": "rino",
    "mino": "mino",
    "mazza": "mazza",
  };

  /* ── Get photo/display for item ────────────────────────────────── */
  const getItemPhoto = (item: Player | Team) => {
    // For players, use local /players/{mapped_name}.png
    if (isPlayer(item)) {
      const nameLower = item.name.toLowerCase();
      const photoName = PLAYER_PHOTO_MAP[nameLower] || nameLower.split(" ")[0];
      return `/players/${photoName}.png`;
    }
    // For teams, use photoUrl from DB
    return item.photoUrl || null;
  };

  const getItemInitial = (item: Player | Team) => {
    return item.name.charAt(0).toUpperCase();
  };

  const isPlayer = (item: Player | Team): item is Player => {
    return "teamId" in item;
  };

  /* ── Reset History ─────────────────────────────────────────────── */
  const handleResetHistory = async () => {
    setIsResetting(true);
    try {
      const res = await fetch("/api/chi", { method: "DELETE" });
      if (res.ok) {
        setHistory([]);
        setPlayerStats([]);
        setTeamStats([]);
        setShowResetModal(false);
        setToast("Cronologia azzerata.");
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e) {
      console.error("Failed to reset history:", e);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-background" />
        <div className="relative flex flex-col items-center justify-center h-[300px] sm:h-[360px] text-center px-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-6xl sm:text-7xl md:text-8xl font-black text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] mb-4 tracking-tight"
          >
            CHI?
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-sm sm:text-base md:text-lg text-amber-400/90 font-medium leading-relaxed space-y-0.5"
          >
            <p>Chi guida?</p>
            <p>Chi paga?</p>
            <p>Chi si sacrifica?</p>
            <p>Chi prende il campo migliore?</p>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="text-xs sm:text-sm text-amber-200/60 font-mono mt-4"
          >
            Decide il ferro.
          </motion.p>
        </div>
      </section>

      {/* ── MODE SELECTOR ──────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex justify-center gap-2"
      >
        <Button
          variant={mode === "PLAYER" ? "default" : "outline"}
          onClick={() => switchMode("PLAYER")}
          className={`px-6 py-2 font-bold transition-all ${
            mode === "PLAYER"
              ? "bg-amber-500 text-black hover:bg-amber-400"
              : "border-border hover:border-amber-500/50"
          }`}
        >
          👤 Giocatori
        </Button>
        <Button
          variant={mode === "TEAM" ? "default" : "outline"}
          onClick={() => switchMode("TEAM")}
          className={`px-6 py-2 font-bold transition-all ${
            mode === "TEAM"
              ? "bg-amber-500 text-black hover:bg-amber-400"
              : "border-border hover:border-amber-500/50"
          }`}
        >
          ⚽ Squadre
        </Button>
      </motion.section>

      {/* ── QUICK PRESET: Campo Migliore ───────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25 }}
        className="flex justify-center"
      >
        <button
          onClick={launchCampoMigliore}
          className="px-4 py-2 rounded-full bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 text-green-400 text-sm font-medium hover:border-green-400 hover:bg-green-500/20 transition-all"
        >
          ⚡ Chi prende il campo migliore?
        </button>
      </motion.section>

      {/* ── QUESTION INPUT ─────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="max-w-xl mx-auto"
      >
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Cosa dobbiamo decidere?
        </label>
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={PLACEHOLDER_EXAMPLES[placeholderIndex]}
          className="h-14 text-lg px-4 bg-card border-border/50 focus:border-amber-500/50 focus:ring-amber-500/20"
          disabled={isSpinning}
        />
      </motion.section>

      {/* ── CARDS ──────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <p className="text-center text-sm text-muted-foreground mb-4">
          Seleziona i partecipanti (min. 2)
        </p>
        <div
          className={`grid gap-4 max-w-4xl mx-auto ${
            mode === "PLAYER"
              ? "grid-cols-2 sm:grid-cols-4"
              : "grid-cols-1 sm:grid-cols-2"
          }`}
        >
          {currentItems.map((item, index) => {
            const isSelected = selectedIds.has(item.id);
            const isCurrentSpin =
              isSpinning && eligibleItems[currentSpinIndex]?.id === item.id;
            const isWinner = showSpotlight && eligibleItems[currentSpinIndex]?.id === item.id;
            const isDimmed = showSpotlight && !isWinner;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ 
                  opacity: isDimmed ? 0.4 : 1, 
                  scale: isWinner ? 1.1 : 1,
                  filter: isDimmed ? "grayscale(0.5)" : "grayscale(0)"
                }}
                transition={{ duration: isWinner ? 0.5 : 0.4, delay: isWinner ? 0 : 0.1 * index }}
                onClick={() => !isSpinning && !showSpotlight && toggleSelection(item.id)}
                className={`
                  relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-300
                  ${
                    isSelected
                      ? "border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                      : "border-border/50 opacity-50 grayscale"
                  }
                  ${isCurrentSpin ? "ring-4 ring-amber-400 scale-105 z-10" : ""}
                  ${isWinner ? "ring-4 ring-amber-400 shadow-[0_0_60px_rgba(245,158,11,0.6)] z-20" : ""}
                  ${!isSpinning && !showSpotlight ? "hover:scale-105 hover:border-amber-400" : ""}
                `}
              >
                {/* Glow animation during spin */}
                <motion.div
                  animate={
                    isCurrentSpin
                      ? {
                          boxShadow: [
                            "0 0 0px rgba(245,158,11,0)",
                            "0 0 40px rgba(245,158,11,0.8)",
                            "0 0 0px rgba(245,158,11,0)",
                          ],
                        }
                      : isWinner
                      ? {
                          boxShadow: [
                            "0 0 30px rgba(245,158,11,0.5)",
                            "0 0 60px rgba(245,158,11,0.8)",
                            "0 0 30px rgba(245,158,11,0.5)",
                          ],
                        }
                      : {}
                  }
                  transition={{
                    duration: isWinner ? 1 : 0.15,
                    repeat: isCurrentSpin || isWinner ? Infinity : 0,
                  }}
                  className="absolute inset-0 pointer-events-none rounded-xl"
                />
                {/* Player/Team Image - 3:4 aspect ratio for players */}
                <div
                  className={`${
                    mode === "PLAYER" ? "aspect-[3/4]" : "aspect-[16/9]"
                  } bg-gradient-to-br from-amber-500/20 to-orange-600/20 relative overflow-hidden`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getItemPhoto(item) || ""}
                    alt={item.name}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
                {/* Name card footer */}
                <div className="p-3 bg-card/90 backdrop-blur-sm border-t border-border/30">
                  <p
                    className={`font-bold text-center ${
                      mode === "PLAYER" ? "text-lg" : "text-xl"
                    }`}
                  >
                    {item.name}
                  </p>
                  {!isPlayer(item) && (
                    <p className="text-xs text-center text-muted-foreground mt-1">
                      {item._count.matchesWon}W - {item._count.matchesLost}L
                    </p>
                  )}
                  {isPlayer(item) && item.nickname && (
                    <p className="text-xs text-center text-amber-400/70 mt-1">
                      aka {item.nickname}
                    </p>
                  )}
                </div>
                {/* Selection checkmark */}
                {isSelected && !showSpotlight && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-black"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
                {/* Winner crown */}
                {isWinner && (
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                    className="absolute -top-2 left-1/2 -translate-x-1/2 text-3xl"
                  >
                    👑
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* ── DECISION BUTTON ────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="text-center"
      >
        <Button
          onClick={() => {
            setShowSpotlight(false);
            setResult(null);
            startSpin();
          }}
          disabled={isSpinning || eligibleItems.length < 2}
          className="h-14 px-12 text-xl font-black bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black shadow-lg hover:shadow-amber-500/25 transition-all disabled:opacity-50"
        >
          {isSpinning ? (
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              DECIDENDO...
            </motion.span>
          ) : (
            "DECIDI"
          )}
        </Button>
      </motion.section>

      {/* ── RESULT ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {result && (
          <motion.section
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
            className="max-w-md mx-auto"
          >
            <Card className="overflow-hidden border-2 border-amber-500 shadow-[0_0_60px_rgba(245,158,11,0.4)]">
              <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-center py-4">
                <CardTitle className="text-3xl font-black text-black tracking-wider">
                  ⚖️ SENTENZA ⚖️
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 text-center bg-gradient-to-b from-card to-card/80">
                <motion.div
                  initial={{ rotateY: 180, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="mb-6"
                >
                  <div
                    className={`mx-auto rounded-xl overflow-hidden border-4 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.4)] ${
                      isPlayer(result.item)
                        ? "w-36 h-48"
                        : "w-52 h-32"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getItemPhoto(result.item) || ""}
                      alt={result.item.name}
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                </motion.div>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-4xl sm:text-5xl font-black text-amber-400 mb-3 drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)]"
                >
                  {result.item.name.toUpperCase()}
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-lg sm:text-xl text-white/80 font-bold tracking-wide"
                >
                  {result.action}
                </motion.p>
              </CardContent>
            </Card>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── STATS ──────────────────────────────────────────────────── */}
      {totalDecisions > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto"
        >
          {/* Chi è uscito di più */}
          <Card className="border-red-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <span>🎯</span> Chi è uscito di più
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mostSelected.length > 0 ? (
                <div className="space-y-2">
                  {mostSelected.slice(0, 5).map((s, i) => (
                    <div
                      key={s.id || s.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="flex items-center gap-2">
                        {i === 0 && <span>🏆</span>}
                        {s.name}
                      </span>
                      <span className="text-muted-foreground">
                        {s.count}x (
                        {Math.round((s.count / totalDecisions) * 100)}%)
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nessun dato</p>
              )}
            </CardContent>
          </Card>

          {/* Chi non esce mai */}
          <Card className="border-green-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <span>🍀</span> Chi non esce mai
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leastSelected.length > 0 ? (
                <div className="space-y-2">
                  {leastSelected.slice(0, 5).map((s, i) => (
                    <div
                      key={s.id || s.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="flex items-center gap-2">
                        {i === 0 && s.count === 0 && <span>😇</span>}
                        {s.name}
                      </span>
                      <span className="text-muted-foreground">
                        {s.count}x (
                        {totalDecisions > 0
                          ? Math.round((s.count / totalDecisions) * 100)
                          : 0}
                        %)
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nessun dato</p>
              )}
            </CardContent>
          </Card>
        </motion.section>
      )}

      {/* ── HISTORY ────────────────────────────────────────────────── */}
      {history.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <span>📜</span> Cronologia Decisioni
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResetModal(true)}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Reset Cronologia
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Domanda</TableHead>
                      <TableHead>Risultato</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.slice(0, 15).map((decision) => (
                      <TableRow key={decision.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {decision.question}
                        </TableCell>
                        <TableCell>
                          <span className="text-amber-400 font-bold">
                            {decision.resultName}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              decision.mode === "PLAYER"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-green-500/20 text-green-400"
                            }`}
                          >
                            {decision.mode === "PLAYER"
                              ? "Giocatore"
                              : "Squadra"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm">
                          {new Date(decision.createdAt).toLocaleDateString(
                            "it-IT",
                            {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {history.length > 15 && (
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Mostrando le ultime 15 decisioni di {history.length} totali
                </p>
              )}
            </CardContent>
          </Card>
        </motion.section>
      )}

      {/* ── RESET CONFIRMATION MODAL ───────────────────────────────── */}
      <AnimatePresence>
        {showResetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowResetModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Sei sicuro?</h3>
                <button
                  onClick={() => setShowResetModal(false)}
                  className="text-muted-foreground hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-muted-foreground mb-6">
                Questo cancellerà cronologia e classifiche.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowResetModal(false)}
                  disabled={isResetting}
                >
                  Annulla
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleResetHistory}
                  disabled={isResetting}
                  className="bg-red-600 hover:bg-red-500"
                >
                  {isResetting ? "Resettando..." : "Reset"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOAST NOTIFICATION ─────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg font-medium"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
