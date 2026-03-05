"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, ImageIcon, Film, X } from "lucide-react";

interface MediaOption {
  kind: "IMAGE" | "VIDEO";
  path: string;
  filename: string;
  used: boolean;
}

interface MediaPickerProps {
  onSelect: (paths: string[]) => void;
  selectedPaths: string[];
  multiple?: boolean;
  open: boolean;
  onClose: () => void;
}

export function MediaPicker({ onSelect, selectedPaths, multiple = false, open, onClose }: MediaPickerProps) {
  const [media, setMedia] = useState<MediaOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUsed, setShowUsed] = useState(false);
  const [selected, setSelected] = useState<string[]>(selectedPaths);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/chilli-billy/media?showUsed=${showUsed}`);
      const data = await res.json();
      setMedia(Array.isArray(data) ? data : []);
    } catch {
      setMedia([]);
    }
    setLoading(false);
  }, [showUsed]);

  useEffect(() => {
    if (open) {
      fetchMedia();
      setSelected(selectedPaths);
    }
  }, [open, showUsed, fetchMedia, selectedPaths]);

  if (!open) return null;

  const toggleItem = (path: string) => {
    if (multiple) {
      setSelected((prev) =>
        prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
      );
    } else {
      setSelected([path]);
    }
  };

  const handleConfirm = () => {
    onSelect(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl w-full max-w-3xl max-h-[80vh] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold">Media Picker</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="show-used"
                checked={showUsed}
                onCheckedChange={setShowUsed}
              />
              <Label htmlFor="show-used" className="text-xs text-muted-foreground">
                Mostra usati
              </Label>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Caricamento...</p>
          ) : media.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nessun media disponibile. Aggiungi file in /public/chilli-billy/
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {media.map((item) => {
                const isSelected = selected.includes(item.path);
                const isUsed = item.used;
                return (
                  <button
                    key={item.path}
                    onClick={() => !isUsed && toggleItem(item.path)}
                    disabled={isUsed}
                    className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected
                        ? "border-amber-500 ring-2 ring-amber-500/30"
                        : isUsed
                          ? "border-border opacity-40 cursor-not-allowed"
                          : "border-border hover:border-muted-foreground cursor-pointer"
                    }`}
                  >
                    {item.kind === "IMAGE" ? (
                      <Image
                        src={item.path}
                        alt={item.filename}
                        fill
                        className="object-cover"
                        sizes="200px"
                      />
                    ) : (
                      <video
                        src={item.path}
                        muted
                        loop
                        playsInline
                        autoPlay
                        className="w-full h-full object-cover"
                      />
                    )}

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/20" />

                    {/* Kind badge */}
                    <div className="absolute top-1 left-1">
                      {item.kind === "IMAGE" ? (
                        <ImageIcon size={14} className="text-white drop-shadow" />
                      ) : (
                        <Film size={14} className="text-white drop-shadow" />
                      )}
                    </div>

                    {/* Selected check */}
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-amber-500 rounded-full p-0.5">
                        <Check size={12} className="text-black" />
                      </div>
                    )}

                    {/* Used badge */}
                    {isUsed && (
                      <Badge variant="secondary" className="absolute bottom-1 left-1 text-[10px]">
                        In uso
                      </Badge>
                    )}

                    {/* Filename */}
                    <p className="absolute bottom-1 right-1 text-[10px] text-white/80 bg-black/50 rounded px-1 truncate max-w-[80%]">
                      {item.filename}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t">
          <p className="text-xs text-muted-foreground">
            {selected.length} selezionat{selected.length === 1 ? "o" : "i"}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Annulla
            </Button>
            <Button size="sm" onClick={handleConfirm} disabled={selected.length === 0}>
              Conferma
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
