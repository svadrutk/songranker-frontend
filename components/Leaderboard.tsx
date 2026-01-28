"use client";

import type { JSX } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoverArt } from "@/components/CoverArt";
import { ShareButton } from "@/components/ShareButton";
import { cn } from "@/lib/utils";
import type { SessionSong } from "@/lib/api";

type LeaderboardProps = {
  songs: SessionSong[];
  onContinue: () => void;
  isPreview?: boolean;
};

export function Leaderboard({ songs, onContinue, isPreview }: LeaderboardProps): JSX.Element {
  const sortedSongs = [...songs].sort((a, b) => {
    const scoreA = a.bt_strength ?? (a.local_elo / 3000); 
    const scoreB = b.bt_strength ?? (b.local_elo / 3000);
    return scoreB - scoreA;
  });

  return (
    <div className={cn(
      "flex flex-col items-center justify-start h-full w-full gap-4 max-w-4xl mx-auto py-4 md:py-8 overflow-hidden",
      isPreview && "px-4"
    )}>
      <div className="text-center space-y-2 md:space-y-4 shrink-0">
        <div className="flex items-center justify-center gap-4 mb-1 md:mb-2">
          <div className="h-[1px] md:h-[2px] w-8 md:w-12 bg-primary/20 rounded-full" />
          <p className="text-[10px] md:text-[11px] font-black text-primary uppercase tracking-[0.2em] md:tracking-[0.3em] font-mono">
            {isPreview ? "Current Standings" : "Ranking Results"}
          </p>
          <div className="h-[1px] md:h-[2px] w-8 md:w-12 bg-primary/20 rounded-full" />
        </div>
        <h2 className="text-2xl md:text-4xl font-black tracking-tighter uppercase italic">
          {isPreview ? "The Order So Far" : "Your Favorite Tracks"}
        </h2>
      </div>

      <div className="w-full flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2 py-4">
        {sortedSongs.map((song, index) => (
          <motion.div
            key={song.song_id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl bg-muted/10 border border-border/40 hover:border-primary/20 transition-colors group"
          >
            <div className="w-10 md:w-14 shrink-0 text-xl md:text-2xl font-black font-mono text-primary/40 italic group-hover:text-primary transition-colors">
              #{index + 1}
            </div>
            <div className="h-10 w-10 md:h-12 md:w-12 shrink-0">
              <CoverArt
                title={song.name}
                url={song.cover_url}
                spotifyId={song.spotify_id}
                className="h-10 w-10 md:h-12 md:w-12 rounded-lg object-cover shadow-lg"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold truncate text-xs md:text-sm uppercase tracking-tight">{song.name}</h3>
              <p className="text-[9px] md:text-[10px] font-mono text-muted-foreground/60 uppercase truncate">
                {song.artist} • {song.album}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="pt-4 md:pt-8 flex flex-col items-center gap-4 shrink-0">
        <div className="flex gap-4">
          <Button
            onClick={onContinue}
            variant={isPreview ? "default" : "outline"}
            className="px-8 md:px-12 py-5 md:py-6 rounded-xl font-mono uppercase tracking-widest text-[10px] md:text-xs font-black"
          >
            {isPreview ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Return to Duel
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
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest text-center max-w-sm">
          {isPreview 
            ? "These rankings will shift as you continue dueling." 
            : "Rankings become more accurate the more you duel."}
        </p>
      </div>
    </div>
  );
}
