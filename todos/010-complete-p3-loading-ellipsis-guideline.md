---
status: complete
priority: p3
issue_id: "010"
tags: [code-review, ux]
dependencies: []
---

# Problem Statement
Loading states use three dots `...` instead of the guideline-compliant horizontal ellipsis `…`.

# Findings
- `app/ranking/[id]/page.tsx` and other loading skeletons use `"Loading..."`.

# Proposed Solutions
1. **Update Ellipsis**: Replace all instances of `...` with `…` in user-facing loading text.

# Acceptance Criteria
- [ ] Loading text follows Web Interface Guidelines.

# Work Log
### 2026-02-21 - Issue Identified
**By:** Claude Code (web-design-guidelines)
Identified non-compliant ellipsis usage.
