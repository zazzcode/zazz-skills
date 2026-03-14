# Database Baseline Refresh

Use this process whenever a feature changes persistent database schema or adds new persisted baseline data, and you want to preserve the real accumulated dev data instead of resetting to synthetic starter rows.

## Goal

Carry the current development database forward to the latest schema, preserve all real board data already entered through the app, add any new branch-owned baseline rows, then freeze that upgraded state as the new canonical seed snapshot.

This is not a throwaway seed reset workflow. It is a baseline refresh workflow.

## What gets preserved

The canonical snapshot includes persistent business/config data:

- `USERS`
- `STATUS_DEFINITIONS`
- `COORDINATION_TYPES`
- `TRANSLATIONS`
- `TAGS`
- `PROJECTS`
- `AGENT_TOKENS`
- `DELIVERABLES`
- `TASKS`
- `TASK_TAGS`
- `TASK_RELATIONS`
- `IMAGE_METADATA`
- `IMAGE_DATA`

The snapshot intentionally excludes `FILE_LOCKS` because lock leases are operational state, not durable product state.

## Files and commands

Canonical snapshot:

- `api/scripts/seeders/data/database-snapshot.json`

Backup snapshot pattern:

- `api/scripts/seeders/data/database-snapshot.pre-upgrade.json`

Raw rollback dump pattern:

- `/tmp/zazz_board_db-pre-upgrade.sql`

Commands:

```bash
cd api

# Export current DB to canonical snapshot
npm run db:export-snapshot

# Export a dated/pre-upgrade backup snapshot
node scripts/export-database-snapshot.js scripts/seeders/data/database-snapshot.pre-upgrade.json

# Rebuild the current DB from the canonical snapshot on latest schema
npm run db:reset

# Add branch-owned baseline rows introduced by the new feature
npm run db:seed-agent-tokens
```

## Standard refresh process

1. Back up the current dev DB before any destructive action.

   Create both:
   - JSON snapshot backup using `node scripts/export-database-snapshot.js scripts/seeders/data/database-snapshot.pre-upgrade.json`
   - raw SQL dump using `pg_dump` or `docker exec zazz_board_postgres pg_dump ...`

2. Export the current dev DB into the canonical snapshot file.

   Run:

   ```bash
   cd api
   npm run db:export-snapshot
   ```

   At this point the repo contains the current real dev data, even if the running DB is still on an older schema.

3. Rebuild the dev DB on the latest schema from that snapshot.

   Run:

   ```bash
   cd api
   npm run db:reset
   ```

   `db:reset` now:
   - drops/recreates schema from `api/lib/db/schema.js`
   - seeds from `api/scripts/seeders/data/database-snapshot.json`
   - preserves explicit IDs and resets sequences afterward

4. Add any new branch baseline rows that did not exist in the old DB yet.

   Example for ZAZZ-6:

   ```bash
   cd api
   npm run db:seed-agent-tokens
   ```

   This step is for new persisted feature data that should exist in the refreshed baseline even if the old DB predates the table.

5. Freeze the upgraded DB back into the canonical snapshot.

   Run:

   ```bash
   cd api
   npm run db:export-snapshot
   ```

   Now `database-snapshot.json` represents the real upgraded baseline.

6. Prove the snapshot round-trips.

   Run:

   ```bash
   cd api
   npm run db:reset
   ```

   Verify expected counts or core rows still exist.

7. Refresh the test DB and run the full backend suite.

   Example:

   ```bash
   cd api
   DATABASE_URL=postgres://postgres:password@localhost:5433/zazz_board_test npm run db:reset
   set -a && source .env && set +a && NODE_ENV=test npm run test
   ```

## Why this is the standard

- It preserves real deliverables, task history, task relations, and other valid dev/test data entered through the UI.
- It avoids drifting back to hardcoded synthetic seed data.
- It keeps schema, seed baseline, and test fixtures aligned.
- It makes future database-affecting features incremental: export current truth, upgrade, add new baseline rows, re-export.

## Current implementation notes

- Snapshot exporter: `api/scripts/export-database-snapshot.js`
- Snapshot loader: `api/scripts/seeders/databaseSnapshot.js`
- Snapshot importer: `api/scripts/seeders/seedDatabaseSnapshot.js`
- Agent token baseline seed: `api/scripts/seeders/seedAgentTokens.js`

`seedAgentTokens.js` is idempotent and safe to rerun because it inserts with conflict-ignore semantics.
