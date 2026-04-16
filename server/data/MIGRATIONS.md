# Database Migrations

`server/data/clickaway.sql` is the bootstrap schema for fresh local databases.

`server/data/migrations/` contains incremental patches for existing databases that
were created before the bootstrap schema picked up a given change.

## Applied Status Ledger

Last reviewed: `2026-04-05`

| Migration | Purpose | Local | Staging | Production | Reversible |
| --- | --- | --- | --- | --- | --- |
| `001_add_round_reaction_metrics.sql` | Add `round_history.avg_reaction_ms` and `round_history.best_reaction_ms` | Unverified | Unknown / not tracked | Unknown / not tracked | Manual only. Safe to reverse with `ALTER TABLE ... DROP COLUMN` only after confirming no dependent code or data needs remain. |
| `003_add_ranked_state.sql` | Add ranked-system versioning, placement tracking, and demotion protection columns to `users` | Unverified | Unknown / not tracked | Unknown / not tracked | Manual only. Safe to reverse with `ALTER TABLE ... DROP COLUMN` only after confirming ranked placement data is no longer needed. |
| `004_add_build_walkthrough_status.sql` | Add `users.build_walkthrough_status` so first-time Armory onboarding is synced per account | Unverified | Unknown / not tracked | Unknown / not tracked | Manual only. Safe to reverse with `ALTER TABLE ... DROP COLUMN` only after confirming walkthrough progress is no longer needed. |

## Notes

- Fresh databases created from `clickaway.sql` already include the reaction metric
  columns, so `001_add_round_reaction_metrics.sql` is only for older databases.
- The repo does not currently track migration application in the database itself.
  Update this file when a migration is applied in a real environment.
