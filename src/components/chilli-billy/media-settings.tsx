"use client";

import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Crosshair } from "lucide-react";

export interface MediaDisplaySettings {
  path: string;
  fit: "COVER" | "CONTAIN";
  focalX: number;
  focalY: number;
}

interface MediaSettingsProps {
  settings: MediaDisplaySettings;
  onChange: (settings: MediaDisplaySettings) => void;
  label?: string;
}

const focalPresets = [
  { label: "Centro", x: 50, y: 50 },
  { label: "Alto", x: 50, y: 20 },
  { label: "Basso", x: 50, y: 80 },
  { label: "Sinistra", x: 20, y: 50 },
  { label: "Destra", x: 80, y: 50 },
];

export function MediaSettings({ settings, onChange, label }: MediaSettingsProps) {
  const isVideo = /\.(mp4|webm|mov)$/i.test(settings.path);
  const objectPosition = `${settings.focalX}% ${settings.focalY}%`;

  return (
    <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border">
      {label && <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>}

      {/* Live preview */}
      <div className="relative aspect-video rounded-md overflow-hidden border border-border bg-black">
        {isVideo ? (
          <video
            src={settings.path}
            muted
            loop
            playsInline
            autoPlay
            className="w-full h-full transition-all duration-200"
            style={{
              objectFit: settings.fit === "CONTAIN" ? "contain" : "cover",
              objectPosition: settings.fit === "COVER" ? objectPosition : undefined,
            }}
          />
        ) : (
          <Image
            src={settings.path}
            alt="Preview"
            fill
            className="transition-all duration-200"
            style={{
              objectFit: settings.fit === "CONTAIN" ? "contain" : "cover",
              objectPosition: settings.fit === "COVER" ? objectPosition : undefined,
            }}
            sizes="200px"
          />
        )}
        {/* Focal point indicator (only for COVER) */}
        {settings.fit === "COVER" && (
          <div
            className="absolute w-4 h-4 pointer-events-none transition-all duration-200"
            style={{
              left: `calc(${settings.focalX}% - 8px)`,
              top: `calc(${settings.focalY}% - 8px)`,
            }}
          >
            <Crosshair size={16} className="text-amber-400 drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]" />
          </div>
        )}
      </div>

      {/* Fit toggle */}
      <div className="space-y-1">
        <Label className="text-xs">Adattamento</Label>
        <div className="flex gap-1">
          {(["COVER", "CONTAIN"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onChange({ ...settings, fit: f })}
              className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                settings.fit === f
                  ? "bg-amber-500 text-black"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "COVER" ? "Riempi" : "Intero"}
            </button>
          ))}
        </div>
      </div>

      {/* Focal point controls (only for COVER) */}
      {settings.fit === "COVER" && (
        <div className="space-y-2">
          <Label className="text-xs">Punto focale</Label>

          {/* Presets */}
          <div className="flex gap-1 flex-wrap">
            {focalPresets.map((p) => {
              const active = settings.focalX === p.x && settings.focalY === p.y;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => onChange({ ...settings, focalX: p.x, focalY: p.y })}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                    active
                      ? "bg-amber-500/80 text-black"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Sliders */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <label className="text-[10px] text-muted-foreground">X: {settings.focalX}%</label>
              <input
                type="range"
                min={0}
                max={100}
                value={settings.focalX}
                onChange={(e) => onChange({ ...settings, focalX: Number(e.target.value) })}
                className="w-full h-1.5 accent-amber-500"
              />
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] text-muted-foreground">Y: {settings.focalY}%</label>
              <input
                type="range"
                min={0}
                max={100}
                value={settings.focalY}
                onChange={(e) => onChange({ ...settings, focalY: Number(e.target.value) })}
                className="w-full h-1.5 accent-amber-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
