"use client";

import { useRouter } from "next/navigation";
import { useMemo, useEffect, useRef, type JSX } from "react";
import { searchArtistReleaseGroups, getReleaseGroupTracks, suggestArtists, type ReleaseGroup } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { SessionSelector } from "@/components/SessionSelector";
import { useCatalogStore } from "@/lib/store";
import { useUserSessions, useDebouncedValue } from "@/lib/hooks";

// Extracted components
import { ViewToggle } from "./ViewToggle";
import { SearchBar } from "./SearchBar";
import { ReleaseList } from "./ReleaseList";
import { RankingsView } from "./RankingsView";
import { AnalyticsPlaceholder } from "./AnalyticsPlaceholder";
import { StartRankingButton } from "./StartRankingButton";

const COMPLETED_THRESHOLD = 90;

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
  const router = useRouter();
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

  // When parent opens analytics or rankings panel, keep that tab selected in sidebar
  const activePanel = showAnalyticsPanel ? "analytics" : showRankingsPanel ? "rankings" : null;
  useEffect(() => {
    if (activePanel === "analytics") setCatalogView("analytics");
    else if (activePanel === "rankings") setCatalogView("rankings");
    else if (activePanel === null) {
      setCatalogView("search");
      setShowSuggestions(false);
    }
  }, [activePanel, setCatalogView, setShowSuggestions]);

  // Derive completed rankings from sessions
  const rankingResults = useMemo(() => {
    return sessions
      .filter((s) => (s.convergence_score ?? 0) >= COMPLETED_THRESHOLD)
      .sort((a, b) => (b.convergence_score ?? 0) - (a.convergence_score ?? 0));
  }, [sessions]);

  const debouncedQuery = useDebouncedValue(query, 300);

  // Track the last searched query to avoid showing suggestions for it
  const lastSearchedQueryRef = useRef<string>("");

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setLoadingSuggestions(false);
      return;
    }

    // Don't show suggestions if query matches what was just searched
    if (trimmed.toLowerCase() === lastSearchedQueryRef.current.toLowerCase()) {
      setShowSuggestions(false);
      setLoadingSuggestions(false);
      return;
    }

    const trimmedDebounced = debouncedQuery.trim();
    if (trimmedDebounced.length < 2) return;

    let cancelled = false;
    setLoadingSuggestions(true);

    suggestArtists(trimmedDebounced)
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
  }, [query, debouncedQuery, setSuggestions, setShowSuggestions, setLoadingSuggestions]);

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
    lastSearchedQueryRef.current = suggestion; // Track what was searched
    
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
      onToggle(rg, tracksCache[rg.id] || []);
      setExpandedId(null);

      let trackList = tracksCache[rg.id];
      if (!trackList && !loadingTracks[rg.id]) {
        updateLoadingTracks(rg.id, true);
        try {
          trackList = await getReleaseGroupTracks(rg.id);
          updateTracksCache(rg.id, trackList);
          onToggle(rg, trackList);
        } catch (error) {
          console.error("Failed to fetch tracks:", error);
        } finally {
          updateLoadingTracks(rg.id, false);
        }
      }
      return;
    }

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
      <div className="flex flex-col gap-4 relative z-10">
        <ViewToggle onSearchOpen={() => router.push("/")} onAnalyticsOpen={onAnalyticsOpen} onRankingsOpen={onRankingsOpen} />

        {catalogView === "search" && (
          <SearchBar
            query={query}
            onQueryChange={setQuery}
            suggestions={suggestions}
            showSuggestions={showSuggestions}
            loadingSuggestions={loadingSuggestions}
            onSuggestionClick={handleSuggestionClick}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            onBlur={() => {
              setTimeout(() => setShowSuggestions(false), 200);
            }}
          />
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar pb-24">
        {catalogView === "search" ? (
          <ReleaseList
            loading={loading}
            query={query}
            results={results}
            filteredResults={filteredResults}
            selectedIds={selectedIds}
            expandedId={expandedId}
            tracksCache={tracksCache}
            loadingTracks={loadingTracks}
            activeFilters={activeFilters}
            onToggleFilter={toggleFilter}
            onSelect={handleSelect}
            onRemove={handleRemove}
          />
        ) : catalogView === "analytics" ? (
          <AnalyticsPlaceholder />
        ) : catalogView === "rankings" ? (
          <div className="flex flex-col gap-2 pr-2 overflow-y-auto custom-scrollbar animate-in fade-in duration-300">
            <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-2 shrink-0">
              Completed Rankings
            </h2>
            <RankingsView
              sessions={rankingResults}
              loading={loadingSessions}
              activeSessionId={activeSessionId}
              onSelect={(id) => (onViewResults ?? onSessionSelect)?.(id)}
            />
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
        <StartRankingButton
          selectedCount={selectedIds.length}
          isLoading={isAnyTrackLoading}
          onClick={() => onStartRanking?.()}
        />
      )}
    </div>
  );
}
