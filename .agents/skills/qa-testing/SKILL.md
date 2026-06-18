---
name: qa-testing
description: Verify a completed change, deliverable, pull request, or local diff against its requirements, acceptance criteria, tests, and project standards. Use when the user wants rigorous QA evidence, test-quality review, rework findings, frontend or backend verification, API collection checks, accessibility checks, performance/security spot checks, or reviewer-ready validation notes.
---

# QA Testing

## Startup Sequence

1. Read `AGENTS.md` or equivalent repo instructions when available. Resolve the docs root, standards index, target branch, test commands, environment rules, and review workflow.
2. Identify the verification target: specification, issue, PR, branch diff, task list, or user-stated acceptance criteria.
3. Load only the standards relevant to the changed files and verification activities. If `<DOCS_ROOT>/standards/index.yaml` exists, use it as the routing table.
4. Map the changed surface to one or more verification lenses: general, API/service, data/persistence, frontend/UI, CLI/batch, performance, security, migration/deployment, or documentation.
5. Run the QA loop with a bug-finding mindset. Do not treat passing tests as sufficient unless they prove the acceptance criteria and realistic risks.

Default to repo-local commands and tooling. Do not install global tools unless the repo explicitly requires it or the user approves it.

## Verification Loop

1. Read the requirement source completely enough to identify every acceptance criterion, explicit non-goal, required test, and owner-signoff item.
2. Inspect the implementation diff and changed files before running broad tests. Note the likely blast radius and any shared contracts touched.
3. Verify each acceptance criterion with evidence. Evidence can be automated test output, command output, API response samples, screenshots, accessibility reports, logs, or manual owner signoff.
4. Review test quality. Tests must prove behavior, not just increase count.
5. Run required tests first, then risk-relevant adjacent tests when shared behavior, migrations, security, compatibility, or user journeys justify them.
6. Record failures as rework findings with reproduction steps, expected vs actual behavior, relevant files, and the criterion or standard violated.
7. Re-run the smallest meaningful verification after each fix. Broaden again before final signoff when the fix touches shared behavior.
8. Produce concise reviewer-ready evidence, including residual risks and anything not run.

## Test Quality Bar

Require tests that protect a public contract, acceptance criterion, regression, invariant, realistic edge case, or named risk. Prefer compact behavior-level tests over many low-signal cases.

Flag tests that:

- assert framework behavior, type-system tautologies, or source-text structure instead of product behavior
- mock so heavily that the tested behavior cannot fail for a real integration bug
- duplicate stronger nearby coverage
- couple to private helper names, incidental call order, temporary markup, or brittle snapshots
- use unrealistic inputs that real callers cannot send
- omit meaningful assertions for response bodies, errors, authorization, persistence, or side effects
- skip migration, fixture, or environment failures that should be fixed or documented
- create broad fixture worlds when a smaller table-driven matrix would prove the same behavior

When the specified test plan is weak, treat that as a requirements gap. Ask the owner to approve a stronger test contract instead of silently accepting easier tests.

## Verification Lenses

Use only the lenses that match the work.

### API And Service

- Validate request and response contracts, status codes, error envelopes, auth/authz, idempotency, pagination, sorting, filtering, and compatibility.
- Exercise real boundaries when practical: HTTP route, RPC contract, message handler, service function, or public SDK entrypoint.
- If API collections exist, prefer repo-pinned runner commands. For Postman collections, `npx newman run ...` is a common no-global-install path. For Hoppscotch collections, `npx @hoppscotch/cli test ...` is a common path. Pin versions when the repo does not already pin them.
- Capture representative request, response, and assertion evidence without leaking secrets.

### Data And Persistence

- Verify schema changes, migrations, seeds, constraints, data compatibility, rollback or forward-only policy, transaction boundaries, and data integrity.
- Prefer test databases or isolated fixtures for destructive checks.
- Confirm migrations and generated artifacts match the repo's source-of-truth policy.
- Check edge cases such as missing rows, duplicate keys, nullability, cross-tenant isolation, time zones, concurrency, and retry/idempotency behavior.

### Frontend And UX

- Verify the user journey at the browser boundary when UI behavior matters.
- Check loading, empty, error, permission, validation, optimistic-update, refresh, and navigation states.
- Inspect accessibility basics: keyboard path, focus management, labels/names, contrast-sensitive states, announcements, and reduced-motion behavior when relevant.
- Cover responsive viewports and screenshot evidence when visual layout or interaction feel is part of the acceptance criteria.
- Use owner signoff for subjective visual, copy, or interaction requirements that cannot be fully automated.

### CLI, Batch, And Background Work

- Verify exit codes, stdout/stderr shape, idempotency, dry-run behavior, config/env loading, file paths, retry behavior, partial failure handling, and cleanup.
- Prefer temp or fixture inputs over live data.
- Include the exact command and relevant output in evidence.

### Performance, Security, And Operations

- Run performance checks only against explicit thresholds or realistic risk signals. Capture method, data size, timing, and environment.
- Check secret handling, permission scope, injection risks, path traversal, SSRF, unsafe deserialization, dependency/CVE changes, audit logs, and personally identifiable data exposure when touched.
- Verify logging and metrics prove useful operational behavior without leaking sensitive values.

## Rework Findings

Each failed item must be self-contained so a fresh implementer can fix it:

- title and severity
- violated acceptance criterion, standard, or risk
- exact reproduction steps or command
- expected behavior
- actual behavior
- relevant files and likely fix area
- evidence captured
- suggested verification after repair

Separate confirmed failures from residual risks. Do not inflate uncertainty into a finding, but do not bury it in a passing summary either.

## Final Evidence

Return:

- pass/fail recommendation
- acceptance-criterion matrix
- tests and checks run, with commands and results
- manual or owner signoff items
- test-quality assessment
- standards and security/performance notes
- rework findings, if any
- residual risks and checks not run

If a PR body or verification artifact needs to be updated, use the repo's normal PR packaging workflow or the `pr-builder` skill when available.
