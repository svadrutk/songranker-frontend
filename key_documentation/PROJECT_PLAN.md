# Song Ranker - Project Plan

**Last Updated**: January 19, 2026  
**Status**: ✅ **ACTIVE** - Core Features Complete  
**Current Phase**: Phase 7 - Future Enhancements

---

## 📊 **Executive Summary**

Song Ranker is an interactive web application for ranking songs through pairwise comparisons. It uses a hybrid mathematical approach: **Elo** in the frontend for immediate interactivity and pairing, and the **Bradley-Terry Model** in the backend as the statistical source of truth for the final ranking.

### **Project Overview**

**Approach**: Minimize comparisons while producing accurate total ordering based on user preferences.
**Approach Details**: Use Elo for real-time feedback and Bradley-Terry for final statistical validation.

### **Current Status**:
- ✅ Next.js application initialized
- ✅ Supabase database connected
- ✅ Documentation structure established
- ✅ Hybrid Elo/Bradley-Terry architecture framework established
- ✅ UI component system (shadcn/ui) and dark mode implemented
- ✅ Phase 1: Deduplication & Review (Frontend) - **COMPLETED**
- ✅ Phase 2: Session & Data Persistence (Backend) - **COMPLETED**
- ✅ Phase 3: The Ranking Loop & Elo (Frontend) - **COMPLETED**
- ✅ Phase 4: Session Management & UI Refinement - **COMPLETED**
- ✅ Phase 5: Results & Polish - **COMPLETED**
- ✅ Phase 6: Bradley-Terry & Model Sync (Backend) - **COMPLETED**
- ✅ Phase 7: Social Sharing & Visuals - **COMPLETED**
- 🚧 Phase 8: Global Rankings & Analytics - **PLANNED**

---

## 🏗️ **Technical Architecture**

### **Frontend (Interactivity & Speed)**
- **Framework**: Next.js 16 (App Router), TypeScript, Tailwind CSS 4.
- **Deduplication**: Regex-based normalization and fuzzy matching (Levenshtein) with a "Confidence Score" to catch near-duplicates before session start.
- **Ranking Engine**: Local **Elo Rating System** (starting at 1500) and **Adaptive Pairing** based on Bradley-Terry strengths.
- **Pairing Strategy**: Selection of pairs with similar Elo/BT ratings to maximize information gain per duel.

### **Backend (Accuracy & Persistence)**
- **Framework**: FastAPI (Python), Supabase (PostgreSQL).
- **Deep Deduplication**: Asynchronous background task using `RapidFuzz` for intensive matching across the session's song set.
- **Ranking Engine**: **Bradley-Terry MM (Minorization-Maximization) Algorithm**.
- **Model Sync**: Computes updated strength parameters ($p_i$) every 10–15 duels and returns them to the frontend to calibrate the "Official Ranking."

---

## 📅 **Phased Development Roadmap**

### **Phase 1: Deduplication & Review (Frontend)** ✅ **COMPLETED**
- **Normalization**: Strip "Instrumental", "Remastered", "Live", etc.
- **Fuzzy Matching**: Identify potential duplicates with uncertainty scores.
- **UI**: Implement the "Review & Merge" modal before session initialization.

### **Phase 2: Session & Data Persistence (Backend)** ✅ **COMPLETED**
- **Supabase Schema**: Implement `sessions`, `comparisons`, and `songs` tables.
- **API**: 
  - `POST /sessions`: Initialize session with deduplicated song list.
  - `BackgroundTasks`: Trigger deep fuzzy matching and update session "aliases."
  - `GET /sessions/{id}/songs`: Fetch session tracks with local Elo.
  - `POST /sessions/{id}/comparisons`: Record duels and update ratings.

### **Phase 3: The Ranking Loop & Elo (Frontend)** ✅ **COMPLETED**
- **Logic**: Implement `lib/elo.ts` for real-time rating updates and `lib/pairing.ts` for similar-Elo pairing.
- **UI**: Transform `RankingWidget` into an active duel interface with "Song A", "Song B", "Tie", and "Skip" options.
- **UX**: Implement optimistic UI updates for instant feedback.

### **Phase 5: Results & Polish** ✅ **COMPLETED**
- **UX**: Implemented winner animations, smooth transitions, and high-fidelity confirmation modals.
- **Accessibility**: Optimized interactive elements for keyboard and screen reader support.
- **Organization**: Refactored core components for better maintainability and code clarity.

### **Phase 6: Bradley-Terry & Model Sync (Backend)** ✅ **COMPLETED**
- **Algorithm**: Implement Bradley-Terry MM in the backend.
- **Sync**: Return BT strengths to frontend; recalibrate local Elo ratings to match BT ordering.
- **Adaptive Pairing**: Updated frontend to use BT strengths for more efficient pair selection.

---

## 🗄️ **Database Schema (Supabase/PostgreSQL)**

### `songs`
- `id`: UUID (PK)
- `name`: Text
- `artist`: Text
- `album_id`: UUID (FK)
- `normalized_name`: Text (for matching)

### `sessions`
- `id`: UUID (PK)
- `user_id`: UUID (FK)
- `status`: Enum ('active', 'completed')
- `created_at`: Timestamp

### `comparisons`
- `id`: UUID (PK)
- `session_id`: UUID (FK)
- `song_a_id`: UUID (FK)
- `song_b_id`: UUID (FK)
- `winner_id`: UUID (FK, Nullable for Tie)
- `is_tie`: Boolean
- `created_at`: Timestamp

---

## 🎯 **Success Criteria**
1. **No Duplicates**: The user never sees the same song twice or "near-duplicates" in a single session.
2. **Snappy UX**: Duels feel instant; mathematical heavy lifting happens in the background.
3. **Statistical Integrity**: The final ranking reflects the Bradley-Terry model's probabilistic strengths.
