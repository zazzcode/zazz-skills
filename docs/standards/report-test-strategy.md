---
last_updated_at: 2026-06-13
---

# Report test strategy

This standard governs how the **test batteries for migrated reports** are sized and selected: which cases run, how
many, and how fast the whole set is. It applies to every report under `backend/tests/svc/reports/`,
`backend/tests/data/sprocs/test_app_Report*.py`, and `backend/database/sql_migrations/tests/` for report stored
procedures.

It exists because the report subsystem is large and growing (dozens of reports, each adding its own SQL, DB-wrapper,
and document test batteries). A per-test time cap does not bound the suite — many reports each running "a few seconds"
is what makes the suite unusable. These rules keep each report's batteries **functionally complete but collectively
fast**.

General test rules still apply: load [python-testing.md](./python-testing.md) for layout/markers and
[reports.md](./reports.md) for report specifics **alongside** this document.

## Budget is per-report-aggregate, not per-test

A `≤ 10 s` per-test cap is necessary but not sufficient. The binding constraint is the **total** runtime of a report's
DB-touching battery at each layer. Size the *set*, not each test: a report's DB-wrapper battery (the `data/sprocs`
tests that call the real stored procedure) should complete in a small number of seconds total, because that cost is
paid once per report and the suite carries dozens of reports.

When a battery is too slow, the fix is **fewer/smaller inputs** (next section) — never a larger per-test timeout, and
never moving the cost behind a gate.

## Choose a minimal, data-coverage-driven input set

The unit of work is **data-shape coverage**, not one test per rule. Pick the fewest
`(report, CustomerSegment, year, month)` inputs whose underlying **data** exercises every functional variation the layer
must prove (e.g. all-zero rows, negatives/credit memos, current-vs-prior true-ups, YTD/period supersets, name
truncation, empty windows, multi-result-set shape, ordering). No single case usually carries every variation — choose a
small set whose *union* is complete, and prefer small/fast cases for the variation they uniquely add.

Inputs are **not** limited to legacy reference fixtures: any CustomerSegment and period in the database is a candidate.
Scan the actual data (fixtures or the DB) to learn which inputs carry which variation, then cover the union. State the
**dimension → case mapping** so a reviewer can see the coverage is complete and the case count is justified.

### Desired

```text
# 2 always-on cases, union covers every variation, ~2.5 s total
Segment A — negatives, prior-period netting, YTD-only vendors, name truncation, 3 result sets
Segment B — all-zero rows, current/prior split, penny parity
```

### Not desired

```text
# 5 cases "to be safe": 3 add no new variation, double the runtime, more fixtures to maintain
Segment A, Segment B, Segment C, Segment D, Segment E
```

## No environment-variable gates

A committed test either runs by default or it does not exist. Do not hide cases behind an opt-in env var (e.g. a
`RUN_ALL=1` switch): gated coverage is coverage that will not run in CI and that reviewers cannot see. If a case is
worth keeping, it is worth running every time; if it is not, delete it. Reference data that is not a committed test
belongs in a reference artifact, not in a skipped/gated test.

## Keep functional batteries purely functional — load and latency live elsewhere

Functional batteries (SQL rules, DB-wrapper, document/JSON generation) assert **correctness** only. They never carry
load or latency assertions, and they never add a heavy or large-cardinality case to "also check performance."
Performance is a separate track:

| Testing type                   | Where it runs                              | When                                     |
| ------------------------------ | ------------------------------------------ | ---------------------------------------- |
| **Load testing**               | database-level performance-tuning sessions | while tuning query/SP/TVF plans          |
| **Latency & load-performance** | the **API layer**                          | **after** the database queries are tuned |
| **Functional / correctness**   | every layer                                | always; no load or latency assertions    |

A slow functional case is a signal to pick a smaller input or hand the concern to the perf track — not to widen the
functional test.

## Don't re-prove the same fact at multiple layers

Each layer proves what only it can, so the batteries stay small:

- **SQL rules (tSQLt)** — the stored procedure's own behavior against seeded data: result-set shape, ordering, return
  codes. Because the real-SP error paths (no-rows, invalid lookup) live here, higher layers do not need DB round-trips
  to re-prove them.
- **DB wrapper (`data/sprocs`)** — the Python binding walking the real SP's result sets and mapping return codes, plus
  value parity against the oracle. Routing the value-parity case through the binding lets one DB round-trip prove
  wiring **and** values.
- **Document / JSON generation (`svc/reports`)** — pure-Python shaping (totals, footer math, ordering, formatting) is
  unit-tested with synthetic rows (no DB); DB-backed convergence cases only add real-mapping coverage, not a re-run of
  builder logic.

## Related standards

- [python-testing.md](./python-testing.md) — test layout, the `db` marker, and the fixture-matrix convergence pattern
- [reports.md](./reports.md) — report-specific rules (legacy-parity contract, PDF byte determinism, shared `cases.py`)
- [database-testing.md](./database-testing.md) — tSQLt conventions for the SQL-rules layer
