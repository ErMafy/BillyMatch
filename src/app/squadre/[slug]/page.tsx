import { prisma } from "@/lib/db";
import { getTeamStats, getActiveSeason, getRecentMatches } from "@/lib/stats";
import { getBadgesForTeam } from "@/lib/badges";
import { formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TeamPhotoForm } from "./team-photo-form";
import { PlayerPhotoForm } from "./player-photo-form";

export const dynamic = "force-dynamic";

interface Props {
  params: { slug: string };
}

export default async function SquadraDetailPage({ params }: Props) {
  const team = await prisma.team.findUnique({
    where: { slug: params.slug },
    include: { players: true },
  });

  if (!team) notFound();

  const season = await getActiveSeason();
  const allStats = await getTeamStats(season?.id);
  const teamStats = allStats.find((s) => s.teamId === team.id);
  const badges = teamStats ? await getBadgesForTeam(teamStats, allStats, season?.id) : [];

  // Match di questa squadra
  const matches = await prisma.match.findMany({
    where: {
      OR: [{ winnerTeamId: team.id }, { loserTeamId: team.id }],
      ...(season?.id ? { seasonId: season.id } : {}),
    },
    include: { winnerTeam: true, loserTeam: true },
    orderBy: { playedAt: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      {/* Team banner 16:9 */}
      {team.photoUrl ? (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-amber-500/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={team.photoUrl}
            alt={team.photoTitle || team.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white drop-shadow-lg">{team.name}</h1>
            {team.photoTitle && (
              <p className="text-sm text-amber-300 font-medium drop-shadow mt-1">{team.photoTitle}</p>
            )}
            {team.photoDescription && (
              <p className="text-xs text-white/70 drop-shadow mt-0.5">{team.photoDescription}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-4xl shrink-0">
            {team.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{team.name}</h1>
            <p className="text-muted-foreground text-xs mt-1">Slug: {team.slug}</p>
          </div>
        </div>
      )}


      {/* Photo form (admin only - client component checks) */}
      <TeamPhotoForm
        teamId={team.id}
        currentPhotoUrl={team.photoUrl}
        currentPhotoTitle={team.photoTitle}
        currentPhotoDescription={team.photoDescription}
      />

      {/* Roster con foto */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">👥 Roster</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {team.players.map((p) => (
              <div key={p.id} className="rounded-lg bg-muted/50 overflow-hidden border border-border/50">
                {/* Player photo */}
                {p.photoUrl ? (
                  <div className="relative w-full aspect-[2/3] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.photoUrl}
                      alt={p.photoTitle || p.name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-[2/3] bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center">
                    <span className="text-5xl font-bold text-amber-500/40">{p.name.charAt(0)}</span>
                  </div>
                )}
                {/* Player info */}
                <div className="p-3">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-base">{p.name}</p>
                    {p.nickname && (
                      <Badge variant="secondary" className="text-[10px]">
                        aka {p.nickname}
                      </Badge>
                    )}
                  </div>
                  {p.photoTitle && (
                    <p className="text-xs text-amber-400 mt-1 font-medium">{p.photoTitle}</p>
                  )}
                  {p.photoDescription && (
                    <p className="text-xs text-muted-foreground mt-0.5 italic">
                      &quot;{p.photoDescription}&quot;
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Player Photo Forms (Admin) */}
      <PlayerPhotoForm
        players={team.players.map((p) => ({
          id: p.id,
          name: p.name,
          nickname: p.nickname,
          photoUrl: p.photoUrl,
          photoTitle: p.photoTitle,
          photoDescription: p.photoDescription,
        }))}
      />

      {/* Stats */}
      {teamStats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📊 Statistiche Stagione</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBox label="Vittorie" value={teamStats.matchWins} color="text-green-500" />
              <StatBox label="Sconfitte" value={teamStats.matchLosses} color="text-red-400" />
              <StatBox label="Winrate" value={`${teamStats.winRate}%`} color="text-foreground" />
              <StatBox label="Set Vinti" value={teamStats.setWins} color="text-blue-400" />
              <StatBox label="Bet Wins" value={teamStats.betWins} color="text-purple-400" />
              <StatBox label="Speso" value={`€${teamStats.spent.toFixed(2)}`} color="text-amber-400" />
              <StatBox label="Streak Attuale" value={`${teamStats.currentStreak} 🔥`} color="text-foreground" />
              <StatBox label="Max Streak" value={teamStats.maxStreak} color="text-foreground" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🏅 Titoli & Achievement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {badges.map((b) => (
                <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-amber-500/10">
                  <span className="text-2xl">{b.icon}</span>
                  <div>
                    <p className="font-medium text-sm">{b.name}</p>
                    <p className="text-xs text-muted-foreground">{b.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Match History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📋 Storico Match</CardTitle>
        </CardHeader>
        <CardContent>
          {matches.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessun match registrato per questa squadra.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 px-2">Data</th>
                    <th className="text-center py-2 px-2">Esito</th>
                    <th className="text-left py-2 px-2">Avversario</th>
                    <th className="text-center py-2 px-2">Punteggio</th>
                    <th className="text-center py-2 px-2">Modo</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((m) => {
                    const won = m.winnerTeamId === team.id;
                    const opponent = won ? m.loserTeam.name : m.winnerTeam.name;
                    const scoreDisplay = won
                      ? `${m.winnerScore} - ${m.loserScore}`
                      : `${m.loserScore} - ${m.winnerScore}`;
                    return (
                      <tr key={m.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 px-2 text-muted-foreground whitespace-nowrap">
                          {formatDate(m.playedAt)}
                        </td>
                        <td className="text-center py-2 px-2">
                          <Badge variant={won ? "default" : "destructive"} className="text-[10px]">
                            {won ? "✅ VINTO" : "❌ PERSO"}
                          </Badge>
                        </td>
                        <td className="py-2 px-2">{opponent}</td>
                        <td className="text-center py-2 px-2 font-bold">{scoreDisplay}</td>
                        <td className="text-center py-2 px-2">
                          <Badge variant="secondary" className="text-[10px]">{m.mode}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="text-center p-3 rounded-lg bg-muted/50">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
    </div>
  );
}
