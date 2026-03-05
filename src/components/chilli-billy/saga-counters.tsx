"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";

export interface SagaStats {
  tripCount: number;
  countriesCount: number;
  kmTotal: number;
}

function useCountUp(target: number, durationMs: number, active: boolean): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    cancelAnimationFrame(rafRef.current);
    const startTime = performance.now();
    function tick(now: number) {
      const progress = Math.min((now - startTime) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, durationMs, active]);

  return value;
}

function StatCounter({
  value,
  label,
  duration,
  active,
}: {
  value: number;
  label: string;
  duration: number;
  active: boolean;
}) {
  const count = useCountUp(value, duration, active);
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-4xl sm:text-5xl lg:text-6xl font-black text-amber-400 tabular-nums leading-none">
        {new Intl.NumberFormat("it-IT").format(count)}
      </span>
      <span className="text-[11px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-widest text-center">
        {label}
      </span>
    </div>
  );
}

export function SagaCounters({ tripCount, countriesCount, kmTotal }: SagaStats) {
  const sectionRef = useRef<HTMLDivElement>(null);
  // framer-motion useInView accepts RefObject<Element> — HTMLDivElement satisfies Element
  const isInView = useInView(sectionRef as unknown as React.RefObject<HTMLElement>, {
    once: true,
    margin: "-80px",
  });

  return (
    <motion.div
      ref={sectionRef}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="py-6"
    >
      <h2 className="text-xl sm:text-2xl font-extrabold text-center mb-6 tracking-tight">
        🌶️ Chilli Billy Saga
      </h2>

      <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16">
        <StatCounter value={tripCount} label="Viaggi" duration={1000} active={isInView} />

        <div className="hidden sm:block h-12 w-px bg-border" />

        <StatCounter value={countriesCount} label="Paesi" duration={1400} active={isInView} />

        <div className="hidden sm:block h-12 w-px bg-border" />

        <StatCounter value={kmTotal} label="Km percorsi" duration={2200} active={isInView} />
      </div>
    </motion.div>
  );
}
