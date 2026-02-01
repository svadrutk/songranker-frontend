/**
 * Catalog - Artist search and release selection interface
 * 
 * This folder contains the main Catalog component and its sub-components:
 * 
 * Main component:
 * - Catalog.tsx - Main orchestrator component
 * 
 * UI Components:
 * - ViewToggle.tsx - Search/Rankings/Analytics tab switcher
 * - SearchBar.tsx - Artist search input with autocomplete
 * - ReleaseList.tsx - List of search results
 * - ReleaseItem.tsx - Individual release card
 * - ReleaseFilters.tsx - Album/EP/Single/Other filter buttons
 * - RankingsView.tsx - Completed rankings list
 * - AnalyticsPlaceholder.tsx - Analytics tab placeholder
 * - StartRankingButton.tsx - "Ready to Rank?" button
 * - LoadingSkeleton.tsx - Loading state skeleton
 */

export { Catalog } from "./Catalog";

// Re-export sub-components for potential reuse
export { ViewToggle } from "./ViewToggle";
export { SearchBar } from "./SearchBar";
export { ReleaseList } from "./ReleaseList";
export { ReleaseItem } from "./ReleaseItem";
export { ReleaseFilters, type ReleaseType } from "./ReleaseFilters";
export { RankingsView } from "./RankingsView";
export { AnalyticsPlaceholder } from "./AnalyticsPlaceholder";
export { StartRankingButton } from "./StartRankingButton";
export { LoadingSkeleton } from "./LoadingSkeleton";
