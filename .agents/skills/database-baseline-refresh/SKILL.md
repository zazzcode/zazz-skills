---
name: "database-baseline-refresh"
type: "procedure"
description: "Refresh the canonical database seed baseline by preserving the current dev DB, upgrading to the latest schema, restoring accumulated real data, adding new feature baseline rows, and re-freezing the upgraded state."
---

# Database Baseline Refresh

## Purpose

Use this skill when a feature changes persistent database schema or adds new persisted baseline data and the repo baseline must preserve the real accumulated dev/test data already entered through the app.

This workflow is for carrying the current development database forward.
It is not for rebuilding from synthetic starter data.

Canonical companion document:
- `docs/database-baseline-refresh.md`

## When To Use

Use this skill when all of the following are true:

1. The branch changes database schema or adds new persisted tables/columns.
2. The running dev DB contains valid board/app data you do not want to lose.
3. Future resets/tests must reproduce that upgraded real data exactly.

## Core Principle

Always follow:

1. Back up current DB truth.
2. Export current DB truth into the canonical snapshot.
3. Rebuild on the latest schema.
4. Restore captured data.
5. Add new branch-owned baseline rows that did not exist in the old DB yet.
6. Re-export the upgraded DB as the new canonical snapshot.
7. Prove the snapshot round-trips.
8. Verify with the backend test suite.

Do not skip the backup step.

## Source Of Truth Files

Canonical snapshot:
- `api/scripts/seeders/data/database-snapshot.json`

Typical backup snapshot:
- `api/scripts/seeders/data/database-snapshot.pre-upgrade.json`

Typical raw SQL rollback dump:
- `/tmp/zazz_board_db-pre-upgrade.sql`

Implementation files:
- `api/scripts/export-database-snapshot.js`
- `api/scripts/seeders/databaseSnapshot.js`
- `api/scripts/seeders/seedDatabaseSnapshot.js`

## Preserved Tables

Include persistent business/config data:

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

Exclude:

- `FILE_LOCKS`

Reason:
- lock leases are operational state, not durable product state

## Required Guardrails

1. Back up before any destructive step.
2. Preserve explicit IDs from the source DB.
3. Reset sequences after importing explicit IDs.
4. Do not silently replace real data with hardcoded synthetic seed rows.
5. If a new table did not exist in the old DB, restore old data first, then add branch-owned baseline rows intentionally.
6. Re-export after adding those new baseline rows so the canonical snapshot reflects the upgraded state.

## Standard Execution Steps

### 1. Back up current DB truth

Create a JSON backup snapshot:

```bash
cd api
node scripts/export-database-snapshot.js scripts/seeders/data/database-snapshot.pre-upgrade.json
```

Create a raw SQL rollback dump:

```bash
docker exec zazz_board_postgres pg_dump -U postgres -d zazz_board_db > /tmp/zazz_board_db-pre-upgrade.sql
```

If local `pg_dump` matches server version, that is acceptable too.

### 2. Export current DB truth into the canonical snapshot

```bash
cd api
npm run db:export-snapshot
```

This captures the real current DB state, even if the running DB is still on the old schema.

### 3. Rebuild the dev DB on latest schema from the canonical snapshot

```bash
cd api
npm run db:reset
```

This must:

1. recreate tables from `api/lib/db/schema.js`
2. import `database-snapshot.json`
3. preserve IDs
4. reset sequences

### 4. Add new branch-owned baseline rows

If the feature introduced new persisted baseline rows that did not exist in the old DB, add them now.

Example:

```bash
cd api
npm run db:seed-agent-tokens
```

This step must be idempotent.

### 5. Re-freeze the upgraded DB into the canonical snapshot

```bash
cd api
npm run db:export-snapshot
```

After this step, `database-snapshot.json` is the new canonical baseline.

### 6. Prove round-trip reproducibility

Run another reset from the newly exported snapshot:

```bash
cd api
npm run db:reset
```

Verify expected counts and key rows still exist.

### 7. Refresh the test DB and run full backend verification

```bash
cd api
DATABASE_URL=postgres://postgres:password@localhost:5433/zazz_board_test npm run db:reset
set -a && source .env && set +a && NODE_ENV=test npm run test
```

Do not declare the refresh complete until this passes.

## Expected Outcome

At completion:

1. The dev DB is on the latest schema.
2. Real accumulated board/app data is preserved.
3. New feature baseline rows are present.
4. `database-snapshot.json` reproduces that upgraded state exactly.
5. Backend tests pass from the refreshed snapshot flow.

## Notes For Future Features

Repeat this process every time a schema-affecting feature lands and you want to preserve accumulated real data.

The pattern is always:

- preserve
- upgrade
- restore
- add new baseline rows
- re-freeze
- verify
