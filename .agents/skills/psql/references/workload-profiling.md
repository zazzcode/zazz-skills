# Workload Profiling, Slow Plans, And Benchmarking

Use this reference for workload-wide evidence rather than one known query. Prefer
existing telemetry. Extension installation, shared configuration, statistics resets, and
benchmark initialization require explicit approval and a non-production target.

## pg_stat_statements

`pg_stat_statements` aggregates planning and execution statistics for normalized SQL
statements. It requires server-side setup: the module must be in
`shared_preload_libraries`, which requires a restart, and the extension must be enabled
in the database. Query identifiers must also be available. Treat setup as DBA-owned
configuration, not an agent diagnostic action.

Check whether the extension is already available:

```bash
psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 -A -t \
  -c "select extversion from pg_extension where extname = 'pg_stat_statements';"
```

Inspect the available columns before relying on a version-specific query:

```bash
psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 -c '\d+ pg_stat_statements'
```

On current PostgreSQL versions, rank existing observations by total execution time:

```bash
psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 -x \
  -c "select query, calls, round(total_exec_time::numeric, 2) as total_ms,
             round(mean_exec_time::numeric, 2) as mean_ms, rows,
             round(100.0 * shared_blks_hit /
                   nullif(shared_blks_hit + shared_blks_read, 0), 2) as hit_percent
      from pg_stat_statements
      order by total_exec_time desc
      limit 10;"
```

Rank high-latency statements separately so a rare slow statement is not hidden by a
frequent inexpensive one:

```bash
psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 -x \
  -c "select query, calls, round(mean_exec_time::numeric, 2) as mean_ms,
             round(max_exec_time::numeric, 2) as max_ms, rows
      from pg_stat_statements
      where calls > 0
      order by mean_exec_time desc
      limit 10;"
```

Never reset `pg_stat_statements` through this skill. A reset destroys shared diagnostic
evidence and is a human-only operation under the skill's destructive-operations gate.

Never mistake a high cache-hit percentage for a complete performance diagnosis. Pair a
candidate statement with plan evidence, call frequency, rows, temporary I/O, and a
representative workload.

## auto_explain

Use `auto_explain` to log plans for slow application-issued statements, especially SQL
inside functions or procedures. It has overhead; persistent server configuration and
production log changes require DBA approval. Prefer a session-scoped experiment in an
isolated test environment when permissions allow it.

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

Use `log_timing = off` when timing overhead would distort the workload and row counts plus
buffer use answer the question. Enable `log_nested_statements` only when routine internals
are the subject. Capture the log destination, retention, and redaction implications
before enabling it.

## pgbench

`pgbench` is PostgreSQL's built-in benchmark client. Its initializer creates and replaces
benchmark tables, and its standard workload writes data. Do not run `pgbench` or its
initializer through this skill. A human database operator may run an approved benchmark
against a disposable target with a documented workload and comparison baseline.

Record PostgreSQL version, machine resources, scale factor, client/job counts, duration,
warm-up behavior, dataset size, configuration, and exact script. Compare like for like;
do not claim a tuning improvement from a single noisy run. Custom scripts must represent
the target workload and must be reviewed like any other executable test artifact.

## Sources

- [PostgreSQL `pg_stat_statements`](https://www.postgresql.org/docs/current/pgstatstatements.html)
- [PostgreSQL `auto_explain`](https://www.postgresql.org/docs/current/auto-explain.html)
- [PostgreSQL `pgbench`](https://www.postgresql.org/docs/current/pgbench.html)
