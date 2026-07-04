# Testing and Validation

Testing and validation prove that the deliverable matches its specification and that the implementation is maintainable under the repo's standards.

## Validation Model

Validation has three layers:

- Acceptance criteria: did the deliverable build the intended behavior?
- Test quality: do the tests honestly prove the behavior and risks?
- Deterministic quality gates: did required linters, formatters, type checks, accessibility checks, doc checks, schema
  checks, and CI gates run and pass?
- Standards conformance: does the implementation fit the repo's engineering conventions, including rules that cannot
  be fully automated?

Passing tests are not enough if the tests do not prove the acceptance criteria.

## Test Strategy

The specification owns the test intent. Implementation may adapt mechanics, but it must not weaken the test contract without owner approval.

Good test strategies:

- map each acceptance criterion to evidence
- prefer behavior-level tests over mock-only plumbing tests
- cover realistic edge cases and regressions
- reuse existing fixtures and helpers
- avoid duplicate or low-signal coverage
- state when existing coverage is intentionally reused

## QA Testing

Use `qa-testing` when a deliverable is ready for independent verification. It verifies acceptance criteria, inspects test quality, runs relevant checks, and produces rework findings or reviewer-ready evidence.

QA should create self-contained rework findings when work fails validation. Each finding should include reproduction steps, expected behavior, actual behavior, relevant files, and suggested verification after repair.

Use fresh-context QA or verifier agents when possible. Each QA agent should focus on a
quality dimension such as functionality, test quality, performance, code hygiene,
security, accessibility, standards conformance, or stacked-branch no-drift. QA agents
read the current specification, execution record, relevant evidence, and focused code
scope; they do not modify code.

If a QA finding changes the contract, route it through [Spec-Driven
Development](./spec-driven-development.md): update the affected spec sections in place,
record an Implementation And Review Change Log entry, and re-verify affected evidence.
If a finding only requires implementation repair, keep it in the RUN_LOG under
`<DOCS_ROOT>/ephemeral/`, the declared tracker/service, or the PR thread.

## Evidence

Useful evidence includes:

- test command output
- linter, formatter, type-check, schema-check, accessibility-check, and doc-check output
- screenshots or browser checks for UI behavior
- API request/response samples
- logs or traces for operational behavior
- performance measurements when thresholds exist
- owner signoff for subjective UX or product requirements

## Relevant Skills

| Skill | How it helps efficiency |
| ----- | ----------------------- |
| `qa-testing` | Independently verifies acceptance criteria, checks evidence quality, identifies rework, and produces reviewer-ready validation notes. |
| `spec-driven` | Routes QA findings into either implementation rework or in-place spec contract updates with change-log entries. |
| `pr-review` | Finds gaps in spec alignment, standards conformance, test quality, and maintainability before human review. |
| `conformance` | Supports small targeted fixes when validation exposes standards drift in a bounded repo area. |
| `doc-check` | Runs repo-local documentation checks for changed methodology, standards, and other docs. |
| `standard-builder` | Helps draft or refine stack-specific standards when validation exposes a repeated quality gap. |
| `psql` | Provides safe PostgreSQL diagnostics for data-backed behavior, performance checks, and query/function profiling. |
| `sqlcmd` | Provides safe SQL Server diagnostics for stored procedures, database tests, timing probes, and read-only data checks. |
| `zazz-board` | Records QA findings, task state, and validation notes when the repo uses Zazz Board. |

## Related Sections

- [Specifications](./specifications.md)
- [Document Storage](./document-storage.md)
- [Spec-Driven Development](./spec-driven-development.md)
- [Deterministic Quality Gates](./deterministic-quality.md)
- [PR Creation](./pr-creation.md)
- [Self-Review](./self-review.md)
