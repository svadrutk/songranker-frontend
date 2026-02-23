"use client";

import { type JSX } from "react";
import { X, User, ListMusic, Loader2 } from "lucide-react";
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
      "relative group bg-muted/5 border-2 border-border/10 rounded-3xl p-6 transition-all duration-300 hover:bg-muted/10 hover:border-primary/40",
      source.status === 'loading' && "animate-pulse"
    )}>
      <button
        onClick={() => onRemove(source.id)}
        className="absolute top-4 right-4 p-2 rounded-xl bg-background border border-border/10 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-all md:opacity-0 md:group-hover:opacity-100 z-10"
        aria-label={`Remove ${source.name}`}
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-4">
        <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden bg-muted flex items-center justify-center shadow-sm border border-border/10">
          {source.coverUrl && !imageError ? (
            <Image
              src={source.coverUrl}
              alt={source.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              sizes="(max-width: 768px) 56px, 56px"
              unoptimized
              onError={() => setImageError(true)}
            />
          ) : (
            isPlaylist ? <ListMusic className="h-6 w-6 text-muted-foreground/30" /> : <User className="h-6 w-6 text-muted-foreground/30" />
          )}
          
          {source.status === 'loading' && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 py-0.5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[8px] font-mono font-black uppercase tracking-widest text-primary/60">
              {source.type.replace('_', ' ')}
            </span>
            {source.status === 'error' && (
              <span className="text-[8px] font-mono font-black uppercase tracking-widest text-destructive">
                Error
              </span>
            )}
          </div>
          
          <h3 className="font-bold text-sm uppercase tracking-tighter truncate leading-tight mb-0.5 group-hover:text-primary transition-colors">
            {source.name}
          </h3>
          
          <p className="text-muted-foreground font-mono text-[9px] uppercase tracking-widest truncate">
            {isArtist && source.type === 'artist_partial' 
              ? `Selected Tracks` 
              : source.status === 'ready' 
                ? `${source.songCount} songs` 
                : source.status === 'error'
                  ? 'Failed'
                  : 'Loading…'}
          </p>

          {source.status === 'loading' && typeof source.progress === 'number' && (
            <div className="mt-2 w-full bg-muted rounded-full h-1 overflow-hidden">
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
