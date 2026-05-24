---
name: pr-review
description: Review a pull request, branch, or local diff with a bug-finding, methodology-aware stance; use when the user wants draft-PR self-review, reviewer-side PR feedback, standards-guided findings, or cleanup recommendations for tests, agentic slop, redundant code, scope drift, and review readiness.
---

# PR Review Skill

## Mission

Review a PR, branch, or local diff as an automated review pass. It can be used by the PR
author during draft cleanup, or by a human reviewer evaluating someone else's PR. Find
real issues first: correctness bugs, behavioral regressions, missing acceptance criteria,
scope drift, insufficient verification, and maintainability risks. Then call out cleanup
that improves review quality: low-value tests, agentic slop, redundant code, unnecessary
abstractions, noisy comments, and boilerplate that obscures the change.

Actor boundary:

- `pr-builder` drafts or updates the PR title/body from the author's evidence.
- `pr-review` inspects the code, tests, evidence, and standards alignment. It may run on
  the author's own draft branch or on someone else's submitted PR.

This skill does not approve, merge, mark a PR ready, or replace human judgment.

## Startup Sequence

1. Read `AGENTS.md` for repo-specific review workflow, docs root, standards, target
   branch, and tracking conventions when available.
2. Identify the review target:
   - a GitHub PR URL/number
   - the current draft branch against the integration branch
   - another author's branch against the integration branch
   - a stack branch or dependent PR
   - a local diff before a PR exists
3. Gather governing context when present:
   - deliverable specification or external specification record
   - PR body and linked work item
   - acceptance criteria and test plan
   - relevant standards from `<DOCS_ROOT>/standards/index.yaml`
4. Load the standards index from the repo's docs root, usually
   `<DOCS_ROOT>/standards/index.yaml`, and select the standards that match the changed
   file paths and activity. Treat those standards as the primary review guidance for
   code style, architecture, testing, security, accessibility, data, and operational
   expectations.
5. Inspect the diff, changed tests, and verification evidence. Prefer commands that
   compare against the declared integration branch.
6. Run targeted tests or static checks only when they are necessary and reasonable for
   the review. If not run, state that clearly.
7. Produce findings ordered by severity, with file/line references when possible.

## Review Priorities

Lead with actionable findings, not a summary. Use this severity order:

- **P0** — data loss, security vulnerability, production outage, or broken core flow
- **P1** — acceptance criterion not met, clear regression, unsafe migration, broken
  contract, missing required auth/authz, or serious test gap
- **P2** — maintainability, edge-case, scope, reliability, or reviewability issue that
  should be fixed before merge
- **P3** — cleanup or polish that improves clarity but should not block unless repeated
  enough to obscure the PR

Only include findings with a concrete remediation path. Avoid vague comments such as
"consider refactoring" unless the current code creates a real review or maintenance
problem.

## Methodology Checks

When a deliverable specification exists, verify:

- each changed behavior maps to scope, decisions, ACs, or an approved revision
- each AC has matching evidence in tests, commands, or manual verification
- no files outside the specification's scope changed without explanation
- implementation stayed inside hard constraints and invariants
- run-log or external execution notes are updated when the specification requires them
- PR body links the governing specification/work item and accurately reports evidence

If there is no specification, review against the user's stated intent, PR description,
issue context, and local standards. Do not invent missing requirements.

## Standards-Driven Review

Zazz methodology repos are expected to store durable review guidance in
`<DOCS_ROOT>/standards/`, indexed by `<DOCS_ROOT>/standards/index.yaml`. Use that index
heavily:

- match changed files to standards by path, language, service, feature area, or activity
  using the index's declared rules
- read only the standards relevant to the diff
- cite the applicable standard when a finding depends on repo policy rather than general
  engineering judgment
- verify the PR did not miss a standard that should have been prescribed by the
  deliverable specification
- check that tests follow the repo's test patterns, fixture rules, data-safety rules,
  and evidence requirements
- distinguish standards violations from optional cleanup

If the standards index is missing, stale, or does not cover a changed area, state that
as residual review risk instead of inventing a policy. General review judgment still
applies, but repo standards win when they are explicit.

## Test Quality Review

Look for test value, not test volume. Flag tests when they clutter the PR without
meaningfully increasing confidence.

High-value tests usually:

- prove an AC, invariant, public contract, realistic edge case, regression, or named risk
- fail for a bug a reviewer would care about
- assert observable behavior at a stable boundary
- reuse existing fixtures/helpers and mirror nearby patterns
- consolidate related edge cases with a shared setup, shared payload, table, or
  parameterized matrix when that preserves the same behavior coverage with less noise
- cover realistic field boundaries such as invalid, empty, maximum/minimum, unauthorized,
  cross-tenant, missing-data, ordering, time-zone/date, idempotency, or concurrency cases
  when those risks apply

Low-value tests to flag:

- duplicate coverage already provided by a stronger nearby test
- mock-only tests that mostly assert a collaborator was called
- tests coupled to private helper names, incidental call order, or temporary structure
- snapshots or golden files that create churn without clear human-readable assertions
- unrealistic edge-case permutations that cannot occur through supported inputs or
  repo-declared data flows
- unreasonable precondition tests, such as checking update behavior without the target
  record ID when the public update route requires that ID to address the record
- broad coverage-padding tests that do not map to a meaningful behavior or risk
- excessive layer duplication where one integration/contract test would cover the same
  behavior more honestly
- many single-scenario tests that could be consolidated into fewer tests with equivalent
  coverage and clearer intent

Recommended review wording:

- "This test appears redundant with `X`; keeping both adds maintenance without covering
  a distinct contract. Consider deleting this one or changing it to cover `Y`."
- "This mostly verifies mocked plumbing. A behavior-level assertion at `X` would better
  protect the AC and be less brittle."
- "The case matrix is useful, but the setup repeats the same fixture world four times;
  table-driving it would reduce PR noise while preserving coverage."
- "These ten tests appear to exercise the same behavior boundary with slightly different
  payloads. Consider consolidating them into a smaller table or shared-payload test if it
  preserves the same coverage."

## Agentic Slop And Redundancy

Flag patterns that often appear in agent-generated diffs and make the codebase worse:

- duplicated helpers, constants, fixtures, or type definitions instead of reusing local
  patterns
- new abstraction layers that wrap one call site without reducing complexity
- generic utility names that hide domain meaning
- defensive branches for impossible states without a caller contract or test
- comments that narrate obvious code rather than explaining a real constraint
- broad rewrites, formatting churn, or import churn unrelated to the deliverable
- parallel implementations of existing behavior
- dead compatibility paths, unused options, or speculative extension points
- error handling that catches too broadly, swallows useful context, or invents
  inconsistent response shapes

Be specific about why the issue matters: review noise, future maintenance, hidden bug,
or divergence from established project patterns.

## Security, Data, And Operations

Escalate findings when the diff touches:

- authentication, authorization, tenant/project boundaries, or secrets
- persistence, migrations, destructive actions, idempotency, or transactions
- external API contracts, webhooks, background jobs, queues, or scheduled work
- logging, metrics, error reporting, or operational recovery paths
- generated artifacts, schema files, lockfiles, or large fixture changes

For these areas, review both code and tests. A passing happy path is not enough.

## Output Format

Use the standard code-review shape:

1. Findings first, ordered by severity.
2. Open questions or assumptions.
3. Brief summary only after findings.
4. Verification performed or not performed.

Each finding should include:

- severity
- concise title
- file and line reference when available
- why it matters
- suggested remediation

If there are no findings, say so clearly and mention residual risk or tests not run.

## Boundaries

- Do not approve or merge.
- Do not rewrite the PR unless the user asks for fixes.
- Do not block on missing context if the diff can still be reviewed honestly; state the
  assumption.
- Do not pad the review with style nits. Prefer silence over low-confidence criticism.
- Do not require more tests by default. Require better evidence where the current
  evidence does not prove the behavior.
