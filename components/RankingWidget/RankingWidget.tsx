"use client";

import { useState, useEffect, useCallback, Fragment, useRef } from "react";
import type { JSX } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { getSessionDetail, createComparison, undoLastComparison, type SessionSong, type SessionDetail } from "@/lib/api";
import { 
  getNextPair, 
  createComparisonHistory, 
  recordComparison,
  buildHistoryFromComparisons,
  type ComparisonHistory 
} from "@/lib/pairing";
import { calculateNewRatings, calculateKFactor } from "@/lib/elo";
import { Music, LogIn, Loader2, Scale, Meh, Undo2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { RankingCard } from "@/components/RankingCard";
import { Leaderboard } from "@/components/Leaderboard";
import { showError } from "@/components/ErrorBanner";
import { useQueryClient } from "@tanstack/react-query";

// Extracted components
import { KeyboardShortcutsHelp } from "./KeyboardShortcutsHelp";
import { HeaderSection } from "./HeaderSection";
import { ProgressSection } from "./ProgressSection";
import { PairingLoader } from "./PairingLoader";
import { RankingPlaceholder } from "./RankingPlaceholder";
import { RankingControlButton } from "./RankingControlButton";
import { LeaderboardPreviewModal } from "./LeaderboardPreviewModal";
import { RankUpdateNotification } from "./RankUpdateNotification";

// Custom hooks
import { 
  useConvergenceTracking, 
  useWindowFocusTimer, 
  useTimedNotification 
} from "./useConvergenceTracking";

type RankingWidgetProps = Readonly<{
  isRanking?: boolean;
  sessionId?: string | null;
  /** When true, load session and show Leaderboard (results) directly instead of duel UI. */
  openInResultsView?: boolean;
  /** Initial mode to show: 'results' or 'duel' (default) */
  initialMode?: string;
  /** When openInResultsView, called when user taps "Keep Ranking" / back from results (e.g. return to My Rankings). */
  onBackFromResults?: () => void;
}>;

export function RankingWidget({
  isRanking,
  sessionId,
  openInResultsView = false,
  initialMode,
  onBackFromResults,
}: RankingWidgetProps): JSX.Element {
  const { user, openAuthModal } = useAuth();
  const queryClient = useQueryClient();
  const isMounted = useRef(true);
  
  // Core state
  const [songs, setSongs] = useState<SessionSong[]>([]);
  const [currentPair, setCurrentPair] = useState<[SessionSong, SessionSong] | null>(null);
  const [comparisonHistory, setComparisonHistory] = useState<ComparisonHistory>(() => createComparisonHistory());
  const [isLoading, setIsLoading] = useState(false);
  const [totalDuels, setTotalDuels] = useState(0);
  const [convergence, setConvergence] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  
  // UI state
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [isTie, setIsTie] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);
  const [showPeek, setShowPeek] = useState(false);

  // Use extracted hooks
  const { displayScore } = useConvergenceTracking({ convergence });

  const { resetTimer, getDecisionTime, startPeekPause, endPeekPause } = useWindowFocusTimer();
  const { isVisible: showRankNotification, show: showRankUpdateNotification, hide: hideRankNotification } = useTimedNotification(4000);

  // Track previous convergence for polling
  const previousConvergenceRef = useRef<number>(0);

  useEffect(() => {
    previousConvergenceRef.current = convergence;
  }, [convergence]);

  // Handle peek modal pause timing
  useEffect(() => {
    if (showPeek) {
      startPeekPause();
    } else {
      endPeekPause();
    }
  }, [showPeek, startPeekPause, endPeekPause]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Load session data
  useEffect(() => {
    if (!isRanking || !sessionId) return;

    // Reset state
    setSongs([]);
    setCurrentPair(null);
    setTotalDuels(0);
    setConvergence(0);
    setIsFinished(false);
    setWinnerId(null);
    setIsTie(false);
    setIsSkipping(false);
    hideRankNotification();
    previousConvergenceRef.current = 0;

    let isCurrent = true;

    async function loadSongs(): Promise<void> {
      setIsLoading(true);
      try {
        const detail = await getSessionDetail(sessionId!);
        if (detail && isMounted.current && isCurrent) {
          // Build history from existing comparisons (preserves state across page refresh)
          const detailWithComparisons = detail as SessionDetail;
          const history = detailWithComparisons.comparisons?.length 
            ? buildHistoryFromComparisons(detailWithComparisons.comparisons)
            : createComparisonHistory();
          setComparisonHistory(history);
          
          // Recalculate comparison_count from MEANINGFUL comparisons only
          // IDC responses (winner_id=null, is_tie=false) don't count for pairing priority
          const comparisonCounts: Record<string, number> = {};
          if (detailWithComparisons.comparisons) {
            for (const comp of detailWithComparisons.comparisons) {
              // Skip IDC responses - they don't provide ranking information
              const isMeaningful = comp.winner_id != null || comp.is_tie === true;
              if (!isMeaningful) continue;
              
              comparisonCounts[comp.song_a_id] = (comparisonCounts[comp.song_a_id] ?? 0) + 1;
              comparisonCounts[comp.song_b_id] = (comparisonCounts[comp.song_b_id] ?? 0) + 1;
            }
          }
          
          const songsWithAccurateCounts = detail.songs.map(song => ({
            ...song,
            comparison_count: comparisonCounts[song.song_id] ?? 0
          }));
          
          setSongs(songsWithAccurateCounts);
          setTotalDuels(detail.comparison_count);
          setConvergence(detail.convergence_score ?? 0);
          setCurrentPair(getNextPair(songsWithAccurateCounts, history));
          resetTimer();
          
          if (openInResultsView || initialMode === "results" || !user) {
            setIsFinished(true);
          }
        }
      } catch (error) {
        console.error("Failed to load ranking songs:", error);
      } finally {
        if (isMounted.current && isCurrent) {
          setIsLoading(false);
        }
      }
    }
    loadSongs();

    return () => {
      isCurrent = false;
    };
  }, [isRanking, sessionId, openInResultsView, resetTimer, hideRankNotification, initialMode, user]);

  const handleChoice = useCallback(
    async (winner: SessionSong | null, tie: boolean = false) => {
      if (!currentPair || !sessionId || winnerId) return;

      const [songA, songB] = currentPair;
      const wId = winner?.song_id || null;

      setWinnerId(wId);
      setIsTie(tie);

      const decisionTime = getDecisionTime();
      const kFactor = calculateKFactor(decisionTime);

      await new Promise((resolve) => setTimeout(resolve, 600));

      const scoreA = tie ? 0.5 : wId === songA.song_id ? 1 : 0;
      const [newEloA, newEloB] = calculateNewRatings(songA.local_elo, songB.local_elo, scoreA, kFactor);

      const updatedSongs = songs.map((s) => {
        if (s.song_id === songA.song_id) {
          return { ...s, local_elo: newEloA, comparison_count: (s.comparison_count ?? 0) + 1 };
        }
        if (s.song_id === songB.song_id) {
          return { ...s, local_elo: newEloB, comparison_count: (s.comparison_count ?? 0) + 1 };
        }
        return s;
      });

      recordComparison(comparisonHistory, songA.song_id, songB.song_id);

      setSongs(updatedSongs);
      setCurrentPair(getNextPair(updatedSongs, comparisonHistory));
      resetTimer();

      setWinnerId(null);
      setIsTie(false);
      setTotalDuels((prev) => prev + 1);

      try {
        const response = await createComparison(sessionId, {
          song_a_id: songA.song_id,
          song_b_id: songB.song_id,
          winner_id: wId,
          is_tie: tie,
          decision_time_ms: decisionTime,
        });

        if (response.success) {
          queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
          queryClient.invalidateQueries({ queryKey: ["artists", "leaderboards"] });
          queryClient.invalidateQueries({ queryKey: ["activity", "global"] });

          const newScore = response.convergence_score ?? 0;
          if (isMounted.current) {
            setConvergence(prev => {
              if (newScore > prev && newScore >= 90) {
                showRankUpdateNotification();
              }
              return Math.max(prev, newScore);
            });
          }

          if (response.sync_queued) {
            const pollForUpdate = async () => {
              if (!isMounted.current) return;
              
              const maxAttempts = 4;
              const delays = [400, 800, 1500, 2500];
              const previousConvergenceValue = previousConvergenceRef.current;
              
              for (let attempt = 0; attempt < maxAttempts; attempt++) {
                if (!isMounted.current) return;
                if (attempt > 0) await new Promise(resolve => setTimeout(resolve, delays[attempt - 1]));
                
                try {
                  const detail = await getSessionDetail(sessionId);
                  if (detail && isMounted.current) {
                    if (detail.songs && detail.songs.length > 0) {
                      setSongs(prevSongs => detail.songs.map(backendSong => {
                        const isCurrentPair = currentPair.some(p => p.song_id === backendSong.song_id);
                        if (isCurrentPair) {
                          const local = prevSongs.find(s => s.song_id === backendSong.song_id);
                          return { ...backendSong, local_elo: local?.local_elo ?? backendSong.local_elo };
                        }
                        return backendSong;
                      }));
                    }
                    
                    const detailScore = detail.convergence_score ?? 0;
                    if (detailScore > previousConvergenceValue) {
                      setConvergence(prev => {
                        if (detailScore > prev && detailScore >= 90) {
                          showRankUpdateNotification();
                        }
                        return Math.max(prev, detailScore);
                      });
                      setTotalDuels(prev => Math.max(prev, detail.comparison_count));
                      previousConvergenceRef.current = detailScore;
                      return;
                    }
                    setTotalDuels(prev => Math.max(prev, detail.comparison_count));
                  }
                } catch (error) {
                  console.error(`[Sync] Poll attempt ${attempt + 1} failed:`, error);
                }
              }
            };
            pollForUpdate();
          }
        }
      } catch (error) {
        console.error("Failed to sync comparison:", error);
      }
    },
    [currentPair, sessionId, winnerId, songs, queryClient, comparisonHistory, getDecisionTime, resetTimer, showRankUpdateNotification]
  );

  const handleUndo = useCallback(async (): Promise<void> => {
    if (!sessionId || totalDuels === 0 || isUndoing) return;
    setIsUndoing(true);
    try {
      const response = await undoLastComparison(sessionId);
      if (!response.success || !isMounted.current) return;

      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["artists", "leaderboards"] });
      queryClient.invalidateQueries({ queryKey: ["activity", "global"] });

      const updatedSongs = songs.map((s) => {
        if (s.song_id === response.song_a_id) {
          return { ...s, local_elo: response.restored_elo_a, comparison_count: Math.max(0, (s.comparison_count ?? 0) - 1) };
        }
        if (s.song_id === response.song_b_id) {
          return { ...s, local_elo: response.restored_elo_b, comparison_count: Math.max(0, (s.comparison_count ?? 0) - 1) };
        }
        return s;
      });
      setSongs(updatedSongs);
      setTotalDuels((prev) => prev - 1);
      setWinnerId(null);
      setIsTie(false);
      resetTimer();

      const songA = updatedSongs.find((s) => s.song_id === response.song_a_id);
      const songB = updatedSongs.find((s) => s.song_id === response.song_b_id);
      if (songA && songB) {
        setCurrentPair([songA, songB]);
      } else {
        setCurrentPair(getNextPair(updatedSongs, comparisonHistory));
      }

      setTimeout(() => {
        if (!isMounted.current || !sessionId) return;
        getSessionDetail(sessionId).then((detail) => {
          if (detail && isMounted.current) {
            setConvergence(detail.convergence_score ?? 0);
          }
        }).catch(() => {});
      }, 500);
    } catch (error) {
      console.error("Failed to undo last comparison:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Undo isn't available for this session. Sessions created before undo was added don't have the data needed to restore the previous state.";
      showError(message);
    } finally {
      if (isMounted.current) setIsUndoing(false);
    }
  }, [sessionId, totalDuels, isUndoing, songs, comparisonHistory, queryClient, resetTimer]);

  const handleSkip = useCallback(async (): Promise<void> => {
    if (!currentPair || !sessionId) return;
    
    setIsSkipping(true);
    const decisionTime = getDecisionTime();
    await new Promise((resolve) => setTimeout(resolve, 200));

    const [songA, songB] = currentPair;
    const [newEloA] = calculateNewRatings(songA.local_elo, songB.local_elo, 0);
    const [, newEloB] = calculateNewRatings(songA.local_elo, songB.local_elo, 1);

    // IDC doesn't increment comparison_count - it's not a meaningful comparison
    // for pairing priority purposes. The backend also excludes IDC from convergence.
    const updatedSongs = songs.map((s) => {
      if (s.song_id === songA.song_id) {
        return { ...s, local_elo: newEloA };
      }
      if (s.song_id === songB.song_id) {
        return { ...s, local_elo: newEloB };
      }
      return s;
    });
    
    // Still record in history to avoid showing the same pair again
    recordComparison(comparisonHistory, songA.song_id, songB.song_id);
    
    setSongs(updatedSongs);
    setCurrentPair(getNextPair(updatedSongs, comparisonHistory));
    resetTimer();

    setTotalDuels((prev) => prev + 1);
    setIsSkipping(false);

    createComparison(sessionId, {
      song_a_id: songA.song_id,
      song_b_id: songB.song_id,
      winner_id: null,
      is_tie: false,
      decision_time_ms: decisionTime,
    }).catch(err => console.error("Failed to record skip:", err));
  }, [currentPair, sessionId, songs, comparisonHistory, getDecisionTime, resetTimer]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!currentPair || !!winnerId || isTie || isSkipping) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (window.innerWidth < 768) return;

      switch (e.code) {
        case "ArrowLeft":
          e.preventDefault();
          handleChoice(currentPair[0]);
          break;
        case "ArrowRight":
          e.preventDefault();
          handleChoice(currentPair[1]);
          break;
        case "ArrowUp":
          e.preventDefault();
          handleChoice(null, true);
          break;
        case "ArrowDown":
          e.preventDefault();
          handleSkip();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPair, winnerId, isTie, isSkipping, handleChoice, handleSkip]);

  if (isLoading && songs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Loading Ranking Data...
        </p>
      </div>
    );
  }

  if (isFinished) {
    return (
      <Leaderboard
        songs={songs}
        onContinue={openInResultsView && onBackFromResults ? onBackFromResults : () => setIsFinished(false)}
        isPreview={false}
        backButtonLabel={openInResultsView ? "Back to My Rankings" : undefined}
        sessionId={sessionId}
        isGuest={!user}
      />
    );
  }

  // Render states
  if (!user) {
    return (
      <RankingPlaceholder
        title="Authentication Required"
        description="Sign in to search for artists, select albums, and start ranking your favorite tracks."
        icon={<LogIn className="h-6 w-6 text-primary" />}
        onClick={() => openAuthModal("login")}
      />
    );
  }

  if (!isRanking || !sessionId) {
    return (
      <RankingPlaceholder
        title="Ready to Rank?"
        description="Select albums from the catalog to start ranking your favorite tracks."
        icon={<Music className="h-5 w-5" />}
        hideButton
      />
    );
  }

  return (
    <div className="flex flex-col h-full w-full px-4 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:px-6 md:py-6 lg:px-8 lg:py-8 overflow-hidden">
      <KeyboardShortcutsHelp />
      
      <LeaderboardPreviewModal 
        isOpen={showPeek} 
        songs={songs} 
        onClose={() => setShowPeek(false)} 
      />

      <RankUpdateNotification isVisible={showRankNotification} />

      <div className="flex flex-col items-center gap-3 md:gap-6 lg:gap-8 animate-in fade-in duration-700 w-full h-full min-h-0">
        <HeaderSection totalDuels={totalDuels} songCount={songs.length} />

        <ProgressSection
          displayScore={displayScore}
          totalDuels={totalDuels}
          songCount={songs.length}
          onViewResults={() => setIsFinished(true)}
          onPeekRankings={() => setShowPeek(true)}
        />

        {/* Duel Area */}
        <div className="flex-1 flex flex-col md:flex-row items-center gap-4 md:gap-12 lg:gap-16 w-full justify-center px-2 md:px-12 min-h-0 overflow-visible">
          {!currentPair ? (
            <PairingLoader />
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-12 lg:gap-16 w-full justify-center min-h-0">
              {[0, 1].map((index) => (
                <Fragment key={index}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentPair[index].song_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, ease: "linear" }}
                      className={cn(
                        "flex justify-center shrink w-full md:w-auto min-w-0",
                        index === 0 ? "items-end md:items-center" : "items-start md:items-center"
                      )}
                    >
                      <RankingCard
                        song={currentPair[index]}
                        onClick={() => handleChoice(currentPair[index])}
                        isWinner={winnerId === currentPair[index].song_id}
                        disabled={!!winnerId || isTie}
                      />
                    </motion.div>
                  </AnimatePresence>

                  {index === 0 && (
                    <div className="flex flex-row md:flex-col gap-2 md:gap-4 lg:gap-5 items-center shrink-0 w-full md:w-auto justify-center px-0 md:px-0">
                      <div className="flex-1 md:flex-none min-w-0 md:w-48 lg:w-52">
                        <RankingControlButton
                          icon={<Scale className="size-5 md:size-8" strokeWidth={2} />}
                          label="Tie"
                          onClick={() => handleChoice(null, true)}
                          disabled={!!winnerId || isTie || isSkipping}
                          isActive={isTie}
                        />
                      </div>
                      <div className="flex-1 md:flex-none min-w-0 md:w-48 lg:w-52">
                        <RankingControlButton
                          icon={<Meh className="size-5 md:size-8" strokeWidth={2} />}
                          label="IDC"
                          onClick={handleSkip}
                          disabled={!!winnerId || isTie || isSkipping}
                          isActive={isSkipping}
                        />
                      </div>
                      <div className="flex-1 md:flex-none min-w-0 md:w-48 lg:w-52">
                        <RankingControlButton
                          icon={<Undo2 className="size-5 md:size-8" strokeWidth={2} />}
                          label="Undo"
                          onClick={handleUndo}
                          disabled={totalDuels === 0 || isUndoing || !!winnerId || isTie || isSkipping}
                          isActive={false}
                        />
                      </div>
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
