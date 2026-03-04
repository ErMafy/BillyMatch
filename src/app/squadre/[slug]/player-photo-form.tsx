"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X, User } from "lucide-react";
import { compressImage, formatBytes } from "@/lib/image-compress";

interface PlayerInfo {
  id: string;
  name: string;
  nickname: string | null;
  photoUrl: string | null;
  photoTitle: string | null;
  photoDescription: string | null;
}

interface PlayerPhotoFormProps {
  players: PlayerInfo[];
}

export function PlayerPhotoForm({ players }: PlayerPhotoFormProps) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/admin/check")
      .then((r) => r.json())
      .then((d) => setIsAdmin(d.isAdmin));
  }, []);

  if (!isAdmin) return null;

  return (
    <Card className="border-amber-500/20">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <User size={16} /> 📸 Foto Giocatori (Admin)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {players.map((player) => (
            <PlayerPhotoItem key={player.id} player={player} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PlayerPhotoItem({ player }: { player: PlayerInfo }) {
  const [preview, setPreview] = useState<string | null>(player.photoUrl);
  const [photoTitle, setPhotoTitle] = useState(player.photoTitle || "");
  const [photoDescription, setPhotoDescription] = useState(player.photoDescription || "");
  const [compressInfo, setCompressInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [expanded, setExpanded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage("");
    setCompressInfo(`Comprimendo ${formatBytes(file.size)}...`);

    try {
      const result = await compressImage(file);
      setPreview(result.dataUrl);
      setCompressInfo(
        `${formatBytes(result.originalSize)} → ${formatBytes(result.compressedSize)} (${result.width}x${result.height})`
      );
    } catch {
      setMessage("❌ Errore compressione");
      setCompressInfo("");
    }
  }

  function clearPhoto() {
    setPreview(null);
    setCompressInfo("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/players/photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: player.id,
          photoUrl: preview,
          photoTitle: photoTitle || null,
          photoDescription: photoDescription || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("✅ Salvata!");
        setTimeout(() => window.location.reload(), 800);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch {
      setMessage("❌ Errore di rete");
    }
    setLoading(false);
  }

  return (
    <div className="border border-border/50 rounded-lg p-3">
      {/* Player header - click to expand */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 text-left"
      >
        {preview ? (
          <img
            src={preview}
            alt={player.name}
            className="h-12 w-12 rounded-full object-cover border-2 border-amber-500/30"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
            {player.name.charAt(0)}
          </div>
        )}
        <div className="flex-1">
          <p className="font-medium text-sm">{player.name}</p>
          {player.nickname && (
            <p className="text-xs text-muted-foreground">aka {player.nickname}</p>
          )}
          {photoTitle && (
            <p className="text-[10px] text-amber-400">{photoTitle}</p>
          )}
        </div>
        <span className="text-muted-foreground text-xs">
          {expanded ? "▲ Chiudi" : "▼ Modifica foto"}
        </span>
      </button>

      {/* Expanded form */}
      {expanded && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {/* Preview */}
          {preview && (
            <div className="relative">
              <img
                src={preview}
                alt="Anteprima"
                className="w-full max-h-64 object-contain rounded-lg border border-border bg-black/20"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={clearPhoto}
              >
                <X size={12} />
              </Button>
            </div>
          )}

          {/* File upload */}
          <div>
            <Label className="text-xs">Carica Foto</Label>
            <Input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-1 text-xs"
            />
            {compressInfo && (
              <p className="text-[10px] text-muted-foreground mt-1">📊 {compressInfo}</p>
            )}
          </div>

          {/* Title / Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Titolo Foto</Label>
              <Input
                value={photoTitle}
                onChange={(e) => setPhotoTitle(e.target.value)}
                placeholder="Es: Foto profilo"
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Descrizione</Label>
              <Textarea
                value={photoDescription}
                onChange={(e) => setPhotoDescription(e.target.value)}
                placeholder="Es: Il temuto attaccante..."
                className="mt-1 text-xs min-h-[36px]"
                rows={1}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={loading} className="flex-1">
              <Upload size={12} className="mr-1" />
              {loading ? "Caricando..." : "Salva Foto"}
            </Button>
          </div>

          {message && <p className="text-xs text-center">{message}</p>}
        </form>
      )}
    </div>
  );
}
