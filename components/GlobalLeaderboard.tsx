"use client";

import { type JSX, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoverArt } from "@/components/CoverArt";
import { cn } from "@/lib/utils";
import type { LeaderboardResponse } from "@/lib/api";
import { activateTextTruncateScroll } from "text-truncate-scroll";

type GlobalLeaderboardProps = Readonly<{
  artist: string;
  data: LeaderboardResponse | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}>;

export function GlobalLeaderboard({
  artist,
  data,
  isLoading,
  error,
  onRetry,
}: GlobalLeaderboardProps): JSX.Element {
  useEffect(() => {
    if (data) {
      activateTextTruncateScroll({ scrollSpeed: 40 });
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4 animate-in fade-in duration-300">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          Loading Global Rankings...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4 p-4 text-center animate-in fade-in duration-300">
        <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-destructive">Failed to load rankings</p>
          <p className="text-xs text-muted-foreground max-w-[250px] mx-auto">
            {error}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRetry}
          className="font-mono text-[10px] uppercase font-bold tracking-widest"
        >
          <RefreshCcw className="h-3 w-3 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  if (!data || data.songs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4 text-center animate-in fade-in duration-300">
        <p className="text-sm font-medium text-muted-foreground">
          No global rankings found for <span className="text-foreground font-bold">{artist}</span>
        </p>
        <p className="text-xs text-muted-foreground/60 max-w-xs">
          Be the first to rank this artist&apos;s discography!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 pb-4 space-y-2">
        <h2 className="text-xl font-black uppercase tracking-tighter italic">
          Global Leaderboard
        </h2>
        <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-wider">
          <span className="text-muted-foreground">
            {data.total_comparisons.toLocaleString()} Comparisons
          </span>
          {data.pending_comparisons > 0 && (
            <span className="text-orange-500">
              +{data.pending_comparisons} pending
            </span>
          )}
          {data.last_updated && (
            <>
              <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
              <span className="text-muted-foreground">
                Updated {new Date(data.last_updated).toLocaleDateString()} at{" "}
                {new Date(data.last_updated).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2 pb-8">
        {data.songs.map((song, index) => (
          <motion.div
            key={song.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className="text-scroll-group flex items-center gap-3 p-2 rounded-lg bg-card border border-border/40 hover:border-primary/20 transition-colors group"
          >
            <div className={cn(
              "w-8 shrink-0 text-center font-mono font-black italic",
              index < 3 ? "text-primary text-lg" : "text-muted-foreground text-sm"
            )}>
              #{song.rank}
            </div>
            
            <div className="h-10 w-10 shrink-0">
              <CoverArt
                title={song.name}
                url={song.album_art_url}
                className="h-10 w-10 rounded-md object-cover shadow-sm"
              />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-truncate-scroll font-bold text-xs uppercase tracking-tight text-foreground/90 group-hover:text-primary transition-colors">
                {song.name}
              </h3>
              <p className="text-truncate-scroll text-[9px] font-mono text-muted-foreground uppercase">
                {song.album || "Unknown Album"}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
