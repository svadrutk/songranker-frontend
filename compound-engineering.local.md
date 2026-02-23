---
review_agents: [kieran-typescript-reviewer, code-simplicity-reviewer, security-sentinel, performance-oracle, architecture-strategist]
plan_review_agents: [kieran-typescript-reviewer, code-simplicity-reviewer]
---

# Review Context

Chorusboard is a Next.js 16 (App Router) application with React 19.
Key focus areas for this PR:
- SPA to MPA transition logic
- Next.js 16 async params/searchParams usage
- SEO metadata implementation
- Guest read-only access logic
- Performance optimizations (React.cache, Suspense)
