# Global Dashboard: Visualization Ideas

**Last Updated**: January 2026  
**Purpose**: Ideas for charts and visualizations on the global dashboard, based on existing APIs and Supabase tables.

---

## 1. Global Leaderboard & Data Overview

### What the global leaderboard is

- **Per-artist ranking**: For a given artist (e.g. "Taylor Swift"), the platform aggregates pairwise comparisons from *all* user sessions and computes a **global Elo** and **Bradley–Terry strength** for each song.
- **API**: `GET /leaderboard/{artist}?limit=100` → `LeaderboardResponse`.
- **Where it’s used**: "Global" tab — user searches an artist, then sees that artist’s global top songs (rank, cover, name, album). Dashboard overview lists "Artists with global rankings" (from `GET /leaderboard/artists`) and links to the Global tab.

### LeaderboardResponse shape (from `lib/api.ts`)

| Field | Type | Description |
|-------|------|-------------|
| `artist` | string | Artist name |
| `songs` | LeaderboardSong[] | Ranked songs (see below) |
| `total_comparisons` | number | Processed comparisons in ranking |
| `pending_comparisons` | number | Not yet processed |
| `last_updated` | string \| null | Last global update (ISO) |

**LeaderboardSong** (each item in `songs`):

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Song UUID |
| `name` | string | Song title |
| `artist` | string | Artist name |
| `album` | string \| null | Album name |
| `album_art_url` | string \| null | Cover URL |
| `global_elo` | number | Global Elo rating |
| `global_bt_strength` | number | Bradley–Terry strength |
| `global_votes_count` | number | Total comparisons this song was in |
| `rank` | number | 1-based rank |

Other relevant types:

- **LeaderboardStats** (`GET /leaderboard/{artist}/stats`): `artist`, `total_comparisons`, `pending_comparisons`, `last_updated`.
- **ArtistWithLeaderboard** (from `GET /leaderboard/artists`): `artist`, `total_comparisons`, `last_updated`.
- **SessionSummary** (from `GET /users/{user_id}/sessions`): `session_id`, `created_at`, `primary_artist`, `song_count`, `comparison_count`, `convergence_score`, `top_album_covers`.

---

## 2. Supabase Tables (Relevant to Global Dashboard)

Tables inferred from backend code and SQL migrations.

| Table | Key columns | Purpose |
|-------|-------------|---------|
| **songs** | `id`, `name`, `artist`, `album`, `cover_url`, `normalized_name`, `global_elo`, `global_bt_strength`, `global_votes_count` | Catalog + global ranking fields |
| **artist_stats** | `artist` (PK), `last_global_update_at`, `total_comparisons_count`, `created_at` | One row per artist with a global leaderboard; used for "artists with leaderboards" list |
| **comparisons** | `session_id`, `song_a_id`, `song_b_id`, `winner_id`, `is_tie`, `decision_time_ms` | Each duel; aggregated for global Elo/BT |
| **sessions** | `id`, `status`, `user_id`, `created_at`, `convergence_score`, `last_active_at` | Ranking sessions |
| **session_songs** | `session_id`, `song_id`, `local_elo`, `bt_strength` | Songs in a session + per-session Elo |
| **rankings** | `user_id`, `release_id`, … | User-level rankings (less relevant to *global* leaderboard) |
| **feedback** | `message`, `user_id`, `user_agent`, `url` | Feedback/bugs (not for viz) |

**RPCs** (from migrations / backend):

- `get_artist_comparisons(p_artist)` — all comparisons for an artist (song_a_id, song_b_id, winner_id, is_tie, decision_time_ms).
- `get_artist_songs(p_artist)` — all songs for an artist with global_elo, global_bt_strength, global_votes_count.

**Note**: Frontend only has access to data exposed by the backend API. The table list is for understanding what *could* be aggregated in new endpoints if needed.

---

## 3. Visualization Ideas

### 3.1 Using existing APIs only (no backend changes)

| Idea | Data source | Where | Description |
|------|-------------|--------|-------------|
| **Elo distribution (single artist)** | `getGlobalLeaderboard(artist)` → `songs[].global_elo` | Global tab (when one artist is selected) | Histogram or bar chart of Elo values (e.g. bins 1200–1300, 1300–1400, …). Shows spread of ratings. |
| **Votes per song (single artist)** | Same → `songs[].global_votes_count` | Global tab | Bar chart: song name (or rank) vs `global_votes_count`. Highlights how much data each song has. |
| **Rank vs Elo curve** | Same → `songs[].rank`, `songs[].global_elo` | Global tab | Line or scatter: x = rank, y = global_elo. Shows how Elo drops with rank. |
| **Rank vs votes** | Same → `songs[].rank`, `songs[].global_votes_count` | Global tab | Scatter: rank vs votes. Can reveal “controversial” songs (high votes but mid rank). |
| **Top 20 by album (waffle)** | Same → `songs[].album`, `songs[].rank`, `songs[].name` (top 20) | Global tab | Waffle chart: 20 cells (one per song), colored by album; rank 1–3 cells have gold/silver/bronze borders and show rank number. Legend lists albums. Implemented: `TopAlbumsWaffleChart.tsx`. |
| **Comparisons per artist (platform)** | `getArtistsWithLeaderboards()` → `artists[].total_comparisons`, `artist` | Dashboard | Bar chart: artist name vs total_comparisons. Top N artists by activity. |
| **Your activity: sessions over time** | `getUserSessions(userId)` → `created_at` | Dashboard | Line or area: count of sessions per day/week. Requires parsing `created_at` and grouping. |
| **Your activity: comparisons per session** | Same → `comparison_count` per session | Dashboard | Bar chart: session (e.g. date or primary_artist) vs comparison_count. |
| **Your activity: convergence distribution** | Same → `convergence_score` | Dashboard | Histogram of convergence_score (0–100). Shows how “complete” sessions tend to be. |
| **Your activity: artists ranked** | Same → `primary_artist` | Dashboard | Simple bar or list: count of sessions per artist (or unique artists as a single stat, already present). |

### 3.2 Possible backend additions (new endpoints or fields)

| Idea | Data needed | Backend change | Description |
|------|-------------|----------------|-------------|
| **Platform comparisons over time** | Comparisons or sessions aggregated by day | New endpoint e.g. `GET /stats/activity?granularity=day` returning time series | Line chart: total comparisons (or sessions) per day. |
| **Artist leaderboard “last updated” timeline** | `artist_stats.last_global_update_at` | Already in `ArtistWithLeaderboard.last_updated` | Small timeline or “last updated” badges per artist on dashboard. |
| **Pending vs processed (per artist)** | Already in `LeaderboardResponse` / `LeaderboardStats` | None | Stacked bar or two numbers: processed vs pending comparisons for selected artist (could sit next to existing stats in Global tab). |
| **Decision time (avg per session or artist)** | `comparisons.decision_time_ms` | New endpoint e.g. avg decision time per session or per artist | Histogram or single KPI: “Avg time per duel” — engagement/speed metric. |
| **Top songs by votes across all artists** | Aggregate `songs.global_votes_count` across artists | New endpoint (heavy query) | “Most compared songs” — likely need limit (e.g. top 20) and caching. |

### 3.3 UI placement suggestions

- **Dashboard tab (overview)**  
  - Your activity: sessions over time, comparisons per session, convergence distribution, artists ranked (bars or stats).  
  - Community: bar chart of comparisons per artist (from `getArtistsWithLeaderboards`), optional “last updated” hints.  

- **Global tab (single-artist view)**  
  - Keep current ranked list as primary.  
  - Add a small “Insights” or “Charts” section (tabs or accordion):  
    - Elo distribution (histogram).  
    - Votes per song (bars).  
    - Rank vs Elo (line) and/or Rank vs votes (scatter).  
  - Optionally: processed vs pending comparisons (stacked bar or two numbers).

### 3.4 Implementation notes

- **Charts**: Use **Plotly** via `react-plotly.js` for all dashboard charts (bar, line, scatter, histogram). Plotly provides built-in tooltips, zoom/pan, and config-driven figures.
- **Performance**: For “top N” charts (e.g. top 20 songs by Elo or votes), use existing `limit` or slice on the client; for platform-wide time series, prefer a dedicated aggregated endpoint.
- **Empty states**: Handle “no sessions”, “no artists with leaderboards”, “no songs” so charts don’t break and show a short message instead.
- **Responsiveness**: Prefer simple charts (single series, few bars) for mobile; hide or simplify secondary charts on small screens.

### 3.5 Chart library: Plotly (decision)

**Chosen library: Plotly** via `react-plotly.js` and `plotly.js`. All dashboard charts (bar, line, scatter, histogram) will use Plotly. The frontend defines `--chart-1` … `--chart-5` in `globals.css`; use these in `layout` (e.g. `layout.paper_bgcolor`, `layout.font`, trace colors) for theming.

**Interactive visualizations are feasible** with Plotly and the existing API data. No backend changes are required for interactivity. Possible interactions:

| Interaction | Description | Example use |
|-------------|-------------|-------------|
| **Tooltips on hover** | Plotly’s default hover shows trace values; use `hovertemplate` for custom text (song name, Elo, votes). | All bar/line/scatter charts — e.g. “Song X: Elo 1420, 47 votes”. |
| **Click to highlight / filter** | Use `Plotly.click` (or `onClick` in react-plotly.js) to read point index/id; update React state (e.g. `selectedSongId`) and re-pass to layout (e.g. `selectedpoints`) or highlight in the ranked list. | Click a song in “Votes per song” → highlight same song in the ranked list or in “Rank vs Elo”. |
| **Cross-chart linking** | Shared state (e.g. `selectedSongId`); pass to multiple `<Plot>` components and to the ranked list so selection stays in sync. | Global tab: selecting a bar in the Elo histogram highlights that song in the rank list and in the scatter. |
| **Zoom/pan** | Built into Plotly (mode bar); enable for time series (sessions over time, platform activity). | Zoom into a date range on “sessions over time”. |
| **Brush / range select** | Use `Plotly.selecting` or range sliders (`layout.xaxis.rangeslider`) where appropriate. | e.g. Select an Elo range in the distribution → filter or highlight songs in a table. |
| **Drill-down** | On click, update route or state (e.g. navigate to Global tab for selected artist). | Dashboard: click an artist in “comparisons per artist” → navigate to Global tab for that artist. |

**Implementation notes for Plotly:**

- **Packages**: `react-plotly.js` (React wrapper) and `plotly.js` (peer). Install: `npm install react-plotly.js plotly.js`.
- **Next.js / SSR**: Plotly uses `window`; load the chart component with `next/dynamic` and `ssr: false` to avoid hydration errors (e.g. wrap `<Plot>` in a client-only container).
- **State**: Hold “selected” id (song, artist, or session) in parent state or context; pass into `layout` (e.g. `uirevision`, `selectedpoints`) and to the ranked list so both reflect the same selection.
- **Accessibility**: Plotly’s mode bar and tooltips are DOM-based; ensure keyboard access and focus visibility where needed.

**Summary:** Plotly is the chart library for this dashboard. Use `react-plotly.js` with shared state for tooltips, click-to-highlight, and cross-chart linking; the existing API responses contain all needed ids and fields (e.g. `songs[].id`, `rank`, `global_elo`) to wire this up.

### 3.6 Where to start with Plotly

**First chart: “Comparisons per artist” (Dashboard)**  
- **Data:** Already in `DashboardOverview.tsx` — `artistsWithLeaderboards` from `getArtistsWithLeaderboards(50)` (each item has `artist`, `total_comparisons`).  
- **Chart type:** Bar chart — x = artist name, y = total_comparisons.  
- **Place:** In the “Artists with global rankings” section: show the chart above (or beside) the existing artist list when `artistsWithLeaderboards.length > 0`.

**Steps:**

1. **Client-only Plot wrapper**  
   Plotly uses `window`; it must not run during SSR. Create a small wrapper that dynamic-imports `react-plotly.js` and renders `<Plot>` only on the client (e.g. `components/charts/PlotlyChart.tsx` using `next/dynamic` with `ssr: false`, or dynamic-import the Plot component inside the wrapper).

2. **First chart component**  
   Create `components/charts/ComparisonsPerArtistChart.tsx` that:
   - Accepts `artists: ArtistWithLeaderboard[]` (and optionally `onSelectArtist?: (artist: string) => void` for click → navigate to Global tab).
   - Builds Plotly `data`: one trace, type `bar`, `x`: artist names, `y`: total_comparisons.
   - Sets `layout` (title, axis labels, height, optional `paper_bgcolor` / `font.color` from CSS vars `--chart-*` / theme).
   - Renders the client-only Plot wrapper with that data/layout.

3. **Wire into Dashboard**  
   In `DashboardOverview.tsx`, in the “Artists with global rankings” section (when not loading and `artistsWithLeaderboards.length > 0`), render the chart above the list. Load the chart component with `next/dynamic(..., { ssr: false })` so the Plotly bundle is client-only.

4. **Empty state**  
   When `artistsWithLeaderboards.length === 0`, keep the existing “No global rankings yet” message; don’t render the chart.

**Next charts (after this one works):**  
- **Global tab:** When an artist is selected, add an “Insights” block with Elo distribution (histogram from `songs[].global_elo`), votes per song (bar), rank vs Elo (line/scatter). Data from `getGlobalLeaderboard(artist)` already in `Catalog.tsx` / Global leaderboard flow.  
- **Dashboard “Your activity”:** Sessions over time (line), comparisons per session (bar), convergence distribution (histogram) from `getUserSessions(userId)` in `DashboardOverview`.

---

## 4. Summary Table

| Visualization | Data source | Backend change? | Priority suggestion |
|---------------|-------------|-----------------|----------------------|
| Elo distribution (per artist) | LeaderboardResponse.songs | No | High — immediate value in Global tab |
| Votes per song (per artist) | LeaderboardResponse.songs | No | High |
| Rank vs Elo (per artist) | LeaderboardResponse.songs | No | Medium |
| Comparisons per artist (platform) | getArtistsWithLeaderboards | No | High — fits dashboard “community” block |
| Your sessions over time | getUserSessions | No | Medium |
| Your convergence distribution | getUserSessions | No | Medium |
| Processed vs pending (per artist) | LeaderboardResponse / Stats | No | Low — can stay as numbers |
| Platform activity over time | — | Yes (new endpoint) | Low / later |
| Decision time metrics | — | Yes (new endpoint) | Low / later |

---

## 5. Data Pull Results & Feasibility (Jan 2026)

Supabase was queried via `songranker-backend/scripts/inspect_supabase_data.py`. Current snapshot:

| Table          | Row count | Notes |
|----------------|-----------|--------|
| **songs**      | 608       | Columns present: `global_elo`, `global_bt_strength`, `global_votes_count`, `cover_url`, `album`. |
| **artist_stats** | 8       | Top artists by comparisons: Lana Del Rey (369), Demi Lovato (213), Ariana Grande (121), Lorde (50), The Killers (5). |
| **comparisons** | 1,076    | `decision_time_ms` present and populated in sample. |
| **sessions**   | 20        | `convergence_score`, `created_at`, `user_id` present. |
| **session_songs** | 598   | Links sessions to songs with local_elo. |
| **feedback**   | 1         | Not used for viz. |
| **rankings**   | —         | Table not in schema (optional/legacy). |

RPCs verified: `get_artist_songs`, `get_artist_comparisons`, `get_user_session_summaries` all return expected columns.

### Feasibility verdict

| Visualization | Feasible? | Notes |
|---------------|-----------|--------|
| **Elo distribution (per artist)** | ✅ Yes | `LeaderboardResponse.songs[].global_elo` from existing API. |
| **Votes per song (per artist)** | ✅ Yes | `songs[].global_votes_count` in same response. |
| **Rank vs Elo (per artist)** | ✅ Yes | `rank` + `global_elo` from leaderboard response. |
| **Rank vs votes** | ✅ Yes | `rank` + `global_votes_count`. |
| **Comparisons per artist (platform)** | ✅ Yes | `getArtistsWithLeaderboards()` → 8 artists with `total_comparisons`. |
| **Your sessions over time** | ✅ Yes | `getUserSessions(userId)` → `created_at` (RPC `out_created_at`). |
| **Your comparisons per session** | ✅ Yes | `comparison_count` in session summaries. |
| **Your convergence distribution** | ✅ Yes | `convergence_score` in session summaries. |
| **Your artists ranked** | ✅ Yes | `primary_artist` in session summaries. |
| **Processed vs pending (per artist)** | ✅ Yes | Already in `LeaderboardResponse` / `LeaderboardStats`. |
| **Last updated (per artist)** | ✅ Yes | `ArtistWithLeaderboard.last_updated`. |
| **Platform activity over time** | ⚠️ New endpoint | Data exists (comparisons, sessions); needs `GET /stats/activity?granularity=day`. |
| **Decision time metrics** | ⚠️ New endpoint | `comparisons.decision_time_ms` present; needs aggregation endpoint. |
| **Top songs by votes (all artists)** | ⚠️ New endpoint | `songs.global_votes_count` exists; heavy query + caching recommended. |

**Summary:** All “existing APIs only” ideas are feasible with current Supabase data and backend. Ideas requiring new endpoints (platform activity over time, decision time, top songs by votes) are feasible once those endpoints are added.

---

## 6. References

- **API types**: `songranker-frontend/lib/api.ts` — `LeaderboardResponse`, `LeaderboardSong`, `LeaderboardStats`, `ArtistWithLeaderboard`, `SessionSummary`.
- **Dashboard UI**: `songranker-frontend/components/DashboardOverview.tsx` — stat cards and list of artists with leaderboards.
- **Global leaderboard UI**: `songranker-frontend/components/GlobalLeaderboard.tsx` — ranked list and stats bar.
- **Backend leaderboard**: `songranker-backend/app/api/v1/leaderboard.py` — endpoints and response shapes.
- **DB layer**: `songranker-backend/app/clients/supabase_db.py` — tables and RPCs used.
- **Migrations**: `songranker-backend/supabase_global_leaderboard.sql`, `supabase_updates.sql`.
- **Data overview**: `songranker-frontend/key_documentation/DASHBOARD_DATA_AND_DISPLAY.md`.
- **Data inspection script**: `songranker-backend/scripts/inspect_supabase_data.py` — run from backend: `uv run python scripts/inspect_supabase_data.py`.
