"use client";

import { useState, useMemo, useEffect, type JSX } from "react";
import { Check, Merge, Split, ArrowLeft, ShieldAlert, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { findPotentialDuplicates, resolveSourcesToSongs } from "@/lib/deduplication";
import { useSessionBuilderStore } from "@/lib/store";
import { useTheme } from "next-themes";
import Image from "next/image";
import { IconSparkles } from "./SessionBuilder";
import type { SongInput } from "@/lib/api";

type ReviewViewProps = Readonly<{
  onBack: () => void;
  onConfirm: (songs: SongInput[], name?: string) => void;
}>;

function generateSmartDefaultName(songs: SongInput[]): string {
  if (songs.length === 0) return "New Ranking";

  const artists = Array.from(new Set(songs.map(s => s.artist).filter(Boolean)));
  const albums = Array.from(new Set(songs.map(s => s.album).filter(Boolean)));

  // If single album (and likely single artist)
  if (albums.length === 1 && albums[0]) {
    return albums[0];
  }

  // Artist logic
  if (artists.length === 1 && artists[0]) {
    return artists[0];
  } else if (artists.length === 2) {
    return `${artists[0]} & ${artists[1]}`;
  } else if (artists.length === 3) {
    return `${artists[0]}, ${artists[1]} & ${artists[2]}`;
  } else if (artists.length > 3) {
    return `${artists[0]}, ${artists[1]} & ${artists.length - 2} others`;
  }

  return "My Custom Mix";
}

export function ReviewView({ onBack, onConfirm }: ReviewViewProps): JSX.Element {
  const { sources } = useSessionBuilderStore();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const buttonLogoSrc = mounted && resolvedTheme === "dark" ? "/logo/logo-dark.svg" : "/logo/logo.svg";
  
  const allSongs = useMemo(() => resolveSourcesToSongs(sources), [sources]);
  const songTitles = useMemo(() => allSongs.map(s => s.name), [allSongs]);
  
  const duplicateGroups = useMemo(() => findPotentialDuplicates(songTitles), [songTitles]);

  const [resolutions, setResolutions] = useState<Record<number, boolean>>(() =>
    duplicateGroups.reduce((acc, _, idx) => ({ ...acc, [idx]: true }), {})
  );

  const [sessionName, setSessionName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);

  const smartDefault = useMemo(() => generateSmartDefaultName(allSongs), [allSongs]);
  const currentName = isEditingName ? sessionName : smartDefault;

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
    onConfirm(finalSongs, currentName.trim() || undefined);
  };

  const removedCount = duplicateGroups
    .filter((_, idx) => resolutions[idx])
    .reduce((acc, g) => acc + g.matchIndices.length - 1, 0);
    
  const totalFinalCount = allSongs.length - removedCount;

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-12 gap-6 md:gap-12 overflow-y-auto scrollbar-none animate-in slide-in-from-right-8 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
        <button 
          onClick={onBack}
          className="text-muted-foreground hover:text-primary transition-colors"
          aria-label="Back to builder"
        >
          <ArrowLeft className="h-8 w-8 md:h-10 md:w-10" />
        </button>
        <div className="text-center md:text-right">
          <h1 className="text-2xl md:text-4xl font-sans font-black uppercase tracking-tight">Review & Clean</h1>
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest opacity-70">
            {allSongs.length} songs found • {duplicateGroups.length} duplicate groups
          </p>
        </div>
      </div>

      <div className="bg-card border-2 border-border/40 rounded-2xl md:rounded-3xl p-5 md:p-8 flex flex-col md:flex-row items-center gap-4 md:gap-6 animate-in fade-in duration-700">
        <div className="hidden md:flex h-12 w-12 rounded-2xl bg-primary/10 items-center justify-center shrink-0">
          <Pencil className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 w-full space-y-1.5 md:space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="font-mono font-black uppercase tracking-tight text-primary/60 text-[10px]">Ranking Name</h3>
            <Pencil className={`h-3 w-3 transition-opacity duration-300 ${nameFocused ? "opacity-0" : "text-muted-foreground/40 opacity-100"}`} />
          </div>
          <div className="relative">
            <input
              type="text"
              value={currentName}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              onChange={(e) => {
                setSessionName(e.target.value);
                setIsEditingName(true);
              }}
              placeholder="Name your ranking..."
              className="w-full bg-transparent border-none p-0 font-sans text-lg md:text-2xl font-black uppercase tracking-tight focus:ring-0 placeholder:text-muted-foreground/30"
            />
            <div className={`absolute bottom-0 left-0 right-0 h-px transition-all duration-300 ${nameFocused ? "bg-primary/50 scale-x-100" : "bg-muted-foreground/15 scale-x-100"}`} />
          </div>
        </div>
      </div>

      {totalFinalCount > 150 && (
        <div className="bg-yellow-500/10 border-2 border-yellow-500/20 rounded-2xl md:rounded-3xl p-5 md:p-8 flex items-start gap-4 md:gap-6 animate-in fade-in duration-700">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-yellow-500/20 flex items-center justify-center shrink-0">
            <ShieldAlert className="h-5 w-5 md:h-7 md:w-7 text-yellow-500" />
          </div>
          <div className="space-y-1 md:space-y-2">
            <h3 className="font-mono font-black uppercase tracking-tight text-yellow-500 text-base md:text-lg">Large Session Warning</h3>
            <p className="text-xs md:text-sm text-muted-foreground font-mono leading-relaxed opacity-80">
              Ranking {totalFinalCount} songs might take a significant amount of time. 
              We recommend keeping sessions under 150 songs for the best experience.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-5 md:space-y-8">
        {duplicateGroups.length === 0 ? (
          <div className="bg-muted/5 border-2 border-dashed border-border/40 rounded-2xl md:rounded-[3rem] py-14 md:py-24 flex flex-col items-center gap-4 md:gap-6 text-center px-4">
            <div className="h-14 w-14 md:h-20 md:w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="h-7 w-7 md:h-10 md:w-10 text-primary" />
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <h3 className="font-sans font-black uppercase tracking-normal text-2xl md:text-3xl text-primary">Your list is clean</h3>
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-normal opacity-60">No duplicates were found across your sources.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:gap-6">
            <h2 className="font-mono font-black uppercase tracking-widest text-primary/60 text-sm px-2">
              Potential Duplicates ({duplicateGroups.length})
            </h2>
            {duplicateGroups.map((group, idx) => (
              <div 
                key={idx} 
                style={{ contentVisibility: 'auto', containIntrinsicSize: '0 180px' } as React.CSSProperties}
                className={`p-5 md:p-8 rounded-2xl md:rounded-[2rem] border-2 transition-all duration-300 ${
                  resolutions[idx] 
                    ? "bg-primary/5 border-primary/20 shadow-lg ring-4 ring-primary/5" 
                    : "bg-muted/20 border-transparent opacity-60"
                }`}
              >
                <div className="flex flex-col md:flex-row items-start justify-between gap-4 md:gap-8">
                  <div className="space-y-4 md:space-y-6 flex-1 min-w-0">
                    <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                      <span className="text-[10px] font-mono font-black px-2 py-1 rounded-lg bg-background/50 uppercase tracking-widest border border-border/40">
                        Group {idx + 1}
                      </span>
                      {group.confidence < 100 && (
                        <span className="text-[10px] font-mono font-black px-2 py-1 rounded-lg bg-yellow-500/10 text-yellow-500 uppercase tracking-widest border border-yellow-500/20">
                          {group.confidence}% Match
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-3 md:space-y-4">
                      <div className="flex items-start gap-3 md:gap-4">
                        <div className="h-5 w-5 md:h-6 md:w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="h-3 w-3 md:h-3.5 md:w-3.5 text-primary" strokeWidth={4} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-base md:text-lg font-mono font-black text-foreground uppercase tracking-tight truncate">
                            {group.canonical}
                          </p>
                          <p className="text-[10px] font-mono text-muted-foreground uppercase font-bold tracking-widest opacity-60">Canonical Version</p>
                        </div>
                      </div>
                      
                      <div className="pl-8 md:pl-10 space-y-2 md:space-y-3">
                        {group.matches.slice(1).map((m, i) => (
                          <div key={i} className="flex items-center gap-2 md:gap-3 opacity-50">
                            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0" />
                            <p className={`text-xs md:text-sm font-mono truncate ${resolutions[idx] ? "line-through" : ""}`}>
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
                    className={`w-full md:w-auto h-auto py-3 md:py-4 px-6 md:px-8 rounded-xl md:rounded-2xl font-mono text-[10px] font-black uppercase tracking-widest transition-all ${
                      resolutions[idx] 
                        ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20" 
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {resolutions[idx] ? (
                      <span className="flex items-center justify-center gap-2"><Merge className="h-4 w-4" /> Merge</span>
                    ) : (
                      <span className="flex items-center justify-center gap-2"><Split className="h-4 w-4" /> Keep All</span>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-background/80 backdrop-blur-xl border-t border-border/40 p-4 md:p-8 flex flex-col items-center gap-2 md:gap-4 mt-auto -mx-4 md:-mx-8 z-30">
        <Button 
          size="lg"
          onClick={handleConfirm}
          className="w-full md:w-auto h-20 px-10 rounded-2xl bg-primary text-primary-foreground font-sans font-semibold tracking-tight text-2xl active:scale-95 transition-all cursor-pointer group shadow-2xl relative overflow-hidden"
        >
          <div className="flex items-center gap-4 relative z-10">
            <div className="relative h-10 w-10 flex items-center justify-center">
              <div className="relative z-10 group-hover:rotate-12 transition-transform duration-300">
                <Image
                  src={buttonLogoSrc}
                  alt="Logo"
                  width={36}
                  height={36}
                  className="object-contain"
                />
              </div>
              <IconSparkles />
            </div>
            Start Ranking ({totalFinalCount})
          </div>
        </Button>
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest font-bold opacity-60">
          Your draft will be saved to your profile
        </p>
      </div>
    </div>
  );
}
