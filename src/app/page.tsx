import { prisma } from "@/lib/db";
import { getTeamStats, getActiveSeason, getRecentMatches, getHallOfShame } from "@/lib/stats";
import { getBadgesForTeam } from "@/lib/badges";
import { calcolaQuote } from "@/lib/quotes";
import { formatDate } from "@/lib/utils";
import { Hero } from "@/components/hero";
import { TeamCard } from "@/components/team-card";
import { QuoteDisplay } from "@/components/quote-display";
import { RivalryMeter } from "@/components/rivalry-meter";
import { MemeToggle } from "@/components/meme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const season = await getActiveSeason();
  const seasonId = season?.id;
  const stats = await getTeamStats(seasonId);
  const recentMatches = await getRecentMatches(10, seasonId);
  const hallOfShame = await getHallOfShame(seasonId);
  const quotes = calcolaQuote(stats);

  // Get teams with players for cards
  const teams = await prisma.team.findMany({ include: { players: true } });
  const allBadges: Record<string, Awaited<ReturnType<typeof getBadgesForTeam>>> = {};
  for (const s of stats) {
    allBadges[s.teamId] = await getBadgesForTeam(s, stats, seasonId);
  }

  // Rivalry meter data
  const dominantTeam = stats.reduce(
    (best, s) => (s.currentStreak > best.currentStreak ? s : best),
    stats[0]
  );
  const totalMatches = recentMatches.length > 0
    ? stats.reduce((sum, s) => sum + s.matchWins, 0)
    : 0;

  // Classifica (ordinata per vittorie, poi winrate)
  const classifica = [...stats].sort((a, b) => {
    if (b.matchWins !== a.matchWins) return b.matchWins - a.matchWins;
    return b.winRate - a.winRate;
  });

  return (
    <div className="space-y-8">
      <Hero />

      <MemeToggle />

      {/* Squadre Cards */}
      <section>
        <h2 className="text-2xl font-bold mb-4">⚽ Le Squadre</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.map((s, i) => {
            const team = teams.find((t) => t.id === s.teamId);
            return (
              <TeamCard
                key={s.teamId}
                stats={s}
                players={team?.players.map((p) => ({ name: p.name, nickname: p.nickname })) || []}
                badges={allBadges[s.teamId] || []}
                index={i}
              />
            );
          })}
        </div>
      </section>

      {/* Quote goliardiche */}
      <section>
        <QuoteDisplay quotes={quotes} />
      </section>

      {/* Rivalry Meter */}
      {stats.length >= 2 && (
        <section>
          <RivalryMeter
            streakTeamName={dominantTeam?.currentStreak > 0 ? dominantTeam.teamName : null}
            streakCount={dominantTeam?.currentStreak || 0}
            totalMatches={totalMatches}
          />
        </section>
      )}

      {/* Classifica */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🏆 Classifica</CardTitle>
          </CardHeader>
          <CardContent>
            {classifica.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessuna partita ancora disputata.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-2 px-2">#</th>
                      <th className="text-left py-2 px-2">Squadra</th>
                      <th className="text-center py-2 px-2">V</th>
                      <th className="text-center py-2 px-2">S</th>
                      <th className="text-center py-2 px-2">WR%</th>
                      <th className="text-center py-2 px-2">Set V.</th>
                      <th className="text-center py-2 px-2">Streak</th>
                      <th className="text-center py-2 px-2">Speso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classifica.map((s, i) => (
                      <tr key={s.teamId} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 px-2 font-bold">
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : `${i + 1}`}
                        </td>
                        <td className="py-2 px-2 font-medium">{s.teamName}</td>
                        <td className="text-center py-2 px-2 text-green-500 font-bold">{s.matchWins}</td>
                        <td className="text-center py-2 px-2 text-red-400">{s.matchLosses}</td>
                        <td className="text-center py-2 px-2">{s.winRate}%</td>
                        <td className="text-center py-2 px-2 text-blue-400">{s.setWins}</td>
                        <td className="text-center py-2 px-2">{s.currentStreak} 🔥</td>
                        <td className="text-center py-2 px-2 text-amber-400">€{s.spent.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Ultimi Match */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📋 Ultimi Match</CardTitle>
          </CardHeader>
          <CardContent>
            {recentMatches.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessun match registrato. Il ferro aspetta.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-2 px-2">Data</th>
                      <th className="text-left py-2 px-2">Vincitore</th>
                      <th className="text-center py-2 px-2">Punteggio</th>
                      <th className="text-left py-2 px-2">Perdente</th>
                      <th className="text-center py-2 px-2">Modo</th>
                      <th className="text-left py-2 px-2">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentMatches.map((m) => (
                      <tr key={m.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 px-2 text-muted-foreground whitespace-nowrap">
                          {formatDate(m.playedAt)}
                        </td>
                        <td className="py-2 px-2 font-medium text-green-500">
                          {m.winnerTeam.name}
                        </td>
                        <td className="text-center py-2 px-2 font-bold">
                          {m.winnerScore} - {m.loserScore}
                        </td>
                        <td className="py-2 px-2 text-red-400">
                          {m.loserTeam.name}
                        </td>
                        <td className="text-center py-2 px-2">
                          <Badge variant={m.mode === "SETS" ? "default" : "secondary"} className="text-[10px]">
                            {m.mode}
                          </Badge>
                        </td>
                        <td className="py-2 px-2 text-muted-foreground text-xs max-w-[150px] truncate">
                          {m.notes || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Hall of Shame */}
      <section>
        <Card className="border-red-500/20">
          <CardHeader>
            <CardTitle className="text-lg">💀 Hall of Shame — Top 5 Sconfitte Più Nette</CardTitle>
          </CardHeader>
          <CardContent>
            {hallOfShame.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessuna sconfitta ancora. Tutti salvi... per ora.</p>
            ) : (
              <div className="space-y-2">
                {hallOfShame.map((m, i) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-red-950/20 border border-red-500/10"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-red-400">#{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium">
                          <span className="text-green-500">{m.winnerTeam.name}</span>
                          {" "}vs{" "}
                          <span className="text-red-400">{m.loserTeam.name}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDate(m.playedAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {m.winnerScore} - {m.loserScore}
                      </p>
                      <Badge variant="destructive" className="text-[10px]">
                        Δ{m.diff}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
