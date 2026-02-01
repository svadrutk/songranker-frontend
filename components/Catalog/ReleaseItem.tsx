"use client";

import type { JSX } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, X, Loader2 } from "lucide-react";
import { CoverArt } from "@/components/CoverArt";
import type { ReleaseGroup } from "@/lib/api";

type ReleaseItemProps = Readonly<{
  release: ReleaseGroup;
  isSelected: boolean;
  isExpanded: boolean;
  isLoading: boolean;
  tracks: string[] | undefined;
  onSelect: () => void;
  onRemove: (e: React.MouseEvent) => void;
}>;

export function ReleaseItem({
  release,
  isSelected,
  isExpanded,
  isLoading,
  tracks,
  onSelect,
  onRemove,
}: ReleaseItemProps): JSX.Element {
  const hasTracks = !!tracks;

  return (
    <div
      onClick={onSelect}
      className={`group flex flex-col p-1.5 rounded-md border transition-all cursor-pointer relative ${
        isSelected 
          ? "border-primary bg-primary/5 shadow-xs" 
          : "bg-card border-transparent text-card-foreground hover:bg-muted/50 hover:border-border"
      }`}
    >
      <div className="flex items-center gap-3 w-full">
        <div className="relative h-8 w-8 shrink-0">
          <CoverArt 
            id={release.id} 
            title={release.title} 
            url={release.cover_art?.url}
            className="rounded-sm h-full w-full"
          />
          {isLoading && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-sm">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
            </div>
          )}
        </div>
        <div className="flex flex-col flex-1 overflow-hidden">
          <span className={`font-mono text-xs font-medium truncate ${isSelected ? "text-primary" : ""}`}>
            {release.title}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter opacity-70">
              {release.type || "Other"}
            </span>
            {hasTracks && !isExpanded && (
              <span className="flex items-center gap-1 text-[9px] text-green-600 font-bold uppercase tracking-tighter">
                <CheckCircle2 className="h-2 w-2" />
                {tracks.length} songs
              </span>
            )}
          </div>
        </div>
        {isSelected && (
          <div className="flex items-center gap-2 pr-1 text-muted-foreground">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <button 
              onClick={onRemove}
              className="hover:text-destructive transition-colors ml-1 flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {isSelected && isExpanded && hasTracks && (
        <div className="mt-2 pl-11 pr-2 pb-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
          {tracks.map((track, i) => (
            <div key={i} className="flex items-center gap-2 group/track">
              <span className="text-[10px] font-mono text-muted-foreground w-4 shrink-0 text-right">{i + 1}</span>
              <span className="text-[10px] font-mono truncate text-muted-foreground group-hover/track:text-foreground transition-colors">
                {track}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
