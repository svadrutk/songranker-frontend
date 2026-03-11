"use client";

import { type JSX } from "react";
import { Check, Loader2 } from "lucide-react";
import type { ReleaseGroup } from "@/lib/api";

import { CoverArt } from "@/components/CoverArt";

type InlineArtistSelectorProps = Readonly<{
  artistName: string;
  releases: ReleaseGroup[];
  filteredReleases: ReleaseGroup[];
  selectedIds: string[];
  onToggleSelection: (ids: string[]) => void;
  loading: boolean;
  onAdd: (selectedReleases: ReleaseGroup[]) => void;
  onCancel: () => void;
}>;

export function InlineArtistSelector({
  releases,
  filteredReleases,
  selectedIds,
  onToggleSelection,
  loading,
  onAdd,
  onCancel,
}: InlineArtistSelectorProps): JSX.Element {
  const handleToggleRelease = (id: string) => {
    onToggleSelection(
      selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id]
    );
  };

  const handleAdd = () => {
    const selected = releases.filter(r => selectedIds.includes(r.id));
    onAdd(selected);
  };

  return (
    <div className="w-full h-full p-3 md:p-0 animate-in zoom-in duration-500 flex flex-col gap-3 md:gap-0">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="font-mono text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Loading…</p>
        </div>
      ) : (
        <>
          <div className="relative flex-1 min-h-0 md:overflow-y-auto scrollbar-none">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 md:gap-2 pb-2 md:pb-16">
              {filteredReleases.map((release) => (
                <div 
                  key={release.id}
                  onClick={() => handleToggleRelease(release.id)}
                  className={`group flex items-center gap-3 md:gap-4 p-2 md:p-3 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedIds.includes(release.id)
                      ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/5"
                      : "border-transparent bg-background/40 hover:border-border hover:bg-background/60"
                  }`}
                >
                  <div className="relative h-14 w-14 md:h-16 md:w-16 rounded-lg overflow-hidden shrink-0 shadow-sm">
                    <CoverArt 
                      id={release.id} 
                      title={release.title} 
                      url={release.cover_art?.url}
                      className="h-full w-full"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm md:text-base font-bold truncate ${selectedIds.includes(release.id) ? "text-primary" : ""}`}>
                      {release.title}
                    </h4>
                    <p className="text-[10px] md:text-xs font-mono text-muted-foreground uppercase font-bold opacity-60">
                      {release.type || "Other"}
                    </p>
                  </div>
                  <div className={`h-6 w-6 rounded-full shrink-0 flex items-center justify-center border-2 transition-all ${
                    selectedIds.includes(release.id)
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-border text-transparent"
                  }`}>
                    <Check className="h-2.5 w-2.5" strokeWidth={4} />
                  </div>
                </div>
              ))}
            </div>

            <div className="sticky bottom-0 left-0 right-0 z-10 flex items-center gap-3 pt-4 pb-6 bg-background">
              <button 
                type="button"
                onClick={onCancel} 
                className="px-5 py-3 rounded-lg font-mono text-xs sm:text-sm uppercase tracking-wider font-bold transition-all border border-border/60 bg-muted/20 text-muted-foreground hover:text-destructive hover:border-destructive/40"
              >
                Cancel
              </button>
              <button 
                type="button"
                disabled={selectedIds.length === 0}
                onClick={handleAdd}
                className="flex-1 px-5 py-3 rounded-lg font-mono text-xs sm:text-sm uppercase tracking-wider font-bold transition-all bg-primary text-primary-foreground disabled:opacity-40"
              >
                Add Selected ({selectedIds.length})
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
