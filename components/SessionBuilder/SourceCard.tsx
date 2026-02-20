"use client";

import { type JSX } from "react";
import { X, User, ListMusic, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RankingSource } from "@/lib/stores/session-builder-store";
import Image from "next/image";
import { useState } from "react";

type SourceCardProps = Readonly<{
  source: RankingSource;
  onRemove: (id: string) => void;
}>;

export function SourceCard({ source, onRemove }: SourceCardProps): JSX.Element {
  const [imageError, setImageError] = useState(false);
  const isPlaylist = source.type === 'playlist';
  const isArtist = source.type === 'artist_all' || source.type === 'artist_partial';
  
  return (
    <div className={cn(
      "relative group bg-muted/10 border border-border/40 rounded-3xl p-6 transition-all duration-300 hover:bg-muted/20 hover:border-primary/20",
      source.status === 'loading' && "animate-pulse"
    )}>
      <button
        onClick={() => onRemove(source.id)}
        className="absolute top-4 right-4 p-2 rounded-full bg-background/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all md:opacity-0 md:group-hover:opacity-100 z-10"
        aria-label={`Remove ${source.name}`}
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-6">
        <div className="relative h-20 w-20 md:h-24 md:w-24 shrink-0 rounded-2xl overflow-hidden bg-muted flex items-center justify-center shadow-md border border-border/20">
          {source.coverUrl && !imageError ? (
            <Image
              src={source.coverUrl}
              alt={source.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 80px, 96px"
              unoptimized
              onError={() => setImageError(true)}
            />
          ) : (
            isPlaylist ? <ListMusic className="h-10 w-10 text-muted-foreground/40" /> : <User className="h-10 w-10 text-muted-foreground/40" />
          )}
          
          {source.status === 'loading' && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 py-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-primary/60">
              {source.type.replace('_', ' ')}
            </span>
            {source.status === 'error' && (
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-destructive uppercase">
                <AlertCircle className="h-3 w-3" /> Error
              </span>
            )}
          </div>
          
          <h3 className="font-mono font-black text-lg md:text-xl uppercase tracking-tighter truncate leading-tight mb-1">
            {source.name}
          </h3>
          
          <p className="text-muted-foreground font-mono text-xs md:text-sm truncate">
            {isArtist && source.type === 'artist_partial' 
              ? `Partial Discography` 
              : source.status === 'ready' 
                ? `${source.songCount} tracks` 
                : source.status === 'error'
                  ? 'Failed to fetch tracks'
                  : 'Fetching tracks...'}
          </p>

          {source.status === 'loading' && typeof source.progress === 'number' && (
            <div className="mt-4 w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-500 ease-out" 
                style={{ width: `${source.progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
