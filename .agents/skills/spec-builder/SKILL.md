---
name: spec-builder
description: Help a user create, draft, refine, or update a deliverable specification (SPEC) for a bounded feature, component, bug fix, refactor, or milestone slice in the qb-mono-wt repo; use when the user wants to write a new spec or improve an existing one, not implement the solution.
---

# Spec Builder Skill

Operational guidance for the agent. User-facing onboarding lives in `README.md`.

## Operating model (revised 2026-05; M2 Reporting API onward)

This skill produces **self-contained SPEC documents**. The stable mapping is:

```text
one deliverable = one SPEC
```

The flexible mapping is delivery topology:

```text
a worktree / branch / PR may contain one deliverable, multiple deliverables, or a
single-lane stack of branches
```

The SPEC is the complete contract for its deliverable — intent, decisions, scope,
acceptance criteria, test plan, execution sequence, code skeletons, halt conditions,
definition of done, and the agent-implementation prompt all live in the SPEC itself.
**There is no separate PLAN document.**

Progress tracking, OQ resolutions, deviations, and manual evidence locations are recorded
in a **RUN-LOG.md** that the implementing agent maintains. RUN-LOG.md is append-only,
local-only (lives in `docs/implementation/`, excluded via `.bare/info/exclude`), never
committed, never appears in PR diffs unless the Owner explicitly changes that.

A single-deliverable branch may have a small run log. A milestone branch with multiple
SPECs uses one shared run log with sections per SPEC. A stacked lane uses one shared run
log when lower-branch decisions or deviations can affect upper branches.

This is a deliberate departure from earlier convention. The earlier convention split
SPEC (intent) from PLAN (execution); experience showed that split adds friction for
walk-away execution with cheaper implementing agents (e.g. Sonnet 4.6) and that the
run-log handles PLAN's progress-tracking function more cleanly. The branch or stack PR is
the reviewable artifact; the SPECs are the executable contracts inside that artifact.
The current operating model is still being refined. If it surfaces problems, revise it.
Until then, this is the default.

### Team integration rule

This is a team repository. Agents and implementors work on feature branches. They may
commit to their branch and push their branch when the SPEC says to, but **they never
merge directly to the integration branch** and SPECs must not instruct them to do so.

All integration happens through human pull-request review. Use language like
"submit a PR to `{{ integration-branch }}`", "after the PR lands", or "after the lower
PR lands" — not "merge to `{{ integration-branch }}`" as an agent action.

The integration branch name is captured during intake (see §Intake / interview model).
It is repo-specific — common values are `dev`, `main`, `master`, `trunk`. Never assume
a value; always ask.

### Bundled methodology reference

This skill is intended to be portable. Its required methodology lives in this skill
bundle, not in a repo-local document that may be absent elsewhere.

Before changing this skill's philosophy, read
`references/spec-driven-development-methodology.md` in this skill directory. If the
active repo also has local methodology docs, use them as project-specific context only;
do not make them required dependencies for this skill.

For stacked branch workflow details, prefer the separate `gh-stack` skill when available.
If it is installed, read its `SKILL.md` and bundled references before drafting stacked
workflow sections. If it is not installed, use the concise stacked-lane guidance bundled
in this skill and tell the Owner that command-level stack guidance should be reviewed.

### What the SPEC must contain

Every SPEC produced by this skill carries these sections (numbering matches the
template):

1. **Capability** — one-paragraph statement of what the deliverable does.
2. **Required reading** — section-pinned references to feature docs, architecture
   docs, prior SPECs in the same deliverable, applicable standards, existing-code
   patterns to mirror, and orientation sections. Cited by section number; never
   restated verbatim.
3. **Invariants** — load-bearing constraints stated verbatim, restated in PR bodies.
4. **Scope** — file list (path + new/modified + reason), strict scope constraint
   naming the allowed directory, and explicit out-of-scope list.
5. **Decisions** — each with "why this over the alternative" rationale. 3-8 typical.
6. **Agent implementation rules** — shared behavior for implementation: branch/PR
   integration rule, commit/push guidance, scope verification topology, autonomy
   boundaries, command working-directory convention, run-log requirements, halt
   conditions.
7. **Acceptance criteria** — numbered, testable, each citing the verifying test or
   command.
8. **Test plan** — concrete test names, what each asserts, reference data sources
   named (existing fixtures, locked baselines, etc.). The test plan implements the ACs;
   it must be defined before the execution sequence.
9. **TDD entry point + Prescriptive Execution Sequence** — a first failing test, then
   phase-by-phase implementation order with code skeletons for non-test files. The
   sequence is derived from the ACs and test plan.
10. **Definition of Done** — binary checklist; unchecked boxes go to the user, not
    self-marked by the agent.
11. **Open Questions** — must be resolved by the user before code is written; logged
    as resolutions in the run log.
12. **Run Log Protocol** — pointer to the shared per-deliverable RUN-LOG.md with
    append rules, sections, and session-start protocol.
13. **Appendix — Agent Implementation Prompt** — paste-ready bootstrap for the
    implementing agent session.

The numbering is not load-bearing; the *presence* of each section is. If a section is
genuinely N/A for a deliverable (rare), state so explicitly rather than omitting.

### What the RUN-LOG.md contains

One run log per delivery effort. A single-SPEC branch may have one section. A milestone
branch may contain multiple deliverables/SPECs and uses sections per SPEC. A stacked lane
uses sections per branch/SPEC when needed.

- **Standards verification** — agent confirms the SPEC's standards-prescription matches
  a fresh `docs/standards/index.yaml` lookup.
- **OQ Resolutions** — verbatim user answers, timestamped.
- **Phase Completions** — commit SHAs, verifying-command outcomes.
- **Deviations** — every departure from the SPEC body, with reason and user-confirmation
  status.
- **Manual Evidence Locations** — paths to baselines, smoke outputs, screenshots, query
  outputs.
- **Issues & Recoveries** — load-bearing failed attempts only (not every red test).
- **Verifier sub-agent report** — pasted PASS/FAIL summary from the final verification.

The run log is the recovery surface for walk-away execution. A fresh agent loaded with
SPEC + RUN-LOG + `git log` can pick up cleanly from any phase.

## Role

You produce a SPEC through interactive dialogue with the deliverable Owner. The SPEC is
the complete contract; you do **not** also produce a PLAN.

You do **not** implement product code in this skill.

## Delivery topology

The Owner may specify a delivery topology at invocation. If they do not, infer the
simplest topology and confirm it.

Use these topologies:

- **Single-deliverable branch** — one deliverable, one SPEC, one branch/PR. Default for
  small and medium changes.
- **Milestone branch** — multiple ordered deliverables/SPECs in one worktree, one branch,
  one shared run log, one PR. Use when the milestone is reviewed as one artifact. M2
  Reporting API is the canonical example.
- **Sibling branches** — multiple independently reviewable branches/PRs for one
  milestone. Use when deliverables do not require a stack dependency.
- **Stacked review lane** — multiple branches stacked inside **one lane worktree** using
  `gh-stack`; each branch is separately reviewed. Use only when review boundaries or
  lower-layer/upper-layer dependency justify stack overhead.

Never model a stack as multiple stacked worktrees. That became too difficult to manage
after even two worktrees. Stacks are branches inside one lane worktree.

For stacked lanes, keep this mental model:

- one worktree = one isolated agent lane / deliverable workspace
- one stack inside that worktree = multiple review branches for the same deliverable
  or tightly related deliverable group
- one branch = one review unit, represented by commits, not by a remembered file list

If the Owner picks `stacked` for something that should be a milestone branch or sibling
branches, flag the concern once and continue with the stated topology if reaffirmed.

## Startup sequence

1. Confirm the delivery topology the Owner specified, or propose the simplest topology
   that fits the intended review artifact.
2. Load the matching workflow + template from this skill directory:
   - `regular-branch-workflow.md` + `regular-SPEC-TEMPLATE.md` for single-deliverable,
     milestone-branch, and sibling-branch SPECs
   - `stacked-branch-workflow.md` + `stacked-SPEC-TEMPLATE.md`
3. Read this skill's bundled `references/spec-driven-development-methodology.md`.
4. Read project orientation (for example `AGENTS.md`, `CLAUDE.md`, or a repo-specific
   orientation file) if present.
5. For stacked topology, read the `gh-stack` skill if available. If not available,
   proceed with this skill's bundled stacked summary and flag that command-level stack
   guidance may need Owner review.
6. Read `docs/standards/index.yaml` from the active worktree when present and load only the
   standards relevant to this deliverable's file set.
7. Inspect existing SPECs in `<worktree>/docs/implementation/` to calibrate level of
   detail. The M2 SPECs (`m2-spec-1-…`, `m2-spec-2-…`, `m2-spec-3-…`) are the canonical
   reference shape under the current operating model.
8. Begin the dialogue. One bounded deliverable/SPEC at a time, while keeping the larger
   milestone topology visible when multiple SPECs share one branch or run log.

## Interaction model

SPEC creation is **interactive with the Owner**. Always.

- Draft, present, redirect, revise. Don't deliver a "finished" SPEC and ask for
  approval.
- Ask short, targeted clarifying questions only when scope, contracts, or ACs are
  genuinely underspecified — not as a long Q&A intake.
- The Owner is the source of truth. If their input contradicts something you derived
  from the codebase, ask which to follow.

## Intake / interview model

If the Owner's initial prompt does not provide enough information to produce a SPEC that
a fresh implementation agent can execute, conduct a focused interview. Do not silently
fill critical gaps with guesses.

Ask in small batches, usually 1-4 questions at a time. Prefer proposing a default and
asking for confirmation when the codebase or methodology makes one likely.

Before presenting a near-final SPEC, the spec-builder agent must be able to state:

- **Deliverable boundary** — what single deliverable this SPEC owns.
- **Feature / milestone context** — which feature and milestone this deliverable belongs
  to, or N/A.
- **Delivery topology** — single-deliverable branch, milestone branch, sibling branch,
  or stacked review lane.
- **Review artifact** — one PR for this SPEC, one milestone PR with multiple SPECs,
  separate sibling PRs, or stacked PRs.
- **Integration branch** — the branch all PRs target (e.g. `dev`, `main`, `master`).
  Confirmed with the Owner; never assumed.
- **Merge policy** — whether agents may merge directly or all integration requires human
  PR review.
- **Run-log shape** — run-log path and whether it is single-SPEC, shared milestone, or
  stacked-lane.
- **Scope and non-goals** — paths likely in scope, paths explicitly out of scope, and
  service boundary.
- **Public/user-visible contracts** — APIs, CLI behavior, schemas, filenames,
  permissions, migrations, compatibility guarantees.
- **Acceptance criteria** — testable outcomes, each with verifying evidence.
- **Reference/test data** — existing fixture path, golden source, synthetic fixture
  plan, or Owner-provided evidence.
- **Standards** — applicable `docs/standards/` entries based on expected file paths and
  activity.
- **Open questions** — unresolved items that must block implementation until answered.

If any of these are unknown, either interview the Owner or mark them explicitly as Open
Questions. Do not write an implementation prompt that invites a coding agent to proceed
while these are unresolved.

### Interview prompts to use when needed

Use these as prompts, not a rigid questionnaire:

- "What is your integration branch — the branch all feature PRs target? (e.g. `dev`,
  `main`, `master`, `trunk`)"
- "Must all changes reach that branch through PR review, or may agents merge directly?"
- "What is the review artifact: one PR for the whole milestone, separate sibling PRs,
  or stacked PRs?"
- "Is this one deliverable/SPEC, or are there multiple deliverables inside the
  milestone?"
- "What must be true for you to call this deliverable done?"
- "What test, fixture, legacy output, or manual evidence proves each outcome?"
- "Which files or service boundary should be strictly out of scope?"
- "Should the implementing agent be allowed to adapt internals if ACs and public
  contracts stay fixed?"
- "What should make the implementing agent stop and ask you instead of continuing?"

## Repo conventions you must respect

- **The integration branch worktree** (e.g. `dev/`, `main/`) **is read-only** except for sync. Never write SPECs or implementation files into it — always work from your feature worktree.
- **Regular SPEC**: `<active-worktree>/docs/implementation/<slug>-SPEC.md`. Hyphen-
  delimited slug. For milestone branches, use one SPEC per deliverable and a consistent
  milestone prefix when useful (e.g., `m2-spec-1-...`, `m2-spec-2-...`).
- **Run log**: `<active-worktree>/docs/implementation/<effort-slug>-RUN-LOG.md`.
  Single-deliverable branches may use the deliverable slug. Milestone branches use the
  milestone/effort slug and sections per SPEC.
- **Stacked report lane**: one worktree named `mw-<slug>-lane` containing stacked
  branches, typically `mw-<slug>-svc-1` (bottom) and `mw-<slug>-svc-2` (top).
  Do not create stacked worktrees.
- **Stacked SPEC**: `<container-root>/<slug>-stacked-SPEC.md` (container root,
  shared by both stacked branches in the lane).
- **Standards** live in `docs/standards/`, gated by `index.yaml`. SPECs prescribe the
  applicable standards; the implementing agent verifies via its own index lookup.
- **Branch scope discipline**: the SPEC is scoped to the diff between its branch and
  the integration branch (`{{ integration-branch }}`, confirmed during intake).
- **No direct integration merges**: agents may commit/push feature branches, but all
  changes reach the integration branch only through human PR review. Do not write SPEC
  prompts that tell agents to merge to the integration branch directly.
- **Manual evidence storage**:
  - `docs/implementation/` for artifacts tied to specific ACs (baselines, OpenAPI
    inspection outputs, captured comparison files). Local-only via `.bare/info/exclude`;
    survives reboots.
  - `backend/scratch/` for generated backend output (CLI files, smoke PDFs,
    performance artifacts). Local-only; survives reboots.
  - **Never `/tmp/`** — wiped on reboot.
- **No batch/harness CLI subcommand for reports.** Shell loops are the batching
  mechanism.
- **CLI filename**: `<QbName>-<Mon>-<YYYY>_<ReportType>_<ts>.{json,md,pdf}`.
- **Decimal**: `ROUND_HALF_UP` in human-display formatters. Banker's rounding forbidden.
- **DB safety**: never propose destructive DB resets.

## SPEC content rules

### Acceptance criteria — TDD-grade detail

Implementers write tests *before* code, against the AC. Each AC must be detailed enough
that a test can be written from it alone, without re-asking the Owner.

- ❌ "AC2 — Tests pass."
- ❌ "AC1 — The report renders correctly."
- ✓ "AC2 — tSQLt suite green: covers all 8 RowType cardinalities, YTD `<=` filter
  semantics, zero-row exclusion, decimal precision (18,6), SortOrder ordering."
- ✓ "AC1 — Service-layer JSON convergence: 14 parametrized cases byte-equal against
  locked fixtures in `tests/svc/reports/<slug>/fixtures/`."

### Test reference data — name the source

Tests need concrete reference data. The SPEC must name where it comes from:

- **Report migrations** → the legacy MS Access report (or other authoritative source).
  Locked JSON fixtures in `tests/svc/reports/<slug>/fixtures/` derived from running the
  legacy report against known inputs. Cite the source and the case matrix.
- **New functionality (no legacy reference)** → reference data must be **created**
  before TDD can begin. Name in the SPEC how: synthetic fixtures, Owner-supplied
  golden files, manually-computed expected values, etc.
- **Locked fixtures already present in the repo** → cite the path; reuse don't
  re-create. The M2 Reporting API SPECs reuse `backend/tests/svc/reports/all_shippers_master/fixtures/`
  as the equivalence baseline; do the same when prior locked fixtures exist for the
  area you're touching.

### Acceptance criteria and test plan come before execution

The SPEC is test/AC-driven. Define what proves the deliverable first, then define how
the agent should implement it.

Order of thought:

1. What capability must be true?
2. What acceptance criteria prove it?
3. What tests or manual checks verify each AC?
4. What TDD entry point should fail first?
5. What execution sequence gets from red to green safely?

Do not write an execution sequence first and retrofit ACs afterward.

### Code skeletons for non-test files

Each SPEC includes **starting skeletons** (function signatures, dataclass shapes, body
outlines with key control flow) for any new non-test file in scope. The implementing
agent treats the skeleton as a starting point, adjusting for real API shapes discovered
during implementation. Skeletons in the SPEC must be load-bearing only on shape (the
dataclass fields, the function signature, the error-class hierarchy); body details can
adapt.

### Agent autonomy — bounded, not caged

SPECs constrain outcomes, boundaries, and contracts. They do not need to prescribe every
implementation move.

Label or phrase content so implementers can distinguish:

- **Hard constraints** — scope, public contracts, invariants, standards, ACs, halt
  conditions, data-safety rules, user-visible compatibility.
- **Adaptive guidance** — skeleton bodies, helper names, exact decorator syntax, test
  organization, internal mechanics.
- **Discovery budget** — nearby code inspection, current repo patterns, and agent
  judgment inside scope.

Agents may adapt guidance when verified local evidence supports it, but they must keep
hard constraints intact, keep the diff inside scope, and log meaningful deviations.
Contract-changing deviations require Owner sign-off and SPEC revision.

### Agent implementation rules section

Every SPEC includes a single common **Agent Implementation Rules** section so operational
behavior does not get scattered across the document. The appendix prompt should point to
that section instead of re-copying every rule.

It includes:

- team integration rule: commit/push feature branches only; never merge to the
  integration branch (value captured from Owner during intake)
- commit/push guidance: default one coherent green commit per SPEC; waypoint commits
  only at green recovery points; push on SPEC completion or explicit handoff/backup
- scope verification topology: full `git diff {{ integration-branch }} --stat` for
  single-SPEC branches; slice diff / commit inspection for milestone branches
- command working-directory convention, e.g. `cd backend` then
  `scripts/withenv ../.env ...`
- run-log maintenance requirements
- bounded autonomy rules: hard constraints vs adaptive guidance
- halt conditions

### Halt Conditions (non-negotiable)

Every SPEC's Agent Implementation Rules include explicit halt conditions. The
implementing agent must stop and surface to the user when any of these occur. Common
halt conditions:

1. Any Open Question unresolved before code change.
2. Same automated test fails 3 iterations in a row.
3. `just format` fails for a reason not addressable by the obvious fix in 2 iterations.
4. `git diff {{ integration-branch }} --stat` shows a file outside scope.
5. Implementation surfaces a perceived need to modify outside the strict scope directory.
6. A standard not prescribed in the SPEC matches the file list via the
   docs/standards/index.yaml lookup.
7. Reference data unavailable (e.g. local test DB lacks the named QB/period combo).

Tailor halt conditions to the SPEC. The list above is the minimum.

### Definition of Done — binary checklist

Every SPEC includes a binary Definition of Done checklist the implementing agent works through.
Unchecked boxes go to the user, not self-marked. Includes:

- All §1 required reading consumed; standards-index verification performed.
- All Open Questions resolved with the user.
- All scoped tests green (cite the pytest invocations).
- All manual verifications complete (cite paths to evidence).
- `just format` exits 0.
- `git diff {{ integration-branch }} --stat` matches §3 exactly.
- All ACs verified (cite the verifying test or command per AC).
- RUN-LOG section for this SPEC up to date through final phase.
- Verifier sub-agent dispatched and returned all-pass.
- PR draft body links to the SPEC and lists each AC's verification.

### Agent Implementation Prompt (appendix)

Every SPEC ends with a paste-ready prompt for the implementing agent session. The prompt:

- Names the worktree path and the SPEC path.
- Names the shared RUN-LOG path.
- Names prior SPECs the agent must read (if this SPEC depends on others).
- Restates non-negotiable rules (strict scope, halt conditions, standards verification,
  TDD discipline, run-log maintenance).
- Orders the work (read SPEC; resolve OQs; execute phases; dispatch verifier).
- Includes the verifier sub-agent prompt verbatim.
- Names the deliverable (working code, passing tests, run-log section populated,
  PR draft).

The prompt is paste-ready — the Owner copies it into a fresh agent session (typically
Sonnet 4.6) and the session bootstraps cleanly.

### Sequence diagram (recommended)

A Mermaid sequence diagram showing the end-to-end execution path is recommended in
most SPECs. Include for:

- **Stacked deliverables** — the seam is the whole point; required.
- **Multi-actor flows** (CLI → service → DB → renderer; user → API → background job).
- Anything where ordering or ownership is hard to pin down in prose.

Skip for trivial config/docs changes or one-line bug fixes.

### Decisions

Each decision answers "why this over the obvious alternative?" — not neutral
description. If a decision reads like a description, it's incomplete.

### What stays OUT of the SPEC

- Status fields (Draft/Approved). Workflow state lives in your kanban tool (Zazz Board)
  or your head — not in the document.
- Verbatim standards or container-conventions text → cite, don't restate.
- Speculative future work ("we might want to...") → in or out, no middle.
- Anything that mutates during implementation other than the RUN-LOG (which is a sibling
  doc, not part of the SPEC).

## SPEC quality bar

A SPEC is complete when:

- Bounded **scope** + explicit **non-goals** + strict scope constraint naming the
  allowed directory.
- Numbered, TDD-grade **ACs** with reference-data sources named.
- **Decisions** with "why this over the alternative" rationale.
- **Prescriptive Execution Sequence** with phase order and code skeletons.
- **ACs before execution** — acceptance criteria and test plan are defined before the
  execution sequence.
- **Agent Implementation Rules** centralized in one section and referenced by the
  appendix prompt.
- **Halt Conditions** explicit and non-negotiable.
- **Definition of Done** binary checklist.
- **Agent Implementation Prompt** paste-ready, includes verifier dispatch.
- **Required reading** cited by section number, not whole documents.
- **Applicable standards** from `docs/standards/` cited (prescribed + verify pattern).
- For stacked: **integration seam** (locked public symbols, types, contracts) concrete
  enough that svc-2 can build on svc-1 through the branch stack.
- **Ownership** identified (per-SPEC deliverable for regular/milestone; per-branch for
  stacked).
- Sequence diagram included where appropriate.

## Stacked mode — additional concerns

### When stacked is the right choice

Two reasons only:

1. The deliverable is a single logical change too large for one human-reviewable PR,
   and slicing it across two PRs would meaningfully help review.
2. There is a hard data/render split where the data-layer slice is genuinely useful
   on its own (e.g., the stored procedure ships before the renderer that consumes it).

**Stacked is NOT the answer when:**

- You have multiple SPECs but one PR should review the milestone as a whole. Use a
  milestone branch instead. The M2 Reporting API is this shape.
- You have multiple independent SPECs that can be reviewed separately without a stack.
  Use sibling branches/PRs instead.
- You want parallelism in review. Multiple regular PRs from sibling worktrees give the
  same parallelism without the stack-rebase overhead.

### Stack-size cap: 2 branches

`mw-<slug>-svc-1` (bottom) + `mw-<slug>-svc-2` (top), at most 3 counting `dev`. Each
additional layer multiplies rebase chains, verification work, and back-propagation
incidents. If a deliverable seems to need 3+ stacked branches, the deliverable is too
big — break it into multiple deliverables, each a regular branch or a 2-branch stack.

### How stacked work runs (single lane, with upstack propagation)

svc-1 and svc-2 run in **one worktree lane** as two stacked branches. The seam contract
in the SPEC is svc-2's load-bearing assumption.

- **Reviews are serial** — svc-1 PR is reviewed and lands first; svc-2 rebases on
  `origin/{{ integration-branch }}` after that PR lands and is reviewed after.
- **Rebases are continuous** — after any svc-1 commit, run the stack rebase upward so
  svc-2 inherits the new lower-layer history; after the svc-1 PR lands, rebase svc-2
  on `origin/{{ integration-branch }}`.
- **Branch ownership is manual** — `gh-stack` tracks stack order, not file ownership.
  Changes belong to a branch only after the agent stages and commits them on that
  branch. Use `git add -p` for mixed hunks.
- **Upstack propagation** — when svc-1's seam shifts mid-flight (rare), svc-2 absorbs
  the change via stack rebase + amendment.

A **concrete seam = cheap back-propagation. A vague seam = expensive
back-propagation.** The SPEC's job is to specify the seam well enough to keep these
incidents rare.

### Calibration check before presenting (stacked)

For stacked SPECs, self-check against prior art before showing a draft:

- **Seam** — locked symbols are concrete (type names, field counts, return-code
  mapping), not vague.
- **Per-branch ACs** — svc-1 has its own AC1..ACn; svc-2 has its own.
- **AC7 (svc-2)** — `git diff` recipe has actual paths, not templated placeholders.
- **Decisions** — each answers "why this over the alternative."

If any fall short, refine before presenting.

## Revision

If implementation surfaces a problem requiring SPEC change:

1. Stop. Don't bury contract changes in commit messages or run-log entries alone.
2. Identify affected ACs and decisions.
3. Get Owner sign-off before editing the SPEC.
4. Mark superseded ACs as `Removed` or `Superseded by ACx` — don't silently delete.
   Add a `Revision history` entry to the SPEC: date, what changed, why, sign-off.
5. Log the revision in the RUN-LOG under "Deviations" with a pointer to the SPEC's
   updated section.
6. Re-verify any phases already complete that touch the changed contract.
7. For stacked: svc-2 rebases upstack from the new svc-1 HEAD and back-propagates.

The procedure is heavyweight on purpose. Frequent revisions = under-specified SPEC,
which is a spec-builder failure.
