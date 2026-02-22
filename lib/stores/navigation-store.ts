import { create } from "zustand";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

type NavigationSource = "navigator" | "kanban" | "create";

type NavigationState = {
  // Sidebar/Navigator state (Deprecated for full-screen)
  isSidebarCollapsed: boolean;
  
  // Track where the user came from to handle back navigation properly
  navigationSource: NavigationSource;
  
  // Actions
  setSidebarCollapsed: (collapsed: boolean) => void;
  setNavigationSource: (source: NavigationSource) => void;
  
  // Reset state
  reset: () => void;
};

const getInitialSidebarState = () => {
  // Always start collapsed for consistent SSR/client hydration
  // The useResponsiveSidebar hook will adjust it after mount
  return true;
};

export const useNavigationStore = create<NavigationState>((set) => ({
  // Initial state
  isSidebarCollapsed: getInitialSidebarState(),
  navigationSource: "create",
  
  // Simple setters
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  setNavigationSource: (source) => set({ navigationSource: source }),
  
  reset: () => set({
    isSidebarCollapsed: getInitialSidebarState(),
    navigationSource: "create",
  }),
}));

/**
 * Hook to handle responsive sidebar behavior.
 * Call this in your page component to automatically manage sidebar state on resize.
 */
export function useResponsiveSidebar(user: { id: string } | null) {
  const pathname = usePathname();
  const { navigationSource, setSidebarCollapsed } = useNavigationStore();
  
  // Initial mount: expand sidebar when in create view (home)
  useEffect(() => {
    // Only auto-expand on initial mount for create view (home)
    if (pathname !== "/") return;
    
    // Always expand sidebar on initial load (both mobile and desktop)
    setSidebarCollapsed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    const handleResize = () => {
      // When ranking or analytics is active, keep sidebar collapsed (don't reopen on resize)
      if (pathname.startsWith("/ranking") || pathname === "/analytics") return;

      // If viewing my_rankings and came from navigator or kanban, keep sidebar collapsed on mobile
      if (pathname === "/my-rankings" && (navigationSource === "kanban" || navigationSource === "navigator")) {
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

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [user, pathname, navigationSource, setSidebarCollapsed]);
}

// Export types for consumers
export type { NavigationSource, NavigationState };
