"use client";

import dynamic from "next/dynamic";
import { useEffect, useCallback, useState, type JSX, useMemo } from "react";
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
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { GlobalLeaderboard } from "@/components/GlobalLeaderboard";
import { useAnalyticsStore } from "@/lib/store";
import {
  useUserSessions,
  useArtistsWithLeaderboards,
  useGlobalActivityStats,
  useGlobalLeaderboard,
  useLeaderboardStats,
  useArtistSuggestions,
  useDebouncedValue,
} from "@/lib/hooks";

/** Same as ComparisonsPerArtistChart: top N artists to consider for rank. */
const TOP_N_ARTISTS = 10;

/** Standard competition ranking: ties get same rank, next rank = 1 + count of people strictly ahead. */
function computeRanks(counts: number[]): number[] {
  return counts.map((count) => {
    const ahead = counts.filter((c) => c > count).length;
    return ahead + 1;
  });
}

/** Rank 1–3 colors matching ComparisonsPerArtistChart (gold / silver / bronze). */
function rankColor(rank: number): string {
  if (rank === 1) return "#FFD700";
  if (rank === 2) return "#C0C0C0";
  if (rank === 3) return "#CD7F32";
  return "";
}

/** Tie-break when rank is equal: total_comparisons desc, then artist name asc. Same as chart. */
function sortByRankThenTieBreak<T extends { rank: number; total_comparisons: number; artist: string }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) =>
      a.rank !== b.rank
        ? a.rank - b.rank
        : b.total_comparisons !== a.total_comparisons
          ? b.total_comparisons - a.total_comparisons
          : a.artist.localeCompare(b.artist, undefined, { sensitivity: "base" })
  );
}

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
    <div className="group rounded-xl border border-border/40 bg-gradient-to-br from-card via-card to-muted/20 p-3 md:p-4 space-y-1.5 text-center hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-10 space-y-1.5">
        <div className="flex items-center justify-center gap-1.5 text-muted-foreground group-hover:text-primary transition-colors duration-300">
          <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
          <span className="text-[9px] md:text-[10px] font-mono uppercase tracking-[0.15em] font-bold">{label}</span>
        </div>
        <p className="font-mono font-black text-xl md:text-2xl text-foreground tracking-tight leading-none">{value}</p>
        {sub != null && (
          <p className="text-[9px] md:text-[10px] text-muted-foreground/80 font-mono uppercase tracking-wide leading-tight">{sub}</p>
        )}
      </div>
    </div>
  );
}

export function AnalyticsPage({ isSidebarCollapsed = false }: AnalyticsPageProps): JSX.Element {
  const { user, openAuthModal } = useAuth();
  
  // React Query hooks for data fetching (with automatic caching)
  const { data: sessions = [], isLoading: loadingSessions } = useUserSessions(user?.id);
  const { data: artistsWithLeaderboards = [], isLoading: loadingArtists } = useArtistsWithLeaderboards(50);
  const { data: globalStats, isLoading: loadingGlobalStats } = useGlobalActivityStats();
  
  // Zustand store for UI state only
  const {
    expandedChartHeight,
    leaderboardModalOpen,
    globalQuery,
    selectedArtist,
    // Actions
    setExpandedChartHeight,
    openLeaderboardModal,
    closeLeaderboardModal,
    setGlobalQuery,
    setSelectedArtist,
  } = useAnalyticsStore();

  // Debounce artist search so we don't hit suggest on every keypress
  const debouncedGlobalQuery = useDebouncedValue(globalQuery, 300);
  const shouldFetchSuggestions = debouncedGlobalQuery.trim().length >= 2 &&
    selectedArtist?.toLowerCase() !== debouncedGlobalQuery.trim().toLowerCase();
  const { data: suggestions = [], isLoading: loadingSuggestions } = useArtistSuggestions(
    debouncedGlobalQuery,
    shouldFetchSuggestions
  );

  // Track dropdown visibility
  const [showSuggestions, setShowSuggestions] = useState(false);

  // React Query for leaderboard data - fetch both in parallel when artist is selected
  const { 
    data: leaderboardStats, 
    isLoading: loadingStats,
  } = useLeaderboardStats(selectedArtist, !!selectedArtist);
  
  const { 
    data: leaderboardData, 
    isLoading: loadingLeaderboardData, 
    error: leaderboardQueryError,
    refetch: refetchLeaderboard 
  } = useGlobalLeaderboard(selectedArtist, 100, !!selectedArtist);

  // Combined loading state: loading stats OR loading leaderboard data
  const loadingLeaderboard = loadingStats || loadingLeaderboardData;

  // Compute leaderboard error message
  const leaderboardError = useMemo(() => {
    // If we have leaderboard data, no error
    if (leaderboardData) return null;
    
    // Still loading, no error yet
    if (loadingLeaderboard) return null;
    
    // Query failed
    if (leaderboardQueryError) {
      return leaderboardQueryError instanceof Error ? leaderboardQueryError.message : "Failed to load leaderboard";
    }
    
    // Stats loaded but empty = no rankings for this artist
    if (selectedArtist && !leaderboardStats && !loadingStats) {
      return `Not enough rankings available for ${selectedArtist}`;
    }
    
    // Stats exist but no leaderboard data came back
    if (selectedArtist && leaderboardStats && !leaderboardData) {
      return `No leaderboard for ${selectedArtist}`;
    }
    
    return null;
  }, [selectedArtist, leaderboardStats, leaderboardData, loadingStats, loadingLeaderboard, leaderboardQueryError]);

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
  }, [isSidebarCollapsed, setExpandedChartHeight]);

  const handleGlobalSearch = useCallback(
    (artistName: string) => {
      if (!user) {
        openAuthModal("login");
        return;
      }
      setShowSuggestions(false);
      setSelectedArtist(artistName);
      setGlobalQuery(artistName);
    },
    [user, openAuthModal, setSelectedArtist, setGlobalQuery]
  );

  const handleSelectArtist = useCallback(
    (artist: string) => handleGlobalSearch(artist),
    [handleGlobalSearch]
  );
  
  const handleRetryLeaderboard = useCallback(() => {
    refetchLeaderboard();
  }, [refetchLeaderboard]);

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
    <section className={chartHeight != null ? "lg:h-full min-h-0 min-w-0 w-full flex flex-col lg:flex-1" : "space-y-6"}>
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
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6b8a67] via-[#82A67D] to-[#6b8a67] dark:from-primary dark:via-primary/80 dark:to-primary rounded-2xl opacity-75 group-hover:opacity-100 blur group-hover:blur-md transition-all duration-300" />
      <Button
        type="button"
        onClick={openLeaderboardModal}
        className="relative w-full py-5 md:py-6 text-sm md:text-base font-mono font-black uppercase tracking-[0.2em] bg-gradient-to-br from-[#6b8a67] via-[#7a9a75] to-[#82A67D] dark:from-primary dark:via-primary dark:to-primary/90 text-white dark:text-primary-foreground hover:scale-[1.02] active:scale-[0.98] rounded-2xl shadow-2xl shadow-[#6b8a67]/25 dark:shadow-primary/25 flex items-center justify-center gap-2.5 transition-all duration-200 border border-white/10 dark:border-primary-foreground/10"
      >
        <Globe className="h-4 w-4 md:h-5 md:w-5 animate-pulse" />
        <span>
          Artist Global Rankings
        </span>
      </Button>
    </div>
  );

  const activitySection = (
    <section className="space-y-3 md:space-y-3.5">
      <div className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 border border-border/40 w-fit mx-auto">
        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        <h3 className="text-[9px] md:text-[10px] font-black text-foreground uppercase tracking-[0.2em] font-mono">
          Your Activity
        </h3>
        <User className="h-3 w-3 md:h-3.5 md:w-3.5 text-primary" />
      </div>
      {user == null ? (
        <div className="rounded-xl border border-dashed border-border/40 bg-muted/10 p-4 md:p-5">
          <p className="text-[10px] md:text-xs text-muted-foreground font-mono text-center leading-relaxed">
            Sign in to see your stats.
          </p>
        </div>
      ) : loadingSessions ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 md:gap-3">
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
    <section className="space-y-3 md:space-y-3.5">
      <div className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 border border-border/40 w-fit mx-auto">
        <Globe className="h-3 w-3 md:h-3.5 md:w-3.5 text-primary" />
        <h3 className="text-[9px] md:text-[10px] font-black text-foreground uppercase tracking-[0.2em] font-mono">
          Global Activity
        </h3>
        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
      </div>
      {loadingGlobalStats ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : globalStats == null ? (
        <div className="rounded-xl border border-dashed border-border/40 bg-muted/10 p-4 md:p-5">
          <p className="text-[10px] md:text-xs text-muted-foreground font-mono text-center leading-relaxed">
            Unable to load global stats.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 md:gap-3">
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 items-stretch lg:h-full min-h-0 transition-[grid-template-columns] duration-200">
      <div className="space-y-5 md:space-y-6 order-2 lg:order-1 lg:col-span-1 min-w-0 flex flex-col items-center justify-center w-full">
        <div className="w-full max-w-md space-y-5 md:space-y-6 flex flex-col items-center px-4 md:px-0">
          {leaderboardButtonSection}
          {activitySection}
          {globalActivitySection}
        </div>
      </div>
      <div className="order-1 lg:order-2 lg:col-span-2 min-h-0 min-w-0 flex flex-col w-full lg:overflow-hidden">
        {chartSection(expandedChartHeight)}
      </div>
    </div>
  ) : (
    <div className="space-y-4 md:space-y-5 w-full flex flex-col items-center">
      {/* Chart + button: half the usual gap so more fits without scrolling. */}
      <div className="w-[1000px] max-w-full space-y-4 md:space-y-5 px-4 md:px-0">
        {chartSection()}
        {leaderboardButtonSection}
      </div>
      {/* Your activity (left) and Global activity (right) side by side. */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 px-4 md:px-2">
        {activitySection}
        {globalActivitySection}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-4">
        {content}
      </div>

      {/* Artist leaderboard popup */}
      {leaderboardModalOpen && (
          <div
            className="fixed inset-0 top-14 md:top-20 z-50 flex items-stretch justify-center p-4 md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="leaderboard-modal-title"
            onClick={closeLeaderboardModal}
          >
            <div
              className="bg-card border border-border w-full h-full md:max-w-3xl rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="shrink-0 px-4 py-3 md:p-4 border-b flex items-center justify-between bg-muted/30">
                <h2 id="leaderboard-modal-title" className="text-xs md:text-sm font-semibold uppercase tracking-wider text-foreground leading-none">
                  Artist Global Rankings
                </h2>
                <button
                  type="button"
                  onClick={closeLeaderboardModal}
                  className="p-1.5 -mr-1.5 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground flex items-center justify-center"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Pills + search (outside scroll) */}
              <div className="shrink-0 p-3 md:p-4 space-y-3 md:space-y-4 border-b border-border/40 relative z-10 overflow-visible">
                {/* Top 3 artists - compact pills on mobile */}
                {artistsWithLeaderboards.length > 0 && (() => {
                  const topArtists = artistsWithLeaderboards.slice(0, TOP_N_ARTISTS);
                  const counts = topArtists.map((a) => a.total_comparisons);
                  const ranks = computeRanks(counts);
                  const withRank = topArtists.map((a, i) => ({ artist: a.artist, rank: ranks[i], total_comparisons: a.total_comparisons }));
                  const top3 = sortByRankThenTieBreak(withRank).slice(0, 3);
                  return (
                    <div className="flex flex-wrap gap-1.5 md:gap-2 justify-center">
                      {top3.map((item) => {
                        const color = rankColor(item.rank);
                        const isSelected = selectedArtist === item.artist;
                        return (
                          <button
                            key={item.artist}
                            type="button"
                            onClick={() => handleGlobalSearch(item.artist)}
                            className={cn(
                              "px-2.5 py-1.5 md:px-3 md:py-2 rounded-full text-[11px] md:text-xs font-mono font-bold uppercase tracking-wide transition-all",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted/50 hover:bg-muted border border-border/50"
                            )}
                          >
                            {item.artist}{" "}
                            <span style={{ color: isSelected ? undefined : color || undefined }}>
                              #{item.rank}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Search bar */}
                <div className="relative overflow-visible">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                  <input
                    type="text"
                    value={globalQuery}
                    onChange={(e) => {
                      setGlobalQuery(e.target.value);
                      if (e.target.value.trim().length >= 2) {
                        setShowSuggestions(true);
                      }
                    }}
                    onFocus={() => {
                      if (suggestions.length > 0) setShowSuggestions(true);
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                    placeholder="Search artist..."
                    className="flex h-10 md:h-11 w-full rounded-lg border border-input bg-background pl-10 pr-10 py-2 text-sm transition-all focus-visible:outline-none focus-visible:border-primary/20 focus-visible:ring-1 focus-visible:ring-primary/10"
                  />
                  {loadingSuggestions && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin z-10" />
                  )}
                  {/* Suggestions dropdown */}
                  {showSuggestions && suggestions.length > 0 && user && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                      {suggestions.slice(0, 8).map((artist) => (
                        <button
                          key={artist}
                          type="button"
                          onClick={() => handleGlobalSearch(artist)}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors flex items-center gap-2"
                        >
                          <Search className="h-3 w-3 text-muted-foreground/50" />
                          <span className="font-medium">{artist}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {showSuggestions && !user && globalQuery.trim().length >= 2 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50">
                      <div className="px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
                        <Lock className="h-3.5 w-3.5" />
                        <span>Sign in to search artists</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Leaderboard content - only this part scrolls */}
              <div className="flex-1 min-h-0 overflow-y-auto p-3 md:p-4 custom-scrollbar">
                {selectedArtist && (
                  <div className="rounded-lg border border-border/40 bg-card/50 overflow-hidden">
                    <GlobalLeaderboard
                      artist={selectedArtist}
                      data={leaderboardData ?? null}
                      isLoading={loadingLeaderboard}
                      error={leaderboardError}
                      onRetry={handleRetryLeaderboard}
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
