import { create } from "zustand";
import { useEffect } from "react";

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
  
  navigateToAnalytics: () => set({
    view: "analytics",
    isSidebarCollapsed: true,
  }),
  
  navigateToMyRankings: (fromNavigator) => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    set({
      view: "my_rankings",
      navigationSource: fromNavigator ? "navigator" : "catalog",
      // On mobile, collapse sidebar when opening from navigator button
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
    
    set({
      view: "my_rankings",
      sessionId: null,
      openInResultsView: false,
      // Keep sidebar closed on mobile if came from kanban
      // On desktop or if came from navigator, keep current state
      isSidebarCollapsed: isMobile && navigationSource === "kanban" ? true : get().isSidebarCollapsed,
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

/**
 * Hook to handle responsive sidebar behavior.
 * Call this in your page component to automatically manage sidebar state on resize.
 */
export function useResponsiveSidebar(user: { id: string } | null) {
  const { view, navigationSource, setSidebarCollapsed } = useNavigationStore();
  
  useEffect(() => {
    const handleResize = () => {
      // When ranking or analytics is active, keep sidebar collapsed (don't reopen on resize)
      if (view === "ranking" || view === "analytics") return;

      // If user came from kanban and is viewing my_rankings, keep navigator closed on mobile
      if (view === "my_rankings" && navigationSource === "kanban") return;

      const isMobile = window.innerWidth < 768;
      
      if (!isMobile) {
        setSidebarCollapsed(false);
      } else {
        // Mobile: Open if logged in, closed if not
        setSidebarCollapsed(!user);
      }
    };

    // Initial check
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [user, view, navigationSource, setSidebarCollapsed]);
}
