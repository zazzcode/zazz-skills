# PR Review Skill — User Guide

How to use and adapt the **pr-review** skill for Zazz methodology pull request review.

## What It Does

The PR Review skill reviews a pull request, branch, or local diff. It can be used by a
PR author during draft cleanup or by a human reviewer evaluating someone else's PR. It is
designed to find real issues first: correctness bugs, missing acceptance-criteria
evidence, scope drift, weak tests, standards violations, security/data risks, and
reviewability problems.

It also looks for common agent-generated clutter:

- low-value or duplicate tests
- mock-heavy tests that do not prove behavior
- unrealistic edge-case permutations
- redundant helpers or parallel implementations
- speculative abstractions
- noisy comments, formatting churn, and broad unrelated rewrites

Actor boundary:

- `pr-builder` drafts or updates the PR title/body from the author's evidence.
- `pr-review` inspects the code, tests, evidence, and standards alignment. It may run on
  the author's own draft branch or on someone else's submitted PR.

The skill does not approve, merge, mark a PR ready, or replace human judgment.

## When To Use It

Use this skill when:

- an implementation branch is ready for author-side review
- a draft PR needs cleanup before the Owner marks it ready
- a human wants a second pass focused on risks and test quality
- a stack branch needs review before submitting or after a rebase
- a PR feels noisy and needs help separating real issues from agentic clutter

Example prompts:

```text
Use pr-review.
Review the current branch against dev and focus on standards conformance, test quality,
and agentic slop.
```

```text
Use pr-review.
Review PR #123 and help me decide what findings to send back to the author.
```

```text
Use pr-review.
This is a backend/database change. Load the relevant standards from docs/standards/index.yaml
and call out any realistic edge cases the tests miss.
```

## How The Skill Chooses Context

The skill should start small, then load more context only when the diff needs it.

Recommended loading order:

1. `AGENTS.md` for docs-root, integration branch, workflow, and review conventions.
2. The review target: working tree diff, branch diff, PR, or stack branch.
3. Governing context: deliverable specification, PR body, linked ticket, and ACs.
4. `<DOCS_ROOT>/standards/index.yaml`.
5. Only the standards selected by the index for the changed paths and activities.
6. Optional domain-specific review notes, if the team has added them.

This keeps the skill generic while letting each repo provide its own standards.

## Customizing Review Guidance

Team- and repo-specific review policy should live in `<DOCS_ROOT>/standards/`, not in
the generic PR Review skill.

Use the standards directory for rules such as:

- frontend component patterns
- browser accessibility expectations
- API response shape and validation semantics
- auth/authz and tenant-boundary rules
- database migration safety
- fixture and test-data conventions
- logging, metrics, and operational requirements
- generated artifact and schema review rules

The standards index should make those files discoverable by changed path, language,
service, domain, or activity. A useful index entry normally answers:

- which paths or file globs it applies to
- which activity tags it covers, such as `frontend`, `api`, `database`, `auth`, or
  `testing`
- which standards file to read
- any special review notes or required evidence

Keep standards concrete and repo-specific. The generic skill should describe how to
review; standards describe what this repo expects.

## Optional Domain References

If a team wants more structured review prompts without bloating `SKILL.md`, add small
reference files under the skill:

```text
.agents/skills/pr-review/
  SKILL.md
  README.md
  references/
    frontend.md
    backend-services.md
    database.md
    async-jobs.md
    auth-security.md
    integrations.md
    generated-artifacts.md
    tests.md
```

These files should be generic attention checklists, not repo policy. For example,
`references/database.md` can remind the reviewer to inspect migrations, rollback risk,
transactions, indexes, and backfills. The repo's actual migration policy still belongs
in `<DOCS_ROOT>/standards/`.

Suggested domain mapping:

- `frontend`, `browser-client`, `accessibility` -> `references/frontend.md`
- `api`, `service`, `backend` -> `references/backend-services.md`
- `database`, `migration`, `persistence` -> `references/database.md`
- `job`, `queue`, `scheduler`, `async` -> `references/async-jobs.md`
- `auth`, `security`, `permissions`, `tenant` -> `references/auth-security.md`
- `integration`, `webhook`, `external-api` -> `references/integrations.md`
- `generated`, `schema`, `lockfile`, `openapi` -> `references/generated-artifacts.md`
- `testing`, `fixtures`, `coverage` -> `references/tests.md`

Only load the reference files that match the changed surface. If the standards index
already provides enough domain guidance, extra references may not be needed.

## Test Review Philosophy

The skill should push for stronger evidence, not more tests by default.

Good PR review asks:

- Do the tests prove the acceptance criteria?
- Do they cover realistic field edge cases?
- Could a shared setup, shared payload, parameterized test, or table-driven test cover the
  same scenarios more clearly?
- Is existing coverage already sufficient?
- Are tests asserting observable behavior rather than private mechanics?
- Would these tests fail for bugs the team actually cares about?

Reviewers should flag both under-testing and test clutter. The goal is compact,
meaningful coverage. Irrelevant permutations or coverage-padding tests should be treated
as review noise unless they prove a real requirement, defect, boundary, or risk. This
includes unreasonable precondition tests that do not reflect the public contract, such as
testing an update path without the record ID required to address the record.

## Improving The Skill

Improve repo standards first when the desired behavior is repo-specific. Improve the
generic skill when the behavior should apply across Zazz methodology repos.

Good candidates for repo standards:

- "Our React forms use this validation pattern."
- "Our migrations must include rollback notes and data-volume estimates."
- "Our API errors must use this envelope."
- "Our fixtures must come from these builders."

Good candidates for the generic skill:

- better review severity definitions
- better progressive-loading rules
- broader generic domain categories
- clearer test-quality heuristics
- better output formatting expectations

When adding generic guidance, keep `SKILL.md` concise. Move optional detail into
reference files so future review agents can load only what they need.

## Output Expectations

The review should lead with findings, ordered by severity. If there are no findings,
it should say so directly and list any residual risk, such as standards not found or
tests not run.

Findings should cite files and lines when possible, name the violated standard when one
applies, explain why the issue matters, and suggest a concrete remediation.
