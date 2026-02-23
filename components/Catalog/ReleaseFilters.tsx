"use client";

import type { JSX } from "react";
import { cn } from "@/lib/utils";

type ReleaseType = "Album" | "EP" | "Single" | "Other";

type ReleaseFiltersProps = Readonly<{
  activeFilters: ReleaseType[];
  onToggleFilter: (type: ReleaseType) => void;
}>;

const FILTER_OPTIONS: { type: ReleaseType; label: string }[] = [
  { type: "Album", label: "Albums" },
  { type: "EP", label: "EPs" },
  { type: "Single", label: "Singles" },
];

export function ReleaseFilters({ 
  activeFilters, 
  onToggleFilter, 
}: ReleaseFiltersProps): JSX.Element {
  return (
    <div className="flex justify-center">
      <div className="inline-flex gap-1 rounded-lg border border-border/60 bg-muted/20 p-1">
        {FILTER_OPTIONS.map(({ type, label }) => (
          <button
            key={type}
            type="button"
            onClick={() => onToggleFilter(type)}
            className={cn(
              "px-3 py-2 rounded-md font-mono text-[10px] sm:text-xs uppercase tracking-wider font-bold transition-all",
              activeFilters.includes(type)
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
            aria-pressed={activeFilters.includes(type)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export type { ReleaseType };
