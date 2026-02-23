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

type AnalyticsPageProps = Record<string, never>;

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  className,
}: Readonly<{
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  className?: string;
}>): JSX.Element {
  return (
    <div className={cn(
      "group relative rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm p-4 flex flex-col justify-between overflow-hidden transition-all duration-300",
      className
    )}>
      <div className="space-y-2 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-muted/50 text-muted-foreground border border-border/40">
            <Icon className="h-3 w-3" />
          </div>
          <span className="text-[9px] font-black font-mono uppercase tracking-[0.15em] text-muted-foreground/70">
            {label}
          </span>
        </div>
        
        <div>
          <p className="font-mono font-black text-xl md:text-2xl text-foreground tracking-tighter tabular-nums leading-none mb-0.5">
            {value}
          </p>
          {sub != null && (
            <p className="text-[8px] md:text-[9px] text-muted-foreground/60 font-bold font-mono uppercase tracking-wider">
              {sub}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function TechnicalPanel({
  title,
  icon: Icon,
  status,
  children,
  className,
}: Readonly<{
  title: string;
  icon: React.ElementType;
  status?: "active" | "standby";
  children: React.ReactNode;
  className?: string;
}>) {
  return (
    <section className={cn("relative border border-border/40 rounded-xl overflow-hidden bg-card/10 backdrop-blur-xs flex flex-col", className)}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-muted/20 shrink-0">
        <div className="flex items-center gap-2">
          <Icon className="h-3 w-3 text-primary/70" />
          <h3 className="text-[9px] font-black font-mono uppercase tracking-[0.2em] text-foreground">
            {title}
          </h3>
        </div>
        {status && (
          <div className="flex items-center gap-2">
            <div className={cn("h-1 w-1 rounded-full", status === "active" ? "bg-green-500 animate-pulse" : "bg-muted-foreground/40")} />
            <span className="text-[7px] font-bold font-mono text-muted-foreground/60 uppercase">
              {status}
            </span>
          </div>
        )}
      </div>
      
      <div className="p-3 bg-muted/5 flex-1 flex flex-col min-h-0">
        {children}
      </div>
    </section>
  );
}

export function AnalyticsPage({}: AnalyticsPageProps): JSX.Element {
  const { user, openAuthModal } = useAuth();
  
  const { data: sessions = [], isLoading: loadingSessions } = useUserSessions(user?.id);
  const { data: artistsWithLeaderboards = [], isLoading: loadingArtists } = useArtistsWithLeaderboards(50);
  const { data: globalStats, isLoading: loadingGlobalStats } = useGlobalActivityStats();
  
  const {
    expandedChartHeight,
    leaderboardModalOpen,
    globalQuery,
    selectedArtist,
    setExpandedChartHeight,
    openLeaderboardModal,
    closeLeaderboardModal,
    setGlobalQuery,
    setSelectedArtist,
  } = useAnalyticsStore();

  const debouncedGlobalQuery = useDebouncedValue(globalQuery, 300);
  const shouldFetchSuggestions = debouncedGlobalQuery.trim().length >= 2 &&
    selectedArtist?.toLowerCase() !== debouncedGlobalQuery.trim().toLowerCase();
  const { data: suggestions = [], isLoading: loadingSuggestions } = useArtistSuggestions(
    debouncedGlobalQuery,
    shouldFetchSuggestions
  );

  const [showSuggestions, setShowSuggestions] = useState(false);

  const { data: leaderboardStats, isLoading: loadingStats } = useLeaderboardStats(selectedArtist, !!selectedArtist);
  const { data: leaderboardData, isLoading: loadingLeaderboardData, error: leaderboardQueryError, refetch: refetchLeaderboard } = useGlobalLeaderboard(selectedArtist, 100, !!selectedArtist);

  const loadingLeaderboard = loadingStats || loadingLeaderboardData;

  const leaderboardError = useMemo(() => {
    if (leaderboardData) return null;
    if (loadingLeaderboard) return null;
    if (leaderboardQueryError) return leaderboardQueryError instanceof Error ? leaderboardQueryError.message : "Failed to load leaderboard";
    if (selectedArtist && !leaderboardStats && !loadingStats) return `Not enough rankings available for ${selectedArtist}`;
    if (selectedArtist && leaderboardStats && !leaderboardData) return `No leaderboard for ${selectedArtist}`;
    return null;
  }, [selectedArtist, leaderboardStats, leaderboardData, loadingStats, loadingLeaderboard, leaderboardQueryError]);

  useEffect(() => {
    if (!leaderboardModalOpen) return;
    const handleEscape = (e: KeyboardEvent) => { if (e.key === "Escape") closeLeaderboardModal(); };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [leaderboardModalOpen, closeLeaderboardModal]);

  useEffect(() => {
    const updateHeight = () => setExpandedChartHeight(Math.min(640, Math.max(400, (typeof window !== "undefined" ? window.innerHeight : 600) - 160)));
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, [setExpandedChartHeight]);

  const handleGlobalSearch = useCallback((artistName: string) => {
    if (!user) { openAuthModal("login"); return; }
    setShowSuggestions(false);
    setSelectedArtist(artistName);
    setGlobalQuery(artistName);
  }, [user, openAuthModal, setSelectedArtist, setGlobalQuery]);

  const handleSelectArtist = useCallback((artist: string) => handleGlobalSearch(artist), [handleGlobalSearch]);
  const handleRetryLeaderboard = useCallback(() => { refetchLeaderboard(); }, [refetchLeaderboard]);

  const totalComparisons = sessions.reduce((sum, s) => sum + (s.comparison_count ?? 0), 0);
  const artistsRanked = [...new Set(sessions.map((s) => s.primary_artist).filter(Boolean))];
  const avgConvergence = sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + (s.convergence_score ?? 0), 0) / sessions.length) : 0;
  const completedSessions = sessions.filter((s) => (s.convergence_score ?? 0) >= 90).length;
  const completionRate = sessions.length > 0 ? Math.round((completedSessions / sessions.length) * 100) : 0;

  const chartSection = (chartHeight?: number) => (
    <div className="min-h-0 min-w-0 w-full flex flex-col flex-1">
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
    </div>
  );

  const activitySection = (
    <TechnicalPanel
      title="Personal stats"
      icon={User}
      status={user ? "active" : "standby"}
      className="flex-1"
    >
      {user == null ? (
        <div className="flex-1 rounded-xl border border-dashed border-border/40 bg-muted/10 p-4 flex flex-col items-center justify-center min-h-[120px]">
          <Lock className="h-4 w-4 text-muted-foreground/40 mb-2" />
          <p className="text-[9px] text-muted-foreground/60 font-mono text-center font-bold uppercase tracking-wider">
            Sign in to reveal stats
          </p>
        </div>
      ) : loadingSessions ? (
        <div className="flex-1 flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 flex-1">
          <StatCard icon={BarChart3} label="Sessions" value={sessions.length} sub={`${completedSessions} completed`} className="h-full" />
          <StatCard icon={TrendingUp} label="Convergence" value={`${avgConvergence}%`} sub={`${completionRate}% Rate`} className="h-full" />
          <StatCard icon={Music} label="Artists" value={artistsRanked.length} className="h-full" />
          <StatCard icon={Target} label="Compares" value={totalComparisons.toLocaleString()} className="h-full" />
        </div>
      )}
    </TechnicalPanel>
  );

  const globalActivitySection = (
    <TechnicalPanel
      title="Global Matrix"
      icon={Globe}
      status="active"
      className="flex-1"
    >
      {loadingGlobalStats ? (
        <div className="flex-1 flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : globalStats == null ? (
        <div className="flex-1 rounded-xl border border-dashed border-border/40 bg-muted/10 p-4 flex flex-col items-center justify-center min-h-[120px]">
          <p className="text-[9px] text-muted-foreground/60 font-mono text-center font-bold uppercase tracking-wider">
            Data currently unavailable
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 flex-1">
          <StatCard icon={BarChart3} label="Sessions" value={globalStats.total_sessions.toLocaleString()} sub={`${globalStats.completed_sessions.toLocaleString()} done`} className="h-full" />
          <StatCard icon={TrendingUp} label="Converge" value={`${globalStats.avg_convergence}%`} sub={`${globalStats.completion_rate}% avg`} className="h-full" />
          <StatCard icon={Music} label="Artists" value={globalStats.artists_ranked.toLocaleString()} className="h-full" />
          <StatCard icon={Target} label="Compares" value={globalStats.total_comparisons.toLocaleString()} className="h-full" />
        </div>
      )}
    </TechnicalPanel>
  );

  const leaderboardButtonSection = (
    <Button
      type="button"
      onClick={openLeaderboardModal}
      className="relative w-full py-7 text-sm font-black font-mono uppercase tracking-[0.25em] bg-primary text-primary-foreground hover:scale-[1.01] active:scale-[0.99] rounded-xl shadow-lg shadow-primary/10 transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden group shrink-0"
    >
      <Globe className="h-4 w-4 animate-pulse" />
      <span>Global Artist Rankings</span>
    </Button>
  );

  const content = (
    <div className="max-w-[1400px] mx-auto p-4 space-y-6 flex-1 min-h-0 animate-in fade-in duration-500 overflow-x-hidden overflow-y-auto lg:overflow-hidden flex flex-col w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-1 gap-6 items-stretch flex-none lg:flex-1 min-h-0">
        {/* Left Column: Actions & Stats */}
        <div className="lg:col-span-4 space-y-5 flex flex-col animate-in slide-in-from-left-4 duration-700 h-full">
          {leaderboardButtonSection}
          {activitySection}
          {globalActivitySection}
        </div>

        {/* Right Column: Chart */}
        <div className="lg:col-span-8 min-w-0 flex flex-col animate-in slide-in-from-right-4 duration-700 delay-200 h-full">
          <div className="flex-1 w-full bg-card/10 rounded-xl border border-border/20 p-4 overflow-hidden flex flex-col">
            {chartSection(expandedChartHeight)}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary-rgb),0.01)_0%,transparent_100%)]">
      {content}

      {/* Artist leaderboard popup */}
      {leaderboardModalOpen && (
        <div className="fixed inset-0 top-14 md:top-20 z-50 flex items-stretch justify-center p-4 md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-labelledby="leaderboard-modal-title" onClick={closeLeaderboardModal}>
          <div className="bg-card border border-border w-full h-full md:max-w-3xl rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="shrink-0 px-4 py-3 md:p-4 border-b flex items-center justify-between bg-muted/30">
              <h2 id="leaderboard-modal-title" className="text-xs md:text-sm font-semibold uppercase tracking-wider text-foreground leading-none">Artist Global Rankings</h2>
              <button type="button" onClick={closeLeaderboardModal} className="p-1.5 -mr-1.5 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground flex items-center justify-center" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            <div className="shrink-0 p-3 md:p-4 space-y-3 md:space-y-4 border-b border-border/40 relative z-10 overflow-visible">
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
                        <button key={item.artist} type="button" onClick={() => handleGlobalSearch(item.artist)} className={cn("px-2.5 py-1.5 md:px-3 md:py-2 rounded-full text-[11px] md:text-xs font-mono font-bold uppercase tracking-wide transition-all", isSelected ? "bg-primary text-primary-foreground" : "bg-muted/50 hover:bg-muted border border-border/50")}>
                          {item.artist} <span style={{ color: isSelected ? undefined : color || undefined }}>#{item.rank}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
              <div className="relative overflow-visible">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                <input type="text" value={globalQuery} onChange={(e) => { setGlobalQuery(e.target.value); if (e.target.value.trim().length >= 2) { setShowSuggestions(true); } }} onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }} onBlur={() => { setTimeout(() => setShowSuggestions(false), 200); }} placeholder="Search artist..." className="flex h-10 md:h-11 w-full rounded-lg border border-input bg-background pl-10 pr-10 py-2 text-sm transition-all focus-visible:outline-none focus-visible:border-primary/20 focus-visible:ring-1 focus-visible:ring-primary/10" />
                {loadingSuggestions && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin z-10" />}
                {showSuggestions && suggestions.length > 0 && user && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                    {suggestions.slice(0, 8).map((artist) => (
                      <button key={artist} type="button" onClick={() => handleGlobalSearch(artist)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors flex items-center gap-2">
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
            <div className="flex-1 min-h-0 overflow-y-auto p-3 md:p-4 custom-scrollbar">
              {selectedArtist && (
                <div className="rounded-lg border border-border/40 bg-card/50 overflow-hidden">
                  <GlobalLeaderboard artist={selectedArtist} data={leaderboardData ?? null} isLoading={loadingLeaderboard} error={leaderboardError} onRetry={handleRetryLeaderboard} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
