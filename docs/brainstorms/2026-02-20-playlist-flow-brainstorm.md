# Brainstorm: Playlist-First & Multi-Artist Session Builder

**Date:** 2026-02-20
**Status:** Decided
**Topic:** Re-designing the frontend search/selection flow to prioritize playlists and multi-artist sessions.

## 1. What We're Building
A new primary "Create" view that replaces the current artist-only Catalog. This view enables a "shopping cart" style workflow where users can assemble a ranking session from multiple sources: Spotify playlists, Apple Music playlists, and multiple manual artist/album selections.

### Core Features
- **Smart Unified Search**: A large, centered input field that handles URL detection (Playlist links) and text-based artist suggestions.
- **Source Canvas**: A layout that manages "Sources" (Playlist/Artist cards) instead of just a flat list of songs.
- **Multi-Artist Support**: Ability to search for Artist A, add their albums, and then search for Artist B and add theirs to the same session.
- **Action-Oriented Dashboard**: A landing state with "Quick Start" tiles to guide the user toward pasting a link or searching.

## 2. Why This Approach?
- **User Intent**: Many users want to rank "My Top 100 Songs" or "Best of the 90s" rather than just "Radiohead's discography."
- **Efficiency**: Pasting a playlist link is the fastest way to start a session.
- **Scale**: Reclaiming the "Catalog" space for a full-screen "Builder" canvas solves the visual imbalance of the previous UI.

## 3. The UX Flow
1. **Landing**: User arrives at the "Create" view. They see a large search bar and three "Quick Start" tiles: "Paste Spotify/Apple Music Link," "Search Artists," and "Resume Recent Draft."
2. **Input**: 
   - **If URL**: The system fetches playlist metadata (via `/imports/playlist`) and adds a "Playlist Card" to the canvas.
   - **If Text**: "Inline" search results appear. User toggles albums for that artist. Once happy, they click "Add to Session," and an "Artist Card" is added to the canvas.
3. **Assembly**: The user can repeat the input step multiple times. The "Session Builder" canvas shows all added sources.
4. **Launch**: A prominent "Start Ranking (X Songs)" button becomes active once songs are added.

## 4. Key Decisions
- [x] Use a **Unified Search Bar** instead of separate inputs for links/text.
- [x] Implement a **Draft List (Source Canvas)** to allow multi-source sessions.
- [x] Use a **Dashboard/Action** layout for the empty state instead of a blank search page.
- [x] Use **Inline Selection** for artist discographies to keep the user in context.
- [x] Use **localStorage** for draft persistence.
- [x] Implement a **Manual Review (Deduplication)** step before starting sessions with multiple sources.
- [x] Enforce a **Soft Cap (~150 songs)** warning for large sessions.

## 5. Open Questions (To be resolved)
- *All initial questions resolved.*

## 6. Resolved Questions
1. **Deduplication Strategy**: Use a manual review step. Identified duplicates will be presented to the user to confirm merging before the session starts (updating existing logic to support multi-source).
2. **Draft Persistence**: Use `localStorage` to automatically save the "Draft" session builder state so it survives page refreshes.
3. **Source Limits**: Implement a soft cap at approximately 150 songs, warning the user about potential performance/time commitment.
