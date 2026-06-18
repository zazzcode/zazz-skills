---
last_updated_at: 2026-06-10
---

# Reports

This standard governs the report subsystem: `backend/src/svc/reports/` (registry, orchestrator, per-report
service/document/renderer modules), the report CLI (`backend/scripts/generate-report.py`), the report HTTP routes
(`backend/src/http_api/v1/report/`), and report tests under `backend/tests/svc/reports/`.

It holds only rules unique to reports. Report work also falls under the general standards for the files being touched —
load [service-layer.md](./service-layer.md) for service code, [python-testing.md](./python-testing.md) for tests, and
[http-layer.md](./http-layer.md) for routes **alongside** this document, not instead of it.

## Architecture: one document, many renders

Each report is a vertical slice: registry entry → orchestrator (`run_report()`) → per-report service → document builder
→ renderer(s). The service produces one canonical document dict per generation; the JSON output and the PDF render both
consume that same document. Document builders are pure Python — no DB calls, no rounding — so they unit test without a
database. Re-deriving in a renderer what the document already holds is the compute-once violation described in
[code-structure.md](./code-structure.md#compute-once-return-many).

## Legacy parity is the contract

Migrated reports must match their legacy Access references row-for-row. Three rules follow:

- **Line order is load-bearing.** The rendered row order must match the legacy reference exactly. Ordering signals —
  stored-procedure `SortOrder` encodings and document-side tiebreaks — are part of the verified contract. Do not remove
  or "simplify" ordering logic without re-running the full parity evidence, even when the encoding looks complete
  enough to make it redundant: collisions can be real in the data (e.g. a sort key that encodes production month but
  not production year collides across years in YTD mode)
  (review precedent).
- **Rounding is ROUND_HALF_UP everywhere.** Access's `RoundToNearest()` rounds halves away from zero. Python's default
  `Decimal` banker's rounding (`ROUND_HALF_EVEN`) is forbidden in report formatters, and formatter unit tests must
  include a midpoint case where the two modes diverge (e.g. `4.385`) so a silent revert fails.
- **Convergence is byte-equal.** Each report locks one JSON fixture per reference case, and DB-backed convergence tests
  assert byte equality against them (the matrix pattern in
  [python-testing.md](./python-testing.md#unit-tests-for-display-and-data-shaping-logic)). Formatting may differ from
  the legacy PDF; values and ordering may not.

## Registry and style contract

Renderers receive the style as a required second argument — no hidden style defaults inside renderer modules. The
orchestrator passes the registry's `default_pdf_style` explicitly, so the registry entry is the single place a report's
production style is declared. Reports with a single layout register the explicit `"default"` style and ignore the
argument (review precedent;
follow-up).

## Report query timeouts

Report generation is completion-critical: a report that runs longer than expected must still finish and return its
result. Standard request-path queries use a short timeout (the `timeout_seconds` default) because fast endpoints want
fast failure; report queries must not share it.

- Every report execution path — CLI scripts, HTTP report routes, background workers — runs its report on a connection
  with a report-scoped query timeout set much longer than the request-path default. The CLI's
  `_REPORT_QUERY_TIMEOUT_SECONDS` override in `scripts/generate-report.py` is the canonical example. A report path that
  reads the default connection factory is a bug even if every current report happens to finish inside the default — the
  heaviest customer groups are what the override exists for
  (review precedent).
- The worst-case report runtime target is ~15 seconds. A report exceeding the target is a performance problem to fix at
  the source — stored-procedure tuning, or more database resources in AWS — never by letting a timeout kill the query.
  Completion wins over latency.
- Do not trim a report timeout down toward the currently observed worst case. Headroom is the point: the timeout exists
  to catch genuine hangs, not to enforce the performance target
  (review precedent).

## Report tests

General test rules live in [python-testing.md](./python-testing.md); the following are report-specific.

Measure report durations with the real CLI (`scripts/generate-report.py`), which exercises the full chain and writes
actual PDF files — not pytest timings, which mix in fixture setup, transaction overhead, and collection costs.

### PDF byte assertions require ReportLab invariant mode

ReportLab embeds a per-call creation timestamp and document ID in every PDF, so two renders of the same document are
never byte-equal by default. A test asserting `render(doc) != render(doc, style="other")` proves nothing — two renders
of the *same* style also differ — and `render(doc) == render(doc)` fails outright. Pin determinism with
`reportlab.rl_config.invariant = 1` before any byte-level comparison
(review precedent).

#### Desired

```python
def test_api_default_renders_lite_grid(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(reportlab.rl_config, "invariant", 1, raising=False)
    result = run_report(...)
    assert result.pdf_bytes == render_report_pdf(result.document, pdf_style="lite-grid")
    assert result.pdf_bytes != render_report_pdf(result.document, pdf_style="ruled")
```

#### Not desired

```python
# Proves nothing: the embedded timestamp/ID makes ANY two renders differ,
# so this passes even if both calls produce the same layout.
assert render_report_pdf(doc) != render_report_pdf(doc, pdf_style="ruled")
```

### Shared case-matrix modules

Parametrize data shared across a report's test files lives in a plain data module next to the tests (e.g. a `cases.py`
holding the case matrix), not copy-pasted per file and not smuggled into `conftest.py`. Such a module is not a test
file, so it needs a scoped `exclude` on the `name-tests-test` hook in `backend/.pre-commit-config.yaml` — exclude the
exact path, not a pattern that pre-authorizes future helper files.

## Related standards

- [service-layer.md](./service-layer.md) — general service rules that report services must also follow, including the
  display-lookup carve-out used by report metadata lookups
- [python-testing.md](./python-testing.md) — test layout, naming, db-marker discipline, and the fixture-matrix
  convergence pattern
- [http-layer.md](./http-layer.md) — route conventions for the report endpoints
- [code-structure.md](./code-structure.md) — compute-once and file-size rules that report modules hit frequently
