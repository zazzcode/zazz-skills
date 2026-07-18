# Live Activity, Locks, And Log Analysis

Use this reference for an active incident or operational investigation. These probes are
read-only. Do not cancel or terminate a backend, reset statistics, alter logging, or
install a monitoring tool unless the user explicitly authorizes that action and the repo
or operating procedure permits it.

## pg_stat_activity And Locks

Use `pg_stat_activity` to inspect active sessions, state, waits, and query age. Query text
can contain sensitive values; truncate and redact it before sharing.

```bash
psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 -x \
  -c "select pid, usename, application_name, state, wait_event_type, wait_event,
             now() - query_start as query_age, left(query, 500) as query
      from pg_stat_activity
      where state <> 'idle'
      order by query_start nulls last;"
```

Use `pg_blocking_pids` to show blockers without reimplementing lock matching:

```bash
psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 -x \
  -c "select a.pid as blocked_pid, pg_blocking_pids(a.pid) as blocking_pids,
             a.usename as blocked_user, a.wait_event_type, a.wait_event,
             now() - a.query_start as query_age, left(a.query, 500) as blocked_query
      from pg_stat_activity a
      where cardinality(pg_blocking_pids(a.pid)) > 0
      order by a.query_start;"
```

Investigate the blocking PID's state, transaction age, application name, and query before
recommending action. Report the evidence and escalation path; do not infer that the
longest-running query is necessarily the root cause.

## pg_activity

[`pg_activity`](https://github.com/dalibo/pg_activity) is an optional third-party,
top-like terminal monitor for PostgreSQL activity. Use it only if it is already installed
or the user explicitly authorizes installation. It is useful for short-lived interactive
observation; capture a timestamped, redacted textual finding for the durable execution
record rather than treating the screen as evidence by itself.

```bash
pg_activity -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" "$DB_NAME"
```

Do not put passwords in the command line. Use the repo's connection mechanism, `.pgpass`,
or a service file when permitted.

## pgBadger

[`pgBadger`](https://github.com/darold/pgbadger) is an optional third-party PostgreSQL-log
analyzer that generates HTML reports. It is useful for historical slow-query and traffic
analysis, but logs can contain SQL text, values, user names, addresses, and other sensitive
data. Do not upload logs or generated reports to an external service, commit them to the
repo, or install pgBadger without explicit authorization.

Example local-only shape after confirming a sanitized log copy and an approved output path:

```bash
pgbadger -o /approved/output/postgresql-report.html /approved/input/postgresql.log
```

Record the log time range, PostgreSQL logging configuration, filters/redaction, and any
sampling limitations. Use a report to identify candidates, then validate an individual
query with `EXPLAIN` or existing `pg_stat_statements` evidence before proposing a change.

## Sources

- [PostgreSQL monitoring statistics](https://www.postgresql.org/docs/current/monitoring-stats.html)
- [`pg_activity`](https://github.com/dalibo/pg_activity)
- [`pgBadger`](https://github.com/darold/pgbadger)
