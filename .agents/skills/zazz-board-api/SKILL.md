---
name: "Zazz Board API"
type: "rule"
description: "Required API skill for agents to create and manage deliverables/tasks using live OpenAPI. OpenAPI is source of truth; resolve routes by capability instead of brittle hardcoded full path lists."
required_for: ["planner", "coordinator", "worker", "qa", "spec-builder"]
---

# Zazz Board API (Agent Routes)
## Purpose
Agents use this API to create/manage deliverables and tasks, update statuses, append notes, and inspect task graph/readiness. Projects and users are pre-configured; agents do not create them.

---

## Authentication
All API requests (except `/openapi.json`, `/health`, `/`, `/db-test`, `/token-info`) require:
- Header: `TB_TOKEN: <uuid>` or `Authorization: Bearer <uuid>`
- Token resolution: `ZAZZ_API_TOKEN` when set, otherwise fallback `550e8400-e29b-41d4-a716-446655440000`

---

## Environment variables
- `ZAZZ_API_BASE_URL` (fallback: `http://localhost:3030`)
- `ZAZZ_API_TOKEN` (required token source; fallback if unset: `550e8400-e29b-41d4-a716-446655440000`)
- `ZAZZ_PROJECT_CODE` (fallback: `ZAZZ`)
- `ZAZZCTL_PROFILE` (optional default profile: `generic`, `worker`, `planner`, `spec_builder`)

---

## Canonical CLI Adapter (Required)
Use the canonical Node CLI for board communication:
- Script: `.agents/skills/zazz-board-api/scripts/zazzctl.mjs`
- Runtime prereq: Node.js 22+ (project baseline)

CLI-first policy:
- Use `zazzctl` as the default communication path.
- Do not handcraft ad-hoc `curl` for normal execution.
- `curl` is allowed only for OpenAPI fetch/debugging when the CLI is missing a capability.

Role profile usage:
- Worker: `zazzctl --profile worker ...`
- Planner: `zazzctl --profile planner ...`
- Spec Builder: `zazzctl --profile spec_builder ...`
- Generic (fallback): `zazzctl ...` or `zazzctl --profile generic ...`

---

## Source of truth: OpenAPI
Always fetch the live spec from:
`{ZAZZ_API_BASE_URL}/openapi.json`

Rules:
- Parse `paths` + operation metadata (`tags`, `summary`, `description`, params, requestBody, responses).
- Do not trust stale hardcoded route lists when OpenAPI differs.
- Do not invent routes; derive from live spec.
- If using a local command adapter (e.g. worker `zazzctl`), keep behavior aligned with OpenAPI-derived routes and schemas.

---

## Capability-first routing model (hybrid)
Use capability names as the stable contract, then resolve concrete routes from OpenAPI.

Core capabilities:
- Create/list/get/update/approve/status-change deliverable
- Create/list/get/update/delete/status-change task (deliverable-scoped)
- Append notes to task
- Get deliverable graph
- Create task relations (`DEPENDS_ON`, `COORDINATES_WITH`)
- Check task readiness
- Acquire/heartbeat/release/list deliverable file locks
- Get deliverable status workflow
- Image operations (list/upload/delete/fetch/metadata) using project-scoped routes
- Spec-builder board sync: create deliverable, set deliverable status, set `specFilepath`

---

## Deterministic route resolution rules
For each capability:
1. Filter operations by tags relevant to agent workflows: `deliverables`, `projects`, `task-graph`, `file-locks`, `images`.
2. Match method + intent keywords in `summary`/`description`.
3. Prefer project/deliverable-scoped routes over global/legacy routes.
4. If multiple matches remain, choose the most specific path (more scoped params).
5. Read request/response schemas from OpenAPI before constructing requests.
6. If no match is found, stop and report missing capability + method + candidates.

Image/graph routing policy:
- Use deliverable graph route (`/projects/{code}/deliverables/{delivId}/graph`).
- Do not use project-wide graph route (`/projects/{code}/graph`) if absent in OpenAPI.
- Use only project-scoped image routes; do not fallback to legacy global/task-only image routes.

---

## Minimal critical assertions (guardrails)
These capabilities must resolve for normal agent workflows:
- Create deliverable
- Update deliverable
- Change deliverable status
- Approve deliverable
- Create task in deliverable
- Change task status in deliverable
- Acquire file locks
- Heartbeat file locks
- Release file locks
- Get deliverable graph
- Check task readiness

If a critical capability cannot be resolved, stop and surface the mismatch.

---

## Request construction rules
- Never infer body fields from memory; derive from OpenAPI schema.
- Never invent required user inputs; ask the human for missing data.
- Use numeric IDs where path schema expects numeric IDs (`id`, `delivId`, `taskId`).
- Treat `deliverableId` (e.g., `ZAZZ-4`) as display-only unless schema says otherwise.

---

## Mandatory execution contract
For coordinator/worker/qa agent runs, these behaviors are required:
- Use live API for all task/deliverable lifecycle updates.
- Do not leave created tasks in ambiguous state.
- Keep task graph relations explicit and verifiable.

Task lifecycle (required):
1. Create task in deliverable (`POST /projects/{code}/deliverables/{delivId}/tasks`) with:
   - `title`
   - `phase`
   - `phaseStep`
   - `prompt`
2. If task begins execution, set status to `IN_PROGRESS` (`PATCH .../tasks/{taskId}/status`) once execution preconditions are met.
3. On implementation completion, move status according to live workflow (some projects include `QA`, others transition directly to `COMPLETED`).
4. Use task update route (not status route) for task-level blockers: `isBlocked` and `blockedReason`.

Deliverable lifecycle (required):
- Resolve project deliverable workflow from API/OpenAPI-capable endpoints.
- Update deliverable status explicitly with status endpoints; do not assume implicit transitions.
- Approve deliverable explicitly with approve endpoint when workflow requires it.
- Planner start gate: when planning starts, set deliverable status to `PLANNING`.
- Spec-builder gate: after deliverable creation, set default status to `BACKLOG` and persist `specFilepath`.

Dependency lifecycle (required):
- Treat `DEPENDS_ON` in PLAN as required `TASK_RELATIONS` rows.
- Do not assume task create `dependencies` field is sufficient for graph lines.
- After task creation, create each dependency edge explicitly via relation endpoint.
- Create dependency edges immediately after the dependent task exists, even if upstream work is not complete yet.
- Live graph lines are required board truth for instantiated tasks; do not defer relation writes as a later cleanup step.
- Unresolved dependencies should not be represented as blocked status unless a separate blocker exists.
- Solo tasks are valid and visible without dependencies.

File lock lifecycle (required for worker execution):
- Acquire required file locks before task claim: `POST /projects/{code}/deliverables/{delivId}/locks/acquire`.
- On `409 FILE_LOCK_CONFLICT`, set task `isBlocked=true` and `blockedReason='FILE_LOCK'`, poll every 3 seconds, and retry.
- While work is active, refresh lease with `POST /projects/{code}/deliverables/{delivId}/locks/heartbeat`.
- On completion/handoff, release with `POST /projects/{code}/deliverables/{delivId}/locks/release`.

Harness-aware exception:
- If a worker harness guarantees strict disjoint file ownership, isolated subagent workspaces, and parent-controlled merge/serialization for overlaps, lock calls may be skipped for those internal subagents.
- If any external worker/process can concurrently edit the same deliverable/files, lock calls remain mandatory.

Verification lifecycle (required):
- After creating/updating tasks, re-fetch deliverable task list and confirm task `id`, `phaseStep`, `status`, and blocker fields when used.
- Re-fetch deliverable graph and confirm task presence and relation edges.
- For every instantiated task with non-`none` planned `DEPENDS_ON`, verify matching graph edges are present before declaring board sync complete.
- If mismatch appears, report exact endpoint + payload + response.

---

## Practical workflow
1. Fetch OpenAPI spec.
2. Resolve routes for required capabilities using deterministic rules.
3. Validate required path/query/body schema for each operation.
4. Execute request with `TB_TOKEN` or `Authorization: Bearer`, using the resolved token (`ZAZZ_API_TOKEN` first, fallback test token).
5. Validate post-conditions (task list + graph + statuses).
6. On errors, report capability + path + status + API error payload.

---

## Capability-specific guidance
- Create deliverable:
  - Required inputs: `projectCode`, `name`, `type`
  - Return both numeric `id` and display `deliverableId`
- Create task:
  - Required inputs: `code`, `delivId`, `title`
  - Required operational fields for planning execution: `phase`, `phaseStep`, `prompt`
  - Respect deliverable approval prerequisites
  - For each planned dependency, create explicit relation (`DEPENDS_ON`) immediately after task creation
- Update task status:
  - Resolve valid transitions from live workflow; common path is `READY` -> `IN_PROGRESS` -> (`QA` optional) -> `COMPLETED`
  - Include `agentName` when moving to `IN_PROGRESS` to claim work
- File locks:
  - Resolve lock routes from OpenAPI (`acquire`, `heartbeat`, `release`, `list`)
  - Treat heartbeat as required during active work to avoid stale lock reclamation
- Blockers:
  - Blocking is task metadata (`isBlocked`, `blockedReason`), not a workflow status column
- Update deliverable status:
  - Use deliverable status endpoint, validate allowed values from workflow
- Append note:
  - Include `note` and optional `agentName`
- Images:
  - Use project-scoped routes only
  - Validate upload payload schema + content type from OpenAPI

---

## Error handling
Expected statuses: `200`, `201`, `400`, `401`, `403`, `404`, `409`, `500`.
- Include API `error` payload when present.
- Do not retry with guessed alternate routes; re-resolve from OpenAPI first.
- If status update response conflicts with subsequent list/graph reads, report eventual-consistency mismatch and re-check once before escalating.
