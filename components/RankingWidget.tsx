"use client";

import { useState, useEffect, useCallback } from "react";
import type { JSX } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getSessionDetail, createComparison, type SessionSong } from "@/lib/api";
import { getNextPair } from "@/lib/pairing";
import { calculateNewRatings } from "@/lib/elo";
import { Music, LogIn, Loader2, Trophy, Scale, RotateCcw } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { RankingCard } from "@/components/RankingCard";

type RankingWidgetProps = Readonly<{
  isRanking?: boolean;
  sessionId?: string | null;
}>;

export function RankingWidget({
  isRanking,
  sessionId,
}: RankingWidgetProps): JSX.Element {
  const { user, openAuthModal } = useAuth();
  const [songs, setSongs] = useState<SessionSong[]>([]);
  const [currentPair, setCurrentPair] = useState<[SessionSong, SessionSong] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [totalDuels, setTotalDuels] = useState(0);

  // Initial load of songs
  useEffect(() => {
    if (!isRanking || !sessionId) return;

    async function loadSongs(): Promise<void> {
      setIsLoading(true);
      try {
        const detail = await getSessionDetail(sessionId!);
        if (detail) {
          setSongs(detail.songs);
          setTotalDuels(detail.comparison_count);
          setCurrentPair(getNextPair(detail.songs));
        }
      } catch (error) {
        console.error("Failed to load session songs:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSongs();
  }, [isRanking, sessionId]);

  const handleChoice = useCallback(
    async (winner: SessionSong | null, isTie: boolean = false) => {
      if (!currentPair || !sessionId) return;

      const [songA, songB] = currentPair;
      const winnerId = winner?.song_id || null;

      // 1. Calculate new ratings
      const scoreA = isTie ? 0.5 : winnerId === songA.song_id ? 1 : 0;
      const [newEloA, newEloB] = calculateNewRatings(songA.local_elo, songB.local_elo, scoreA);

      // 2. Optimistic Update & Prepare next pair
      setSongs((prevSongs) => {
        const updated = prevSongs.map((s) => {
          if (s.song_id === songA.song_id) return { ...s, local_elo: newEloA };
          if (s.song_id === songB.song_id) return { ...s, local_elo: newEloB };
          return s;
        });

        // Set next pair immediately using the updated ratings
        setCurrentPair(getNextPair(updated));
        return updated;
      });

      setTotalDuels((prev) => prev + 1);

      // 3. Sync with Backend
      try {
        await createComparison(sessionId, {
          song_a_id: songA.song_id,
          song_b_id: songB.song_id,
          winner_id: winnerId,
          is_tie: isTie,
        });
      } catch (error) {
        console.error("Failed to sync comparison:", error);
      }
    },
    [currentPair, sessionId]
  );

  const handleSkip = useCallback((): void => {
    setCurrentPair(getNextPair(songs));
  }, [songs]);

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

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-8 max-w-7xl mx-auto">
      <div className="flex flex-col items-center gap-10 animate-in fade-in zoom-in duration-700 w-full">
        {/* Header Section */}
        <div className="text-center space-y-4 relative">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="h-[2px] w-12 bg-primary/20 rounded-full" />
            <p className="text-[11px] font-black text-primary uppercase tracking-[0.3em] font-mono">
              {totalDuels === 0 ? "Initial Encounter" : `Duel #${totalDuels + 1}`}
            </p>
            <div className="h-[2px] w-12 bg-primary/20 rounded-full" />
          </div>

          <div className="relative inline-block">
            <SpeedLines side="left" />
            <h2 className="text-4xl font-black tracking-tighter uppercase italic px-4">
              Make Your Choice
            </h2>
            <SpeedLines side="right" />
          </div>

          <div className="flex items-center justify-center gap-8 text-[11px] font-mono text-muted-foreground/60 uppercase font-bold">
            <StatBadge 
              icon={<div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />} 
              label={`${songs.length} Tracks Pool`} 
            />
            <StatBadge 
              icon={<Trophy className="h-3.5 w-3.5 text-primary/60" />} 
              label={`${totalDuels} Decisions`} 
            />
          </div>
        </div>

        {/* Duel Area */}
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 w-full justify-center min-h-[32rem]">
          {currentPair ? (
            <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 w-full justify-center">
              <RankingCard song={currentPair[0]} onClick={() => handleChoice(currentPair[0])} />

              {/* Static Middle Section */}
              <div className="flex flex-col gap-6 items-center shrink-0">
                <div className="relative group">
                  <div className="h-14 w-14 rounded-full border-2 border-primary/30 flex items-center justify-center bg-background/80 backdrop-blur-xl relative z-10 shadow-2xl">
                    <span className="text-sm font-mono font-black text-primary italic">VS</span>
                  </div>
                  <div className="absolute inset-[-4px] rounded-full border border-primary/10 animate-pulse" />
                  <div className="absolute inset-0 rounded-full bg-primary/5 animate-ping opacity-20" />
                </div>

                <div className="flex flex-col gap-4">
                  <RankingControlButton icon={<Scale />} label="Tie" onClick={() => handleChoice(null, true)} />
                  <RankingControlButton icon={<RotateCcw />} label="Skip" onClick={handleSkip} />
                </div>
              </div>

              <RankingCard song={currentPair[1]} onClick={() => handleChoice(currentPair[1])} />
            </div>
          ) : (
            <PairingLoader />
          )}
        </div>

        {/* Footer/Progress */}
        <div className="flex items-center gap-3 mt-4">
          <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          <p className="text-[10px] text-muted-foreground/50 font-mono uppercase tracking-[0.4em] font-bold">
            Session Live • Awaiting Selection
          </p>
        </div>
      </div>
    </div>
  );
}

type SpeedLinesProps = Readonly<{
  side: "left" | "right";
}>;

function SpeedLines({ side }: SpeedLinesProps): JSX.Element {
  const isLeft = side === "left";
  return (
    <div 
      className={cn(
        "absolute top-0 bottom-0 flex flex-col justify-center gap-2 pointer-events-none",
        isLeft ? "-left-12" : "-right-12"
      )}
    >
      {[1, 2, 3].map((i) => (
        <motion.div
          key={`${side}-${i}`}
          className={cn("h-[2px] bg-primary/40 rounded-full", !isLeft && "ml-auto")}
          animate={{
            width: isLeft ? [10, 30, 15, 25] : [15, 25, 10, 30],
            opacity: isLeft ? [0.2, 0.8, 0.4] : [0.4, 0.2, 0.8],
            x: isLeft ? [0, -4, 2, 0] : [0, 4, -2, 0],
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
}>;

function RankingControlButton({
  icon,
  label,
  onClick,
}: RankingControlButtonProps): JSX.Element {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="h-14 w-36 rounded-2xl border-border/40 hover:border-primary/50 transition-all bg-muted/10 hover:bg-primary/5 group shadow-sm hover:shadow-primary/5"
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className="text-muted-foreground group-hover:text-primary transition-colors">
            {icon}
          </div>
        )}
        <span className="text-xs font-mono uppercase tracking-widest font-black">{label}</span>
      </div>
    </Button>
  );
}
