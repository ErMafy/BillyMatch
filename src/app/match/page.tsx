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
import { Switch } from "@/components/ui/switch";
import { formatDate } from "@/lib/utils";
import { getRandomPhrase } from "@/lib/meme-phrases";
import { Plus, Trash2, Download, Search, Pencil, X } from "lucide-react";

interface Team {
  id: string;
  name: string;
  slug: string;
}

interface Match {
  id: string;
  playedAt: string;
  winnerTeam: Team;
  loserTeam: Team;
  mode: "SETS" | "GOALS";
  winnerScore: number;
  loserScore: number;
  notes: string | null;
}

export default function MatchPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Edit mode
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);

  // Form
  const [winnerTeamId, setWinnerTeamId] = useState("");
  const [loserTeamId, setLoserTeamId] = useState("");
  const [mode, setMode] = useState<"SETS" | "GOALS">("SETS");
  const [winnerScore, setWinnerScore] = useState("");
  const [loserScore, setLoserScore] = useState("");
  const [notes, setNotes] = useState("");
  const [playedAt, setPlayedAt] = useState("");

  // Filters
  const [filterTeam, setFilterTeam] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [searchText, setSearchText] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const loadData = useCallback(async () => {
    const [teamsRes, matchesRes, adminRes] = await Promise.all([
      fetch("/api/teams"),
      fetch("/api/matches"),
      fetch("/api/admin/check"),
    ]);
    setTeams(await teamsRes.json());
    setMatches(await matchesRes.json());
    setIsAdmin((await adminRes.json()).isAdmin);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-set loser when winner is selected
  useEffect(() => {
    if (winnerTeamId && teams.length === 2) {
      const other = teams.find((t) => t.id !== winnerTeamId);
      if (other) setLoserTeamId(other.id);
    }
  }, [winnerTeamId, teams]);

  function startEdit(m: Match) {
    setEditingMatchId(m.id);
    setWinnerTeamId(m.winnerTeam.id);
    setLoserTeamId(m.loserTeam.id);
    setMode(m.mode);
    setWinnerScore(m.winnerScore.toString());
    setLoserScore(m.loserScore.toString());
    setNotes(m.notes || "");
    setPlayedAt(m.playedAt ? new Date(m.playedAt).toISOString().slice(0, 16) : "");
    // Scroll to form
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingMatchId(null);
    setWinnerTeamId("");
    setLoserTeamId("");
    setWinnerScore("");
    setLoserScore("");
    setNotes("");
    setPlayedAt("");
    setMode("SETS");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const isEditing = !!editingMatchId;
      const res = await fetch("/api/matches", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEditing && { id: editingMatchId }),
          winnerTeamId,
          loserTeamId,
          mode,
          winnerScore: parseInt(winnerScore),
          loserScore: parseInt(loserScore),
          notes: notes || null,
          playedAt: playedAt || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(isEditing ? "✅ Match aggiornato!" : getRandomPhrase("matchInsert"));
        cancelEdit();
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
    if (!confirm("Eliminare questo match?")) return;
    const res = await fetch(`/api/matches?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      setMessage("🗑️ Match eliminato");
      loadData();
    } else {
      setMessage(`❌ ${data.error}`);
    }
  }

  // Filter & sort
  const filteredMatches = matches
    .filter((m) => {
      if (filterTeam && m.winnerTeam.id !== filterTeam && m.loserTeam.id !== filterTeam) return false;
      if (filterDateFrom && new Date(m.playedAt) < new Date(filterDateFrom)) return false;
      if (filterDateTo && new Date(m.playedAt) > new Date(filterDateTo + "T23:59:59")) return false;
      if (searchText) {
        const text = searchText.toLowerCase();
        if (
          !m.winnerTeam.name.toLowerCase().includes(text) &&
          !m.loserTeam.name.toLowerCase().includes(text) &&
          !(m.notes || "").toLowerCase().includes(text)
        )
          return false;
      }
      return true;
    })
    .sort((a, b) => {
      const da = new Date(a.playedAt).getTime();
      const db = new Date(b.playedAt).getTime();
      return sortOrder === "desc" ? db - da : da - db;
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🏓 Match & Risultati</h1>
        <p className="text-muted-foreground">Il registro ufficiale delle battaglie sul ferro.</p>
      </div>

      {/* Form inserimento (solo Admin) */}
      {isAdmin && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-amber-500/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                {editingMatchId ? "✏️ Modifica Match" : "➕ Registra Match"}
                {editingMatchId && (
                  <Button variant="ghost" size="sm" onClick={cancelEdit}>
                    <X size={16} className="mr-1" /> Annulla
                  </Button>
                )}
              </CardTitle>
              <CardDescription>
                {editingMatchId
                  ? "Modifica i dati del match selezionato."
                  : "Inserisci il risultato. Il ferro ha parlato, ora immortalalo."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Vincitore</Label>
                    <Select value={winnerTeamId} onValueChange={setWinnerTeamId}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Scegli vincitore" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Perdente</Label>
                    <Select value={loserTeamId} onValueChange={setLoserTeamId}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Auto" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Label>Modalità:</Label>
                  <div className="flex items-center gap-2">
                    <span className={mode === "GOALS" ? "text-foreground font-bold" : "text-muted-foreground"}>
                      GOALS
                    </span>
                    <Switch
                      checked={mode === "SETS"}
                      onCheckedChange={(checked) => setMode(checked ? "SETS" : "GOALS")}
                    />
                    <span className={mode === "SETS" ? "text-foreground font-bold" : "text-muted-foreground"}>
                      SETS
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Punteggio Vincitore</Label>
                    <Input
                      type="number"
                      min="0"
                      value={winnerScore}
                      onChange={(e) => setWinnerScore(e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label>Punteggio Perdente</Label>
                    <Input
                      type="number"
                      min="0"
                      value={loserScore}
                      onChange={(e) => setLoserScore(e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>Data/Ora (opzionale, default: adesso)</Label>
                  <Input
                    type="datetime-local"
                    value={playedAt}
                    onChange={(e) => setPlayedAt(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Note (opzionale)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Es: Rimonta epica dal 0-1..."
                    className="mt-1"
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {editingMatchId ? (
                    <><Pencil size={16} className="mr-2" />{loading ? "Salvando..." : "Salva Modifiche"}</>
                  ) : (
                    <><Plus size={16} className="mr-2" />{loading ? "Registrando..." : "Registra Match"}</>
                  )}
                </Button>

                {message && (
                  <p className="text-sm text-center">{message}</p>
                )}
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filtri */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Search size={16} /> Filtri & Ricerca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Squadra</Label>
              <Select value={filterTeam} onValueChange={setFilterTeam}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Tutte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte</SelectItem>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Da</Label>
              <Input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">A</Label>
              <Input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Cerca</Label>
              <Input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Nome, note..."
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            >
              Ordine: {sortOrder === "desc" ? "Più recenti" : "Più vecchi"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterTeam("");
                setFilterDateFrom("");
                setFilterDateTo("");
                setSearchText("");
              }}
            >
              Reset filtri
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Storico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            📋 Storico Match ({filteredMatches.length})
            <Button variant="outline" size="sm" asChild>
              <a href="/api/export/matches" download>
                <Download size={14} className="mr-1" /> CSV
              </a>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMatches.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessun match trovato.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 px-2">Data</th>
                    <th className="text-left py-2 px-2">Vincitore</th>
                    <th className="text-center py-2 px-2">Score</th>
                    <th className="text-left py-2 px-2">Perdente</th>
                    <th className="text-center py-2 px-2">Modo</th>
                    <th className="text-left py-2 px-2">Note</th>
                    {isAdmin && <th className="text-center py-2 px-2">Azioni</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredMatches.map((m) => (
                    <tr key={m.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2 px-2 text-muted-foreground whitespace-nowrap text-xs">
                        {formatDate(m.playedAt)}
                      </td>
                      <td className="py-2 px-2 font-medium text-green-500">{m.winnerTeam.name}</td>
                      <td className="text-center py-2 px-2 font-bold">
                        {m.winnerScore} - {m.loserScore}
                      </td>
                      <td className="py-2 px-2 text-red-400">{m.loserTeam.name}</td>
                      <td className="text-center py-2 px-2">
                        <Badge variant={m.mode === "SETS" ? "default" : "secondary"} className="text-[10px]">
                          {m.mode}
                        </Badge>
                      </td>
                      <td className="py-2 px-2 text-muted-foreground text-xs max-w-[120px] truncate">
                        {m.notes || "—"}
                      </td>
                      {isAdmin && (
                        <td className="text-center py-2 px-2">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-amber-400 hover:text-amber-300"
                              onClick={() => startEdit(m)}
                              title="Modifica"
                            >
                              <Pencil size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-400 hover:text-red-300"
                              onClick={() => handleDelete(m.id)}
                              title="Elimina"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
