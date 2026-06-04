---
name: pr-review
description: Review a pull request, branch, or local diff along two independent axes — Standards (does the code follow documented coding standards?) and Spec (does the code match what was asked for?) — using parallel sub-agents; use when the user wants draft-PR self-review, reviewer-side PR feedback, standards-guided findings, or review readiness assessment.
---

# PR Review Skill

## Mission

Review a PR, branch, or local diff as an automated review pass along two independent axes:

- **Standards** — does the code conform to documented coding standards, test patterns, and architectural conventions?
- **Spec** — does the code faithfully implement the originating specification, issue, or stated intent?

Both axes run as **parallel sub-agents** so they don't pollute each other's context, then this skill aggregates their
findings. Reporting them separately prevents one axis from masking the other: code that follows every standard but
implements the wrong thing is a Spec failure, not a pass. Code that does exactly what the issue asked but breaks the
project's conventions is a Standards failure, not a pass.

It can be used by the PR author during draft cleanup, or by a human reviewer evaluating someone else's PR.

Actor boundary:

- `pr-builder` drafts or updates the PR title/body from the author's evidence.
- `pr-review` inspects the code, tests, evidence, and standards alignment. It may run on the author's own draft branch
  or on someone else's submitted PR.

This skill does not approve, merge, mark a PR ready, or replace human judgment.

## Startup Sequence

### 1. Read Repo Context And Discover Standards

Read `AGENTS.md` (or `CLAUDE.md`) for repo-specific review workflow, docs root, standards, target branch, and tracking
conventions when available.

**Standards discovery cascade** — resolve the docs root and standards index using this order. Stop at the first hit:

1. `AGENTS.md` or `CLAUDE.md` declares a docs root (e.g., `docs/`) → look for `<docs-root>/standards/index.yaml`.
1. The environment variable `ZAZZ_DOCS_ROOT` is set → use its value as the docs root.
1. Convention: check `docs/standards/index.yaml` at the repo root.
1. If none of the above finds a standards index, ask the user: "I couldn't find a standards index. Where are your
   coding standards (a directory path), or should I run without standards-driven review?"

Record the resolved docs root and standards index path. If no standards are available, the Standards axis still runs
using general engineering judgment but notes the gap as residual risk.

**Integration branch discovery** — resolve using this order:

1. `AGENTS.md` declares the integration/target branch.
1. Convention: check for `dev`, then `main`, then `master`.
1. If ambiguous, ask the user.

### 2. Identify The Review Target

Determine what is being reviewed:

- a GitHub PR URL/number
- the current draft branch against the integration branch
- another author's branch against the integration branch
- a stack branch or dependent PR
- a local diff before a PR exists

### 3. Pin The Comparison Base

Establish the fixed point for the diff. Whatever the user said is the fixed point — a commit SHA, branch name, tag,
`main`, `HEAD~5`, etc. Don't be opinionated; pass it through.

If they didn't specify one, ask: "Review against what — a branch, a commit, or the integration branch?" Don't proceed
until you have it.

Once established, pin the merge base:

```bash
MERGE_BASE=$(git merge-base <fixed-point> HEAD)
```

All diff commands in both sub-agents use this identical pinned base. This prevents drift if the integration branch
advances between when the two sub-agents start. Capture:

- **Diff command:** `git diff $MERGE_BASE...HEAD`
- **Commit list:** `git log $MERGE_BASE..HEAD --oneline`
- **Changed files:** `git diff $MERGE_BASE...HEAD --name-only`
- **Changed file count:** `git diff $MERGE_BASE...HEAD --name-only | wc -l`

### 4. Size The Review And Prefer Code-Review-Graph For Large Diffs

Use the changed-file count from step 3 as a cheap sizing gate before reading broad file contents.

`code-review-graph` is the preferred context accelerator for large PRs. Use it to reduce token usage and avoid reading
broad file contents before knowing which files, symbols, flows, and tests matter. If the changed file count is
**greater than 10**, or the user explicitly asked for graph context, blast-radius analysis, token-efficient review, or
graph tooling, read `code-review-graph.md` from this skill directory and follow its discovery/setup guidance.

If the changed file count is **10 or fewer** and the user did not ask for graph context, do not load the optional
utility file. Record `Graph context: not requested - N changed files` in the preamble.

When the optional helper is loaded, capture its concise graph summary so both review axes can use it. Do not block an
ordinary review on this optional utility unless the user specifically requested it.

### 5. Gather Governing Context

Collect the inputs each sub-agent will need.

**For the Standards axis:**

1. Load the standards index from the resolved docs root (step 1).
1. Match the changed file paths and activity to standards entries using the index's `applies_to` rules.
1. Read only the matched standards files.
1. Note machine-enforced config files (eslint, prettier, tsconfig, editorconfig) — the sub-agent should not re-check
   what tooling already checks.

**For the Spec axis**, search for the originating spec in this order:

1. A deliverable specification or external specification record linked in the PR body or branch name.
1. A specification file in `<DOCS_ROOT>/specifications/` (or `docs/specifications/` by convention) matching the branch
   name, feature name, or linked work item.
1. Issue references in the commit messages (`#123`, `Closes #45`, etc.) — fetch via the repo's issue tracker workflow
   if available.
1. A path the user passed as an argument.
1. A PRD/spec file under `docs/`, `specs/`, or a project-specific location matching the branch name or feature.
1. The PR body and linked work item as a lightweight spec substitute.

### 6. Determine Spec Availability

Classify the spec situation into one of three tiers:

- **Tier 1 — Full spec**: a deliverable specification, PRD, or detailed issue with acceptance criteria exists. The Spec
  sub-agent reviews against it with full methodology checks.
- **Tier 2 — Lightweight spec**: only a PR description, brief issue, or user-stated intent exists. The Spec sub-agent
  reviews against it but frames findings as lower-confidence.
- **Tier 3 — No spec**: nothing found, and the user confirms there isn't one. The Spec sub-agent runs in reduced mode
  or is skipped if there is literally no PR body and no issue context.

If no spec source is found, ask the user: "I didn't find a spec, PRD, or linked issue. Is there one I should look at,
or should I review against the PR description / your stated intent only?"

If they say there isn't one and the PR description is too thin to review against, skip the Spec axis and note it as
residual risk.

### 7. Preamble Confirmation

Before dispatching, present a short summary of what was discovered so the user can correct any misdetection. This is a
single confirmation, not a multi-step interview:

```
**Review preamble — please confirm or correct:**

- **Target**: <branch/PR> against `<integration-branch>` (merge base: `<short-sha>`)
- **Standards**: <N standards matched from `<docs-root>/standards/index.yaml`> [or "none found — running with general judgment"]
- **Spec**: <tier> — <spec source description> [or "none found — Spec axis will be skipped"]
- **Graph context**: <not requested/unavailable/declined/available/recommended> [brief risk/blast-radius summary if used]
- **Changed files**: <N files> across <services/areas>

Proceed with review, or should I adjust anything?
```

If the user says to proceed (or does not object), dispatch immediately. If they correct something (e.g., "the spec is
at docs/specs/foo.md"), update the context and re-confirm only if the correction changes the tier.

When the skill is invoked with enough context to resolve all inputs unambiguously (e.g., the user passed a PR URL, the
repo has AGENTS.md with standards, and the PR body links a spec), the preamble may be compressed to a single line:
"Reviewing PR #123 against dev with 4 matched standards and the linked spec. Dispatching."

### 8. Dispatch Sub-Agents

Send a **single message with two `Agent` tool calls** so both axes run in parallel. Use `general-purpose` subagent type
for both.

Read the following files from this skill's directory:

- `shared-rules.md` — both sub-agents receive this
- `standards-axis.md` — Standards sub-agent only
- `spec-axis.md` — Spec sub-agent only

**Standards sub-agent prompt — include:**

- The pinned merge base, diff command, commit list, and changed-files list from step 3
- The optional code-review-graph summary from step 4, if available, especially blast radius, impacted
  callers/dependents, and test signals
- The list of matched standards files and their contents from step 5
- The full text of `shared-rules.md`
- The full text of `standards-axis.md`
- Instruction: "You are the Standards axis reviewer. Review the diff using the shared rules and the standards-axis
  brief. Produce findings in the specified output format. Focus exclusively on standards conformance, code quality,
  test value, agentic slop, and redundant computation. Do not assess specification compliance — the Spec axis handles
  that independently."

**Spec sub-agent prompt — include:**

- The pinned merge base, diff command, commit list, and changed-files list from step 3
- The optional code-review-graph summary from step 4, if available, especially blast radius and affected flows that may
  change acceptance-criteria coverage
- The spec contents or path from step 5, with the tier classification from step 6
- The full text of `shared-rules.md`
- The full text of `spec-axis.md`
- Instruction: "You are the Spec axis reviewer. Review the diff using the shared rules and the spec-axis brief. The
  spec availability tier for this review is: [tier]. Produce findings in the specified output format. Focus exclusively
  on specification compliance, scope drift, acceptance-criteria coverage, and methodology. Do not assess coding
  standards or test quality patterns — the Standards axis handles that independently."

If the Spec axis is being skipped (tier 3 with no usable context), send only the Standards sub-agent and note the skip
in the aggregation.

### 9. Aggregate

Present the two reports under separate headings. Do **not** merge or rerank findings across axes — the two axes are
deliberately separate so the user sees them independently.

#### Cross-Axis Overlap

If both axes flag the same `file:line`, they are flagging it for different reasons (one for standards, one for spec
compliance). This is a signal the issue is important, not a duplicate. Note the overlap: "Both axes flagged `file:line`
— this may indicate a systemic issue worth prioritizing."

Do not deduplicate across axes. Do not merge findings from different axes into one block.

#### Final Output Structure

```markdown
## Standards Review

[Standards sub-agent findings, verbatim or lightly cleaned]

## Spec Review

[Spec sub-agent findings, verbatim or lightly cleaned]
[Or: "Skipped — no spec, PRD, or linked issue available. Residual risk: ..." ]

## Cross-Axis Overlap

[Any file:line locations flagged by both axes, if applicable]
[Omit this section if there is no overlap]

## Summary

- **Standards axis**: N findings (X boulders, Y rocks, Z pebbles, W sand)
- **Spec axis**: N findings (X boulders, Y rocks, Z pebbles, W sand) [or "skipped — no spec"]
- **Verdict**: [Approvable | Not approvable — N blocking findings remain]
- **Residual risk**: [anything not checked, tests not run, spec gaps, standards gaps]
```

**Approval rule:** any open `[boulder]` or `[rock]` from *either* axis means the PR is **not approvable** until
resolved. `[pebble]` and `[sand]` from either axis never block.

#### Targeted Tests And Static Checks

Run targeted tests or static checks only when they are necessary and reasonable for the review. If not run, state that
clearly in the residual risk. Prefer running checks before dispatch so both sub-agents benefit from the results.
