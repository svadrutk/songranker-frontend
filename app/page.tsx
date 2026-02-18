"use client";

import { useState, useCallback, type JSX } from "react";
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
import { useNavigationStore, useResponsiveSidebar } from "@/lib/store";

export default function Home(): JSX.Element {
  const { user } = useAuth();
  
  // Zustand store for navigation state
  const {
    view,
    isSidebarCollapsed,
    sessionId,
    openInResultsView,
    setView,
    setSidebarCollapsed,
    navigateToCatalog,
    navigateToAnalytics,
    navigateToMyRankings,
    navigateToRanking,
    navigateToResults,
    navigateBackFromResults,
  } = useNavigationStore();
  
  // Handle responsive sidebar behavior
  useResponsiveSidebar(user);
  
  // Local state for catalog/ranking workflow
  const [selectedReleases, setSelectedReleases] = useState<ReleaseGroup[]>([]);
  const [allTracks, setAllTracks] = useState<Record<string, string[]>>({});
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [finalSongList, setFinalSongList] = useState<string[]>([]);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    navigateToCatalog();
  }, [navigateToCatalog]);

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
        
        navigateToRanking(session.session_id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize ranking session");
      } finally {
        setIsCreatingSession(false);
      }
    },
    [selectedReleases, allTracks, user?.id, navigateToRanking]
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
    navigateToRanking(id);
  }, [navigateToRanking]);

  const handleViewResultsFromNavigator = useCallback((id: string) => {
    setSelectedReleases([]);
    setAllTracks({});
    setError(null);
    navigateToResults(id, "navigator");
  }, [navigateToResults]);

  const handleViewResultsFromKanban = useCallback((id: string) => {
    setSelectedReleases([]);
    setAllTracks({});
    setError(null);
    navigateToResults(id, "kanban");
  }, [navigateToResults]);

  const handleSessionDelete = useCallback((id: string) => {
    // Only navigate to catalog if we're currently viewing this session in the ranking view
    // Don't navigate away if we're on my_rankings or other views
    if (view === "ranking" && sessionId === id) {
      navigateToCatalog();
    }
  }, [view, sessionId, navigateToCatalog]);

  return (
    <div key={user?.id || "guest"} className="flex h-full w-full overflow-hidden bg-background relative">
      {/* Navigator toggle when collapsed */}
      <AnimatePresence>
        {isSidebarCollapsed && (
          <>
            {/* Mobile: Floating button at bottom-left */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="fixed left-4 bottom-6 z-40 md:hidden"
            >
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSidebarCollapsed(false)}
                className="h-12 w-12 rounded-full border-primary/20 bg-background/80 backdrop-blur-xl shadow-2xl hover:bg-primary/5 group"
              >
                <ChevronRight className="h-6 w-6 text-primary group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </motion.div>

            {/* Desktop: Vertical bar with "NAVIGATOR" text */}
            <motion.button
              type="button"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 48, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={() => setSidebarCollapsed(false)}
              className="hidden md:flex fixed left-0 top-16 md:top-20 bottom-0 z-40 flex-col items-center justify-center gap-4 shrink-0 border-r border-border bg-muted/30 hover:bg-muted/50 backdrop-blur-sm transition-colors cursor-pointer group"
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
          </>
        )}
      </AnimatePresence>

      {/* Mobile Backdrop */}
      <AnimatePresence>
        {!isSidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarCollapsed(true)}
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
          "fixed top-16 bottom-0 left-0 md:top-0 md:inset-y-0 z-50 md:relative md:z-0 flex flex-col h-auto md:h-full overflow-hidden border-r bg-background md:bg-muted/10 [--sidebar-width:100%] md:[--sidebar-width:33.333333%] md:max-w-md",
          isSidebarCollapsed ? "pointer-events-none" : "pointer-events-auto"
        )}
      >
        <div className="p-4 md:p-6 h-full flex flex-col w-full">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-mono font-black uppercase tracking-[0.2em] text-primary/60">Navigator</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSidebarCollapsed(true)}
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
            onViewResults={handleViewResultsFromNavigator}
            onSessionDelete={handleSessionDelete}
            onAnalyticsOpen={navigateToAnalytics}
            onRankingsOpen={() => navigateToMyRankings(true)}
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
          isSidebarCollapsed && "md:pl-12"
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
            <MyRankingsOverview isSidebarCollapsed={isSidebarCollapsed} onSessionDelete={handleSessionDelete} />
          </div>
        ) : (
          <RankingWidget
            isRanking={view === "ranking"}
            sessionId={sessionId}
            openInResultsView={openInResultsView}
            onBackFromResults={navigateBackFromResults}
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
