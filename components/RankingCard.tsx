"use client";

import type { JSX } from "react";
import { useEffect } from "react";
import { motion } from "framer-motion";
import type { SessionSong } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CoverArt } from "@/components/CoverArt";
import { Trophy } from "lucide-react";
import { activateTextTruncateScroll } from "text-truncate-scroll";

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
  useEffect(() => {
    activateTextTruncateScroll({ scrollSpeed: 40 });
  }, [song]);

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      initial={false}
      animate={isWinner ? { scale: [1, 1.05, 1] } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "text-scroll-group group relative flex flex-row md:flex-col w-full max-w-md md:max-w-[320px] md:w-80 h-full max-h-[190px] md:max-h-none md:h-[30rem] lg:h-[32rem] rounded-xl md:rounded-3xl border-2 transition-all duration-500 overflow-hidden text-left outline-none",
        "bg-card border-border hover:border-primary/50 hover:bg-primary/[0.02]",
        "hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_20px_50px_-12px_rgba(255,255,255,0.05)]",
        "focus-visible:ring-2 focus-visible:ring-primary/50",
        isActive && "border-primary bg-primary/[0.05] ring-2 ring-primary/20",
        isWinner && "border-primary z-10 shadow-[0_0_40px_-5px_var(--primary)]",
        disabled && "pointer-events-none opacity-80"
      )}
    >
      {/* Artwork Section */}
      <div className="relative h-full aspect-square md:w-full md:h-auto md:aspect-square bg-muted/30 flex items-center justify-center overflow-hidden border-r md:border-r-0 md:border-b border-border/50 shrink-0">
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
      <div className="flex flex-col flex-1 p-3 md:p-6 justify-center text-left md:text-center relative bg-linear-to-r md:bg-linear-to-b from-transparent to-muted/5 min-w-0">
        <div className="space-y-0.5 md:space-y-1 min-w-0">
          <h3 className="text-truncate-scroll font-black text-sm md:text-lg leading-tight tracking-tight group-hover:text-primary transition-colors duration-300">
            {song.name}
          </h3>
          <p className="text-truncate-scroll text-[10px] md:text-[11px] font-mono text-muted-foreground uppercase tracking-[0.1em] md:tracking-[0.15em] font-bold opacity-80">
            {song.artist}
          </p>
        </div>

        <div className="flex flex-row md:flex-col items-center gap-2 md:gap-0 mt-1 md:mt-4 min-w-0 w-full">
          <span className="hidden md:inline text-[7px] md:text-[9px] font-mono text-muted-foreground/50 uppercase tracking-widest font-black">
            Album
          </span>
          <span className="text-truncate-scroll flex-1 md:flex-initial text-[9px] md:text-[10px] font-mono font-bold opacity-60 group-hover:opacity-100 transition-opacity">
            {song.album || "Unknown Release"}
          </span>
        </div>
      </div>

      {/* Interactive Overlay */}
      <div className="absolute inset-0 ring-1 ring-inset ring-primary/5 pointer-events-none" />
    </motion.button>
  );
}
