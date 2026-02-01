import { create } from "zustand";
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
}));

// Export types for consumers
export type { MyRankingsMobileTab, AnalyticsState };
