---
status: complete
priority: p1
issue_id: "001"
tags: [code-review, security]
dependencies: []
---

# Problem Statement
The `createComparison` and `undoLastComparison` functions in `lib/api.ts` lack authentication headers. This allows any guest to programmatically modify any user's ranking session if they know the session ID.

# Findings
- `lib/api.ts`: The `fetchBackend` function does not include an `Authorization` header.
- `createComparison` and `undoLastComparison` (Lines 283-298) use `fetchBackend` for POST/DELETE operations without passing any user token.
- Guest access to `/ranking/[id]` allows them to trigger these API calls if the UI didn't restrict them, but even with UI restrictions, the API endpoint is open.

# Proposed Solutions
1. **Token Inclusion**: Update `fetchBackend` to retrieve the Supabase session token using `supabase.auth.getSession()` and include it in the `Authorization` header.
2. **Backend Validation**: Ensure the backend validates that the user ID in the JWT matches the owner of the session.
3. **Defense-in-Depth**: Explicitly disable `handleChoice` and `handleUndo` callbacks in `RankingWidget.tsx` if `!user`.

# Acceptance Criteria
- [ ] API calls to modify rankings include a valid JWT.
- [ ] Unauthorized attempts to modify rankings return a 401/403 error.
- [ ] Guest users cannot trigger ranking modifications via the UI or direct API calls.

# Work Log
### 2026-02-21 - Issue Identified
**By:** Claude Code (security-sentinel)
Identified missing auth headers in `lib/api.ts` during SPA-to-MPA review.
