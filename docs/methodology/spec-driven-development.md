# Spec-Driven Development

Spec-driven development is the lifecycle after a deliverable specification is greenlit.
The specification remains the current implementation contract while agents implement,
verify, absorb Owner steering, respond to QA and PR feedback, and prepare for human
signoff.

## Purpose

This section is the canonical methodology home for the post-greenlight loop. Use it when
the question is how an approved specification moves through implementation, steering,
review feedback, re-verification, and merge readiness.

Use [Specifications](./specifications.md) for how to author the contract before
greenlight. Use this section once the contract is approved and implementation begins.

## Lifecycle

```text
spec creation and refinement
  -> Owner greenlight
  -> AC/TDD implementation loop
  -> Owner steering, QA/UAT, or PR feedback
  -> in-place spec updates when the contract changes
  -> Implementation And Review Change Log entry
  -> rework and re-verification
  -> draft PR evidence and self-review
  -> final human signoff and merge
  -> promote completed spec to durable storage when repo policy requires it
```

The loop is controlled, not waterfall. Steering and review feedback may occur during
implementation or draft PR review. Accepted contract changes update the affected
specification sections in place so the spec body always reads as the current contract.

## Current Contract And Change Log

The specification body is the executable truth. If accepted feedback changes scope,
acceptance criteria, test strategy, implementation sequence, public behavior, UX flow,
API/schema/validation behavior, branch topology, or a bug-fix contract, update the
affected spec sections in place.

The final `Implementation And Review Change Log` records the audit trail:

- timestamp and source
- changed section links or section numbers
- rationale
- summary of in-place edits
- verification impact

The change log is not a second source of requirements. It explains how the current
contract got there.

## Execution Records

Append-only execution history belongs in the run log or repo-declared execution system,
not in the long-lived specification body. The run log grows as work proceeds; do not
rewrite prior entries unless the user explicitly asks.

Execution records include:

- open-question resolutions
- phase progress
- failed attempts worth remembering
- deviations inside adaptive guidance
- evidence locations
- QA findings and rework notes
- handoff notes
- subagent outcomes

Repos may use local files under `<DOCS_ROOT>/ephemeral/`, Zazz Board, Jira, another
tracker, or a combination when `AGENTS.md` declares that policy. Follow the repo's
declared filenames and layout; do not invent subdirectories inside `ephemeral/`.

## Lead Agent And Worktree Discipline

Implementation runs in one active worktree or one stacked branch lane for the approved
review artifact. A lead implementation agent owns the specification during execution.

The lead implementation agent owns:

- scope control against the current specification
- ordering of phases and tasks
- file-conflict serialization inside the active worktree
- integration of delegated work
- evidence quality and acceptance-criteria mapping
- run-log or tracker updates
- PR-ready output

Subagents may help with bounded phases, tasks, branch slices, tests, documentation, or
QA checks when the specification allows it. The lead must order overlapping file work so
agents do not overwrite one another. If two tasks may touch the same file, serialize the
tasks and reconcile the diff before continuing.

Subagents should return changed-file summaries, commands run, evidence, risks, and
unresolved questions. If subagents are not available in the active harness, the lead
agent performs the work directly and records that in the execution record.

## AC/TDD Loop

The implementation loop is acceptance-criteria driven:

1. Read the approved specification and required references.
2. Verify applicable standards from the standards index.
3. Resolve open questions before editing.
4. Start from the specified TDD entry point or strongest narrow verification.
5. Implement the smallest coherent slice.
6. Run the named tests or manual checks.
7. Record evidence and useful execution history.
8. Repeat until every current AC has evidence.

Tests and manual checks should prove observable behavior, realistic edge cases, public
contracts, regressions, or named risks. Passing tests are not enough if they do not prove
the ACs.

## Fresh-Context QA

Independent QA and verifier agents should run with fresh context when available. A QA
agent may focus on one quality dimension, such as:

- functionality and acceptance criteria
- test quality
- performance
- code hygiene and maintainability
- standards conformance
- security
- accessibility
- stacked-branch no-drift

QA agents read the current specification, execution record, relevant evidence, and
focused code scope. They do not modify code. They return PASS/FAIL findings with
evidence and rework recommendations.

QA findings that reveal a contract change use the same in-place spec update and
Implementation And Review Change Log protocol. Findings that only require implementation
repair stay in the run log, tracker, PR, or review thread.

## Draft PR Feedback

Draft PRs are part of the feedback loop. PR review, self-review, and human testing may
surface implementation defects, weak evidence, standards issues, or contract gaps.

When feedback changes the contract, update the relevant specification sections in place,
append a change-log entry, update the execution record, and re-verify affected ACs. When
feedback does not change the contract, keep it in the PR thread, run log, tracker, or
commit history as appropriate.

## Completed-Spec Promotion

After the PR lands, follow the repo's declared document storage mode. If completed
implemented specifications are durable artifacts, promote the final current
specification from `<DOCS_ROOT>/specifications/` to the durable completed-spec location
when that durable location is outside the repo.

Durable completed-spec locations include:

- `<DOCS_ROOT>/specifications/` for committed Markdown
- GitHub Wiki or another repo wiki
- Confluence or another knowledge base
- Zazz Board, Jira, or another tracker-backed archive

The promoted spec should retain the final `Implementation And Review Change Log` and
link the PR, merge commit, feature, project milestone, roadmap, and architecture context when
available. Do not promote RUN_LOG files, scratch notes, failed attempts, or transient QA
work into the durable spec archive.

## Relevant Skills

| Skill | How it helps efficiency |
| ----- | ----------------------- |
| `spec-driven` | Applies the post-greenlight lifecycle, contract-change protocol, lead/subagent coordination, and signoff discipline. |
| `spec-builder` | Creates the greenlit specification, implementation prompt, tracking model, and change-log section that SDD executes against. |
| `qa-testing` | Runs focused fresh-context verification and produces findings or evidence. |
| `pr-builder` | Packages draft PR evidence, risks, and spec links for review. |
| `pr-review` | Reviews draft PRs for spec alignment, standards conformance, evidence quality, and maintainability. |
| `gh-stack` | Manages stacked branch lanes when the approved review shape is a stack. |
| `handoff` | Captures temporary HANDOFF context under `<DOCS_ROOT>/ephemeral/` when implementation or review needs to resume in a fresh session. |
| `gh-wiki` | Promotes completed specs and updates feature, architecture, roadmap, or project milestone wiki pages after shipped changes. |
| `confluence` | Drafts durable completed-spec and project-doc updates for Confluence-backed repos. |
| `zazz-board` | Updates Zazz Board tasks, notes, statuses, locks, and evidence when the repo uses Zazz Board. |
| `jira` | Provides Jira-backed context when the repo uses Jira; live integration depends on repo support. |

## Related Sections

- [Specifications](./specifications.md)
- [Document Storage](./document-storage.md)
- [Code Generation](./code-generation.md)
- [Testing and Validation](./testing-and-validation.md)
- [PR Creation](./pr-creation.md)
- [Self-Review](./self-review.md)
