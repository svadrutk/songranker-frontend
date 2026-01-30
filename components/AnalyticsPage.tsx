"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useCallback, type JSX } from "react";
import {
  BarChart3,
  Globe,
  Loader2,
  Lock,
  Music,
  Search,
  Target,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import {
  getUserSessions,
  getArtistsWithLeaderboards,
  getGlobalLeaderboard,
  getGlobalActivityStats,
  getLeaderboardStats,
  suggestArtists,
  type SessionSummary,
  type ArtistWithLeaderboard,
  type GlobalActivityStats,
} from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { GlobalLeaderboard } from "@/components/GlobalLeaderboard";

const ComparisonsPerArtistChart = dynamic(
  () => import("@/components/charts/ComparisonsPerArtistChart").then((m) => m.ComparisonsPerArtistChart),
  { ssr: false, loading: () => <div className="w-full h-[280px] animate-pulse rounded-lg bg-muted/30" aria-hidden /> }
);

type AnalyticsPageProps = Readonly<{
  isSidebarCollapsed?: boolean;
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
    <div className="rounded-lg border border-border/40 bg-card p-3 space-y-0.5 text-center">
      <div className="flex items-center justify-center gap-2 text-muted-foreground">
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

export function AnalyticsPage({ isSidebarCollapsed = false }: AnalyticsPageProps): JSX.Element {
  const { user, openAuthModal } = useAuth();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [artistsWithLeaderboards, setArtistsWithLeaderboards] = useState<ArtistWithLeaderboard[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(!!user);
  const [loadingArtists, setLoadingArtists] = useState(true);
  const [globalStats, setGlobalStats] = useState<GlobalActivityStats | null>(null);
  const [loadingGlobalStats, setLoadingGlobalStats] = useState(true);
  const [expandedChartHeight, setExpandedChartHeight] = useState(520);

  // Global leaderboard modal (search + view)
  const [leaderboardModalOpen, setLeaderboardModalOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<string>("");
  const [leaderboardData, setLeaderboardData] = useState<Awaited<ReturnType<typeof getGlobalLeaderboard>>>(null);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const closeLeaderboardModal = useCallback(() => {
    setLeaderboardModalOpen(false);
    setGlobalQuery("");
    setSuggestions([]);
    setSelectedArtist("");
    setLeaderboardData(null);
    setLeaderboardError(null);
  }, []);

  useEffect(() => {
    if (!leaderboardModalOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLeaderboardModal();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [leaderboardModalOpen, closeLeaderboardModal]);

  useEffect(() => {
    if (!isSidebarCollapsed) return;
    const updateHeight = () =>
      setExpandedChartHeight(Math.min(640, Math.max(400, (typeof window !== "undefined" ? window.innerHeight : 600) - 160)));
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, [isSidebarCollapsed]);

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
      console.error("[AnalyticsPage] Failed to load sessions:", err);
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
      console.error("[AnalyticsPage] Failed to load artists with leaderboards:", err);
      setArtistsWithLeaderboards([]);
    } finally {
      setLoadingArtists(false);
    }
  }, []);

  const loadGlobalStats = useCallback(async () => {
    setLoadingGlobalStats(true);
    try {
      const data = await getGlobalActivityStats();
      setGlobalStats(data ?? null);
    } catch (err) {
      console.error("[AnalyticsPage] Failed to load global activity stats:", err);
      setGlobalStats(null);
    } finally {
      setLoadingGlobalStats(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    loadArtists();
  }, [loadArtists]);

  useEffect(() => {
    loadGlobalStats();
  }, [loadGlobalStats]);

  // Debounce for global search suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      const cleanQuery = globalQuery.trim().toLowerCase();
      if (cleanQuery.length < 2 || selectedArtist?.toLowerCase() === cleanQuery) {
        setSuggestions([]);
        return;
      }
      try {
        const data = await suggestArtists(globalQuery);
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [globalQuery, selectedArtist]);

  const handleGlobalSearch = useCallback(
    async (artistName: string) => {
      if (!user) {
        openAuthModal("login");
        return;
      }
      setSelectedArtist(artistName);
      setGlobalQuery(artistName);
      setSuggestions([]);
      setLeaderboardData(null);
      setLeaderboardError(null);
      setLoadingLeaderboard(true);
      try {
        const stats = await getLeaderboardStats(artistName);
        if (!stats) {
          setLeaderboardError(`Not enough rankings available for ${artistName}`);
        } else {
          const data = await getGlobalLeaderboard(artistName);
          setLeaderboardData(data);
          if (!data) setLeaderboardError(`No leaderboard for ${artistName}`);
        }
      } catch (err) {
        setLeaderboardError(err instanceof Error ? err.message : "Failed to load leaderboard");
      } finally {
        setLoadingLeaderboard(false);
      }
    },
    [user, openAuthModal]
  );

  const handleSelectArtist = useCallback(
    (artist: string) => handleGlobalSearch(artist),
    [handleGlobalSearch]
  );

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

  const chartSection = (chartHeight?: number) => (
    <section className={chartHeight != null ? "h-full min-h-0 min-w-0 w-full flex flex-col flex-1" : "space-y-6"}>
      {loadingArtists ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : artistsWithLeaderboards.length === 0 ? (
        <p className="text-xs text-muted-foreground font-mono py-4 text-center">
          No global rankings yet. Rank an artist to create the first leaderboard.
        </p>
      ) : (
        <ComparisonsPerArtistChart
          artists={artistsWithLeaderboards}
          onSelectArtist={handleSelectArtist}
          height={chartHeight}
        />
      )}
    </section>
  );

  const leaderboardButtonSection = (
    <Button
      type="button"
      onClick={() => setLeaderboardModalOpen(true)}
      className="w-full py-6 md:py-8 text-base md:text-lg font-mono font-bold uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-lg flex items-center justify-center gap-3"
    >
      <Search className="h-5 w-5 md:h-6 md:w-6" />
      View Artist Leaderboard
    </Button>
  );

  const activitySection = (
    <section className="space-y-3">
      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-2">
        <User className="h-3 w-3" />
        Your activity
      </h3>
      {user == null ? (
        <p className="text-xs text-muted-foreground font-mono py-4 text-center">
          Sign in to see your session and comparison stats.
        </p>
      ) : loadingSessions ? (
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
            icon={TrendingUp}
            label="Avg. convergence"
            value={sessions.length > 0 ? `${avgConvergence}%` : "—"}
            sub={sessions.length > 0 ? `${completionRate}% completion rate` : undefined}
          />
          <StatCard
            icon={Music}
            label="Artists ranked"
            value={artistsRanked.length}
          />
          <StatCard
            icon={Target}
            label="Comparisons"
            value={totalComparisons.toLocaleString()}
          />
        </div>
      )}
    </section>
  );

  const globalActivitySection = (
    <section className="space-y-3">
      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-2">
        <Globe className="h-3 w-3" />
        Global activity
      </h3>
      {loadingGlobalStats ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : globalStats == null ? (
        <p className="text-xs text-muted-foreground font-mono py-4 text-center">
          Unable to load global stats.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            icon={BarChart3}
            label="Sessions"
            value={globalStats.total_sessions.toLocaleString()}
            sub={globalStats.completed_sessions > 0 ? `${globalStats.completed_sessions.toLocaleString()} completed` : undefined}
          />
          <StatCard
            icon={TrendingUp}
            label="Avg. convergence"
            value={`${globalStats.avg_convergence}%`}
            sub={globalStats.completion_rate > 0 ? `${globalStats.completion_rate}% completion rate` : undefined}
          />
          <StatCard
            icon={Music}
            label="Artists ranked"
            value={globalStats.artists_ranked.toLocaleString()}
          />
          <StatCard
            icon={Target}
            label="Comparisons"
            value={globalStats.total_comparisons.toLocaleString()}
          />
        </div>
      )}
    </section>
  );

  const content = isSidebarCollapsed ? (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 items-stretch h-full min-h-0 transition-[grid-template-columns] duration-200">
      <div className="space-y-8 order-2 lg:order-1 lg:col-span-1 min-w-0 flex flex-col items-center justify-center w-full">
        <div className="w-full max-w-md space-y-8 flex flex-col items-center">
          {leaderboardButtonSection}
          {activitySection}
          {globalActivitySection}
        </div>
      </div>
      <div className="order-1 lg:order-2 lg:col-span-2 min-h-0 min-w-0 flex flex-col w-full overflow-hidden">
        {chartSection(expandedChartHeight)}
      </div>
    </div>
  ) : (
    <div className="space-y-4 w-full flex flex-col items-center">
      {/* Chart + button: half the usual gap so more fits without scrolling. */}
      <div className="w-[1000px] max-w-full space-y-4">
        {chartSection()}
        {leaderboardButtonSection}
      </div>
      {/* Your activity (left) and Global activity (right) side by side. */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
        {activitySection}
        {globalActivitySection}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-8">
        {content}
      </div>

      {/* Artist leaderboard popup */}
      {leaderboardModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="leaderboard-modal-title"
            onClick={closeLeaderboardModal}
          >
            <div
              className="bg-card border border-border w-full max-w-3xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="shrink-0 p-4 border-b flex items-center justify-between bg-muted/20">
                <h2 id="leaderboard-modal-title" className="text-sm font-bold font-mono uppercase tracking-widest text-foreground">
                  View artist leaderboard
                </h2>
                <button
                  type="button"
                  onClick={closeLeaderboardModal}
                  className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {/* Search bar at top of popup */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (globalQuery.trim()) handleGlobalSearch(globalQuery.trim());
                  }}
                  className="relative shrink-0"
                >
                  <div className="relative flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={globalQuery}
                        onChange={(e) => setGlobalQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (globalQuery.trim()) handleGlobalSearch(globalQuery.trim());
                          }
                        }}
                        placeholder="Artist name for global leaderboard…"
                        className="flex h-11 w-full rounded-md border border-input bg-background px-10 py-2 text-sm transition-all focus-visible:outline-none focus-visible:border-primary/20 focus-visible:ring-1 focus-visible:ring-primary/10 shadow-sm"
                      />
                      {loadingLeaderboard && user && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <Button
                      type="submit"
                      disabled={loadingLeaderboard}
                      className="px-5 h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-mono shrink-0"
                    >
                      {loadingLeaderboard ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : !user ? (
                        <span className="flex items-center gap-2">
                          <Lock className="h-3 w-3" />
                          Search
                        </span>
                      ) : (
                        "View leaderboard"
                      )}
                    </Button>
                  </div>
                  {suggestions.length > 0 && user && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-[100] overflow-hidden">
                      <div className="py-1">
                        {suggestions.slice(0, 8).map((artist) => (
                          <button
                            key={artist}
                            type="button"
                            onClick={() => handleGlobalSearch(artist)}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-muted/50 transition-colors flex items-center gap-2"
                          >
                            <Search className="h-3 w-3 text-muted-foreground/50" />
                            <span className="font-medium">{artist}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </form>

                {/* Waffle chart + song list once artist is identified */}
                {selectedArtist && (
                  <div className="rounded-lg border border-border/40 bg-card overflow-hidden">
                    <GlobalLeaderboard
                      artist={selectedArtist}
                      data={leaderboardData}
                      isLoading={loadingLeaderboard}
                      error={leaderboardError}
                      onRetry={() => handleGlobalSearch(selectedArtist)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
