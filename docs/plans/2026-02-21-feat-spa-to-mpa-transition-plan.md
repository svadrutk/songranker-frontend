---
title: "feat: Transition from SPA to MPA for SEO and deep linking"
type: feat
status: completed
date: 2026-02-21
---

# feat: Transition from SPA to MPA for SEO and deep linking

## Enhancement Summary

**Deepened on:** 2026-02-21
**Sections enhanced:** 6
**Research agents used:** Best Practices Researcher, Framework Docs Researcher, Architecture Strategist, Web Design Guidelines, Vercel React Best Practices

### Key Improvements
1.  **Next.js 16 Asynchronous APIs**: Incorporation of mandatory async `params` and `searchParams` for Next.js 16.
2.  **Streaming & Parallelism**: Implementation of `loading.tsx` and `React.cache()` to eliminate data waterfalls and provide instant loading states.
3.  **URL-First State Management**: Strategy to move shareable UI state (like `view=results`) from Zustand to URL search parameters for better deep linking.
4.  **Security & Guest Access**: Formalized "Read-Only" mode for shared rankings to support SEO without compromising private user data.

---

## Overview

This feature transforms the application from a Single Page Application (SPA) with state-based conditional rendering into a Multi-Page Application (MPA) using Next.js App Router. This change is essential for SEO (search engine optimization), deep linking (sharing specific rankings), and improved user navigation (browser back/forward support).

### Research Insights

**Best Practices:**
- **Streaming by Default**: Use `loading.tsx` skeletons for every new route to maintain the "instant" feel of the original SPA while reaping MPA benefits.
- **Semantic Landmarks**: Each new route will use `<main id="main-content">` and a clear `<h1>` for better accessibility and SEO indexing.

**Performance Considerations:**
- **Preconnect**: Add `<link rel="preconnect" href="[backend-url]">` in `layout.tsx` to reduce latency for the initial server-side data fetch on new page loads.

---

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

1.  **Routing Architecture**: Move view components from `app/page.tsx` into their respective `app/[route]/page.tsx` files.
2.  **Navigation Store Refactor**: Update `useNavigationStore` to synchronize with Next.js routing. Move `view` and `sessionId` to the URL.
3.  **Dynamic Metadata**: Use `generateMetadata` in `app/ranking/[id]/page.tsx` for social sharing.
4.  **Guest Access**: Modify `RankingWidget` to allow guests to view the `Leaderboard`.
5.  **Navbar Update**: Use Next.js `Link` components.

### Research Insights (Routing & State)

**Implementation Details:**
- **URL-First State**: Use query parameters (e.g., `?mode=results`) to toggle views within a page. This makes the specific state shareable.
- **Zustand Sync**: Retain Zustand *only* for non-URL state (e.g., sidebar collapse, transient UI states) or as a "Draft" cache for the `SessionBuilder`.

**Next.js 16 Specifics:**
- **Async Page Props**: Remember that `params` and `searchParams` are now **Promises** in Next.js 16.
```tsx
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // ...
}
```

---

## Technical Considerations

- **State Persistence**: Use Zustand `persist` for the `SessionBuilder` draft state.
- **Authentication**: Use Next.js Middleware (renamed to `proxy.ts` in Next.js 16) for route protection on `/my-rankings` and `/analytics`.
- **Server Components**: The main routes will be Server Components by default.

### Research Insights (Architecture)

**Best Practices:**
- **Eliminate Waterfalls**: Use `React.cache()` for data fetching in `lib/api.ts` so `generateMetadata` and the Page component can call the same function without redundant network requests.
- **Serialization**: Pass only minimal serializable data from Server Pages to Client Widgets (e.g., `sessionId` and `initialData` instead of full complex objects).

**Performance Considerations:**
- **Dynamic Imports**: Use `next/dynamic` for heavy route components like `AnalyticsPage` and `RankingWidget` to keep the initial landing page bundle small.
```tsx
const AnalyticsPage = dynamic(() => import('@/components/AnalyticsPage'), {
  loading: () => <Skeleton />,
  ssr: true
});
```

---

## Security & Access Control

### Research Insights

**Edge Cases:**
- **Guest "Read-Only" Mode**: If a guest accesses `/ranking/[id]`, the `RankingWidget` must automatically switch to `readOnly` mode, showing only the Leaderboard and disabling all ranking interactions (Duel, IDC, Tie).
- **Public/Private Toggle**: Sessions need a `is_public` boolean in the database. If `is_public` is false, guest access to `/ranking/[id]` should return a 404 or redirect to login.
- **Data Leakage**: Ensure the backend `GET /sessions/{id}` endpoint only returns public fields when accessed by a non-owner.

---

## Acceptance Criteria

- [x] All pages have a distinct URL path: `/`, `/review`, `/analytics`, `/my-rankings`.
- [x] Users can share a `/ranking/[id]?mode=results` link, and guests can view the results.
- [x] Browser "Back" and "Forward" buttons work correctly across all views.
- [x] Social sharing a `/ranking/[id]` link displays dynamic metadata with artist/playlist names.
- [x] Refreshing the page on any route keeps the user on that same route.
- [x] `Navbar` links are crawlable `<a>` tags (via `next/link`).
- [x] Accessibility: "Skip to main content" link added; H1 hierarchy maintained on all pages.

---

## Success Metrics

- [ ] Successful indexing of dynamic ranking pages by search engines.
- [ ] Increase in "Link Shared" events and guest sessions from shared links.
- [ ] LCP (Largest Contentful Paint) under 1.5s for the Ranking page due to SSR.

---

## MVP

### `app/ranking/[id]/page.tsx`
```tsx
import { Suspense } from "react";
import { RankingWidget } from "@/components/RankingWidget";
import { getSession } from "@/lib/api"; // Wrapped in React.cache
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const session = await getSession(id);
  return {
    title: `Ranking: ${session.name || "Music Ranking"} | Chorusboard`,
    description: `Check out the results for this ${session.artist_name || ""} ranking.`,
    openGraph: {
      images: [session.cover_url || "/logo/og-image.png"],
    },
  };
}

export default async function RankingPage({ params, searchParams }: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ mode?: string }>
}) {
  const { id } = await params;
  const { mode } = await searchParams;
  
  return (
    <Suspense fallback={<RankingSkeleton />}>
      <RankingWidget
        sessionId={id}
        initialMode={mode} // 'results' or 'duel'
      />
    </Suspense>
  );
}
```
