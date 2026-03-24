# MySQL Audit

## Status

- Auth and persisted player state are backend/MySQL owned.
- Real leaderboard data is now backend-owned through `GET /api/leaderboard`.
- Leaderboard rows are derived from `users` joined with ranked-only `round_history` aggregates.
- Rank tier and level formulas remain frontend-owned; the API returns raw `mmr` and `levelXp`.

## Leaderboard rollout note

Existing databases should add the leaderboard support indexes before relying on the new query path:

```sql
ALTER TABLE users
  ADD KEY idx_users_mmr_id (mmr, id);

ALTER TABLE round_history
  ADD KEY idx_round_history_progression_user (progression_mode, user_id);
```
