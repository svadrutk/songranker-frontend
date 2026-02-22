---
title: "feat: Transition from SPA to MPA for SEO and deep linking"
type: feat
status: active
date: 2026-02-21
---

# feat: Transition from SPA to MPA for SEO and deep linking

## Overview

This feature transforms the application from a Single Page Application (SPA) with state-based conditional rendering into a Multi-Page Application (MPA) using Next.js App Router. This change is essential for SEO (search engine optimization), deep linking (sharing specific rankings), and improved user navigation (browser back/forward support).

## Problem Statement / Motivation

Currently, the entire application lives on the home route (`/`). A Zustand `view` state determines whether the user sees the `SessionBuilder`, `ReviewView`, `AnalyticsPage`, `MyRankingsOverview`, or `RankingWidget`. This results in:
1. **No SEO**: Search engines only see the home page content.
2. **No Deep Linking**: Users cannot share their ranking results with a unique URL.
3. **Broken Browser History**: Refreshing the page resets the view to the initial state (unless persisted), and the "Back" button doesn't work as expected.
4. **Poor Shared Experience**: Guests cannot view ranking results directly via a link.

## Proposed Solution

Map each internal `view` state to a dedicated Next.js route:

| Current View | Proposed Route | Component | SEO Role |
| :--- | :--- | :--- | :--- |
| `create` | `/` | `SessionBuilder` | Primary Landing |
| `review` | `/review` | `ReviewView` | - |
| `ranking` | `/ranking/[id]` | `RankingWidget` | Shareable Results |
| `analytics` | `/analytics` | `AnalyticsPage` | Stats/Insights |
| `my_rankings` | `/my-rankings` | `MyRankingsOverview` | User Dashboard |

### Key Changes

1. **Routing Architecture**: Move view components from `app/page.tsx` into their respective `app/[route]/page.tsx` files.
2. **Navigation Store Refactor**: Update `useNavigationStore` to synchronize with Next.js routing or replace its navigation actions with `useRouter()` and `Link`.
3. **Dynamic Metadata**: Use `generateMetadata` in `app/ranking/[id]/page.tsx` to provide dynamic social sharing titles (e.g., "Ranking: [Artist Name] on Chorusboard").
4. **Guest Access**: Modify `RankingWidget` to allow guests to view the `Leaderboard` (read-only) for shared links.
5. **Navbar Update**: Use Next.js `Link` components instead of state-based buttons.

## Technical Considerations

- **State Persistence**: Ensure the `SessionBuilder` draft state survives the transition to the `/review` page using Zustand `persist`.
- **Authentication**: Routes like `/my-rankings` and `/analytics` should redirect to the home page (with an auth modal triggered) if the user is not logged in.
- **Middleware**: Potentially use Next.js Middleware for simple route protection.
- **Client Components**: The main `page.tsx` will become a Server Component (by default), and the `SessionBuilder` will be its primary child.

## Acceptance Criteria

- [ ] All pages have a distinct URL path: `/`, `/review`, `/analytics`, `/my-rankings`.
- [ ] Users can share a `/ranking/[id]` link, and guests can view the results.
- [ ] Browser "Back" and "Forward" buttons work correctly across all views.
- [ ] Social sharing a `/ranking/[id]` link displays dynamic metadata (title/description).
- [ ] Refreshing the page on any route keeps the user on that same route.
- [ ] `Navbar` links are crawlable `<a>` tags (via `next/link`).

## Success Metrics

- [ ] Successful indexing of dynamic ranking pages by search engines.
- [ ] Increase in "Link Shared" events and guest sessions from shared links.
- [ ] Reduced "View Reset" errors reported by users.

## Dependencies & Risks

- **Next.js 16 App Router**: Requires strict adherence to server/client component boundaries.
- **Supabase Auth**: Ensure auth state is correctly checked on both client and server for route protection.
- **Zustand Hydration**: Ensure store persistence is handled correctly during route transitions to avoid flickering.

## References & Research

- **Current Implementation**: `app/page.tsx` (conditional renderer).
- **Navigation Store**: `lib/stores/navigation-store.ts`.
- **Navbar**: `components/Navbar.tsx`.
- **Best Practices**: Next.js App Router Documentation (Routing, Metadata).

## MVP

### `app/analytics/page.tsx`
```tsx
import { AnalyticsPage } from "@/components/AnalyticsPage";

export default function Analytics() {
  return (
    <div className="flex flex-col min-h-0 h-full w-full overflow-hidden px-4 md:px-8">
      <AnalyticsPage isSidebarCollapsed={true} />
    </div>
  );
}
```

### `app/ranking/[id]/page.tsx`
```tsx
import { RankingWidget } from "@/components/RankingWidget";
import { getSession } from "@/lib/api"; // Need to ensure server-side compatible

export async function generateMetadata({ params }: { params: { id: string } }) {
  const session = await getSession(params.id);
  return {
    title: `Ranking: ${session.name || "Music Ranking"}`,
    description: `Check out the results for this ranking on Chorusboard.`,
  };
}

export default function Ranking({ params }: { params: { id: string } }) {
  return (
    <RankingWidget
      isRanking={true}
      sessionId={params.id}
    />
  );
}
```
