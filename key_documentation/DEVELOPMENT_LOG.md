# Song Ranker - Development Log

**Last Updated**: January 19, 2026  
**Status**: ✅ **ACTIVE** - Phase 4 Refinements

---

## 📋 **Decision Log**

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
