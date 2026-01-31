"use client";

import { useState, type JSX } from "react";
import { Calendar, CheckCircle2, Layers, Loader2, Music, PlayCircle, Swords, Trophy, ArrowDownAZ, ArrowUpAZ, ArrowDown, ArrowUp, Clock } from "lucide-react";
import Image from "next/image";
import type { SessionSummary } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";
import { useNavigationStore, useAnalyticsStore } from "@/lib/store";
import { useUserSessions } from "@/lib/hooks";

const COMPLETION_THRESHOLD = 25;
/** Same as RankingWidget "View Results" threshold (displayScore >= 90) so completed rankings appear in Completed column. */
const COMPLETED_THRESHOLD = 90;

type MyRankingsOverviewProps = Readonly<{
  isSidebarCollapsed?: boolean;
}>;

type SortField = "completion" | "date" | "artist";
type SortDir = "asc" | "desc";

export function MyRankingsOverview({ isSidebarCollapsed = false }: MyRankingsOverviewProps): JSX.Element {
  const { navigateToRanking, navigateToResults } = useNavigationStore();
  const { user } = useAuth();
  
  // React Query for sessions (shared cache with AnalyticsPage)
  const { data: sessions = [], isLoading: loading } = useUserSessions(user?.id);
  
  // Use Zustand store for UI state only
  const {
    myRankingsMobileTab: mobileTab,
    setMyRankingsMobileTab: setMobileTab,
  } = useAnalyticsStore();
  
  // Local UI state
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [sortField, setSortField] = useState<SortField>("completion");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <p className="text-sm font-mono text-muted-foreground">Sign in to see your rankings.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-xs font-mono uppercase tracking-widest">Loading rankings…</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-4">
        <CheckCircle2 className="h-12 w-12 text-muted-foreground/40" />
        <div className="space-y-1">
          <p className="text-sm font-mono font-bold uppercase text-muted-foreground">
            No rankings yet
          </p>
          <p className="text-xs text-muted-foreground/80 font-mono">
            Start a ranking to see it here.
          </p>
        </div>
      </div>
    );
  }

  /** Sort sessions by selected field and direction. */
  function sortZone<T extends SessionSummary>(list: T[]): T[] {
    const copy = [...list];
    const mult = sortDir === "asc" ? 1 : -1;
    
    copy.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case "completion":
          comparison = mult * ((a.convergence_score ?? 0) - (b.convergence_score ?? 0));
          break;
        case "date":
          comparison = mult * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          break;
        case "artist":
          comparison = mult * (a.primary_artist ?? "").localeCompare(b.primary_artist ?? "", undefined, { sensitivity: "base" });
          break;
      }
      
      // Tie-breaker: always use date (newest first) when primary sort is equal
      if (comparison === 0 && sortField !== "date") {
        comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      
      return comparison;
    });
    return copy;
  }

  const draftSessionsRaw = sessions.filter((s) => (s.convergence_score ?? 0) < COMPLETION_THRESHOLD);
  const incompleteSessionsRaw = sessions.filter(
    (s) => (s.convergence_score ?? 0) >= COMPLETION_THRESHOLD && (s.convergence_score ?? 0) < COMPLETED_THRESHOLD
  );
  const completedSessionsRaw = sessions.filter((s) => (s.convergence_score ?? 0) >= COMPLETED_THRESHOLD);

  const draftSessions = sortZone(draftSessionsRaw);
  const incompleteSessions = sortZone(incompleteSessionsRaw);
  const completedSessions = sortZone(completedSessionsRaw);

  function completionColor(score: number): string {
    if (score <= 33) return "red";
    if (score <= 66) return "yellow";
    return "green";
  }

  function SessionCard({
    session,
    openResultsOnClick,
  }: {
    session: SessionSummary;
    openResultsOnClick?: boolean;
  }) {
    const score = session.convergence_score ?? 0;
    const scheme = completionColor(score);
    const barBg =
      scheme === "red"
        ? "bg-red-500/60"
        : scheme === "yellow"
          ? "bg-yellow-500/60"
          : "bg-green-500/60";
    const textColor =
      scheme === "red"
        ? "text-red-500"
        : scheme === "yellow"
          ? "text-yellow-600 dark:text-yellow-500"
          : "text-green-600 dark:text-green-500";

    const handleClick = () => {
      if (openResultsOnClick) {
        navigateToResults(session.session_id, "kanban");
      } else {
        navigateToRanking(session.session_id);
      }
    };

    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "w-full group flex items-center gap-4 p-4 rounded-xl border border-border/40 bg-card relative",
          "hover:bg-muted/50 hover:border-primary/20 text-left transition-all",
          "outline-none focus-visible:ring-2 focus-visible:ring-primary"
        )}
      >
        <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-muted/20">
          {(session.top_album_covers ?? []).length > 0 && !imageErrors[session.session_id] ? (
            <Image
              src={(session.top_album_covers ?? [])[0]}
              alt=""
              width={48}
              height={48}
              className="w-full h-full object-cover"
              onError={() => setImageErrors((prev) => ({ ...prev, [session.session_id]: true }))}
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Layers className="h-6 w-6 text-muted-foreground/40" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-sm font-bold truncate text-foreground">
            {session.primary_artist}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 opacity-50" />
              {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
                new Date(session.created_at)
              )}
            </span>
            <span className="flex items-center gap-1">
              <Swords className="h-3 w-3 opacity-50" />
              {session.comparison_count} duels
            </span>
            {openResultsOnClick && session.song_count != null && (
              <span className="flex items-center gap-1">
                <Music className="h-3 w-3 opacity-50" />
                {session.song_count} songs
              </span>
            )}
            <span className={cn("flex items-center gap-1 font-semibold", textColor)}>
              <CheckCircle2 className="h-3 w-3 opacity-80" />
              {score}% complete
            </span>
          </div>
          {openResultsOnClick && (
            <p className="text-[9px] font-mono text-primary/80 uppercase tracking-wider mt-1.5">
              View results →
            </p>
          )}
        </div>
        {openResultsOnClick ? (
          <Trophy className="h-5 w-5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
        ) : (
          <PlayCircle className="h-5 w-5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
        )}
        {/* Progress bar (matches navigator green / yellow / red) */}
        <div className="absolute bottom-2 left-4 right-4 h-[2px] bg-primary/10 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-300", barBg)}
            style={{ width: `${Math.min(100, score)}%` }}
          />
        </div>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-4 h-full min-h-0 max-h-[calc(100vh-6rem)]",
        isSidebarCollapsed ? "w-full" : "w-full max-w-5xl mx-auto"
      )}
    >
      <div className="flex flex-col gap-5 shrink-0">
        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-foreground text-center">
          My Rankings
        </h2>
        
        {/* Sort Controls */}
        <div className="flex justify-center">
          <div className="inline-flex rounded-lg border border-border/60 bg-muted/20 p-1">
            <button
              type="button"
              onClick={() => {
                if (sortField === "completion") {
                  setSortDir(sortDir === "desc" ? "asc" : "desc");
                } else {
                  setSortField("completion");
                  setSortDir("desc");
                }
              }}
              className={cn(
                "flex items-center gap-1.5 px-2 sm:px-3 py-2.5 rounded-md font-mono text-[10px] sm:text-xs uppercase tracking-wider transition-all",
                sortField === "completion"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-pressed={sortField === "completion"}
              title={sortField === "completion" ? (sortDir === "desc" ? "Click for Low → High" : "Click for High → Low") : "Sort by Completion"}
            >
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>Completion</span>
              {sortField === "completion" && (
                sortDir === "desc" ? <ArrowDown className="h-3 w-3 ml-0.5 shrink-0" /> : <ArrowUp className="h-3 w-3 ml-0.5 shrink-0" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                if (sortField === "date") {
                  setSortDir(sortDir === "desc" ? "asc" : "desc");
                } else {
                  setSortField("date");
                  setSortDir("desc");
                }
              }}
              className={cn(
                "flex items-center gap-1.5 px-2 sm:px-3 py-2.5 rounded-md font-mono text-[10px] sm:text-xs uppercase tracking-wider transition-all",
                sortField === "date"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-pressed={sortField === "date"}
              title={sortField === "date" ? (sortDir === "desc" ? "Click for Oldest First" : "Click for Newest First") : "Sort by Date"}
            >
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>Date</span>
              {sortField === "date" && (
                sortDir === "desc" ? <ArrowDown className="h-3 w-3 ml-0.5 shrink-0" /> : <ArrowUp className="h-3 w-3 ml-0.5 shrink-0" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                if (sortField === "artist") {
                  setSortDir(sortDir === "desc" ? "asc" : "desc");
                } else {
                  setSortField("artist");
                  setSortDir("asc");
                }
              }}
              className={cn(
                "flex items-center gap-1.5 px-2 sm:px-3 py-2.5 rounded-md font-mono text-[10px] sm:text-xs uppercase tracking-wider transition-all",
                sortField === "artist"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-pressed={sortField === "artist"}
              title={sortField === "artist" ? (sortDir === "asc" ? "Click for Z → A" : "Click for A → Z") : "Sort by Artist"}
            >
              <Music className="h-3.5 w-3.5 shrink-0" />
              <span>Artist</span>
              {sortField === "artist" && (
                sortDir === "asc" ? <ArrowDownAZ className="h-3 w-3 ml-0.5 shrink-0" /> : <ArrowUpAZ className="h-3 w-3 ml-0.5 shrink-0" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile: Tab Navigation */}
      <div className="sm:hidden flex flex-col gap-3 flex-1 min-h-0">
        <div className="flex bg-muted/20 p-1 rounded-lg border border-border/40 shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab("draft")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md font-mono text-[10px] uppercase font-bold tracking-widest transition-all",
              mobileTab === "draft" ? "bg-background shadow-xs text-primary" : "text-muted-foreground"
            )}
          >
            Not Started ({draftSessions.length})
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("progress")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md font-mono text-[10px] uppercase font-bold tracking-widest transition-all",
              mobileTab === "progress" ? "bg-background shadow-xs text-primary" : "text-muted-foreground"
            )}
          >
            In Progress ({incompleteSessions.length})
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("settled")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md font-mono text-[10px] uppercase font-bold tracking-widest transition-all",
              mobileTab === "settled" ? "bg-background shadow-xs text-primary" : "text-muted-foreground"
            )}
          >
            Complete ({completedSessions.length})
          </button>
        </div>
        <div className="flex flex-col gap-3 overflow-y-auto flex-1 min-h-0">
          {mobileTab === "draft" && (
            <>
              {draftSessions.map((session) => (
                <SessionCard key={session.session_id} session={session} />
              ))}
              {draftSessions.length === 0 && (
                <p className="text-xs font-mono text-muted-foreground/80 py-8 text-center">
                  No rankings yet
                </p>
              )}
            </>
          )}
          {mobileTab === "progress" && (
            <>
              {incompleteSessions.map((session) => (
                <SessionCard key={session.session_id} session={session} />
              ))}
              {incompleteSessions.length === 0 && (
                <p className="text-xs font-mono text-muted-foreground/80 py-8 text-center">
                  No rankings in progress
                </p>
              )}
            </>
          )}
          {mobileTab === "settled" && (
            <>
              {completedSessions.map((session) => (
                <SessionCard key={session.session_id} session={session} openResultsOnClick />
              ))}
              {completedSessions.length === 0 && (
                <p className="text-xs font-mono text-muted-foreground/80 py-8 text-center">
                  No completed rankings yet
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Desktop: Kanban Columns */}
      <div className="hidden sm:grid gap-4 grid-cols-3 flex-1 min-h-0 min-w-0">
        <div className="flex flex-col gap-3 min-h-0 overflow-hidden">
          <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest text-center shrink-0">
            Not Started
          </p>
          <div className="flex flex-col gap-3 overflow-y-auto min-h-0" key={`draft-${sortField}-${sortDir}`}>
            {draftSessions.map((session) => (
              <SessionCard key={session.session_id} session={session} />
            ))}
            {draftSessions.length === 0 && (
              <p className="text-xs font-mono text-muted-foreground/80 py-4 text-center">
                None
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3 min-h-0 overflow-hidden">
          <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest text-center shrink-0">
            In Progress
          </p>
          <div className="flex flex-col gap-3 overflow-y-auto min-h-0" key={`progress-${sortField}-${sortDir}`}>
            {incompleteSessions.map((session) => (
              <SessionCard key={session.session_id} session={session} />
            ))}
            {incompleteSessions.length === 0 && (
              <p className="text-xs font-mono text-muted-foreground/80 py-4 text-center">
                None
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3 min-h-0 overflow-hidden">
          <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest text-center shrink-0">
            Complete
          </p>
          <div className="flex flex-col gap-3 overflow-y-auto min-h-0" key={`settled-${sortField}-${sortDir}`}>
            {completedSessions.map((session) => (
              <SessionCard key={session.session_id} session={session} openResultsOnClick />
            ))}
            {completedSessions.length === 0 && (
              <p className="text-xs font-mono text-muted-foreground/80 py-4 text-center">
                None
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
