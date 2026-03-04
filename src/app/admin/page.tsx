"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Unlock, RotateCcw, Shield } from "lucide-react";

export default function AdminPage() {
  const [pin, setPin] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const res = await fetch("/api/admin/check");
    const data = await res.json();
    setIsAdmin(data.isAdmin);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAdmin(true);
        setPin("");
        setMessage("🎉 Accesso Admin concesso! Benvenuto nel retrobottega.");
      } else {
        setError("PIN errato. Il buttafuori ti tiene d'occhio.");
      }
    } catch {
      setError("Errore di rete. Il server è in pausa caffè.");
    }
    setLoading(false);
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setIsAdmin(false);
    setMessage("");
  }

  async function handleResetSeason() {
    if (!confirm("⚠️ Sei sicuro? Questo chiuderà la stagione attuale e ne aprirà una nuova. Lo storico resta.")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reset-season", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setMessage(`✅ Stagione resettata! Nuova stagione: ${data.seasonName}`);
      } else {
        setError(data.error || "Errore nel reset");
      }
    } catch {
      setError("Errore di rete");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">🔐 Admin Mode</h1>
        <p className="text-muted-foreground">
          Area riservata. Solo personale autorizzato del retrobottega.
        </p>
      </motion.div>

      {!isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock size={20} /> Inserisci il PIN
            </CardTitle>
            <CardDescription>
              Il PIN è quello che sai. Se non lo sai, non dovresti essere qui.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="pin">PIN Segreto</Label>
                <Input
                  id="pin"
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="****"
                  className="mt-1"
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Verifico..." : "Entra nel Retrobottega"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <Card className="border-green-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="text-green-500" size={20} />
                  <span className="font-bold text-green-500">Admin Mode Attivo</span>
                  <Badge variant="default">Autorizzato</Badge>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <Unlock size={16} className="mr-1" /> Esci
                </Button>
              </div>
            </CardContent>
          </Card>

          {message && (
            <Card className="border-amber-500/30">
              <CardContent className="pt-6">
                <p className="text-sm text-amber-400">{message}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">⚙️ Operazioni Admin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                Da qui puoi gestire il sistema. Le operazioni CRUD sono disponibili nelle rispettive pagine
                (Match, Scommesse, Squadre) quando sei in Admin Mode.
              </p>

              <div className="border rounded-lg p-4 space-y-2">
                <h3 className="font-medium flex items-center gap-2">
                  <RotateCcw size={16} /> Reset Stagione
                </h3>
                <p className="text-xs text-muted-foreground">
                  Chiude la stagione attuale e ne apre una nuova. Lo storico dei match e scommesse
                  della vecchia stagione resta, ma le stats ripartono da zero.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleResetSeason}
                  disabled={loading}
                >
                  {loading ? "Resettando..." : "Reset Stagione"}
                </Button>
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
