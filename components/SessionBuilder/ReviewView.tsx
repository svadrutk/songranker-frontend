"use client";

import { useState, useMemo, type JSX } from "react";
import { Check, Merge, Split, ArrowLeft, Play, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { findPotentialDuplicates, resolveSourcesToSongs } from "@/lib/deduplication";
import { useSessionBuilderStore } from "@/lib/store";
import type { SongInput } from "@/lib/api";

type ReviewViewProps = Readonly<{
  onBack: () => void;
  onConfirm: (songs: SongInput[]) => void;
}>;

export function ReviewView({ onBack, onConfirm }: ReviewViewProps): JSX.Element {
  const { sources } = useSessionBuilderStore();
  
  const allSongs = useMemo(() => resolveSourcesToSongs(sources), [sources]);
  const songTitles = useMemo(() => allSongs.map(s => s.name), [allSongs]);
  
  const duplicateGroups = useMemo(() => findPotentialDuplicates(songTitles), [songTitles]);

  const [resolutions, setResolutions] = useState<Record<number, boolean>>(() =>
    duplicateGroups.reduce((acc, _, idx) => ({ ...acc, [idx]: true }), {})
  );

  const toggleResolution = (idx: number) => {
    setResolutions((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleConfirm = () => {
    const indicesToRemove = new Set(
      duplicateGroups
        .filter((_, idx) => resolutions[idx])
        .flatMap(group => group.matchIndices.slice(1))
    );

    const finalSongs = allSongs.filter((_, idx) => !indicesToRemove.has(idx));
    onConfirm(finalSongs);
  };

  const removedCount = duplicateGroups
    .filter((_, idx) => resolutions[idx])
    .reduce((acc, g) => acc + g.matchIndices.length - 1, 0);
    
  const totalFinalCount = allSongs.length - removedCount;

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto px-4 md:px-8 py-12 gap-12 overflow-y-auto custom-scrollbar animate-in slide-in-from-right-8 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-mono font-black text-muted-foreground hover:text-primary transition-colors uppercase tracking-[0.2em]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Builder
        </button>
        <div className="text-center md:text-right">
          <h1 className="text-3xl md:text-4xl font-mono font-black uppercase tracking-tight">Review & Clean</h1>
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest opacity-70">
            {allSongs.length} songs found • {duplicateGroups.length} duplicate groups
          </p>
        </div>
      </div>

      {totalFinalCount > 150 && (
        <div className="bg-yellow-500/10 border-2 border-yellow-500/20 rounded-3xl p-8 flex items-start gap-6 animate-in fade-in duration-700">
          <div className="h-12 w-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center shrink-0">
            <ShieldAlert className="h-7 w-7 text-yellow-500" />
          </div>
          <div className="space-y-2">
            <h3 className="font-mono font-black uppercase tracking-tight text-yellow-500 text-lg">Large Session Warning</h3>
            <p className="text-sm text-muted-foreground font-mono leading-relaxed opacity-80">
              Ranking {totalFinalCount} songs might take a significant amount of time. 
              We recommend keeping sessions under 150 songs for the best experience.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {duplicateGroups.length === 0 ? (
          <div className="bg-muted/5 border-2 border-dashed border-border/40 rounded-[3rem] py-24 flex flex-col items-center gap-6 text-center">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="font-mono font-black uppercase tracking-widest text-xl text-primary">Your list is clean</h3>
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-[0.2em] opacity-60">No duplicates were found across your sources.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            <h2 className="font-mono font-black uppercase tracking-widest text-primary/60 text-sm px-2">
              Potential Duplicates ({duplicateGroups.length})
            </h2>
            {duplicateGroups.map((group, idx) => (
              <div 
                key={idx} 
                style={{ contentVisibility: 'auto', containIntrinsicSize: '0 200px' } as React.CSSProperties}
                className={`p-8 rounded-[2rem] border-2 transition-all duration-300 ${
                  resolutions[idx] 
                    ? "bg-primary/5 border-primary/20 shadow-lg ring-4 ring-primary/5" 
                    : "bg-muted/20 border-transparent opacity-60"
                }`}
              >
                <div className="flex flex-col md:flex-row items-start justify-between gap-8">
                  <div className="space-y-6 flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono font-black px-2 py-1 rounded-lg bg-background/50 uppercase tracking-widest border border-border/40">
                        Group {idx + 1}
                      </span>
                      {group.confidence < 100 && (
                        <span className="text-[10px] font-mono font-black px-2 py-1 rounded-lg bg-yellow-500/10 text-yellow-500 uppercase tracking-widest border border-yellow-500/20">
                          {group.confidence}% Match
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="h-3.5 w-3.5 text-primary" strokeWidth={4} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-lg font-mono font-black text-foreground uppercase tracking-tight truncate">
                            {group.canonical}
                          </p>
                          <p className="text-[10px] font-mono text-muted-foreground uppercase font-bold tracking-widest opacity-60">Canonical Version</p>
                        </div>
                      </div>
                      
                      <div className="pl-10 space-y-3">
                        {group.matches.slice(1).map((m, i) => (
                          <div key={i} className="flex items-center gap-3 opacity-50">
                            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0" />
                            <p className={`text-sm font-mono truncate ${resolutions[idx] ? "line-through" : ""}`}>
                              {m}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => toggleResolution(idx)}
                    variant="outline"
                    className={`h-auto py-4 px-8 rounded-2xl font-mono text-[10px] font-black uppercase tracking-widest transition-all ${
                      resolutions[idx] 
                        ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20" 
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {resolutions[idx] ? (
                      <span className="flex items-center gap-2"><Merge className="h-4 w-4" /> Merge</span>
                    ) : (
                      <span className="flex items-center gap-2"><Split className="h-4 w-4" /> Keep All</span>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-background/80 backdrop-blur-xl border-t border-border/40 p-8 flex flex-col items-center gap-4 mt-auto -mx-4 md:-mx-8 z-30">
        <Button 
          size="lg"
          onClick={handleConfirm}
          className="h-20 px-16 rounded-3xl bg-primary text-primary-foreground font-mono font-black uppercase tracking-[0.2em] text-xl hover:scale-105 active:scale-95 transition-all group shadow-[0_20px_50px_rgba(var(--primary-rgb),0.3)]"
        >
          Start Ranking ({totalFinalCount} Songs) <Play className="ml-4 h-7 w-7 fill-current transition-transform group-hover:scale-110" />
        </Button>
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest font-bold opacity-60">
          Your draft will be saved to your profile
        </p>
      </div>
    </div>
  );
}
