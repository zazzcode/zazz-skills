<!--
  TEMPLATE — Stacked Deliverable Specification (spec-builder skill)

  Copy this file to:
    <DOCS_ROOT>/specifications/<slug>.md

  The repo operating model decides whether specifications/ is tracked, ignored,
  mirrored to Zazz Board/Jira, or promoted after merge.

  Replace every `{{ ... }}` placeholder. Resolve every `<!-- TBD: ... -->`
  marker. Delete this template comment block when filling in for a real deliverable.

  Do not enforce a universal stack-size cap. Keep each PR reviewable on its own terms:
  clear dependency, focused purpose, concrete acceptance criteria, and human sign-off.

  Stacked review is an approved specification-time decomposition choice. Do not use this
  template to retrofit a stack around an oversized implementation after coding starts.
-->

# {{ Deliverable Name }} — Stacked Deliverable Specification

> This specification covers a stacked branch lane. Per-branch sequencing, acceptance
> criteria, and implementation prompts live here; active execution state lives in the
> run log or external record declared below.

**Worktree / lane:** `{{ lane-worktree }}`
**Feature:** {{ feature-name-or-N/A }}
**Milestone:** {{ milestone-name-or-N/A }}
**Deliverable(s):** {{ deliverable-name-list }}
**Specification storage:** {{ <DOCS_ROOT>/specifications/<slug>.md; tracked | ignored | mirrored/promoted to external system }}
**Run log:** {{ `<DOCS_ROOT>/ephemeral/<lane-slug>-run-log.md`, Zazz Board note, external tracker record, or N/A }}
**Execution record sharing:** {{ local ignored file | Zazz Board centralized record | external tracker record }}
**Execution tracking:** {{ local run log only | Zazz Board project/deliverable/task IDs | Jira issue key/URL | other tracker reference }}
**Implementation coordination:** {{ lead implementation agent only | lead implementation agent coordinating subagents by branch/phase/task }}
**Companion skills for implementation:** `gh-stack`; {{ `zazz-board` | `jira` | repo-specific tracker skill/guidance | no tracker skill }}
**Integration branch:** `{{ integration-branch }}` (confirmed with Owner)
**Merge policy:** PR review required for every PR in the stack
**Approved review shape:** bounded stacked review lane
**Decomposition rationale:** {{ why stacked PRs are clearer than one PR, one milestone PR, or sibling PRs }}

---

## 0. Stacked-Branch Model

### Why This Is Stacked

{{ Explain why dependent PRs are clearer than one milestone PR or sibling PRs. Name the
dependency or review boundary. }}

This stack is approved before implementation starts. If implementation surfaces a need
to add branches, remove branches, split into sibling PRs, collapse into one PR, or treat
the work as a large exception, stop and revise this specification with Owner sign-off
before continuing.

### Worktree Topology

All stacked branches live inside one worktree lane. Do not create one worktree per stack
branch.

| Branch | Role | Review dependency |
| --- | --- | --- |
| `{{ lower-branch }}` | {{ lower branch purpose }} | Base branch for the next PR |
| `{{ upper-branch }}` | {{ upper branch purpose }} | Depends on `{{ lower-branch }}` |

### Rebase Rule

Upper branches rebase upstack from lower branches until the lower PR lands on the
integration branch through human review. After a lower PR lands, dependent upper branches
rebase on `origin/{{ integration-branch }}` and verify that lower-branch commits drop out
of the upper PR diff.

All `gh stack` commands in this specification must be non-interactive:

- pass branch names to `init`, `add`, and `checkout`
- use `gh stack view --json`
- use `gh stack submit --auto`, with `--draft` for draft PRs
- use `--remote origin` when multiple remotes are configured, or preconfigure
  `git config remote.pushDefault origin`
- configure `git config rerere.enabled true` before stack setup

---

## 1. Required Reading

- `{{ AGENTS.md or repo orientation }}` — {{ sections }}
- `{{ feature document or N/A }}` — {{ sections }}
- `{{ architecture document or N/A }}` — {{ sections }}
- `{{ standards index and standards }}` — {{ sections }}
- `{{ prior specification or N/A }}` — {{ sections }}

---

## 2. Cross-Branch Contract

{{ Define the concrete contract lower branches expose to upper branches: symbols, API
shape, schema, data shape, events, files, or behavior. This is the load-bearing seam. }}

### Contract Invariants

- **Invariant 1:** {{ invariant }}
- **Invariant 2:** {{ invariant }}

### Contract Change Rule

If an upper branch needs a contract change from a lower branch, or if any branch needs a
different review shape than this approved stack, stop and revise this specification with
Owner sign-off before continuing.

---

## 3. Branch: `{{ lower-branch }}`

### Capability

{{ What the lower branch delivers on its own. }}

### Scope

| Path | New / Modified | Reason |
| --- | --- | --- |
| `{{ path }}` | {{ New / Modified }} | {{ reason }} |

### Acceptance Criteria

- **AC1** — {{ testable criterion }}. Verified by: {{ test/command/evidence }}.
- **AC2** — {{ testable criterion }}. Verified by: {{ test/command/evidence }}.

### Test Strategy

Test value rule: every automated test must prove an AC, invariant, public contract,
realistic edge case, regression, or named risk. Prefer compact matrices that cover
multiple realistic edge cases at the same behavior boundary. Reuse existing coverage
when it already proves the behavior; do not add duplicate, mock-only, unrealistic
permutation, or coverage-padding tests.

Test contract rule: this section defines required test intent, reference data, realistic
edge cases, and verification layer before implementation starts. Implementers may adapt
local mechanics, but they must not weaken or rewrite this coverage to make implementation
pass. Material changes require Owner sign-off, in-place specification updates, and a §9
change-log entry.

- `test_{{ name }}` — verifies {{ AC# / contract / regression }} plus edge cases {{ case list }} by asserting {{ observable behavior }}.
- Existing coverage reused: {{ existing test path/name, or N/A }} — {{ rationale }}.

### Execution Sequence

1. {{ first failing test or verification entry point }}
2. {{ implementation phase }}
3. {{ verification phase }}

---

## 4. Branch: `{{ upper-branch }}`

### Capability

{{ What the upper branch delivers using the lower-branch contract. }}

### Scope

| Path | New / Modified | Reason |
| --- | --- | --- |
| `{{ path }}` | {{ New / Modified }} | {{ reason }} |

### Acceptance Criteria

- **AC1** — {{ testable criterion }}. Verified by: {{ test/command/evidence }}.
- **AC2** — No drift across lower-branch-owned scope. Verified by:
  `git diff origin/{{ lower-branch }}...HEAD -- {{ lower owned paths }}` while stacked,
  and `git diff origin/{{ integration-branch }}...HEAD -- {{ lower owned paths }}` after
  the lower PR lands.

### Test Strategy

Test value rule: every automated test must prove an AC, invariant, public contract,
realistic edge case, regression, or named risk. Prefer compact matrices that cover
multiple realistic edge cases at the same behavior boundary. Reuse existing coverage
when it already proves the behavior; do not add duplicate, mock-only, unrealistic
permutation, or coverage-padding tests.

Test contract rule: this section defines required test intent, reference data, realistic
edge cases, and verification layer before implementation starts. Implementers may adapt
local mechanics, but they must not weaken or rewrite this coverage to make implementation
pass. Material changes require Owner sign-off, in-place specification updates, and a §9
change-log entry.

- `test_{{ name }}` — verifies {{ AC# / contract / regression }} plus edge cases {{ case list }} by asserting {{ observable behavior }}.
- Existing coverage reused: {{ existing test path/name, or N/A }} — {{ rationale }}.

### Execution Sequence

1. {{ first failing test or verification entry point }}
2. {{ implementation phase }}
3. {{ verification phase }}

---

## 5. Cross-Branch Acceptance Bar

The landed PRs together satisfy every per-branch AC and preserve the cross-branch
contract. Every PR in the stack requires human sign-off before merge.

---

## 6. Agent Implementation Rules

- Agents may commit and push stack branches when instructed.
- Agents must not merge directly to `{{ integration-branch }}`.
- Open draft PRs first, run author-side automated review, address feedback, then mark
  ready for formal review.
- Follow the approved stack shape in §0. Do not add, remove, split, or collapse stack
  branches without Owner sign-off, in-place specification updates, and a §9 change-log entry.
- Run applicable standards lookup before code changes.
- Keep each branch's commits scoped to that branch's ownership.
- Halt on unresolved open questions, repeated test failure, scope drift, missing
  reference data, or contract changes.
- Update the run log or external record after each phase and QA pass when a run log is used.
- Use {{ local run log only | Zazz Board | Jira | other tracker }} as the execution
  tracking system. Load {{ `zazz-board` | `jira` | repo-specific tracker guidance | N/A }}
  when that system is declared.
- If using Zazz Board, update stack branch/task progress, subagent progress, notes, file
  locks when required, and evidence links through `zazz-board`.
- If using Jira, use the repo-provided or Owner-provided Jira issue context through
  `jira`; do not assume live Jira access unless the repo declares it.
- If subagents are used, the lead implementation agent owns stack shape, branch
  checkouts, file-conflict serialization, integration, evidence quality,
  run-log/tracker updates, and PR-ready output. Subagents may own only delegated
  branch/phase/task slices and must return changed-file summaries, commands run,
  evidence, risks, and unresolved questions.
- Order work inside the single lane worktree so overlapping file ownership is
  serialized. Do not run or merge delegated tasks in a way that lets agents overwrite
  each other's edits. When two tasks may touch the same file, the lead agent sequences
  them and reconciles the diff before continuing.

### Delegation Map

| Branch / phase / task | Owner | Allowed scope | Required evidence |
| --- | --- | --- | --- |
| {{ branch/phase/task }} | {{ lead agent | subagent role }} | {{ paths/contract boundary }} | {{ tests/checks/output }} |

### Independent QA / Verification Agents

Use fresh-context QA/verifier agents for {{ functionality | performance | code hygiene |
security | accessibility | standards | stack no-drift | N/A }} when available. Each QA
agent should read only the specification, run log/tracker record, relevant evidence, and
focused code scope it needs for its quality dimension. QA agents do not modify code; they
return PASS/FAIL findings with evidence and rework recommendations.

---

## 7. Definition Of Done

- [ ] Required reading completed.
- [ ] Open questions resolved.
- [ ] Lower-branch ACs verified.
- [ ] Upper-branch ACs verified.
- [ ] No-drift verification passed.
- [ ] Stack shape still matches the approved decomposition in §0.
- [ ] Applicable standards verified.
- [ ] Run-log/tracker record is current for each branch/task, including subagent
      outcomes when subagents were used.
- [ ] Draft PRs created and author-side automated review addressed.
- [ ] Formal PR review ready.
- [ ] Human sign-off obtained for every PR before merge.

---

## 8. Implementation Prompt

```text
You are implementing the stacked deliverable described at:
{{ specification path or external record }}

Use lane worktree:
{{ lane-worktree }}

Integration branch:
{{ integration-branch }}

Read the specification end to end, then read the run log or external execution record:
{{ `<DOCS_ROOT>/ephemeral/<lane-slug>-run-log.md`, Zazz Board note, external tracker record, or N/A }}

Execution tracking:
{{ local run log only | Zazz Board IDs | Jira issue | other tracker reference }}

Implementation coordination:
{{ lead implementation agent only | lead implementation agent coordinating subagents }}

Companion skills to load:
`gh-stack`; {{ `zazz-board` | `jira` | repo-specific tracker guidance | no tracker skill }}

Before writing code, confirm the stack still matches the approved review shape in §0.
If it does not, stop and ask for Owner sign-off and a specification update.

Use gh-stack. Keep all stack commands non-interactive. Open draft PRs first, run
author-side automated review, address feedback, then mark ready for formal review.

TRACKING SYSTEM
- If execution tracking is Zazz Board, load `zazz-board` and use the repo-declared
  project/deliverable/task identifiers. Update branch/task status, subagent progress,
  notes, file locks when required, and evidence links through that skill.
- If execution tracking is Jira, load `jira` and use the repo-provided or
  Owner-provided issue key/URL and acceptance context. Do not assume live Jira
  access unless the repo declares it.
- If execution tracking is another tracker, follow the repo-declared workflow named in
  this specification.
- If execution tracking is local run log only, keep the run log and PR evidence current.

LEAD / SUBAGENT OPERATING MODEL
- Work in the single lane worktree named by the specification.
- The lead implementation agent owns the approved stack shape, branch checkouts,
  rebase/upstack propagation, scope control, file-conflict serialization, integration,
  evidence quality, run-log/tracker updates, and final PR-ready output.
- If this specification allows subagents, delegate only the branch/phase/task slices
  listed in §6. Give each subagent its branch/scope, ACs, required evidence, and halt
  conditions.
- Require every subagent to return changed-file summaries, commands run, evidence, risks,
  and unresolved questions. The lead reconciles subagent output before declaring any AC
  complete.
- Order overlapping file work so delegated tasks do not overwrite each other. If two
  tasks may touch the same file, serialize them and reconcile the diff before continuing.
- If subagents are not available in the active harness, the lead implementation agent
  performs the phases directly and records that in the run log.

FRESH-CONTEXT QA / VERIFICATION
- Use separate fresh-context QA/verifier agents for the quality dimensions named in §6
  when the active harness supports them.
- QA/verifier agents read the specification, run log/tracker record, relevant evidence,
  and focused code scope; they do not modify code.
- Treat QA findings that change the implementation contract through the Implementation
  And Review Change Log protocol.

Do not merge directly to the integration branch. Every PR in the stack requires human
sign-off before merge.
```

---

## 9. Implementation And Review Change Log

Accepted steering, QA/UAT findings, PR review feedback, branch-contract changes, or
implementation-discovered bugs that change the contract must update the affected sections
above in place. This section records the audit trail; the current contract lives in the
body of the specification.

No changes recorded. Delete this line when adding the first change-log entry.

### {{ YYYY-MM-DD HH:MM TZ }} — {{ Short Change Title }}

**Source.** {{ Owner steering, QA/UAT, PR review, implementation-discovered bug, or other source. }}

**Changed Sections.** {{ Links or section numbers, e.g. [§2 Cross-Branch Contract](#2-cross-branch-contract), [§3 Branch](#3-branch-lower-branch). }}

**Rationale.** {{ Why the accepted change was needed. }}

**Summary.** {{ Short summary of the in-place spec edits. }}

**Verification Impact.** {{ Stack rebase, no-drift check, tests, manual checks, evidence, or re-verification now required. }}

*End of stacked deliverable specification.*
