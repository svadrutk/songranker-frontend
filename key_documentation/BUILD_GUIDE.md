# Song Ranker - Build Guide

**Last Updated**: January 2026  
**Purpose**: Step-by-step guide explaining how Song Ranker was built  
**Status**: ✅ **ACTIVE**

---

## 📋 **Project Overview**

**Song Ranker** (rebranded as **Chorusboard**) is a web application that ranks songs through pairwise comparisons. Users select songs from Spotify/MusicBrainz, deduplicate them, then make head-to-head choices to generate a personalized ranking.

**Key Innovation**: Hybrid ranking system using **Elo** (frontend) for instant feedback and **Bradley-Terry Model** (backend) for statistical accuracy.

---

## 🏗️ **Architecture Summary**

### **Two-Repository Structure**
- **Frontend** (`songranker-frontend`): Next.js 16, TypeScript, React 19, Tailwind CSS 4
- **Backend** (`songranker-backend`): FastAPI (Python), Supabase PostgreSQL, Redis/RQ workers

### **Data Flow**
```
User → Next.js Frontend → FastAPI Backend → Supabase Database
                                    ↓
                            Redis Worker Queue
                            (Bradley-Terry calculations)
```

---

## 📅 **Step-by-Step Build Process**

### **Phase 0: Foundation (January 2025)**

**What Was Done**:
1. Initialized Next.js 16 project with TypeScript
2. Set up Supabase connection (`lib/supabase.ts`)
3. Configured Tailwind CSS 4 and shadcn/ui components
4. Established documentation structure (`key_documentation/`)

**Key Files Created**:
- `app/layout.tsx` - Root layout with theme provider
- `app/page.tsx` - Main page component
- `lib/supabase.ts` - Supabase client singleton

**Technology Decisions**:
- Chose **Bradley-Terry Model** over simpler alternatives for statistical rigor
- Selected **Hybrid SQL/TypeScript** approach: SQL for data, TypeScript for algorithms

---

### **Phase 1: Deduplication & Review (Frontend)**

**Problem**: Users select songs from multiple albums/releases, creating duplicates like "Song Name", "Song Name (Remastered)", "Song Name - Live".

**Solution Implemented**:
1. **Normalization** (`lib/deduplication.ts`):
   - Strip metadata: "Remastered", "Live", "Instrumental", "Demo", etc.
   - Remove punctuation and normalize whitespace
   - Create `normalized_name` for comparison

2. **Fuzzy Matching**:
   - Use Levenshtein distance for similarity scoring
   - Group songs with similarity > 85% as potential duplicates
   - Calculate confidence scores for each match

3. **Review UI** (`components/DeduplicationModal.tsx`):
   - Display grouped duplicates before session starts
   - Allow users to "Merge" or "Keep Both"
   - Use array indices (not strings) to prevent accidental removal of all instances

**Key Learning**: Index-based tracking prevents data loss when same song appears in multiple releases.

---

### **Phase 2: Session & Data Persistence (Backend)**

**What Was Done**:
1. **Database Schema** (Supabase):
   - `sessions` table: UUID, user_id, status, created_at
   - `songs` table: UUID, name, artist, album_id, normalized_name
   - `comparisons` table: UUID, session_id, song_a_id, song_b_id, winner_id, is_tie

2. **FastAPI Backend** (`songranker-backend/app/`):
   - `POST /sessions`: Create session with deduplicated song list
   - `GET /sessions/{id}`: Fetch session with songs and metadata
   - `POST /sessions/{id}/comparisons`: Record duel results
   - Background task: Deep fuzzy matching using `RapidFuzz` library

3. **API Client** (`lib/api.ts`):
   - TypeScript functions wrapping FastAPI endpoints
   - Error handling and type safety

**Architecture Decision**: Backend handles heavy deduplication asynchronously while frontend provides immediate feedback.

---

### **Phase 3: Ranking Loop & Elo (Frontend)**

**Problem**: Need instant visual feedback when users make choices, but also want statistical accuracy.

**Solution: Hybrid Elo + Bradley-Terry**:

1. **Frontend Elo** (`lib/elo.ts`):
   - Starting rating: 1500
   - K-factor: 32 (standard for head-to-head)
   - Optimistic updates: Calculate new ratings immediately on choice
   - Display ratings on hover in `RankingCard`

2. **Pairing Strategy** (`lib/pairing.ts`):
   - Select pairs with similar Elo ratings (maximize information gain)
   - Fallback to random if ratings are too spread out
   - Later enhanced to use Bradley-Terry strengths when available

3. **Ranking Widget** (`components/RankingWidget.tsx`):
   - Duel interface: Two `RankingCard` components side-by-side
   - Actions: Click song to choose, "Tie" button, "Skip" button
   - Keyboard shortcuts: Arrow keys for navigation
   - Real-time Elo updates visible on cards

**UX Innovation**: Optimistic UI updates make the app feel instant, even though backend validation happens asynchronously.

---

### **Phase 4: Session Management & UI Refinement**

**What Was Done**:
1. **Session Selector** (`components/SessionSelector.tsx`):
   - Fetch user's past sessions via `GET /users/{user_id}/sessions`
   - Display session metadata: comparison count, date, status
   - Allow resuming or deleting sessions

2. **Catalog Component** (`components/Catalog.tsx`):
   - Search artists/albums via MusicBrainz API (backend proxy)
   - View toggle: "Search" vs "My Sessions"
   - Loading states and error handling

3. **Animated Sidebar** (`app/page.tsx`):
   - Collapsible sidebar using `framer-motion`
   - Auto-collapse when ranking session starts
   - Manual toggle for flexibility

4. **Local Caching**:
   - `localStorage` for session list (SWR pattern)
   - Instant load from cache, background refresh from API

**UX Decision**: Collapse sidebar during duels to maximize focus on ranking task.

---

### **Phase 5: Results & Polish**

**What Was Done**:
1. **Winner Animations** (`components/RankingCard.tsx`):
   - Scale-up animation when song wins
   - Trophy icon overlay
   - Primary color flash effect
   - 600ms delay before next pair (let animation play)

2. **Smooth Transitions**:
   - `AnimatePresence` for card entry/exit
   - Directional slides and blur effects
   - Prevents jarring state changes

3. **Deletion UX**:
   - Custom `DeleteConfirmationModal` (replaces browser `confirm()`)
   - High-fidelity design with `framer-motion`
   - Better accessibility (no nested buttons)

4. **VS Button Refinement**:
   - Removed italic style (was visually off-center)
   - Larger circle (h-16 w-16) with thicker border
   - Clean, static design (removed distracting animations)

**Design Philosophy**: Every interaction should feel polished and intentional.

---

### **Phase 6: Bradley-Terry & Model Sync (Backend)**

**Problem**: Elo is fast but not statistically rigorous. Need a "source of truth" ranking.

**Solution: Background Bradley-Terry Calculation**:

1. **Backend Implementation** (`songranker-backend/app/tasks.py`):
   - **MM Algorithm** (Minorization-Maximization) for parameter estimation
   - Runs in Redis/RQ worker queue (non-blocking)
   - Calculates strength parameters ($p_i$) for each song
   - Updates every 10-15 comparisons

2. **Convergence Tracking**:
   - Calculate convergence score (0-100%) based on model stability
   - Return in API response: `convergence_score` field
   - Frontend displays progress bar

3. **Seamless Sync** (`components/RankingWidget.tsx`):
   - After each comparison, check if `sync_queued: true`
   - Poll session detail with exponential backoff (0ms, 400ms, 800ms, 1.5s, 2.5s)
   - Merge BT strengths into local state without disrupting active pair
   - Recalibrate Elo ratings to match BT ordering

4. **Adaptive Pairing Enhancement**:
   - Update `lib/pairing.ts` to prefer BT strengths over Elo when available
   - Select pairs with similar BT strengths for maximum information gain

**Key Innovation**: "Seamless Sync" pattern - background statistical updates don't interrupt user flow.

---

### **Phase 7: Social Sharing & Visuals**

**What Was Done**:
1. **Share Card Generation** (`components/ShareVisual.tsx`):
   - Use `html-to-image` library to render component as PNG
   - Vertical format (1080x1920) optimized for Instagram Stories
   - Large artwork for #1 song, numbered list for 2-10

2. **Sharing API Integration**:
   - Web Share API for native mobile sharing
   - PNG download fallback for desktop
   - `canvas-confetti` celebration on card generation

3. **Leaderboard View** (`components/Leaderboard.tsx`):
   - Display top 10 songs sorted by BT strength
   - Show strength percentage or Elo rating
   - "Finish" button appears after 15 duels (early termination option)

**Growth Strategy**: Shareable visuals encourage organic social sharing (like Spotify Wrapped).

---

### **Phase 8: Global Rankings & Analytics (In Progress)**

**What Was Done** (as of January 2026):
1. **Global Leaderboard** (`components/GlobalLeaderboard.tsx`):
   - Aggregate rankings across all user sessions
   - `GET /leaderboard/{artist}` endpoint
   - Redis caching (2-minute TTL)

2. **Background Updates**:
   - Batch processing every 10 minutes per artist
   - Prevents database overload
   - `artist_stats` table for aggregated data

**Future Enhancements**: Analytics dashboard, trend tracking, comparison insights.

---

## 🔧 **Technical Implementation Details**

### **Frontend Stack**
- **Next.js 16.1.3**: App Router, Server Components
- **React 19.2.3**: Latest React with improved performance
- **TypeScript 5**: Type safety throughout
- **Tailwind CSS 4**: Utility-first styling
- **Framer Motion**: Smooth animations
- **Supabase Client**: Database operations

### **Backend Stack**
- **FastAPI**: Python web framework with automatic OpenAPI docs
- **Supabase**: PostgreSQL database with Row Level Security
- **Redis + RQ**: Background job queue for ranking calculations
- **RapidFuzz**: Fast fuzzy string matching
- **NumPy**: Mathematical computations for Bradley-Terry

### **Key Algorithms**

1. **Elo Rating System**:
   ```
   New Rating = Old Rating + K × (Actual - Expected)
   Expected = 1 / (1 + 10^((Opponent Rating - Your Rating) / 400))
   ```

2. **Bradley-Terry Model**:
   ```
   P(i beats j) = p_i / (p_i + p_j)
   ```
   - Uses MM algorithm to estimate strength parameters
   - Iterative until convergence (typically <100 iterations)

3. **Fuzzy Matching**:
   - Levenshtein distance for similarity
   - Normalization: strip metadata, punctuation
   - Confidence threshold: 85% similarity

---

## 📊 **Data Flow Example**

**User Journey**:
1. User searches "Taylor Swift" in `Catalog.tsx`
2. Selects multiple albums → songs collected
3. `DeduplicationModal` shows potential duplicates → user merges
4. `POST /sessions` creates session → backend stores in Supabase
5. `RankingWidget` starts duel loop:
   - Select pair with similar Elo/BT strengths
   - User clicks song A → optimistic Elo update
   - `POST /sessions/{id}/comparisons` records choice
   - Backend queues Bradley-Terry calculation
   - Frontend polls for updated convergence
   - Merge BT strengths into local state
6. After 90% convergence → "View Results" button appears
7. `Leaderboard` shows final ranking
8. `ShareVisual` generates social card

---

## 🎯 **Key Design Decisions**

1. **Hybrid Ranking**: Elo for speed, Bradley-Terry for accuracy
2. **Optimistic UI**: Update immediately, validate in background
3. **Index-Based Deduplication**: Prevent data loss from string matching
4. **Seamless Sync**: Background updates don't interrupt user flow
5. **Adaptive Pairing**: Maximize information gain per comparison
6. **Progressive Enhancement**: Works without JavaScript (basic), enhanced with JS

---

## 📝 **Documentation Status**

### **Up to Date** ✅
- `PROJECT_PLAN.md`: Current phase and roadmap
- `DEVELOPMENT_LOG.md`: Recent decisions and issues
- `TECHNICAL_REFERENCE.md`: Architecture and API details

### **Needs Update** 🚧
- `songranker-backend/docs/API.md`: Still shows "Planned" status (backend is FastAPI, not SQL functions)
- `songranker-backend/docs/SCHEMA.md`: Schema is implemented but not documented here

**Note**: Backend documentation in `songranker-backend/docs/` was created as templates but the actual implementation uses FastAPI endpoints, not SQL functions. The real backend is documented in `songranker-backend/README.md`.

---

## 🚀 **How to Build This Project**

### **Prerequisites**
- Node.js 20+
- Python 3.13+
- Redis (for background workers)
- Supabase account

### **Frontend Setup**
```bash
cd songranker-frontend
npm install
cp .env.example .env.local  # Add Supabase credentials
npm run dev
```

### **Backend Setup**
```bash
cd songranker-backend
uv venv
source .venv/bin/activate
uv pip install -e .
# Set environment variables (Supabase, Redis, etc.)
uvicorn app.main:app --reload
# In separate terminal:
python worker.py  # Start RQ worker
```

### **Database Setup**
- Run SQL migrations in Supabase dashboard
- Configure Row Level Security policies
- Set up Redis for job queue

---

## 📚 **References**

- **Bradley-Terry Model**: [Wikipedia](https://en.wikipedia.org/wiki/Bradley%E2%80%93Terry_model)
- **Elo Rating System**: Standard chess rating algorithm
- **FastAPI**: [Official Docs](https://fastapi.tiangolo.com/)
- **Next.js**: [Official Docs](https://nextjs.org/docs)

---

**Last Updated**: January 2026  
**Status**: Core features complete, global rankings in progress
