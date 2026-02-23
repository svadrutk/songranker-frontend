---
status: complete
priority: p1
issue_id: "002"
tags: [code-review, performance]
dependencies: []
---

# Problem Statement
Moving to an MPA has introduced a data fetching waterfall. `generateMetadata` fetches session data on the server, but the UI data is fetched again on the client via `useEffect` in `RankingWidget`.

# Findings
- `app/ranking/[id]/page.tsx`: Fetches data for metadata but passes nothing to `RankingWidget`.
- `RankingWidget.tsx`: Uses `useEffect` to fetch session data on mount, causing a delay and a redundant request.
- Users see a "Loading Ranking Data..." spinner even though the server already had the data.

# Proposed Solutions
1. **Initial Data Prop**: Fetch session data in the Server Component (`RankingPage`) and pass it as an `initialData` prop to `RankingWidget`.
2. **State Initialization**: Update `RankingWidget` to initialize its `songs`, `totalDuels`, and `convergence` state directly from `initialData`.
3. **Skip Redundant Fetch**: Update the `useEffect` in `RankingWidget` to skip the initial fetch if `initialData` is provided.

# Acceptance Criteria
- [x] `RankingWidget` renders immediately with data on the ranking page without showing a client-side loading spinner.
- [x] `getSessionDetail` is called only once on the server per request (deduplicated via `React.cache`).
- [x] Page navigation still works correctly for client-side transitions.

# Work Log
### 2026-02-21 - Issue Identified
**By:** Claude Code (performance-oracle)
Identified waterfall fetching in the new MPA route `/ranking/[id]`.

### 2026-02-21 - Resolved
**By:** Claude Code (pr-comment-resolver)
Implemented `initialData` prop in `RankingWidget` and passed it from the server component. Updated `RankingWidget` to initialize state from `initialData` and skip the initial client-side fetch.
