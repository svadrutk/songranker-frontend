"use client";

import type { JSX } from "react";

type ReleaseType = "Album" | "EP" | "Single" | "Other";

type ReleaseFiltersProps = Readonly<{
  activeFilters: ReleaseType[];
  onToggleFilter: (type: ReleaseType) => void;
  resultCount: number;
}>;

const FILTER_TYPES: ReleaseType[] = ["Album", "EP", "Single", "Other"];

export function ReleaseFilters({ 
  activeFilters, 
  onToggleFilter, 
  resultCount 
}: ReleaseFiltersProps): JSX.Element {
  return (
    <div className="flex items-center justify-between px-1 mb-3">
      <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
        Releases ({resultCount})
      </h2>
      <div className="flex gap-1">
        {FILTER_TYPES.map(type => (
          <button
            key={type}
            onClick={() => onToggleFilter(type)}
            className={`text-[9px] px-1.5 py-0.5 rounded-sm border transition-all font-bold uppercase ${
              activeFilters.includes(type)
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted text-muted-foreground border-transparent hover:border-muted-foreground/20"
            }`}
          >
            {type}
          </button>
        ))}
      </div>
    </div>
  );
}

export type { ReleaseType };
