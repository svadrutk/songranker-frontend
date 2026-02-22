---
title: "feat: Playlist-First & Multi-Artist Session Builder"
type: feat
status: completed
date: 2026-02-20
---

# feat: Playlist-First & Multi-Artist Session Builder (Deepened)

## Overview
This feature replaces the current sidebar-constrained "Catalog" with a flexible, full-screen "Session Builder." Users can assemble a ranking session by mixing multiple sources: Spotify/Apple Music playlists and multiple manual artist/album selections. The navigation architecture is refactored to treat "Create" as a primary top-level view.

## Problem Statement / Motivation
The current system only allows users to rank one artist at a time, and the "Catalog" view has a lot of unutilized space. Users frequently want to rank custom collections (e.g., "Top 50 Pop Hits" or "Best of Radiohead + Muse"). The transition to a full-screen builder reclaims space and enables a more powerful "shopping cart" workflow.

## Proposed Solution

### 1. Navigation Architecture Refactor
- **Sidebar Removal**: The current sidebar-based "Navigator" is removed entirely. The application transitions to a full-screen layout for all views.
- **Navbar as Primary Hub**: The `Navbar` becomes the central navigation hub. It will be updated to include primary links: **Create**, **My Rankings**, and **Analytics**.
- **View Transitions**: `app/page.tsx` is simplified to remove the `motion.aside` and `isSidebarCollapsed` logic, allowing the `main` content area to occupy 100% of the viewport.

### 2. Unified Smart Search
- **URL Detection**: Real-time regex to identify Spotify/Apple Music links.
- **Visual Feedback**: Change search icon to a "Link" icon when a URL is detected.
- **Autofocus**: The search bar automatically focuses upon entering the "Create" view.
- **Keyboard UX**: Support `Tab` to select/autocomplete suggestions and `Enter` to submit.

### 3. Session Builder Canvas (Draft List)
- **Source-Based Assembly**: A full-width grid displaying cards for each added source (e.g., "Radiohead Discography", "Summer 2024 Playlist").
- **Multi-Source Logic**: Users can add multiple artists and playlists to the same draft.
- **Inline Selector**: Searching an artist displays their releases below the search bar; users toggle specific releases and click "Add to Session" to create a source card.

### 4. Review & Clean Step (Deduplication)
- **Pre-Creation Review**: A dedicated step (Stage 2 of the builder) where the user reviews the combined song list before the session is created.
- **Manual Review**: Identified duplicates are highlighted, allowing users to confirm merges manually (updating existing logic to support multi-source overlaps).

## Technical Considerations

### Data Model (`RankingSource`) - Discriminated Union
```typescript
export type SourceType = 'artist_all' | 'artist_partial' | 'playlist' | 'manual';

export interface BaseSource {
  id: string;
  name: string;
  coverUrl?: string;
  songCount: number;
  status: 'pending' | 'loading' | 'ready' | 'error';
  progress?: number; // 0-100 for imports
}

export interface ArtistAllSource extends BaseSource {
  type: 'artist_all';
  artistName: string;
  data: { artistId: string }; // MBID
}

export interface ArtistPartialSource extends BaseSource {
  type: 'artist_partial';
  artistName: string;
  data: { 
    artistId: string;
    selectedReleaseIds: string[]; // MBIDs
  };
}

export interface PlaylistSource extends BaseSource {
  type: 'playlist';
  data: {
    platform: 'spotify' | 'apple';
    playlistId: string;
    cachedTracks?: any[]; 
  };
}

export type RankingSource = ArtistAllSource | ArtistPartialSource | PlaylistSource;
```

### Performance & Scaling
- **Web Workers**: For sessions >200 songs, move the O(n²) fuzzy matching (deduplication) to a Web Worker to prevent UI freezing.
- **Virtualization**: Use `react-window` or `TanStack Virtual` for the "Review & Clean" list (when count > 100).
- **CSS Optimization**: Apply `content-visibility: auto` to list items to reduce layout/paint overhead.
- **Memoization**: Use `React.memo` for `SongItem` components during bulk selection/deduplication.

### Store Updates
- `useSessionBuilderStore`: Tracks `sources: RankingSource[]`, `currentDraftId: string`, and `status: 'empty' | 'building' | 'reviewing'`.
- Persistence: Use Zustand's `persist` middleware with `localStorage`, including a `version` and `migrate` function.

## Acceptance Criteria
- [x] Navbar contains distinct links for "Create", "My Rankings", and "Analytics".
- [x] Sidebar is completely removed from all views.
- [x] Unified search bar correctly identifies Spotify/Apple Music playlist links via regex.
- [x] Users can add multiple artists and multiple playlists to a single session.
- [x] Playlist imports show a determinate progress bar ("Finding tracks: 45/100").
- [x] Session Builder canvas displays rich cards for each added source with a "Remove" option.
- [x] "Start Ranking" triggers a "Review & Clean" step (manual deduplication).
- [x] Soft-cap warning appears if the total song count exceeds 150.
- [x] The "Draft" is saved to `localStorage` and persists across page refreshes.

## Success Metrics
- Increase in multi-artist ranking sessions.
- Reduced time-to-start for users with a playlist link.
- 100% of content area utilized for the Session Canvas and Analytics.

## Dependencies & Risks
- **External APIs**: Relies on `/imports/playlist` (backend) and Apple Music/Spotify/MusicBrainz for artist discographies.
- **Spotify API Changes**: Feb 2026 "Authorization Code" flow required for playlist imports.
- **Deduplication Performance**: Large sessions (200+ songs) require Web Worker offloading for responsiveness.

## UX Best Practices (Research-Backed)
- **Unified Search**: Copy active autocomplete suggestions to the field on `Tab` (Baymard).
- **Staging Area**: Use a "Source Canvas" as a persistent staging area for assembly tasks.
- **Progress Feedback**: Use determinate progress bars for tasks > 5s (playlist imports).

## Implementation Phases

### Phase 1: Store & Global Navigation
- [x] Create `useSessionBuilderStore` with persistence and schema migration.
- [x] Update `NavigationStore` and `Navbar` for the new global navigation structure.
- [x] Remove `motion.aside` (sidebar) and related layout logic from `app/page.tsx`.
- [x] Scaffold `SessionBuilder.tsx` as a full-screen view.

### Phase 2: Unified Search & Source Cards
- [x] Implement `UnifiedSearchBar.tsx` with URL detection and paste-to-import.
- [x] Implement `SourceCard.tsx` with loading/progress states.
- [x] Build the "Quick Start" dashboard empty state.

### Phase 3: Inline Selection & Multi-Source
- [x] Refactor `ReleaseList.tsx` into an "Inline Selection" mode.
- [x] Logic for merging individual release selections into an `ArtistPartialSource`.

### Phase 4: Review & Launch
- [x] Build the "Review & Clean" step as a dedicated view in the builder.
- [x] Implement virtualization (`react-window`) and Web Worker deduplication.
- [x] Implement the soft-cap warning UI.

