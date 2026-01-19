"use client";

import { Music } from "lucide-react";
import Image from "next/image";
import { type SessionSong } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface RankingCardProps {
  song: SessionSong;
  onClick: () => void;
  isActive?: boolean;
}

export function RankingCard({ song, onClick, isActive }: RankingCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col w-80 h-[28rem] rounded-3xl border-2 transition-all duration-500 overflow-hidden text-left outline-none",
        "bg-card border-border hover:border-primary/50 hover:bg-primary/[0.02] hover:shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] dark:hover:shadow-[0_0_50px_-12px_rgba(255,255,255,0.1)]",
        "focus-visible:ring-2 focus-visible:ring-primary/50",
        isActive && "border-primary bg-primary/[0.05] ring-2 ring-primary/20"
      )}
    >
      {/* Artwork Section - Perfect Square */}
      <div className="relative aspect-square w-full bg-muted/30 flex items-center justify-center overflow-hidden border-b border-border/50">
        {(song.cover_url || song.spotify_id) && !imageError ? (
          <Image
            src={song.cover_url || `https://i.scdn.co/image/${song.spotify_id}`}
            alt={song.name}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            onError={() => setImageError(true)}
            unoptimized
          />
        ) : (
          <>
            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)] group-hover:opacity-10 transition-opacity" />
            <Music className="h-16 w-16 text-muted-foreground/20 group-hover:text-primary/20 transition-colors duration-500" />
          </>
        )}

        {/* Overlay Gradient for contrast */}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* Info Section */}
      <div className="flex flex-col flex-1 p-6 justify-between relative bg-linear-to-b from-transparent to-muted/5">
        <div className="space-y-1.5">
          <h3 className="font-black text-lg leading-tight line-clamp-2 tracking-tight group-hover:text-primary transition-colors duration-300">
            {song.name}
          </h3>
          <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-[0.15em] font-bold opacity-80">
            {song.artist}
          </p>
        </div>

        <div className="flex items-end justify-between mt-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-widest font-black">Album</span>
            <span className="text-[10px] font-mono font-bold line-clamp-1 opacity-60 group-hover:opacity-100 transition-opacity">
              {song.album || "Unknown Release"}
            </span>
          </div>
          
          <div className="h-8 w-8 rounded-full border border-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_var(--primary)]" />
          </div>
        </div>
      </div>

      {/* Interactive Overlay */}
      <div className="absolute inset-0 ring-1 ring-inset ring-white/5 pointer-events-none" />
    </button>
  );
}
