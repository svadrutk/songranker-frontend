"use client";

import { type JSX, memo, useMemo } from "react";
import { Loader2, RefreshCcw, Globe, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoverArt } from "@/components/CoverArt";
import { cn } from "@/lib/utils";
import type { LeaderboardResponse } from "@/lib/api";
import { motion, type Variants } from "framer-motion";

type GlobalLeaderboardProps = Readonly<{
  artist: string;
  data: LeaderboardResponse | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}>;

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

// Memoized song row for performance
const SongRow = memo(({ 
  song, 
  index 
}: { 
  song: LeaderboardResponse["songs"][0]; 
  index: number;
}) => {
  // Medal colors for top 3
  const getBorderColor = () => {
    if (index === 0) return "border-b-[#FFD700]"; // Gold
    if (index === 1) return "border-b-[#C0C0C0]"; // Silver
    if (index === 2) return "border-b-[#CD7F32]"; // Bronze
    return "border-b-border";
  };

  const getRankColor = () => {
    if (index === 0) return "text-yellow-500";
    if (index === 1) return "text-gray-400";
    if (index === 2) return "text-orange-400";
    return "";
  };

  return (
    <motion.div
      custom={index}
      variants={itemVariants}
      className={cn(
        "flex items-center gap-4 md:gap-6 py-3 md:py-4 px-2 border-b-2 last:border-b-0 transition-colors",
        "md:hover:bg-accent",
        getBorderColor()
      )}
    >
      {/* Rank - consistent sizing for all rows */}
      <div className={cn("w-10 md:w-16 shrink-0 font-mono font-black text-right text-foreground text-2xl md:text-4xl", getRankColor())}>
        {song.rank}
      </div>
      
      {/* Album art - consistent sizing */}
      <div className="h-10 w-10 md:h-16 md:w-16 shrink-0">
        <CoverArt
          title={song.name}
          url={song.album_art_url}
          className="h-10 w-10 md:h-16 md:w-16 rounded object-cover"
        />
      </div>

      {/* Song info with smart truncation */}
      <div className="flex-1 min-w-0 space-y-0.5 md:space-y-1">
        <h3 className="font-black text-sm md:text-lg uppercase tracking-tight leading-tight truncate">
          {song.name}
        </h3>
        <p className="text-xs md:text-sm font-mono text-muted-foreground uppercase truncate">
          {song.album || "Unknown"}
        </p>
      </div>
    </motion.div>
  );
});

SongRow.displayName = "SongRow";

export function GlobalLeaderboard({
  artist,
  data,
  isLoading,
  error,
  onRetry,
}: GlobalLeaderboardProps): JSX.Element {
  // Memoize stats to prevent recalculation
  const stats = useMemo(() => {
    if (!data) return null;
    return {
      comparisons: data.total_comparisons.toLocaleString(),
      pending: data.pending_comparisons,
      songs: data.songs.length,
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4 px-4">
        <div className="relative">
          <Globe className="h-12 w-12 text-muted-foreground/20" />
          <Loader2 className="h-12 w-12 animate-spin text-primary absolute inset-0" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-mono text-foreground font-bold uppercase tracking-wider">
            Loading Global Data
          </p>
          <p className="text-xs font-mono text-muted-foreground uppercase">
            Fetching worldwide rankings...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-6 p-4 text-center">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <X className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-2 max-w-xs">
          <p className="text-sm font-bold font-mono uppercase tracking-tight">
            Failed to Load
          </p>
          <p className="text-xs text-muted-foreground">
            {error}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={onRetry}
          className="font-mono text-xs uppercase font-bold h-10 px-6 tracking-wider"
        >
          <RefreshCcw className="h-3.5 w-3.5 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!data || data.songs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4 text-center p-4">
        <div className="relative">
          <Globe className="h-16 w-16 text-muted-foreground/20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-1 w-1 rounded-full bg-muted-foreground/40 animate-pulse" />
          </div>
        </div>
        <div className="space-y-2 max-w-xs">
          <p className="text-sm font-bold font-mono uppercase tracking-tight">
            No Global Rankings
          </p>
          <p className="text-xs text-muted-foreground">
            No one has ranked <span className="font-bold text-foreground">{artist}</span> yet.
            <br />
            Be the first to contribute!
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="flex flex-col h-full overflow-hidden"
    >
      {/* Header with artist name and stats */}
      <motion.div custom={0} variants={itemVariants} className="shrink-0 mb-4 md:mb-8 space-y-2 md:space-y-3 px-2">
        <p className="text-[10px] md:text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1 md:mb-2">
          Global Rankings
        </p>
        <h2 className="text-2xl md:text-4xl font-black tracking-tight uppercase truncate">
          {artist}
        </h2>

        {/* Stats bar */}
        <div className="flex items-center gap-3 md:gap-4 text-[10px] md:text-xs font-mono uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <Users className="h-3 w-3 md:h-3.5 md:w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">
              {stats?.comparisons} <span className="hidden sm:inline">Comparisons</span>
            </span>
          </div>
          {stats && stats.pending > 0 && (
            <>
              <span className="text-muted-foreground/30">•</span>
              <span className="text-orange-500 font-bold">
                +{stats.pending} Pending
              </span>
            </>
          )}
        </div>
      </motion.div>

      {/* Song list with optimized rendering */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="flex-1 overflow-y-auto"
      >
        {data.songs.map((song, index) => (
          <SongRow key={song.id} song={song} index={index} />
        ))}
      </motion.div>
    </motion.div>
  );
}
