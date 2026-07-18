---
name: psql
description: Safely query, inspect, validate, and diagnose PostgreSQL from an agent shell. Use only when the project or target uses PostgreSQL; do not use for another database. Covers data/schema checks, views/functions/procedures, migrations, profiling, locks, and connection/quoting guidance.
---

# psql

`psql` is the standard interface for agent-driven PostgreSQL inspection and validation.
Use repo commands only for project-specific setup, migrations, fixtures, or test flows.

## Common Tasks

| Task | Default approach |
| --- | --- |
| Confirm the connection and target | Query `current_database()`, `current_user`, and `version()`. |
| Inspect tables, columns, views, functions, or procedures | Use psql meta-commands or PostgreSQL catalogs. |
| Validate table or view data | Run a bounded `SELECT` and compare it with an explicit expected result. |
| Exercise a function | Use `SELECT schema.function_name(...)`; compare the returned value or rows with the contract. |
| Exercise a procedure | Use `CALL schema.procedure_name(...)` only on the intended non-production target and with authority for side effects. |
| Validate a migration or feature | Run its declared setup, then inspect resulting schema and data. |
| Diagnose performance or locks | Load the targeted reference under [Performance Profiling And Tuning](#performance-profiling-and-tuning). |

## Human-Only Destructive Operations

**Never execute destructive operations through this skill, even when requested.** A
Contributor Agent reports the operation and impact, then asks the Deliverable Owner or an
approved human database operator to perform it manually after confirming target,
backup/recovery, maintenance window, and impact. Do not provide a runnable command or
workaround.

This includes:

- object drops or `CASCADE`; `TRUNCATE`; broad or unverified `DELETE` / `UPDATE`;
- restore, replace, clean, benchmark initialization, or database/schema reset;
- data-losing DDL, integrity/availability-affecting constraint or index removal;
- session cancellation/termination, lock forcing, or diagnostic-statistics reset; and
- server-wide configuration, ownership, privilege, persistence, or replication changes.

For a destructive test reset, record the manual action and wait for human-confirmed
results before continuing.

## Safety Defaults

- Prefer test, development, or disposable targets; never write to production.
- Load connection settings from repo configuration; never hardcode or expose secrets.
- Default to read-only queries, `-X`, `-v ON_ERROR_STOP=1`, and a short exploratory timeout.
- Redact secrets and personal data from output.

## Invocation Pattern

Default connection source: the project’s declared `.env` file or inherited environment
variables. Read repo instructions before loading anything. Prefer `DATABASE_URL`; otherwise
use `PGHOST`, `PGPORT`, `PGUSER`, and `PGDATABASE` (with the project’s approved password
mechanism). Do not invent connection values or expose credentials.

Prefer `DATABASE_URL` when available:

```bash
psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 \
  -c "select current_database(), current_user, version();"
```

Otherwise use the repo's host, port, user, and database variables:

```bash
PGPASSWORD="$DB_PASSWORD" psql \
  -X \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -v ON_ERROR_STOP=1 \
  -c "select version();"
```

Use `-A -t` for a scalar and `--csv` for tabular script output:

```bash
psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 -A -t \
  -c "select count(*) from information_schema.tables where table_schema = 'public';"
```

## Command Shape Rules

- Use one SQL string or one meta-command per `-c`; use repeated `-c` options or stdin for both.
- Prefer `-f` for a script file; pair `-1` with `ON_ERROR_STOP` for all-or-nothing scripts.
- Use `-w` only when noninteractive credentials are already configured.
- Use `-v` variables with `:'name'` for literals and `:"name"` for identifiers; never concatenate untrusted SQL.

## Query And Validation Workflow

1. Confirm the target database and environment class.
2. Use the smallest validation query; add `ORDER BY` and `LIMIT` for row inspection.
3. State the expected row count, value, presence/absence, shape, or invariant.
4. Use a read-only transaction for multi-query inspection when supported.
5. Record the query and a redacted result summary. Command success alone is not evidence.

Example read-only validation session:

```bash
psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
begin read only;
set local statement_timeout = '30s';
select current_database(), current_user;
select id, status
from public.example_view
where id = 42
order by id
limit 10;
commit;
SQL
```

Example scalar function assertion:

```bash
psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 -A -t \
  -c "select public.compute_example_score(42);"
```

For a procedure or another writing statement, name the target and side effect first. Use a
test transaction and `ROLLBACK` only when the routine does not manage its own transaction.

## Performance Profiling And Tuning

Load only the reference needed. Do not enable extensions, change server configuration,
run benchmarks, or process production logs merely to investigate.

| Need | Read |
| --- | --- |
| Profile one query, function, or procedure; inspect I/O, row estimates, or plan shape | [references/query-profiling.md](references/query-profiling.md) |
| Find expensive workload statements; inspect `pg_stat_statements` / `auto_explain`; guide a human-run benchmark | [references/workload-profiling.md](references/workload-profiling.md) |
| Inspect active sessions, waits, locks, `pg_activity`, or log-based `pgBadger` reports | [references/live-monitoring.md](references/live-monitoring.md) |

Start with a plan estimate, then safe `EXPLAIN ANALYZE`, then existing workload stats.
Treat tuning as deliverable work: hypothesis, before/after evidence, regression checks,
and required human approval.

## Schema Inspection

Use one meta-command per `-c`:

```bash
psql -X "$DATABASE_URL" -c '\dt public.*'
psql -X "$DATABASE_URL" -c '\d+ public.example_table'
psql -X "$DATABASE_URL" -c '\df+ public.*'
```

For scripting, query catalogs or `information_schema`:

```bash
psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 -A -F $'\t' \
  -c "select column_name, data_type, is_nullable
      from information_schema.columns
      where table_schema = 'public' and table_name = 'example_table'
      order by ordinal_position;"
```

## Output

Report target environment, command/query shape, redacted result summary, and profiling
method when applicable.
