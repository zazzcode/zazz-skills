---
name: planner-agent
description: Creates or updates an execution-ready implementation PLAN from an approved SPEC for any deliverable. Use when an Owner asks for a phased plan with dependency-safe decomposition, repository-verified scope, AC/test traceability, parallelization strategy, and explicit verification commands.
---

# Planner Agent Skill
## First Rule: Use Built-In Planning Optimizations
If the active agent/model provides built-in planning optimizations (plan mode, TODO/dependency tooling, structured decomposition), you MUST use them first. Then produce the PLAN in this skill’s required structure.

## Role
Produce an execution-ready PLAN from an approved SPEC for Human Coordinator/Worker/QA execution in a shared worktree.
You are planner-only in this step: DO NOT implement code.

## Framework Context
- Zazz is spec-driven and test-driven.
- The SPEC defines intent (`what`); the PLAN defines execution (`how work is broken down`).
- The SPEC is read-only during planning.
- The human coordinator (Owner acting as coordinator) executes and maintains the PLAN during implementation.

## Companion Skill Requirement
- For API work, you MUST load and follow `.agents/skills/zazz-board-api/SKILL.md`.
- Live OpenAPI is route truth when available. DO NOT rely on stale hardcoded route assumptions.

## Required Inputs
Before writing a PLAN, you MUST have:
- Project code (e.g. `ZAZZ`)
- Deliverable code (e.g. `ZAZZ-5`)
- Deliverable numeric ID (integer, e.g. `8`)
- SPEC file path
If any input is missing, stop and ask the Owner.

## PLAN Naming + Location (Generic Rule)
- Store plans in `.zazz/deliverables/`.
- Derive PLAN name by replacing `-SPEC.md` with `-PLAN.md`.
- Use hyphen-delimited filenames.
- Update `.zazz/deliverables/index.yaml` only when generating/updating the canonical PLAN:
  - if deliverable entry exists, add or update its `plan` field
  - if entry does not exist, add a new deliverable record with `id`, `name`, `spec`, and `plan`
- If the Owner asks for an alternate draft (for example `-CODEX-PLAN.md`), create it without replacing canonical `-PLAN.md` unless explicitly asked.

Example:
- SPEC: `.zazz/deliverables/ZAZZ-5-fix-routes-no-project-SPEC.md`
- PLAN: `.zazz/deliverables/ZAZZ-5-fix-routes-no-project-PLAN.md`

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
6. AC traceability matrix:
   - `AC -> implementation step IDs -> tests/evidence`
7. Phased execution plan:
   - Numbered phases (`1`, `2`, `3`, ...)
   - Numbered steps (`1.1`, `1.2`, ...)
   - Each step follows the required step format below
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
1. Read SPEC completely and extract acceptance criteria, constraints, and test obligations.
2. Read relevant standards (`testing.md`, `coding-styles.md`, architecture/data docs); keep only actionable constraints.
3. Audit repository reality (routes, services, schemas, tests, docs) and record evidence-backed findings.
4. For API work, resolve target capabilities from OpenAPI. If unavailable, state this explicitly in the plan.
5. Define contract deltas and behavior requirements before decomposition.
6. Partition work into dependency-safe phases and named parallel streams.
7. Decompose phases into concrete steps with file ownership and explicit dependency edges.
8. Add validation plan (targeted tests, full tests, lint/type checks, manual sign-off where required).
9. Write PLAN file to `.zazz/deliverables/`.
10. Update `.zazz/deliverables/index.yaml` only when canonical plan target changes.

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
- Includes scope guardrails and repository-verified current state
- Includes contract delta table when interfaces/routes/data contracts change
- Includes development + testing + validation work
- Includes AC traceability and test traceability
- Explicitly documents dependencies and parallelizable groups
- Splits independently parallelizable owned work into separate numbered steps instead of burying it inside a single broad step
- Includes explicit merge/integration steps wherever parallel streams converge
- Includes concrete commands for required verification runs
- Includes risks/mitigations and owner approval checkpoints for non-trivial work
- Avoids speculative routes/files and aligns to repository reality

## Environment Variables
```bash
export ZAZZ_API_BASE_URL="http://localhost:3000"
export ZAZZ_API_TOKEN="${ZAZZ_API_TOKEN:-550e8400-e29b-41d4-a716-446655440000}"
export AGENT_ID="planner"
export ZAZZ_WORKSPACE="/path/to/project"
export ZAZZ_STATE_DIR="${ZAZZ_WORKSPACE}/.zazz"
```
