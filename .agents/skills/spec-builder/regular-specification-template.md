<!--
  TEMPLATE — Regular / Non-Stacked Deliverable Specification (spec-builder skill)

  Copy this file to:
    <DOCS_ROOT>/specifications/<slug>.md

  For milestone branches with multiple deliverables/specifications, use a consistent ordered
  pattern such as:
    <DOCS_ROOT>/specifications/m2-spec-1-service-layer-foundation.md

  Stable rule:
    one deliverable = one deliverable specification

  Flexible delivery topology:
    a worktree / branch / PR may contain one deliverable, multiple deliverables, or a
    single-lane stack of branches. This template is for non-stacked specifications.

  This deliverable specification is the implementation contract. There is no separate plan.

  The specification is test/AC-driven:
    define acceptance criteria and test plan before execution sequence.

  The specification also defines the approved review shape before implementation:
    one PR, one milestone PR, sibling PRs, stacked PRs, or a large exception.

  Replace every `{{ ... }}` placeholder. Resolve every `<!-- TBD: ... -->`
  marker. Delete this template comment block when filling in for a real deliverable.
-->

# {{ Deliverable Name }} — Deliverable Specification

**Worktree / branch:** `{{ worktree-name }}`
**Feature:** {{ feature-name }}
**Milestone:** {{ milestone-name-or-N/A }}
**Deliverable:** {{ deliverable-name }}
**Delivery topology:** {{ single-deliverable branch | milestone branch | sibling branch }}
**Review artifact:** {{ one PR for this specification | one milestone PR with sibling specifications | separate sibling PR }}
**Approved review shape:** {{ one PR | milestone PR | sibling PRs | large exception }}
**Decomposition rationale:** {{ why this review shape is correct; alternatives rejected }}
**Integration branch:** `{{ integration-branch }}` (e.g. `dev`, `main`, `master` — confirmed with Owner)
**Merge policy:** PR review required — agents commit/push feature branches only
**Drafted:** {{ YYYY-MM-DD }}
**Shared run log:** {{ `<DOCS_ROOT>/execution/<slug>-run-log.md`, Zazz Board note, external tracker record, or N/A }} ({{ section-name }} section).

---

## 0. Capability

{{ One concise paragraph stating what this deliverable does. Bounded. Concrete. }}

---

## 1. Required Reading For The Implementor

Read these before opening an editor. Required reading is section-pinned context, not a
license to load the whole repo.

### 1.a This Specification

Read this specification end to end first.

### 1.b Feature / Milestone Context

- `{{ docs/features/path.md }}` — read {{ section numbers }}.
- `{{ docs/architecture/path.md }}` — read {{ section numbers }}.

### 1.c Prior Specifications In This Delivery Effort

<!-- Use when this specification follows another specification in the same milestone branch. Otherwise say N/A. -->

- `{{ <DOCS_ROOT>/specifications/prior-spec.md }}` — read {{ sections }}.

### 1.d Standards

Per `docs/standards/index.yaml`, the following standards apply to this specification's scope:

| Standard | What it governs here |
| --- | --- |
| `docs/standards/{{ standard.md }}` | {{ scope }} |

**Verification step before writing code:** run the standards lookup yourself against the
file list in §3. If an applicable standard is missing from this table, stop and surface
it to the Owner before proceeding.

### 1.e Existing Code References

- `{{ path/to/reference.py }}` — {{ pattern to mirror }}.
- `{{ path/to/test_reference.py }}` — {{ test pattern to mirror }}.

### 1.f Project Orientation

- `{{ orientation path, e.g. AGENTS.md / repo-specific orientation }}` —
  branch scope discipline, command-shape discipline, local verification, and safety
  rules.

---

## 2. Invariants

These are load-bearing and must hold verbatim. Restate them in the PR body when useful.

### INVARIANT 1 — {{ title }}

{{ invariant text }}

### INVARIANT 2 — {{ title }}

{{ invariant text }}

---

## 3. Scope

### Approved Review Shape

This specification is approved for {{ one PR | one milestone PR | sibling PRs | large exception }}.
Implementation must follow this review shape. If implementation surfaces a need to split,
stack, combine, or treat the work as a large exception differently than described here,
stop and revise the specification with Owner sign-off before continuing.

**Rationale.** {{ Explain why this review unit is honest for human review. Name rejected
alternatives, such as stacked PRs, sibling PRs, one milestone PR, or a large exception. }}

**Review units owned by this specification.**

- {{ one PR / milestone slice / sibling PR name }} — {{ purpose, acceptance boundary, evidence boundary }}

### Strict Scope Constraint

{{ Every file modification in this specification lives under ... }} If implementation surfaces a
need to modify outside this scope, stop and surface to the Owner.

### In Scope

| Path | New / Modified | Reason |
| --- | --- | --- |
| `{{ path/to/file.py }}` | {{ New / Modified }} | {{ reason }} |

### Out Of Scope

- {{ out-of-scope item }}
- {{ out-of-scope item }}

---

## 4. Decisions

Each decision answers "why this over the obvious alternative?"

### D-1 — {{ decision title }}

**Decision.** {{ what was chosen }}

**Why.** {{ rationale, including rejected alternative }}

### D-2 — {{ decision title }}

**Decision.** {{ what was chosen }}

**Why.** {{ rationale, including rejected alternative }}

---

## 5. Agent Implementation Rules

These rules apply throughout implementation. Specification-specific halt conditions may add to
this list but should not duplicate it.

### Team Integration

Commit and push only to the feature branch. Do not merge directly to
`{{ integration-branch }}`; all integration happens through human PR review.

### Command Working Directory

Use a stable command shape. For backend work:

```bash
cd backend
scripts/withenv ../.env uv run pytest {{ tests/path }} -q
scripts/withenv ../.env just {{ recipe }}
just format
```

Adjust only when the specification names a different service or command convention.

### Commit And Push

Default to one coherent green commit per specification after the specification's DoD and verifier pass.
Waypoint commits are allowed only at coherent green recovery points. Do not commit red
tests, half-applied refactors, or local-only evidence artifacts as product commits.

Push after the specification is complete and committed, or at an explicit handoff/backup point.
Do not push after every phase by default.

### Scope Verification

For a single-specification branch, `git diff {{ integration-branch }} --stat` should list
exactly the files in §3 unless the Owner approved a specification revision.

For a milestone branch with multiple specifications, verify this specification's slice with its commit(s),
path list, or an Owner-approved slice-diff base. The full branch diff may include other
specifications in the same milestone branch.

### Autonomy Boundaries

Hard constraints:

- Scope in §3.
- Approved review shape in §3.
- Invariants in §2.
- Public contracts / user-visible behavior: {{ list }}.
- Standards in §1.d.
- Acceptance criteria in §6.
- Halt conditions below.

Adaptive guidance:

- helper names
- exact syntax
- test organization
- skeleton bodies
- internal implementation mechanics

The agent may adapt guidance when verified local evidence supports it, provided hard
constraints still hold. Meaningful deviations go in the run log. Contract-changing
deviations require Owner sign-off and specification revision.

### Run Log

Maintain the run log at {{ run-log path, Zazz Board note, external tracker record, or N/A }}. Append entries after OQ
resolutions, phase completions, deviations, manual evidence, QA findings, rework
references, and load-bearing issues.

### Halt Conditions

The agent must stop and surface to the Owner if any of these occur:

1. Any Open Question in §10 is unresolved before code change.
2. Same automated test fails 3 iterations in a row.
3. `just format` or equivalent verification fails for a reason not addressable by the
   obvious fix in 2 iterations.
4. Scope verification shows a file outside §3.
5. Implementation surfaces a need to modify outside the strict scope.
6. A standard not prescribed in §1.d matches the file list via standards-index lookup.
7. Reference data or required local service is unavailable.
8. A needed deviation changes scope, public contract, ACs, approved review topology, or an
   invariant.

---

## 6. Acceptance Criteria

- **AC1** — {{ title }}. {{ what must be true }}. Verified by: {{ test or command }}.
- **AC2** — {{ title }}. {{ what must be true }}. Verified by: {{ test or command }}.
- **AC3** — Type / lint / formatting clean. Verified by: `{{ command }}`.
- **AC4** — Scope clean. Verified by: {{ `git diff {{ integration-branch }} --stat` for a single-specification branch, or specification-slice diff / commit inspection for a milestone branch }}.

---

## 7. Test Plan

Test value rule: every automated test below must prove an AC, invariant, public
contract, realistic edge case, regression, or named risk. Prefer compact matrices that
cover multiple realistic edge cases at the same behavior boundary. Do not add duplicate,
mock-only, unrealistic permutation, or coverage-padding tests. If nearby coverage already
proves an AC or edge case, cite it here instead of adding a new test.

Test contract rule: this section defines the required test intent, reference data,
realistic edge cases, and verification layer before implementation starts. Implementers
may adapt local mechanics, but they must not weaken or rewrite this coverage to make the
implementation pass. Material changes require Owner sign-off and specification revision.

Reference data sources:

- {{ source }} — {{ how used }}.

Automated tests:

- `test_{{ name }}` — verifies {{ AC# / invariant / contract / regression }} plus edge cases {{ case list }} by asserting {{ observable behavior }}.
- `test_{{ name }}` — verifies {{ AC# / invariant / contract / regression }} plus edge cases {{ case list }} by asserting {{ observable behavior }}.

Existing coverage intentionally reused:

- {{ existing test path/name, or N/A }} — already proves {{ AC# / behavior }}; no new test required because {{ rationale }}.

Manual verification:

- {{ manual check, if any; otherwise N/A }}.

---

## 8. TDD Entry Point + Prescriptive Execution Sequence

The execution sequence is derived from §6 Acceptance Criteria and §7 Test Plan. Do not
change the implementation contract by changing only this section; revise ACs/decisions
first when the contract changes.

### TDD Entry Point

Add the first failing test:

```python
def test_{{ first_test_name }}() -> None:
    """{{ Why this test exists. }}"""
    ...
```

### Prescriptive Execution Sequence

Follow this order unless verified local evidence shows a safer order. Log meaningful
deviations.

**Phase 1: {{ phase title }}**

1.1. {{ step }}
1.2. Run: `{{ command }}`. Expect {{ result }}.

**Phase 2: {{ phase title }}**

2.1. {{ step }}
2.2. Run: `{{ command }}`. Expect {{ result }}.

### Skeleton: `{{ path/to/new_file.py }}`

```python
{{ skeleton code }}
```

---

## 9. Definition Of Done

- [ ] All §1 required reading consumed; standards-index verification performed.
- [ ] All §10 Open Questions resolved with the Owner and logged.
- [ ] Scoped tests green: `{{ command }}`.
- [ ] Manual verification complete: {{ command/path or N/A }}.
- [ ] `{{ format/check command }}` exits 0.
- [ ] Scope verification lists exactly the files in §3 for this specification slice.
- [ ] PR shape matches the approved review shape in §3.
- [ ] All AC1–ACn verified, with evidence cited.
- [ ] Run-log section for this specification is up to date when a run log is used.
- [ ] Verifier sub-agent dispatched and returned all-pass.
- [ ] PR draft body links this specification and lists each AC's verification.

---

## 10. Open Questions

Resolve these before code is written. Log each answer in the run log.

- **OQ-1** — {{ question }}

---

## 11. Run Log Protocol

This specification uses the shared run log:

{{ `<DOCS_ROOT>/execution/<slug>-run-log.md`, Zazz Board note, external tracker record, or N/A }}

When stored on disk, the run log should normally live under `<DOCS_ROOT>/execution/`
and remain untracked via repo-local or bare-repo exclude rules unless the repo explicitly
chooses committed execution history.

Repos that do not use Zazz Board may rely exclusively on `<DOCS_ROOT>/execution/` for
run logs, handoff notes, QA findings, and related execution records.

When the Owner uses Zazz Board, the run log, handoff notes, QA findings, and related
execution information may live there instead so multiple agents can share the same
record across worktrees and sessions.

The agent appends entries; it does not rewrite prior entries.

Required sections for this specification:

- Standards Verification
- OQ Resolutions
- Phase Completions
- Deviations
- Manual Evidence Locations
- QA Findings & Rework
- Issues & Recoveries
- Verifier Sub-Agent Report

Session start protocol:

1. Read this specification end to end.
2. Read the entire run log, including prior specification sections when this is a milestone
   branch.
3. Confirm the next phase based on the most recent Phase Completion entry.
4. Resolve open questions with the Owner before writing code.
5. Begin implementation.

---

## 12. Appendix — Agent Implementation Prompt

Paste this into a fresh implementation session:

```text
You are starting fresh in the worktree at {{ absolute-worktree-path }}.
Your task is to implement {{ deliverable-name }}.

Specification: {{ specification path or external record }}
Shared run log: {{ `<DOCS_ROOT>/execution/<slug>-run-log.md`, Zazz Board note, external tracker record, or N/A }}

Read the specification end to end before doing anything else. Then read the shared run log in
full. If this specification is part of a milestone branch, read prior specification sections and their
run-log sections because earlier decisions, QA findings, and deviations may affect this work.

NON-NEGOTIABLE RULES
1. Follow the specification's Agent Implementation Rules.
2. Resolve every Open Question before writing code; log answers in the implementation
   log.
3. Verify standards via docs/standards/index.yaml before writing code.
4. Tests and verification are not optional. Every AC must have evidence.

ORDER OF WORK
1. Read the specification, run log, required docs, standards, and code references.
2. Resolve OQs.
3. Review ACs (§6) and Test Plan (§7); start with the TDD entry point in §8.
4. Confirm the implementation still matches the approved review shape in §3.
5. Execute the specification's phases.
6. Run verification and complete the DoD (§9).
7. Dispatch a verifier sub-agent.
8. Prepare PR-ready output. Do not merge to `{{ integration-branch }}`; integration happens through human PR review.

VERIFIER SUB-AGENT
After your own DoD checklist is green, dispatch a fresh sub-agent:

  "You are verifying {{ deliverable-name }} in {{ absolute-worktree-path }}. Read the
  specification at {{ specification path or external record }} and the shared run log at
  {{ `<DOCS_ROOT>/execution/<slug>-run-log.md`, Zazz Board note, external tracker record, or N/A }}. Follow the
  Implementation Rules. For each AC, independently verify it by running the
  cited test or command. Cross-check deviations and QA findings logged in the run log against the code.
  Verify the specification slice matches its scope using the scope command named in the specification. Do
  not modify code or the run log. Return PASS/FAIL per AC with evidence."

Only declare done after the verifier reports all-pass.
```

---

*End of specification. Implementation proceeds from this specification and the run log; no separate plan is created.*
