"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MediaPicker } from "@/components/chilli-billy/media-picker";
import {
  MediaSettings,
  type MediaDisplaySettings,
} from "@/components/chilli-billy/media-settings";
import {
  Plus,
  Pencil,
  Trash2,
  ImageIcon,
  Film,
  LogIn,
  LogOut,
  Settings2,
  X,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface GalleryItem {
  path: string;
  fit: "COVER" | "CONTAIN";
  focalX: number;
  focalY: number;
}

interface HeroMediaData {
  path: string;
  fit: "COVER" | "CONTAIN";
  focalX: number;
  focalY: number;
}

interface TripMedia {
  id: string;
  kind: "IMAGE" | "VIDEO";
  path: string;
  fit?: "COVER" | "CONTAIN";
  focalX?: number;
  focalY?: number;
  caption?: string | null;
}

interface Trip {
  id: string;
  title: string;
  slug: string;
  location: string;
  startDate: string;
  endDate?: string | null;
  status: string;
  description: string;
  quote?: string | null;
  heroMedia?: TripMedia | null;
  media: TripMedia[];
}

interface FormState {
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  status: string;
  description: string;
  quote: string;
  heroMedia: HeroMediaData | null;
  galleryItems: GalleryItem[];
}

const emptyForm: FormState = {
  title: "",
  location: "",
  startDate: "",
  endDate: "",
  status: "IDEA",
  description: "",
  quote: "",
  heroMedia: null,
  galleryItems: [],
};

const statusOptions = [
  { value: "PAST", label: "✅ Fatto" },
  { value: "UPCOMING", label: "🔜 In Arrivo" },
  { value: "IDEA", label: "💡 Idea" },
];

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function ChilliBillyAdmin() {
  /* Auth */
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState("");
  const [authErr, setAuthErr] = useState("");

  /* Trips list */
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  /* Form */
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* Media picker */
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<"hero" | "gallery">("hero");

  /* Settings panels */
  const [showHeroSettings, setShowHeroSettings] = useState(false);
  const [editingGalleryIdx, setEditingGalleryIdx] = useState<number | null>(null);

  /* ---------- Auth ---------- */

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/check");
      setAuthed(res.ok);
    } catch {
      setAuthed(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogin = async () => {
    setAuthErr("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    if (res.ok) {
      setAuthed(true);
      setPin("");
    } else {
      setAuthErr("PIN errato");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
  };

  /* ---------- Fetch trips ---------- */

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/chilli-billy/trips");
      const data = await res.json();
      setTrips(Array.isArray(data) ? data : []);
    } catch {
      setTrips([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authed) fetchTrips();
  }, [authed, fetchTrips]);

  /* ---------- Edit helpers ---------- */

  const startEdit = (t: Trip) => {
    setEditId(t.id);
    setForm({
      title: t.title,
      location: t.location,
      startDate: t.startDate?.slice(0, 10) || "",
      endDate: t.endDate?.slice(0, 10) || "",
      status: t.status,
      description: t.description,
      quote: t.quote || "",
      heroMedia: t.heroMedia
        ? {
            path: t.heroMedia.path,
            fit: t.heroMedia.fit || "COVER",
            focalX: t.heroMedia.focalX ?? 50,
            focalY: t.heroMedia.focalY ?? 50,
          }
        : null,
      galleryItems: t.media.map((m) => ({
        path: m.path,
        fit: m.fit || "COVER",
        focalX: m.focalX ?? 50,
        focalY: m.focalY ?? 50,
      })),
    });
    setShowHeroSettings(false);
    setEditingGalleryIdx(null);
    setError("");
    setSuccess("");
  };

  const resetForm = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowHeroSettings(false);
    setEditingGalleryIdx(null);
    setError("");
    setSuccess("");
  };

  /* ---------- Save ---------- */

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setSaving(true);

    const payload = {
      title: form.title,
      location: form.location,
      startDate: form.startDate,
      endDate: form.endDate || null,
      status: form.status,
      description: form.description,
      quote: form.quote || null,
      heroMedia: form.heroMedia,
      galleryItems: form.galleryItems,
    };

    try {
      const url = editId
        ? `/api/chilli-billy/trips/${editId}`
        : "/api/chilli-billy/trips";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Errore salvataggio");
      }
      setSuccess(editId ? "Trip aggiornato!" : "Trip creato!");
      resetForm();
      fetchTrips();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Errore");
    }
    setSaving(false);
  };

  /* ---------- Delete ---------- */

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminare questo trip?")) return;
    await fetch(`/api/chilli-billy/trips/${id}`, { method: "DELETE" });
    fetchTrips();
  };

  /* ---------- Media picker callbacks ---------- */

  const openHeroPicker = () => {
    setPickerTarget("hero");
    setPickerOpen(true);
  };

  const openGalleryPicker = () => {
    setPickerTarget("gallery");
    setPickerOpen(true);
  };

  const handlePickerSelect = (paths: string[]) => {
    if (pickerTarget === "hero" && paths.length > 0) {
      setForm((f) => ({
        ...f,
        heroMedia: {
          path: paths[0],
          fit: f.heroMedia?.fit || "COVER",
          focalX: f.heroMedia?.focalX ?? 50,
          focalY: f.heroMedia?.focalY ?? 50,
        },
      }));
    } else if (pickerTarget === "gallery") {
      const newItems: GalleryItem[] = paths
        .filter((p) => !form.galleryItems.some((g) => g.path === p))
        .map((p) => ({ path: p, fit: "COVER" as const, focalX: 50, focalY: 50 }));
      setForm((f) => ({
        ...f,
        galleryItems: [...f.galleryItems, ...newItems],
      }));
    }
  };

  /* ---------- Rendering helpers ---------- */

  const isVideo = (path: string) => /\.(mp4|webm|mov)$/i.test(path);

  const renderThumb = (path: string, settings?: { fit: string; focalX: number; focalY: number }) => {
    const objFit = settings?.fit === "CONTAIN" ? "contain" : "cover";
    const objPos = settings?.fit === "COVER" ? `${settings.focalX}% ${settings.focalY}%` : undefined;

    if (isVideo(path)) {
      return (
        <video
          src={path}
          muted
          loop
          playsInline
          autoPlay
          className="w-full h-full"
          style={{ objectFit: objFit as "cover" | "contain", objectPosition: objPos }}
        />
      );
    }
    return (
      <Image
        src={path}
        alt=""
        fill
        style={{ objectFit: objFit as "cover" | "contain", objectPosition: objPos }}
        sizes="200px"
      />
    );
  };

  /* ================================================================ */
  /*  LOGIN SCREEN                                                     */
  /* ================================================================ */

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm space-y-4">
          <h1 className="text-xl font-bold text-center">🌶️ Admin - El Chilli Billy</h1>
          <div className="space-y-2">
            <Label>PIN</Label>
            <Input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Inserisci PIN"
            />
          </div>
          {authErr && <p className="text-sm text-red-400">{authErr}</p>}
          <Button onClick={handleLogin} className="w-full gap-2">
            <LogIn size={16} /> Accedi
          </Button>
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  ADMIN DASHBOARD                                                  */
  /* ================================================================ */

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🌶️ Gestione Trip</h1>
        <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1">
          <LogOut size={14} /> Esci
        </Button>
      </div>

      {/* ---- Form ---- */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <h2 className="text-lg font-bold">
          {editId ? "✏️ Modifica Trip" : "➕ Nuovo Trip"}
        </h2>

        {error && <p className="text-sm text-red-400 bg-red-400/10 rounded-lg p-2">{error}</p>}
        {success && <p className="text-sm text-green-400 bg-green-400/10 rounded-lg p-2">{success}</p>}

        {/* Basic fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Titolo *</Label>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Es: Napoli Trip" />
          </div>
          <div className="space-y-1">
            <Label>Location *</Label>
            <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Es: Napoli, Italia" />
          </div>
          <div className="space-y-1">
            <Label>Data Inizio *</Label>
            <Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Data Fine</Label>
            <Input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
          </div>
        </div>

        {/* Status */}
        <div className="space-y-1">
          <Label>Stato *</Label>
          <div className="flex gap-2">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, status: opt.value }))}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  form.status === opt.value
                    ? "bg-amber-500 text-black"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <Label>Descrizione *</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Racconta il trip..."
            rows={4}
          />
        </div>

        {/* Quote */}
        <div className="space-y-1">
          <Label>Quote (opzionale)</Label>
          <Input
            value={form.quote}
            onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
            placeholder="Una frase leggendaria..."
          />
        </div>

        {/* ---- Hero Media ---- */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Hero Media</Label>
            <Button variant="outline" size="sm" onClick={openHeroPicker} className="gap-1">
              <ImageIcon size={14} /> {form.heroMedia ? "Cambia" : "Scegli"}
            </Button>
          </div>

          {form.heroMedia && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {/* Thumbnail */}
                <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-border bg-black flex-shrink-0">
                  {renderThumb(form.heroMedia.path, form.heroMedia)}
                </div>

                {/* Info & controls */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{form.heroMedia.path}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {form.heroMedia.fit} · {form.heroMedia.focalX}%/{form.heroMedia.focalY}%
                  </p>
                </div>

                {/* Settings toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHeroSettings(!showHeroSettings)}
                  className="flex-shrink-0"
                >
                  <Settings2 size={14} />
                </Button>

                {/* Remove */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setForm((f) => ({ ...f, heroMedia: null }));
                    setShowHeroSettings(false);
                  }}
                  className="flex-shrink-0 text-red-400 hover:text-red-300"
                >
                  <X size={14} />
                </Button>
              </div>

              {/* Settings panel */}
              {showHeroSettings && (
                <MediaSettings
                  settings={{
                    path: form.heroMedia.path,
                    fit: form.heroMedia.fit,
                    focalX: form.heroMedia.focalX,
                    focalY: form.heroMedia.focalY,
                  }}
                  onChange={(s) =>
                    setForm((f) => ({
                      ...f,
                      heroMedia: f.heroMedia ? { ...f.heroMedia, fit: s.fit, focalX: s.focalX, focalY: s.focalY } : null,
                    }))
                  }
                  label="Impostazioni Hero"
                />
              )}
            </div>
          )}
        </div>

        {/* ---- Gallery ---- */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Gallery ({form.galleryItems.length})</Label>
            <Button variant="outline" size="sm" onClick={openGalleryPicker} className="gap-1">
              <Plus size={14} /> Aggiungi
            </Button>
          </div>

          {form.galleryItems.length > 0 && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {form.galleryItems.map((item, idx) => (
                  <div key={item.path} className="relative group">
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-border bg-black">
                      {renderThumb(item.path, item)}

                      {/* Overlay controls */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => setEditingGalleryIdx(editingGalleryIdx === idx ? null : idx)}
                          className="p-1.5 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
                          title="Impostazioni display"
                        >
                          <Settings2 size={14} className="text-white" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setForm((f) => ({
                              ...f,
                              galleryItems: f.galleryItems.filter((_, i) => i !== idx),
                            }));
                            if (editingGalleryIdx === idx) setEditingGalleryIdx(null);
                          }}
                          className="p-1.5 rounded-full bg-red-500/70 hover:bg-red-500 transition-colors"
                          title="Rimuovi"
                        >
                          <X size={14} className="text-white" />
                        </button>
                      </div>

                      {/* Kind icon */}
                      <div className="absolute top-1 left-1">
                        {isVideo(item.path) ? (
                          <Film size={12} className="text-white drop-shadow" />
                        ) : (
                          <ImageIcon size={12} className="text-white drop-shadow" />
                        )}
                      </div>

                      {/* Fit indicator */}
                      <div className="absolute top-1 right-1">
                        <span className="text-[9px] text-white/80 bg-black/50 rounded px-1">
                          {item.fit === "CONTAIN" ? "INT" : "RMP"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Gallery item settings panel */}
              {editingGalleryIdx !== null && form.galleryItems[editingGalleryIdx] && (
                <MediaSettings
                  settings={{
                    path: form.galleryItems[editingGalleryIdx].path,
                    fit: form.galleryItems[editingGalleryIdx].fit,
                    focalX: form.galleryItems[editingGalleryIdx].focalX,
                    focalY: form.galleryItems[editingGalleryIdx].focalY,
                  }}
                  onChange={(s) =>
                    setForm((f) => ({
                      ...f,
                      galleryItems: f.galleryItems.map((g, i) =>
                        i === editingGalleryIdx ? { ...g, fit: s.fit, focalX: s.focalX, focalY: s.focalY } : g
                      ),
                    }))
                  }
                  label={`Impostazioni — ${form.galleryItems[editingGalleryIdx].path.split("/").pop()}`}
                />
              )}
            </div>
          )}
        </div>

        {/* Save / Cancel */}
        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} disabled={saving} className="gap-1">
            {saving ? "Salvataggio..." : editId ? "Aggiorna" : "Crea Trip"}
          </Button>
          {editId && (
            <Button variant="outline" onClick={resetForm}>
              Annulla
            </Button>
          )}
        </div>
      </div>

      {/* ---- Trips list ---- */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold">📋 Trip esistenti ({trips.length})</h2>

        {loading ? (
          <p className="text-muted-foreground">Caricamento...</p>
        ) : trips.length === 0 ? (
          <p className="text-muted-foreground">Nessun trip presente.</p>
        ) : (
          <div className="space-y-3">
            {trips.map((t) => (
              <div
                key={t.id}
                className="bg-card border border-border rounded-xl p-4 flex items-center gap-4"
              >
                {/* Thumb */}
                <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-border bg-black flex-shrink-0">
                  {t.heroMedia ? (
                    renderThumb(t.heroMedia.path, {
                      fit: t.heroMedia.fit || "COVER",
                      focalX: t.heroMedia.focalX ?? 50,
                      focalY: t.heroMedia.focalY ?? 50,
                    })
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <ImageIcon size={16} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{t.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.location} · {t.media.length} media
                  </p>
                </div>

                {/* Status */}
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  {t.status}
                </Badge>

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(t)}>
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(t.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Media Picker modal */}
      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handlePickerSelect}
        selectedPaths={
          pickerTarget === "hero"
            ? form.heroMedia
              ? [form.heroMedia.path]
              : []
            : form.galleryItems.map((g) => g.path)
        }
        multiple={pickerTarget === "gallery"}
      />
    </div>
  );
}
