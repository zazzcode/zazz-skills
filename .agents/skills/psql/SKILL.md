---
name: psql
description: Run PostgreSQL diagnostics safely from an agent shell. Use before invoking psql directly when the task needs schema inspection, read-only data checks, query or function/procedure profiling, EXPLAIN analysis, pg_stat_statements investigation, auto_explain guidance, or PostgreSQL quoting/env handling.
---

# psql

Use `psql` only when a repository recipe does not already cover the diagnostic. Prefer repo-local commands such as `just db-shell`, `make db-test`, migration recipes, seed scripts, or integration tests when they exist.

## Safety Defaults

- Prefer a test, development, or disposable database. Never run write or destructive diagnostics against production.
- Load connection settings from the repo's environment mechanism; do not hardcode passwords, hosts, ports, or database names.
- Use read-only queries unless the user or test recipe explicitly requires writes.
- Use `-X` to ignore a user's `~/.psqlrc` in scripted agent commands so output and settings stay predictable.
- Use `-v ON_ERROR_STOP=1` for scripts so SQL errors produce psql exit status 3 instead of continuing.
- Redact secrets, tokens, and personally identifiable data from output.
- Set a short `statement_timeout` for exploratory diagnostics unless the repo's workflow says otherwise.

## Invocation Pattern

Adapt variable names to the repo's `.env`, secret manager, or wrapper script:

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

If the repo provides `DATABASE_URL`, prefer the connection URI and keep the same safety flags:

```bash
psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "select current_database(), current_user;"
```

Use `-A -t` for compact machine-readable scalar output:

```bash
psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 -A -t \
  -c "select count(*) from information_schema.tables where table_schema = 'public';"
```

Use `--csv` for query output intended for spreadsheet or script consumption.

## Command Shape Rules

- `-c` executes one SQL string or one backslash command, then exits. Do not mix SQL and psql meta-commands in the same `-c`; use repeated `-c` options or feed standard input.
- `-f file.sql` is preferred over shell redirection for script files because psql reports line numbers.
- `-1` wraps repeated `-c` or `-f` commands in a single transaction. Pair it with `-v ON_ERROR_STOP=1` when a multi-step script must be all-or-nothing.
- `-w` prevents password prompts and is useful for noninteractive jobs only when credentials are already supplied by `.pgpass`, env vars, or a service file.
- `-v name=value` assigns psql variables. Use `:'name'` for SQL string literals and `:"name"` for SQL identifiers in scripts; do not concatenate untrusted values into SQL text.

## Quick Timing

Use psql timing for rough wall-clock feedback:

```bash
psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
\timing on
set statement_timeout = '30s';
select count(*) from public.example_table;
SQL
```

This is a quick measurement only. For optimization work, capture a plan with `EXPLAIN`.

## EXPLAIN Recipes

Read-only plan estimate:

```bash
psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 \
  -c "explain (verbose, settings) select * from public.example_table where id = 42;"
```

Actual execution plan for a read query:

```bash
psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 \
  -c "explain (analyze, buffers, settings, wal, summary) select * from public.example_table where id = 42;"
```

Lower overhead when row counts matter more than per-node clock timing:

```bash
psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 \
  -c "explain (analyze, buffers, timing off, summary) select * from public.example_table;"
```

Machine-readable plan for tooling:

```bash
psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 -A -t \
  -c "explain (analyze, buffers, settings, format json) select * from public.example_table;"
```

Warning: `EXPLAIN ANALYZE` executes the statement. For `INSERT`, `UPDATE`, `DELETE`, `MERGE`, `CREATE TABLE AS`, or `EXECUTE`, wrap it in an explicit transaction and roll it back unless the diagnostic intentionally writes data:

```bash
psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
begin;
explain (analyze, buffers, wal, summary)
update public.example_table set processed = true where processed = false;
rollback;
SQL
```

## Stored Procedure And Function Profiling

PostgreSQL has both functions and procedures. Functions are invoked with `select function_name(...)`; procedures are invoked with `call procedure_name(...)`.

Profile a procedure call safely when it writes:

```bash
psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
begin;
explain (analyze, buffers, wal, summary)
call public.refresh_example_rollup(42);
rollback;
SQL
```

Profile a function call:

```bash
psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 \
  -c "explain (analyze, buffers, summary) select public.compute_example_score(42);"
```

For PL/pgSQL internals, the outer `EXPLAIN` usually shows the function/procedure call as one node. Use one of these when the body matters:

- Enable `auto_explain` with `log_nested_statements = on` in a safe session or test environment to log statements executed inside functions.
- Enable `track_functions` in the database configuration, then inspect `pg_stat_user_functions` for call counts and total/self time.
- Use `pg_stat_statements` to find the normalized SQL statements that dominate total execution time across repeated calls.

## pg_stat_statements

Use `pg_stat_statements` for workload-level profiling after it is installed and enabled for the target database. Do not create or reset the extension in shared environments unless the user or repo workflow explicitly allows it.

Check availability:

```bash
psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 -A -t \
  -c "select extversion from pg_extension where extname = 'pg_stat_statements';"
```

Top statements by total execution time:

```bash
psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 -x \
  -c "select query, calls, round(total_exec_time::numeric, 2) as total_ms,
             round(mean_exec_time::numeric, 2) as mean_ms,
             rows,
             round(100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0), 2) as hit_percent
      from pg_stat_statements
      order by total_exec_time desc
      limit 10;"
```

Top statements by mean execution time:

```bash
psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 -x \
  -c "select query, calls, round(mean_exec_time::numeric, 2) as mean_ms,
             round(max_exec_time::numeric, 2) as max_ms,
             rows
      from pg_stat_statements
      where calls > 0
      order by mean_exec_time desc
      limit 10;"
```

Reset statistics only in a disposable or explicitly approved environment:

```sql
select pg_stat_statements_reset(0, 0, 0);
```

## auto_explain

Use `auto_explain` when you need plans for slow application-issued SQL or nested SQL inside functions/procedures without manually wrapping each statement. It requires server/session permissions, often superuser, and has overhead.

Safe session-level shape for an isolated test database:

```sql
load 'auto_explain';
set auto_explain.log_min_duration = '250ms';
set auto_explain.log_analyze = true;
set auto_explain.log_buffers = true;
set auto_explain.log_wal = true;
set auto_explain.log_timing = off;
set auto_explain.log_nested_statements = on;
set auto_explain.log_format = 'json';
```

Use `log_timing = off` when per-node timing overhead would distort the workload and row counts/buffer usage are enough. Turn `log_nested_statements` on only when function/procedure internals are the target.

## Live Activity And Locks

Current running queries:

```bash
psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 -x \
  -c "select pid, usename, application_name, state, wait_event_type, wait_event,
             now() - query_start as query_age, left(query, 500) as query
      from pg_stat_activity
      where state <> 'idle'
      order by query_start nulls last;"
```

Blocking relationships:

```bash
psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 \
  -c "select blocked.pid as blocked_pid,
             blocking.pid as blocking_pid,
             blocked.query as blocked_query,
             blocking.query as blocking_query
      from pg_stat_activity blocked
      join pg_locks blocked_locks on blocked_locks.pid = blocked.pid and not blocked_locks.granted
      join pg_locks blocking_locks
        on blocking_locks.locktype = blocked_locks.locktype
       and blocking_locks.database is not distinct from blocked_locks.database
       and blocking_locks.relation is not distinct from blocked_locks.relation
       and blocking_locks.page is not distinct from blocked_locks.page
       and blocking_locks.tuple is not distinct from blocked_locks.tuple
       and blocking_locks.virtualxid is not distinct from blocked_locks.virtualxid
       and blocking_locks.transactionid is not distinct from blocked_locks.transactionid
       and blocking_locks.classid is not distinct from blocked_locks.classid
       and blocking_locks.objid is not distinct from blocked_locks.objid
       and blocking_locks.objsubid is not distinct from blocked_locks.objsubid
       and blocking_locks.pid <> blocked_locks.pid
      join pg_stat_activity blocking on blocking.pid = blocking_locks.pid
      where blocking_locks.granted;"
```

## Schema Inspection

Use psql meta-commands interactively, or invoke one meta-command per `-c`:

```bash
psql -X "$DATABASE_URL" -c '\dt public.*'
psql -X "$DATABASE_URL" -c '\d+ public.example_table'
psql -X "$DATABASE_URL" -c '\df+ public.*'
```

For scriptable inspection, query catalogs or `information_schema`:

```bash
psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 -A -F $'\t' \
  -c "select column_name, data_type, is_nullable
      from information_schema.columns
      where table_schema = 'public' and table_name = 'example_table'
      order by ordinal_position;"
```

## Output

Report the command shape, target environment class, result summary, profiling method, and any uncertainty about whether the diagnostic used the intended database. For profiling, include whether the evidence came from `\timing`, `EXPLAIN`, `pg_stat_statements`, `auto_explain`, or PostgreSQL statistics views.

## Source Notes

This skill follows the official PostgreSQL documentation for `psql`, `EXPLAIN`, `pg_stat_statements`, `auto_explain`, and monitoring statistics views.
