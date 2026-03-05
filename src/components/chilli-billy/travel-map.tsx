"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { motion } from "framer-motion";

/* ── Types ── */

export interface MapPin {
  lat: number;
  lng: number;
  label: string | null;
  category: string | null;
  tripTitle: string;
  tripSlug: string;
}

interface TravelMapProps {
  pins: MapPin[];
}

/* ── Colours ── */

const categoryColors: Record<string, string> = {
  party: "#ef4444",
  chill: "#3b82f6",
  legendary: "#f59e0b",
};

const categoryLabels: Record<string, string> = {
  party: "🔥 Party",
  chill: "😎 Chill",
  legendary: "⭐ Legendary",
};

/* ── Custom pin icon ── */

function pinIcon(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
    <defs><filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.4"/></filter></defs>
    <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="${color}" filter="url(#s)"/>
    <circle cx="14" cy="14" r="6" fill="white" opacity="0.9"/>
  </svg>`;
  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -40],
  });
}

/* ── Component ── */

function TravelMapInner({ pins }: TravelMapProps) {
  // Group pins by lat+lng so overlapping trips share a popup
  const grouped = new Map<
    string,
    { lat: number; lng: number; category: string; items: { title: string; slug: string; label: string | null }[] }
  >();

  for (const p of pins) {
    const key = `${p.lat},${p.lng}`;
    if (!grouped.has(key)) {
      grouped.set(key, { lat: p.lat, lng: p.lng, category: p.category || "legendary", items: [] });
    }
    grouped.get(key)!.items.push({ title: p.tripTitle, slug: p.tripSlug, label: p.label });
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="w-full"
    >
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 justify-center">
        {Object.entries(categoryLabels).map(([key, label]) => (
          <div key={key} className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: categoryColors[key] }} />
            {label}
          </div>
        ))}
      </div>

      {/* Map */}
      <div className="w-full h-[300px] sm:h-[400px] lg:h-[500px] rounded-xl overflow-hidden border border-border">
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
          {Array.from(grouped.values()).map((g) => {
            const color = categoryColors[g.category] || "#f59e0b";
            return (
              <Marker key={`${g.lat},${g.lng}`} position={[g.lat, g.lng]} icon={pinIcon(color)}>
                <Popup className="dark-popup" maxWidth={220} closeButton>
                  <div style={{ minWidth: 160, fontFamily: "system-ui, sans-serif" }}>
                    {g.items.map((item, i) => (
                      <div key={i} style={{ marginBottom: g.items.length > 1 ? 8 : 0 }}>
                        <strong style={{ fontSize: 14, color: "#fff" }}>{item.title}</strong>
                        {item.label && (
                          <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{item.label}</div>
                        )}
                        <a
                          href={`/chilli-billy/${encodeURIComponent(item.slug)}`}
                          style={{
                            display: "block",
                            marginTop: 6,
                            padding: "6px 12px",
                            background: color,
                            color: "#fff",
                            borderRadius: 6,
                            textDecoration: "none",
                            fontSize: 12,
                            fontWeight: 600,
                            textAlign: "center",
                          }}
                        >
                          Apri viaggio
                        </a>
                      </div>
                    ))}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Dark popup styles */}
      <style jsx global>{`
        .dark-popup .leaflet-popup-content-wrapper {
          background: hsl(0 0% 10%);
          border: 1px solid hsl(0 0% 20%);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        }
        .dark-popup .leaflet-popup-tip {
          background: hsl(0 0% 10%);
          border: 1px solid hsl(0 0% 20%);
        }
        .dark-popup .leaflet-popup-close-button {
          color: #999 !important;
        }
        .dark-popup .leaflet-popup-close-button:hover {
          color: #fff !important;
        }
        .leaflet-control-zoom a {
          background: hsl(0 0% 10%) !important;
          color: #fff !important;
          border-color: hsl(0 0% 20%) !important;
        }
        .leaflet-control-zoom a:hover {
          background: hsl(0 0% 15%) !important;
        }
        .leaflet-control-attribution {
          background: hsl(0 0% 6% / 0.8) !important;
          color: #666 !important;
        }
        .leaflet-control-attribution a {
          color: #888 !important;
        }
      `}</style>
    </motion.section>
  );
}

export default TravelMapInner;
