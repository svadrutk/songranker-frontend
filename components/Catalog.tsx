"use client";

import { useState, useMemo, useEffect, type JSX } from "react";
import { Search, Loader2, CheckCircle2, ChevronDown, ChevronUp, Layers, X, Lock, History, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoverArt } from "@/components/CoverArt";
import { 
  searchArtistReleaseGroups, 
  getReleaseGroupTracks, 
  getGlobalLeaderboard,
  getLeaderboardStats,
  type ReleaseGroup,
  type LeaderboardResponse
} from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { SessionSelector } from "@/components/SessionSelector";
import { cn } from "@/lib/utils";

type ReleaseType = "Album" | "EP" | "Single" | "Other";
type CatalogView = "search" | "rankings" | "global";

function LoadingSkeleton(): JSX.Element {
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

type CatalogProps = Readonly<{
  onToggle: (release: ReleaseGroup, tracks: string[]) => void;
  onSearchStart?: () => void;
  onStartRanking?: () => void;
  onSessionSelect?: (sessionId: string) => void;
  onSessionDelete?: (sessionId: string) => void;
  onGlobalLeaderboardOpen?: (artist: string, data: LeaderboardResponse | null, error: string | null) => void;
  selectedIds: string[];
  activeSessionId: string | null;
}>;

type ViewToggleProps = Readonly<{
  view: CatalogView;
  setView: (view: CatalogView) => void;
}>;

function ViewToggle({ view, setView }: ViewToggleProps): JSX.Element {
  return (
    <div className="flex bg-muted/20 p-1 rounded-lg border border-border/40">
      <button
        onClick={() => setView("search")}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-mono text-[10px] uppercase font-bold tracking-widest transition-all",
          view === "search" ? "bg-background shadow-xs text-primary" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Search className="h-3 w-3" />
        <span className="hidden sm:inline">Search</span>
      </button>
      <button
        onClick={() => setView("rankings")}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-mono text-[10px] uppercase font-bold tracking-widest transition-all",
          view === "rankings" ? "bg-background shadow-xs text-primary" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <History className="h-3 w-3" />
        <span className="hidden sm:inline">My Rankings</span>
        <span className="sm:hidden">Rankings</span>
      </button>
      <button
        onClick={() => setView("global")}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-mono text-[10px] uppercase font-bold tracking-widest transition-all",
          view === "global" ? "bg-background shadow-xs text-primary" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Globe className="h-3 w-3" />
        <span className="hidden sm:inline">Global</span>
        <span className="sm:hidden">Global</span>
      </button>
    </div>
  );
}

export function Catalog({ 
  onToggle, 
  onSearchStart, 
  onStartRanking, 
  onSessionSelect,
  onSessionDelete,
  onGlobalLeaderboardOpen,
  selectedIds,
  activeSessionId
}: CatalogProps): JSX.Element {
  const { user, openAuthModal } = useAuth();
  const [view, setView] = useState<CatalogView>("search");
  
  // Catalog Search State
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ReleaseGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [tracksCache, setTracksCache] = useState<Record<string, string[]>>({});
  const [loadingTracks, setLoadingTracks] = useState<Record<string, boolean>>({});
  const [activeFilters, setActiveFilters] = useState<ReleaseType[]>(["Album"]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Global Leaderboard State (managed by parent)
  const [globalQuery, setGlobalQuery] = useState("");
  const [globalArtist, setGlobalArtist] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const [globalData, setGlobalData] = useState<LeaderboardResponse | null>(null);
  
  // Optional: Refetch global leaderboard when switching to global view (disabled for performance)
  // Only refetch if data is stale (more than 5 minutes old)
  useEffect(() => {
    if (view === "global" && globalArtist && globalData) {
      const lastFetchKey = `global_${globalArtist}_timestamp`;
      const lastFetch = localStorage.getItem(lastFetchKey);
      const fiveMinutes = 5 * 60 * 1000;
      
      if (!lastFetch || Date.now() - parseInt(lastFetch) > fiveMinutes) {
        const refetch = async () => {
          try {
            const data = await getGlobalLeaderboard(globalArtist);
            if (data) {
              setGlobalData(data);
              localStorage.setItem(lastFetchKey, Date.now().toString());
            }
          } catch (err) {
            console.error("Failed to refetch global leaderboard:", err);
          }
        };
        refetch();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, globalArtist]); // Note: globalData intentionally not in deps to avoid infinite loop

  // Debounce for global search suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (globalQuery.trim().length < 2 || view !== "global" || globalArtist === globalQuery) {
        setSuggestions([]);
        return;
      }
      
      setIsSearchingGlobal(true);
      try {
        const data = await searchArtistReleaseGroups(globalQuery);
        // Extract unique artist names
        const uniqueArtists = Array.from(new Set(
          data
            .map(item => item.artist)
            .filter((a): a is string => !!a)
        )).slice(0, 5);
        setSuggestions(uniqueArtists);
      } catch (err) {
        console.error("Failed to fetch suggestions:", err);
      } finally {
        setIsSearchingGlobal(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [globalQuery, view, globalArtist]);

  const handleGlobalSearch = async (artistName: string) => {
    if (!user) {
      openAuthModal("login");
      return;
    }

    setGlobalArtist(artistName);
    setGlobalQuery(artistName); // Sync input
    setSuggestions([]);
    setGlobalData(null);

    // Notify parent immediately with loading state
    onGlobalLeaderboardOpen?.(artistName, null, null);

    try {
      // 1. Check if stats exist first (optional optimization, but good UX)
      const stats = await getLeaderboardStats(artistName);
      
      if (!stats) {
        // If no stats, we can skip fetching full leaderboard or just pass null
        // We'll let the component handle the "no data" state
        setGlobalData(null);
        onGlobalLeaderboardOpen?.(artistName, null, null);
      } else {
        // 2. Fetch full leaderboard
        const data = await getGlobalLeaderboard(artistName);
        setGlobalData(data);
        onGlobalLeaderboardOpen?.(artistName, data, null);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load global rankings";
      onGlobalLeaderboardOpen?.(artistName, null, errorMsg);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (!user) {
      openAuthModal("login");
      return;
    }

    setLoading(true);
    setResults([]);
    setExpandedId(null);
    onSearchStart?.();
    try {
      const data = await searchArtistReleaseGroups(query);
      // Deduplicate results by ID to prevent duplicate key errors
      const uniqueData = Array.from(new Map(data.map(item => [item.id, item])).values());
      setResults(uniqueData);
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
    const activeFiltersLower = new Set(activeFilters.map((f) => f.toLowerCase()));
    const mainTypes = new Set(["album", "ep", "single"]);

    return results.filter((release) => {
      const type = (release.type || "Other").toLowerCase();
      if (activeFiltersLower.has(type)) return true;
      return activeFiltersLower.has("other") && !mainTypes.has(type);
    });
  }, [results, activeFilters]);

  const handleSelect = async (rg: ReleaseGroup) => {
    if (!user) {
      openAuthModal("login");
      return;
    }

    const isSelected = selectedIds.includes(rg.id);
    
    if (!isSelected) {
      // Step 1: Select it and start loading songs immediately
      onToggle(rg, tracksCache[rg.id] || []);
      setExpandedId(null);

      // Background fetch tracks if not in cache
      let trackList = tracksCache[rg.id];
      if (!trackList && !loadingTracks[rg.id]) {
        setLoadingTracks((prev) => ({ ...prev, [rg.id]: true }));
        try {
          trackList = await getReleaseGroupTracks(rg.id);
          setTracksCache((prev) => ({ ...prev, [rg.id]: trackList }));
          // Update the parent with the full tracklist once ready
          onToggle(rg, trackList);
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

  const handleRemove = (e: React.MouseEvent, rg: ReleaseGroup) => {
    e.stopPropagation();
    onToggle(rg, []);
    if (expandedId === rg.id) setExpandedId(null);
  };

  const isAnyTrackLoading = useMemo(() => 
    selectedIds.some(id => loadingTracks[id]), 
    [selectedIds, loadingTracks]
  );

  return (
    <div className="flex flex-col h-full gap-6 overflow-hidden relative">
      <div className="flex flex-col gap-4">
        {/* View Toggle */}
        <ViewToggle view={view} setView={setView} />

        {view === "search" && (
          <form onSubmit={handleSearch} className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search artist..."
                className="flex h-10 w-full rounded-md border border-input bg-background px-10 py-2 text-sm transition-all focus-visible:outline-none focus-visible:border-primary/20 focus-visible:ring-1 focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
              />
            </div>
            <Button type="submit" disabled={loading} className="px-5 h-10 bg-neutral-300 hover:bg-neutral-400 text-black font-mono relative group">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : !user ? (
                <div className="flex items-center gap-2">
                  <Lock className="h-3 w-3" />
                  <span>Search</span>
                </div>
              ) : (
                "Search"
              )}
            </Button>
          </form>
        )}

        {view === "global" && (
           <form onSubmit={(e) => { e.preventDefault(); handleGlobalSearch(globalQuery); }} className="relative animate-in fade-in slide-in-from-top-1 duration-300 z-50">
             <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={globalQuery}
                  onChange={(e) => {
                    setGlobalQuery(e.target.value);
                    if (!e.target.value) setSuggestions([]);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleGlobalSearch(globalQuery);
                    }
                  }}
                  placeholder="Find global rankings..."
                  className="flex h-10 w-full rounded-md border border-input bg-background px-10 py-2 text-sm transition-all focus-visible:outline-none focus-visible:border-primary/20 focus-visible:ring-1 focus-visible:ring-primary/10 shadow-sm"
                />
                {isSearchingGlobal && user && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              <Button type="submit" disabled={isSearchingGlobal} className="px-5 h-10 bg-neutral-300 hover:bg-neutral-400 text-black font-mono relative group">
                {isSearchingGlobal ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : !user ? (
                  <div className="flex items-center gap-2">
                    <Lock className="h-3 w-3" />
                    <span>Search</span>
                  </div>
                ) : (
                  "Search"
                )}
              </Button>
            </div>
            
            {/* Autocomplete Suggestions */}
            {suggestions.length > 0 && user && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="py-1">
                  {suggestions.map((artist) => (
                    <button
                      key={artist}
                      type="button"
                      onClick={() => handleGlobalSearch(artist)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-muted/50 transition-colors flex items-center gap-2"
                    >
                      <Search className="h-3 w-3 text-muted-foreground/50" />
                      <span className="font-medium">{artist}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
           </form>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar pb-24">
        {view === "search" ? (
          loading ? (
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
              {filteredResults.map((release, index) => {
                const isSelected = selectedIds.includes(release.id);
                const isExpanded = expandedId === release.id;
                const hasTracks = !!tracksCache[release.id];
                const isLoading = loadingTracks[release.id];

                return (
                  <div
                    key={`${release.id}-${index}`}
                    onClick={() => handleSelect(release)}
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
                          <button 
                            onClick={(e) => handleRemove(e, release)}
                            className="hover:text-destructive transition-colors ml-1 flex items-center justify-center"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {isSelected && isExpanded && hasTracks && (
                      <div className="mt-2 pl-11 pr-2 pb-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                        {tracksCache[release.id].map((track, i) => (
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
          )
        ) : view === "global" ? (
          <div className="flex flex-col items-center justify-center h-full opacity-20 py-20">
            <Globe className="h-10 w-10 mb-4" />
            <p className="text-xs font-mono text-center px-4">
              {globalArtist 
                ? "View global rankings on the right →"
                : "Search to see global rankings"}
            </p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">
            <SessionSelector 
              onSelect={(id) => onSessionSelect?.(id)} 
              onDelete={(id) => onSessionDelete?.(id)}
              activeSessionId={activeSessionId}
            />
          </div>
        )}
      </div>

      {view === "search" && selectedIds.length > 0 && (
        <div className="absolute bottom-4 md:bottom-6 left-0 right-0 px-4 md:px-6 animate-in slide-in-from-bottom-4">
          <Button 
            onClick={() => onStartRanking?.()}
            disabled={isAnyTrackLoading}
            className="w-full bg-green-500 hover:bg-green-600 text-black font-mono py-4 md:py-6 rounded-xl shadow-lg shadow-green-900/20 text-base md:text-lg group flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-wait"
          >
            {isAnyTrackLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Layers className="h-5 w-5 mr-2" />
            )}
            {isAnyTrackLoading ? "FETCHING TRACKS..." : "READY TO RANK?"}
            {!isAnyTrackLoading && (
              <span className="ml-1 px-2 py-0.5 bg-black/10 rounded-md text-xs">{selectedIds.length}</span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
