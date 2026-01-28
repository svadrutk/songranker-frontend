# Ranking System Integration Plan (Frontend)

## 🎯 Goal
Integrate the backend's Bradley-Terry model into the UI to provide "Seamless Sync," accurate progress tracking, and a statistical "Finish Line" for the user.

## 🏗️ Implementation

### 1. API Synchronization (`lib/api.ts`)
- Update `ComparisonResponse` to include:
    - `sync_queued: boolean`
    - `convergence_score: number` (0.0 to 1.0)

### 2. Seamless Sync Logic (`components/RankingWidget.tsx`)
- **Silent Update**: When `createComparison` returns `sync_queued: true`:
    - Wait ~1 second (for worker overhead).
    - Call `getSessionDetail(sessionId)` in the background.
    - Update the local `songs` state with the official `local_elo` and `bt_strength`.
- **Constraint**: Do not show a loading spinner during this sync; it must be invisible to the user.

### 3. Progress Tracking
- **Visuals**: Add a thin, elegant progress bar (e.g., at the top of the duel area).
- **Logic**: Use `convergence_score * 100` as the percentage.
- **Dynamic Feedback**: Update sub-text labels based on progress (e.g., "Calibrating..." vs "Stabilizing...").

### 4. Convergence Completion Flow
- **Threshold**: When `convergence_score >= 0.90` (90% stable):
    - Display a "Finish Session" button or an overlay.
    - Give the user the choice: *"Your Top 10 is stable! View Leaderboard or Keep Ranking?"*
- **Final View**: Transition to the session leaderboard, sorted by `bt_strength`.

## 📈 UX Principles
- **Snappiness**: Keep local Elo for instant feedback during the 10-duel windows.
- **No Blockers**: Never block the user's voting flow for mathematical calculations.
- **Transparency**: Use the progress bar to manage expectations about session length.
