"use client";

import { Button } from "@/components/ui/button";
import { type ReleaseGroup } from "@/lib/api";
import { Music } from "lucide-react";

interface RankingWidgetProps {
  selectedRelease: ReleaseGroup | null;
}

export function RankingWidget({ selectedRelease }: RankingWidgetProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-8">
      {selectedRelease ? (
        <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-300">
          <div className="text-center space-y-1">
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Currently Ranking</p>
            <h2 className="text-xl font-mono font-bold">{selectedRelease.title}</h2>
          </div>
          
          <div className="flex items-center gap-6">
            <Button variant="outline" className="h-64 w-64 rounded-2xl border-2 hover:border-primary/50 transition-all hover:bg-primary/5 group" aria-label="Rank option 1">
              <div className="flex flex-col items-center gap-4 opacity-20 group-hover:opacity-100 transition-opacity">
                 <Music className="h-12 w-12" />
                 <span className="text-xs font-mono uppercase tracking-widest font-bold">Song A</span>
              </div>
            </Button>
            
            <div className="flex flex-col gap-6">
              <Button variant="outline" className="h-28 w-44 rounded-xl border-2 hover:border-primary/50 transition-all hover:bg-primary/5 group" aria-label="Rank option 2">
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold opacity-20 group-hover:opacity-100 transition-opacity">Option B</span>
              </Button>
              <Button variant="outline" className="h-28 w-44 rounded-xl border-2 hover:border-primary/50 transition-all hover:bg-primary/5 group" aria-label="Rank option 3">
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold opacity-20 group-hover:opacity-100 transition-opacity">Option C</span>
              </Button>
            </div>
            
            <Button variant="outline" className="h-64 w-64 rounded-2xl border-2 hover:border-primary/50 transition-all hover:bg-primary/5 group" aria-label="Rank option 4">
               <div className="flex flex-col items-center gap-4 opacity-20 group-hover:opacity-100 transition-opacity">
                 <Music className="h-12 w-12" />
                 <span className="text-xs font-mono uppercase tracking-widest font-bold">Song D</span>
              </div>
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground font-mono animate-pulse">Select an option to rank</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 opacity-20 grayscale pointer-events-none scale-90">
          <div className="flex items-center gap-4">
            <div className="h-48 w-48 rounded-2xl border-2 border-dashed" />
            <div className="flex flex-col gap-4">
              <div className="h-20 w-32 rounded-xl border-2 border-dashed" />
              <div className="h-20 w-32 rounded-xl border-2 border-dashed" />
            </div>
            <div className="h-48 w-48 rounded-2xl border-2 border-dashed" />
          </div>
          <p className="text-xs font-mono uppercase tracking-widest font-bold">Select an album to start ranking</p>
        </div>
      )}
    </div>
  );
}
