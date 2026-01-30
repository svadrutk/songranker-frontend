"use client";

import type { JSX } from "react";
import { RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoverArt } from "@/components/CoverArt";
import { ShareButton } from "@/components/ShareButton";
import { cn } from "@/lib/utils";
import type { SessionSong } from "@/lib/api";
import { motion, type Variants } from "framer-motion";

type LeaderboardProps = {
  songs: SessionSong[];
  onContinue: () => void;
  isPreview?: boolean;
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

export function Leaderboard({ songs, onContinue, isPreview }: LeaderboardProps): JSX.Element {
  const sortedSongs = [...songs].sort((a, b) => {
    const scoreA = a.bt_strength ?? (a.local_elo / 3000); 
    const scoreB = b.bt_strength ?? (b.local_elo / 3000);
    return scoreB - scoreA;
  });

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={cn(
        "flex flex-col h-full w-full max-w-3xl mx-auto py-4 md:py-8 overflow-hidden",
        isPreview && "px-4"
      )}
    >
      <motion.div custom={0} variants={itemVariants} className="shrink-0 mb-4 md:mb-8">
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
              className="flex items-center gap-3 md:gap-6 py-3 md:py-4 px-1 md:px-2 border-b border-border last:border-b-0 hover:bg-accent transition-colors"
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

      <motion.div custom={0} variants={itemVariants} className="shrink-0 space-y-6">
        <div className="flex gap-3">
          <Button
            onClick={onContinue}
            variant={isPreview ? "default" : "outline"}
            className="flex-1 h-12 font-mono uppercase tracking-wider text-sm font-bold"
          >
            {isPreview ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Back to Duel
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4 mr-2" />
                Keep Ranking
              </>
            )}
          </Button>
          {!isPreview && <ShareButton songs={sortedSongs} />}
        </div>
        <p className="text-xs font-mono text-muted-foreground uppercase text-center">
          {isPreview 
            ? "Rankings update as you duel" 
            : "More duels = more accurate rankings"}
        </p>
      </motion.div>
    </motion.div>
  );
}
