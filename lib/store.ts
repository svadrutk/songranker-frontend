/**
 * @deprecated Import from '@/lib/stores' instead for better organization.
 * 
 * This file re-exports all stores from the modular store structure
 * for backwards compatibility. New code should import directly from:
 * - '@/lib/stores' (all stores)
 * - '@/lib/stores/navigation-store' (navigation only)
 * - '@/lib/stores/catalog-store' (catalog only)
 * - '@/lib/stores/analytics-store' (analytics only)
 */

export {
  // Navigation store
  type NavigationState,
  
  // Catalog store
  useCatalogStore,
  type ReleaseType,
  type CatalogView,
  type CatalogState,
  
  // Analytics store
  useAnalyticsStore,
  type MyRankingsMobileTab,
  type AnalyticsState,
  
  // Session Builder store
  useSessionBuilderStore,
  type SourceType,
  type RankingSource,
  type SessionBuilderStatus,
  type SessionBuilderState,
} from "./stores";
