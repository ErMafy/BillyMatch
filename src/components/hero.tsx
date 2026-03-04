"use client";

import { motion } from "framer-motion";
import { getDailyPhrase } from "@/lib/meme-phrases";

export function Hero() {
  const memePhrase = getDailyPhrase("welcome");

  return (
    <section className="relative w-full overflow-hidden rounded-xl mb-8">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/brand/billy-match-logo.png)" }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center py-16 px-4 sm:py-24 md:py-32 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-white drop-shadow-lg mb-4"
        >
          Billy-Match
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg sm:text-xl md:text-2xl text-amber-400 font-bold drop-shadow mb-6"
        >
          Scommesse Clandestine sul Ferro
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-black/40 border border-amber-500/30 rounded-lg px-4 py-2"
        >
          <p className="text-amber-200 text-sm font-mono">{memePhrase}</p>
        </motion.div>
      </div>
    </section>
  );
}
