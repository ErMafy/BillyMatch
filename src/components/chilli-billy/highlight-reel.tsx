"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useInView } from "framer-motion";
import { Card } from "@/components/ui/card";

export function HighlightReel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const [showUnmuteHint, setShowUnmuteHint] = useState(true);
  const [videoError, setVideoError] = useState(false);

  // Hide the "Tap to unmute" hint after 2 seconds or on interaction
  useEffect(() => {
    if (!showUnmuteHint) return;
    const timer = setTimeout(() => setShowUnmuteHint(false), 2000);
    return () => clearTimeout(timer);
  }, [showUnmuteHint]);

  const handleInteraction = useCallback(() => {
    if (showUnmuteHint) setShowUnmuteHint(false);
    const video = videoRef.current;
    if (video?.muted) {
      video.muted = false;
    }
  }, [showUnmuteHint]);

  return (
    <motion.section
      ref={sectionRef}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="flex flex-col items-center"
    >
      <h2 className="text-xl sm:text-2xl font-bold text-center mb-4">
        🎬 Highlight Reel
      </h2>

      <Card
        className="relative w-full max-w-[420px] overflow-hidden rounded-2xl border border-border shadow-lg shadow-amber-500/10"
        onClick={handleInteraction}
      >
        {/* Fixed 9:16 aspect ratio container */}
        <div className="relative aspect-[9/16] w-full max-h-[70vh] bg-black">
          {videoError ? (
            <img
              src="/chilli-billy/reel/fallback.jpg"
              alt="Highlight reel fallback"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                muted
                loop
                playsInline
                controls
                poster="/chilli-billy/reel/fallback.jpg"
                onError={() => setVideoError(true)}
                className="absolute inset-0 w-full h-full object-cover"
              >
                <source
                  src="/chilli-billy/reel/highlight.mp4"
                  type="video/mp4"
                />
              </video>

              {/* Tap to unmute overlay */}
              {showUnmuteHint && (
                <motion.div
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.5, delay: 1.5 }}
                  className="absolute inset-0 flex items-end justify-center pb-16 pointer-events-none z-10"
                >
                  <span className="bg-black/70 text-white text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full backdrop-blur-sm">
                    🔇 Tap to unmute
                  </span>
                </motion.div>
              )}
            </>
          )}
        </div>
      </Card>
    </motion.section>
  );
}
