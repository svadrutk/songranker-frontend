"use client";

import type { JSX } from "react";
import { Search, ListMusic, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCatalogStore } from "@/lib/store";

type ViewToggleProps = Readonly<{
  onSearchOpen?: () => void;
  onAnalyticsOpen?: () => void;
  onRankingsOpen?: () => void;
}>;

export function ViewToggle({ onSearchOpen, onAnalyticsOpen, onRankingsOpen }: ViewToggleProps): JSX.Element {
  const { catalogView, setCatalogView } = useCatalogStore();
  
  return (
    <div className="flex bg-muted/20 p-1 rounded-lg border border-border/40">
      <button
        onClick={() => {
          setCatalogView("search");
          onSearchOpen?.();
        }}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-mono text-[10px] uppercase font-bold tracking-widest transition-all",
          catalogView === "search" ? "bg-background shadow-xs text-primary" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Search className="h-3 w-3" />
        <span>Search</span>
      </button>
      <button
        onClick={() => {
          setCatalogView("rankings");
          onRankingsOpen?.();
        }}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-mono text-[10px] uppercase font-bold tracking-widest transition-all",
          catalogView === "rankings" ? "bg-background shadow-xs text-primary" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <ListMusic className="h-3 w-3" />
        <span className="hidden sm:inline">My Rankings</span>
        <span className="sm:hidden">Rankings</span>
      </button>
      <button
        onClick={() => {
          setCatalogView("analytics");
          onAnalyticsOpen?.();
        }}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-mono text-[10px] uppercase font-bold tracking-widest transition-all",
          catalogView === "analytics" ? "bg-background shadow-xs text-primary" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <BarChart2 className="h-3 w-3" />
        <span className="hidden sm:inline">Analytics</span>
        <span className="sm:hidden">Stats</span>
      </button>
    </div>
  );
}
