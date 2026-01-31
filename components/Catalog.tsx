"use client";

import { useState, useMemo, useEffect, type JSX } from "react";
import { Search, CheckCircle2, ChevronDown, ChevronUp, Layers, X, History, ListMusic, BarChart2, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoverArt } from "@/components/CoverArt";
import { searchArtistReleaseGroups, getReleaseGroupTracks, suggestArtists, type ReleaseGroup } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import Image from "next/image";
import { SessionSelector } from "@/components/SessionSelector";
import { cn } from "@/lib/utils";
import { useCatalogStore } from "@/lib/store";
import { useUserSessions } from "@/lib/hooks";

const COMPLETED_THRESHOLD = 90;

type ReleaseType = "Album" | "EP" | "Single" | "Other";

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
  /** When provided, completed rankings in the My Rankings tab open directly in results (leaderboard) view. */
  onViewResults?: (sessionId: string) => void;
  onSessionDelete?: (sessionId: string) => void;
  onAnalyticsOpen?: () => void;
  onRankingsOpen?: () => void;
  showAnalyticsPanel?: boolean;
  showRankingsPanel?: boolean;
  selectedIds: string[];
  activeSessionId: string | null;
}>;

type ViewToggleProps = Readonly<{
  onAnalyticsOpen?: () => void;
  onRankingsOpen?: () => void;
}>;

function ViewToggle({ onAnalyticsOpen, onRankingsOpen }: ViewToggleProps): JSX.Element {
  const { catalogView, setCatalogView } = useCatalogStore();
  
  return (
    <div className="flex bg-muted/20 p-1 rounded-lg border border-border/40">
      <button
        onClick={() => setCatalogView("search")}
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

export function Catalog({ 
  onToggle, 
  onSearchStart, 
  onStartRanking, 
  onSessionSelect,
  onViewResults,
  onSessionDelete,
  onAnalyticsOpen,
  onRankingsOpen,
  showAnalyticsPanel = false,
  showRankingsPanel = false,
  selectedIds,
  activeSessionId
}: CatalogProps): JSX.Element {
  const { user, openAuthModal } = useAuth();
  
  // Zustand catalog state
  const {
    catalogView,
    setCatalogView,
    query,
    setQuery,
    results,
    setResults,
    loading,
    setLoading,
    tracksCache,
    updateTracksCache,
    loadingTracks,
    updateLoadingTracks,
    activeFilters,
    toggleFilter,
    expandedId,
    setExpandedId,
    suggestions,
    setSuggestions,
    showSuggestions,
    setShowSuggestions,
    loadingSuggestions,
    setLoadingSuggestions,
  } = useCatalogStore();

  // React Query for sessions (shared cache with AnalyticsPage, MyRankingsOverview)
  const { data: sessions = [], isLoading: loadingSessions } = useUserSessions(user?.id);

  // When parent opens analytics or rankings panel, keep that tab selected in sidebar (single dep so array size is stable)
  // When neither is active (e.g., RankingWidget is open), reset to search view
  const activePanel = showAnalyticsPanel ? "analytics" : showRankingsPanel ? "rankings" : null;
  useEffect(() => {
    if (activePanel === "analytics") setCatalogView("analytics");
    else if (activePanel === "rankings") setCatalogView("rankings");
    else if (activePanel === null) setCatalogView("search");
  }, [activePanel, setCatalogView]);

  // Derive completed rankings from sessions
  const rankingResults = useMemo(() => {
    return sessions
      .filter((s) => (s.convergence_score ?? 0) >= COMPLETED_THRESHOLD)
      .sort((a, b) => (b.convergence_score ?? 0) - (a.convergence_score ?? 0));
  }, [sessions]);
  
  const loadingRankingResults = loadingSessions;
  const [rankingResultsImageErrors, setRankingResultsImageErrors] = useState<Record<string, boolean>>({});

  // Fetch suggestions when query changes
  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    let cancelled = false;
    setLoadingSuggestions(true);
    
    suggestArtists(trimmedQuery)
      .then((names) => {
        if (!cancelled) {
          setSuggestions(names);
          setShowSuggestions(names.length > 0);
        }
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSuggestions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query, setSuggestions, setShowSuggestions, setLoadingSuggestions]);

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    
    if (!user) {
      openAuthModal("login");
      return;
    }
    
    // Auto-submit the search
    setLoading(true);
    setResults([]);
    setExpandedId(null);
    onSearchStart?.();
    searchArtistReleaseGroups(suggestion)
      .then((data) => {
        const uniqueData = Array.from(new Map(data.map(item => [item.id, item])).values());
        setResults(uniqueData);
      })
      .catch((error) => console.error("Search failed:", error))
      .finally(() => setLoading(false));
  };

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
        updateLoadingTracks(rg.id, true);
        try {
          trackList = await getReleaseGroupTracks(rg.id);
          updateTracksCache(rg.id, trackList);
          // Update the parent with the full tracklist once ready
          onToggle(rg, trackList);
        } catch (error) {
          console.error("Failed to fetch tracks:", error);
        } finally {
          updateLoadingTracks(rg.id, false);
        }
      }
      return;
    }

    // If already selected, clicking toggles expansion
    setExpandedId(expandedId === rg.id ? null : rg.id);
  };

  const handleRemove = (e: React.MouseEvent, rg: ReleaseGroup) => {
    e.stopPropagation();
    onToggle(rg, []);
    if (expandedId === rg.id) setExpandedId(null);
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

  const isAnyTrackLoading = useMemo(() => 
    selectedIds.some(id => loadingTracks[id]), 
    [selectedIds, loadingTracks]
  );

  return (
    <div className="flex flex-col h-full gap-6 overflow-hidden relative">
      <div className="flex flex-col gap-4">
        {/* View Toggle */}
        <ViewToggle onAnalyticsOpen={onAnalyticsOpen} onRankingsOpen={onRankingsOpen} />

        {catalogView === "search" && (
          <div className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onBlur={() => {
                  // Delay to allow click on suggestion
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                placeholder="Search artist..."
                className="flex h-10 w-full rounded-md border border-input bg-background px-10 py-2 text-sm transition-all focus-visible:outline-none focus-visible:border-primary/20 focus-visible:ring-1 focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
              />
              
              {/* Loading indicator */}
              {loadingSuggestions && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin z-10" />
              )}
              
              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors first:rounded-t-md last:rounded-b-md"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar pb-24">
        {catalogView === "search" ? (
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
        ) : catalogView === "analytics" ? (
          <div className="flex flex-col items-center justify-center h-full opacity-80 py-20 animate-in fade-in duration-300">
            <BarChart2 className="h-10 w-10 mb-4 text-primary" />
            <p className="text-xs font-mono text-center px-4 text-muted-foreground">
              Analytics open on the right →
            </p>
            <p className="text-[10px] font-mono text-muted-foreground/70 mt-1">
              Global &amp; user stats
            </p>
          </div>
        ) : catalogView === "rankings" ? (
          <div className="flex flex-col gap-2 pr-2 overflow-y-auto custom-scrollbar animate-in fade-in duration-300">
            <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-2 shrink-0">
              Completed Rankings
            </h2>
            {loadingRankingResults ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="text-xs font-mono uppercase tracking-widest">Loading…</p>
              </div>
            ) : rankingResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-center px-4">
                <History className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-xs font-mono text-muted-foreground">No completed rankings yet.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {rankingResults.map((session) => (
                  <button
                    key={session.session_id}
                    type="button"
                    onClick={() => (onViewResults ?? onSessionSelect)?.(session.session_id)}
                    className={cn(
                      "w-full group flex items-center gap-3 pt-3 px-3 pb-4 rounded-md border transition-all text-left",
                      activeSessionId === session.session_id
                        ? "border-primary/40 bg-primary/5 shadow-xs"
                        : "bg-card border-transparent hover:bg-muted/50 hover:border-border"
                    )}
                  >
                    <div className="relative w-10 h-10 shrink-0 rounded overflow-hidden bg-muted/20">
                      {(session.top_album_covers ?? []).length > 0 && !rankingResultsImageErrors[session.session_id] ? (
                        <Image
                          src={(session.top_album_covers ?? [])[0]}
                          alt=""
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                          onError={() => setRankingResultsImageErrors((prev) => ({ ...prev, [session.session_id]: true }))}
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Layers className="h-5 w-5 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className={cn(
                        "font-mono text-xs font-bold truncate block",
                        activeSessionId === session.session_id ? "text-primary" : ""
                      )}>
                        {session.primary_artist}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5 text-[9px] text-muted-foreground font-mono uppercase tracking-tighter">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 opacity-50" />
                          {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(session.created_at))}
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 opacity-50" />
                          {session.convergence_score ?? 0}%
                        </span>
                      </div>
                    </div>
                    <BarChart2 className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary shrink-0" />
                  </button>
                ))}
              </div>
            )}
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

      {catalogView === "search" && selectedIds.length > 0 && (
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
