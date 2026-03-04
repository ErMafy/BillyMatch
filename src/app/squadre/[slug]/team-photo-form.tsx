"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Upload, X } from "lucide-react";
import { compressImage, formatBytes } from "@/lib/image-compress";
import type { PhotoMode } from "@/lib/image-compress";

interface TeamPhotoFormProps {
  teamId: string;
  currentPhotoUrl: string | null;
  currentPhotoTitle: string | null;
  currentPhotoDescription: string | null;
}

export function TeamPhotoForm({ teamId, currentPhotoUrl, currentPhotoTitle, currentPhotoDescription }: TeamPhotoFormProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [photoTitle, setPhotoTitle] = useState(currentPhotoTitle || "");
  const [photoDescription, setPhotoDescription] = useState(currentPhotoDescription || "");
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl);
  const [compressInfo, setCompressInfo] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/check")
      .then((r) => r.json())
      .then((d) => setIsAdmin(d.isAdmin));
  }, []);

  if (!isAdmin) return null;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage("");
    setCompressInfo(`Comprimendo ${formatBytes(file.size)}...`);

    try {
      const result = await compressImage(file, "team");
      setPreview(result.dataUrl);
      setCompressInfo(
        `${formatBytes(result.originalSize)} → ${formatBytes(result.compressedSize)} (${result.width}x${result.height})`
      );
    } catch (err) {
      setMessage("❌ Errore compressione immagine");
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
      const res = await fetch("/api/teams/photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          photoUrl: preview,
          photoTitle: photoTitle || null,
          photoDescription: photoDescription || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("✅ Foto squadra aggiornata!");
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
    <Card className="border-amber-500/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Camera size={16} /> 📸 Foto Squadra (Admin)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preview */}
          {preview && (
            <div className="relative">
              <img
                src={preview}
                alt="Anteprima"
                className="w-full aspect-video object-cover rounded-lg border border-border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7"
                onClick={clearPhoto}
              >
                <X size={14} />
              </Button>
            </div>
          )}

          {/* File upload */}
          <div>
            <Label className="text-xs">Carica Immagine</Label>
            <div className="mt-1 flex items-center gap-2">
              <Input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="text-xs"
              />
            </div>
            {compressInfo && (
              <p className="text-[10px] text-muted-foreground mt-1">📊 {compressInfo}</p>
            )}
          </div>

          {/* Title and Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Titolo Foto</Label>
              <Input
                value={photoTitle}
                onChange={(e) => setPhotoTitle(e.target.value)}
                placeholder="Es: Logo ufficiale"
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Descrizione Foto</Label>
              <Textarea
                value={photoDescription}
                onChange={(e) => setPhotoDescription(e.target.value)}
                placeholder="Es: La squadra al completo..."
                className="mt-1 text-sm min-h-[40px]"
                rows={1}
              />
            </div>
          </div>

          <Button type="submit" size="sm" disabled={loading} className="w-full">
            <Upload size={14} className="mr-2" />
            {loading ? "Caricando..." : "Salva Foto Squadra"}
          </Button>

          {message && <p className="text-xs text-center">{message}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
