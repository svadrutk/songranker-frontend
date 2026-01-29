"use client";

import type { JSX } from "react";
import { motion } from "framer-motion";
import type { SessionSong } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CoverArt } from "@/components/CoverArt";
import { Trophy } from "lucide-react";

type RankingCardProps = Readonly<{
  song: SessionSong;
  onClick: () => void;
  isActive?: boolean;
  isWinner?: boolean;
  disabled?: boolean;
}>;

export function RankingCard({
  song,
  onClick,
  isActive,
  isWinner,
  disabled,
}: RankingCardProps): JSX.Element {

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      initial={false}
      animate={isWinner ? { scale: [1, 1.05, 1] } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "group relative flex flex-row md:flex-col w-full max-w-md md:max-w-none h-44 md:h-auto rounded-xl md:rounded-3xl transition-all duration-500 overflow-hidden text-left outline-none shrink-0",
        "bg-card hover:bg-primary/[0.02] border border-border/50",
        "hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_20px_50px_-12px_rgba(255,255,255,0.05)]",
        "focus-visible:ring-2 focus-visible:ring-primary/50",
        isActive && "bg-primary/[0.05] ring-2 ring-primary/20",
        isWinner && "z-10 shadow-[0_0_40px_-5px_var(--primary)]",
        disabled && "pointer-events-none opacity-80"
      )}
    >
      {/* Artwork Section */}
      <div className="relative h-44 w-44 md:w-full md:h-auto md:aspect-square shrink-0 bg-muted/30 flex items-center justify-center overflow-hidden">
        <CoverArt
          title={song.name}
          url={song.cover_url}
          spotifyId={song.spotify_id}
          className="w-full h-full object-cover"
        />
        
        {/* Win Overlays */}
        {isWinner && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.4, 0] }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 bg-primary pointer-events-none z-20"
            />
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
            >
              <div className="bg-primary p-2 md:p-4 rounded-full shadow-2xl">
                <Trophy className="w-8 h-8 md:w-12 md:h-12 text-primary-foreground" />
              </div>
            </motion.div>
          </>
        )}
      </div>

      {/* Info Section */}
      <div className="flex flex-col flex-1 p-3 md:p-6 justify-center text-left md:text-center relative bg-muted/5 md:bg-linear-to-b md:from-transparent md:to-muted/5 min-w-0 overflow-hidden">
        <div className="space-y-0.5 md:space-y-1 min-w-0 w-full">
          <div className="hover-scroll-container w-full">
            <h3 className="hover-scroll-content font-black text-[13px] md:text-lg leading-tight tracking-tight group-hover:text-primary transition-colors duration-300">
              {song.name}
            </h3>
          </div>
          <div className="hover-scroll-container w-full">
            <p className="hover-scroll-content text-[10px] md:text-[11px] font-mono text-muted-foreground uppercase tracking-[0.1em] md:tracking-[0.15em] font-bold opacity-80">
              {song.artist}
            </p>
          </div>
        </div>

        <div className="flex flex-row md:flex-col items-center gap-2 md:gap-0 mt-1 md:mt-4 min-w-0 w-full overflow-hidden">
          <span className="hidden md:inline text-[7px] md:text-[9px] font-mono text-muted-foreground/50 uppercase tracking-widest font-black shrink-0">
            Album
          </span>
          <div className="hover-scroll-container flex-1 w-full">
            <span className="hover-scroll-content text-[10px] md:text-[10px] font-mono font-bold opacity-60 group-hover:opacity-100 transition-opacity">
              {song.album || "Unknown Release"}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Overlay */}
      <div className="absolute inset-0 ring-1 ring-inset ring-primary/5 pointer-events-none" />
    </motion.button>
  );
}
