import { create } from "zustand";
import { useEffect } from "react";

type ViewState = "create" | "review" | "ranking" | "analytics" | "my_rankings";

type NavigationSource = "navigator" | "kanban" | "create";

type NavigationState = {
  // Current view
  view: ViewState;
  
  // Sidebar/Navigator state (Deprecated for full-screen)
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
  navigateToCreate: () => void;
  navigateToReview: () => void;
  navigateToAnalytics: () => void;
  navigateToMyRankings: (fromNavigator: boolean) => void;
  navigateToRanking: (sessionId: string) => void;
  navigateToResults: (sessionId: string, source: NavigationSource) => void;
  navigateBackFromResults: () => void;
  
  // Backwards compatibility for the plan
  navigateToCatalog: () => void;
  
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
  view: "create",
  isSidebarCollapsed: getInitialSidebarState(),
  sessionId: null,
  openInResultsView: false,
  navigationSource: "create",
  
  // Simple setters
  setView: (view) => set({ view }),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  
  // Complex navigation actions
  navigateToCreate: () => set({
    view: "create",
    sessionId: null,
    openInResultsView: false,
    navigationSource: "create",
  }),
  
  // Backwards compatibility for the rename
  navigateToCatalog: () => get().navigateToCreate(),
  
  navigateToReview: () => set({
    view: "review",
  }),
  
  navigateToAnalytics: () => {
    set({
      view: "analytics",
      isSidebarCollapsed: true,
    });
  },
  
  navigateToMyRankings: (fromNavigator) => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    set({
      view: "my_rankings",
      navigationSource: fromNavigator ? "navigator" : "create",
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
    view: "create",
    isSidebarCollapsed: getInitialSidebarState(),
    sessionId: null,
    openInResultsView: false,
    navigationSource: "create",
  }),
}));

/**
 * Hook to handle responsive sidebar behavior.
 * Call this in your page component to automatically manage sidebar state on resize.
 */
export function useResponsiveSidebar(user: { id: string } | null) {
  const { view, navigationSource, setSidebarCollapsed } = useNavigationStore();
  
  // Initial mount: expand sidebar when in create view
  useEffect(() => {
    // Only auto-expand on initial mount for create view
    if (view !== "create") return;
    
    // Always expand sidebar on initial load (both mobile and desktop)
    setSidebarCollapsed(false);
    // Only run once on mount for create view
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

// Export types for consumers
export type { ViewState, NavigationSource, NavigationState };
