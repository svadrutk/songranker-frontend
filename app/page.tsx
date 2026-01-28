"use client";

import { useState, useCallback, useEffect, type JSX } from "react";
import { Catalog } from "@/components/Catalog";
import { RankingWidget } from "@/components/RankingWidget";
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

type ViewState = "catalog" | "dedupe" | "ranking";

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

  // Auto-collapse sidebar when ranking starts
  useEffect(() => {
    if (view === "ranking") {
      setIsSidebarCollapsed(true);
    }
  }, [view]);

  // Handle sidebar visibility
  useEffect(() => {
    const handleResize = () => {
      // If we are already ranking, don't mess with the sidebar based on auth
      if (view === "ranking") return;

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
    // Clear search state when switching to an existing session
    setSelectedReleases([]);
    setAllTracks({});
    setError(null);
    
    setSessionId(id);
    setView("ranking");
  }, []);

  const handleSessionDelete = useCallback((id: string) => {
    if (sessionId === id) {
      setSessionId(null);
      setView("catalog");
    }
  }, [sessionId]);

  return (
    <div key={user?.id || "guest"} className="flex h-full w-full overflow-hidden bg-background relative">
      {/* Sidebar Collapse Toggle (Only when collapsed) */}
      <AnimatePresence>
        {isSidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute left-4 bottom-6 md:bottom-auto md:top-1/2 md:-translate-y-1/2 z-40"
          >
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsSidebarCollapsed(false)}
              className="h-12 w-12 md:h-10 md:w-10 rounded-full border-primary/20 bg-background/80 backdrop-blur-xl shadow-2xl hover:bg-primary/5 group"
            >
              <ChevronRight className="h-6 w-6 md:h-5 md:w-5 text-primary group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </motion.div>
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
            onSessionDelete={handleSessionDelete}
            selectedIds={selectedReleases.map((r) => r.id)}
            activeSessionId={sessionId}
          />
        </div>
      </motion.aside>

      {/* Right Panel: Ranking */}
      <main className="flex-1 h-full overflow-hidden bg-linear-to-br from-background via-background to-primary/5 relative">
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
        <RankingWidget isRanking={view === "ranking"} sessionId={sessionId} />
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
