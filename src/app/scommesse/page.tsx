"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getRandomPhrase } from "@/lib/meme-phrases";
import { formatDate } from "@/lib/utils";
import { Plus, Trash2, Download, TrendingUp, TrendingDown, DollarSign, Trophy, ArrowUpDown, Pencil, X } from "lucide-react";

interface Team {
  id: string;
  name: string;
}

interface Match {
  id: string;
  playedAt: string;
  winnerTeam: Team;
  loserTeam: Team;
  winnerScore: number;
  loserScore: number;
}

interface Bet {
  id: string;
  description: string;
  totalCost: number;
  payerMode: string;
  costWinner: number;
  costLoser: number;
  matchId: string | null;
  match: Match | null;
  createdAt: string;
}

interface SpendingSummary {
  teamId: string;
  teamName: string;
  totalSpent: number;
  totalEarned: number;
  netBalance: number;
}

export default function ScommessePage() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [spending, setSpending] = useState<SpendingSummary[]>([]);

  // Edit mode
  const [editingBetId, setEditingBetId] = useState<string | null>(null);

  // Form
  const [description, setDescription] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [payerMode, setPayerMode] = useState("LOSER");
  const [costWinner, setCostWinner] = useState("");
  const [costLoser, setCostLoser] = useState("");
  const [matchId, setMatchId] = useState("");

  const loadData = useCallback(async () => {
    const [betsRes, matchesRes, teamsRes, adminRes, spendingRes] = await Promise.all([
      fetch("/api/bets"),
      fetch("/api/matches"),
      fetch("/api/teams"),
      fetch("/api/admin/check"),
      fetch("/api/bets/spending"),
    ]);
    setBets(await betsRes.json());
    setMatches(await matchesRes.json());
    setTeams(await teamsRes.json());
    setIsAdmin((await adminRes.json()).isAdmin);
    setSpending(await spendingRes.json());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-calculate costs based on payerMode
  useEffect(() => {
    const total = parseFloat(totalCost) || 0;
    if (payerMode === "WINNER") {
      setCostWinner(total.toString());
      setCostLoser("0");
    } else if (payerMode === "LOSER") {
      setCostWinner("0");
      setCostLoser(total.toString());
    } else if (payerMode === "SPLIT") {
      setCostWinner((total / 2).toString());
      setCostLoser((total / 2).toString());
    }
  }, [payerMode, totalCost]);

  function startEditBet(b: Bet) {
    setEditingBetId(b.id);
    setDescription(b.description);
    setTotalCost(b.totalCost.toString());
    setPayerMode(b.payerMode);
    setCostWinner(b.costWinner.toString());
    setCostLoser(b.costLoser.toString());
    setMatchId(b.matchId || "none");
    // Scroll to form
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  function cancelEditBet() {
    setEditingBetId(null);
    setDescription("");
    setTotalCost("");
    setCostWinner("");
    setCostLoser("");
    setMatchId("");
    setPayerMode("LOSER");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const isEditing = !!editingBetId;
      const res = await fetch("/api/bets", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEditing && { id: editingBetId }),
          description,
          totalCost: parseFloat(totalCost),
          payerMode,
          costWinner: parseFloat(costWinner) || 0,
          costLoser: parseFloat(costLoser) || 0,
          matchId: matchId && matchId !== "none" ? matchId : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(isEditing ? "✅ Scommessa aggiornata!" : getRandomPhrase("betInsert"));
        cancelEditBet();
        loadData();
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch {
      setMessage("❌ Errore di rete");
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminare questa scommessa?")) return;
    const res = await fetch(`/api/bets?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      setMessage("🗑️ Scommessa eliminata");
      loadData();
    } else {
      setMessage(`❌ ${data.error}`);
    }
  }

  // Calcola saldo
  const saldo = spending.length >= 2
    ? Math.abs(spending[0].totalSpent - spending[1].totalSpent)
    : 0;
  const maxSpender = spending.length >= 2
    ? spending.reduce((a, b) => (a.totalSpent > b.totalSpent ? a : b))
    : null;
  const maxEarner = spending.length >= 2
    ? spending.reduce((a, b) => (a.totalEarned > b.totalEarned ? a : b))
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">💰 Scommesse</h1>
        <p className="text-muted-foreground">Il registro delle spese clandestine. Ogni euro è tracciato.</p>
      </div>

      {/* Dashboard spese */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {spending.map((s) => (
          <Card key={s.teamId}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.teamName}</p>
                  <p className="text-3xl font-bold text-amber-400">€{s.totalSpent.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">speso</p>
                </div>
                {maxSpender && maxSpender.teamId === s.teamId ? (
                  <TrendingUp className="text-red-400" size={24} />
                ) : (
                  <TrendingDown className="text-green-500" size={24} />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Differenza (Saldo)</p>
            <p className="text-3xl font-bold text-foreground">€{saldo.toFixed(2)}</p>
            {maxSpender && (
              <p className="text-xs text-muted-foreground mt-1">
                {maxSpender.teamName} paga di più
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Totale Giro</p>
                <p className="text-3xl font-bold text-green-400">
                  €{spending.reduce((sum, s) => sum + s.totalSpent, 0).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">speso complessivo</p>
              </div>
              <DollarSign className="text-green-500" size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* === GRAFICI SPESE & GUADAGNI === */}
      {spending.length >= 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Grafico SPESO */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp size={16} className="text-red-400" />
                📊 Chi Spende di Più
              </CardTitle>
              <CardDescription className="text-xs">Totale pagato per scommesse perse</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...spending]
                  .sort((a, b) => b.totalSpent - a.totalSpent)
                  .map((s, i) => {
                    const maxVal = Math.max(...spending.map((sp) => sp.totalSpent), 1);
                    const pct = (s.totalSpent / maxVal) * 100;
                    return (
                      <div key={s.teamId}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="flex items-center gap-1">
                            {i === 0 ? "💸" : "💪"} {s.teamName}
                          </span>
                          <span className="font-bold text-red-400">€{s.totalSpent.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-end pr-2"
                          >
                            {pct > 30 && (
                              <span className="text-[10px] font-bold text-white">
                                {pct.toFixed(0)}%
                              </span>
                            )}
                          </motion.div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          {/* Grafico GUADAGNATO */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Trophy size={16} className="text-green-400" />
                📊 Chi Guadagna di Più
              </CardTitle>
              <CardDescription className="text-xs">Totale ricevuto (l&apos;altro ha pagato per te)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...spending]
                  .sort((a, b) => b.totalEarned - a.totalEarned)
                  .map((s, i) => {
                    const maxVal = Math.max(...spending.map((sp) => sp.totalEarned), 1);
                    const pct = (s.totalEarned / maxVal) * 100;
                    return (
                      <div key={s.teamId}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="flex items-center gap-1">
                            {i === 0 ? "🤑" : "😤"} {s.teamName}
                          </span>
                          <span className="font-bold text-green-400">€{s.totalEarned.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                            className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-end pr-2"
                          >
                            {pct > 30 && (
                              <span className="text-[10px] font-bold text-white">
                                {pct.toFixed(0)}%
                              </span>
                            )}
                          </motion.div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bilancio Netto */}
      {spending.length >= 2 && (
        <Card className="border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ArrowUpDown size={16} className="text-amber-400" />
              ⚖️ Bilancio Netto (Guadagnato - Speso)
            </CardTitle>
            <CardDescription className="text-xs">
              Positivo = hai guadagnato più di quanto hai speso. Negativo = il portafoglio piange.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...spending]
                .sort((a, b) => b.netBalance - a.netBalance)
                .map((s) => (
                  <motion.div
                    key={s.teamId}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className={`text-center p-4 rounded-lg border ${
                      s.netBalance >= 0
                        ? "bg-green-500/10 border-green-500/30"
                        : "bg-red-500/10 border-red-500/30"
                    }`}
                  >
                    <p className="text-sm font-medium text-muted-foreground mb-1">{s.teamName}</p>
                    <p
                      className={`text-3xl font-extrabold ${
                        s.netBalance >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {s.netBalance >= 0 ? "+" : ""}€{s.netBalance.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {s.netBalance >= 0
                        ? "🎉 In profitto!"
                        : "💀 In perdita"}
                    </p>
                    <div className="text-[10px] text-muted-foreground mt-2 space-y-0.5">
                      <p>Speso: €{s.totalSpent.toFixed(2)}</p>
                      <p>Ricevuto: €{s.totalEarned.toFixed(2)}</p>
                    </div>
                  </motion.div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confronto side-by-side */}
      {spending.length >= 2 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">📊 Confronto Diretto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {spending.map((s) => {
                const maxVal = Math.max(
                  ...spending.map((sp) => Math.max(sp.totalSpent, sp.totalEarned)),
                  1
                );
                const pctSpent = (s.totalSpent / maxVal) * 100;
                const pctEarned = (s.totalEarned / maxVal) * 100;
                return (
                  <div key={s.teamId} className="space-y-1">
                    <p className="text-sm font-medium">{s.teamName}</p>
                    {/* Speso bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-red-400 w-16 text-right">Speso</span>
                      <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pctSpent}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full rounded-full bg-red-500"
                        />
                      </div>
                      <span className="text-[10px] font-mono w-16">€{s.totalSpent.toFixed(2)}</span>
                    </div>
                    {/* Ricevuto bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-green-400 w-16 text-right">Ricevuto</span>
                      <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pctEarned}%` }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                          className="h-full rounded-full bg-green-500"
                        />
                      </div>
                      <span className="text-[10px] font-mono w-16">€{s.totalEarned.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form (Admin) */}
      {isAdmin && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-amber-500/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                {editingBetId ? "✏️ Modifica Scommessa" : "➕ Nuova Scommessa"}
                {editingBetId && (
                  <Button variant="ghost" size="sm" onClick={cancelEditBet}>
                    <X size={16} className="mr-1" /> Annulla
                  </Button>
                )}
              </CardTitle>
              <CardDescription>
                {editingBetId
                  ? "Modifica i dati della scommessa selezionata."
                  : "Registra le spese. Il banco vede tutto."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Descrizione</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Es: Pizza per il perdente, birra al bar..."
                    className="mt-1"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Costo Totale (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={totalCost}
                      onChange={(e) => setTotalCost(e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label>Chi paga</Label>
                    <Select value={payerMode} onValueChange={setPayerMode}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WINNER">Vincitore</SelectItem>
                        <SelectItem value="LOSER">Perdente</SelectItem>
                        <SelectItem value="SPLIT">Metà e metà</SelectItem>
                        <SelectItem value="MANUAL">Manuale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {payerMode === "MANUAL" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Costo Vincitore (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={costWinner}
                        onChange={(e) => setCostWinner(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Costo Perdente (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={costLoser}
                        onChange={(e) => setCostLoser(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label>Match collegato (opzionale)</Label>
                  <Select value={matchId} onValueChange={setMatchId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Nessuno" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nessuno</SelectItem>
                      {matches
                        .filter((m) => !bets.some((b) => b.matchId === m.id) || (editingBetId && bets.find((b) => b.id === editingBetId)?.matchId === m.id))
                        .slice(0, 20)
                        .map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.winnerTeam.name} vs {m.loserTeam.name} ({m.winnerScore}-{m.loserScore})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {editingBetId ? (
                    <><Pencil size={16} className="mr-2" />{loading ? "Salvando..." : "Salva Modifiche"}</>
                  ) : (
                    <><Plus size={16} className="mr-2" />{loading ? "Registrando..." : "Registra Scommessa"}</>
                  )}
                </Button>

                {message && <p className="text-sm text-center">{message}</p>}
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Lista scommesse */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            📝 Storico Scommesse ({bets.length})
            <Button variant="outline" size="sm" asChild>
              <a href="/api/export/bets" download>
                <Download size={14} className="mr-1" /> CSV
              </a>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessuna scommessa registrata. Il portafoglio è al sicuro.</p>
          ) : (
            <div className="space-y-3">
              {bets.map((b) => (
                <div
                  key={b.id}
                  className="flex items-start justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{b.description}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px]">
                        €{b.totalCost.toFixed(2)}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {b.payerMode === "WINNER" ? "Paga il vincitore" :
                         b.payerMode === "LOSER" ? "Paga il perdente" :
                         b.payerMode === "SPLIT" ? "50/50" : "Manuale"}
                      </Badge>
                      {b.match && (
                        <Badge variant="outline" className="text-[10px]">
                          {b.match.winnerTeam.name} vs {b.match.loserTeam.name}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(b.createdAt)}
                      {b.payerMode === "MANUAL" && ` • Vincitore: €${b.costWinner.toFixed(2)} / Perdente: €${b.costLoser.toFixed(2)}`}
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-amber-400 hover:text-amber-300"
                        onClick={() => startEditBet(b)}
                        title="Modifica"
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400 hover:text-red-300"
                        onClick={() => handleDelete(b.id)}
                        title="Elimina"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
