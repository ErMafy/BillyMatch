"use client";

import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";

/* ══════════════════════════════════════════════════════════════════
   DYNAMIC GLOBE IMPORT (WebGL - client only)
   ══════════════════════════════════════════════════════════════════ */

const GlobeView = dynamic(() => import("./globe-view"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4 mx-auto" />
        <span className="text-white/40 text-sm">Caricamento globo...</span>
      </div>
    </div>
  ),
});

/* ══════════════════════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════════════════════ */

interface TripLocationData {
  lat: number;
  lng: number;
  label: string | null;
  category: string | null;
  sequence?: number;
}

export interface TripData {
  id: string;
  title: string;
  slug: string;
  location: string;
  startDate: string;
  endDate?: string | null;
  status: "PAST" | "UPCOMING" | "IDEA";
  description: string;
  heroMedia?: { kind: "IMAGE" | "VIDEO"; path: string } | null;
  locations: TripLocationData[];
}

export interface Segment {
  type: "AIR" | "CAR";
  from: [number, number];
  to: [number, number];
  tripId: string;
}

interface TravelMapProps {
  trips: TripData[];
  focusedTripId?: string | null;
  onRequestFullscreen?: () => void;
  isFullscreen?: boolean;
}

/* ══════════════════════════════════════════════════════════════════
   COLOURS & ICONS
   ══════════════════════════════════════════════════════════════════ */

const AIR_COLOR = "#60a5fa";
const AIR_GLOW = "#3b82f6";
const CAR_COLOR = "#f59e0b";
const CAR_GLOW = "#d97706";
const HIGHLIGHT_AIR = "#93c5fd";
const HIGHLIGHT_CAR = "#fbbf24";
const DIM_OPACITY = 0.15;

const categoryColors: Record<string, string> = {
  party: "#ef4444",
  chill: "#3b82f6",
  legendary: "#f59e0b",
};

function pinIcon(color: string, highlighted = false) {
  const size = highlighted ? 34 : 28;
  const h = Math.round((size * 40) / 28);
  const cx = Math.round(size / 2);
  const cy = Math.round(size / 2);
  const r = Math.round((size * 6) / 28);
  const topR = Math.round((h * 6.27) / 40);
  const filterId = highlighted ? "g" : "s";
  const filter = highlighted
    ? `<filter id="g"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`
    : `<filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.4"/></filter>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${h}" viewBox="0 0 28 40">
    <defs>${filter}</defs>
    <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="${color}" filter="url(#${filterId})"/>
    <circle cx="14" cy="14" r="6" fill="white" opacity="0.9"/>
  </svg>`;
  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
    iconSize: [size, h],
    iconAnchor: [Math.round(size / 2), h],
    popupAnchor: [0, -h],
  });
}

function planeMarkerIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${AIR_COLOR}" stroke="white" stroke-width="0.5"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`;
  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function carMarkerIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="${CAR_COLOR}" stroke="white" stroke-width="0.5"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>`;
  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

/* ══════════════════════════════════════════════════════════════════
   COORDINATE UTILITIES
   ══════════════════════════════════════════════════════════════════ */

/** Coerce any value to a finite number; returns 0 as fallback. */
function safeNum(val: unknown): number {
  const n = Number(val);
  return isFinite(n) ? n : 0;
}

/** Validate a lat/lng pair. Logs a warning in dev for invalid values. */
function validCoord(lat: number, lng: number, id?: string): boolean {
  const ok =
    isFinite(lat) && lat >= -90 && lat <= 90 &&
    isFinite(lng) && lng >= -180 && lng <= 180;
  if (!ok && process.env.NODE_ENV === "development") {
    console.warn(`[TravelMap] Invalid coord lat=${lat} lng=${lng} id=${id}`);
  }
  return ok;
}

/* ══════════════════════════════════════════════════════════════════
   SEGMENT BUILDER
   ══════════════════════════════════════════════════════════════════ */

function buildSegments(trips: TripData[]): Segment[] {
  const sorted = [...trips]
    .filter((t) => t.locations.length > 0)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const segments: Segment[] = [];

  for (let ti = 0; ti < sorted.length; ti++) {
    const trip = sorted[ti];
    const locs = [...trip.locations].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));

    // CAR segments within trip
    for (let i = 0; i < locs.length - 1; i++) {
      const fLat = safeNum(locs[i].lat), fLng = safeNum(locs[i].lng);
      const tLat = safeNum(locs[i + 1].lat), tLng = safeNum(locs[i + 1].lng);
      if (!validCoord(fLat, fLng, trip.id) || !validCoord(tLat, tLng, trip.id)) continue;
      segments.push({
        type: "CAR",
        from: [fLat, fLng],
        to: [tLat, tLng],
        tripId: trip.id,
      });
    }

    // AIR segment to next trip
    if (ti < sorted.length - 1) {
      const nextTrip = sorted[ti + 1];
      const nextLocs = [...nextTrip.locations].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
      if (nextLocs.length > 0) {
        const fLat = safeNum(locs[locs.length - 1].lat), fLng = safeNum(locs[locs.length - 1].lng);
        const tLat = safeNum(nextLocs[0].lat), tLng = safeNum(nextLocs[0].lng);
        if (validCoord(fLat, fLng, trip.id) && validCoord(tLat, tLng, nextTrip.id)) {
          segments.push({
            type: "AIR",
            from: [fLat, fLng],
            to: [tLat, tLng],
            tripId: nextTrip.id,
          });
        }
      }
    }
  }
  return segments;
}

/* ══════════════════════════════════════════════════════════════════
   HAVERSINE DISTANCE (km)
   ══════════════════════════════════════════════════════════════════ */

function haverDist(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = (b[0] - a[0]) * Math.PI / 180;
  const dLng = (b[1] - a[1]) * Math.PI / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/* ══════════════════════════════════════════════════════════════════
   FLY-TO CONTROLLER (timeline sync)
   ══════════════════════════════════════════════════════════════════ */

function FlyToTrip({
  trips,
  focusedTripId,
}: {
  trips: TripData[];
  focusedTripId: string | null | undefined;
}) {
  const map = useMap();
  const prevRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (focusedTripId === prevRef.current) return;
    prevRef.current = focusedTripId;

    if (!focusedTripId) {
      // Zoom out to show all routes
      const allLocs = trips
        .filter((t) => t.locations.length > 0)
        .flatMap((t) => t.locations);
      if (allLocs.length === 0) return;
      const bounds = L.latLngBounds(allLocs.map((l) => [l.lat, l.lng] as [number, number]));
      map.flyToBounds(bounds, { padding: [60, 60], duration: 1.5, maxZoom: 6 });
    } else {
      const trip = trips.find((t) => t.id === focusedTripId);
      if (!trip || trip.locations.length === 0) return;
      if (trip.locations.length === 1) {
        map.flyTo([trip.locations[0].lat, trip.locations[0].lng], 8, { duration: 1.2 });
      } else {
        const bounds = L.latLngBounds(
          trip.locations.map((l) => [l.lat, l.lng] as [number, number])
        );
        map.flyToBounds(bounds, { padding: [80, 80], duration: 1.2, maxZoom: 10 });
      }
    }
  }, [focusedTripId, trips, map]);

  return null;
}

/* ══════════════════════════════════════════════════════════════════
   ANIMATED MOVING MARKER (single sequential loop)
   ══════════════════════════════════════════════════════════════════ */

const TRAIL_LEN = 14;
const TIP_LEN = 4;
// Timing: AIR total saga ~20 s proportional to distance, CAR each segment ~12 s
const AIR_TOTAL_MS = 20000;
const CAR_SEG_MS = 12000;

function MovingMarker({
  segments,
  highlightTripId,
}: {
  segments: Segment[];
  highlightTripId: string | null;
}) {
  const map = useMap();
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (segments.length === 0) return;

    const activeSegs = highlightTripId
      ? segments.filter((s) => s.tripId === highlightTripId)
      : segments;
    if (activeSegs.length === 0) return;

    // Drop any segment whose endpoints fail coordinate validation
    const validSegs = activeSegs.filter(
      (s) => validCoord(s.from[0], s.from[1]) && validCoord(s.to[0], s.to[1])
    );
    if (validSegs.length === 0) return;

    // Per-segment animation durations
    // AIR: proportional to real distance so all air segments together = AIR_TOTAL_MS
    // CAR: fixed CAR_SEG_MS per segment
    const airSegs = validSegs.filter((s) => s.type === "AIR");
    const totalAirDist = airSegs.reduce(
      (sum, s) => sum + Math.max(haverDist(s.from, s.to), 0.001),
      0
    );
    const segDurations = validSegs.map((s) => {
      if (s.type === "AIR") {
        const d = Math.max(haverDist(s.from, s.to), 0.001);
        return totalAirDist > 0 ? (d / totalAirDist) * AIR_TOTAL_MS : AIR_TOTAL_MS;
      }
      return CAR_SEG_MS;
    });
    const sagaTotalMs = Math.max(segDurations.reduce((a, b) => a + b, 0), 1);

    // Pre-compute and cache arc paths for all AIR segments
    const arcCache = new Map<number, [number, number][]>();
    validSegs.forEach((s, idx) => {
      if (s.type === "AIR") arcCache.set(idx, arcPath(s.from, s.to, 40));
    });

    // Markers
    const airM = L.marker([0, 0], { icon: planeMarkerIcon(), interactive: false }).addTo(map);
    const carM = L.marker([0, 0], { icon: carMarkerIcon(), interactive: false }).addTo(map);
    airM.setOpacity(0);
    carM.setOpacity(0);

    // Comet trail layers – AIR
    const airBg = L.polyline([], {
      color: AIR_COLOR, weight: 4, opacity: 0.15, lineCap: "round", lineJoin: "round",
    }).addTo(map);
    const airFg = L.polyline([], {
      color: AIR_COLOR, weight: 2.5, opacity: 0.45, lineCap: "round", lineJoin: "round",
    }).addTo(map);
    const airTip = L.polyline([], {
      color: HIGHLIGHT_AIR, weight: 2, opacity: 0.85, lineCap: "round", lineJoin: "round",
    }).addTo(map);

    // Comet trail layers – CAR
    const carBg = L.polyline([], {
      color: CAR_COLOR, weight: 4, opacity: 0.15, lineCap: "round", lineJoin: "round",
    }).addTo(map);
    const carFg = L.polyline([], {
      color: CAR_COLOR, weight: 2.5, opacity: 0.4, lineCap: "round", lineJoin: "round",
    }).addTo(map);
    const carTip = L.polyline([], {
      color: HIGHLIGHT_CAR, weight: 2, opacity: 0.8, lineCap: "round", lineJoin: "round",
    }).addTo(map);

    const airTrail: [number, number][] = [];
    const carTrail: [number, number][] = [];
    let prevSegIdx = -1;
    const startT = performance.now();

    const tick = (now: number) => {
      const elapsed = (now - startT) % sagaTotalMs;

      // Locate current segment and progress within it
      let acc = 0;
      let segIdx = validSegs.length - 1;
      let segProgress = 1;
      for (let i = 0; i < validSegs.length; i++) {
        const dur = segDurations[i];
        if (elapsed < acc + dur) {
          segIdx = i;
          segProgress = dur > 0 ? (elapsed - acc) / dur : 0;
          break;
        }
        acc += dur;
      }
      segProgress = Math.max(0, Math.min(1, segProgress));

      const seg = validSegs[segIdx];

      // Clear trails whenever we move to a new segment
      if (segIdx !== prevSegIdx) {
        airTrail.length = 0;
        carTrail.length = 0;
        prevSegIdx = segIdx;
      }

      // Compute position for this frame
      let pos: [number, number] | null = null;
      if (seg.type === "AIR") {
        const arcPts = arcCache.get(segIdx);
        if (!arcPts || arcPts.length < 2) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        const arcIdx = Math.max(
          0,
          Math.min(Math.floor(segProgress * arcPts.length), arcPts.length - 1)
        );
        pos = arcPts[arcIdx] ?? null;
      } else {
        const lat = seg.from[0] + (seg.to[0] - seg.from[0]) * segProgress;
        const lng = seg.from[1] + (seg.to[1] - seg.from[1]) * segProgress;
        pos = [lat, lng];
      }

      // Guard: never pass invalid coords to Leaflet
      if (!pos || !Number.isFinite(pos[0]) || !Number.isFinite(pos[1])) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[MovingMarker] Invalid pos skipped:", pos, "seg:", segIdx);
        }
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // Exactly ONE marker visible; the other is hidden
      if (seg.type === "AIR") {
        airM.setLatLng(pos);
        airM.setOpacity(1);
        carM.setOpacity(0);
        airTrail.push(pos);
        if (airTrail.length > TRAIL_LEN) airTrail.shift();
        airBg.setLatLngs([...airTrail]);
        airFg.setLatLngs(airTrail.slice(-Math.floor(TRAIL_LEN / 2)));
        airTip.setLatLngs(airTrail.slice(-TIP_LEN));
        carBg.setLatLngs([]);
        carFg.setLatLngs([]);
        carTip.setLatLngs([]);
      } else {
        carM.setLatLng(pos);
        carM.setOpacity(1);
        airM.setOpacity(0);
        carTrail.push(pos);
        if (carTrail.length > TRAIL_LEN) carTrail.shift();
        carBg.setLatLngs([...carTrail]);
        carFg.setLatLngs(carTrail.slice(-Math.floor(TRAIL_LEN / 2)));
        carTip.setLatLngs(carTrail.slice(-TIP_LEN));
        airBg.setLatLngs([]);
        airFg.setLatLngs([]);
        airTip.setLatLngs([]);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      [airM, carM, airBg, airFg, airTip, carBg, carFg, carTip].forEach((layer) => {
        try { map.removeLayer(layer); } catch { /* ignore */ }
      });
    };
  }, [map, segments, highlightTripId]);

  return null;
}

/* ══════════════════════════════════════════════════════════════════
   PREVIEW CARDS
   ══════════════════════════════════════════════════════════════════ */

const statusLabels: Record<string, string> = { PAST: "✅ Fatto", UPCOMING: "🔜 In Arrivo", IDEA: "💡 Idea" };
const statusColors: Record<string, string> = {
  PAST: "bg-green-500/20 text-green-400 border-green-500/30",
  UPCOMING: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  IDEA: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

function TripPreviewCard({ trip, onClose }: { trip: TripData; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
      className="absolute top-3 right-3 z-[1000] w-64 bg-[hsl(0,0%,8%)] border border-[hsl(0,0%,18%)] rounded-xl shadow-2xl overflow-hidden hidden md:block"
    >
      {trip.heroMedia && (
        <div className="w-full h-32 relative overflow-hidden">
          {trip.heroMedia.kind === "VIDEO" ? (
            <video src={trip.heroMedia.path} muted autoPlay loop playsInline className="w-full h-full object-cover" />
          ) : (
            <img src={trip.heroMedia.path} alt={trip.title} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0,0%,8%)] to-transparent" />
        </div>
      )}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-white leading-tight">{trip.title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors shrink-0">✕</button>
        </div>
        <p className="text-xs text-gray-400">{trip.location}</p>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusColors[trip.status] || ""}`}>
            {statusLabels[trip.status]}
          </span>
          <span className="text-[10px] text-gray-500">
            {new Date(trip.startDate).toLocaleDateString("it-IT", { month: "short", year: "numeric" })}
          </span>
        </div>
        <p className="text-xs text-gray-400 line-clamp-2">{trip.description}</p>
        <a href={`/chilli-billy/${encodeURIComponent(trip.slug)}`}
          className="block text-center text-xs font-semibold py-2 rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-colors">
          Apri viaggio →
        </a>
      </div>
    </motion.div>
  );
}

function MobileBottomSheet({ trip, onClose }: { trip: TripData; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
      className="absolute bottom-0 left-0 right-0 z-[1000] bg-[hsl(0,0%,8%)] border-t border-[hsl(0,0%,18%)] rounded-t-xl shadow-2xl p-4 md:hidden"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-white">{trip.title}</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">✕</button>
      </div>
      <p className="text-xs text-gray-400 mb-2">
        {trip.location} · {statusLabels[trip.status]} ·{" "}
        {new Date(trip.startDate).toLocaleDateString("it-IT", { month: "short", year: "numeric" })}
      </p>
      <a href={`/chilli-billy/${encodeURIComponent(trip.slug)}`}
        className="block text-center text-xs font-semibold py-2 rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-colors">
        Apri viaggio →
      </a>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ARC PATH (curved air routes)
   ══════════════════════════════════════════════════════════════════ */

function arcPath(from: [number, number], to: [number, number], points = 40): [number, number][] {
  const path: [number, number][] = [];
  const midLat = (from[0] + to[0]) / 2;
  const midLng = (from[1] + to[1]) / 2;
  const dx = to[1] - from[1];
  const dy = to[0] - from[0];
  const offsetLat = midLat + -dx * 0.15;
  const offsetLng = midLng + dy * 0.15;
  for (let i = 0; i <= points; i++) {
    const t = i / points;
    const lat = (1 - t) * (1 - t) * from[0] + 2 * (1 - t) * t * offsetLat + t * t * to[0];
    const lng = (1 - t) * (1 - t) * from[1] + 2 * (1 - t) * t * offsetLng + t * t * to[1];
    path.push([lat, lng]);
  }
  return path;
}

/* ══════════════════════════════════════════════════════════════════
   ROUTE COMPONENTS
   ══════════════════════════════════════════════════════════════════ */

function AnimatedAirRoute({ from, to, highlighted, dimmed }: { from: [number, number]; to: [number, number]; highlighted: boolean; dimmed: boolean }) {
  const path = useMemo(() => arcPath(from, to), [from, to]);
  const opacity = dimmed ? DIM_OPACITY : highlighted ? 1 : 0.7;
  const glowOp = dimmed ? 0.02 : highlighted ? 0.5 : 0.2;
  return (
    <>
      <Polyline positions={path} pathOptions={{ color: highlighted ? HIGHLIGHT_AIR : AIR_GLOW, weight: 8, opacity: glowOp, lineCap: "round", lineJoin: "round" }} />
      <Polyline positions={path} pathOptions={{ color: highlighted ? HIGHLIGHT_AIR : AIR_COLOR, weight: 2.5, opacity, dashArray: "8 12", lineCap: "round", lineJoin: "round", className: dimmed ? "" : "air-route-animated" }} />
      {!dimmed && (
        <>
          <CircleMarker center={from} radius={highlighted ? 5 : 3} pathOptions={{ color: AIR_COLOR, fillColor: AIR_COLOR, fillOpacity: 0.8, weight: 0 }} />
          <CircleMarker center={to} radius={highlighted ? 5 : 3} pathOptions={{ color: AIR_COLOR, fillColor: AIR_COLOR, fillOpacity: 0.8, weight: 0 }} />
        </>
      )}
    </>
  );
}

function CarRoute({ from, to, highlighted, dimmed }: { from: [number, number]; to: [number, number]; highlighted: boolean; dimmed: boolean }) {
  const opacity = dimmed ? DIM_OPACITY : highlighted ? 1 : 0.75;
  const glowOp = dimmed ? 0.02 : highlighted ? 0.35 : 0.12;
  const positions: [number, number][] = [from, to];
  return (
    <>
      <Polyline positions={positions} pathOptions={{ color: highlighted ? HIGHLIGHT_CAR : CAR_GLOW, weight: 7, opacity: glowOp, lineCap: "round", lineJoin: "round" }} />
      <Polyline positions={positions} pathOptions={{ color: highlighted ? HIGHLIGHT_CAR : CAR_COLOR, weight: 3, opacity, lineCap: "round", lineJoin: "round" }} />
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN MAP COMPONENT
   ══════════════════════════════════════════════════════════════════ */

type ViewMode = "globe" | "map";

function TravelMapInner({ trips, focusedTripId, onRequestFullscreen, isFullscreen }: TravelMapProps) {
  const [mode, setMode] = useState<ViewMode>("globe");
  const [highlightTripId, setHighlightTripId] = useState<string | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<TripData | null>(null);

  // Switch to 2D map if WebGL fails
  const handleWebGLFail = useCallback(() => {
    setMode("map");
  }, []);

  const sortedTrips = useMemo(
    () => [...trips].filter((t) => t.locations.length > 0).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
    [trips]
  );

  const segments = useMemo(() => buildSegments(trips), [trips]);

  // Group pins by lat+lng
  const groupedPins = useMemo(() => {
    const m = new Map<string, { lat: number; lng: number; category: string; trips: TripData[] }>();
    for (const trip of sortedTrips) {
      for (const loc of trip.locations) {
        const lat = safeNum(loc.lat);
        const lng = safeNum(loc.lng);
        if (!validCoord(lat, lng, trip.id)) continue;
        const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
        if (!m.has(key)) m.set(key, { lat, lng, category: loc.category || "legendary", trips: [] });
        const g = m.get(key)!;
        if (!g.trips.find((t) => t.id === trip.id)) g.trips.push(trip);
      }
    }
    return Array.from(m.values());
  }, [sortedTrips]);

  const handleMarkerClick = useCallback((trip: TripData) => { setHighlightTripId(trip.id); setSelectedTrip(trip); }, []);
  const handleMarkerHover = useCallback((tripId: string | null) => { setHighlightTripId(tripId); }, []);
  const clearSelection = useCallback(() => { setHighlightTripId(null); setSelectedTrip(null); }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className={`w-full${isFullscreen ? " h-full flex flex-col" : ""}`}
    >
      {/* Legend – hidden in fullscreen (top bar already labels the map) */}
      {!isFullscreen && (
        <div className="flex flex-wrap gap-4 mb-4 justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-block w-6 border-t-2 border-dashed" style={{ borderColor: AIR_COLOR }} />
            ✈️ Rotta aerea
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-block w-6 border-t-2" style={{ borderColor: CAR_COLOR }} />
            🚗 Rotta terrestre
          </div>
        </div>
      )}

      {/* Map container with vignette */}
      <div className={`relative w-full overflow-hidden${isFullscreen ? " flex-1 min-h-0" : " h-[320px] sm:h-[420px] lg:h-[520px] rounded-xl border border-border"}`}>
        
        {/* Mode Toggle - Top Right */}
        <div className="absolute top-3 right-3 z-[600] flex gap-1 bg-black/80 backdrop-blur-sm rounded-lg p-1 border border-white/10">
          <button
            onClick={() => setMode("globe")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              mode === "globe"
                ? "bg-amber-500 text-black"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            🌍 Globo
          </button>
          <button
            onClick={() => setMode("map")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              mode === "map"
                ? "bg-amber-500 text-black"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            🗺 Mappa
          </button>
        </div>

        {/* Vignette overlay (only for 2D map mode) */}
        {mode === "map" && (
          <div className="absolute inset-0 z-[500] pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        )}

        {/* 3D Globe View */}
        <AnimatePresence mode="wait">
          {mode === "globe" && (
            <motion.div
              key="globe"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
            >
              <GlobeView trips={trips} onWebGLFail={handleWebGLFail} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2D Leaflet Map */}
        <AnimatePresence mode="wait">
          {mode === "map" && (
            <motion.div
              key="leaflet"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
            >
              <MapContainer center={[42, 12]} zoom={4} scrollWheelZoom className="w-full h-full" style={{ background: "hsl(0 0% 6%)" }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  subdomains="abcd"
                  maxZoom={19}
                />

                {/* Route segments */}
                {segments.map((seg, i) => {
                  const hl = highlightTripId === seg.tripId;
                  const dim = highlightTripId !== null && !hl;
                  return seg.type === "AIR"
                    ? <AnimatedAirRoute key={`a${i}`} from={seg.from} to={seg.to} highlighted={hl} dimmed={dim} />
                    : <CarRoute key={`c${i}`} from={seg.from} to={seg.to} highlighted={hl} dimmed={dim} />;
                })}

                {/* Moving marker */}
                <MovingMarker segments={segments} highlightTripId={highlightTripId} />

                {/* Timeline-driven fly-to */}
                <FlyToTrip trips={sortedTrips} focusedTripId={focusedTripId} />

                {/* Pin markers */}
                {groupedPins.map((g) => {
                  const firstTrip = g.trips[0];
                  const isHl = g.trips.some((t) => t.id === highlightTripId);
                  const isDim = highlightTripId !== null && !isHl;
                  const color = categoryColors[g.category] || "#f59e0b";
                  return (
                    <Marker
                      key={`${g.lat},${g.lng}`}
                      position={[g.lat, g.lng]}
                      icon={pinIcon(color, isHl)}
                      opacity={isDim ? 0.3 : 1}
                      eventHandlers={{
                        click: () => handleMarkerClick(firstTrip),
                        mouseover: () => handleMarkerHover(firstTrip.id),
                        mouseout: () => { if (!selectedTrip) handleMarkerHover(null); },
                      }}
                    >
                      <Popup className="dark-popup" maxWidth={220} closeButton>
                        <div style={{ minWidth: 160, fontFamily: "system-ui, sans-serif" }}>
                          {g.trips.map((trip, i) => (
                            <div key={trip.id} style={{ marginBottom: g.trips.length > 1 && i < g.trips.length - 1 ? 10 : 0 }}>
                              <strong style={{ fontSize: 14, color: "#fff" }}>{trip.title}</strong>
                              <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{trip.location}</div>
                              <div style={{ fontSize: 10, color: "#666", marginTop: 1 }}>
                                {new Date(trip.startDate).toLocaleDateString("it-IT", { month: "short", year: "numeric" })}
                              </div>
                              <a href={`/chilli-billy/${encodeURIComponent(trip.slug)}`}
                                style={{ display: "block", marginTop: 6, padding: "6px 12px", background: "#f59e0b", color: "#000", borderRadius: 6, textDecoration: "none", fontSize: 12, fontWeight: 600, textAlign: "center" }}>
                                Apri viaggio →
                              </a>
                            </div>
                          ))}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop preview card (2D map only) */}
        {mode === "map" && selectedTrip && <TripPreviewCard trip={selectedTrip} onClose={clearSelection} />}
        {/* Mobile bottom sheet (2D map only) */}
        {mode === "map" && selectedTrip && <MobileBottomSheet trip={selectedTrip} onClose={clearSelection} />}

        {/* Fullscreen button – only shown when not already in fullscreen */}
        {onRequestFullscreen && !isFullscreen && (
          <button
            onClick={onRequestFullscreen}
            className="absolute bottom-3 left-3 z-[600] flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/70 border border-white/10 text-white/80 text-xs font-medium hover:bg-black/90 hover:text-white transition-all backdrop-blur-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            Espandi
          </button>
        )}
      </div>

      {/* Styles */}
      <style jsx global>{`
        .dark-popup .leaflet-popup-content-wrapper { background: hsl(0 0% 10%); border: 1px solid hsl(0 0% 20%); border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.5); }
        .dark-popup .leaflet-popup-tip { background: hsl(0 0% 10%); border: 1px solid hsl(0 0% 20%); }
        .dark-popup .leaflet-popup-close-button { color: #999 !important; }
        .dark-popup .leaflet-popup-close-button:hover { color: #fff !important; }
        .leaflet-control-zoom a { background: hsl(0 0% 10%) !important; color: #fff !important; border-color: hsl(0 0% 20%) !important; }
        .leaflet-control-zoom a:hover { background: hsl(0 0% 15%) !important; }
        .leaflet-control-attribution { background: hsl(0 0% 6% / 0.8) !important; color: #666 !important; }
        .leaflet-control-attribution a { color: #888 !important; }
        @keyframes dash-flow { to { stroke-dashoffset: -80; } }
        .air-route-animated { animation: dash-flow 9s linear infinite; }
      `}</style>
    </motion.section>
  );
}

export default TravelMapInner;
