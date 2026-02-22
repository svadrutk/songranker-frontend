---
status: complete
priority: p2
issue_id: "004"
tags: [code-review, security, privacy]
dependencies: []
---

# Problem Statement
The `getSessionDetail` API returns the entire `comparisons` history array to any user who can view the session. This may expose more data than intended to guest users.

# Findings
- `lib/api.ts`: `SessionDetail` type includes `comparisons?: ComparisonPair[]`.
- Guests viewing a shared ranking link receive the full history of every duel decision the owner made.

# Proposed Solutions
1. **Backend Filtering**: Update the backend to omit the `comparisons` field for requests that are not authenticated as the session owner.
2. **Data Minimization**: The frontend results view only needs the final `songs` array with their calculated scores/ranks.

# Acceptance Criteria
- [x] Guests viewing `/ranking/[id]` do not receive the full `comparisons` array in the API response.
- [x] The Leaderboard still functions correctly for guests using only the `songs` data.

# Work Log
### 2026-02-21 - Issue Identified
**By:** Claude Code (security-sentinel)
Identified over-exposure of comparison history to guest users.

### 2026-02-21 - Frontend Data Minimization Implemented
**By:** Claude Code
- Updated `getSessionDetail` in `lib/api.ts` to strip `comparisons` by default.
- Updated `RankingWidget.tsx` to only request `comparisons` if a user is logged in.
- Ensured `RankingWidget` handles missing `comparisons` by falling back to `song.comparison_count`.
- Updated `useSessionDetail` hook to support options.
