import { create } from "zustand";
import type { ReleaseGroup } from "@/lib/api";

type ReleaseType = "Album" | "EP" | "Single" | "Other";
type CatalogView = "search" | "rankings" | "analytics";

type CatalogState = {
  // Catalog view state
  catalogView: CatalogView;
  
  // Search state
  query: string;
  results: ReleaseGroup[];
  loading: boolean;
  
  // Tracks cache
  tracksCache: Record<string, string[]>;
  loadingTracks: Record<string, boolean>;
  
  // Filters
  activeFilters: ReleaseType[];
  expandedId: string | null;
  
  // Autocomplete
  suggestions: string[];
  showSuggestions: boolean;
  loadingSuggestions: boolean;
  
  // Actions
  setCatalogView: (view: CatalogView) => void;
  setQuery: (query: string) => void;
  setResults: (results: ReleaseGroup[]) => void;
  setLoading: (loading: boolean) => void;
  setTracksCache: (cache: Record<string, string[]>) => void;
  updateTracksCache: (id: string, tracks: string[]) => void;
  setLoadingTracks: (loadingTracks: Record<string, boolean>) => void;
  updateLoadingTracks: (id: string, loading: boolean) => void;
  toggleFilter: (type: ReleaseType) => void;
  setExpandedId: (id: string | null) => void;
  setSuggestions: (suggestions: string[]) => void;
  setShowSuggestions: (show: boolean) => void;
  setLoadingSuggestions: (loading: boolean) => void;
  
  // Clear search
  clearSearch: () => void;
  resetCatalog: () => void;
};

export const useCatalogStore = create<CatalogState>((set) => ({
  // Initial state
  catalogView: "search",
  query: "",
  results: [],
  loading: false,
  tracksCache: {},
  loadingTracks: {},
  activeFilters: ["Album"],
  expandedId: null,
  suggestions: [],
  showSuggestions: false,
  loadingSuggestions: false,
  
  // Actions
  setCatalogView: (catalogView) => set({ catalogView }),
  setQuery: (query) => set({ query }),
  setResults: (results) => set({ results }),
  setLoading: (loading) => set({ loading }),
  setTracksCache: (tracksCache) => set({ tracksCache }),
  updateTracksCache: (id, tracks) => 
    set((state) => ({ tracksCache: { ...state.tracksCache, [id]: tracks } })),
  setLoadingTracks: (loadingTracks) => set({ loadingTracks }),
  updateLoadingTracks: (id, loading) =>
    set((state) => ({ loadingTracks: { ...state.loadingTracks, [id]: loading } })),
  toggleFilter: (type) =>
    set((state) => ({
      activeFilters: state.activeFilters.includes(type)
        ? state.activeFilters.filter((t) => t !== type)
        : [...state.activeFilters, type]
    })),
  setExpandedId: (expandedId) => set({ expandedId }),
  setSuggestions: (suggestions) => set({ suggestions }),
  setShowSuggestions: (showSuggestions) => set({ showSuggestions }),
  setLoadingSuggestions: (loadingSuggestions) => set({ loadingSuggestions }),
  
  clearSearch: () => set({
    query: "",
    results: [],
    loading: false,
    expandedId: null,
    suggestions: [],
    showSuggestions: false,
  }),
  
  resetCatalog: () => set({
    catalogView: "search",
    query: "",
    results: [],
    loading: false,
    tracksCache: {},
    loadingTracks: {},
    activeFilters: ["Album"],
    expandedId: null,
    suggestions: [],
    showSuggestions: false,
    loadingSuggestions: false,
  }),
}));

// Export types for consumers
export type { ReleaseType, CatalogView, CatalogState };
