"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { tripLocations } from "@/lib/trip-locations";

/* ── Types ── */

export interface LocationMarker {
  lat: number;
  lng: number;
  label: string;
  category: string;
}

interface AdminTripMapProps {
  markers: LocationMarker[];
  onChange: (markers: LocationMarker[]) => void;
}

/* ── Pin icons ── */

const categoryColors: Record<string, string> = {
  party: "#ef4444",
  chill: "#3b82f6",
  legendary: "#f59e0b",
};

function numberedPinIcon(color: string, num: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
    <defs><filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.4"/></filter></defs>
    <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="${color}" filter="url(#s)"/>
    <circle cx="14" cy="14" r="8" fill="white" opacity="0.95"/>
    <text x="14" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="${color}" font-family="system-ui">${num}</text>
  </svg>`;
  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -40],
  });
}

function presetIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
    <circle cx="8" cy="8" r="6" fill="#f59e0b" opacity="0.5" stroke="#f59e0b" stroke-width="1"/>
  </svg>`;
  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10],
  });
}

/* ── Click handler ── */

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onMapClick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

/* ── Main component ── */

function AdminTripMapInner({ markers, onChange }: AdminTripMapProps) {
  const addMarker = (lat: number, lng: number, label?: string, category?: string) => {
    onChange([...markers, { lat, lng, label: label || `${lat.toFixed(4)}, ${lng.toFixed(4)}`, category: category || "legendary" }]);
  };

  const removeMarker = (index: number) => {
    onChange(markers.filter((_, i) => i !== index));
  };

  const updateMarkerPos = (index: number, lat: number, lng: number) => {
    onChange(markers.map((m, i) => (i === index ? { ...m, lat, lng } : m)));
  };

  const updateMarkerCategory = (index: number, category: string) => {
    onChange(markers.map((m, i) => (i === index ? { ...m, category } : m)));
  };

  const moveMarker = (from: number, to: number) => {
    if (to < 0 || to >= markers.length) return;
    const arr = [...markers];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    onChange(arr);
  };

  // Route path for preview
  const routePath: [number, number][] = markers.map((m) => [m.lat, m.lng]);

  return (
    <div className="space-y-3">
      {/* Preset quick-add buttons */}
      <div className="flex flex-wrap gap-1.5">
        {tripLocations
          .filter((loc) => !markers.some((m) => Math.abs(m.lat - loc.lat) < 0.01 && Math.abs(m.lng - loc.lng) < 0.01))
          .map((loc) => (
            <button
              key={loc.key}
              type="button"
              onClick={() => addMarker(loc.lat, loc.lng, `${loc.city}, ${loc.country}`, loc.category)}
              className="px-2 py-1 rounded-md text-xs bg-muted/50 border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              + {loc.name}
            </button>
          ))}
      </div>

      {/* Map */}
      <div className="w-full h-[300px] sm:h-[350px] rounded-xl overflow-hidden border border-border">
        <MapContainer
          center={[42, 12]}
          zoom={4}
          scrollWheelZoom
          className="w-full h-full"
          style={{ background: "hsl(0 0% 6%)" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={19}
          />
          <ClickHandler onMapClick={(lat, lng) => addMarker(lat, lng)} />

          {/* Route preview line */}
          {routePath.length >= 2 && (
            <Polyline
              positions={routePath}
              pathOptions={{ color: "#f59e0b", weight: 2, opacity: 0.5, dashArray: "6 8" }}
            />
          )}

          {/* Preset location hints */}
          {tripLocations
            .filter((loc) => !markers.some((m) => Math.abs(m.lat - loc.lat) < 0.01 && Math.abs(m.lng - loc.lng) < 0.01))
            .map((loc) => (
              <Marker
                key={loc.key}
                position={[loc.lat, loc.lng]}
                icon={presetIcon()}
                eventHandlers={{
                  click: (e) => {
                    L.DomEvent.stopPropagation(e.originalEvent);
                    addMarker(loc.lat, loc.lng, `${loc.city}, ${loc.country}`, loc.category);
                  },
                }}
              />
            ))}

          {/* Active markers (draggable, numbered) */}
          {markers.map((m, i) => {
            const color = categoryColors[m.category] || "#f59e0b";
            return (
              <Marker
                key={i}
                position={[m.lat, m.lng]}
                icon={numberedPinIcon(color, i + 1)}
                draggable
                eventHandlers={{
                  dragend: (e) => {
                    const pos = e.target.getLatLng();
                    updateMarkerPos(i, pos.lat, pos.lng);
                  },
                }}
              >
                <Popup className="dark-popup" maxWidth={200} closeButton>
                  <div style={{ fontFamily: "system-ui, sans-serif", minWidth: 140 }}>
                    <div style={{ fontSize: 12, color: "#fff", fontWeight: 600, marginBottom: 4 }}>#{i + 1} {m.label}</div>
                    <div style={{ fontSize: 10, color: "#aaa", marginBottom: 6 }}>
                      {m.lat.toFixed(4)}, {m.lng.toFixed(4)}
                    </div>
                    <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                      {(["party", "chill", "legendary"] as const).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => updateMarkerCategory(i, cat)}
                          style={{
                            padding: "2px 6px",
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 600,
                            border: m.category === cat ? `2px solid ${categoryColors[cat]}` : "1px solid #444",
                            background: m.category === cat ? categoryColors[cat] + "33" : "transparent",
                            color: categoryColors[cat],
                            cursor: "pointer",
                          }}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMarker(i)}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "4px 8px",
                        background: "#ef444433",
                        color: "#ef4444",
                        border: "1px solid #ef444466",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                        textAlign: "center",
                      }}
                    >
                      Rimuovi
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      <p className="text-xs text-muted-foreground">
        Clicca sulla mappa per aggiungere un pin. Trascina i pin per spostarli. Usa le frecce per riordinare la sequenza.
      </p>

      {/* Ordered marker list with reorder controls */}
      {markers.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground mb-1">Ordine tappe (sequenza sulla mappa):</p>
          {markers.map((m, i) => {
            const color = categoryColors[m.category] || "#f59e0b";
            return (
              <div
                key={i}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg border text-xs"
                style={{
                  background: color + "0d",
                  borderColor: color + "33",
                }}
              >
                <span className="font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: color + "33", color }}>
                  {i + 1}
                </span>
                <span className="flex-1 truncate" style={{ color }}>
                  📍 {m.label}
                </span>
                <div className="flex gap-0.5 shrink-0">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => moveMarker(i, i - 1)}
                    className="w-5 h-5 rounded flex items-center justify-center bg-muted/50 hover:bg-muted disabled:opacity-20 transition-colors text-[10px]"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={i === markers.length - 1}
                    onClick={() => moveMarker(i, i + 1)}
                    className="w-5 h-5 rounded flex items-center justify-center bg-muted/50 hover:bg-muted disabled:opacity-20 transition-colors text-[10px]"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    onClick={() => removeMarker(i)}
                    className="w-5 h-5 rounded flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors text-[10px]"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dark popup styles */}
      <style jsx global>{`
        .dark-popup .leaflet-popup-content-wrapper { background: hsl(0 0% 10%); border: 1px solid hsl(0 0% 20%); border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.5); }
        .dark-popup .leaflet-popup-tip { background: hsl(0 0% 10%); border: 1px solid hsl(0 0% 20%); }
        .dark-popup .leaflet-popup-close-button { color: #999 !important; }
        .dark-popup .leaflet-popup-close-button:hover { color: #fff !important; }
        .leaflet-control-zoom a { background: hsl(0 0% 10%) !important; color: #fff !important; border-color: hsl(0 0% 20%) !important; }
        .leaflet-control-zoom a:hover { background: hsl(0 0% 15%) !important; }
        .leaflet-control-attribution { background: hsl(0 0% 6% / 0.8) !important; color: #666 !important; }
        .leaflet-control-attribution a { color: #888 !important; }
      `}</style>
    </div>
  );
}

export default AdminTripMapInner;
