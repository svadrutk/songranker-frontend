"use client";

import type { JSX } from "react";
import { Search } from "lucide-react";
import type { ReleaseGroup } from "@/lib/api";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { ReleaseFilters, type ReleaseType } from "./ReleaseFilters";
import { ReleaseItem } from "./ReleaseItem";

type ReleaseListProps = Readonly<{
  loading: boolean;
  query: string;
  results: ReleaseGroup[];
  filteredResults: ReleaseGroup[];
  selectedIds: string[];
  expandedId: string | null;
  tracksCache: Record<string, string[]>;
  loadingTracks: Record<string, boolean>;
  activeFilters: ReleaseType[];
  onToggleFilter: (type: ReleaseType) => void;
  onSelect: (release: ReleaseGroup) => void;
  onRemove: (e: React.MouseEvent, release: ReleaseGroup) => void;
}>;

export function ReleaseList({
  loading,
  query,
  results,
  filteredResults,
  selectedIds,
  expandedId,
  tracksCache,
  loadingTracks,
  activeFilters,
  onToggleFilter,
  onSelect,
  onRemove,
}: ReleaseListProps): JSX.Element {
  if (loading) {
    return (
      <div className="space-y-3">
        <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
          Catalog Loading...
        </h2>
        <LoadingSkeleton />
      </div>
    );
  }

  if (results.length > 0) {
    return (
      <div className="space-y-1">
        <ReleaseFilters
          activeFilters={activeFilters}
          onToggleFilter={onToggleFilter}
          resultCount={filteredResults.length}
        />
        {filteredResults.map((release, index) => (
          <ReleaseItem
            key={`${release.id}-${index}`}
            release={release}
            isSelected={selectedIds.includes(release.id)}
            isExpanded={expandedId === release.id}
            isLoading={loadingTracks[release.id] ?? false}
            tracks={tracksCache[release.id]}
            onSelect={() => onSelect(release)}
            onRemove={(e) => onRemove(e, release)}
          />
        ))}
      </div>
    );
  }

  if (query && !loading) {
    return (
      <div className="text-center py-12">
        <p className="text-xs text-muted-foreground font-mono">
          No results found for &quot;{query}&quot;.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full opacity-20 py-20">
      <Search className="h-10 w-10 mb-4" />
      <p className="text-xs font-mono">Search to browse catalog</p>
    </div>
  );
}
