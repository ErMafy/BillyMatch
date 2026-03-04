"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RivalryMeterProps {
  streakTeamName: string | null;
  streakCount: number;
  totalMatches: number;
}

export function RivalryMeter({ streakTeamName, streakCount, totalMatches }: RivalryMeterProps) {
  // Rivalry "heat" goes from 0 to 100 based on streak length
  const heat = Math.min(100, (streakCount / 5) * 100);
  
  const getFlameLevel = () => {
    if (streakCount >= 5) return "🔥🔥🔥🔥🔥 INFERNALE";
    if (streakCount >= 4) return "🔥🔥🔥🔥 ROVENTE";
    if (streakCount >= 3) return "🔥🔥🔥 INCANDESCENTE";
    if (streakCount >= 2) return "🔥🔥 CALDO";
    if (streakCount >= 1) return "🔥 TIEPIDO";
    return "❄️ FREDDO";
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          ⚔️ Rivalry Meter
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Intensità rivalità</span>
            <span className="font-bold">{getFlameLevel()}</span>
          </div>
          
          <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${heat}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, #f59e0b ${Math.max(0, 100 - heat)}%, #ef4444 100%)`,
              }}
            />
          </div>

          {streakTeamName ? (
            <p className="text-sm text-center">
              <span className="font-bold text-amber-400">{streakTeamName}</span> domina con{" "}
              <span className="font-bold">{streakCount}</span> vittorie di fila!
            </p>
          ) : (
            <p className="text-sm text-center text-muted-foreground">
              Nessun dominio in corso. Equilibrio totale!
            </p>
          )}

          <p className="text-xs text-center text-muted-foreground">
            {totalMatches} match totali disputati
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
