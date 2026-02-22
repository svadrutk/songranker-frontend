"use client";

import { useState, useMemo, type JSX } from "react";
import { Check, Loader2 } from "lucide-react";
import type { ReleaseGroup } from "@/lib/api";
import { ReleaseFilters, type ReleaseType } from "@/components/Catalog/ReleaseFilters";
import { Button } from "@/components/ui/button";
import { CoverArt } from "@/components/CoverArt";

type InlineArtistSelectorProps = Readonly<{
  artistName: string;
  releases: ReleaseGroup[];
  loading: boolean;
  onAdd: (selectedReleases: ReleaseGroup[]) => void;
  onCancel: () => void;
}>;

export function InlineArtistSelector({
  artistName,
  releases,
  loading,
  onAdd,
  onCancel,
}: InlineArtistSelectorProps): JSX.Element {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<ReleaseType[]>(["Album"]);

  const toggleFilter = (type: ReleaseType) => {
    setActiveFilters(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const filteredReleases = useMemo(() => {
    const activeFiltersLower = new Set(activeFilters.map((f) => f.toLowerCase()));
    const mainTypes = new Set(["album", "ep", "single"]);

    return releases.filter((release) => {
      const type = (release.type || "Other").toLowerCase();
      if (activeFiltersLower.has(type)) return true;
      return activeFiltersLower.has("other") && !mainTypes.has(type);
    });
  }, [releases, activeFilters]);

  const handleToggleRelease = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleAdd = () => {
    const selected = releases.filter(r => selectedIds.includes(r.id));
    onAdd(selected);
  };

  return (
    <div className="w-full bg-muted/10 border-2 border-primary/20 rounded-[2rem] p-6 md:p-8 animate-in zoom-in duration-500 shadow-xl backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-1">{artistName}</h2>
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.1em] font-bold opacity-70">
            Select releases to add
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            onClick={onCancel} 
            className="font-mono uppercase font-black tracking-widest text-[9px] h-10 px-4"
          >
            Cancel
          </Button>
          <Button 
            disabled={selectedIds.length === 0}
            onClick={handleAdd}
            className="bg-primary text-primary-foreground font-mono font-black uppercase tracking-widest px-6 h-10 rounded-lg shadow-lg shadow-primary/20 text-[10px]"
          >
            Add Selected ({selectedIds.length})
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="font-mono text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
            <ReleaseFilters activeFilters={activeFilters} onToggleFilter={toggleFilter} />
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedIds(filteredReleases.map(r => r.id))}
                className="font-mono text-[8px] uppercase font-bold tracking-widest h-7 px-2"
              >
                All
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedIds([])}
                className="font-mono text-[8px] uppercase font-bold tracking-widest h-7 px-2"
              >
                None
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredReleases.map((release) => (
              <div 
                key={release.id}
                onClick={() => handleToggleRelease(release.id)}
                className={`group flex items-center gap-3 p-2 rounded-xl border-2 transition-all cursor-pointer ${
                  selectedIds.includes(release.id)
                    ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/5"
                    : "border-transparent bg-background/40 hover:border-border hover:bg-background/60"
                }`}
              >
                <div className="relative h-10 w-10 rounded-md overflow-hidden shrink-0 shadow-sm">
                  <CoverArt 
                    id={release.id} 
                    title={release.title} 
                    url={release.cover_art?.url}
                    className="h-full w-full"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-[11px] font-bold truncate ${selectedIds.includes(release.id) ? "text-primary" : ""}`}>
                    {release.title}
                  </h4>
                  <p className="text-[9px] font-mono text-muted-foreground uppercase font-bold opacity-60">
                    {release.type || "Other"}
                  </p>
                </div>
                <div className={`h-5 w-5 rounded-full shrink-0 flex items-center justify-center border-2 transition-all ${
                  selectedIds.includes(release.id)
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-border text-transparent"
                }`}>
                  <Check className="h-2.5 w-2.5" strokeWidth={4} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
