# Dashboard: Existing Data & How to Display It

**Last Updated**: January 2026  
**Purpose**: Document what data we already have and how to show it on the dashboard (beyond global rankings).

---

## 📊 Data We Already Have

### 1. **User sessions** (from `GET /users/{user_id}/sessions`)

**Source**: `getUserSessions(userId)` → `SessionSummary[]`

| Field | Type | Description |
|-------|------|-------------|
| `session_id` | string | UUID |
| `created_at` | string | ISO timestamp |
| `primary_artist` | string | Main artist for that session |
| `song_count` | number | Songs in session |
| `comparison_count` | number | Comparisons made |
| `convergence_score` | number | 0–100 (completion %) |
| `top_album_covers` | string[] | Cover URLs for thumbnails |

**Derivable on the frontend (no new API)**:
- **Total sessions** = `sessions.length`
- **Total comparisons** = `sessions.reduce((s, x) => s + x.comparison_count, 0)`
- **Artists you’ve ranked** = `[...new Set(sessions.map(s => s.primary_artist).filter(Boolean))]`
- **Average convergence** = `sessions.reduce((s, x) => s + (x.convergence_score ?? 0), 0) / sessions.length`
- **Completed sessions** = `sessions.filter(s => (s.convergence_score ?? 0) >= 90).length`
- **Completion rate** = completed / total * 100

**Where it’s used today**: “My Rankings” tab shows `SessionSelector` (list of sessions). No aggregate “your activity” summary.

---

### 2. **Global leaderboard (per artist)** (from `GET /leaderboard/{artist}`)

**Source**: `getGlobalLeaderboard(artist)` → `LeaderboardResponse`

| Field | Type | Description |
|-------|------|-------------|
| `artist` | string | Artist name |
| `songs` | LeaderboardSong[] | Ranked songs with rank, name, album, cover, scores |
| `total_comparisons` | number | Processed comparisons in ranking |
| `pending_comparisons` | number | Not yet in ranking |
| `last_updated` | string \| null | Last global update time |

**Where it’s used today**: “Global” tab — user types artist name, then sees that artist’s global leaderboard.

---

### 3. **Leaderboard stats (per artist)** (from `GET /leaderboard/{artist}/stats`)

**Source**: `getLeaderboardStats(artist)` → `LeaderboardStats`

| Field | Type | Description |
|-------|------|-------------|
| `artist` | string | Artist name |
| `total_comparisons` | number | Processed |
| `pending_comparisons` | number | Pending |
| `last_updated` | string \| null | Last update |

**Where it’s used today**: To decide whether to fetch full leaderboard; not shown as dashboard stats.

---

### 4. **Backend-only (no public API yet)**

- **`artist_stats` table**: One row per artist with a global ranking: `artist`, `total_comparisons_count`, `last_global_update_at`.
- **List of artists with leaderboards**: Not exposed. Needed so the dashboard can show “Artists with global rankings” (e.g. “Taylor Swift – 5,231 comparisons”) and link to the Global tab.

---

## 🎯 How to Display It on the Dashboard

### Current dashboard (Catalog)

- **Search**: Search catalog, select albums, start ranking.
- **My Rankings**: List of user sessions (`SessionSelector`); click to open session.
- **Global**: Type artist → see that artist’s global leaderboard only.

So today the “dashboard” is really: search, your sessions list, and a single-artist global view. There is no overview of “your activity” or “platform/community” data.

---

### Proposed: Add a “Dashboard” (Overview) View

**Option A – New 4th tab “Dashboard”**  
**Option B – Overview panel above the existing three tabs (Search | My Rankings | Global)**

Either way, two blocks:

---

#### Block 1: **Your activity** (when logged in)

Uses **only existing data**: `getUserSessions(user.id)` (already loaded for “My Rankings”).

| Metric | Source | Example |
|--------|--------|--------|
| Total sessions | `sessions.length` | 12 |
| Total comparisons | Sum of `comparison_count` | 340 |
| Artists ranked | Unique `primary_artist` | 5 |
| Avg. convergence | Mean of `convergence_score` | 78% |
| Completed sessions | `convergence_score >= 90` | 8 |
| Completion rate | completed / total | 67% |

Display: small stat cards or a compact summary (e.g. “12 sessions · 340 comparisons · 5 artists · 67% completed”).

---

#### Block 2: **Community / global rankings**

**Requires one new backend endpoint**: list artists that have global leaderboards (from `artist_stats`), with comparison counts.

**New API**: e.g. `GET /leaderboard/artists` or `GET /dashboard/artists`

**Response** (concept):

```json
{
  "artists": [
    { "artist": "Taylor Swift", "total_comparisons": 5231, "last_updated": "2026-01-28T12:00:00Z" },
    { "artist": "The Beatles", "total_comparisons": 3100, "last_updated": "2026-01-27T18:00:00Z" }
  ]
}
```

**Display**: List or grid of “Artists with global rankings” (name + comparison count). Click → switch to Global tab and call `getGlobalLeaderboard(artist)` (existing) so the user sees that artist’s leaderboard.

---

## ✅ Implementation checklist

1. **Backend**
   - [ ] In `supabase_db`: add method to fetch all (or top N) `artist_stats` rows (e.g. order by `total_comparisons_count` desc, limit 50).
   - [ ] New endpoint: `GET /leaderboard/artists` (or `/dashboard/artists`) returning list of artists with `total_comparisons` and `last_updated`.
2. **Frontend**
   - [ ] Add API helper: e.g. `getArtistsWithLeaderboards()` calling that endpoint.
   - [ ] Add “Dashboard” or “Overview” section that:
     - **Your activity**: Derives and shows the metrics above from existing `getUserSessions` data (same data as My Rankings).
     - **Community**: Fetches artist list from new endpoint; renders list; click → set Global tab and selected artist, then load leaderboard with existing `getGlobalLeaderboard(artist)`.
3. **UX**
   - [ ] Decide: 4th tab “Dashboard” vs overview panel above Search | My Rankings | Global.
   - [ ] Ensure “Your activity” only renders when user is logged in and sessions are loaded.

---

## 📋 Summary

| Data | Already have? | Where | Use on dashboard |
|------|----------------|--------|------------------|
| User sessions (list) | ✅ Yes | `getUserSessions` | Your activity: sessions, comparisons, artists, convergence, completion rate |
| Global leaderboard (one artist) | ✅ Yes | `getGlobalLeaderboard(artist)` | Already in Global tab |
| Leaderboard stats (one artist) | ✅ Yes | `getLeaderboardStats(artist)` | Optional: show before loading full leaderboard |
| **List of artists with leaderboards** | ❌ No | Need `GET /leaderboard/artists` | Community block: “Artists with global rankings” + link to Global |

Once the new endpoint and dashboard block are in place, the dashboard will show both “your” data (from existing APIs) and “platform” data (from the new artists list), alongside the existing global rankings view.
