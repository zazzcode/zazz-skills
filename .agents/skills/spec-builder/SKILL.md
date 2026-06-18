---
name: spec-builder
description: Help a user create, draft, refine, or update a deliverable specification for a bounded feature, component, bug fix, refactor, or milestone slice; use when the user wants to write a new specification or improve an existing one, not implement the solution.
---

# Spec Builder Skill

Operational guidance for the agent. User-facing onboarding lives in `README.md`.

## Operating model (revised 2026-05; M2 Reporting API onward)

This skill produces **self-contained deliverable specification documents**. The stable mapping is:

```text
one deliverable = one deliverable specification
```

The flexible mapping is delivery topology:

```text
a worktree / branch / PR may contain one deliverable, multiple deliverables, or a
single-lane stack of branches
```

The deliverable specification is the complete contract for its deliverable — intent, decisions, scope,
approved review shape, acceptance criteria, test plan, execution sequence, code skeletons, halt conditions,
definition of done, and the agent-implementation prompt all live in the specification itself.
**There is no separate plan document.**

Progress tracking, OQ resolutions, deviations, QA findings, and manual evidence
locations are recorded in a run log when the effort needs one. The run log is
append-only execution history and follows the repo's declared
policy: by default a locally ignored Markdown file under `<DOCS_ROOT>/execution/`,
or a committed file, Zazz Board note, external tracker entry, or combination when the
repo defines that explicitly. Repos that do not use Zazz Board may rely exclusively on
`<DOCS_ROOT>/execution/` for execution records. When the Owner uses Zazz Board, treat it
as the centralized execution-record service for run logs, handoff notes, QA findings,
and related execution information that must be shared across worktrees, agents, and sessions.

A single-deliverable branch may have a small run log. A milestone branch with
multiple deliverable specifications uses one shared run log with sections per
specification. A stacked lane uses one shared run log when lower-branch
decisions, QA findings, or deviations can affect upper branches.

This is a deliberate departure from earlier convention. The earlier convention split
specification intent from a separate execution plan; experience showed that split adds
friction for walk-away execution and that the run log handles progress
tracking more cleanly. The branch or stack PR is the reviewable artifact; the deliverable
specifications are the executable contracts inside that artifact.
The current operating model is still being refined. If it surfaces problems, revise it.
Until then, this is the default.

### Team integration rule

This is a team repository. Agents and implementors work on feature branches. They may
commit to their branch and push their branch when the deliverable specification says to,
but **they never merge directly to the integration branch** and specifications must not
instruct them to do so.

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

### What the deliverable specification must contain

Every deliverable specification produced by this skill carries these sections (numbering matches the
template):

1. **Capability** — one-paragraph statement of what the deliverable does.
2. **Required reading** — section-pinned references to feature docs, architecture
   docs, prior deliverable specifications in the same delivery effort, applicable standards, existing-code
   patterns to mirror, and orientation sections. Cited by section number; never
   restated verbatim.
3. **Invariants** — load-bearing constraints stated verbatim, restated in PR bodies.
4. **Scope and review shape** — file list (path + new/modified + reason), strict scope
   constraint naming the allowed directory, explicit out-of-scope list, and the
   human-approved decomposition/review plan: one PR, one milestone PR, sibling PRs,
   stacked PRs, or a large exception.
5. **Decisions** — each with "why this over the alternative" rationale. 3-8 typical.
6. **Agent implementation rules** — shared behavior for implementation: branch/PR
   integration rule, commit/push guidance, scope verification topology, autonomy
   boundaries, command working-directory convention, run-log requirements, halt
   conditions.
7. **Acceptance criteria** — numbered, testable, each citing the verifying test or
   command.
8. **Test plan** — concrete, high-signal test names, what each asserts, reference data
   sources named (existing fixtures, locked baselines, etc.). The test plan implements
   the ACs with the smallest meaningful set of tests; it must be defined before the
   execution sequence.
9. **TDD entry point + Prescriptive Execution Sequence** — a first failing test, then
   phase-by-phase implementation order with code skeletons for non-test files. The
   sequence is derived from the ACs and test plan.
10. **Definition of Done** — binary checklist; unchecked boxes go to the user, not
    self-marked by the agent.
11. **Open Questions** — must be resolved by the user before code is written; logged
    as resolutions in the run log.
12. **Run Log Protocol** — pointer to the run log when used,
    including storage policy, append rules, sections, and session-start protocol.
13. **Appendix — Agent Implementation Prompt** — paste-ready bootstrap for the
    implementing agent session.

The numbering is not load-bearing; the *presence* of each section is. If a section is
genuinely N/A for a deliverable (rare), state so explicitly rather than omitting.

### What the run log contains

One run log per delivery effort when the effort needs a mutable execution
record. A single-specification branch may have one section. A milestone branch may
contain multiple deliverables/specifications and uses sections per specification. A
stacked lane uses sections per branch/specification when needed.

- **Standards verification** — agent confirms the specification's standards prescription matches
  a fresh `docs/standards/index.yaml` lookup.
- **OQ Resolutions** — verbatim user answers, timestamped.
- **Phase Completions** — commit SHAs, verifying-command outcomes.
- **QA Findings & Rework** — QA pass/fail summaries, weak-test findings, specification-gap
  findings, rework task references, and re-verification outcomes.
- **Deviations** — every departure from the specification body, with reason and user-confirmation
  status.
- **Manual Evidence Locations** — paths to baselines, smoke outputs, screenshots, query
  outputs.
- **Issues & Recoveries** — load-bearing failed attempts only (not every red test).
- **Verifier / QA sub-agent report** — pasted PASS/FAIL summary from final or phase-level
  verification.

The run log is the recovery surface for walk-away execution. A fresh agent
loaded with specification + run log + `git log` can pick up cleanly from any
phase.

## Role

You produce a deliverable specification through interactive dialogue with the deliverable Owner. The specification is
the complete contract; you do **not** also produce a separate plan document.

You do **not** implement product code in this skill.

## Delivery topology

The Owner may specify a delivery topology at invocation. If they do not, infer the
simplest topology and confirm it.

For features and deliverables, decomposition and stacking are specification-time
decisions. The specification must define the review shape before implementation starts:
one PR, multiple deliverables in one milestone PR, sibling PRs, a bounded stacked review
lane, or a large exception. If implementation later shows the approved shape is wrong,
the implementor must stop and route the change back through specification revision with
Owner sign-off rather than inventing a split or stack after coding has started.

Use these topologies:

- **Single-deliverable branch** — one deliverable, one specification, one branch/PR. Default for
  small and medium changes.
- **Milestone branch** — multiple ordered deliverables/specifications in one worktree, one branch,
  one shared run log, one PR. Use when the milestone is reviewed as one artifact. M2
  Reporting API is the canonical example.
- **Sibling branches** — multiple independently reviewable branches/PRs for one
  milestone. Use when deliverables do not require a stack dependency.
- **Stacked review lane** — multiple branches stacked inside **one lane worktree** using
  `gh-stack`; each branch is separately reviewed and still requires human sign-off. Use
  when review boundaries or lower-layer/upper-layer dependency justify stack overhead.

Never model a stack as multiple stacked worktrees. That became too difficult to manage
after even two worktrees. Stacks are branches inside one lane worktree.

For stacked lanes, keep this mental model:

- one worktree = one isolated agent lane, usually for one deliverable, but it may contain
  multiple deliverables when those deliverables are implemented as a stacked branch lane
- one stack inside that worktree = multiple review branches for the same deliverable or
  tightly related deliverable group
- one branch = one review unit, represented by commits, not by a remembered file list

If the Owner picks `stacked` for something that should be a milestone branch or sibling
branches, flag the concern once and continue with the stated topology if reaffirmed.

## Startup sequence

1. Confirm the delivery topology the Owner specified, or propose the simplest topology
   that fits the intended review artifact.
2. Load the matching workflow + template from this skill directory:
   - `regular-branch-workflow.md` + `regular-specification-template.md` for single-deliverable,
     milestone-branch, and sibling-branch specifications
   - `stacked-branch-workflow.md` + `stacked-specification-template.md`
3. Read this skill's bundled `references/spec-driven-development-methodology.md`.
4. Read project orientation (for example `AGENTS.md` or a repo-specific
   orientation file) if present.
5. For stacked topology, read the `gh-stack` skill if available. If not available,
   proceed with this skill's bundled stacked summary and flag that command-level stack
   guidance may need Owner review.
6. Read `docs/standards/index.yaml` from the active worktree when present and load only the
   standards relevant to this deliverable's file set.
7. Inspect existing specifications in `<DOCS_ROOT>/specifications/`, Zazz Board, or the
   repo's declared external tracking location to calibrate level of detail.
8. Begin the dialogue. One bounded deliverable/specification at a time, while keeping the larger
   milestone topology visible when multiple specifications share one branch or run log.

## Interaction model

Deliverable specification creation is **interactive with the Owner**. Always.

- Draft, present, redirect, revise. Don't deliver a "finished" specification and ask for
  approval.
- Ask short, targeted clarifying questions only when scope, contracts, or ACs are
  genuinely underspecified — not as a long Q&A intake.
- The Owner is the source of truth. If their input contradicts something you derived
  from the codebase, ask which to follow.

## Intake / interview model

If the Owner's initial prompt does not provide enough information to produce a specification that
a fresh implementation agent can execute, conduct a focused interview. Do not silently
fill critical gaps with guesses.

Ask in small batches, usually 1-4 questions at a time. Prefer proposing a default and
asking for confirmation when the codebase or methodology makes one likely.

Before presenting a near-final specification, the spec-builder agent must be able to state:

- **Deliverable boundary** — what single deliverable this specification owns.
- **Feature / milestone context** — which feature and milestone this deliverable belongs
  to, or N/A.
- **Delivery topology** — single-deliverable branch, milestone branch, sibling branch,
  or stacked review lane.
- **Review artifact** — one PR for this specification, one milestone PR with multiple specifications,
  separate sibling PRs, or stacked PRs.
- **Decomposition rationale** — why this review shape is correct, what alternatives were
  rejected, and which review units, stack branches, or sibling specifications are owned
  by this specification.
- **Integration branch** — the branch all PRs target (e.g. `dev`, `main`, `master`).
  Confirmed with the Owner; never assumed.
- **Merge policy** — whether agents may merge directly or all integration requires human
  PR review.
- **Run-log shape** — run-log path/location and whether it is
  single-specification, shared milestone, or stacked-lane.
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
- "What is the approved review shape: one PR, one milestone PR, separate sibling PRs,
  stacked PRs, or a large exception?"
- "What decomposition rationale should the specification record — why this shape over
  the alternatives?"
- "Is this one deliverable/specification, or are there multiple deliverables inside the
  milestone?"
- "What must be true for you to call this deliverable done?"
- "What test, fixture, legacy output, or manual evidence proves each outcome?"
- "Which files or service boundary should be strictly out of scope?"
- "Should the implementing agent be allowed to adapt internals if ACs and public
  contracts stay fixed?"
- "What should make the implementing agent stop and ask you instead of continuing?"

## Repo conventions you must respect

- **The integration branch worktree** (e.g. `dev/`, `main/`) **is read-only** except for sync. Never write
  specifications or implementation files into it; always work from the active feature worktree or the repo's approved
  documentation surface.
- **Specification location**: when committed in Git, deliverable specifications live in
  `<DOCS_ROOT>/specifications/{slug}.md` unless the repo declares a more specific naming policy. Because the directory
  already names the artifact type, filenames do not need a `SPEC` suffix.
- **External specification storage**: when the repo policy says specifications are not committed, store or link them
  in Zazz Board or the declared external tracker and include enough stable identifier context for agents and reviewers
  to find the artifact.
- **Run log**: use the storage surface declared by the repo. When stored on disk, default
  to `<DOCS_ROOT>/execution/{slug}-run-log.md` or
  `<DOCS_ROOT>/execution/{milestone-or-lane-slug}-run-log.md`, usually excluded
  from Git by repo-local or bare-repo exclude rules. External Zazz Board notes or tracker
  records are also valid when declared. If the repo does not use Zazz Board, the execution
  directory may be the exclusive record surface. If the repo does use Zazz Board, use it as
  the shared execution-record surface when multiple agents need the same run log or handoff
  context across worktrees and sessions. Milestone branches use sections per specification.
- **Stacked review lane**: one worktree contains the stacked branches managed with `gh-stack`. Do not create stacked
  worktrees. A worktree normally has one deliverable, but a stacked lane may contain multiple deliverables/specifications
  when those deliverables are intentionally stacked for review.
- **Standards** live in `docs/standards/`, gated by `index.yaml`. Specifications prescribe the
  applicable standards; the implementing agent verifies via its own index lookup.
- **Branch scope discipline**: the specification is scoped to the diff between its branch and
  the integration branch (`{{ integration-branch }}`, confirmed during intake).
- **Approved review shape discipline**: specifications define decomposition and stacking
  before implementation. A PR must show conformance to the approved review shape; a
  needed topology change is a specification revision, not a late implementation choice.
- **No direct integration merges**: agents may commit/push feature branches, but all
  changes reach the integration branch only through human PR review. Do not write specification
  prompts that tell agents to merge to the integration branch directly.
- **Manual evidence storage**:
  - Follow the repo's declared artifact policy for baselines, OpenAPI inspection outputs, screenshots, captured
    comparisons, smoke outputs, and performance artifacts.
  - Prefer durable repo-local ignored paths, committed evidence paths, or Zazz Board attachments/notes over ephemeral
    locations.
  - **Never rely on `/tmp/`** for evidence that must survive reboot.

## Specification content rules

### Acceptance criteria — TDD-grade detail

Implementers write tests *before* code, against the AC. Each AC must be detailed enough
that a test can be written from it alone, without re-asking the Owner.

- ❌ "AC2 — Tests pass."
- ❌ "AC1 — The page works correctly."
- ✓ "AC2 — API validation rejects missing `customerId`, non-UUID `customerId`, and
  unauthorized tenant access with the documented status codes."
- ✓ "AC1 — Export output is byte-equal against 14 locked fixture cases in
  `tests/fixtures/<slug>/`."

### Test reference data — name the source

Tests need concrete reference data. The specification must name where it comes from:

- **Migrations or compatibility work** → the legacy system, existing behavior, prior API contract, or other
  authoritative source. Locked fixtures or baselines should cite the source and case matrix.
- **New functionality (no legacy reference)** → reference data must be **created**
  before TDD can begin. Name in the specification how: synthetic fixtures, Owner-supplied
  golden files, manually-computed expected values, etc.
- **Locked fixtures already present in the repo** → cite the path; reuse don't
  re-create when prior locked fixtures exist for the area you're touching.

### Test plan value bar — fewer tests, stronger signals

The specification should prevent test sprawl. Do not reward agents for adding many
shallow tests that mostly exercise mocks, implementation details, or duplicated
branches. The test plan is a review contract, not a quota.

Tests are part of the deliverable contract. The specification defines the required test
intent, reference data, realistic edge cases, and verifying commands before
implementation starts. Implementers may adapt exact test names or local helper mechanics
to match the repo, but they must not weaken, delete, rewrite, or move the specified test
coverage just to make implementation pass. Any material change to test intent, covered
edge cases, reference data, or verification layer requires Owner sign-off and a
specification revision.

Every proposed automated test must answer:

1. Which AC, invariant, public contract, regression, realistic edge case, or risk does
   this test prove?
2. Would this test fail for a meaningful bug a reviewer cares about?
3. Is this behavior already covered by an equal or stronger test nearby?
4. Does the test assert observable behavior or a stable boundary, rather than private
   mechanics that may change during refactor?
5. Is its setup proportional to the risk it covers?

Edge cases are mandatory when the field risk is real, but they should be selected from
actual boundaries users, data, integrations, permissions, time, concurrency, migration
history, or prior bugs can hit. Do not invent fanciful edge cases just to grow the test
list.

Prefer:

- one integrated contract or behavior test over several mock-heavy tests that only
  confirm collaborators were called
- table-driven case matrices when several realistic edge cases share one behavior
  boundary
- compact boundary matrices that cover representative invalid, empty, maximum/minimum,
  unauthorized, cross-tenant, missing-data, ordering, time-zone/date, idempotency, and
  concurrency cases when those risks apply
- focused regression tests for bugs with a known failure mode
- reusing existing fixtures and helpers instead of inventing parallel test worlds
- manual verification only for human-judgment surfaces such as visual fit, copy tone,
  or UAT flows that automation cannot reliably judge

Avoid specifying:

- tests whose only assertion is that a function was invoked
- duplicate happy-path tests across adjacent layers unless each layer owns a distinct
  public contract
- snapshot churn or golden files that reviewers cannot interpret
- tests coupled to temporary helper names, exact private call order, or incidental data
  shape
- unrealistic edge-case permutations that cannot occur through supported inputs or
  repo-declared data flows
- broad "coverage padding" tests added only to make a PR look safer

When a test is intentionally omitted because nearby coverage is already sufficient,
say so briefly in the Test Plan. That gives implementers permission to keep the PR
clean and gives reviewers a concrete rationale.

If QA later finds that the specified tests are low-signal, missing realistic edge cases,
or testing the wrong boundary, that is a specification quality issue. QA should route the
finding back through the owner or governing workflow for test-plan clarification or specification
revision before the implementer proceeds.

### Acceptance criteria and test plan come before execution

The specification is test/AC-driven. Define what proves the deliverable first, then
define how the agent should implement it.

Order of thought:

1. What capability must be true?
2. What acceptance criteria prove it?
3. What realistic edge cases and boundary conditions could break this in the field?
4. What compact tests or manual checks verify each AC and those edge cases?
5. What TDD entry point should fail first?
6. What execution sequence gets from red to green safely?

Do not write an execution sequence first and retrofit ACs afterward.

### Code skeletons for non-test files

Each specification includes **starting skeletons** (function signatures, dataclass shapes, body
outlines with key control flow) for any new non-test file in scope. The implementing
agent treats the skeleton as a starting point, adjusting for real API shapes discovered
during implementation. Skeletons in the specification must be load-bearing only on shape (the
dataclass fields, the function signature, the error-class hierarchy); body details can
adapt.

### Agent autonomy — bounded, not caged

Specifications constrain outcomes, boundaries, and contracts. They do not need to prescribe every
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
Contract-changing deviations require Owner sign-off and specification revision.

### Agent implementation rules section

Every specification includes a single common **Agent Implementation Rules** section so operational
behavior does not get scattered across the document. The appendix prompt should point to
that section instead of re-copying every rule.

It includes:

- team integration rule: commit/push feature branches only; never merge to the
  integration branch (value captured from Owner during intake)
- commit/push guidance: default one coherent green commit per specification; waypoint commits
  only at green recovery points; push on specification completion or explicit handoff/backup
- scope verification topology: full `git diff {{ integration-branch }} --stat` for
  single-specification branches; slice diff / commit inspection for milestone branches
- command working-directory convention, e.g. `cd backend` then
  `scripts/withenv ../.env ...`
- run-log maintenance requirements
- bounded autonomy rules: hard constraints vs adaptive guidance
- halt conditions

### Halt Conditions (non-negotiable)

Every specification's Agent Implementation Rules include explicit halt conditions. The
implementing agent must stop and surface to the user when any of these occur. Common
halt conditions:

1. Any Open Question unresolved before code change.
2. Same automated test fails 3 iterations in a row.
3. `just format` fails for a reason not addressable by the obvious fix in 2 iterations.
4. `git diff {{ integration-branch }} --stat` shows a file outside scope.
5. Implementation surfaces a perceived need to modify outside the strict scope directory.
6. A standard not prescribed in the specification matches the file list via the
   docs/standards/index.yaml lookup.
7. Reference data unavailable (e.g. local test DB lacks the named reference data/period combo).

Tailor halt conditions to the specification. The list above is the minimum.

### Definition of Done — binary checklist

Every specification includes a binary Definition of Done checklist the implementing agent works through.
Unchecked boxes go to the user, not self-marked. Includes:

- All §1 required reading consumed; standards-index verification performed.
- All Open Questions resolved with the user.
- All scoped tests green (cite the pytest invocations).
- All manual verifications complete (cite paths to evidence).
- `just format` exits 0.
- `git diff {{ integration-branch }} --stat` matches §3 exactly.
- All ACs verified (cite the verifying test or command per AC).
- Run-log section for this specification up to date through final phase when a run log is used.
- Verifier sub-agent dispatched and returned all-pass.
- PR draft body links to the specification or Zazz Board specification record and lists each AC's verification.

### Agent Implementation Prompt (appendix)

Every specification ends with a paste-ready prompt for the implementing agent session. The prompt:

- Names the worktree path and the specification path or external specification record.
- Names the run-log path/location when used.
- Names prior specifications the agent must read (if this specification depends on others).
- Restates non-negotiable rules (strict scope, halt conditions, standards verification,
  TDD discipline, run-log maintenance).
- Orders the work (read the specification; resolve OQs; execute phases; dispatch verifier).
- Includes the verifier sub-agent prompt verbatim.
- Names the deliverable (working code, passing tests, run-log section populated,
  PR draft).

The prompt is paste-ready — the Owner can copy it into a fresh agent session and the session bootstraps cleanly.

### Sequence diagram (recommended)

A Mermaid sequence diagram showing the end-to-end execution path is recommended in
most specifications. Include for:

- **Stacked deliverables** — the lower-to-upper branch contract is the whole point; required.
- **Multi-actor flows** (CLI → service → DB → renderer; user → API → background job).
- Anything where ordering or ownership is hard to pin down in prose.

Skip for trivial config/docs changes or one-line bug fixes.

### Decisions

Each decision answers "why this over the obvious alternative?" — not neutral
description. If a decision reads like a description, it's incomplete.

### What stays OUT of the specification

- Status fields (Draft/Approved). Workflow state lives in your kanban tool (Zazz Board)
  or your head — not in the document.
- Verbatim standards or container-conventions text → cite, don't restate.
- Speculative future work ("we might want to...") → in or out, no middle.
- Mutable execution state other than the run log, which is a sibling artifact or external record rather than part of
  the specification.

## Specification quality bar

A deliverable specification is complete when:

- Bounded **scope** + explicit **non-goals** + strict scope constraint naming the
  allowed directory.
- Numbered, TDD-grade **ACs** with reference-data sources named.
- **Test plan** is high-signal and proportional: every test maps to an AC, invariant,
  public contract, realistic edge case, regression, or named risk, and duplicate/low-value
  tests are explicitly avoided.
- **Decisions** with "why this over the alternative" rationale.
- **Prescriptive Execution Sequence** with phase order and code skeletons.
- **ACs before execution** — acceptance criteria and test plan are defined before the
  execution sequence.
- **Review shape before execution** — the specification records the approved
  decomposition/review plan and rationale before implementation starts.
- **Agent Implementation Rules** centralized in one section and referenced by the
  appendix prompt.
- **Halt Conditions** explicit and non-negotiable.
- **Definition of Done** binary checklist.
- **Agent Implementation Prompt** paste-ready, includes verifier dispatch.
- **Required reading** cited by section number, not whole documents.
- **Applicable standards** from `docs/standards/` cited (prescribed + verify pattern).
- For stacked: **integration seam** (locked public symbols, types, contracts) concrete
  enough that an upper branch can build on a lower branch through the branch stack.
- **Ownership** identified (per-specification deliverable for regular/milestone; per-branch for
  stacked).
- Sequence diagram included where appropriate.

## Stacked mode — additional concerns

### When stacked is the right choice

Use stacked branches when dependent PRs make the work easier to review or sequence than
one combined branch. Good reasons include:

1. A single logical change has meaningful internal review boundaries.
2. A lower-layer contract needs to land or be reviewed before upper-layer behavior.
3. Several deliverables are tightly related but easier for a human to comprehend as a
   stack of focused PRs.

**Stacked is NOT the answer when:**

- You have multiple specifications but one PR should review the milestone as a whole.
  Use a milestone branch instead.
- You have multiple independent specifications that can be reviewed separately without a stack.
  Use sibling branches/PRs instead.
- You want parallelism in review. Multiple regular PRs from sibling worktrees give the
  same parallelism without the stack-rebase overhead.

Stacked review must be approved in the specification before implementation starts. Do
not convert an oversized or drifting implementation into a stack during PR cleanup
without revising the specification and getting Owner sign-off.

### Stack reviewability

Do not enforce a universal branch-count or changed-file limit. Instead, make each PR in
the stack comprehensible on its own terms: clear dependency, focused purpose, concrete
acceptance criteria, and a PR body that explains what the human reviewer should evaluate.
If the stack shape makes the review harder to understand during specification review,
split, flatten, or convert it to sibling branches or a milestone branch before
implementation starts.

### How stacked work runs (single lane, with upstack propagation)

Stack branches run in **one worktree lane**. The lower-branch contract in the
specification is the upper branch's load-bearing assumption.

- **Reviews are ordered** — lower PRs are reviewed and land before dependent upper PRs;
  upper branches rebase on `origin/{{ integration-branch }}` after lower PRs land.
- **Rebases are continuous** — after any lower-branch commit, run the stack rebase upward
  so upper branches inherit the new lower-layer history; after a lower PR lands, rebase
  dependent upper branches on `origin/{{ integration-branch }}`.
- **Branch ownership is manual** — `gh-stack` tracks stack order, not file ownership.
  Changes belong to a branch only after the agent stages and commits them on that
  branch. Use `git add -p` for mixed hunks.
- **Upstack propagation** — when a lower-branch contract shifts mid-flight, upper branches absorb
  the change via stack rebase + amendment.

A concrete contract keeps rework contained. The specification's job is to describe the
lower-to-upper contract well enough that these incidents stay rare.

### Calibration check before presenting (stacked)

For stacked specifications, self-check before showing a draft:

- **Seam** — locked symbols are concrete (type names, field counts, return-code
  mapping), not vague.
- **Per-branch ACs** — each branch has its own acceptance criteria.
- **Scope verification** — `git diff` recipes have actual paths, not templated placeholders.
- **Decisions** — each answers "why this over the alternative."

If any fall short, refine before presenting.

## Revision

If implementation surfaces a problem requiring specification change:

1. Stop. Don't bury contract changes in commit messages or run-log entries alone.
2. Identify affected ACs and decisions.
3. Get Owner sign-off before editing the specification.
4. Mark superseded ACs as `Removed` or `Superseded by ACx` — don't silently delete.
   Add a `Revision history` entry to the specification: date, what changed, why, sign-off.
5. Log the revision in the run log under "Deviations" with a pointer to the specification's
   updated section.
6. Re-verify any phases already complete that touch the changed contract.
7. For stacked: upper branches rebase upstack from the new lower-branch HEAD and back-propagate.

The procedure is heavyweight on purpose. Frequent revisions = under-specified deliverable specification,
which is a spec-builder failure.
