"use client";

/**
 * RankingWidget - Song comparison and ranking interface
 * 
 * This folder contains the main RankingWidget component and its sub-components:
 * 
 * Main component:
 * - RankingWidget.tsx - Main orchestrator component
 * 
 * UI Components:
 * - HeaderSection.tsx - Title and stats display
 * - ProgressSection.tsx - Convergence progress bar and buttons
 * - LeaderboardPreviewModal.tsx - Modal for peeking at rankings
 * - RankUpdateNotification.tsx - Toast notification for rank updates
 * - RankingPlaceholder.tsx - Empty/auth required states
 * - RankingControlButton.tsx - Tie/Skip/Undo buttons
 * - KeyboardShortcutsHelp.tsx - Keyboard shortcuts overlay
 * - StatBadge.tsx - Track/duel count badges
 * - SpeedLines.tsx - Animated decorative lines
 * - PairingLoader.tsx - Loading state for pair selection
 * 
 * Hooks:
 * - useConvergenceTracking.ts - Progress smoothing and timing hooks
 */

export { RankingWidget } from "./RankingWidget";

// Re-export sub-components for potential reuse
export { HeaderSection } from "./HeaderSection";
export { ProgressSection } from "./ProgressSection";
export { LeaderboardPreviewModal } from "./LeaderboardPreviewModal";
export { RankUpdateNotification } from "./RankUpdateNotification";
export { RankingPlaceholder } from "./RankingPlaceholder";
export { RankingControlButton } from "./RankingControlButton";
export { KeyboardShortcutsHelp } from "./KeyboardShortcutsHelp";
export { StatBadge } from "./StatBadge";
export { SpeedLines } from "./SpeedLines";
export { PairingLoader } from "./PairingLoader";

// Re-export hooks
export { 
  useConvergenceTracking, 
  useWindowFocusTimer, 
  useTimedNotification 
} from "./useConvergenceTracking";
