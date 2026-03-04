"use client";

import { useRef, useState } from "react";

export function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setMuted(videoRef.current.muted);
    }
  };

  return (
    <section className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] h-[60vh] sm:h-[70vh] md:h-[80vh] lg:h-screen overflow-hidden">
      {/* Video background */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/images/hero-fallback.jpg"
      >
        <source src="/video/billy-match-trailer.mp4" type="video/mp4" />
      </video>

      {/* Mute/Unmute button */}
      <button
        onClick={toggleMute}
        aria-label={muted ? "Attiva audio" : "Disattiva audio"}
        className="absolute bottom-28 right-4 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 text-white hover:bg-black/70 hover:scale-110 transition-all duration-200 cursor-pointer"
      >
        {muted ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}
      </button>

      {/* Fallback background image (shown when video fails) */}
      <div
        className="absolute inset-0 bg-cover bg-center -z-10"
        style={{ backgroundImage: "url(/images/hero-fallback.jpg)" }}
      />

      {/* Dark cinematic overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

      {/* Centered hero text */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
        <h1
          className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-extrabold text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] mb-4 animate-hero-fade-in"
        >
          Billy-Match
        </h1>
        <p
          className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-amber-400 font-bold drop-shadow-lg mb-6 animate-hero-fade-in-delay-1"
        >
          Scommesse Clandestine sul Ferro
        </p>
        <p
          className="text-sm sm:text-base md:text-lg text-amber-200/90 font-mono tracking-wide animate-hero-fade-in-delay-2"
        >
          Chi paga la prossima scommessa?
        </p>
      </div>

      {/* Bottom fade to page background */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
