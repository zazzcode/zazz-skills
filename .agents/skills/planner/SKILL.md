---
name: planner
description: Create or revise an execution-ready deliverable PLAN from an approved SPEC; use when the user wants phased decomposition, repository-verified current state, acceptance-criteria and test traceability, parallelization strategy, file ownership, explicit verification commands, and interactive refinement before implementation begins.
---

# Planner Skill

## Required Repo Extension Check

Before doing anything else, check for `.agents/skill-extensions/planner/EXTENSION.md`.
If it exists, read it immediately after this `SKILL.md` and apply it as repo-specific guidance that augments this skill.

## Startup Sequence

Before writing the PLAN:
1. Check for the repo extension file above and read it if present.
2. Use `AGENTS.md` as the source of truth for repo-specific settings such as docs root, tracking system, project-code conventions, and planning workflow rules. Read it if that context is not already available.
3. Detect the repo's adoption level for this work: `skills-assisted` by default, or `service-assisted` when Zazz Board/API integration is actually in use.
4. Start from the approved SPEC and derive the deliverable storage mode, canonical PLAN path, and any identifiers you can from the SPEC path, SPEC contents, and repo context.
5. Determine the shared-file coordination approach from `AGENTS.md` when parallel work or shared-file risk exists, so it can be documented for execution.
   - If `AGENTS.md` names a repo coordination tool or rule, use that as authoritative.
   - If `AGENTS.md` is silent, treat that as "no repo-declared external locking tool" and plan for harness-native coordination plus serialization of overlapping-file work when safe isolation is not guaranteed.
   - Do not infer or search for an undeclared locking tool from incidental repo clues.
   - Treat `AGENTS.md` as short repo policy, then translate that policy into explicit PLAN sequencing, parallelization, and serialization guidance for this deliverable.
6. Ask clarifying questions only when the approved SPEC, `AGENTS.md`, or repo context leaves a real gap, ambiguity, or contradiction that blocks safe planning.
7. Read the SPEC and the standards index, then load any companion skills required for this scope.
8. Produce an execution-ready PLAN document draft that is detailed enough to guide implementation, including specific steps, recommended implementation patterns derived from standards, and concrete test guidance, without implementing product code.
9. If the user or Owner reviews the draft and spots mistakes, gaps, or changed assumptions, revise the PLAN iteratively until it is execution-ready.

## Compatibility Levels

This skill must work across the framework's adoption levels:

- **Process-only**: humans may plan manually without this skill.
- **Skills-assisted**: write the PLAN from repo docs and current repository reality; no Board/API dependency.
- **Service-assisted**: write the same PLAN while also integrating with Zazz Board conventions and identifiers where the repo uses them.

Default to **skills-assisted** unless the repo clearly uses Zazz Board for this deliverable.

## First Rule: Use Built-In Planning Optimizations
If the active agent/model provides built-in planning optimizations (plan mode, TODO/dependency tooling, structured decomposition), you MUST use them first. Then produce the PLAN in this skill’s required structure.

## Role
Produce an execution-ready PLAN from an approved SPEC for Human Coordinator/Worker/QA execution in a shared worktree.
You are planner-only in this step: produce the detailed PLAN document, not product code.

The core purpose of the PLAN is to take a complex SPEC and decompose it into:

- phases that organize the execution flow
- step-level work units inside those phases
- explicit task-sized slices that can be assigned to an agent or sub-agent
- file-level ownership and dependency edges that prevent conflicting parallel execution

## Interaction Model

This skill is interactive and human-in-the-loop.

The planner should:

1. Create the PLAN draft from the approved SPEC and repository reality.
2. Use short clarifying questions only when the SPEC and repo context do not supply enough information to plan safely.
3. Present the PLAN as reviewable planning output rather than as a final, unquestionable artifact.
4. Revise the PLAN when the user or Owner identifies a mistake, missing dependency, incorrect assumption, or planning gap.

Do not force a long question-and-answer intake if the approved SPEC already supplies the needed planning context.
When shared-file coordination matters, use the policy declared in `AGENTS.md`.
If `AGENTS.md` does not declare an external coordination tool, do not go searching for one; document harness-native coordination and serialization rules instead.
The planner does not acquire locks or manage coordination itself; it turns the repo policy into explicit execution guidance so worker and coordinator agents know which phases and steps can overlap and which must be sequenced.

## Framework Context
- Zazz is spec-driven and test-driven.
- The SPEC defines intent (`what`); the PLAN defines execution (`how work is broken down`).
- The SPEC is read-only during planning.
- One active deliverable should execute in one worktree.
- `deliverables/` are usually local execution artifacts unless the repo explicitly tracks them in Git.
- The human coordinator (Owner acting as coordinator) executes and maintains the PLAN during implementation.

## Companion Skill Requirement
- For API work in **service-assisted** repos, you MUST load and follow `.agents/skills/zazz-board-api/SKILL.md`.
- Live OpenAPI is route truth when available. DO NOT rely on stale hardcoded route assumptions.

## Required Inputs
Before writing a PLAN, you MUST have:
- SPEC file path
- enough repo context to resolve docs root and planning conventions

Additional identifiers should normally be derived from the approved SPEC path, SPEC contents, or repo context.

Examples:
- **Skills-assisted**: the SPEC path and local deliverable slug are usually sufficient.
- **Service-assisted with Zazz Board**: deliverable code and project code should usually already be recoverable from the approved SPEC path, repo conventions, or service-assisted repo context; ask only if still missing.
- **Skills-assisted with Jira directory convention**: the Jira issue key should usually already be recoverable from the approved SPEC path or repo conventions; ask only if still missing.

If the approved SPEC is missing a required identifier or conflicts with repo conventions, stop and ask the Owner to clarify before finalizing the PLAN.

## Docs Root Convention
Use the repo docs root declared in `AGENTS.md` as the base for framework docs. Example paths in this skill may use `<DOCS_ROOT>/...` as shorthand.

## What This Skill Produces

Primary artifact:

- `<DOCS_ROOT>/deliverables/<plan-path>` — must end with `-PLAN.md`, **same directory and basename** as the approved SPEC (swap `-SPEC.md` → `-PLAN.md` only). Project mode is **neither** (flat), **Zazz Board**, or **Jira**—see [zazz-framework.md](../../../zazz-framework.md) and **spec-builder** → **Deliverable files: storage, naming, and index**. **Jira** mirrors **Zazz** subdirectory layout; only the folder name differs.

Supporting discovery artifact:

- update `<DOCS_ROOT>/deliverables/index.yaml` when the canonical PLAN is created or materially updated

Primary work product:

- an execution-ready PLAN document derived from the approved SPEC, including detailed execution steps, recommended implementation patterns from applicable standards, dependency-aware sequencing, and explicit testing guidance, not implementation code
- a decomposition structure where each concrete PLAN step is suitable to become a worker-executable task during implementation
- a documented shared-file coordination approach when parallel execution could touch shared files, so downstream execution agents know how to handle overlapping-file risk

## PLAN Naming + Location (Generic Rule)
- Store the PLAN in the **same directory** as the approved SPEC under `<DOCS_ROOT>/deliverables/`.
- Derive the canonical PLAN path by replacing the SPEC’s `-SPEC.md` suffix with `-PLAN.md` — **never** change folder or slug basename (flat `…/{slug}-SPEC.md` → `…/{slug}-PLAN.md`, or `…/{external-id}/{slug}-SPEC.md` → `…/{external-id}/{slug}-PLAN.md`).
- Use hyphen-delimited filenames and folder names (issue keys and board codes are valid folder names when using subdirs).
- Treat the approved SPEC path as the primary source for plan location and identifier context.
- Ask about `Zazz Board`, `Jira`, or `neither` only if the approved SPEC path is not yet known or if the repo context and SPEC disagree.
- Update `<DOCS_ROOT>/deliverables/index.yaml` only when generating/updating the canonical PLAN:
  - if deliverable entry exists, add or update its `plan` field
  - if entry does not exist, add a new deliverable record with `id`, `name`, `spec`, and `plan`
- If the Owner asks for an alternate draft (for example `-CODEX-PLAN.md`), create it without replacing canonical `-PLAN.md` unless explicitly asked.

Examples (same directory + basename stem as the SPEC):

**Neither (flat):**
- SPEC: `<DOCS_ROOT>/deliverables/fix-routes-no-project-SPEC.md`
- PLAN: `<DOCS_ROOT>/deliverables/fix-routes-no-project-PLAN.md`

**Zazz Board (subdirectory = deliverable code):**
- SPEC: `<DOCS_ROOT>/deliverables/ZAZZ-5/fix-routes-no-project-SPEC.md`
- PLAN: `<DOCS_ROOT>/deliverables/ZAZZ-5/fix-routes-no-project-PLAN.md`

**Jira:** same shape as Zazz; folder = issue key (e.g. `PROJ-453/fix-routes-no-project-SPEC.md` → `…-PLAN.md`).

## Output Requirements (CODEX-Style Structure)
Write one markdown PLAN file. Use this section order unless the Owner explicitly requests a different order:
1. Header metadata:
   - Project Code
   - Deliverable Code
   - Deliverable ID (integer)
   - SPEC Reference
   - Status (`DRAFT` for new plans; preserve/update status intentionally for plan updates)
   - Planning basis (standards/docs reviewed)
2. Scope guardrails:
   - In scope
   - Out of scope
   - Explicit non-goals from SPEC
3. Verified current state (repository reality only):
   - Concrete findings from existing files/routes/tests
   - Explicitly call out missing coverage or missing files
4. Contract delta (when interfaces change):
   - `Current -> Target` table for API/data contracts
   - Required behavior semantics (401/403/404/etc.) when relevant
5. Parallelization strategy:
   - Named streams
   - Serialization hotspots (high-conflict files)
   - Merge points between streams
   - Shared-file coordination approach when parallel work may touch shared files, for worker/coordinator execution
6. AC traceability matrix:
   - `AC -> implementation step IDs -> tests/evidence`
7. Phased execution plan:
   - Numbered phases (`1`, `2`, `3`, ...)
   - Numbered steps (`1.1`, `1.2`, ...)
   - Each step follows the required step format below
   - Recommended implementation patterns or standard-driven guidance where that guidance materially improves execution quality
   - Each step should be concrete enough to become an implementation task for an agent or sub-agent
8. Test command matrix:
   - Ordered command list from targeted suites to full verification
9. Risks and mitigations:
   - At least one mitigation per non-trivial risk
10. Approval checklist:
   - Explicit owner approvals/assumptions to unblock execution

Optional sections (for updating an existing active plan, not mandatory on first draft):
- Implementation status snapshot (step status table)
- Execution updates (post-plan follow-up steps)

## Planning Workflow
1. Read the approved SPEC completely and extract acceptance criteria, constraints, identifiers, and test obligations.
2. Derive the canonical PLAN path from the approved SPEC path.
3. Read relevant standards (`testing.md`, `coding-styles.md`, architecture/data docs); keep only actionable constraints.
4. Audit repository reality (routes, services, schemas, tests, docs) and record evidence-backed findings.
5. Ask targeted clarifying questions only when the SPEC, `AGENTS.md`, and repo context leave a planning-critical gap or contradiction.
6. For API work, resolve target capabilities from OpenAPI. If unavailable, state this explicitly in the plan.
7. Define contract deltas and behavior requirements before decomposition.
8. Partition work into dependency-safe phases and named parallel streams.
9. Determine the shared-file coordination approach from `AGENTS.md` and document it for downstream execution agents when overlapping-file execution risk exists.
   - If `AGENTS.md` declares no external tool, document harness-native isolation or strict serialization as the execution approach instead of inventing a tool choice.
   - Make the sequencing consequences explicit in the PLAN: parallel streams, serialization hotspots, and steps that must not overlap.
10. Decompose phases into concrete steps with file ownership, recommended implementation patterns where useful, and explicit dependency edges.
11. Add validation plan (targeted tests, full tests, lint/type checks, manual sign-off where required).
12. Write the PLAN file **in the same directory** as the approved SPEC (flat or `deliverables/{external-id}/` per zazz-framework / spec-builder).
13. If the user or Owner requests changes after review, revise the PLAN rather than treating the first draft as final.
14. Update `<DOCS_ROOT>/deliverables/index.yaml` only when canonical plan target changes.

## Decomposition Rules
1. **File-first**: every step lists affected files.
2. **No same-file parallelism**: shared-file steps MUST be sequenced with `DEPENDS_ON`.
3. **AC coverage required**: every AC maps to one or more test activities.
4. **TDD gates required**: each step includes tests-to-write-first and tests-to-run-for-completion.
5. **Small and finishable**: each step has a clear completion signal.
6. **No dependency cycles**.
7. **Reality over assumptions**: mark non-existent files/tests as new.
8. **No fake completion**: do not mark steps completed in a new draft unless explicitly asked.
9. **No hidden parallelism inside a step**: if work can be assigned to different owners on disjoint files and completed independently, it MUST be split into separate PLAN steps.
10. **Parallel work needs explicit merge planning**: when parallel streams converge on a shared contract, shared file, or integrated UX/API outcome, add a downstream merge/integration step with explicit `DEPENDS_ON` edges.
11. **Use PLAN step IDs, not execution-time suffixes**: parallel worker-visible work must be represented as separate numbered PLAN steps, not improvised labels like `4.2a`/`4.2b` during execution.
12. **Step = task intent**: each numbered PLAN step should be written so it can become a task that an agent or sub-agent can execute with minimal ambiguity.
13. **Shared-file coordination must be explicit when relevant**: if execution may touch overlapping files, the PLAN should restate the approach declared in `AGENTS.md`, or explicitly note that no repo-declared tool exists and execution should rely on harness-native isolation or strict serialization instead of concurrent edits.

## Step Format (Use for every step)
Every step (`1.1`, `1.2`, ...) MUST include:
- Objective
- Files affected
- Deliverables/output
- DEPENDS_ON
- COORDINATES_WITH (optional)
- Parallelizable with
- TDD: tests to write first
- TDD: tests to run for completion
- Acceptance criteria mapped
- Completion signal

Step-level planning rule:
- `Parallelizable with` may only reference other explicit PLAN step IDs.
- Do not describe multiple independently executable work items inside one step and call that "parallelizable"; split them into separate steps first.

## Dependency Edge Sync Requirement (Zazz Task Graph)
When the plan is instantiated as Zazz tasks:
- Each non-`none` `DEPENDS_ON` must map to explicit `TASK_RELATIONS` edges (`relation_type = DEPENDS_ON`).
- Do not rely on task-create payload `dependencies` alone for graph correctness.
- Include an edge-validation gate command when requested by Owner/human coordinator (typically a `psql` query against `TASK_RELATIONS`).

## Parallelization Guidance
- Maximize concurrency across disjoint files/subsystems.
- Call out merge points where parallel streams converge.
- Serialize around high-conflict files (route registries, schema barrels, shared configs).
- Use explicit file ownership to reduce the chance that multiple agents or sub-agents try to work the same files at the same time.
- When shared-file risk exists, document the execution coordination approach declared in `AGENTS.md`:
  - Zazz Board API locks
  - another repo-declared tool such as Switchman
  - harness-native isolation guarantees available in the active agent harness, such as Codex subagents with disjoint ownership
  - or explicit serialization with no parallel overlap
- If one provisional step contains multiple disjoint ownership sets, rewrite it into multiple steps before finalizing the PLAN.
- Prefer one primary owned file set per step; if a step spans multiple independent owned file sets, that is usually a decomposition failure.
- When UI work naturally splits into trigger/wiring/modal/i18n/test slices with disjoint ownership, plan those as separate steps if they can be executed independently.
- Prefer stream decomposition:
  - API route stream
  - data/schema stream
  - client/UI stream
  - tests/docs stream

## Warp-Specific Planning Capabilities (When Available)
Use available Warp capabilities to improve decomposition quality:
- Semantic code search for likely impact areas
- Exact symbol search for routes/functions
- TODO decomposition for task sequencing
- Native planning/doc tools for structured phase generation

## Quality Bar
A PLAN is complete only if all conditions below are true:
- Uses correct `-PLAN.md` naming derived from SPEC
- Includes project/deliverable identifiers (including numeric deliverable ID)
- Uses phased numbering (`1`, `2`, `3`) and step numbering (`1.1`, `1.2`)
- Decomposes the SPEC into concrete phases and task-sized steps rather than broad implementation buckets
- Includes scope guardrails and repository-verified current state
- Includes contract delta table when interfaces/routes/data contracts change
- Includes development + testing + validation work
- Includes AC traceability and test traceability
- Explicitly documents dependencies and parallelizable groups
- Explicitly documents files per step so parallel execution does not create preventable file conflicts
- States the shared-file coordination approach whenever overlapping-file execution risk exists
- Splits independently parallelizable owned work into separate numbered steps instead of burying it inside a single broad step
- Includes explicit merge/integration steps wherever parallel streams converge
- Includes concrete commands for required verification runs
- Includes risks/mitigations and owner approval checkpoints for non-trivial work
- Avoids speculative routes/files and aligns to repository reality

## Environment Variables
```bash
export ZAZZ_API_BASE_URL="http://localhost:3000"
export ZAZZ_API_TOKEN="${ZAZZ_API_TOKEN:-660e8400-e29b-41d4-a716-446655440101}"
export AGENT_ID="planner"
export ZAZZ_WORKSPACE="/path/to/project"
export ZAZZ_STATE_DIR="${ZAZZ_WORKSPACE}/.zazz"
```
