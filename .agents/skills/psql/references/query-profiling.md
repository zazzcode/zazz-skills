# Query, Function, And Procedure Profiling

Use this reference for one known statement or routine. Work in a test, development, or
disposable database whenever actual execution is needed.

## Choose The Smallest Useful Probe

| Question | Probe |
| --- | --- |
| What plan does PostgreSQL estimate? | `EXPLAIN (VERBOSE, SETTINGS)` |
| Are estimates, time, rows, or I/O different in reality? | `EXPLAIN (ANALYZE, BUFFERS, SETTINGS, SUMMARY)` |
| Is node-level timing overhead material? | Add `TIMING OFF`; total statement time remains available. |
| Must a tool consume the result? | Add `FORMAT JSON`. |
| Does a write create excessive WAL? | Add `WAL` inside a transaction that is rolled back. |

`EXPLAIN ANALYZE` executes the statement. It may change data, acquire locks, and run
more slowly than the ordinary statement because profiling has overhead. Set a bounded
`statement_timeout` for exploratory work and never use an unbounded production query as a
first probe.

For a rough, non-diagnostic wall-clock measure only:

```bash
psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
\timing on
set statement_timeout = '30s';
select count(*) from public.example_table;
SQL
```

## Recipes

Plan estimate only:

```bash
psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 \
  -c "explain (verbose, settings) select * from public.example_table where id = 42;"
```

Actual read-query plan with buffer information:

```bash
psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 \
  -c "explain (analyze, buffers, settings, summary) select * from public.example_table where id = 42;"
```

Lower-overhead actual plan when row counts and buffer use matter more than per-node time:

```bash
psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 \
  -c "explain (analyze, buffers, timing off, summary) select * from public.example_table;"
```

Machine-readable plan:

```bash
psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 -A -t \
  -c "explain (analyze, buffers, settings, format json) select * from public.example_table;"
```

For `INSERT`, `UPDATE`, `DELETE`, `MERGE`, `CREATE TABLE AS`, or `EXECUTE`, roll back
unless the diagnostic intentionally writes data:

```bash
psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
begin;
set local statement_timeout = '30s';
explain (analyze, buffers, wal, summary)
update public.example_table set processed = true where processed = false;
rollback;
SQL
```

## Interpret Before Tuning

Compare estimated versus actual rows at each important node. Large divergence commonly
points to stale or insufficient statistics, data skew, correlation, or a query predicate
the planner cannot estimate well. Inspect plan shape and joins before proposing an index.

`BUFFERS` shows shared, local, and temporary block use. A shared block hit avoided a data
file read; high reads, temp blocks, or WAL can identify a different bottleneck than CPU.
When `track_io_timing` is enabled, buffer output can also include I/O time. Record the
PostgreSQL version, relevant planner settings, parameter values, table cardinalities, and
cache conditions with any before/after conclusion.

After a substantial data change, confirm that normal autovacuum/analyze behavior is
adequate before changing a query or index. Do not run manual `ANALYZE` or alter planner
configuration in a shared environment without the authority required by the repo.

## Functions And Procedures

Functions are invoked with `SELECT`; procedures are invoked with `CALL`.

```bash
psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 \
  -c "explain (analyze, buffers, summary) select public.compute_example_score(42);"
```

For a procedure that writes:

```bash
psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
begin;
set local statement_timeout = '30s';
explain (analyze, buffers, wal, summary)
call public.refresh_example_rollup(42);
rollback;
SQL
```

An outer plan may show a PL/pgSQL routine as one node. For statements inside the routine,
use session-scoped `auto_explain` with nested statements in a safe environment, existing
`pg_stat_statements` evidence, or `pg_stat_user_functions` when `track_functions` is
already enabled. Do not change those server settings solely for an exploratory request.

## Sources

- [PostgreSQL `EXPLAIN`](https://www.postgresql.org/docs/current/sql-explain.html)
- [PostgreSQL performance tips](https://www.postgresql.org/docs/current/performance-tips.html)
