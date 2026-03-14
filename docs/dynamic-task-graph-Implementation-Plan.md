# Dynamic Task Graph Execution — Implementation Plan

## Problem Summary
This is a **major refactor** of the task model. The existing task functionality (schema, seed data, service functions, routes, and tests) is being torn down and rebuilt to support dynamic, phase-by-phase task graph execution per the SPEC (`DYNAMIC_TASK_GRAPH_EXECUTION_SPEC.md`).

**What does NOT change:** Projects, deliverables, users, tags, translations, status definitions, coordination types, and the Kanban board task routes are untouched.

**What is being replaced:** The TASKS DB schema (additive + cleanup), all task seed data, all task-related test files, task creation/service logic, and the task graph endpoints.
---

## What Is NOT Changing (Keep As-Is)
**Backend — do not touch:**
* Projects, deliverables, users, tags, translations, status definitions, coordination types
* All Kanban task routes: column-based status, position/reorder, `PUT`/`DELETE` task — `projects.js`
* Task relations CRUD (DEPENDS_ON, COORDINATES_WITH with mirror) — `taskGraph.js`
* Auto-promotion (`checkAndPromoteDependents`, `checkTaskReadiness`) — `databaseService.js`
* Cycle detection (`wouldCreateCycle`) — `databaseService.js`
* Project-scoped `GET /projects/:code/graph` — `taskGraph.js`
* `GET /projects/:code/tasks/:taskId/readiness` — `taskGraph.js`
* Deliverables API (CRUD + status + approval + task list) — `deliverables.js`

**Client — do not touch (until Phase 6):**
* `TaskGraphPage`, `TaskNode`, `SyncPointNode`, `CoordinationEdge`, `useTaskGraph`, `graphLayoutUtils.js`
* `TaskDetailsPanel` — will be extended, not replaced

**Tests — do not touch:**
* `deliverables.test.mjs`, `deliverables.status.test.mjs`, `deliverables.approval.test.mjs`
* `projectStatuses.test.mjs`, `projectDeliverableStatuses.test.mjs`
* `translations.test.mjs`, `statusDefinitions.test.mjs`

---

## Current State vs Target
**TASKS schema** is missing `phase_task_id`, `phase`, `notes`, `is_cancelled`; column ordering does not follow convention (`created_by`/`updated_by`/timestamps must be last).
**Seed files** contain task data that is incompatible with the new model — must be gutted.
**Task test files** were written for the old Kanban-oriented task model — must be deleted and rebuilt from scratch.
**`createTask()`** does not generate `phase_task_id`, accept `dependencies`, or auto-promote on creation.
**No deliverable-scoped graph endpoint** — `GET /projects/:code/graph` returns ALL project tasks.
**No notes append endpoint** — `prompt` is write-once; `notes` (append-only agent log) does not exist yet.
**Client TaskGraphPage** shows the whole project graph with no deliverable selector.
**TaskNode** shows the integer `id`; should show `phase_task_id` ("1.1", "1.2").

---

## Phase 0: Cleanup — Do This First

### Gut task seed files (keep function shells, remove all inserts)
* `api/scripts/seeders/seedTasks.js` — replace body with no-op log only
* `api/scripts/seeders/seedTaskTags.js` — same
* `api/scripts/seeders/seedTaskRelations.js` — same
* `api/scripts/reset-and-seed.js` — keep imports/calls (functions are now no-ops); update summary log to remove task count lines

### Delete old task test files entirely
* `api/__tests__/routes/tasks.status.test.mjs` — **delete**
* `api/__tests__/routes/taskGraph.test.mjs` — **delete**
* `api/__tests__/routes/deliverables.tasks.test.mjs` — **delete**

**Naming note:** The dot-separated convention (`deliverables.tasks.test.mjs`) is an Angular pattern. This is a React project. All new test files use **kebab-case** (e.g. `task-creation.test.mjs`).

---

## Phase 1: Schema Changes

**File: `api/lib/db/schema.js`** — redefine the TASKS table.

Column order convention: business/domain columns first, audit columns (`created_by`, `created_at`, `updated_by`, `updated_at`) last.

```
TASKS table — final column order:
  id                serial PK
  project_id        FK → PROJECTS (not null)
  deliverable_id    FK → DELIVERABLES (not null)
  phase             integer (nullable) — phase number e.g. 1, 2, 3
  phase_task_id     varchar(20) (nullable) — display ID e.g. "1.1", "1.2.1"
  title             varchar(255) not null
  status            varchar(20) default 'TO_DO'
  priority          varchar(20) default 'MEDIUM'
  assignee_id       FK → USERS (nullable)
  prompt            text (nullable) — leader writes task goal + AC
  notes             text (nullable) — append-only agent log
  story_points      integer (nullable)
  position          integer default 0 — Kanban column ordering (unchanged)
  is_blocked        boolean default false
  blocked_reason    text (nullable)
  is_cancelled      boolean default false
                    NOT a workflow status — cancelled is a flag so the status
                    field stays a clean workflow state and dependents of a
                    cancelled task can still be promoted normally
  git_worktree      varchar (nullable)
  started_at        timestamp with timezone (nullable)
  completed_at      timestamp with timezone (nullable)
  coordination_code varchar(25) FK → COORDINATION_TYPES (nullable) — unchanged
  created_by        FK → USERS (nullable)
  created_at        timestamp with timezone default now() not null
  updated_by        FK → USERS (nullable)
  updated_at        timestamp with timezone default now() not null

Constraints:
  UNIQUE (deliverable_id, phase_task_id)
```

No migration needed — repo uses Drizzle push. After changing `schema.js`, run `npm run db:reset` on both dev and test DBs.

---

## Phase 2: DB Service Changes

**File: `api/src/services/databaseService.js`**

### `createTask(taskData)` — rewrite
Inside a transaction:
1. Validate deliverable exists; derive `projectId` from it
2. If `phase` is provided: query existing `phase_task_id` values for this `deliverable_id + phase`, determine next sequence number, store `phase_task_id` (e.g. "1.1", "1.2", "1.2.1" for rework)
3. Insert TASKS row including `phase`, `phase_task_id`, `notes`, `is_cancelled`
4. If `taskData.dependencies` array provided: insert TASK_RELATIONS rows (type `DEPENDS_ON`) for each — leader controls DAG ordering so no cycle check on creation
5. After relations inserted: call `checkTaskReadiness(newTaskId)` — if `ready=true` and project workflow contains READY, immediately update task status to READY
6. Return `getTaskById(newTask.id)`

Position calculation: keep existing sparse-numbering logic (`MAX(position) + 10` within status column) — Kanban still uses this.

### `getTaskById(id)` — update SELECT
Add: `phase`, `phaseTaskId` (from `phase_task_id`), `notes`, `isCancelled` (from `is_cancelled`).

### `getProjectTaskGraph(projectId)` — update SELECT
Add `phase`, `phaseTaskId`, `notes`, `isCancelled` alongside existing fields.

### `getDeliverableTaskGraph(deliverableId)` — new function
* Query TASKS where `deliverable_id = deliverableId`; full field set matching updated graph SELECT
* Query TASK_RELATIONS where both `task_id` AND `related_task_id` are within the deliverable's task set
* Return `{ tasks, relations }`

### `updateTask(id, taskData)` — update
Add field mappings:
* `if (taskData.notes !== undefined) updateData.notes = taskData.notes`
* `if (taskData.isCancelled !== undefined) updateData.is_cancelled = taskData.isCancelled`

---

## Phase 3: API Endpoint Changes

### `api/src/routes/projects.js`

**`POST /projects/:code/deliverables/:delivId/tasks`** — update body schema:
* Add `phase` (integer, optional)
* Add `dependencies` (array of integers, optional)
* Pass both to `createTask()`; service handles `phase_task_id` generation and relation insertion
* Response already returns full task from `getTaskById()` which now includes `phaseTaskId`

**`PATCH /projects/:code/deliverables/:delivId/tasks/:taskId/notes`** — new endpoint:
* Body: `{ "note": "string" }`
* Fetch current task `notes`, prepend `[ISO timestamp] [assignee name or 'system']: <note>\n`
* Call `updateTask(id, { notes: newNotes })`
* Return updated task
* Append-only by design; full replacement still available via `PUT .../tasks/:taskId`

**All other task routes in projects.js** — unchanged.

### `api/src/routes/taskGraph.js`

**`GET /projects/:code/deliverables/:delivId/graph`** — new endpoint:
* Validate project by code; validate deliverable belongs to project
* Call `dbService.getDeliverableTaskGraph(deliverableId)`
* Return `{ deliverableId, projectCode, taskGraphLayoutDirection, tasks, relations }`
* No WebSocket — client polls every 10 seconds

**All existing taskGraph.js endpoints** — unchanged.

---

## Phase 4: Test Helper Update

**File: `api/__tests__/helpers/testDatabase.js`**

Update `createTestTask()` to include new fields in overrides and DB insert:
* `phase`, `phaseTaskId` → `phase_task_id`, `notes`, `isCancelled` → `is_cancelled`

---

## Phase 5: New Tests (kebab-case naming)

### `task-creation.test.mjs` — new file
* `POST .../tasks` with `phase=1` → first task gets `phaseTaskId="1.1"`, second gets `"1.2"`
* Rework task numbering: `phase_task_id="1.2.1"` (hierarchical, QA-created)
* Task with no dependencies + READY in workflow → auto-promoted to READY on creation
* Task with `dependencies=[X]` where X is not COMPLETED → stays TO_DO
* When X → COMPLETED, dependents auto-promote to READY (existing `checkAndPromoteDependents`)
* Returns 401 without token; 404 for non-existent deliverable

### `task-notes.test.mjs` — new file
* `PATCH .../tasks/:taskId/notes` appends note with `[timestamp] [agent]:` prefix
* Multiple appends accumulate in correct order
* Returns 404 for non-existent task; 401 without token

### `task-graph-deliverable.test.mjs` — new file
* `GET /projects/ZAZZ/deliverables/:id/graph` returns 200 with tasks + relations scoped to deliverable
* Tasks from a different deliverable in the same project are NOT included
* Relations where one endpoint is outside the deliverable are excluded
* `phaseTaskId` present on task nodes
* Returns 404 for non-existent deliverable; 401 without token

---

## Phase 6: Client Changes

**`client/src/hooks/useTaskGraph.js`**
* Accept optional `deliverableId` param
* When set, fetch `GET /projects/:code/deliverables/:delivId/graph`; else fall back to `GET /projects/:code/graph`
* Add polling: `setInterval(fetchGraph, 10000)`, cleared on unmount

**`client/src/pages/TaskGraphPage.jsx`**
* Import `useDeliverables` (already at `client/src/hooks/useDeliverables.js`)
* Add `<Select>` deliverable dropdown; pass `selectedDeliverable.id` to `useTaskGraph`
* Reset selection when project changes
* Wire `onNodeDoubleClick` → `handleTaskEdit(node.data.task, { x, y })` using `usePanelManager` + `useTaskActions` (same pattern as KanbanPage)

**`client/src/components/graph/TaskNode.jsx`**
* Show `task.phaseTaskId` in top-left badge; fall back to `#${task.id}` if null
* Notes preview: first line of `task.notes` truncated to ~40 chars in a muted bottom row

**`client/src/components/TaskDetailPanel.jsx`**
* Add `notes` as read-only textarea (labelled "Agent Notes") below `prompt`
* Not editable via panel — append-only via the `/notes` API endpoint

---

## Implementation Sequence
1. Phase 0 — gut seed files; delete old test files
2. Phase 1 — rewrite `schema.js` TASKS definition; run `db:reset` on dev + test DBs
3. Phase 2 — update `databaseService.js`: `createTask`, `getTaskById`, `getProjectTaskGraph`, `getDeliverableTaskGraph`, `updateTask`
4. Phase 3 — update routes: `projects.js` (POST body + new notes endpoint); `taskGraph.js` (new deliverable graph endpoint)
5. Phase 4 — update `testDatabase.js` helper
6. Phase 5 — write new tests; confirm all non-task tests still pass
7. Phase 6 — client changes

---

## Key Design Decisions
* `phase_task_id` uniqueness enforced per deliverable (not project-wide); format `{phase}.{seq}` or `{phase}.{seq}.{rework}` for QA-created rework tasks
* `is_cancelled` is a boolean flag, NOT a workflow status value — status field stays a clean, workflow-driven state; dependents of a cancelled task can still be promoted normally
* Dependency relations on task creation do NOT run the full cycle-check (leader controls DAG ordering); cycle check remains available via the existing `createTaskRelation()` endpoint
* `position` column stays — used by Kanban board ordering
* `coordination_code` FK → COORDINATION_TYPES stays — unchanged
* No WebSocket in this iteration; 10-second polling in `useTaskGraph` is sufficient
* The existing project-scoped `GET /projects/:code/graph` is untouched

---

## Success Criteria
* `POST .../deliverables/:delivId/tasks` with `phase=1` returns `phaseTaskId="1.1"` for first, `"1.2"` for second in same deliverable+phase
* Task created with no dependencies + READY in workflow → immediately READY
* Task created with `dependencies=[X]` where X is not COMPLETED → stays TO_DO; auto-promoted when X completes
* `PATCH .../notes` appends with timestamp prefix; does not overwrite
* `GET .../deliverables/:id/graph` returns ONLY that deliverable's tasks and relations
* `is_cancelled=true` tasks visible on graph (greyed out client-side); their dependents can still be promoted
* Client deliverable selector switches graph to show selected deliverable only
* `TaskNode` shows `phaseTaskId` ("1.2") instead of integer ID
* Graph auto-refreshes every ~10 seconds
* All Kanban routes and non-task tests continue to pass unmodified
