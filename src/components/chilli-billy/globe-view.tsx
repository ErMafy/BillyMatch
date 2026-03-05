"use client";
// This module is ONLY ever loaded via dynamic({ ssr: false }) from the parent,
// so direct imports of react-globe.gl (which requires WebGL/DOM) are safe here.

import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { TripData } from "./travel-map";

/* ══════════════════════════════════════════════════════════════════
   CONSTANTS
   ══════════════════════════════════════════════════════════════════ */

const AIR_COLOR = "#60a5fa";
const AIR_GLOW = "rgba(96, 165, 250, 0.6)";
const CAR_COLOR = "#f59e0b";
const CAR_GLOW = "rgba(245, 158, 11, 0.5)";
const MARKER_COLOR = "#f59e0b";

/* ══════════════════════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════════════════════ */

interface ArcDatum {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
  stroke: number;
  type: "AIR" | "CAR";
}

interface PointDatum {
  lat: number;
  lng: number;
  label: string;
  tripSlug: string;
  tripTitle: string;
  color: string;
  size: number;
}

interface GlobeViewProps {
  trips: TripData[];
  onWebGLFail?: () => void;
}

/* ══════════════════════════════════════════════════════════════════
   COORDINATE VALIDATION
   ══════════════════════════════════════════════════════════════════ */

function validCoord(lat: number, lng: number): boolean {
  return (
    isFinite(lat) && lat >= -90 && lat <= 90 &&
    isFinite(lng) && lng >= -180 && lng <= 180
  );
}

/* ══════════════════════════════════════════════════════════════════
   DATA BUILDER
   ══════════════════════════════════════════════════════════════════ */

function buildGlobeData(trips: TripData[]) {
  const sorted = [...trips]
    .filter((t) => t.locations.length > 0)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const arcs: ArcDatum[] = [];
  const points: PointDatum[] = [];
  const seen = new Set<string>();

  for (let ti = 0; ti < sorted.length; ti++) {
    const trip = sorted[ti];
    const locs = [...trip.locations].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));

    // CAR arcs within trip (smaller, orange)
    for (let i = 0; i < locs.length - 1; i++) {
      if (!validCoord(locs[i].lat, locs[i].lng) || !validCoord(locs[i + 1].lat, locs[i + 1].lng)) continue;
      arcs.push({
        startLat: locs[i].lat,
        startLng: locs[i].lng,
        endLat: locs[i + 1].lat,
        endLng: locs[i + 1].lng,
        color: CAR_COLOR,
        stroke: 0.4,
        type: "CAR",
      });
    }

    // AIR arc to next trip (larger, blue glow)
    if (ti < sorted.length - 1) {
      const nextTrip = sorted[ti + 1];
      const nextLocs = [...nextTrip.locations].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
      if (nextLocs.length > 0 && locs.length > 0) {
        const fromLat = locs[locs.length - 1].lat;
        const fromLng = locs[locs.length - 1].lng;
        const toLat = nextLocs[0].lat;
        const toLng = nextLocs[0].lng;
        if (validCoord(fromLat, fromLng) && validCoord(toLat, toLng)) {
          arcs.push({
            startLat: fromLat,
            startLng: fromLng,
            endLat: toLat,
            endLng: toLng,
            color: AIR_COLOR,
            stroke: 0.8,
            type: "AIR",
          });
        }
      }
    }

    // Points for all locations (deduplicate by lat/lng)
    for (const loc of locs) {
      if (!validCoord(loc.lat, loc.lng)) continue;
      const key = `${loc.lat.toFixed(4)},${loc.lng.toFixed(4)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      points.push({
        lat: loc.lat,
        lng: loc.lng,
        label: loc.label ?? trip.title,
        tripSlug: trip.slug,
        tripTitle: trip.title,
        color: MARKER_COLOR,
        size: 0.35,
      });
    }
  }

  return { arcs, points };
}

/* ══════════════════════════════════════════════════════════════════
   WEBGL DETECTION
   ══════════════════════════════════════════════════════════════════ */

function checkWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    return !!gl;
  } catch {
    return false;
  }
}

/* ══════════════════════════════════════════════════════════════════
   GLOBE COMPONENT
   ══════════════════════════════════════════════════════════════════ */

export default function GlobeView({ trips, onWebGLFail }: GlobeViewProps) {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [GlobeComponent, setGlobeComponent] = useState<React.ComponentType<any> | null>(null);
  const [webglOk, setWebglOk] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<PointDatum | null>(null);

  // Check WebGL support
  useEffect(() => {
    if (!checkWebGL()) {
      setWebglOk(false);
      onWebGLFail?.();
    }
  }, [onWebGLFail]);

  // Lazy-load the Globe component at runtime
  useEffect(() => {
    if (!webglOk) return;
    import("react-globe.gl")
      .then((mod) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setGlobeComponent(() => mod.default as React.ComponentType<any>);
      })
      .catch(() => {
        setWebglOk(false);
        onWebGLFail?.();
      });
  }, [webglOk, onWebGLFail]);

  // Responsive sizing via ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setDimensions({ width, height });
    });
    obs.observe(el);
    setDimensions({ width: el.clientWidth || 800, height: el.clientHeight || 600 });
    return () => obs.disconnect();
  }, []);

  // Enable auto-rotate + atmosphere after globe mounts
  useEffect(() => {
    if (!GlobeComponent || !globeRef.current) return;
    const timer = setTimeout(() => {
      if (globeRef.current) {
        // Auto-rotate controls
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const controls = globeRef.current.controls() as any;
        if (controls) {
          controls.autoRotate = true;
          controls.autoRotateSpeed = 0.3; // Slow cinematic rotation
          controls.enableDamping = true;
          controls.dampingFactor = 0.08;
          controls.minDistance = 150;
          controls.maxDistance = 500;
        }
        // Initial camera position (Europe-focused)
        globeRef.current.pointOfView({ lat: 42, lng: 12, altitude: 2.2 }, 1500);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [GlobeComponent]);

  // Pause rotation when tab is hidden (performance)
  useEffect(() => {
    if (!globeRef.current) return;
    const handleVisibility = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const controls = globeRef.current?.controls() as any;
      if (controls) {
        controls.autoRotate = document.visibilityState === "visible";
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [GlobeComponent]);

  const { arcs, points } = useMemo(() => buildGlobeData(trips), [trips]);

  // Custom arc color getter for glow effect
  const getArcColor = useCallback((d: ArcDatum) => {
    return d.type === "AIR" ? AIR_GLOW : CAR_GLOW;
  }, []);

  // Point click handler
  const handlePointClick = useCallback(
    (point: PointDatum) => {
      router.push(`/chilli-billy/${encodeURIComponent(point.tripSlug)}`);
    },
    [router]
  );

  // Custom point label HTML
  const getPointLabel = useCallback((d: PointDatum) => {
    return `<div style="
      background: rgba(0,0,0,0.85);
      border: 1px solid rgba(245,158,11,0.5);
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 12px;
      color: white;
      font-family: system-ui, sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    ">
      <strong style="color: #f59e0b;">${d.tripTitle}</strong>
      <div style="color: #999; font-size: 11px; margin-top: 2px;">${d.label}</div>
      <div style="color: #666; font-size: 10px; margin-top: 4px;">Clicca per aprire →</div>
    </div>`;
  }, []);

  // WebGL failure fallback message
  if (!webglOk) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <div className="text-center p-6">
          <span className="text-4xl mb-4 block">🌍</span>
          <p className="text-white/60 text-sm">
            WebGL non disponibile.
            <br />
            Passa alla mappa 2D.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full bg-black relative overflow-hidden">
      {/* Loading state */}
      {!GlobeComponent && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4 mx-auto" />
            <span className="text-white/40 text-sm">Caricamento globo...</span>
          </div>
        </div>
      )}

      {/* Atmosphere glow overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background: "radial-gradient(ellipse at center, transparent 45%, rgba(59,130,246,0.08) 70%, rgba(0,0,0,0.5) 100%)",
        }}
      />

      {/* Hovered point tooltip (mobile-friendly) */}
      {hoveredPoint && (
        <div className="absolute top-4 left-4 z-20 bg-black/90 border border-amber-500/30 rounded-lg px-3 py-2 pointer-events-none">
          <div className="text-amber-500 font-semibold text-sm">{hoveredPoint.tripTitle}</div>
          <div className="text-white/60 text-xs">{hoveredPoint.label}</div>
        </div>
      )}

      {GlobeComponent && (
        <GlobeComponent
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          // Earth textures
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
          backgroundColor="rgba(0,0,0,0)"
          // Atmosphere for cinematic glow
          showAtmosphere={true}
          atmosphereColor="#4a90d9"
          atmosphereAltitude={0.18}
          // Arcs (routes)
          arcsData={arcs}
          arcColor={getArcColor}
          arcDashLength={() => 0.5}
          arcDashGap={() => 0.15}
          arcDashAnimateTime={() => 2500}
          arcStroke={(d: ArcDatum) => d.stroke}
          arcAltitude={(d: ArcDatum) => (d.type === "AIR" ? 0.15 : 0.02)}
          arcAltitudeAutoScale={0.5}
          arcsTransitionDuration={0}
          // Points (markers)
          pointsData={points}
          pointColor={() => MARKER_COLOR}
          pointAltitude={0.01}
          pointRadius={(d: PointDatum) => d.size}
          onPointClick={handlePointClick}
          onPointHover={(point: PointDatum | null) => setHoveredPoint(point)}
          pointLabel={getPointLabel}
          pointsTransitionDuration={0}
          // Performance: reduce polygon resolution
          rendererConfig={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        />
      )}

      {/* Cinematic vignette */}
      <div className="absolute inset-0 pointer-events-none z-[2]">
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r from-black/40 to-transparent" />
        <div className="absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-black/40 to-transparent" />
      </div>
    </div>
  );
}
