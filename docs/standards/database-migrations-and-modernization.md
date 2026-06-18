---
last_updated_at: 2026-05-25
---

# Database migrations and modernization

This standard governs migration edit policy, repeatable migrations, sproc tombstones, modernization sequencing, and
performance tuning workflow.

## Migrations

Migrations live under `backend/database/sql_migrations/`. Repeatable migrations (`R__*.sql`) hold the current
definition of every object that is replaceable on each schema rebuild — stored procedures, tests, views, seed data.
Versioned migrations (`V__*.sql`) hold one-time schema changes that are applied exactly once and tracked by Flyway's
checksum mechanism. The distinction drives almost every editing rule for migration files.

### Versioned migrations are write-once historical records

Once a versioned (`V__*.sql`) migration has been written, it is a fixed-point historical record of a schema change that
ran exactly once. Do not edit it to correct cosmetic issues — typos in SQL comments, whitespace cleanup, prose
improvements. The effort of correction (and the Flyway checksum implications if the file has already been applied in
any environment) outweighs the zero functional benefit. The exception is a typo in a SQL identifier with functional
impact — that is a bug, not a cosmetic issue, and must be fixed with a follow-up versioned migration rather than an
edit (review precedent).

### Not desired ❌

```sql
-- Editing V00039__rename_legacy_status_column.sql purely to fix a comment typo:
-- "LegacyStausCode" → "LegacyStatusCode"
-- wrong: V__ migrations are one-time historical records; comment typos
-- have no functional impact
```

### Repeatable migrations are perpetually-current documentation

Repeatable (`R__*.sql`) migrations re-run on every schema build and represent the current state of the object they
define. Treat them as living documentation: when an object referenced by an `R__` file is renamed, deleted, or has its
behavior changed, every `R__` file that mentions the object by name must be updated in the same PR. A stale reference
in an `R__` file misleads future readers about the current design and survives every schema rebuild as if it were
authoritative. For example, if `dbo.app_ValidateCustomerSegmentHierarchy` is renamed, both
`R__dbo.app_ValidateCustomerSegmentHierarchy.sql` and its matching tests must move together.

The reviewer checklist for a deletion PR: grep every `R__*` file for the deleted object's name and update each match.
Comment blocks that explained motivation rooted in code that no longer exists should be deleted rather than rewritten —
"the code speaks for itself; the sargability is a property of the query, not a decision that needs defending" was the
standing rationale when the stale comment block was excised in review precedent.

### Sproc tombstones describe only what was removed

When a stored procedure is deleted, its `R__` file is replaced with a tombstone: a `DROP PROCEDURE IF EXISTS` statement
and a comment block describing what was removed, why it was removed, and what (if anything) replaced it. The
tombstone's comment scope is limited to those three things. Do not include comments about objects that were *not*
removed in this change — git history provides the surrounding context for what else still exists, and a comment about
adjacent surviving sprocs reads as self-contradictory when the tombstone itself is one of that family
(review precedent; see
`R__dbo.app_ValidateUnpostedTicket.sql`).

### Desired ✅

```sql
-- Tombstone: this sproc has been superseded by the legacy_ValidateTicket trigger.
-- Validation is now handled inline during INSERT/UPDATE on the Ticket table.
drop procedure if exists dbo.app_ValidateUnpostedTicket;
```

### Not desired ❌

```sql
-- The granular app_Validate* sprocs remain available for standalone use.
-- wrong: this file IS itself a app_Validate* sproc being dropped —
-- self-contradictory comment
drop procedure if exists dbo.app_ValidateUnpostedTicket;
```

## Modernization strategy

The database is an adaptation of a twenty-year-old legacy schema. It carries highly valuable business logic distributed
across many stored procedures — operations the legacy application layer treated as simple inserts or selects were
typically implemented as custom sprocs that did most of the lifting and returned results. None of those legacy sprocs
have tests, and there was no systemic approach to formatting or linting
(database-modernization-approach.md).

The approach in flight today is incremental:

1. **Test first.** Before changing a legacy sproc's behavior, add tests that *confirm* its current behavior, including
   any bugs. Bugs documented this way are tagged with the `KNOWNBUG_` prefix in the test name and assert the buggy
   behavior so the test passes (see [database-testing.md](./database-testing.md)). This gives the team a safety net
   before any refactor.
1. **Lint and format on encounter.** Formatting and linting are gated by an ignore file that lists every database
   object in version control. As an object comes up for change, it is removed from the ignore list, linted, formatted,
   and committed.
1. **Then refactor with confidence.** With tests in place and lint clean, the underlying business logic can be tweaked
   without surprising regressions, and the `KNOWNBUG_` test will start failing the moment the bug is actually fixed —
   at which point the test is renamed and re-asserts the correct behavior.

The same gradualism governs naming and structural conventions. Auto-generated FK constraint names and pre-convention
unique indexes are not renamed automatically when a developer notices them; they are surfaced to the human, and a
rename is only undertaken when the developer is willing to update every sproc and test that pattern-matches the old
name in the same PR (see
[database.md](./database.md#foreign-key-renames-must-propagate-to-sprocs-and-tests-in-the-same-pr)).

## Performance tuning workflow

When investigating index gaps, query-plan regressions, or schema decisions where a measured before/after comparison
matters, use `backend/scripts/db-snapshot.py` as the safety net before applying any experimental change to the local
database
(`backend/scripts/db-snapshot.py`).

The workflow is: create a snapshot of the current state, apply the experimental change (add or drop an index, rewrite a
sproc, alter a column type), measure the difference, then either restore from the snapshot to undo cleanly or delete
the snapshot to keep the change. Restoring overwrites the live database with the snapshot and removes all other
snapshots, so it is a clean rollback to exactly the state before the experiment began.

This is a local-development tool only. Never run `db-snapshot.py` against a shared, staging, or production-equivalent
database — the `restore` and `delete` subcommands are destructive without a secondary confirmation path, and the script
assumes `$DB_URL` points to an isolated disposable development database.

### Desired ✅

```shell
# 1. Snapshot the current state before the experiment
uv run --directory backend scripts/db-snapshot.py create my-perf-snapshot
# ✓ Snapshot 'my-perf-snapshot' created successfully!

# 2. Apply the experimental change (e.g., add an index, rewrite a sproc)
#    ... run Flyway, apply the migration, or execute T-SQL directly ...

# 3. Measure — run your query, check execution plans, capture timings

# 4a. Restore (to undo the change and return to the pre-experiment state)
uv run --directory backend scripts/db-snapshot.py restore my-perf-snapshot
# Are you sure you want to restore from snapshot? [y/N]: y
# ✓ Database restored from snapshot 'my-perf-snapshot' successfully!

# 4b. Delete (to keep the change — drop the snapshot without restoring)
uv run --directory backend scripts/db-snapshot.py delete my-perf-snapshot
```

Other available subcommands: `list` (shows all existing snapshots with creation timestamps). The script requires a
running SQL Server instance at `$DB_URL` — start it with `just be-db-start` before use.
