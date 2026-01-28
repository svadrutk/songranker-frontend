# Song Ranker - Development Log

**Last Updated**: January 22, 2026  
**Status**: ✅ **ACTIVE** - Performance Optimizations

---

## 📋 **Decision Log**

### **Decision #13: Smart Polling with Exponential Backoff for Ranking Updates**
**Date**: January 22, 2026
**Author**: opencode (Interactive Agent)

**What Changed**:
- **Removed Hardcoded Delays**: Replaced the fixed 1-second and 4-second delays with intelligent polling that checks for updates multiple times with exponential backoff.
- **Polling Strategy**: Implemented 4 poll attempts at 0ms, 400ms, 800ms, 1.5s, and 2.5s intervals. The system stops polling early if the convergence score updates, indicating the worker has completed.
- **Early Exit**: Polling stops as soon as the backend ranking model completes, reducing update latency from 4 seconds to typically under 1 second.
- **Scalability**: The exponential backoff approach handles variable worker processing times gracefully, supporting both current low-latency scenarios (<1s) and future high-load scenarios where the Bradley-Terry model might take longer.

**Why**:
- **Performance**: The Bradley-Terry model runs in milliseconds (typically <250ms), but the frontend was artificially waiting 4 seconds for updates, creating a perceived delay.
- **User Experience**: Users now see ranking updates within ~400ms when the worker completes quickly, instead of waiting a fixed 4 seconds.
- **Future-Proof**: As user load increases, the polling strategy adapts automatically, continuing to check for updates without assuming a fixed completion time.
- **Efficiency**: Stops polling early when convergence updates, avoiding unnecessary API calls.

**Technical Details**:
- **Location**: `components/RankingWidget.tsx:214-274`
- **Poll Intervals**: [0ms, 400ms, 800ms, 1.5s, 2.5s] with early exit on convergence change
- **Detection Logic**: Compares `detail.convergence_score` against the previous value to detect when the ranking model has completed
- **Console Logging**: Added sync logging to track poll attempts and completion for monitoring

**Impact**:
- **Reduced Latency**: Ranking updates now appear 3-4x faster (from ~4s to <1s in typical scenarios)
- **Better Responsiveness**: UI feels more reactive and immediate when making ranking decisions
- **Maintained Reliability**: Still handles edge cases where worker might take >1s under load
- **Improved UX**: Users see the "Rankings Refined" notification much sooner after completing duels

---

### **Decision #12: Seamless Bradley-Terry Integration & Convergence Progress**
**Date**: January 19, 2026
**Author**: opencode (Interactive Agent)

**What Changed**:
- **API Synchronization**: Standardized all API responses and types on the `convergence` field (integer 0-100).
- **Progress Tracking**: Added an elegant, animated progress bar to `RankingWidget.tsx` that reflects the model's convergence percentage.
- **Seamless Sync**: Implemented background synchronization that triggers after every 10 duels. The UI performs a "silent merge" that updates Bradley-Terry strengths for the pool while preserving the local Elo state for the active pair to avoid visual disruption.
- **Finish Session Flow**: Introduced a "View Results" button that appears automatically once the ranking reaches a stability threshold (90% convergence).
- **Interactive Leaderboard**: Created a `Leaderboard` view sorted by `bt_strength` with an Elo-based fallback for early sessions.

**Why**:
- **Transparency**: Users need to know how close they are to a "definitive" ranking.
- **Data Integrity**: The merge strategy ensures that optimistic local choices are never "erased" by delayed background worker updates.
- **Stability**: Background syncing prevents expensive calculations from blocking the UI, while explicit `isMounted` checks prevent errors during navigation.
- **UX**: Eliminating the redundant `setCurrentPair` call in the sync logic prevents the song pair from suddenly "swapping" while the user is making a choice.

**Impact**:
- Unified the frontend pairing logic with the backend's statistical engine.
- Added a professional "progress" feel to the ranking process.
- Improved the "Top 10" stability perception through real-time feedback.

---

### **Decision #11: VS Button Refinement & Centering Fix**
**Date**: January 19, 2026
**Author**: opencode (Interactive Agent)

**What Changed**:
- **Typography**: Removed the `italic` style from the "VS" text to ensure it looks perfectly centered and balanced.
- **Emphasis**: Increased the "VS" circle size to `h-16 w-16` and added a thicker `border-[3px] border-primary`.
- **Simplification**: Removed various experimental animations (blobs, spikes, visualizers) in favor of a clean, static, high-contrast circular design.
- **Centering**: Adjusted text tracking and removed directional skewing to ensure the "VS" label is optically and mathematically centered.

**Why**:
- **Legibility**: Italicized text often appears off-center in small circular containers due to the slant; switching to a bold upright font resolves the visual imbalance.
- **Visual Hierarchy**: The "VS" button is the focal point between the two choices; making it larger and cleaner improves its role as a divider.
- **Stability**: Removing distracting animations ensures the user focuses on the song choices during the duel.

**Impact**:
- Cleaner, more professional duel interface.
- Resolved user feedback regarding the "off-center" look of the central divider.

---

### **Decision #10: Advanced Duel Animations & Polished Deletion UX**
**Date**: January 19, 2026
**Author**: opencode (Interactive Agent)

**What Changed**:
- **Winner Celebration**: Added a "winner" state to `RankingCard.tsx` featuring a scale-up animation, a trophy icon overlay, and a primary-color flash effect.
- **Smooth Transitions**: Implemented `AnimatePresence` in `RankingWidget.tsx` for smooth entry/exit of song cards during duels, using directional slides and blur effects.
- **Duel Timing**: Introduced a 600ms delay after a selection to allow the winner animation to play before transitioning to the next pair.
- **Safe Deletion**: Replaced the native `confirm()` dialog in `SessionSelector.tsx` with a custom, high-fidelity `DeleteConfirmationModal` built with `framer-motion` and Tailwind.
- **Accessibility**: Refactored session selection items to avoid nested buttons, using `div` with proper keyboard interaction handlers.
- **Code Optimization**: Refactored the `RankingWidget` to use `.map()` for card slots, reducing JSX duplication and simplifying animation logic.

**Why**:
- **Gamification**: Visual feedback for winning songs makes the ranking process more engaging and rewarding.
- **User Trust**: A custom deletion modal provides a more integrated and "safe" feeling for destructive actions compared to browser defaults.
- **Polish**: Smooth transitions reduce cognitive load when the UI state changes rapidly during duels.

**Impact**:
- Significantly improved visual quality of the core ranking loop.
- More robust and accessible session management.
- Cleaner, more maintainable component architecture.

---

### **Decision #9: Session Management & Dynamic Sidebar Layout**
**Date**: January 19, 2026
**Author**: opencode (Interactive Agent)

**What Changed**:
- Implemented `getUserSessions` in `lib/api.ts` to fetch past sessions via `GET /users/{user_id}/sessions`.
- Created `SessionSelector.tsx` for browsing and selecting past ranking sessions.
- Added a view toggle in `Catalog.tsx` to switch between "Search" and "My Sessions".
- Implemented an animated, collapsible sidebar in `app/page.tsx` using `framer-motion`.
- Added auto-collapse logic when a ranking session starts to maximize focus on the duel screen.
- Added a manual toggle and a floating "Expand" button to manage sidebar visibility.

**Why**:
- **Persistence**: Users need a way to resume past rankings without re-searching and deduplicating.
- **Immersion**: Collapsing the sidebar during duels removes visual clutter and allows the user to focus solely on the ranking task.
- **Flexibility**: The manual toggle ensures users can still access the catalog or switch sessions without resetting the app.

**Impact**:
- Enhanced session management flow.
- Polished, interactive UI with smooth layout transitions.
- Improved "Duel" experience through full-screen focus.

---

### **Decision #8: Optimistic Elo Updates & Similar-Elo Pairing**
**Date**: January 18, 2026
**Author**: opencode (Interactive Agent)

**What Changed**:
- Implemented `lib/elo.ts` to replicate backend Elo logic ($K=32$) on the frontend.
- Implemented `lib/pairing.ts` using a "closest-Elo" strategy to maximize information gain.
- Updated `RankingWidget.tsx` to fetch session songs and run the ranking loop.
- Added "Tie" and "Skip" functionality to the duel interface.

**Why**:
- **Snappy UX**: Optimistic updates ensure the UI responds instantly to user choices without waiting for backend confirmation.
- **Efficiency**: Similar-Elo pairing ensures that duels are meaningful and help converge the ranking faster.
- **Resilience**: The frontend handles its own pairing and rating state, syncing with the backend in the background.

**Impact**:
- Functional ranking loop implemented.
- Immediate visual feedback on song ratings (visible on hover).
- Seamless transition from deduplication to ranking.

---

### **Decision #7: Robust Deduplication & Normalization Logic**
**Date**: January 18, 2026
**Author**: opencode (Interactive Agent)

**What Changed**:
- Refactored `lib/deduplication.ts` and `DeduplicationModal.tsx` to use original array indices for identifying and removing duplicate songs.
- Enhanced `normalizeTitle` to include more aggressive cleaning (stripping punctuation and common metadata variations).
- Implemented performance heuristics (length checks) in `calculateSimilarity` to optimize $O(N^2)$ fuzzy matching.
- Added loading states in `Catalog.tsx` to prevent starting a ranking session while track data is still being fetched in the background.

**Why**:
- Previous implementation used string matching for removal, which caused all instances of a song (e.g., from different albums) to be deleted if one was flagged as a duplicate.
- Users encountered "empty" sessions when selecting the same song from multiple releases.
- Robust normalization ensures that "Song Name (2024 Remaster)" and "Song Name" are correctly identified as duplicates.
- Loading states prevent race conditions where a session starts with an incomplete track list.

**Impact**:
- Resolved a critical data loss bug where users lost songs they intended to rank.
- Improved accuracy of the "Review Duplicates" step.
- Smoother UX when selecting multiple releases from a large catalog.

---

### **Decision #13: Adaptive Pairing & Leaderboard Enrichment**
**Date**: January 19, 2026
**Author**: opencode (Interactive Agent)

**What Changed**:
- **Adaptive Pairing**: Updated `lib/pairing.ts` to utilize Bradley-Terry strengths ($p_i$) when available. This ensures that as the session progresses, the system selects pairs with similar "true" strengths, maximizing the mathematical information gained from each duel.
- **Leaderboard Data**: Enhanced the `Leaderboard` view to display either the BT Strength percentage or the local Elo rating, providing users with transparency into the "why" behind the ranking.
- **Early Termination**: Added a "Finish" button that appears after 15 duels if the user wants to view their results before reaching the 90% convergence threshold.
- **Pairing Fallback**: Implemented a normalized Elo-based fallback for pairing when BT strengths are not yet computed by the backend worker.

**Why**:
- **Efficiency**: Purely random or Elo-based pairing is less efficient than BT-based pairing for statistical convergence in later stages of a session.
- **UX**: Users often feel they've seen enough after 15-20 duels; forcing them to 90% convergence (which might take 50+ duels for large sets) can be frustrating.
- **Transparency**: Seeing the "Strength" percentage makes the "Definitive Order" feel more scientific and grounded in the data they provided.

**Impact**:
- Faster ranking convergence through smarter pairing.
- More flexible user flow with early-finish options.
- Improved data visualization in the results screen.

---

### **Decision #14: High-Fidelity Social Sharing**
**Date**: January 19, 2026
**Author**: opencode (Interactive Agent)

**What Changed**:
- **Share Card Generation**: Implemented a "Share" button using `html-to-image` to generate a vertical (1080x1920) social media card.
- **Visual Design**: Created `ShareVisual.tsx` which features a large artwork for the #1 song and a sleek numbered list for songs 2–10, optimized for Instagram Stories.
- **Sharing API**: Integrated the **Web Share API** for native sharing on mobile devices, with a high-quality PNG download fallback for desktop.
- **Celebration**: Added `canvas-confetti` to provide positive reinforcement when a user generates their results card.

**Why**:
- **Virality**: Providing users with a "pretty" visual (similar to Spotify Wrapped) encourages sharing, which is the primary driver for growth in music-related apps.
- **Closure**: Generating a final card gives the user a sense of "completion" for their ranking session.
- **Performance**: Rendering the card off-screen and capturing it as an image is more efficient than building a complex canvas-based renderer.

**Impact**:
- Increased user engagement and potential for organic social sharing.
- Professional, polished feel for the session completion state.

---

### **Decision #15: Local Session Caching & SWR Pattern**
**Date**: January 19, 2026
**Author**: opencode (Interactive Agent)

**What Changed**:
- **Caching Mechanism**: Implemented `localStorage` caching for the "My Sessions" view in `SessionSelector.tsx`.
- **SWR Implementation**: Adopted a "Stale-While-Revalidate" pattern. The UI now loads cached sessions instantly on mount, then performs a background API fetch to update the list and refresh the cache.
- **Cache Invalidation**: Added logic to `app/page.tsx` to clear the local session cache whenever a new ranking session is successfully created.
- **Data Integrity**: Ensured that deleting a session from the UI also updates the local cache immediately.

**Why**:
- **Performance**: Fetching the full session list from the API on every view switch created a noticeable delay and a "flickering" loading state.
- **Perceived Speed**: Instant loading of cached data makes the application feel more responsive and "app-like."
- **Efficiency**: Reduces unnecessary API calls when the user is simply toggling between search and sessions.

**Impact**:
- Near-instant switching between "Search" and "My Sessions" views.
- Improved user experience for returning users with many sessions.
- Reduced load on the backend for session list retrieval.

---

### **Decision #16: Conditional Toast Notifications**
**Date**: January 19, 2026
**Author**: opencode (Interactive Agent)

**What Changed**:
- **Toast Logic**: Updated `RankingWidget.tsx` to suppress the "Top 10 Rankings Updated!" toast notification until the convergence score (or optimistic progress) reaches the 90% stability threshold.
- **Dependency Tracking**: Included `displayScore` in the `useEffect` dependency array to ensure accurate threshold checking.

**Why**:
- **Reducing Noise**: During the early stages of a ranking session, the Top 10 shifts very frequently. Repeatedly showing "Updated!" notifications while the user is still in the "Calibrating" or "Establishing Order" phases is distracting and provides little value.
- **Meaningful Feedback**: By waiting until the 90% threshold is met, the notification only triggers when the rankings have reached a high level of statistical stability, making any subsequent shift much more significant and noteworthy.

**Impact**:
- Cleaner, less intrusive UI during the bulk of the ranking process.
- Higher signal-to-noise ratio for rank-related notifications.

---

### **Decision #17: Keyboard Shortcut Optimization for Ranking Loop**
**Date**: January 20, 2026
**Author**: opencode (Interactive Agent)

**What Changed**:
- **Shortcuts**: Switched the keyboard shortcuts for "Tie" and "Skip" from `Space`/`Escape` to `ArrowUp`/`ArrowDown`.
- **UI Feedback**: Updated the `KeyboardShortcutsHelp` component to reflect the new arrow-based control scheme.

**Why**:
- **Ergonomics**: Mapping all primary ranking actions to the arrow keys (Left/Right for selection, Up/Down for Tie/Skip) provides a more cohesive and comfortable "directional" control scheme for power users.
- **Consistency**: Centralizing controls on the arrow keys reduces hand movement and makes the ranking process feel more fluid.

**Impact**:
- Improved ergonomics for keyboard-based ranking.
- More intuitive shortcut help graphic.

---

## 🐛 **Issues Tracking**

### **Issue: Total Removal of Duplicated Songs (RESOLVED)**
- **Problem**: The filter logic removed every instance of a song string if it was in the `songsToRemove` set.
- **Impact**: Critical; users lost all copies of a song if it appeared in more than one selected release.
- **Resolution**: Switched to index-based tracking. The `DuplicateGroup` now carries `matchIndices` which refer back to the original `allSongs` array.

---

## ✅ **Validation Results**

### **Deduplication Logic Validation**
**Date**: January 18, 2026  
**Status**: ✅ Passed
- ✅ Exact duplicates across releases are correctly grouped.
- ✅ Merging a group keeps exactly ONE instance (the canonical one).
- ✅ "Keep Both" correctly preserves all original instances.
- ✅ Normalization strips common remastered/live/demo suffixes.
- ✅ ESLint passed without errors.

---

## 📚 **Lessons Learned**
- **Trust but Verify Indices**: When working with lists of items that can have identical string representations (like song titles), always use unique IDs or array indices for selection/removal logic.
- **Metadata is Messy**: Metadata from external APIs (like Spotify or MusicBrainz) is highly inconsistent; normalization must be aggressive for comparison but the original strings should be preserved for display.
