"use client";

import { useState, useEffect, useCallback, Fragment, useRef } from "react";
import type { JSX } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { getSessionDetail, createComparison, type SessionSong } from "@/lib/api";
import { getNextPair } from "@/lib/pairing";
import { calculateNewRatings } from "@/lib/elo";
import { Music, LogIn, Loader2, Trophy, Scale, RotateCcw, Check, Sparkles } from "lucide-react";
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
  const prevTop10Ref = useRef<string[]>([]);
  const [songs, setSongs] = useState<SessionSong[]>([]);
  const [currentPair, setCurrentPair] = useState<[SessionSong, SessionSong] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [totalDuels, setTotalDuels] = useState(0);
  const [convergence, setConvergence] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [isTie, setIsTie] = useState(false);
  const [showRankUpdate, setShowRankUpdate] = useState(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const quantityTarget = Math.max(1, songs.length * 1.5);
  const quantityProgress = Math.min(100, (totalDuels / quantityTarget) * 100);
  const optimisticMin = Math.min(40, quantityProgress);
  const displayScore = Math.max(convergence, optimisticMin);

  // Track Top 10 changes
  useEffect(() => {
    if (songs.length === 0) return;

    const currentTop10 = [...songs]
      .sort((a, b) => {
        const scoreA = a.bt_strength ?? a.local_elo / 3000;
        const scoreB = b.bt_strength ?? b.local_elo / 3000;
        return scoreB - scoreA;
      })
      .slice(0, 10)
      .map((s) => s.song_id);

    if (prevTop10Ref.current.length > 0) {
      const isDifferent =
        currentTop10.length !== prevTop10Ref.current.length ||
        currentTop10.some((id, i) => id !== prevTop10Ref.current[i]);

      // Only show the toast once we've reached the convergence requirement (90%)
      if (isDifferent && displayScore >= 90) {
        setShowRankUpdate(true);
        const timer = setTimeout(() => setShowRankUpdate(false), 3000);
        return () => clearTimeout(timer);
      }
    }

    prevTop10Ref.current = currentTop10;
  }, [songs, displayScore]);

  useEffect(() => {
    if (!isRanking || !sessionId) return;

    async function loadSongs(): Promise<void> {
      setIsLoading(true);
      try {
        const detail = await getSessionDetail(sessionId!);
        if (detail && isMounted.current) {
          setSongs(detail.songs);
          setTotalDuels(detail.comparison_count);
          setConvergence(detail.convergence_score ?? 0);
          setCurrentPair(getNextPair(detail.songs));
        }
      } catch (error) {
        console.error("Failed to load session songs:", error);
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    }
    loadSongs();
  }, [isRanking, sessionId]);

  const handleChoice = useCallback(
    async (winner: SessionSong | null, tie: boolean = false) => {
      if (!currentPair || !sessionId || winnerId) return;

      const [songA, songB] = currentPair;
      const wId = winner?.song_id || null;

      setWinnerId(wId);
      setIsTie(tie);

      await new Promise((resolve) => setTimeout(resolve, 600));

      const scoreA = tie ? 0.5 : wId === songA.song_id ? 1 : 0;
      const [newEloA, newEloB] = calculateNewRatings(songA.local_elo, songB.local_elo, scoreA);

      setSongs((prevSongs) => {
        const updated = prevSongs.map((s) => {
          if (s.song_id === songA.song_id) return { ...s, local_elo: newEloA };
          if (s.song_id === songB.song_id) return { ...s, local_elo: newEloB };
          return s;
        });

        setCurrentPair(getNextPair(updated));
        return updated;
      });

      setTotalDuels((prev) => prev + 1);
      setWinnerId(null);
      setIsTie(false);

      try {
        const response = await createComparison(sessionId, {
          song_a_id: songA.song_id,
          song_b_id: songB.song_id,
          winner_id: wId,
          is_tie: tie,
        });

        if (response.success) {
          const newScore = response.convergence_score ?? 0;
          if (isMounted.current) {
            setConvergence(prev => Math.max(prev, newScore));
          }

          if (response.sync_queued) {
            const syncData = async () => {
              if (!isMounted.current) return;
              try {
                const detail = await getSessionDetail(sessionId);
                if (detail && isMounted.current) {
                  if (detail.songs && detail.songs.length > 0) {
                    setSongs(prevSongs => {
                      return detail.songs.map(backendSong => {
                        const isCurrent = currentPair.some(p => p.song_id === backendSong.song_id);
                        if (isCurrent) {
                          const local = prevSongs.find(s => s.song_id === backendSong.song_id);
                          return { ...backendSong, local_elo: local?.local_elo ?? backendSong.local_elo };
                        }
                        return backendSong;
                      });
                    });
                  }
                  
                  const detailScore = detail.convergence_score ?? 0;
                  setConvergence(prev => Math.max(prev, detailScore));
                  setTotalDuels(prev => Math.max(prev, detail.comparison_count));
                }
              } catch (error) {
                console.error("Background sync failed:", error);
              }
            };

            setTimeout(syncData, 1000);
            setTimeout(syncData, 4000);
          }
        }
      } catch (error) {
        console.error("Failed to sync comparison:", error);
      }
    },
    [currentPair, sessionId, winnerId]
  );

  const handleSkip = useCallback((): void => {
    if (!currentPair || !sessionId) return;
    const [songA, songB] = currentPair;

    // Apply "double loss" penalty in local state for immediate feedback
    const [newEloA] = calculateNewRatings(songA.local_elo, songB.local_elo, 0);
    const [, newEloB] = calculateNewRatings(songA.local_elo, songB.local_elo, 1);

    setSongs((prevSongs) => {
      const updated = prevSongs.map((s) => {
        if (s.song_id === songA.song_id) return { ...s, local_elo: newEloA };
        if (s.song_id === songB.song_id) return { ...s, local_elo: newEloB };
        return s;
      });
      setCurrentPair(getNextPair(updated));
      return updated;
    });

    setTotalDuels((prev) => prev + 1);

    // Persist skip to backend
    createComparison(sessionId, {
      song_a_id: songA.song_id,
      song_b_id: songB.song_id,
      winner_id: null,
      is_tie: false,
    }).catch(err => console.error("Failed to record skip:", err));

  }, [currentPair, sessionId]);

  const getConvergenceLabel = (score: number) => {
    if (score < 30) return "Calibrating Rankings...";
    if (score < 60) return "Establishing Order...";
    if (score < 90) return "Stabilizing Top 10...";
    return "Top 10 Stable!";
  };

  if (!user) {
    return (
      <RankingPlaceholder
        title="Authentication Required"
        description="Sign in to search for artists, select albums, and start ranking your favorite tracks."
        icon={<LogIn className="h-5 w-5 group-hover:translate-x-1 transition-transform" />}
        buttonText="Sign In"
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
          Loading Session Data...
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
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto px-4 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:px-6 md:py-6 lg:px-8 lg:py-8 overflow-hidden">
      <div className="flex flex-col items-center gap-4 md:gap-6 lg:gap-8 animate-in fade-in zoom-in duration-700 w-full h-full min-h-0">
        {/* Header Section */}
        <div className="text-center space-y-2 md:space-y-3 relative shrink-0">
          <div className="hidden md:flex items-center justify-center gap-3 mb-0 md:mb-1">
            <div className="h-[1px] md:h-[2px] w-6 md:w-12 bg-primary/20 rounded-full" />
            <p className="text-[10px] md:text-[11px] font-black text-primary uppercase tracking-[0.2em] md:tracking-[0.3em] font-mono">
              {totalDuels === 0 ? "Initial Encounter" : `Duel #${totalDuels + 1}`}
            </p>
            <div className="h-[1px] md:h-[2px] w-6 md:w-12 bg-primary/20 rounded-full" />
          </div>

          <div className="relative inline-block mb-0.5 md:mb-0">
            <SpeedLines side="left" />
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tighter uppercase italic px-4 leading-none">
              Make Your Choice
            </h2>
            <SpeedLines side="right" />
          </div>

          <div className="flex items-center justify-center gap-4 text-[9px] md:text-[11px] lg:text-xs font-mono text-muted-foreground/60 uppercase font-bold">
            <StatBadge 
              icon={<div className="h-1 w-1 md:h-1.5 md:w-1.5 rounded-full bg-primary animate-pulse" />} 
              label={`${songs.length} Tracks`} 
            />
            <StatBadge 
              icon={<Trophy className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary/60" />} 
              label={`${totalDuels} Duels`} 
            />
          </div>
        </div>

        {/* Progress Section */}
        <div className="w-full max-w-xl space-y-2 px-6 md:px-4 shrink-0 relative">
          <AnimatePresence>
            {showRankUpdate && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute -top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary text-primary-foreground shadow-xl border border-primary/20"
              >
                <Sparkles className="h-3 w-3" />
                <span className="text-[10px] font-mono font-black uppercase tracking-widest whitespace-nowrap">
                  Top 10 Rankings Updated!
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center justify-between px-1">
             <p className="text-[8px] md:text-[10px] font-mono font-bold uppercase tracking-[0.1em] md:tracking-[0.2em] text-primary/60">
               {getConvergenceLabel(displayScore)}
             </p>
             <p className="text-[8px] md:text-[10px] font-mono font-bold text-muted-foreground/40">
               {Math.round(displayScore)}%
             </p>
          </div>
          <div className="h-1 lg:h-1.5 w-full bg-primary/10 rounded-full overflow-hidden border border-primary/5">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${displayScore}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          
          <AnimatePresence>
            {displayScore >= 90 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex justify-center pt-2 md:pt-4"
              >
                <Button 
                  onClick={() => setIsFinished(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono uppercase tracking-widest text-[10px] md:text-[11px] font-black py-3 md:py-4 px-6 md:px-8 rounded-xl group"
                >
                  <Check className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  View Results
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Duel Area */}
        <div className="flex-1 flex flex-col md:flex-row items-center gap-3 md:gap-12 lg:gap-16 w-full justify-center px-4 min-h-0 overflow-hidden">
          {!currentPair ? (
            <PairingLoader />
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-12 lg:gap-16 w-full justify-center h-full min-h-0">
              {[0, 1].map((index) => (


                <Fragment key={index}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentPair[index].song_id}
                      initial={{ opacity: 0, x: index === 0 ? -40 : 40, filter: "blur(12px)" }}
                      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, x: index === 0 ? -40 : 40, filter: "blur(12px)" }}
                      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                      className={cn(
                        "w-full flex-1 min-h-0 flex justify-center",
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
                    <div className="flex flex-row md:flex-col gap-2 md:gap-4 lg:gap-6 items-center shrink-0 w-full md:w-auto justify-center px-4 md:px-0">
                      <div className="relative hidden md:block">
                        <div className="h-10 w-10 lg:h-16 lg:w-16 rounded-full border-2 md:border-[3px] border-primary flex items-center justify-center bg-background shadow-lg relative z-10">
                          <span className="text-xs lg:text-lg font-mono font-black text-primary select-none">
                            VS
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col gap-2 md:gap-3 lg:gap-4 w-full md:w-auto">
                        <div className="flex-1 md:flex-none">
                          <RankingControlButton
                            icon={<Scale className="h-3.5 w-3.5 lg:h-5 lg:w-5" />}
                            label="Tie"
                            onClick={() => handleChoice(null, true)}
                            disabled={!!winnerId || isTie}
                          />
                        </div>
                        <div className="flex-1 md:flex-none">
                          <RankingControlButton
                            icon={<RotateCcw className="h-3.5 w-3.5 lg:h-5 lg:w-5" />}
                            label="Skip"
                            onClick={handleSkip}
                            disabled={!!winnerId || isTie}
                          />
                        </div>
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

type StatBadgeProps = Readonly<{
  icon: React.ReactNode;
  label: string;
}>;

function StatBadge({ icon, label }: StatBadgeProps): JSX.Element {
  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-border/40 bg-muted/10 backdrop-blur-sm">
      {icon}
      <span>{label}</span>
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

type RankingPlaceholderProps = Readonly<{
  title: string;
  description: string;
  icon?: React.ReactNode;
  buttonText?: string;
  onClick?: () => void;
  hideButton?: boolean;
}>;

function RankingPlaceholder({
  title,
  description,
  icon,
  buttonText,
  onClick,
  hideButton = false,
}: RankingPlaceholderProps): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-8">
      <div className="flex flex-col items-center gap-12 w-full max-w-2xl text-center">
        <div className="flex items-center gap-6 opacity-20 grayscale pointer-events-none scale-90 select-none">
          <div className="h-64 w-64 rounded-2xl border-2 border-dashed border-primary/50" />
          <div className="flex flex-col gap-6">
            <div className="h-28 w-44 rounded-xl border-2 border-dashed border-primary/50" />
            <div className="h-28 w-44 rounded-xl border-2 border-dashed border-primary/50" />
          </div>
          <div className="h-64 w-64 rounded-2xl border-2 border-dashed border-primary/50" />
        </div>
        <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold uppercase tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground font-mono max-w-sm">{description}</p>
          </div>
          {!hideButton && (
            <Button
              onClick={onClick}
              className="px-12 py-6 rounded-xl font-bold uppercase text-lg group"
            >
              {icon}
              {buttonText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

type RankingControlButtonProps = Readonly<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}>;

function RankingControlButton({
  icon,
  label,
  onClick,
  disabled,
}: RankingControlButtonProps): JSX.Element {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className="h-10 md:h-14 w-full md:w-36 rounded-xl md:rounded-2xl border-border/40 hover:border-primary/50 transition-all bg-muted/10 hover:bg-primary/5 group shadow-sm hover:shadow-primary/5 px-4 md:px-0"
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className="text-muted-foreground group-hover:text-primary transition-colors">
            {icon}
          </div>
        )}
        <span className="text-[10px] md:text-xs font-mono uppercase tracking-widest font-black">{label}</span>
      </div>
    </Button>
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
            width: isLeft ? [5, 20, 10, 15] : [10, 15, 5, 20],
            opacity: isLeft ? [0.2, 0.8, 0.4] : [0.4, 0.2, 0.8],
            x: isLeft ? [0, -2, 1, 0] : [0, 2, -1, 0],
          }}
          transition={{
            duration: (isLeft ? 0.15 : 0.2) + i * 0.05,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
