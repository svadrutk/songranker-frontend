import { create } from "zustand";
import { useEffect } from "react";
import type { ReleaseGroup } from "@/lib/api";

type ViewState = "catalog" | "dedupe" | "ranking" | "analytics" | "my_rankings";

type NavigationSource = "navigator" | "kanban" | "catalog";

type NavigationState = {
  // Current view
  view: ViewState;
  
  // Sidebar/Navigator state
  isSidebarCollapsed: boolean;
  
  // Session state
  sessionId: string | null;
  openInResultsView: boolean;
  
  // Track where the user came from to handle back navigation properly
  navigationSource: NavigationSource;
  
  // Actions
  setView: (view: ViewState) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Navigation actions
  navigateToCatalog: () => void;
  navigateToAnalytics: () => void;
  navigateToMyRankings: (fromNavigator: boolean) => void;
  navigateToRanking: (sessionId: string) => void;
  navigateToResults: (sessionId: string, source: NavigationSource) => void;
  navigateBackFromResults: () => void;
  
  // Reset state
  reset: () => void;
};

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

const getInitialSidebarState = () => {
  // Always start collapsed for consistent SSR/client hydration
  // The useResponsiveSidebar hook will adjust it after mount
  return true;
};

export const useNavigationStore = create<NavigationState>((set, get) => ({
  // Initial state
  view: "catalog",
  isSidebarCollapsed: getInitialSidebarState(),
  sessionId: null,
  openInResultsView: false,
  navigationSource: "catalog",
  
  // Simple setters
  setView: (view) => set({ view }),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  
  // Complex navigation actions
  navigateToCatalog: () => set({
    view: "catalog",
    sessionId: null,
    openInResultsView: false,
    navigationSource: "catalog",
  }),
  
  navigateToAnalytics: () => {
    // Always collapse when navigating to analytics from the navigator
    // (if sidebar is open, user clicked from inside it and wants to see content)
    set({
      view: "analytics",
      isSidebarCollapsed: true,
    });
  },
  
  navigateToMyRankings: (fromNavigator) => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    set({
      view: "my_rankings",
      navigationSource: fromNavigator ? "navigator" : "catalog",
      // Only collapse sidebar on mobile when clicked from navigator
      // On desktop, keep it open so user can see navigator + content
      isSidebarCollapsed: fromNavigator && isMobile ? true : get().isSidebarCollapsed,
    });
  },
  
  navigateToRanking: (sessionId) => set({
    view: "ranking",
    sessionId,
    openInResultsView: false,
    isSidebarCollapsed: true,
  }),
  
  navigateToResults: (sessionId, source) => set({
    view: "ranking",
    sessionId,
    openInResultsView: true,
    navigationSource: source,
    // Always collapse sidebar when viewing results
    isSidebarCollapsed: true,
  }),
  
  navigateBackFromResults: () => {
    const { navigationSource } = get();
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    
    // Determine sidebar state based on where user came from
    let sidebarCollapsed: boolean;
    if (isMobile) {
      // Mobile: Open navigator if came from navigator, keep closed if came from kanban
      sidebarCollapsed = navigationSource === "navigator" ? false : true;
    } else {
      // Desktop: Keep current state
      sidebarCollapsed = get().isSidebarCollapsed;
    }
    
    set({
      view: "my_rankings",
      sessionId: null,
      openInResultsView: false,
      isSidebarCollapsed: sidebarCollapsed,
    });
  },
  
  reset: () => set({
    view: "catalog",
    isSidebarCollapsed: getInitialSidebarState(),
    sessionId: null,
    openInResultsView: false,
    navigationSource: "catalog",
  }),
}));

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

/**
 * Hook to handle responsive sidebar behavior.
 * Call this in your page component to automatically manage sidebar state on resize.
 */
export function useResponsiveSidebar(user: { id: string } | null) {
  const { view, navigationSource, setSidebarCollapsed } = useNavigationStore();
  
  // Initial mount: expand sidebar when in catalog view
  useEffect(() => {
    // Only auto-expand on initial mount for catalog view
    if (view !== "catalog") return;
    
    // Always expand sidebar on initial load (both mobile and desktop)
    setSidebarCollapsed(false);
    // Only run once on mount for catalog view
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    const handleResize = () => {
      // When ranking or analytics is active, keep sidebar collapsed (don't reopen on resize)
      if (view === "ranking" || view === "analytics") return;

      // If viewing my_rankings and came from navigator or kanban, keep sidebar collapsed on mobile
      if (view === "my_rankings" && (navigationSource === "kanban" || navigationSource === "navigator")) {
        return;
      }

      const isMobile = window.innerWidth < 768;
      
      if (!isMobile) {
        setSidebarCollapsed(false);
      } else {
        // Mobile: Open if logged in, closed if not
        setSidebarCollapsed(!user);
      }
    };

    // Only run on actual resize events, not on initial mount or view changes
    // The navigation functions handle the initial sidebar state
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [user, view, navigationSource, setSidebarCollapsed]);
}

// ==================== Analytics Store ====================

import type {
  SessionSummary,
  ArtistWithLeaderboard,
  GlobalActivityStats,
  LeaderboardResponse,
} from "@/lib/api";

type MyRankingsMobileTab = "draft" | "progress" | "settled";

type AnalyticsState = {
  // User sessions
  sessions: SessionSummary[];
  loadingSessions: boolean;
  
  // Artists with leaderboards (for chart)
  artistsWithLeaderboards: ArtistWithLeaderboard[];
  loadingArtists: boolean;
  
  // Global activity stats
  globalStats: GlobalActivityStats | null;
  loadingGlobalStats: boolean;
  
  // Expanded chart height (when sidebar collapsed)
  expandedChartHeight: number;
  
  // My Rankings mobile tab (persists across navigation)
  myRankingsMobileTab: MyRankingsMobileTab;
  
  // Leaderboard modal state
  leaderboardModalOpen: boolean;
  globalQuery: string;
  suggestions: string[];
  loadingSuggestions: boolean;
  selectedArtist: string;
  leaderboardData: LeaderboardResponse | null;
  leaderboardError: string | null;
  loadingLeaderboard: boolean;
  
  // Actions - Data setters
  setSessions: (sessions: SessionSummary[]) => void;
  setLoadingSessions: (loading: boolean) => void;
  setArtistsWithLeaderboards: (artists: ArtistWithLeaderboard[]) => void;
  setLoadingArtists: (loading: boolean) => void;
  setGlobalStats: (stats: GlobalActivityStats | null) => void;
  setLoadingGlobalStats: (loading: boolean) => void;
  setExpandedChartHeight: (height: number) => void;
  setMyRankingsMobileTab: (tab: MyRankingsMobileTab) => void;
  
  // Actions - Leaderboard modal
  openLeaderboardModal: () => void;
  closeLeaderboardModal: () => void;
  setGlobalQuery: (query: string) => void;
  setSuggestions: (suggestions: string[]) => void;
  setLoadingSuggestions: (loading: boolean) => void;
  setSelectedArtist: (artist: string) => void;
  setLeaderboardData: (data: LeaderboardResponse | null) => void;
  setLeaderboardError: (error: string | null) => void;
  setLoadingLeaderboard: (loading: boolean) => void;
  
  // Compound actions
  startLeaderboardSearch: (artist: string) => void;
  resetAnalytics: () => void;
};

const DEFAULT_CHART_HEIGHT = 520;

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  // Initial state
  sessions: [],
  loadingSessions: false,
  artistsWithLeaderboards: [],
  loadingArtists: true,
  globalStats: null,
  loadingGlobalStats: true,
  expandedChartHeight: DEFAULT_CHART_HEIGHT,
  myRankingsMobileTab: "progress",
  
  // Leaderboard modal initial state
  leaderboardModalOpen: false,
  globalQuery: "",
  suggestions: [],
  loadingSuggestions: false,
  selectedArtist: "",
  leaderboardData: null,
  leaderboardError: null,
  loadingLeaderboard: false,
  
  // Data setters
  setSessions: (sessions) => set({ sessions }),
  setLoadingSessions: (loadingSessions) => set({ loadingSessions }),
  setArtistsWithLeaderboards: (artistsWithLeaderboards) => set({ artistsWithLeaderboards }),
  setLoadingArtists: (loadingArtists) => set({ loadingArtists }),
  setGlobalStats: (globalStats) => set({ globalStats }),
  setLoadingGlobalStats: (loadingGlobalStats) => set({ loadingGlobalStats }),
  setExpandedChartHeight: (expandedChartHeight) => set({ expandedChartHeight }),
  setMyRankingsMobileTab: (myRankingsMobileTab) => set({ myRankingsMobileTab }),
  
  // Leaderboard modal actions
  openLeaderboardModal: () => set({ leaderboardModalOpen: true }),
  closeLeaderboardModal: () => set({
    leaderboardModalOpen: false,
    globalQuery: "",
    suggestions: [],
    selectedArtist: "",
    leaderboardData: null,
    leaderboardError: null,
  }),
  setGlobalQuery: (globalQuery) => set({ globalQuery }),
  setSuggestions: (suggestions) => set({ suggestions }),
  setLoadingSuggestions: (loadingSuggestions) => set({ loadingSuggestions }),
  setSelectedArtist: (selectedArtist) => set({ selectedArtist }),
  setLeaderboardData: (leaderboardData) => set({ leaderboardData }),
  setLeaderboardError: (leaderboardError) => set({ leaderboardError }),
  setLoadingLeaderboard: (loadingLeaderboard) => set({ loadingLeaderboard }),
  
  // Compound action: start a leaderboard search
  startLeaderboardSearch: (artist) => set({
    selectedArtist: artist,
    globalQuery: artist,
    suggestions: [],
    leaderboardData: null,
    leaderboardError: null,
    loadingLeaderboard: true,
  }),
  
  // Reset all analytics state
  resetAnalytics: () => set({
    sessions: [],
    loadingSessions: false,
    artistsWithLeaderboards: [],
    loadingArtists: true,
    globalStats: null,
    loadingGlobalStats: true,
    expandedChartHeight: DEFAULT_CHART_HEIGHT,
    myRankingsMobileTab: "progress",
    leaderboardModalOpen: false,
    globalQuery: "",
    suggestions: [],
    loadingSuggestions: false,
    selectedArtist: "",
    leaderboardData: null,
    leaderboardError: null,
    loadingLeaderboard: false,
  }),
}))
