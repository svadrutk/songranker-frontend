"use client";

import { useState, useEffect, type JSX } from "react";
import { Calendar, CheckCircle2, Layers, Loader2, Music, PlayCircle, Swords, Trophy, ArrowDownAZ, ArrowUpAZ, ArrowDown, ArrowUp, Clock, Trash2, AlertTriangle, X } from "lucide-react";
import Image from "next/image";
import type { SessionSummary } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";
import { useNavigationStore, useAnalyticsStore } from "@/lib/store";
import { useUserSessions, useDeleteSession } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

const COMPLETION_THRESHOLD = 25;
/** Same as RankingWidget "View Results" threshold (displayScore >= 90) so completed rankings appear in Completed column. */
const COMPLETED_THRESHOLD = 90;

type MyRankingsOverviewProps = Readonly<{
  isSidebarCollapsed?: boolean;
  onSessionDelete?: (sessionId: string) => void;
}>;

type SortField = "completion" | "date" | "artist";
type SortDir = "asc" | "desc";

export function MyRankingsOverview({ isSidebarCollapsed = false, onSessionDelete }: MyRankingsOverviewProps): JSX.Element {
  const { navigateToRanking } = useNavigationStore();
  const { user } = useAuth();
  const deleteSessionMutation = useDeleteSession();

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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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

  const handleDeleteSession = (sessionId: string) => {
    setConfirmDeleteId(sessionId);
  };

  const handleConfirmDelete = () => {
    if (!confirmDeleteId) return;
    const sessionId = confirmDeleteId;
    setConfirmDeleteId(null);
    deleteSessionMutation.mutate(sessionId, {
      onSuccess: () => onSessionDelete?.(sessionId),
    });
  };

  // 3-phase progress bar thresholds (matching ProgressSection)
  const PHASE_THRESHOLDS = [
    { startPercent: 0, endPercent: 33 },
    { startPercent: 33, endPercent: 66 },
    { startPercent: 66, endPercent: 100 },
  ];

  function SessionCard({
    session,
    openResultsOnClick,
    onDelete,
    isDeleting,
  }: {
    session: SessionSummary;
    openResultsOnClick?: boolean;
    onDelete?: (sessionId: string) => void;
    isDeleting?: boolean;
  }) {
    const score = session.convergence_score ?? 0;
    // Map convergence score (0-90 is typical range) to display percentage (0-100)
    const displayProgress = Math.min(100, (score / 90) * 100);
    
    const scheme = completionColor(score);
    const textColor =
      scheme === "red"
        ? "text-red-500"
        : scheme === "yellow"
          ? "text-yellow-600 dark:text-yellow-500"
          : "text-green-600 dark:text-green-500";
    
    // Determine current phase (1, 2, 3, or 4 for complete)
    const getCurrentPhase = (): number => {
      if (score >= 90) return 4; // Complete
      if (displayProgress >= 66) return 3;
      if (displayProgress >= 33) return 2;
      return 1;
    };
    const currentPhase = getCurrentPhase();
    const isComplete = score >= 90;

    const handleClick = () => {
      // Always navigate to ranking widget, even for completed sessions
      navigateToRanking(session.session_id);
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onDelete?.(session.session_id);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    };

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-full group flex items-center gap-4 p-4 rounded-xl border border-border/40 bg-card relative cursor-pointer",
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
            {session.display_name || session.primary_artist}
          </p>
          <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">
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
          </div>
          <span className={cn("flex items-center gap-1 mt-1 text-[10px] font-mono uppercase tracking-tighter font-semibold", textColor)}>
            <CheckCircle2 className="h-3 w-3 opacity-80" />
            {score}% complete
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onDelete && (
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className={cn(
                "p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                "transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary",
                "opacity-70 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
              )}
              aria-label="Delete ranking"
            >
              {isDeleting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Trash2 className="h-5 w-5" />
              )}
            </button>
          )}
          {openResultsOnClick ? (
            <Trophy className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          ) : (
            <PlayCircle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          )}
        </div>
        {/* 3-phase progress bar */}
        <div className="absolute bottom-2 left-4 right-4 flex items-center gap-1">
          {PHASE_THRESHOLDS.map((phase, idx) => {
            const phaseNum = idx + 1;
            const isPhaseCompleted = currentPhase > phaseNum || isComplete;
            const isPhaseActive = currentPhase === phaseNum && !isComplete;
            const isPhasePending = currentPhase < phaseNum && !isComplete;
            
            // Calculate progress within this phase
            let phaseProgress = 0;
            if (isPhaseCompleted) {
              phaseProgress = 100;
            } else if (isPhaseActive) {
              const phaseRange = phase.endPercent - phase.startPercent;
              const progressInPhase = displayProgress - phase.startPercent;
              phaseProgress = Math.min(100, Math.max(0, (progressInPhase / phaseRange) * 100));
            }
            
            return (
              <div
                key={phaseNum}
                className={cn(
                  "flex-1 h-[3px] rounded-full overflow-hidden transition-colors duration-300",
                  isPhaseCompleted && "bg-green-500/30",
                  isPhaseActive && "bg-primary/20",
                  isPhasePending && "bg-muted/20"
                )}
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    isPhaseCompleted && "bg-green-500",
                    isPhaseActive && "bg-primary",
                    isPhasePending && "bg-muted-foreground/20"
                  )}
                  style={{ width: `${phaseProgress}%` }}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-4 h-full min-h-0",
        isSidebarCollapsed ? "w-full" : "w-full max-w-5xl mx-auto"
      )}
    >
      <div className="flex flex-col gap-5 shrink-0">
        <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-foreground text-center">
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
            Created ({draftSessions.length})
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("progress")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md font-mono text-[10px] uppercase font-bold tracking-widest transition-all",
              mobileTab === "progress" ? "bg-background shadow-xs text-primary" : "text-muted-foreground"
            )}
          >
            Unfinished ({incompleteSessions.length})
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("settled")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md font-mono text-[10px] uppercase font-bold tracking-widest transition-all",
              mobileTab === "settled" ? "bg-background shadow-xs text-primary" : "text-muted-foreground"
            )}
          >
            Settled ({completedSessions.length})
          </button>
        </div>
        <div className="flex flex-col gap-3 overflow-y-auto flex-1 min-h-0">
          {mobileTab === "draft" && (
            <>
              {draftSessions.map((session) => (
                <SessionCard
                key={session.session_id}
                session={session}
                onDelete={handleDeleteSession}
                isDeleting={deleteSessionMutation.isPending && deleteSessionMutation.variables === session.session_id}
              />
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
                <SessionCard
                key={session.session_id}
                session={session}
                onDelete={handleDeleteSession}
                isDeleting={deleteSessionMutation.isPending && deleteSessionMutation.variables === session.session_id}
              />
              ))}
              {incompleteSessions.length === 0 && (
                <p className="text-xs font-mono text-muted-foreground/80 py-8 text-center">
                  No unfinished rankings
                </p>
              )}
            </>
          )}
          {mobileTab === "settled" && (
            <>
              {completedSessions.map((session) => (
                <SessionCard
                key={session.session_id}
                session={session}
                openResultsOnClick
                onDelete={handleDeleteSession}
                isDeleting={deleteSessionMutation.isPending && deleteSessionMutation.variables === session.session_id}
              />
              ))}
              {completedSessions.length === 0 && (
                <p className="text-xs font-mono text-muted-foreground/80 py-8 text-center">
                  No settled rankings yet
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
            Created
          </p>
          <div className="flex flex-col gap-3 overflow-y-auto min-h-0" key={`draft-${sortField}-${sortDir}`}>
            {draftSessions.map((session) => (
              <SessionCard
                key={session.session_id}
                session={session}
                onDelete={handleDeleteSession}
                isDeleting={deleteSessionMutation.isPending && deleteSessionMutation.variables === session.session_id}
              />
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
            Unfinished
          </p>
          <div className="flex flex-col gap-3 overflow-y-auto min-h-0" key={`progress-${sortField}-${sortDir}`}>
            {incompleteSessions.map((session) => (
              <SessionCard
                key={session.session_id}
                session={session}
                onDelete={handleDeleteSession}
                isDeleting={deleteSessionMutation.isPending && deleteSessionMutation.variables === session.session_id}
              />
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
            Settled
          </p>
          <div className="flex flex-col gap-3 overflow-y-auto min-h-0" key={`settled-${sortField}-${sortDir}`}>
            {completedSessions.map((session) => (
              <SessionCard
                key={session.session_id}
                session={session}
                openResultsOnClick
                onDelete={handleDeleteSession}
                isDeleting={deleteSessionMutation.isPending && deleteSessionMutation.variables === session.session_id}
              />
            ))}
            {completedSessions.length === 0 && (
              <p className="text-xs font-mono text-muted-foreground/80 py-4 text-center">
                None
              </p>
            )}
          </div>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleConfirmDelete}
        artistName={(() => {
          const s = sessions.find(s => s.session_id === confirmDeleteId);
          return s ? (s.display_name || s.primary_artist) : "";
        })()}
      />
    </div>
  );
}

type DeleteConfirmationModalProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  artistName: string;
}>;

function DeleteConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  artistName 
}: DeleteConfirmationModalProps): JSX.Element | null {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-sm bg-card border border-border/40 rounded-3xl p-6 shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 bg-destructive/5 rounded-full blur-3xl" />
            
            <div className="relative">
              <div className="flex justify-end mb-4">
                <button 
                  onClick={onClose}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex justify-center mb-6">
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
              </div>

              <div className="space-y-3 mb-8 text-center">
                <h3 className="text-xl font-mono font-bold uppercase tracking-tight">Confirm Deletion</h3>
                <p className="text-sm text-muted-foreground font-mono leading-relaxed">
                  Permanently remove ranking for <span className="text-foreground font-bold">{artistName}</span>? This cannot be undone.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="flex-1 font-mono uppercase tracking-widest text-[10px] font-bold h-11 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={onConfirm}
                  className="flex-1 bg-destructive hover:bg-destructive/90 text-white font-mono uppercase tracking-widest text-[10px] font-bold h-11 rounded-xl shadow-lg shadow-destructive/20"
                >
                  Delete
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
