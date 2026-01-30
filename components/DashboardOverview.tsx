"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useCallback, type JSX } from "react";
import {
  BarChart3,
  Globe,
  Loader2,
  Music,
  Target,
  TrendingUp,
  User,
} from "lucide-react";
import { getUserSessions, getArtistsWithLeaderboards, type SessionSummary, type ArtistWithLeaderboard } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";

const ComparisonsPerArtistChart = dynamic(
  () => import("@/components/charts/ComparisonsPerArtistChart").then((m) => m.ComparisonsPerArtistChart),
  { ssr: false, loading: () => <div className="w-full h-[280px] animate-pulse rounded-lg bg-muted/30" aria-hidden /> }
);

type DashboardOverviewProps = Readonly<{
  onSelectArtist?: (artist: string) => void;
}>;

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: Readonly<{
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
}>): JSX.Element {
  return (
    <div className="rounded-lg border border-border/40 bg-card p-3 space-y-0.5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[9px] font-mono uppercase tracking-widest">{label}</span>
      </div>
      <p className="font-mono font-bold text-sm text-foreground">{value}</p>
      {sub != null && (
        <p className="text-[9px] text-muted-foreground font-mono uppercase">{sub}</p>
      )}
    </div>
  );
}

export function DashboardOverview({ onSelectArtist }: DashboardOverviewProps): JSX.Element {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [artistsWithLeaderboards, setArtistsWithLeaderboards] = useState<ArtistWithLeaderboard[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(!!user);
  const [loadingArtists, setLoadingArtists] = useState(true);

  const loadSessions = useCallback(async () => {
    if (!user) {
      setSessions([]);
      setLoadingSessions(false);
      return;
    }
    setLoadingSessions(true);
    try {
      const data = await getUserSessions(user.id);
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[DashboardOverview] Failed to load sessions:", err);
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  }, [user]);

  const loadArtists = useCallback(async () => {
    setLoadingArtists(true);
    try {
      const data = await getArtistsWithLeaderboards(50);
      setArtistsWithLeaderboards(data ?? []);
    } catch (err) {
      console.error("[DashboardOverview] Failed to load artists with leaderboards:", err);
      setArtistsWithLeaderboards([]);
    } finally {
      setLoadingArtists(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    loadArtists();
  }, [loadArtists]);

  const totalComparisons = sessions.reduce((sum, s) => sum + (s.comparison_count ?? 0), 0);
  const artistsRanked = [...new Set(sessions.map((s) => s.primary_artist).filter(Boolean))];
  const avgConvergence =
    sessions.length > 0
      ? Math.round(
          sessions.reduce((sum, s) => sum + (s.convergence_score ?? 0), 0) / sessions.length
        )
      : 0;
  const completedSessions = sessions.filter((s) => (s.convergence_score ?? 0) >= 90).length;
  const completionRate =
    sessions.length > 0 ? Math.round((completedSessions / sessions.length) * 100) : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 pb-4">
        <h2 className="text-xl font-black uppercase tracking-tighter italic">Dashboard</h2>
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mt-0.5">
          Your activity &amp; global rankings
        </p>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 pb-8">
        {/* Your activity — only when logged in */}
        {user != null && (
          <section className="space-y-3">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <User className="h-3 w-3" />
              Your activity
            </h3>
            {loadingSessions ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <StatCard
                  icon={BarChart3}
                  label="Sessions"
                  value={sessions.length}
                  sub={completedSessions > 0 ? `${completedSessions} completed` : undefined}
                />
                <StatCard
                  icon={Target}
                  label="Comparisons"
                  value={totalComparisons.toLocaleString()}
                />
                <StatCard
                  icon={Music}
                  label="Artists ranked"
                  value={artistsRanked.length}
                />
                <StatCard
                  icon={TrendingUp}
                  label="Avg. convergence"
                  value={sessions.length > 0 ? `${avgConvergence}%` : "—"}
                  sub={sessions.length > 0 ? `${completionRate}% completion rate` : undefined}
                />
              </div>
            )}
          </section>
        )}

        {/* Artists with global rankings */}
        <section className="space-y-3">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Globe className="h-3 w-3" />
            Artists with global rankings
          </h3>
          {loadingArtists ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : artistsWithLeaderboards.length === 0 ? (
            <p className="text-xs text-muted-foreground font-mono py-4 text-center">
              No global rankings yet. Rank an artist to create the first leaderboard.
            </p>
          ) : (
            <div className="space-y-4">
              <ComparisonsPerArtistChart
                artists={artistsWithLeaderboards}
                onSelectArtist={onSelectArtist}
              />
              <div className="space-y-1">
              {artistsWithLeaderboards.map((item) => (
                <button
                  key={item.artist}
                  type="button"
                  onClick={() => onSelectArtist?.(item.artist)}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 p-2.5 rounded-lg border border-border/40",
                    "bg-card hover:bg-muted/50 hover:border-primary/20 text-left transition-colors",
                    "outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  )}
                >
                  <span className="font-mono text-xs font-bold truncate text-foreground">
                    {item.artist}
                  </span>
                    <span className="shrink-0 text-[10px] font-mono text-muted-foreground uppercase">
                    {item.total_comparisons.toLocaleString()} user{item.total_comparisons === 1 ? "" : "s"}
                  </span>
                </button>
              ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
