"use client";

import { useState, useEffect, useCallback, Fragment, useRef } from "react";
import type { JSX } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { getSessionDetail, createComparison, type SessionSong } from "@/lib/api";
import { getNextPair } from "@/lib/pairing";
import { calculateNewRatings, calculateKFactor } from "@/lib/elo";
import { Music, LogIn, Loader2, Trophy, Scale, Meh, Sword, ChartNetwork, Eye, RotateCcw } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { RankingCard } from "@/components/RankingCard";
import { Leaderboard } from "@/components/Leaderboard";

type RankingWidgetProps = Readonly<{
  isRanking?: boolean;
  sessionId?: string | null;
}>;

export function RankingWidget({
  isRanking,
  sessionId,
}: RankingWidgetProps): JSX.Element {
  const { user, openAuthModal } = useAuth();
  const isMounted = useRef(true);
  const [songs, setSongs] = useState<SessionSong[]>([]);
  const [currentPair, setCurrentPair] = useState<[SessionSong, SessionSong] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [totalDuels, setTotalDuels] = useState(0);
  const [convergence, setConvergence] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [isTie, setIsTie] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [showRankUpdate, setShowRankUpdate] = useState(false);
  const [showProgressHint, setShowProgressHint] = useState(false);
  const [showPeek, setShowPeek] = useState(false);
  const lastPairLoadTime = useRef<number>(Date.now());
  const blurTimeRef = useRef<number | null>(null);
  const peekStartTimeRef = useRef<number | null>(null);
  const notificationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previousConvergenceRef = useRef<number>(0);

  useEffect(() => {
    const handleBlur = () => {
      blurTimeRef.current = Date.now();
    };
    const handleFocus = () => {
      if (blurTimeRef.current) {
        const pauseDuration = Date.now() - blurTimeRef.current;
        lastPairLoadTime.current += pauseDuration;
        blurTimeRef.current = null;
      }
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  useEffect(() => {
    if (showPeek) {
      peekStartTimeRef.current = Date.now();
    } else if (peekStartTimeRef.current) {
      const peekDuration = Date.now() - peekStartTimeRef.current;
      lastPairLoadTime.current += peekDuration;
      peekStartTimeRef.current = null;
    }
  }, [showPeek]);

  const triggerRankUpdateNotification = useCallback(() => {
    if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
    setShowRankUpdate(true);
    notificationTimerRef.current = setTimeout(() => {
      if (isMounted.current) setShowRankUpdate(false);
    }, 4000);
  }, []);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
    };
  }, []);

  useEffect(() => {
    previousConvergenceRef.current = convergence;
  }, [convergence]);

  useEffect(() => {
    if (!isRanking || !sessionId) return;

    setSongs([]);
    setCurrentPair(null);
    setTotalDuels(0);
    setConvergence(0);
    setIsFinished(false);
    setWinnerId(null);
    setIsTie(false);
    setIsSkipping(false);
    setShowRankUpdate(false);
    if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
    previousConvergenceRef.current = 0;

    let isCurrent = true;

    async function loadSongs(): Promise<void> {
      setIsLoading(true);
      try {
        const detail = await getSessionDetail(sessionId!);
        if (detail && isMounted.current && isCurrent) {
          setSongs(detail.songs);
          setTotalDuels(detail.comparison_count);
          setConvergence(detail.convergence_score ?? 0);
          setCurrentPair(getNextPair(detail.songs));
          lastPairLoadTime.current = Date.now();
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
  }, [isRanking, sessionId]);

  const quantityTarget = Math.max(1, songs.length * 1.5);
  const quantityProgress = Math.min(100, (totalDuels / quantityTarget) * 100);
  const optimisticMin = Math.min(40, quantityProgress);
  const displayScore = Math.max(convergence, optimisticMin);

  useEffect(() => {
    if (displayScore === 40 && quantityProgress >= 40) {
      const timer = setTimeout(() => setShowProgressHint(true), 4000);
      return () => clearTimeout(timer);
    } else {
      setShowProgressHint(false);
    }
  }, [displayScore, quantityProgress]);

  const handleChoice = useCallback(
    async (winner: SessionSong | null, tie: boolean = false) => {
      if (!currentPair || !sessionId || winnerId) return;

      const [songA, songB] = currentPair;
      const wId = winner?.song_id || null;

      setWinnerId(wId);
      setIsTie(tie);

      const decisionTime = Date.now() - lastPairLoadTime.current;
      const kFactor = calculateKFactor(decisionTime);

      await new Promise((resolve) => setTimeout(resolve, 600));

      const scoreA = tie ? 0.5 : wId === songA.song_id ? 1 : 0;
      const [newEloA, newEloB] = calculateNewRatings(songA.local_elo, songB.local_elo, scoreA, kFactor);

      const updatedSongs = songs.map((s) => {
        if (s.song_id === songA.song_id) return { ...s, local_elo: newEloA };
        if (s.song_id === songB.song_id) return { ...s, local_elo: newEloB };
        return s;
      });

      setSongs(updatedSongs);
      setCurrentPair(getNextPair(updatedSongs));
      lastPairLoadTime.current = Date.now();

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
          const newScore = response.convergence_score ?? 0;
          if (isMounted.current) {
            setConvergence(prev => {
              if (newScore > prev && newScore >= 90) triggerRankUpdateNotification();
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
                        if (detailScore > prev && detailScore >= 90) triggerRankUpdateNotification();
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
    [currentPair, sessionId, winnerId, triggerRankUpdateNotification, songs]
  );

  const handleSkip = useCallback(async (): Promise<void> => {
    if (!currentPair || !sessionId) return;
    
    setIsSkipping(true);
    const decisionTime = Date.now() - lastPairLoadTime.current;
    await new Promise((resolve) => setTimeout(resolve, 200));

    const [songA, songB] = currentPair;
    const [newEloA] = calculateNewRatings(songA.local_elo, songB.local_elo, 0);
    const [, newEloB] = calculateNewRatings(songA.local_elo, songB.local_elo, 1);

    const updatedSongs = songs.map((s) => {
      if (s.song_id === songA.song_id) return { ...s, local_elo: newEloA };
      if (s.song_id === songB.song_id) return { ...s, local_elo: newEloB };
      return s;
    });
    setSongs(updatedSongs);
    setCurrentPair(getNextPair(updatedSongs));
    lastPairLoadTime.current = Date.now();

    setTotalDuels((prev) => prev + 1);
    setIsSkipping(false);

    createComparison(sessionId, {
      song_a_id: songA.song_id,
      song_b_id: songB.song_id,
      winner_id: null,
      is_tie: false,
      decision_time_ms: decisionTime,
    }).catch(err => console.error("Failed to record skip:", err));
  }, [currentPair, sessionId, songs]);

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

  const getConvergenceLabel = (score: number) => {
    if (score < 30) return "Calibrating Rankings...";
    if (score < 60) return "Establishing Order...";
    if (score < 90) return "Stabilizing Top 10...";
    return "Top 10 Stable!";
  };

  const getProgressColor = (score: number) => {
    if (score < 40) return "bg-red-500";
    if (score < 70) return "bg-yellow-500";
    return "bg-green-500";
  };

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
        onContinue={() => setIsFinished(false)} 
      />
    );
  }

  return (
    <div className="flex flex-col h-full w-full px-4 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:px-6 md:py-6 lg:px-8 lg:py-8 overflow-hidden">
      <KeyboardShortcutsHelp />
      
      <AnimatePresence>
        {showPeek && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-xl flex items-center justify-center p-4 md:p-8"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full h-full max-w-5xl bg-background border border-primary/10 rounded-[2rem] shadow-2xl overflow-hidden relative"
            >
              <Leaderboard 
                songs={songs} 
                onContinue={() => setShowPeek(false)} 
                isPreview 
              />
              <div className="absolute top-4 right-4 z-50">
                <Button variant="ghost" size="icon" onClick={() => setShowPeek(false)} className="rounded-full">
                  <RotateCcw className="h-6 w-6" />
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRankUpdate && (
          <motion.div
            initial={{ opacity: 0, x: 20, y: -10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 20, scale: 0.98 }}
            className="fixed top-16 md:top-20 right-4 md:right-8 z-50 flex items-center gap-4 px-6 py-4 rounded-md bg-zinc-950 text-zinc-100 shadow-2xl border border-white/10 backdrop-blur-md"
          >
            <ChartNetwork className="h-5 w-5 text-primary/80" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-mono font-black uppercase tracking-[0.15em] leading-none">
                Rankings Refined
              </span>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-tight">
                Model synchronization complete
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col items-center gap-3 md:gap-6 lg:gap-8 animate-in fade-in duration-700 w-full h-full min-h-0">
        {/* Header Section */}
        <div className="text-center space-y-1 md:space-y-3 relative shrink-0">
          <div className="hidden md:flex items-center justify-center gap-3 mb-0 md:mb-1">
            <div className="h-[1px] md:h-[2px] w-6 md:w-12 bg-primary/20 rounded-full" />
            <p className="text-[10px] md:text-[11px] font-black text-primary uppercase tracking-[0.2em] md:tracking-[0.3em] font-mono">
              {totalDuels === 0 ? "Initial Encounter" : `Duel #${totalDuels + 1}`}
            </p>
            <div className="h-[1px] md:h-[2px] w-6 md:w-12 bg-primary/20 rounded-full" />
          </div>

          <div className="relative inline-block mb-0.5 md:mb-0">
            <SpeedLines side="left" />
            <h2 className="text-xl md:text-3xl lg:text-4xl font-black tracking-tighter uppercase px-4 leading-none">
              Make Your Choice
            </h2>
            <h2 className="sr-only">Make Your Choice</h2>
            <SpeedLines side="right" />
          </div>

          <div className="flex items-center justify-center gap-3 md:gap-6 text-[10px] md:text-xs lg:text-sm font-mono text-muted-foreground/60 uppercase font-bold">
            <StatBadge 
              icon={<div className="h-2 w-2 md:h-2.5 md:w-2.5 rounded-full bg-primary animate-pulse" />} 
              label={`${songs.length} Tracks`} 
            />
            <StatBadge 
              icon={<Trophy className="h-4 w-4 md:h-5 md:w-5 text-primary/60" />} 
              label={`${totalDuels} Duels`} 
            />
          </div>
        </div>

        {/* Progress Section */}
        <div className="w-full max-w-xl space-y-1 md:space-y-2 px-4 shrink-0 relative">
          <div className="flex items-center justify-between px-1">
             <p className="text-[7px] md:text-[10px] font-mono font-bold uppercase tracking-[0.1em] md:tracking-[0.2em] text-primary/60">
               {getConvergenceLabel(displayScore)}
             </p>
             <p className="text-[7px] md:text-[10px] font-mono font-bold text-muted-foreground/40">
               {Math.round(displayScore)}%
             </p>
          </div>
          <div className="h-1.5 md:h-2 lg:h-3 w-full bg-primary/10 overflow-hidden">
            <motion.div 
              className={cn("h-full transition-colors duration-700", getProgressColor(displayScore))}
              initial={{ width: 0 }}
              animate={{ width: `${displayScore}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
           </div>

           <AnimatePresence>
             {showProgressHint && displayScore === 40 && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center justify-center gap-1.5 md:gap-2 pt-0.5 md:pt-1"
                >
                  <Sword className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary/50 animate-pulse" />
                  <p className="text-[8px] md:text-[10px] font-mono text-muted-foreground/70">
                    Keep battling! A few more duels will refine your rankings...
                  </p>
                </motion.div>
             )}
           </AnimatePresence>

            <AnimatePresence>
             {(displayScore >= 90 || totalDuels >= 15) && (
               <motion.div
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 className="flex flex-col items-center pt-6 md:pt-4"
               >
                 {displayScore >= 90 ? (
                   <Button 
                     onClick={() => setIsFinished(true)}
                     className="h-12 md:h-14 w-full rounded-xl bg-muted/10 hover:bg-primary/5 text-green-500 border border-green-500 font-mono hover:cursor-pointer uppercase tracking-[0.15em] md:tracking-[0.25em] text-[10px] md:text-xs font-black transition-all group active:scale-95"
                   >
                     View Results
                   </Button>
                 ) : (
                   <Button 
                     onClick={() => setShowPeek(true)}
                     variant="outline"
                     className="h-11 md:h-14 w-full border-primary/20 hover:border-primary/40 text-muted-foreground hover:text-primary font-mono uppercase tracking-widest text-[9px] md:text-[10px] font-black py-2 md:py-3 px-3 md:px-6 rounded-xl group bg-background/50 backdrop-blur-sm"
                   >
                     <Eye className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1.5 md:mr-2 group-hover:scale-110 transition-transform" />
                     Peek Rankings
                   </Button>
                 )}
               </motion.div>
             )}
           </AnimatePresence>
        </div>

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
                    <div className="flex flex-row md:flex-col gap-3 md:gap-4 lg:gap-5 items-center shrink-0 w-full md:w-auto justify-center px-2 md:px-0 max-w-[300px] md:max-w-none">
                        <div className="flex-1 md:flex-none min-w-0 md:w-48 lg:w-52">
                          <RankingControlButton
                            icon={<Scale className="size-5 md:size-8 shrink-0" strokeWidth={2} />}
                            label="Tie"
                            onClick={() => handleChoice(null, true)}
                            disabled={!!winnerId || isTie || isSkipping}
                            isActive={isTie}
                          />
                        </div>
                        <div className="flex-1 md:flex-none min-w-0 md:w-48 lg:w-52">
                          <RankingControlButton
                            icon={<Meh className="size-5 md:size-8 shrink-0" strokeWidth={2} />}
                            label="IDC"
                            onClick={handleSkip}
                            disabled={!!winnerId || isTie || isSkipping}
                            isActive={isSkipping}
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

function StatBadge({ icon, label }: { icon: React.ReactNode; label: string }): JSX.Element {
  return (
    <div className="flex items-center gap-2 md:gap-3 px-3 md:px-5 py-1 md:py-1.5 rounded-full border border-border/40 bg-muted/10 backdrop-blur-sm shadow-sm">
      {icon}
      <span className="tracking-[0.1em] md:tracking-[0.2em]">{label}</span>
    </div>
  );
}

function PairingLoader(): JSX.Element {
  return (
    <div className="h-[28rem] w-full max-w-4xl flex flex-col items-center justify-center gap-6 rounded-[2.5rem] border-2 border-dashed border-primary/10 bg-primary/[0.01]">
      <div className="h-16 w-16 rounded-full border-4 border-t-primary border-primary/10 animate-spin" />
      <div className="text-center space-y-2">
        <p className="text-[12px] font-mono uppercase tracking-[0.4em] text-primary/60 font-black">
          Optimizing Pairing Matrix
        </p>
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest opacity-40">
          Selecting the most impactful encounter
        </p>
      </div>
    </div>
  );
}

function RankingPlaceholder({
  title,
  description,
  icon,
  buttonText,
  onClick,
  hideButton = false,
}: Readonly<{
  title: string;
  description: string;
  icon?: React.ReactNode;
  buttonText?: string;
  onClick?: () => void;
  hideButton?: boolean;
}>): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-8">
      <div className="flex flex-col items-center gap-12 w-full max-w-2xl text-center">
        <div className="relative flex items-center justify-center gap-4 md:gap-8 opacity-25 grayscale pointer-events-none select-none transform transition-all duration-700 hover:opacity-40 hover:scale-105">
           <div className="absolute inset-0 bg-primary/20 blur-[60px] md:blur-[100px] rounded-full z-[-1]" />
           <div className="hidden md:block h-48 w-32 lg:h-64 lg:w-48 rounded-2xl border-2 border-dashed border-primary/40 bg-linear-to-b from-primary/5 to-transparent" />
           <div className="flex flex-col gap-4 md:gap-6 relative">
             <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-primary/20 -z-10 hidden md:block" />
             <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-primary/20 -z-10 md:hidden" />
             <div className="h-24 w-32 md:h-28 md:w-44 rounded-xl border-2 border-dashed border-primary/60 bg-background/50 backdrop-blur-xs flex items-center justify-center">
               <div className="h-8 w-8 rounded-full bg-primary/10" />
             </div>
             <div className="h-24 w-32 md:h-28 md:w-44 rounded-xl border-2 border-dashed border-primary/60 bg-background/50 backdrop-blur-xs flex items-center justify-center">
               <div className="h-8 w-8 rounded-full bg-primary/10" />
             </div>
           </div>
           <div className="hidden md:block h-48 w-32 lg:h-64 lg:w-48 rounded-2xl border-2 border-dashed border-primary/40 bg-linear-to-b from-primary/5 to-transparent" />
        </div>
        <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold uppercase tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground font-mono max-w-sm">{description}</p>
          </div>
          {!hideButton && (
            <Button
              onClick={onClick}
              className={cn(
                "border-2 border-primary bg-transparent hover:bg-primary/10 hover:scale-105 transition-all duration-300 group",
                buttonText ? "h-auto py-4 px-8 rounded-full" : "h-16 w-16 rounded-full"
              )}
            >
              {icon}
              {buttonText && <span className="ml-2">{buttonText}</span>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function RankingControlButton({
  icon,
  label,
  onClick,
  disabled,
  isActive,
}: {
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  isActive?: boolean;
}): JSX.Element {
  return (
    <Button
      variant={isActive ? "default" : "outline"}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-14 md:h-18 w-full md:w-48 rounded-xl md:rounded-2xl border-border/40 hover:border-primary/50 transition-all bg-zinc-900/60 hover:bg-zinc-800/80 group shadow-lg hover:shadow-primary/5 p-0 overflow-hidden",
        isActive && "bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:border-primary shadow-xl shadow-primary/25"
      )}
    >
      <div className="flex flex-row items-stretch h-full w-full">
        {icon && (
          <div className={cn(
            "flex items-center justify-center aspect-square h-full shrink-0 transition-colors border-r border-white/5",
            isActive ? "bg-white/20 text-white" : "bg-white/10 text-muted-foreground group-hover:text-primary group-hover:bg-white/20"
          )}>
            {icon}
          </div>
        )}
        <div className="flex items-center justify-center flex-1 px-3">
          <span className="text-[11px] md:text-base font-mono uppercase tracking-[0.25em] font-black">{label}</span>
        </div>
      </div>
    </Button>
  );
}

function KeyboardShortcutsHelp(): JSX.Element {
  return (
    <div className="hidden md:flex flex-col gap-1.5 fixed top-24 right-8 z-40 opacity-40 hover:opacity-100 transition-opacity p-4 rounded-xl bg-background/5 backdrop-blur-sm border border-primary/5">
      {[
        { label: "Select Left", key: "←" },
        { label: "Select Right", key: "→" },
        { label: "Tie", key: "↑" },
        { label: "IDC", key: "↓" },
      ].map(({ label, key }) => (
        <div key={label} className="flex items-center justify-end gap-3">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest font-medium">{label}</span>
          <kbd className="h-6 min-w-[24px] px-1.5 flex items-center justify-center rounded bg-muted/50 border border-border/50 text-muted-foreground font-mono text-[10px] font-bold shadow-sm">{key}</kbd>
        </div>
      ))}
    </div>
  );
}

function SpeedLines({ side }: { side: "left" | "right" }): JSX.Element {
  const isLeft = side === "left";
  return (
    <div 
      className={cn(
        "absolute top-0 bottom-0 flex flex-col justify-center gap-1 md:gap-2 pointer-events-none",
        isLeft ? "-left-8 md:-left-12" : "-right-8 md:-right-12"
      )}
    >
      {[1, 2, 3].map((i) => (
        <motion.div
          key={`${side}-${i}`}
          className={cn("h-[1px] md:h-[2px] bg-primary/40 rounded-full", !isLeft && "ml-auto")}
          animate={{
            width: isLeft ? [8, 12, 18, 14, 10, 8] : [10, 14, 18, 12, 8, 10],
            opacity: isLeft ? [0.3, 0.5, 0.7, 0.5, 0.3] : [0.4, 0.6, 0.7, 0.5, 0.4],
            x: isLeft ? [0, -1, -2, -1, 0] : [0, 1, 2, 1, 0],
          }}
          transition={{
            duration: (isLeft ? 1.8 : 2.1) + i * 0.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
