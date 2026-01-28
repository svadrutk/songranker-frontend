# Song Ranker - Technical Reference

**Last Updated**: January 19, 2026  
**Purpose**: Complete technical documentation for developers  
**Status**: ✅ **ACTIVE** - Phase 4 Integration Complete

---

## 🏗️ **System Architecture**

### **Repository Structure**

**This Repository (Frontend)**:
- Next.js application with App Router
- React components and UI
- Client-side logic and state management
- Location: https://github.com/svadrutk/songranker.git

**Backend Repository**:
- **Git Repository**: https://github.com/svadrutk/songranker-backend.git
- PostgreSQL database schema and migrations
- SQL functions and stored procedures
- Backend logic and database code
- **Database Host**: Supabase (https://loqddpjjjakaqgtuvoyn.supabase.co)
- **Note**: Backend work is developed in the git repository, deployed to Supabase, and tracked in this documentation. Git logs from backend repo can be analyzed to update documentation.

### **Overview**
Song Ranker uses a frontend/backend architecture. The Next.js frontend (this repository) connects to the backend repository's database (hosted on Supabase) for database operations.

### **Architecture Diagram**
```
User Browser
    ↓
Next.js App (Frontend - This Repo)
    https://github.com/svadrutk/songranker.git
    ↓
Supabase Client (lib/supabase.ts)
    ↓
Backend Repository → Supabase Database
    https://github.com/svadrutk/songranker-backend.git
    ↓
    https://loqddpjjjakaqgtuvoyn.supabase.co
```

### **Key Components**

**Frontend (This Repository)**:
- Next.js App Router with React components
- TypeScript for type safety
- Tailwind CSS for styling
- Supabase client for backend communication

**Backend (Supabase)**:
- PostgreSQL database
- SQL functions and stored procedures
- Database views and triggers
- Row Level Security (RLS) policies
- **Implementation**: All backend work done in Supabase SQL Editor
- **Documentation**: Tracked in this repository's key documentation

### **Release Type Categorization (Spotify)**

Since Spotify's API primarily returns `album`, `single`, and `compilation`, the backend implements custom logic to identify EPs and ensure consistent filtering in the frontend.

**EP Detection Logic**:
A release is categorized as an **EP** if any of the following are true:
1.  Spotify explicitly returns the type as `"ep"`.
2.  The `total_tracks` is between 4 and 7 (inclusive).
3.  The title contains "EP" keywords (e.g., `" - EP"`, `" (EP)"`).

Otherwise, the type is derived from Spotify's `album_type` (capitalized).

---

## 📁 **Code Organization**

### **File Structure**
```
Song Ranker/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout component
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── lib/                   # Utility libraries
│   ├── api.ts            # Backend API client
│   ├── elo.ts            # Frontend Elo calculations
│   ├── pairing.ts        # Duel pairing logic
│   ├── deduplication.ts  # Track cleaning & fuzzy matching
│   └── supabase.ts       # Supabase client singleton
├── public/                # Static assets
└── [config files]        # Next.js, TypeScript, ESLint configs
```

### **Key Files**

#### **`lib/api.ts`**
**Purpose**: Backend API client for session and song management.

**Key Operations**:
- `createSession(payload)`: Initialize a new ranking session.
- `getUserSessions(userId)`: List all past sessions for a user, including comparison counts.
- `getSessionDetail(sessionId)`: Fetch full session metadata, songs, total decisions made, and **convergence (0-100)**.
- `deleteSession(sessionId)`: Permanently remove a session and all associated data.
- `createComparison(sessionId, payload)`: Record a duel result. Returns updated Elos, **convergence**, and a **sync_queued** flag for background updates.

**API Reference**:

*   `POST /sessions`: Create session.
*   `GET /users/{user_id}/sessions`: List user sessions.
*   `GET /sessions/{session_id}`: Get session detail.
*   `DELETE /sessions/{session_id}`: Delete session.
*   `GET /sessions/{session_id}/songs`: Get songs in session.
*   `POST /sessions/{session_id}/comparisons`: Record a comparison.

#### **`lib/supabase.ts`**

**Purpose**: Supabase client configuration and singleton instance

**Key Features**:
- Creates Supabase client with environment variables
- Validates required environment variables
- Exports singleton instance for use throughout app

**Usage**:
```typescript
import { supabase } from '@/lib/supabase'

// Use supabase client for database operations
const { data, error } = await supabase
  .from('table_name')
  .select('*')
```

**Environment Variables Required**:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon public key

---

## 🔌 **API Reference**

### **Supabase Client API**

The Supabase client is accessed via `lib/supabase.ts`:

```typescript
import { supabase } from '@/lib/supabase'
```

**Common Operations**:

#### **Select Data**
```typescript
const { data, error } = await supabase
  .from('table_name')
  .select('*')
```

#### **Insert Data**
```typescript
const { data, error } = await supabase
  .from('table_name')
  .insert([{ column: 'value' }])
```

#### **Update Data**
```typescript
const { data, error } = await supabase
  .from('table_name')
  .update({ column: 'new_value' })
  .eq('id', 1)
```

#### **Delete Data**
```typescript
const { data, error } = await supabase
  .from('table_name')
  .delete()
  .eq('id', 1)
```

---

## 🔗 **Integration Guide**

### **Supabase Integration**

#### **Setup**
1. Create Supabase project at https://supabase.com
2. Get project URL and anon key from Settings → API
3. Add to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Import and use client:
   ```typescript
   import { supabase } from '@/lib/supabase'
   ```

#### **Current Configuration**
- **URL**: https://loqddpjjjakaqgtuvoyn.supabase.co
- **Client**: Configured in `lib/supabase.ts`
- **Security**: Uses anon key (respects Row Level Security)

#### **Best Practices**
- Always check for errors after Supabase operations
- Use TypeScript types for table schemas
- Implement proper error handling
- Use RLS policies for data security

---

## 🛠️ **Development Setup**

### **Prerequisites**
- Node.js 20+ (check with `node --version`)
- npm (comes with Node.js)
- Git

### **Installation Steps**

1. **Clone Repository**:
   ```bash
   git clone https://github.com/svadrutk/songranker.git
   cd songranker
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**:
   Create `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://loqddpjjjakaqgtuvoyn.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

5. **Open Browser**:
   Navigate to http://localhost:3000

### **Available Scripts**

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

### **Environment Variables**

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key | Yes |

**Note**: All environment variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

---

## 💻 **Code Examples**

### **Supabase Client Usage**

#### **Basic Query**
```typescript
import { supabase } from '@/lib/supabase'

async function getTracks() {
  const { data, error } = await supabase
    .from('tracks')
    .select('*')
    .limit(10)
  
  if (error) {
    console.error('Error fetching tracks:', error)
    return []
  }
  
  return data
}
```

#### **Error Handling Pattern**
```typescript
const { data, error } = await supabase
  .from('table_name')
  .select('*')

if (error) {
  // Handle error
  console.error('Supabase error:', error)
  return
}

// Use data
console.log('Data:', data)
```

#### **Type-Safe Queries** (Future)
```typescript
// Define types for your tables
interface Track {
  id: string
  name: string
  artist: string
  // ... other fields
}

// Use with Supabase
const { data, error } = await supabase
  .from('tracks')
  .select('*')
  .returns<Track[]>()
```

---

## 🔧 **Configuration Files**

### **`next.config.ts`**
Next.js configuration. Currently using default settings.

### **`tsconfig.json`**
TypeScript configuration with Next.js recommended settings.

### **`tailwind.config.js`** (if exists)
Tailwind CSS configuration. Using Tailwind 4 with PostCSS.

### **`eslint.config.mjs`**
ESLint configuration with Next.js recommended rules.

---

## 📚 **Technology Stack Details**

### **Next.js 16.1.3**
- **App Router**: Modern routing with file-based system
- **Server Components**: Default React Server Components
- **Client Components**: Use `'use client'` directive when needed

### **React 19.2.3**
- Latest React version
- Server Components support
- Improved performance

### **TypeScript 5**
- Strict type checking
- Better IDE support
- Compile-time error detection

### **Tailwind CSS 4**
- Utility-first CSS framework
- PostCSS integration
- JIT compilation

### **Supabase**
- PostgreSQL database
- Real-time subscriptions
- Row Level Security (RLS)
- Built-in authentication (if needed)

---

## 🚀 **Deployment Considerations**

### **Environment Variables**
- Ensure all `NEXT_PUBLIC_` variables are set in deployment platform
- Never commit `.env.local` to git (already in `.gitignore`)

### **Build Process**
- Run `npm run build` to test production build locally
- Check for build errors before deploying

### **Supabase Configuration**
- Verify RLS policies are set correctly
- Test database connections in production environment

---

## 📐 **Theoretical Concepts**

This section documents the theoretical foundations and algorithms used in the Song Ranker project.

---

### **Bradley-Terry Model for Music Preference Sorting**

The Bradley-Terry model is the core ranking algorithm for this project. It's specifically designed to infer a complete ranking from pairwise comparisons, making it perfect for music preference sorting. Instead of asking users to rank all songs at once (overwhelming with 50-200 items), we present two songs at a time and build up a probabilistic strength model.

**Reference**: [Wikipedia - Bradley-Terry Model](https://en.wikipedia.org/wiki/Bradley%E2%80%93Terry_model)

#### **How It Works**

Each song gets assigned a strength parameter \(p_i\), and when a user chooses song \(i\) over song \(j\), we observe that \(i\) "won" that comparison. The model estimates the probability that users prefer song \(i\) to song \(j\) as:

\[ \Pr(i \text{ beats } j) = \frac{p_i}{p_i + p_j} \]

After collecting multiple comparisons, we use maximum likelihood estimation to find the optimal strength values for all songs, then rank them by their estimated \(p_i\) values.

**Reference**: [DRatings - Creating a Ratings Model with Bradley-Terry](https://www.dratings.com/creating-a-ratings-model-with-bradley-terry/)

#### **Implementation Strategy**

**Data Collection**: Each time a user picks a song, record it as \(w_{ij} = 1\) (song \(i\) beat song \(j\)). For ties, we can either skip recording or use a Bradley-Terry extension that handles draws.

**Reference**: [CRAN - BradleyTerry2 Package](https://cran.r-project.org/web/packages/BradleyTerry2/vignettes/BradleyTerry.html)

**Adaptive Questioning**: We don't need all \(n(n-1)/2\) possible comparisons. Start with a random sample, then strategically select pairs where the model is most uncertain (songs with similar estimated \(p_i\) values). This minimizes comparisons while maximizing information gain.

**Reference**: [DRatings - Creating a Ratings Model with Bradley-Terry](https://www.dratings.com/creating-a-ratings-model-with-bradley-terry/)

**Parameter Estimation**: Use iterative algorithms like MM (minorization-maximization) or Newton-Raphson to solve for the strength parameters. The log-likelihood function we're maximizing is based on observed wins and losses across all comparisons.

**Reference**: [Emergent Mind - Bradley-Terry Ranking System](https://www.emergentmind.com/topics/bradley-terry-ranking-system)

**Handling Contradictions**: Bradley-Terry naturally handles inconsistent choices because it's probabilistic. If a user picks song A over B once but B over A later, the model treats these as statistical observations rather than absolute rules, weighting the more frequent choice.

**Reference**: [James Howard - Bradley-Terry Model and Data-Driven Ranking](https://jameshoward.us/2025/01/31/bradley-terry-model-and-data-driven-ranking)

#### **Completion Criteria**

**Minimum Comparisons**: We need at least \(n-1\) comparisons to connect all items in a preference graph, but practical convergence typically requires \(O(n \log n)\) comparisons.

**Reference**: [DRatings - Creating a Ratings Model with Bradley-Terry](https://www.dratings.com/creating-a-ratings-model-with-bradley-terry/)

**Confidence Threshold**: Stop when the standard errors of parameter estimates fall below a threshold, or when the ranking order stops changing between iterations. Calculate this by monitoring the Fisher information matrix during estimation.

**Reference**: [Emergent Mind - Bradley-Terry Ranking System](https://www.emergentmind.com/topics/bradley-terry-ranking-system)

**Progress Tracking**: Display progress as `comparisons_made / estimated_total`, where estimated total is based on current model uncertainty. Update this dynamically as high-certainty songs require fewer future comparisons.

#### **Advantages for Project Requirements**

The Bradley-Terry approach excels at:
- **Handling incomplete comparison graphs**: Users can refresh mid-session and resume without breaking the model
- **Non-transitive preferences**: Resolved by finding the maximum likelihood ranking that best explains all observations (e.g., A>B, B>C, C>A)
- **Confidence scores**: Provides confidence scores for each ranking position by examining standard errors of estimated parameters (perfect for stretch goal)
- **Probabilistic nature**: Treats user choices as statistical observations, naturally handling contradictions

**Reference**: [James Howard - Bradley-Terry Model and Data-Driven Ranking](https://jameshoward.us/2025/01/31/bradley-terry-model-and-data-driven-ranking)

---

### **Seamless Sync Architecture**

To maintain a high-performance UI while utilizing sophisticated backend ranking models, the application uses a "Seamless Sync" pattern.

1.  **Optimistic Frontend**: Every duel choice immediately updates a local Elo rating ($K=32$) for instant visual feedback.
2.  **Background Reconciliation**: After every 10 duels (or when the backend worker finishes a cycle), the `createComparison` API returns `sync_queued: true`.
3.  **Silent Refresh**: The frontend waits 1 second for worker overhead and then fetches `getSessionDetail` in the background.
4.  **State Merge**: The local `songs` state is updated with official `bt_strength` and `local_elo` from the backend, ensuring the frontend never drifts far from the "source of truth."

---

## 🔄 **Hybrid SQL/TypeScript Framework**

This project uses a hybrid approach: **SQL for data operations, TypeScript for algorithms**. This framework balances performance, maintainability, and development speed.

### **Core Principle**

**SQL for data, TypeScript for logic**

- **SQL**: Data queries, aggregations, filtering, joins
- **TypeScript**: Complex algorithms, iterative calculations, business logic

---

### **Decision Matrix**

| Task | Use | Why |
|------|-----|-----|
| Fetch comparison data | SQL | Fast aggregation, minimal data transfer |
| Filter songs by dataset | SQL | Database-level filtering |
| Count comparisons | SQL | Simple aggregation |
| Bradley-Terry MM algorithm | TypeScript | Iterative, easier to debug |
| Parameter estimation | TypeScript | Complex math, better tooling |
| Pair selection logic | TypeScript | Business logic, uncertainty calculations |
| Confidence calculations | TypeScript | Statistical computations |
| Save rankings | SQL | Simple insert/upsert |

---

### **Architecture Pattern**

```
┌─────────────────────────────────────────┐
│         TypeScript Layer                │
│  (Algorithms, Business Logic)           │
│                                         │
│  • Bradley-Terry MM Algorithm          │
│  • Pair Selection Strategy              │
│  • Confidence Calculations             │
│  • Progress Tracking                    │
└──────────────┬──────────────────────────┘
               │
               │ Calls
               │
┌──────────────▼──────────────────────────┐
│      Supabase Client Library            │
│      (TypeScript Wrapper)               │
└──────────────┬──────────────────────────┘
               │
               │ Translates to
               │
┌──────────────▼──────────────────────────┐
│         SQL Layer                       │
│  (Data Operations)                      │
│                                         │
│  • SELECT queries                       │
│  • Aggregations (COUNT, SUM, etc.)      │
│  • Views for common queries             │
│  • INSERT/UPDATE operations             │
└─────────────────────────────────────────┘
```

---

### **Implementation Guidelines**

#### **1. Data Fetching (SQL via Supabase Client)**

```typescript
// ✅ GOOD: Use SQL for data aggregation
const { data } = await supabase
  .from('comparisons')
  .select(`
    item_a_id,
    item_b_id,
    preference,
    count:comparisons.count()
  `)
  .eq('session_id', sessionId)
  .group('item_a_id, item_b_id, preference')

// ❌ BAD: Fetching all data to process in TypeScript
const { data: allComparisons } = await supabase
  .from('comparisons')
  .select('*')
  .eq('session_id', sessionId)
// Then aggregating in TypeScript - inefficient
```

#### **2. Algorithm Implementation (TypeScript)**

```typescript
// ✅ GOOD: Complex algorithm in TypeScript
function estimateBradleyTerryStrengths(
  comparisons: ComparisonData[],
  options: EstimationOptions
): StrengthResult[] {
  // MM algorithm implementation
  // Iterative calculations
  // Statistical computations
}

// ❌ BAD: Trying to implement MM algorithm in SQL
// Too complex, hard to debug, inflexible
```

#### **3. Hybrid Flow Example**

```typescript
// Step 1: SQL - Fetch aggregated data
async function getComparisonStats(sessionId: string) {
  const { data } = await supabase
    .from('comparisons')
    .select(`
      item_a_id,
      item_b_id,
      preference,
      count:comparisons.count()
    `)
    .eq('session_id', sessionId)
    .group('item_a_id, item_b_id, preference')
  
  return data
}

// Step 2: TypeScript - Run algorithm
async function calculateRankings(sessionId: string) {
  // Fetch data via SQL
  const stats = await getComparisonStats(sessionId)
  
  // Process in TypeScript
  const rankings = estimateBradleyTerryStrengths(stats, {
    maxIterations: 100,
    tolerance: 0.0001
  })
  
  // Save results via SQL
  await supabase
    .from('rankings')
    .upsert(rankings.map(r => ({
      session_id: sessionId,
      song_id: r.songId,
      score: r.strength,
      rank: r.rank,
      confidence: r.confidence
    })))
  
  return rankings
}
```

---

### **File Organization**

```
lib/
├── supabase.ts              # Supabase client setup
├── data/                    # SQL queries (via Supabase client)
│   ├── comparisons.ts      # Comparison data queries
│   ├── songs.ts            # Song catalog queries
│   └── sessions.ts         # Session queries
├── rankings/                # TypeScript algorithms
│   ├── bradley-terry.ts    # MM algorithm implementation
│   ├── pair-selection.ts   # Adaptive pair selection
│   └── confidence.ts       # Confidence calculations
└── utils/                   # Shared utilities
```

---

### **When to Use SQL Views**

Create SQL views for frequently-used query patterns:

```sql
-- View for comparison statistics
CREATE VIEW comparison_stats AS
SELECT 
  session_id,
  item_a_id,
  item_b_id,
  COUNT(*) FILTER (WHERE preference = 'A') as wins_a,
  COUNT(*) FILTER (WHERE preference = 'B') as wins_b
FROM comparisons
GROUP BY session_id, item_a_id, item_b_id;
```

Then query the view:
```typescript
const { data } = await supabase
  .from('comparison_stats')
  .select('*')
  .eq('session_id', sessionId)
```

---

### **Performance Considerations**

- **SQL**: Use for operations that benefit from database indexing and aggregation
- **TypeScript**: Use for operations that require complex logic or iteration
- **Data Transfer**: Minimize by aggregating in SQL before fetching
- **Caching**: Consider caching computed rankings in database (rankings table)

---

### **Best Practices**

1. ✅ **Aggregate in SQL**: Use GROUP BY, COUNT, SUM in SQL queries
2. ✅ **Algorithm in TypeScript**: Keep complex logic in TypeScript
3. ✅ **Type Safety**: Use TypeScript types for all data structures
4. ✅ **Error Handling**: Check for errors after every Supabase operation
5. ✅ **Views for Reuse**: Create SQL views for common query patterns
6. ❌ **Avoid**: Complex iterative algorithms in SQL stored procedures
7. ❌ **Avoid**: Fetching all data to process in TypeScript

---

## 📝 **Development Notes**

### **Current Implementation**
- Basic Next.js setup complete
- Supabase client configured
- Bradley-Terry model selected as core ranking algorithm
- Ready for feature development

### **Future Considerations**
- Database schema design (optimized for Bradley-Terry data collection)
- API route implementation for ranking calculations
- Parameter estimation algorithm implementation (MM or Newton-Raphson)
- Adaptive pair selection strategy
- Confidence score calculation

---

**Document Status**: ✅ **CURRENT** - Technical reference maintained  
**Last Updated**: January 19, 2026  
**Next Update**: When code architecture changes or new integrations added
