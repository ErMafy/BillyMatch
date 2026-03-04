import { prisma } from "@/lib/db";
import { getTeamStats, getActiveSeason } from "@/lib/stats";
import { getBadgesForTeam } from "@/lib/badges";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function SquadrePage() {
  const season = await getActiveSeason();
  const stats = await getTeamStats(season?.id);
  const teams = await prisma.team.findMany({
    include: { players: true },
    orderBy: { name: "asc" },
  });

  const allBadges: Record<string, Awaited<ReturnType<typeof getBadgesForTeam>>> = {};
  for (const s of stats) {
    allBadges[s.teamId] = await getBadgesForTeam(s, stats, season?.id);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">⚽ Squadre</h1>
        <p className="text-muted-foreground">Le due fazioni del ferro. Scegli il tuo schieramento.</p>
      </div>

      <div className="space-y-10">
        {teams.map((team) => {
          const teamStats = stats.find((s) => s.teamId === team.id);
          const badges = allBadges[team.id] || [];

          return (
            <div key={team.id} className="space-y-4">
              {/* Team Card */}
              <Link href={`/squadre/${team.slug}`}>
                <Card className="hover:border-amber-500/50 transition-all hover:shadow-lg hover:shadow-amber-500/10 cursor-pointer overflow-hidden">
                  {/* Team banner photo — full 16:9 visible */}
                  {team.photoUrl && (
                    <div className="relative w-full aspect-video overflow-hidden bg-black">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={team.photoUrl}
                        alt={team.photoTitle || team.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-lg">
                          {team.name}
                        </h2>
                        {team.photoTitle && (
                          <p className="text-xs text-amber-300 font-medium drop-shadow">{team.photoTitle}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Fallback header if no photo */}
                  {!team.photoUrl && (
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-28 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-3xl shrink-0">
                          {team.name.charAt(0)}
                        </div>
                        <div>
                          <CardTitle className="text-2xl">{team.name}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                  )}

                  <CardContent className={team.photoUrl ? "pt-4" : ""}>
                    {/* Stats */}
                    {teamStats && (
                      <div className="grid grid-cols-4 gap-2 text-center mb-3">
                        <div className="bg-muted/50 rounded-lg p-2">
                          <p className="text-xl font-bold text-green-500">{teamStats.matchWins}</p>
                          <p className="text-[10px] text-muted-foreground">VITTORIE</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2">
                          <p className="text-xl font-bold text-red-400">{teamStats.matchLosses}</p>
                          <p className="text-[10px] text-muted-foreground">SCONFITTE</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2">
                          <p className="text-xl font-bold text-blue-400">{teamStats.setWins}</p>
                          <p className="text-[10px] text-muted-foreground">SET VINTI</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2">
                          <p className="text-xl font-bold">{teamStats.winRate}%</p>
                          <p className="text-[10px] text-muted-foreground">WINRATE</p>
                        </div>
                      </div>
                    )}

                    {badges.length > 0 && (
                      <div className="flex flex-wrap gap-1">
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

              {/* Players grid below the team card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {team.players.map((p) => (
                  <Link key={p.id} href={`/squadre/${team.slug}`}>
                    <div className="group rounded-xl overflow-hidden border border-border/50 bg-muted/30 hover:border-amber-500/40 transition-all cursor-pointer">
                      {p.photoUrl ? (
                        <div className="relative w-full aspect-[2/3] overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.photoUrl}
                            alt={p.photoTitle || p.name}
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                          <div className="absolute bottom-2 left-2 right-2">
                            <p className="font-bold text-sm text-white drop-shadow-lg">{p.name}</p>
                            {p.nickname && (
                              <p className="text-[10px] text-amber-300 drop-shadow">aka {p.nickname}</p>
                            )}
                            {p.photoTitle && (
                              <p className="text-[10px] text-white/70 italic drop-shadow">{p.photoTitle}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="w-full aspect-[2/3] bg-gradient-to-br from-amber-500/10 to-orange-600/10 flex flex-col items-center justify-center p-3">
                          <span className="text-4xl font-bold text-amber-500/30 mb-2">{p.name.charAt(0)}</span>
                          <p className="font-bold text-sm text-center">{p.name}</p>
                          {p.nickname && (
                            <p className="text-[10px] text-muted-foreground">aka {p.nickname}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
