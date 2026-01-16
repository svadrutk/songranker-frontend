"use client";

import { useState, useMemo } from "react";
import { Search, Loader2, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoverArt } from "@/components/CoverArt";
import { searchArtistReleaseGroups, getReleaseGroupTracks, type ReleaseGroup } from "@/lib/api";

type ReleaseType = "Album" | "EP" | "Single" | "Other";

function LoadingSkeleton() {
  return (
    <div className="w-full space-y-1">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="w-full flex items-center gap-3 p-2 rounded-md border border-transparent bg-card/40 animate-pulse"
        >
          <div className="h-8 w-8 shrink-0 rounded bg-muted" />
          <div className="flex flex-col gap-1 flex-1">
            <div className="h-2.5 w-1/3 rounded bg-muted" />
            <div className="h-2 w-1/4 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface CatalogProps {
  onSelect: (release: ReleaseGroup | null, tracks: string[]) => void;
  selectedId: string | null;
}

export function Catalog({ onSelect, selectedId }: CatalogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ReleaseGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [tracksCache, setTracksCache] = useState<Record<string, string[]>>({});
  const [loadingTracks, setLoadingTracks] = useState<Record<string, boolean>>({});
  const [activeFilters, setActiveFilters] = useState<ReleaseType[]>(["Album"]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResults([]);
    setExpandedId(null);
    try {
      const data = await searchArtistReleaseGroups(query);
      setResults(data);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (type: ReleaseType) => {
    setActiveFilters(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type) 
        : [...prev, type]
    );
  };

  const filteredResults = useMemo(() => {
    return results.filter(release => {
      const type = release.type as ReleaseType;
      // Handle "Other" specifically if needed, but usually it matches
      if (activeFilters.includes(type)) return true;
      if (activeFilters.includes("Other") && !["Album", "EP", "Single"].includes(type)) return true;
      return false;
    });
  }, [results, activeFilters]);

  const handleSelect = async (rg: ReleaseGroup) => {
    if (selectedId !== rg.id) {
      // Step 1: Select it and start loading songs immediately
      onSelect(rg, tracksCache[rg.id] || []);
      setExpandedId(null);

      // Background fetch tracks if not in cache
      let trackList = tracksCache[rg.id];
      if (!trackList && !loadingTracks[rg.id]) {
        setLoadingTracks((prev) => ({ ...prev, [rg.id]: true }));
        try {
          trackList = await getReleaseGroupTracks(rg.id);
          setTracksCache((prev) => ({ ...prev, [rg.id]: trackList }));
          // Update the parent with the full tracklist once ready
          onSelect(rg, trackList);
        } catch (error) {
          console.error("Failed to fetch tracks:", error);
        } finally {
          setLoadingTracks((prev) => ({ ...prev, [rg.id]: false }));
        }
      }
      return;
    }

    // If already selected, clicking toggles expansion
    setExpandedId((prev) => (prev === rg.id ? null : rg.id));
  };

  return (
    <div className="flex flex-col h-full gap-6 overflow-hidden">
      <div className="w-full">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search artist..."
              className="flex h-10 w-full rounded-md border border-input bg-background px-10 py-2 text-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
            />
          </div>
          <Button type="submit" disabled={loading} className="px-5 h-10">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
        </form>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="space-y-3">
            <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Catalog Loading...</h2>
            <LoadingSkeleton />
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between px-1 mb-3">
              <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Releases ({filteredResults.length})
              </h2>
              <div className="flex gap-1">
                {(["Album", "EP", "Single", "Other"] as ReleaseType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => toggleFilter(type)}
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
            {filteredResults.map((release) => {
              const isSelected = selectedId === release.id;
              const isExpanded = expandedId === release.id;
              const hasTracks = !!tracksCache[release.id];
              const isLoading = loadingTracks[release.id];

              return (
                <div
                  key={release.id}
                  onClick={() => handleSelect(release)}
                  className={`group flex flex-col p-1.5 rounded-md border transition-all cursor-pointer relative ${
                    isSelected 
                      ? "border-white bg-white/5 shadow-xs" 
                      : "bg-card border-transparent text-card-foreground hover:bg-muted/50 hover:border-border"
                  }`}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="relative h-8 w-8 shrink-0">
                      <CoverArt 
                        id={release.id} 
                        title={release.title} 
                        className="rounded-sm h-full w-full"
                      />
                      {isLoading && (
                        <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-sm">
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <span className={`font-mono text-xs font-medium truncate ${isSelected ? "text-white" : ""}`}>
                        {release.title}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter opacity-70">
                          {release.type}
                        </span>
                        {hasTracks && !isExpanded && (
                          <span className="flex items-center gap-1 text-[9px] text-green-600 font-bold uppercase tracking-tighter">
                            <CheckCircle2 className="h-2 w-2" />
                            {tracksCache[release.id].length} songs
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
                      </div>
                    )}
                  </div>

                  {isSelected && isExpanded && hasTracks && (
                    <div className="mt-2 pl-11 pr-2 pb-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                      {tracksCache[release.id].map((track, i) => (
                        <div key={i} className="flex items-center gap-2 group/track">
                          <span className="text-[10px] font-mono text-muted-foreground w-4 shrink-0 text-right">{i + 1}</span>
                          <span className="text-[10px] font-mono truncate text-muted-foreground group-hover/track:text-white transition-colors">
                            {track}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : query && !loading ? (
          <div className="text-center py-12">
            <p className="text-xs text-muted-foreground font-mono">No results found for &quot;{query}&quot;.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full opacity-20 py-20">
            <Search className="h-10 w-10 mb-4" />
            <p className="text-xs font-mono">Search to browse catalog</p>
          </div>
        )}
      </div>
    </div>
  );
}
