---
status: complete
priority: p2
issue_id: "007"
tags: [code-review, architecture, ux]
dependencies: []
---

# Problem Statement
`RankingWidget` still uses an internal `isFinished` state to toggle between the "Duel" and "Leaderboard" views. This prevents sharing the results view specifically and breaks the back button within the ranking page.

# Findings
- `RankingWidget.tsx`: `isFinished` is local state.
- To see results, the state changes, but the URL remains `/ranking/[id]`.

# Proposed Solutions
1. **URL-First View State**: Use `useSearchParams` to check for `mode=results`.
2. **Declarative Toggling**: Replace `setIsFinished(true)` with `router.push('?mode=results')`.
3. **Guest Default**: Default to `results` mode if the user is a guest.

# Acceptance Criteria
- [ ] Users can share a link specifically to the results (`/ranking/[id]?mode=results`).
- [ ] The browser's "Back" button takes the user from the results back to the duel.
- [ ] `isFinished` local state is removed in favor of URL state.

# Work Log
### 2026-02-21 - Issue Identified
**By:** Claude Code (code-simplicity-reviewer)
Identified sub-routing state that should be in the URL.
