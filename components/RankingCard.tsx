"use client";

import { JSX } from "react";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import type { SessionSong } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CoverArt } from "@/components/CoverArt";

type RankingCardProps = Readonly<{
  song: SessionSong;
  onClick: () => void;
  isActive?: boolean;
  isWinner?: boolean;
  disabled?: boolean;
}>;

const PARTICLES = [
  { x: [-20, 30], y: [10, -40], duration: 1.4, delay: 0.2 },
  { x: [40, -10], y: [-20, 35], duration: 1.7, delay: 0.8 },
  { x: [-35, 15], y: [30, -15], duration: 1.3, delay: 1.4 },
  { x: [25, -30], y: [-40, 20], duration: 1.6, delay: 0.5 },
];

function VinylWing({ side }: { side: "left" | "right" }): JSX.Element {
  return (
    <div className={cn(
      "hidden md:flex flex-1 h-full overflow-hidden pointer-events-none opacity-30 group-hover:opacity-70 transition-opacity duration-300",
      side === "left" ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "h-full aspect-square rounded-full border-2 border-zinc-400/30 bg-zinc-950 shadow-[inset_0_0_40px_rgba(255,255,255,0.1)] flex items-center justify-center overflow-hidden",
        side === "left" ? "translate-x-1/2" : "-translate-x-1/2"
      )}>
        <div className="h-[85%] w-[80%] rounded-full border-[1.5px] border-white/10" />
        <div className="absolute h-[65%] w-[60%] rounded-full border-[1.5px] border-white/10" />
        <div className="absolute h-[45%] w-[40%] rounded-full border-[1.5px] border-white/10" />
        
        {PARTICLES.map((p, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-amber-500 rounded-full blur-[0.5px]"
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.2, 0],
              x: p.x,
              y: p.y,
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
            }}
          />
        ))}
      </div>
    </div>
  );
}

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
      animate={isWinner ? { scale: 1.04 } : { scale: 1 }}
      whileTap={!disabled ? { scale: 0.995 } : {}}
      transition={{ 
        type: "spring",
        stiffness: 400,
        damping: 17,
        mass: 1
      }}
      className={cn(
        "group relative flex flex-row md:flex-col items-center gap-4 md:gap-0 w-full max-w-[360px] md:max-w-[520px] rounded-[1.5rem] md:rounded-[3.5rem] p-3 md:p-6 transition-all duration-300 outline-none shrink min-w-0 md:min-w-[280px]",
        "bg-zinc-900/30 hover:bg-zinc-900/50 border border-white/5 shadow-2xl",
        "focus-visible:ring-2 focus-visible:ring-primary/50",
        isActive && "ring-2 ring-primary/20",
        isWinner && "z-10",
        disabled && "pointer-events-none opacity-80"
      )}
    >
      {/* Vinyl Section: Wide and Shorter */}
      <div className="relative flex items-center justify-center w-24 md:w-full mb-0 md:mb-6 h-24 md:h-44 shrink-0">
        <VinylWing side="left" />

        {/* Square Album Art (The Core) */}
        <div className="relative z-20 h-full aspect-square shrink-0 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.8)] rounded-md md:rounded-xl overflow-hidden md:group-hover:scale-105 transition-transform duration-300 ring-1 ring-white/10 mx-0 md:mx-2">
          <CoverArt
            title={song.name}
            url={song.cover_url}
            spotifyId={song.spotify_id}
            className="w-full h-full object-cover"
          />
          
          {/* Win Overlays */}
          {isWinner && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
            >
              <div className="bg-primary p-2 md:p-3 rounded-full shadow-2xl">
                <Trophy className="size-7 md:size-12 text-primary-foreground" />
              </div>
            </motion.div>
          )}
        </div>

        <VinylWing side="right" />
      </div>

      {/* Info Section - Smaller Typography */}
      <div className="flex-1 md:flex-none w-full text-left md:text-center space-y-0.5 md:space-y-1.5 min-w-0">
        <div className="hover-scroll-container w-full">
          <h3 className="hover-scroll-content font-black text-base md:text-xl lg:text-2xl leading-tight tracking-tight group-hover:text-primary transition-colors duration-200">
            {song.name}
          </h3>
        </div>
        <div className="hover-scroll-container w-full">
          <p className="hover-scroll-content text-[10px] md:text-xs lg:text-sm font-mono text-zinc-400 uppercase tracking-[0.2em] font-bold">
            {song.artist}
          </p>
        </div>
        <div className="hover-scroll-container w-full mt-0.5 md:mt-1 opacity-30 group-hover:opacity-100 transition-opacity duration-300">
          <span className="hover-scroll-content text-[9px] md:text-xs lg:text-sm font-mono font-bold whitespace-nowrap">
            {song.album || "Unknown Release"}
          </span>
        </div>
      </div>

      {/* Interactive Overlay */}
      <div className="absolute inset-0 ring-1 ring-inset ring-white/5 pointer-events-none rounded-[1.5rem] md:rounded-[3.5rem]" />
    </motion.button>
  );
}
