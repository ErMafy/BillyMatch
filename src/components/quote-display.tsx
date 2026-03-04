"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QuoteDisplayProps {
  quotes: {
    teamName: string;
    quota: number;
    motivazione: string;
  }[];
}

export function QuoteDisplay({ quotes }: QuoteDisplayProps) {
  if (quotes.length < 2) return null;

  return (
    <Card className="border-amber-500/30 bg-gradient-to-br from-background to-amber-950/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          🎰 Quote Pre-Match
          <span className="text-xs text-muted-foreground font-normal">(solo per ridere)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quotes.map((q, i) => (
            <motion.div
              key={q.teamName}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: i * 0.2 }}
              className="text-center p-4 rounded-lg bg-muted/50 border border-border"
            >
              <p className="text-sm font-medium text-muted-foreground mb-1">{q.teamName}</p>
              <p className="text-4xl font-extrabold text-amber-400 mb-2">
                {q.quota.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground italic">
                &quot;{q.motivazione}&quot;
              </p>
            </motion.div>
          ))}
        </div>
        <p className="text-[10px] text-center text-muted-foreground mt-3">
          ⚠️ Quote fittizie a scopo goliardico. Nessun valore legale. Il banco è il barista.
        </p>
      </CardContent>
    </Card>
  );
}
