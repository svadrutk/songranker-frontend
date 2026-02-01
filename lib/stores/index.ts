/**
 * Centralized store exports
 * 
 * This barrel file re-exports all stores for convenient importing.
 * Each store is now in its own file for better maintainability.
 */

// Navigation store - handles view state, sidebar, and navigation actions
export {
  useNavigationStore,
  useResponsiveSidebar,
  type ViewState,
  type NavigationSource,
  type NavigationState,
} from "./navigation-store";

// Catalog store - handles search, filters, and catalog view state
export {
  useCatalogStore,
  type ReleaseType,
  type CatalogView,
  type CatalogState,
} from "./catalog-store";

// Analytics store - handles sessions, artists, global stats, and leaderboard modal
export {
  useAnalyticsStore,
  type MyRankingsMobileTab,
  type AnalyticsState,
} from "./analytics-store";
