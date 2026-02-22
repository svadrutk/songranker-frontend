"use client";

import { useState, useEffect, useRef } from "react";
import type { JSX } from "react";
import { RotateCcw, Check, FileDown, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoverArt } from "@/components/CoverArt";
import { ShareButton } from "@/components/ShareButton";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { useAuth } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";
import type { SessionSong } from "@/lib/api";
import { motion, type Variants } from "framer-motion";
import { StarRatingNotification, hasGivenFeedback } from "@/components/RankingWidget/StarRatingNotification";

function escapeCsvCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function artistToFilenameBase(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  const joined = words.join("_");
  return joined
    .replace(/[/\\:*?"<>|]/g, "_")
    .replace(/_+/g, "_")
    .trim()
    .slice(0, 100) || "rankings";
}

function exportRankingsToCsv(sortedByScore: SessionSong[]): void {
  const artistName = sortedByScore[0]?.artist?.trim() ?? "";
  const baseName = artistName ? artistToFilenameBase(artistName) : null;
  const filename = baseName ? `${baseName}_Rankings.csv` : "Rankings.csv";

  const header = ["Rank", "Track", "Artist", "Album"];
  const rows = sortedByScore.map((song, index) => {
    return [
      index + 1,
      escapeCsvCell(song.name),
      escapeCsvCell(song.artist),
      escapeCsvCell(song.album ?? ""),
    ].join(",");
  });
  const csv = [header.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export type LeaderboardProps = {
  songs: SessionSong[];
  onContinue: () => void;
  isPreview?: boolean;
  /** Override back button label when isPreview (e.g. "Back to My Rankings"). */
  backButtonLabel?: string;
  /** Session ID for star rating feedback. */
  sessionId?: string | null;
  /** Whether the user is a guest (viewing results only). */
  isGuest?: boolean;
};

const containerVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

const itemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 10,
    scale: 0.95 
  },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      delay: index * 0.04,
      ease: [0.25, 0.1, 0.25, 1],
    },
  }),
};

export function Leaderboard({ songs, onContinue, isPreview, backButtonLabel, sessionId, isGuest }: LeaderboardProps): JSX.Element {
  const { openAuthModal } = useAuth(); // Need to import useAuth
  const sortedSongs = [...songs].sort((a, b) => {
    const scoreA = a.bt_strength ?? (a.local_elo / 3000); 
    const scoreB = b.bt_strength ?? (b.local_elo / 3000);
    return scoreB - scoreA;
  });

  // Star rating notification state - only show on first view of leaderboard (not preview)
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);
  const hasCheckedFeedbackRef = useRef(false);

  useEffect(() => {
    // DEV: Always show rating prompt for testing
    const isDev = process.env.NODE_ENV === "development";
    
    // Only show rating prompt for non-preview leaderboards with a session ID
    if (isPreview || !sessionId || isGuest) return;
    
    hasCheckedFeedbackRef.current = true;

    
    // Check if user has already given feedback for this session (skip in dev)
    if (isDev || !hasGivenFeedback(sessionId)) {
      // Small delay to let the leaderboard animate in first
      const timer = setTimeout(() => {
        setShowRatingPrompt(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [sessionId, isPreview, isGuest]);

  return (
    <>
      <StarRatingNotification
        sessionId={sessionId ?? null}
        isVisible={showRatingPrompt}
        onDismiss={() => setShowRatingPrompt(false)}
      />
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className={cn(
          "flex flex-col h-full w-full mx-auto py-4 md:py-8 overflow-hidden",
          isPreview ? "max-w-lg px-3" : "max-w-3xl"
        )}
      >
        <motion.div custom={0} variants={itemVariants} className="shrink-0 mb-4 md:mb-8 px-4 md:px-0">
        <p className="text-[10px] md:text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1 md:mb-2">
          {isPreview ? "Current Standings" : "Rankings"}
        </p>
        <h2 className="text-2xl md:text-4xl font-black tracking-tight uppercase">
          Your Top Tracks
        </h2>
      </motion.div>

      <div className="w-full flex-1 overflow-y-auto mb-4 md:mb-8">
        {sortedSongs.map((song, index) => {
          const getRankColor = () => {
            if (index === 0) return "text-yellow-500";
            if (index === 1) return "text-gray-400";
            if (index === 2) return "text-orange-400";
            return "";
          };

          return (
            <motion.div
              key={song.song_id}
              custom={index}
              variants={itemVariants}
              className="flex items-center gap-3 md:gap-6 py-3 md:py-4 px-4 md:px-2 border-b border-border last:border-b-0 hover:bg-accent transition-colors"
            >
              <div className={cn("w-10 md:w-16 shrink-0 text-2xl md:text-4xl font-black font-mono text-right", getRankColor())}>
                {index + 1}
              </div>
              <div className="h-12 w-12 md:h-16 md:w-16 shrink-0">
                <CoverArt
                  title={song.name}
                  url={song.cover_url}
                  spotifyId={song.spotify_id}
                  className="h-12 w-12 md:h-16 md:w-16 rounded object-cover"
                />
              </div>
              <div className="flex-1 min-w-0 space-y-0.5 md:space-y-1">
                <h3 className="font-black truncate text-sm md:text-lg uppercase tracking-tight leading-tight">{song.name}</h3>
                <p className="text-[10px] md:text-sm font-mono text-muted-foreground uppercase truncate">
                  {song.artist} • {song.album}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div custom={0} variants={itemVariants} className="shrink-0 space-y-6 px-4 md:px-0">
        <div className="flex flex-col md:flex-row gap-2">
          {!isGuest ? (
            <Button
              onClick={onContinue}
              variant={isPreview ? "default" : "outline"}
              className="w-full md:flex-1 h-12 font-mono uppercase tracking-wider text-xs md:text-sm font-bold"
            >
              {backButtonLabel ? (
                <>
                  <Check className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2 shrink-0" />
                  <span className="truncate">{backButtonLabel}</span>
                </>
              ) : isPreview ? (
                <>
                  <Check className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2 shrink-0" />
                  <span className="truncate">Back to Duel</span>
                </>
              ) : (
                <>
                  <RotateCcw className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2 shrink-0" />
                  <span className="truncate">Keep Ranking</span>
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => openAuthModal("login")}
              className="w-full md:flex-1 h-12 font-mono uppercase tracking-wider text-xs md:text-sm font-bold"
            >
              <LogIn className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2 shrink-0" />
              <span className="truncate">Sign in to Rank</span>
            </Button>
          )}
          {!isPreview && (
            <>
              <CopyLinkButton 
                url={`${typeof window !== 'undefined' ? window.location.origin : ''}/ranking/${sessionId}`}
                className="w-full md:flex-1 h-12"
              />
              <ShareButton songs={sortedSongs} />
              <Button
                onClick={() => exportRankingsToCsv(sortedSongs)}
                variant="outline"
                className="w-full md:flex-1 h-12 font-mono uppercase tracking-wider text-xs md:text-sm font-bold"
                title="Download rankings as CSV"
              >
                <FileDown className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2 shrink-0" />
                <span className="truncate">Export CSV</span>
              </Button>
            </>
          )}
        </div>
        <p className="text-xs font-mono text-muted-foreground uppercase text-center">
          {isPreview 
            ? "Rankings update as you duel" 
            : "More duels = more accurate rankings"}
        </p>
      </motion.div>
      </motion.div>
    </>
  );
}
