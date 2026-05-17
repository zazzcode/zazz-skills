<!--
  TEMPLATE — Regular / Non-Stacked SPEC (spec-builder skill)

  Copy this file to:
    <active-worktree>/docs/implementation/<slug>-SPEC.md

  For milestone branches with multiple deliverables/SPECs, use a consistent ordered
  pattern such as:
    docs/implementation/m2-spec-1-service-layer-foundation.md

  Stable rule:
    one deliverable = one SPEC

  Flexible delivery topology:
    a worktree / branch / PR may contain one deliverable, multiple deliverables, or a
    single-lane stack of branches. This template is for non-stacked SPECs.

  This SPEC is the implementation contract. There is no separate PLAN.

  The SPEC is test/AC-driven:
    define acceptance criteria and test plan before execution sequence.

  Replace every `{{ ... }}` placeholder. Resolve every `<!-- TBD: ... -->`
  marker. Delete this template comment block when filling in for a real deliverable.
-->

# {{ Deliverable Name }} — SPEC

**Worktree / branch:** `{{ worktree-name }}`
**Feature:** {{ feature-name }}
**Milestone:** {{ milestone-name-or-N/A }}
**Deliverable:** {{ deliverable-name }}
**Delivery topology:** {{ single-deliverable branch | milestone branch | sibling branch }}
**Review artifact:** {{ one PR for this SPEC | one milestone PR with sibling SPECs | separate sibling PR }}
**Integration branch:** `{{ integration-branch }}` (e.g. `dev`, `main`, `master` — confirmed with Owner)
**Merge policy:** PR review required — agents commit/push feature branches only
**Drafted:** {{ YYYY-MM-DD }}
**Shared run log:** `docs/implementation/{{ effort-slug }}-RUN-LOG.md` ({{ section-name }} section).

---

## 0. Capability

{{ One concise paragraph stating what this deliverable does. Bounded. Concrete. }}

---

## 1. Required Reading For The Implementor

Read these before opening an editor. Required reading is section-pinned context, not a
license to load the whole repo.

### 1.a This SPEC

Read this SPEC end to end first.

### 1.b Feature / Milestone Context

- `{{ docs/features/path.md }}` — read {{ section numbers }}.
- `{{ docs/architecture/path.md }}` — read {{ section numbers }}.

### 1.c Prior SPECs In This Delivery Effort

<!-- Use when this SPEC follows another SPEC in the same milestone branch. Otherwise say N/A. -->

- `{{ docs/implementation/prior-spec.md }}` — read {{ sections }}.

### 1.d Standards

Per `docs/standards/index.yaml`, the following standards apply to this SPEC's scope:

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

- `{{ orientation path, e.g. AGENTS.md / CLAUDE.md / repo-specific orientation }}` —
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

### Strict Scope Constraint

{{ Every file modification in this SPEC lives under ... }} If implementation surfaces a
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

These rules apply throughout implementation. SPEC-specific halt conditions may add to
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

Adjust only when the SPEC names a different service or command convention.

### Commit And Push

Default to one coherent green commit per SPEC after the SPEC's DoD and verifier pass.
Waypoint commits are allowed only at coherent green recovery points. Do not commit red
tests, half-applied refactors, or local-only evidence artifacts as product commits.

Push after the SPEC is complete and committed, or at an explicit handoff/backup point.
Do not push after every phase by default.

### Scope Verification

For a single-SPEC branch, `git diff {{ integration-branch }} --stat` should list
exactly the files in §3 unless the Owner approved a SPEC revision.

For a milestone branch with multiple SPECs, verify this SPEC's slice with its commit(s),
path list, or an Owner-approved slice-diff base. The full branch diff may include other
SPECs in the same milestone branch.

### Autonomy Boundaries

Hard constraints:

- Scope in §3.
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
deviations require Owner sign-off and SPEC revision.

### Run Log

Maintain `docs/implementation/{{ effort-slug }}-RUN-LOG.md`. Append entries after OQ
resolutions, phase completions, deviations, manual evidence, and load-bearing issues.

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
8. A needed deviation changes scope, public contract, ACs, review topology, or an
   invariant.

---

## 6. Acceptance Criteria

- **AC1** — {{ title }}. {{ what must be true }}. Verified by: {{ test or command }}.
- **AC2** — {{ title }}. {{ what must be true }}. Verified by: {{ test or command }}.
- **AC3** — Type / lint / formatting clean. Verified by: `{{ command }}`.
- **AC4** — Scope clean. Verified by: {{ `git diff {{ integration-branch }} --stat` for a single-SPEC branch, or SPEC-slice diff / commit inspection for a milestone branch }}.

---

## 7. Test Plan

Reference data sources:

- {{ source }} — {{ how used }}.

Automated tests:

- `test_{{ name }}` — verifies {{ AC# }} by asserting {{ behavior }}.
- `test_{{ name }}` — verifies {{ AC# }} by asserting {{ behavior }}.

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
- [ ] Scope verification lists exactly the files in §3 for this SPEC slice.
- [ ] All AC1–ACn verified, with evidence cited.
- [ ] `{{ effort-slug }}-RUN-LOG.md` section for this SPEC is up to date.
- [ ] Verifier sub-agent dispatched and returned all-pass.
- [ ] PR draft body links this SPEC and lists each AC's verification.

---

## 10. Open Questions

Resolve these before code is written. Log each answer in the run log.

- **OQ-1** — {{ question }}

---

## 11. Run Log Protocol

This SPEC uses the shared run log:

`docs/implementation/{{ effort-slug }}-RUN-LOG.md`

The agent appends entries; it does not rewrite prior entries.

Required sections for this SPEC:

- Standards Verification
- OQ Resolutions
- Phase Completions
- Deviations
- Manual Evidence Locations
- Issues & Recoveries
- Verifier Sub-Agent Report

Session start protocol:

1. Read this SPEC end to end.
2. Read the entire run log, including prior SPEC sections when this is a milestone
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

THE SPEC IS AT: {{ spec-path }}
THE SHARED RUN LOG IS AT: docs/implementation/{{ effort-slug }}-RUN-LOG.md

Read the SPEC end to end before doing anything else. Then read the shared run log in
full. If this SPEC is part of a milestone branch, read prior SPEC sections and their
run-log sections because earlier decisions and deviations may affect this work.

NON-NEGOTIABLE RULES
1. Follow SPEC §5 Agent Implementation Rules.
2. Resolve every Open Question in SPEC §10 before writing code; log answers in the run
   log.
3. Verify standards via docs/standards/index.yaml before writing code.
4. Tests and verification are not optional. Every AC in SPEC §6 must have evidence.

ORDER OF WORK
1. Read the SPEC, run log, required docs, standards, and code references.
2. Resolve OQs.
3. Review ACs (§6) and Test Plan (§7); start with the TDD entry point in §8.
4. Execute phases in SPEC §8.
5. Run verification and complete the DoD (§9).
6. Dispatch a verifier sub-agent.
7. Prepare PR-ready output. Do not merge to `{{ integration-branch }}`; integration happens through human PR review.

VERIFIER SUB-AGENT
After your own DoD checklist is green, dispatch a fresh sub-agent:

  "You are verifying {{ deliverable-name }} in {{ absolute-worktree-path }}. Read the
  SPEC at {{ spec-path }} and the shared run log at
  docs/implementation/{{ effort-slug }}-RUN-LOG.md. Follow SPEC §5 Agent
  Implementation Rules. For each AC in SPEC §6, independently verify it by running the
  cited test or command. Cross-check deviations logged in the run log against the code.
  Verify the SPEC slice matches SPEC §3 using the scope command named in the SPEC. Do
  not modify code or the run log. Return PASS/FAIL per AC with evidence."

Only declare done after the verifier reports all-pass.
```

---

*End of SPEC. Implementation proceeds from this SPEC and the run log; no separate PLAN is created.*
