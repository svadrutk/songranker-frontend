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
        "group relative flex flex-col w-64 h-80 rounded-2xl border-2 transition-all duration-300 overflow-hidden text-left outline-none",
        "bg-card border-border hover:border-primary/50 hover:bg-primary/[0.02] hover:shadow-2xl hover:shadow-primary/5",
        "focus-visible:ring-2 focus-visible:ring-primary/50",
        isActive && "border-primary bg-primary/[0.05] ring-2 ring-primary/20"
      )}
    >
      {/* Artwork Section */}
      <div className="relative h-48 w-full bg-muted/30 flex items-center justify-center overflow-hidden border-b">
        {(song.cover_url || song.spotify_id) && !imageError ? (
          <Image
            src={song.cover_url || `https://i.scdn.co/image/${song.spotify_id}`}
            alt={song.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImageError(true)}
            unoptimized
          />
        ) : (
          <>
            {/* Placeholder Gradient/Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)] group-hover:opacity-20 transition-opacity" />
            
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="h-16 w-16 rounded-full bg-background/50 backdrop-blur-sm border flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <Music className="h-8 w-8 text-muted-foreground/60 group-hover:text-primary transition-colors" />
              </div>
            </div>
          </>
        )}

        {/* Overlay Gradient for contrast */}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Rating Badge (Top Right) */}
        <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-background/80 backdrop-blur-md border border-border/50 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] font-mono font-bold tracking-tighter">
            ELO {Math.round(song.local_elo)}
          </span>
        </div>
      </div>

      {/* Info Section */}
      <div className="flex flex-col flex-1 p-4 justify-between bg-linear-to-b from-transparent to-muted/5">
        <div className="space-y-1">
          <h3 className="font-bold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {song.name}
          </h3>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider line-clamp-1">
            {song.artist}
          </p>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex flex-col">
            <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-tighter">Album</span>
            <span className="text-[9px] font-mono font-medium line-clamp-1 opacity-60">
              {song.album || "Unknown Album"}
            </span>
          </div>
          
          <div className="h-6 w-6 rounded-full border border-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          </div>
        </div>
      </div>

      {/* Interactive Overlay */}
      <div className="absolute inset-0 ring-1 ring-inset ring-white/5 pointer-events-none" />
    </button>
  );
}
