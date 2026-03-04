"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { TeamStats } from "@/lib/stats";

interface TeamCardProps {
  stats: TeamStats;
  players: { name: string; nickname: string | null }[];
  badges: { id: string; name: string; icon: string; description: string }[];
  index: number;
}

export function TeamCard({ stats, players, badges, index }: TeamCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.15 }}
    >
      <Link href={`/squadre/${stats.teamSlug}`}>
        <Card className="hover:border-amber-500/50 transition-all hover:shadow-lg hover:shadow-amber-500/10 cursor-pointer overflow-hidden">
          {/* Team banner 16:9 */}
          {stats.photoUrl ? (
            <div className="relative w-full aspect-video overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={stats.photoUrl}
                alt={stats.teamName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-3">
                <p className="text-lg font-extrabold text-white drop-shadow-lg">{stats.teamName}</p>
                <p className="text-[10px] text-white/70 drop-shadow">
                  {players.map((p) => p.nickname ? `${p.name} (${p.nickname})` : p.name).join(", ")}
                </p>
              </div>
            </div>
          ) : (
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-xl shrink-0">
                  {stats.teamName.charAt(0)}
                </div>
                <div>
                  <CardTitle className="text-lg">{stats.teamName}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {players.map((p) => p.nickname ? `${p.name} (${p.nickname})` : p.name).join(", ")}
                  </p>
                </div>
              </div>
            </CardHeader>
          )}
          <CardContent>
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-2xl font-bold text-green-500">{stats.matchWins}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Vittorie</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-2xl font-bold text-blue-400">{stats.setWins}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Set Vinti</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-2xl font-bold text-amber-400">€{stats.spent.toFixed(0)}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Speso</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Winrate: {stats.winRate}%</span>
              <span>Streak: {stats.currentStreak} 🔥</span>
              <span>Bet wins: {stats.betWins}</span>
            </div>

            {badges.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {badges.map((b) => (
                  <Badge key={b.id} variant="secondary" className="text-[10px]">
                    {b.icon} {b.name.replace(b.icon + " ", "")}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
