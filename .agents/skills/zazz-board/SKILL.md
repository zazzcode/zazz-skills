---
name: zazz-board
description: "CLI-first companion skill for service-assisted repos that use Zazz Board; use it to create and manage deliverables, tasks, relations, notes, statuses, and file locks through zazzctl, with live OpenAPI as the protocol validation and fallback surface."
metadata:
  type: rule
  required_for: ["qa-testing", "spec-builder", "pr-builder"]
---

# Zazz Board Skill

## Startup Sequence

Before making board/API calls:
1. Use `AGENTS.md` as the source of truth for repo-specific settings such as docs root, tracking system, project-code conventions, and board workflow rules. Read it if that context is not already available.
2. Confirm the environment variables, authentication source, and target project context.
3. Prefer the CLI-first workflow this skill defines, and use OpenAPI as route truth or protocol fallback when needed.
4. Then make only the board updates that are supported by the current role and task context.

## Purpose
Agents use this skill to understand and interact with Zazz Board in service-assisted repos. It covers board purpose, projects, project milestones, deliverables, tasks, statuses, notes, locks, graph/readiness checks, and the CLI/API surfaces used to keep execution records synchronized. Projects and users are pre-configured; agents do not create them.

Projects are the planning boundary. A project can have project milestones, and those milestones group associated deliverables for stakeholder-facing timeline planning. A Gantt view is one common representation of project milestones and their deliverables; it is not the methodology concept itself.

This skill is only for **service-assisted** adoption. It is optional in the methodology and should not be required in `process-only` or ordinary `skills-assisted` repos that are just following the methodology's document model and directory structure.

### Specification paths on disk

Projects are **flat**, **Zazz Board**, or **Jira** (mutually exclusive) when using
deliverable specifications on disk. **Flat:** `specifications/{slug}.md`.
**Subdirectory:** `specifications/{id}/{slug}.md` with slug-only filenames inside.
**Zazz** uses board **deliverable code** as `{id}` when the repo declares that layout;
this API syncs `dedFilePath` / `specFilepath`. **Jira** may use the same layout with an
**issue key** as `{id}` and does **not** sync paths through this API. Paths you send
must match files on disk and the repo's declared documentation operating model. If the
repo stores active specs only in Zazz Board, Jira, GitHub Wiki, Confluence, or another
external surface, do not invent local specification paths. See
[zazz-methodology.md](../../../zazz-methodology.md) and **spec-builder** storage
guidance.

---

## Authentication
All API requests (except `/openapi.json`, `/health`, `/`, `/db-test`, `/token-info`) require:
- Header: `TB_TOKEN: <uuid>` or `Authorization: Bearer <uuid>`
- Token resolution: `ZAZZ_API_TOKEN` when set, otherwise fallback `660e8400-e29b-41d4-a716-446655440101`

---

## Environment variables
- `ZAZZ_API_BASE_URL` (fallback: `http://localhost:3030`)
- `ZAZZ_API_TOKEN` (required token source; fallback if unset: `660e8400-e29b-41d4-a716-446655440101`)
- `ZAZZ_PROJECT_CODE` (fallback: `ZAZZ`)
- `ZAZZCTL_PROFILE` (optional CLI profile: `generic`, `worker`, `planner`, `spec_builder`; profile names are command permissions, not skill names)
- `ZAZZCTL_ENV_FILE` (optional explicit env file path for CLI execution)
- `ZAZZCTL_NO_ENV` (`1` disables env-file auto-loading)

---

## Canonical CLI Adapter (Required)
Use the canonical Node CLI for board communication:
- Script: `.agents/skills/zazz-board/scripts/zazzctl.mjs`
- Runtime prereq: Node.js 22+ (project baseline)

CLI-first policy:
- Use `zazzctl` as the default communication path.
- The canonical CLI auto-loads a repo `.env` when present.
- Exported environment variables win over values loaded from `.env`.
- If a repo needs a non-default env file, set `ZAZZCTL_ENV_FILE` explicitly for that command.
- Use `zazzctl help`, `zazzctl help <resource>`, or `zazzctl help <resource> <action>` to inspect the supported command surface before guessing flags.
- Do not handcraft ad-hoc `curl` for normal execution.
- `curl` is allowed only for OpenAPI fetch/debugging when the CLI is missing a capability.

CLI profile usage:
- Execution profile: `zazzctl --profile worker ...`
- Specification setup profile: `zazzctl --profile planner ...`
- Spec-builder profile: `zazzctl --profile spec_builder ...`
- Generic fallback: `zazzctl ...` or `zazzctl --profile generic ...`

## Source-of-Truth Model

This skill uses a split source-of-truth model so each layer has one clear responsibility:

- **`zazzctl` is the primary agent interface.** Agents should prefer the CLI and its built-in help as the first surface for normal board operations.
- **OpenAPI is the protocol validation and fallback surface.** The board implementation should keep the CLI aligned with the live API schema and routes.
- **This repo defines the agent-facing contract.** The `zazz-board` skill and CLI usage model here describe how agents are expected to operate.
- **[zazz-board](https://github.com/zazzcode/zazz-board) is the reference implementation.** That repo implements the API and CLI behavior that this skill expects.

Practical rule:

- if the CLI supports the needed capability, use the CLI
- if the CLI help is insufficient or the capability is missing, inspect OpenAPI and then improve the CLI/skill contract rather than teaching every agent to route around it
- do not maintain duplicate behavioral documentation in multiple places when the CLI can express the agent contract directly

---

## OpenAPI Fallback Model

Always fetch the live spec from:
`{ZAZZ_API_BASE_URL}/openapi.json`

Use OpenAPI when:

- adding a new CLI capability
- debugging a CLI/API mismatch
- validating that the reference implementation still matches the expected contract
- the CLI does not yet expose the needed operation

When falling back to OpenAPI:

- parse `paths` + operation metadata (`tags`, `summary`, `description`, params, requestBody, responses`)
- do not trust stale hardcoded route lists when OpenAPI differs
- do not invent routes; derive from live spec
- once the needed behavior is understood, prefer improving the CLI/help surface so future agents can stay CLI-first

---

## Capability-first routing model (fallback when CLI does not cover the capability)
Use capability names as the stable contract, then resolve concrete routes from OpenAPI only when the CLI does not already cover the operation.

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
For board-assisted specification, execution, or QA runs, these behaviors are required:
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
- Specification start gate: when specification work starts, set deliverable status to `PLANNING`.
- Spec-builder gate: after deliverable creation, set default status to `BACKLOG` and persist `specFilepath`.

Dependency lifecycle (required):
- Treat `DEPENDS_ON` in the approved task/specification contract as required `TASK_RELATIONS` rows.
- Do not assume task create `dependencies` field is sufficient for graph lines.
- After task creation, create each dependency edge explicitly via relation endpoint.
- Create dependency edges immediately after the dependent task exists, even if upstream work is not complete yet.
- Live graph lines are required board truth for instantiated tasks; do not defer relation writes as a later cleanup step.
- Unresolved dependencies should not be represented as blocked status unless a separate blocker exists.
- Solo tasks are valid and visible without dependencies.

File lock lifecycle (required for active execution):
- Acquire required file locks before task claim: `POST /projects/{code}/deliverables/{delivId}/locks/acquire`.
- On `409 FILE_LOCK_CONFLICT`, set task `isBlocked=true` and `blockedReason='FILE_LOCK'`, poll every 3 seconds, and retry.
- While work is active, refresh lease with `POST /projects/{code}/deliverables/{delivId}/locks/heartbeat`.
- On completion/handoff, release with `POST /projects/{code}/deliverables/{delivId}/locks/release`.

Harness-aware exception:
- If an agent harness guarantees strict disjoint file ownership, isolated subagent workspaces, and parent-controlled merge/serialization for overlaps, lock calls may be skipped for those internal subagents.
- If any external agent/process can concurrently edit the same deliverable/files, lock calls remain mandatory.

Verification lifecycle (required):
- After creating/updating tasks, re-fetch deliverable task list and confirm task `id`, `phaseStep`, `status`, and blocker fields when used.
- Re-fetch deliverable graph and confirm task presence and relation edges.
- For every instantiated task with non-`none` declared `DEPENDS_ON`, verify matching graph edges are present before declaring board sync complete.
- If mismatch appears, report exact endpoint + payload + response.

---

## Practical workflow
1. Inspect CLI help first (`zazzctl help`, `zazzctl help <resource>`, `zazzctl help <resource> <action>`).
2. Use the CLI for supported capabilities.
3. Fetch OpenAPI only when the CLI lacks a capability or appears out of sync.
4. If falling back to OpenAPI, resolve routes and schemas using the deterministic rules above.
5. Validate post-conditions (task list + graph + statuses).
6. On errors, report capability + CLI command or API path + status + error payload.

---

## Capability-specific guidance
- Create deliverable:
  - Required inputs: `projectCode`, `name`, `type`
  - Return both numeric `id` and display `deliverableId`
- Create task:
  - Required inputs: `code`, `delivId`, `title`
  - Required operational fields for task execution: `phase`, `phaseStep`, `prompt`
  - Respect deliverable approval prerequisites
  - For each declared dependency, create explicit relation (`DEPENDS_ON`) immediately after task creation
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
