# PR Review Skill — User Guide

How to use and adapt the **pr-review** skill for Zazz methodology pull request review.

## What It Does

The PR Review skill reviews a pull request, branch, or local diff along two independent axes using parallel sub-agents:

- **Standards axis** — does the code conform to documented coding standards, test patterns, and architectural
  conventions?
- **Spec axis** — does the code faithfully implement the originating specification, issue, or stated intent?

Reporting the axes separately prevents one from masking the other: code that follows every standard but implements the
wrong thing is caught as a Spec failure. Code that does exactly what the issue asked but breaks the project's
conventions is caught as a Standards failure.

The skill also looks for common agent-generated clutter:

- low-value or duplicate tests
- mock-heavy tests that do not prove behavior
- unrealistic edge-case permutations
- redundant helpers or parallel implementations
- speculative abstractions
- noisy comments, formatting churn, and broad unrelated rewrites
- duplicated runtime computation across layers or seams

Actor boundary:

- `pr-builder` drafts or updates the PR title/body from the author's evidence.
- `pr-review` inspects the code, tests, evidence, and standards alignment. It may run on the author's own draft branch
  or on someone else's submitted PR.

The skill does not approve, merge, mark a PR ready, or replace human judgment.

## File Structure

```text
.agents/skills/pr-review/
  SKILL.md              # Orchestrator: startup, pinning, optional utility loading, dispatch
  README.md             # This file
  code-review-graph.md  # Optional graph-context utility workflow
  shared-rules.md       # Diff scope, finding sizing, output format, boundaries
  standards-axis.md     # Standards sub-agent brief
  spec-axis.md          # Spec sub-agent brief
```

- **SKILL.md** orchestrates the review: reads repo context, pins the comparison base, optionally loads utility
  guidance, gathers governing context, determines spec availability, dispatches the two sub-agents in parallel, and
  aggregates their findings.
- **code-review-graph.md** describes the optional graph-context workflow: discovery, user consent for setup, compact
  graph queries, and the summary passed to sub-agents.
- **shared-rules.md** contains rules both sub-agents need: diff scope discipline, the geological finding-sizing
  taxonomy, security/data/operations escalation, output format, and boundaries.
- **standards-axis.md** is the full brief for the Standards sub-agent: standards-driven review, test quality, agentic
  slop, and redundant computation checks.
- **spec-axis.md** is the full brief for the Spec sub-agent: methodology checks with three tiers of behavior depending
  on spec availability.

Keep skill modules incrementally discoverable. If a `SKILL.md` or companion module grows past 400 lines, split it by
task or sub-feature; past 600 lines, the split is blocking before review approval. The entry point should stay as
orchestration and load only the task-specific file needed for the current review.

## When To Use It

Use this skill when:

- an implementation branch is ready for author-side review
- a draft PR needs cleanup before the Owner marks it ready
- an AI-generated or agent-assisted PR has grown large enough that the human wants the agent to understand it first
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

The orchestrator starts small, then loads more context only when the diff needs it.

1. `AGENTS.md` for docs-root, integration branch, workflow, and review conventions.
1. The review target: working tree diff, branch diff, PR, or stack branch.
1. **Pin the comparison base** — `git merge-base` against the fixed point, so both sub-agents use an identical diff
   reference even if the integration branch advances.
1. **Size the diff and prefer graph context for large reviews** — count changed files from the pinned diff. If the
   count is greater than 10, or the user requested graph, blast-radius, or token-efficient review, load
   `code-review-graph.md` and follow its discovery/setup flow.
1. Governing context: deliverable specification, PR body, linked ticket, and ACs.
1. **Determine spec availability** — full spec, lightweight spec, or no spec.
1. `<DOCS_ROOT>/standards/index.yaml` — select only the standards matching the changed paths and activities.
1. Dispatch both sub-agents with their respective briefs.

This keeps the skill generic while letting each repo provide its own standards.

## Optional Graph Utility

The skill can optionally use [`code-review-graph`](https://github.com/tirth8205/code-review-graph) for graph-derived
blast radius, impacted callers/dependents, affected flows, test-coverage signals, and lower-token review context for
large diffs.

Sizing and context-loading boundary:

- Do not load `code-review-graph.md` during ordinary reviews with 10 or fewer changed files unless graph context is
  requested.
- Load `code-review-graph.md` for PRs with more than 10 changed files so the agent can prefer compact graph-derived
  review context before reading broad file contents.
- Keep the detailed agent workflow in `code-review-graph.md`.
- Keep human install, setup, troubleshooting, and update checks in `docs/code-review-graph.md` or
  `.zazz/docs/code-review-graph.md` when that project doc exists.
- For Zazz review, prefer minimal CLI/MCP setup. Do not install upstream companion skills, hooks, or instruction
  injections unless the user explicitly asks for full upstream integration.
- Treat graph output as advisory context. Findings still need to be verified against the actual diff, source, tests,
  standards, and spec.

Useful public companion skills in the `code-review-graph` repository include `review-pr`, `review-delta`,
`review-changes`, `build-graph`, `explore-codebase`, `debug-issue`, and `refactor-safely`. The PR Review skill does not
replace itself with those skills or install them by default; it borrows their graph-first context-gathering workflow
when available.

### Simple Graph Gate

Use the pinned diff to decide whether graph context should be loaded:

```bash
git diff $MERGE_BASE...HEAD --name-only | wc -l
```

- `0-10` changed files: skip graph context unless the user asks for graph or blast-radius review.
- `11+` changed files: load `code-review-graph.md`; if the tool is unavailable, tell the user it is recommended for a
  PR of this size and ask whether to install/configure it, use an existing install, or continue without it.

## Spec Availability Tiers

The orchestrator classifies the spec situation before dispatching:

- **Tier 1 — Full spec**: a deliverable specification, PRD, or detailed issue with acceptance criteria. The Spec axis
  reviews with full methodology checks.
- **Tier 2 — Lightweight spec**: a PR description, brief issue, or user-stated intent only. The Spec axis reviews
  against it but flags findings as lower-confidence.
- **Tier 3 — No spec**: nothing found. The Spec axis runs in reduced mode (checking for obvious contradictions with the
  PR body) or is skipped entirely if there is no usable context. Noted as residual review risk.

## Customizing Review Guidance

Team- and repo-specific review policy should live in `<DOCS_ROOT>/standards/`, not in the generic PR Review skill.

Use the standards directory for rules such as:

- frontend component patterns
- browser accessibility expectations
- API response shape and validation semantics
- auth/authz and tenant-boundary rules
- database migration safety
- fixture and test-data conventions
- logging, metrics, and operational requirements
- generated artifact and schema review rules

The standards index should make those files discoverable by changed path, language, service, domain, or activity. A
useful index entry normally answers:

- which paths or file globs it applies to
- which activity tags it covers, such as `frontend`, `api`, `database`, `auth`, or `testing`
- which standards file to read
- any special review notes or required evidence

Keep standards concrete and repo-specific. The generic skill describes how to review; standards describe what this repo
expects.

## Test Review Philosophy

The skill should push for stronger evidence, not more tests by default.

Good PR review asks:

- Do the tests prove the acceptance criteria?
- Do they cover realistic field edge cases?
- Could a shared setup, shared payload, parameterized test, or table-driven test cover the same scenarios more clearly?
- Is existing coverage already sufficient?
- Are tests asserting observable behavior rather than private mechanics?
- Would these tests fail for bugs the team actually cares about?

Reviewers should flag both under-testing and test clutter. The goal is compact, meaningful coverage. Irrelevant
permutations or coverage-padding tests should be treated as review noise unless they prove a real requirement, defect,
boundary, or risk. This includes unreasonable precondition tests that do not reflect the public contract, such as
testing an update path without the record ID required to address the record.

## Improving The Skill

Improve repo standards first when the desired behavior is repo-specific. Improve the generic skill when the behavior
should apply across Zazz methodology repos.

Good candidates for repo standards:

- "Our React forms use this validation pattern."
- "Our migrations must include rollback notes and data-volume estimates."
- "Our API errors must use this envelope."
- "Our fixtures must come from these builders."

Good candidates for the generic skill:

- better review severity definitions → `shared-rules.md`
- better progressive-loading or dispatch rules → `SKILL.md`
- broader standards-review guidance → `standards-axis.md`
- clearer test-quality heuristics → `standards-axis.md`
- better spec-compliance checks → `spec-axis.md`
- better output formatting expectations → `shared-rules.md`

When adding generic guidance, keep each file focused on its axis. The orchestrator (`SKILL.md`) handles flow control;
the axis briefs handle review substance.

## Output Expectations

The review leads with findings under two separate headings: **Standards Review** and **Spec Review**. Each axis reports
independently — findings are not merged or reranked across axes.

Each finding is a copy-paste-able PR-comment code block that **starts with its size tag** (`[boulder]` / `[rock]` /
`[pebble]` / `[sand]`), then the `file:line` and a one-line problem statement, then why it matters (naming the violated
standard or spec requirement) and a concrete remediation.

Only `[boulder]` and `[rock]` block approval; `[pebble]` and `[sand]` are the author's discretion. Any blocking finding
from *either* axis means the PR is not approvable.

If both axes flag the same `file:line`, the aggregator notes the overlap as a signal that the issue is particularly
important.

The review ends with a summary: per-axis finding counts, a combined approval verdict, and any residual risk (standards
not found, spec gaps, tests not run).
