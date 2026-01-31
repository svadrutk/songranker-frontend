"use client";

import { useState, useCallback, useEffect, type JSX } from "react";
import { Catalog } from "@/components/Catalog";
import { RankingWidget } from "@/components/RankingWidget";
import { AnalyticsPage } from "@/components/AnalyticsPage";
import { MyRankingsOverview } from "@/components/MyRankingsOverview";
import { createSession, type ReleaseGroup } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { DeduplicationModal } from "@/components/DeduplicationModal";
import {
  findPotentialDuplicates,
  filterTracks,
  type DuplicateGroup,
  prepareSongInputs,
} from "@/lib/deduplication";
import { Loader2, AlertCircle, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type ViewState = "catalog" | "dedupe" | "ranking" | "analytics" | "my_rankings";

export default function Home(): JSX.Element {
  const { user } = useAuth();
  const [selectedReleases, setSelectedReleases] = useState<ReleaseGroup[]>([]);
  const [allTracks, setAllTracks] = useState<Record<string, string[]>>({});
  const [view, setView] = useState<ViewState>("catalog");
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [finalSongList, setFinalSongList] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [openInResultsView, setOpenInResultsView] = useState(false);

  // Auto-collapse sidebar when ranking or analytics view starts (My Rankings keeps navigator open)
  useEffect(() => {
    if (view === "ranking" || view === "analytics") {
      setIsSidebarCollapsed(true);
    }
  }, [view]);

  // Handle sidebar visibility
  useEffect(() => {
    const handleResize = () => {
      // When ranking or analytics is active, keep sidebar collapsed (don't reopen on resize)
      if (view === "ranking" || view === "analytics") return;

      const isMobile = window.innerWidth < 768;
      
      if (!isMobile) {
        setIsSidebarCollapsed(false);
      } else {
        // Mobile: Open if logged in, closed if not
        setIsSidebarCollapsed(!user);
      }
    };

    // Initial check
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [user, view]);

  const handleToggle = useCallback((release: ReleaseGroup, tracks: string[]) => {
    if (tracks.length === 0) {
      setSelectedReleases((prev) => prev.filter((r) => r.id !== release.id));
      return;
    }

    setAllTracks((prev) => ({ ...prev, [release.id]: tracks }));
    setSelectedReleases((prev) => 
      prev.some((r) => r.id === release.id) ? prev : [...prev, release]
    );
  }, []);

  const handleSearchStart = useCallback(() => {
    setSelectedReleases([]);
    setAllTracks({});
    setSessionId(null);
    setError(null);
    setView("catalog");
  }, []);

  const startRankingSession = useCallback(
    async (songs: string[]) => {
      setIsCreatingSession(true);
      setError(null);

      const songInputs = prepareSongInputs(songs, selectedReleases, allTracks);

      try {
        const session = await createSession({
          user_id: user?.id,
          songs: songInputs,
        });
        
        // Clear sessions cache to ensure the new session appears when opening "My Sessions"
        if (user?.id) {
          localStorage.removeItem(`sr_sessions_${user.id}`);
        }
        
        setSessionId(session.session_id);
        setView("ranking");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize ranking session");
      } finally {
        setIsCreatingSession(false);
      }
    },
    [selectedReleases, allTracks, user?.id]
  );

  const handleStartRanking = useCallback(async () => {
    const rawTracks = selectedReleases.flatMap((r) => allTracks[r.id] ?? []);
    const flatTracks = filterTracks(rawTracks);
    const groups = findPotentialDuplicates(flatTracks);

    if (groups.length > 0) {
      setDuplicateGroups(groups);
      setFinalSongList(flatTracks);
      setView("dedupe");
    } else {
      const uniqueTracks = Array.from(new Set(flatTracks));
      setFinalSongList(uniqueTracks);
      await startRankingSession(uniqueTracks);
    }
  }, [selectedReleases, allTracks, startRankingSession]);

  const handleConfirmDeduplication = useCallback(
    async (songs: string[]) => {
      setFinalSongList(songs);
      await startRankingSession(songs);
    },
    [startRankingSession]
  );

  const handleSessionSelect = useCallback((id: string) => {
    setSelectedReleases([]);
    setAllTracks({});
    setError(null);
    setSessionId(id);
    setView("ranking");
    setOpenInResultsView(false);
  }, []);

  /** Open a completed session directly in the results (Leaderboard) view; used from My Rankings settled cards. */
  const handleViewResults = useCallback((id: string) => {
    setSelectedReleases([]);
    setAllTracks({});
    setError(null);
    setSessionId(id);
    setView("ranking");
    setOpenInResultsView(true);
  }, []);

  const handleBackFromResults = useCallback(() => {
    setView("my_rankings");
    setSessionId(null);
    setOpenInResultsView(false);
  }, []);

  const handleSessionDelete = useCallback((id: string) => {
    if (sessionId === id) {
      setSessionId(null);
      setView("catalog");
    }
  }, [sessionId]);

  return (
    <div key={user?.id || "guest"} className="flex h-full w-full overflow-hidden bg-background relative">
      {/* Navigator tab when collapsed: vertical bar with arrow + "NAVIGATOR" */}
      <AnimatePresence>
        {isSidebarCollapsed && (
          <motion.button
            type="button"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 48, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={() => setIsSidebarCollapsed(false)}
            className="fixed left-0 top-16 md:top-20 bottom-0 z-40 flex flex-col items-center justify-center gap-4 shrink-0 border-r border-border bg-muted/30 hover:bg-muted/50 backdrop-blur-sm transition-colors cursor-pointer group"
            aria-label="Open navigator"
          >
            <ChevronRight className="h-6 w-6 text-primary group-hover:translate-x-0.5 transition-transform shrink-0" />
            <span
              className="text-[10px] font-mono font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors"
              style={{ writingMode: "vertical-rl", textOrientation: "mixed", transform: "rotate(180deg)" }}
            >
              Navigator
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Mobile Backdrop */}
      <AnimatePresence>
        {!isSidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarCollapsed(true)}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Left Panel: Catalog */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isSidebarCollapsed ? 0 : "var(--sidebar-width)",
          opacity: isSidebarCollapsed ? 0 : 1,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "fixed inset-y-0 left-0 z-50 md:relative md:z-0 flex flex-col h-full overflow-hidden border-r bg-background md:bg-muted/10 [--sidebar-width:100%] md:[--sidebar-width:33.333333%] md:max-w-md",
          isSidebarCollapsed ? "pointer-events-none" : "pointer-events-auto"
        )}
      >
        <div className="p-4 md:p-6 h-full flex flex-col w-full">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-mono font-black uppercase tracking-[0.2em] text-primary/60">Navigator</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSidebarCollapsed(true)}
              className="h-10 w-10 md:h-8 md:w-8 text-muted-foreground hover:text-primary"
            >
              <ChevronLeft className="h-6 w-6 md:h-4 md:w-4" />
            </Button>
          </div>
          <Catalog
            onToggle={handleToggle}
            onSearchStart={handleSearchStart}
            onStartRanking={handleStartRanking}
            onSessionSelect={handleSessionSelect}
            onViewResults={handleViewResults}
            onSessionDelete={handleSessionDelete}
            onAnalyticsOpen={() => setView("analytics")}
            onRankingsOpen={() => setView("my_rankings")}
            showAnalyticsPanel={view === "analytics"}
            showRankingsPanel={view === "my_rankings"}
            selectedIds={selectedReleases.map((r) => r.id)}
            activeSessionId={sessionId}
          />
        </div>
      </motion.aside>

      {/* Right Panel: Ranking or Analytics — expands into full space when navigator is collapsed */}
      <main
        className={cn(
          "flex-1 min-h-0 h-full overflow-hidden bg-linear-to-br from-background via-background to-primary/5 relative transition-[margin] duration-200",
          isSidebarCollapsed && "pl-12"
        )}
      >
        <AnimatePresence>
          {isCreatingSession && <LoadingOverlay />}
          {error && (
            <ErrorOverlay
              error={error}
              onDismiss={() => setError(null)}
              onRetry={() => handleStartRanking()}
            />
          )}
        </AnimatePresence>
        
        {view === "analytics" ? (
          <div
            className={cn(
              "flex flex-col min-h-0 h-full w-full py-4 md:py-8 overflow-y-auto",
              isSidebarCollapsed ? "max-w-none px-2 md:px-3" : "max-w-none px-4 md:px-6"
            )}
          >
            <AnalyticsPage isSidebarCollapsed={isSidebarCollapsed} />
          </div>
        ) : view === "my_rankings" ? (
          <div
            className={cn(
              "flex flex-col min-h-0 h-full w-full py-4 md:py-8 overflow-y-auto",
              isSidebarCollapsed ? "max-w-none px-2 md:px-3" : "max-w-none px-4 md:px-6"
            )}
          >
            <MyRankingsOverview
              isSidebarCollapsed={isSidebarCollapsed}
              onSelectSession={handleSessionSelect}
            />
          </div>
        ) : (
          <RankingWidget
            isRanking={view === "ranking"}
            sessionId={sessionId}
            openInResultsView={openInResultsView}
            onBackFromResults={handleBackFromResults}
          />
        )}
      </main>


      <DeduplicationModal
        isOpen={view === "dedupe"}
        onClose={() => setView("catalog")}
        onConfirm={handleConfirmDeduplication}
        duplicateGroups={duplicateGroups}
        allSongs={finalSongList}
      />
    </div>
  );
}

function LoadingOverlay(): JSX.Element {
  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <div className="text-center space-y-1">
        <h3 className="text-lg font-bold font-mono uppercase tracking-tight">
          Initializing Session
        </h3>
        <p className="text-xs text-muted-foreground font-mono">
          Setting up your ranking environment...
        </p>
      </div>
    </div>
  );
}

type ErrorOverlayProps = Readonly<{
  error: string;
  onDismiss: () => void;
  onRetry: () => void;
}>;

function ErrorOverlay({
  error,
  onDismiss,
  onRetry,
}: ErrorOverlayProps): JSX.Element {
  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-6 animate-in fade-in duration-300 p-8 text-center">
      <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <div className="space-y-2 max-w-md">
        <h3 className="text-xl font-bold font-mono uppercase tracking-tight text-destructive">
          Initialization Failed
        </h3>
        <p className="text-sm text-muted-foreground font-mono">{error}</p>
      </div>
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={onDismiss}
          className="font-mono uppercase tracking-widest text-xs py-6 px-8"
        >
          Go Back
        </Button>
        <Button
          onClick={onRetry}
          className="bg-primary text-primary-foreground font-mono uppercase tracking-widest text-xs py-6 px-8"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}
