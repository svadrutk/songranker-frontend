# Backend Specification: Decision Time Tracking

This specification outlines the changes required to the SongRanker Backend to support decision-time-weighted rankings.

## 1. Goal
Capture the time taken (in milliseconds) for a user to make a choice during a duel. This data will be used to:
1.  Verify user engagement.
2.  Weighted Bradley-Terry updates (Faster decisions = Higher confidence/weight).

## 2. Changes Required

### A. Database Schema (`comparisons` table)
Add a new column to store the decision time.
- **Column Name**: `decision_time_ms`
- **Type**: `INTEGER` (or `BIGINT`)
- **Nullable**: `YES` (to support historical data)

**SQL Migration:**
```sql
ALTER TABLE comparisons ADD COLUMN decision_time_ms INTEGER;
```

### B. Pydantic Schema (`app/schemas/session.py`)
Update the `ComparisonCreate` model to accept the new field.

```python
class ComparisonCreate(BaseModel):
    song_a_id: UUID4
    song_b_id: UUID4
    winner_id: Optional[UUID4] = None
    is_tie: bool = False
    decision_time_ms: Optional[int] = None # <--- Add this
```

### C. API Route (`app/api/v1/sessions.py`)
Ensure the value is captured in the endpoint. *No logic changes needed here if the DB client is updated.*

```python
@router.post("/sessions/{session_id}/comparisons", response_model=ComparisonResponse)
async def create_comparison(session_id: UUID, comparison: ComparisonCreate):
    # ... logic stays same, pass comparison.decision_time_ms to client ...
```

### D. Supabase Client (`app/clients/supabase_db.py`)
Update `record_comparison_and_update_elo` to persist the new field.

```python
async def record_comparison_and_update_elo(
    self, 
    session_id: str, 
    song_a_id: str, 
    song_b_id: str, 
    winner_id: Optional[str], 
    is_tie: bool, 
    new_elo_a: float, 
    new_elo_b: float,
    decision_time_ms: Optional[int] = None # <--- Add this
):
    # Update the RPC or bulk query to include decision_time_ms
```

## 3. Future Enhancement: Algorithm Weighting
The Bradley-Terry model can eventually use this field to weight the contribution of a duel to the final strength calculation:
- `weight = 1.0` if `decision_time_ms` is null or typical (3s - 10s).
- `weight = 1.5` if `decision_time_ms < 3000` (Fast/Strong).
- `weight = 0.5` if `decision_time_ms > 10000` (Slow/Weak).

## 4. Verification (Tested Live)
The frontend has been updated to send this field. Verification against the existing backend (commit `HEAD`) shows that adding `decision_time_ms` to the POST body **does not** cause validation errors (it is currently ignored by the server).

**Test Command Executed:**
```bash
curl -X POST http://localhost:8000/sessions/{v4_uuid}/comparisons \
-H "Content-Type: application/json" \
-d '{"song_a_id": "...", "song_b_id": "...", "winner_id": null, "is_tie": false, "decision_time_ms": 1234}'
```
**Result**: `{"detail":"One or both songs not found in session"}` (Success: Passed schema validation).
