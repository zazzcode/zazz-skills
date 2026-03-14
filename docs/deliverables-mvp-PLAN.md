# Implementation Plan: Deliverables MVP

**SPEC Reference**: `docs/deliverables_feature_SPEC.md`
**Branch**: `deliverables-mvp`
**Created**: 2026-02-17

---

## Current State Summary

The codebase has:
- **Schema**: `api/lib/db/schema.js` — USERS, PROJECTS, TASKS (with `task_id` varchar + `git_pull_request_url`), TAGS, TASK_TAGS, TASK_RELATIONS, STATUS_DEFINITIONS, COORDINATION_REQUIREMENT_DEFINITIONS, TRANSLATIONS, IMAGE_METADATA, IMAGE_DATA
- **Routes**: users, projects, tasks, tags, images, translations, statusDefinitions, taskGraph — all registered in `api/src/routes/index.js`
- **Database Service**: `api/src/services/databaseService.js` — all queries reference `TASKS.task_id`, `TASKS.git_pull_request_url`; `createTask()` uses `PROJECTS.next_task_sequence` to generate `task_id`
- **Seeds**: 9 seeder files in `api/scripts/seeders/`, orchestrated by `reset-and-seed.js`
- **Tests**: 5 test files in `api/__tests__/routes/`, helpers reference `TASKS.task_id` in `createTestTask()`
- **Client**: 3 pages (HomePage, KanbanPage, TaskGraphPage), hooks for tasks/tags/users/statusDefinitions, KanbanBoard/TaskCard components

**Key constraint**: This is a nuke-and-rebuild workflow (`npm run db:reset`). There are no incremental migrations — the entire database is dropped and recreated from the schema on every reset.

---

## Implementation Strategy

Because dropping `task_id` and adding `deliverable_id` NOT NULL to TASKS is a breaking change that touches **every layer simultaneously** (schema, seeds, service, routes, tests, client), the implementation follows a **bottom-up, full-cut** approach:

1. Modify the schema first (everything breaks)
2. Fix seeds so `db:reset` works (database is usable again)
3. Fix the service layer (queries work again)
4. Fix/create routes (API works again)
5. Fix/create tests (verification works again)
6. Fix/update client (UI works again)

Each phase ends with a concrete verification checkpoint. Phases 1–4 should be completed before any test or UI work begins.

---

## Phase 1 — Schema Changes ✅

**Goal**: Update `api/lib/db/schema.js` so that `drizzle-kit push` creates the correct tables. Nothing else works after this phase until seeds are updated.

**Files modified**:
- `api/lib/db/schema.js`

**Changes**:

### 1a. Add `deliverableTypeEnum` and `DELIVERABLES` table
- Add `deliverableTypeEnum` pgEnum: `FEATURE`, `BUG_FIX`, `REFACTOR`, `ENHANCEMENT`, `CHORE`, `DOCUMENTATION`
- Add `DELIVERABLES` table with all columns from SPEC Section 6.1 (id, project_id, deliverable_id, name, description, type, status, status_history, ded_file_path, plan_file_path, prd_file_path, approved_by, approved_at, git_worktree, git_branch, pull_request_url, position, created_by, created_at, updated_by, updated_at)
- Use `jsonb` for `status_history` (not text — this differs from the TRANSLATIONS pattern because we need to query/append JSON, not just store opaque text)

### 1b. Modify `PROJECTS` table
- Rename `next_task_sequence` → `next_deliverable_sequence` (integer, default 1)
- Update `status_workflow` default to `['TO_DO', 'READY', 'IN_PROGRESS', 'QA', 'COMPLETED']`
- Add `deliverable_status_workflow` varchar array column, default `['PLANNING', 'IN_PROGRESS', 'IN_REVIEW', 'STAGED', 'DONE']`

### 1c. Modify `TASKS` table
- **Drop** `task_id` varchar column
- **Drop** `git_pull_request_url` varchar column
- **Add** `deliverable_id` integer NOT NULL, references `DELIVERABLES.id` with `onDelete: 'cascade'`

### 1d. Add Drizzle relations
- `deliverablesRelations`: project (one), approvedByUser (one), createdByUser (one), tasks (many)
- Update `projectsRelations`: add `deliverables: many(DELIVERABLES)`
- Update `tasksRelations`: add `deliverable: one(DELIVERABLES, ...)`

### 1e. Update schema imports
- Export `DELIVERABLES`, `deliverableTypeEnum` from schema.js

**Checkpoint**: `node -e "import('./api/lib/db/schema.js')"` succeeds (module parses without errors). Nothing else works yet.

---

## Phase 2 — Seed Data ✅

**Goal**: `npm run db:reset` (from `api/`) completes successfully with the new schema and SPEC-specified seed data.

**Files modified**:
- `api/scripts/seeders/seedProjects.js` — rewrite with SPEC Section 9.2 data (ZAZZ replaces WEBRED, Zazz methodology defaults, `next_deliverable_sequence`, `deliverable_status_workflow`)
- `api/scripts/seeders/seedStatusDefinitions.js` — add STAGED, UAT, PROD, QA, COMPLETED
- `api/scripts/seeders/seedTasks.js` — rewrite: remove `task_id` field, add `deliverable_id` FK, use SPEC Section 9.4 data
- `api/scripts/seeders/seedTaskTags.js` — update task references (old `task_id` strings → new integer IDs)
- `api/scripts/seeders/seedTaskRelations.js` — update task references
- `api/scripts/seeders/seedTranslations.js` — add deliverable type/status translations, UAT/PROD status translations, QA/COMPLETED task status translations
- `api/scripts/reset-and-seed.js` — add DELIVERABLES to drop order (after TASKS, before PROJECTS), add `deliverable_type` enum to drop list, add `seedDeliverables()` call between projects and tasks

**Files created**:
- `api/scripts/seeders/seedDeliverables.js` — new seeder with SPEC Section 9.3 data (6 deliverables across ZAZZ, MOBDEV, APIMOD)

**Seed execution order** (in `reset-and-seed.js`):
1. Drop: IMAGE_DATA → IMAGE_METADATA → TASK_RELATIONS → TASK_TAGS → TASKS → **DELIVERABLES** → PROJECTS → TAGS → TRANSLATIONS → COORDINATION_REQUIREMENT_DEFINITIONS → STATUS_DEFINITIONS → USERS
2. Drop enums: task_relation_type, graph_layout_direction, **deliverable_type**
3. Push schema
4. Seed: users → tags → statusDefinitions → coordinationRequirementDefinitions → translations → projects → **deliverables** → tasks → taskTags → taskRelations

**Key decisions**:
- Task seeds no longer include `task_id` — the serial PK auto-generates
- Task seeds **must** reference deliverable IDs by integer (1–6 based on insert order of deliverables)
- APIMOD project uses `deliverable_status_workflow: ['PLANNING', 'IN_PROGRESS', 'IN_REVIEW', 'UAT', 'STAGED', 'PROD']`
- APIMOD-2 deliverable status is `PROD` (not `DONE`) with UAT in its status_history

**Checkpoint**: From `api/`, run `npm run db:reset`. Verify:
```bash
docker exec task_blaster_postgres psql -U postgres -d task_blaster_dev \
  -c "SELECT count(*) FROM \"DELIVERABLES\";" \
  -c "SELECT count(*) FROM \"TASKS\";" \
  -c "SELECT deliverable_id, status FROM \"DELIVERABLES\";"
```
Expected: 6 deliverables, ~16 tasks, varied statuses including PROD.

---

## Phase 3 — Database Service Layer ✅

**Goal**: All `databaseService.js` query methods compile and return correct data shapes. This is the highest-risk phase because almost every existing task query references `TASKS.task_id` and `TASKS.git_pull_request_url`.

**Files modified**:
- `api/src/services/databaseService.js`

### 3a. Update schema import
- Add `DELIVERABLES` to the import from `schema.js`

### 3b. Remove all `task_id` and `git_pull_request_url` references from task queries
Every select/insert/update that references these columns must be updated:
- `getTasksForProject()` — remove `taskId: TASKS.task_id`, remove `gitPullRequestUrl: TASKS.git_pull_request_url`, add `deliverableId: TASKS.deliverable_id`
- `getTasks()` — same removals and additions
- `getTaskById()` — same, plus add join to DELIVERABLES for `deliverableName`
- `getTaskByTaskId()` — **delete this method entirely** (tasks no longer have string IDs)
- `createTask()` — remove `task_id` generation logic, remove `next_task_sequence` increment, remove `git_pull_request_url` insert, add `deliverable_id` as required field
- `updateTask()` — remove `taskId`/`gitPullRequestUrl` from updateData mapping, add `deliverableId` mapping

### 3c. Add deliverable query methods
New methods needed (follow existing patterns for select aliases, joins, returning):
- `getDeliverablesForProject(projectId, filters)` — select with LEFT JOIN to USERS for approvedByName, aggregate taskCount/completedTaskCount via subquery or separate query
- `getDeliverableById(id)` — single deliverable with all fields + taskCount + completedTaskCount + projectCode
- `createDeliverable(projectId, data, userId)` — transaction: read project for code + next_deliverable_sequence, generate deliverable_id, increment sequence, insert with initial status_history, return full object
- `updateDeliverable(id, data, userId)` — partial update (same pattern as updateProject/updateTask)
- `deleteDeliverable(id)` — delete returns success (CASCADE handles tasks)
- `updateDeliverableStatus(id, status, userId)` — read current, validate against project's deliverable_status_workflow, append to status_history JSONB, update
- `approveDeliverablePlan(id, userId)` — validate plan_file_path is set, status is PLANNING, not already approved; set approved_by + approved_at
- `getTasksForDeliverable(deliverableId)` — filtered version of getTasksForProject
- `getProjectDeliverableStatusWorkflow(projectId)` — select deliverable_status_workflow
- `updateProjectDeliverableStatusWorkflow(projectId, workflow, userId)` — update
- `hasDeliverablesWithStatus(projectId, status)` — count check (same pattern as hasTasksWithStatus)

### 3d. Update project query methods
- `getProjectsWithDetails()` — add `deliverableStatusWorkflow` to select, add deliverable count
- `getProjectById()` / `getProjectByCode()` — add `deliverableStatusWorkflow`, `nextDeliverableSequence` to select
- `createProject()` — update default `statusWorkflow` to Zazz defaults, add `deliverableStatusWorkflow` handling
- `updateProject()` — add `deliverableStatusWorkflow` to allowed update fields

**Checkpoint**: Start the dev server (`npm run dev:api`), make a curl request:
```bash
curl -H "TB_TOKEN: 550e8400-e29b-41d4-a716-446655440000" http://localhost:3030/projects
curl -H "TB_TOKEN: 550e8400-e29b-41d4-a716-446655440000" http://localhost:3030/tasks
```
Both should return valid JSON without errors. Task objects should have `deliverableId` and no `taskId`/`gitPullRequestUrl`.

---

## Phase 4 — API Routes ✅

**Goal**: All new deliverable routes work and existing task/project routes are updated.

**Files modified**:
- `api/src/routes/index.js` — register `deliverableRoutes`
- `api/src/routes/tasks.js` — update POST/PUT to require/accept `deliverableId`, remove any `taskId` references in schemas
- `api/src/routes/projects.js` — add `GET/PUT /projects/:code/deliverable-statuses` endpoints (or create separate route file)

**Files created**:
- `api/src/routes/deliverables.js` — new route file with:
  - `GET /projects/:projectId/deliverables` — list with optional `status`/`type` query filters
  - `GET /deliverables/:id` — single deliverable
  - `POST /projects/:projectId/deliverables` — create (requires `name`, `type`)
  - `PUT /deliverables/:id` — update
  - `DELETE /deliverables/:id` — delete with CASCADE
  - `PATCH /deliverables/:id/status` — status transition with guards (IN_PROGRESS requires approval + plan path)
  - `PATCH /deliverables/:id/approve` — plan approval (sets approved_by/at, validates PLANNING status + plan_file_path set + not already approved)
  - `GET /deliverables/:id/tasks` — tasks for a deliverable

**Validation schemas** (add to `api/src/schemas/validation.js`):
- Deliverable create: name (required, maxLength 30), type (required, enum), description, dedFilePath (path to SPEC), planFilePath, prdFilePath, gitWorktree, gitBranch
- Deliverable update: all optional except deliverableId (immutable)
- Status change: status (required, pattern `^[A-Z_]+$`)

**Checkpoint**: Test all new endpoints via curl:
```bash
# List deliverables
curl -H "TB_TOKEN: 550e8400-e29b-41d4-a716-446655440000" \
  http://localhost:3030/projects/1/deliverables

# Create deliverable
curl -X POST -H "TB_TOKEN: 550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Deliverable","type":"FEATURE"}' \
  http://localhost:3030/projects/1/deliverables

# Approve plan (should fail — no plan_file_path)
curl -X PATCH -H "TB_TOKEN: 550e8400-e29b-41d4-a716-446655440000" \
  http://localhost:3030/deliverables/7/approve
```

---

## Phase 5 — Test Infrastructure + API Tests ✅ (COMPLETE)

**Goal**: All existing tests pass with updated data shapes. New deliverable tests pass.

### 5a. Update test infrastructure

**Files modified**:
- `api/__tests__/helpers/testDatabase.js`:
  - Add `DELIVERABLES` to import from schema
  - Update `clearTaskData()`: delete TASK_RELATIONS → TASK_TAGS → TASKS → **DELIVERABLES** (tasks depend on deliverables)
  - Update `resetProjectDefaults()`: set Zazz methodology defaults (`status_workflow: ['TO_DO', 'READY', 'IN_PROGRESS', 'QA', 'COMPLETED']`, `completion_criteria_status: null`, add `deliverable_status_workflow` reset)
  - Update `createTestTask()`: remove `task_id` generation, add required `deliverableId` parameter, remove `git_pull_request_url`
  - Add `createTestDeliverable(projectId, overrides)` — inserts a deliverable with defaults, returns created row
  - Add `getDeliverableById(id)` helper
- `api/__tests__/helpers/testServer.js` — no changes expected (server setup is generic)
- `api/__tests__/setup.pactum.mjs` — no changes expected

### 5b. Update test database

```bash
docker exec task_blaster_postgres psql -U postgres -c "DROP DATABASE IF EXISTS task_blaster_test;"
docker exec task_blaster_postgres psql -U postgres -c "CREATE DATABASE task_blaster_test;"
DATABASE_URL=postgres://postgres:password@localhost:5433/task_blaster_test npm run db:reset
```

### 5c. Update existing test files

**Files modified**:
- `api/__tests__/routes/tasks.status.test.mjs` — each `createTestTask()` call needs a deliverable; create a test deliverable in `beforeEach`; remove any assertions on `taskId` or `gitPullRequestUrl` fields
- `api/__tests__/routes/taskGraph.test.mjs` — same: create test deliverable, pass `deliverableId` to `createTestTask()`
- `api/__tests__/routes/projectStatuses.test.mjs` — update default workflow assertions to Zazz methodology
- `api/__tests__/routes/statusDefinitions.test.mjs` — may need to account for new status definitions (STAGED, UAT, PROD, QA, COMPLETED) in count/list assertions
- `api/__tests__/routes/translations.test.mjs` — may need to account for new translation keys

### 5d. Create new test files

**Files created** (per SPEC Section 13):
- `api/__tests__/routes/deliverables.test.mjs` — CRUD tests (Section 13.1)
- `api/__tests__/routes/deliverables.status.test.mjs` — status transition tests (Section 13.2)
- `api/__tests__/routes/deliverables.approval.test.mjs` — plan approval tests (Section 13.3)
- `api/__tests__/routes/deliverables.tasks.test.mjs` — deliverable tasks tests (Section 13.4)
- `api/__tests__/routes/projectDeliverableStatuses.test.mjs` — deliverable workflow config tests (Section 13.6)

**Test pattern**: Each file follows the existing pattern — import `spec` from pactum, import helpers, `beforeEach` calls `clearTaskData()`, create test deliverables as needed, make HTTP requests against `http://127.0.0.1:3031`.

**Checkpoint**: From `api/`:
```bash
set -a && source .env && set +a && NODE_ENV=test npm run test
```
All tests pass (existing + new).

---

## Phase 6 — Client Updates 🔲 (not started)

**Goal**: UI reflects the new data model. New pages/components are functional.

### 6a. Update existing components

**Files modified**:
- `client/src/hooks/useTasks.js` — remove references to `taskId` string field, add `deliverableId`/`deliverableName` to task shape
- `client/src/components/TaskCard.jsx` — display integer `id` in badge (not `taskId` string), add deliverable name footer (SPEC Section 8.5)
- `client/src/components/KanbanBoard.jsx` — no structural changes (columns still come from project.statusWorkflow)
- `client/src/pages/KanbanPage.jsx` — minor: default columns now reflect Zazz methodology (driven by project data, not hardcoded)
- `client/src/pages/TaskGraphPage.jsx` — add swim lane grouping by deliverable (SPEC Section 8.4)
- `client/src/components/graph/` — update graph rendering to group nodes by deliverable into swim lanes
- `client/src/i18n/locales/` — add deliverable translations to all 4 language files (en, es, fr, de)

### 6b. Create new components and pages

**Files created**:
- `client/src/hooks/useDeliverables.js` — fetch/create/update/delete deliverables, status transitions, plan approval
- `client/src/pages/DeliverableListPage.jsx` — sortable table (SPEC Section 8.1), copy-to-clipboard for file paths
- `client/src/pages/DeliverableKanbanPage.jsx` — wrapper that fetches deliverable data + project workflow
- `client/src/components/DeliverableKanbanBoard.jsx` — Kanban board with dynamic columns from `deliverableStatusWorkflow`
- `client/src/components/DeliverableCard.jsx` — card with ID badge, name, type badge, task progress bar, PR link, approval badge
- `client/src/components/DeliverableTable.jsx` — sortable table component with clipboard functionality
- `client/src/components/DeliverableModal.jsx` — create/edit modal (name, type, description, file paths, git fields)

### 6c. Update routing and navigation

**Files modified**:
- `client/src/App.jsx` (or equivalent router config) — add/update routes: `/projects/:projectCode/deliverables`, `/projects/:projectCode/kanban` (deliverables board), `/projects/:projectCode/task-kanban` (tasks board), `/projects/:projectCode/task-graph`
- Navigation component (SegmentedControl or equivalent) — add Deliverables List, Kanban (Deliverables), Task Kanban, and Task Graph links

**Checkpoint**: Run `npm run dev` from project root. Navigate to:
- `/projects/ZAZZ/deliverables` — table with 3 deliverables, file path copy buttons work
- `/projects/ZAZZ/kanban` — deliverables kanban board with columns, cards show task progress
- `/projects/ZAZZ/task-kanban` — task cards show deliverable name footer, columns are Zazz methodology
- `/projects/ZAZZ/task-graph` — swim lanes group tasks by deliverable

---

## Phase 7 — Integration Verification 🔲 (not started)

**Goal**: Full end-to-end verification that all layers work together.

**Steps**:
1. Reset dev database: `npm run db:reset` (from `api/`)
2. Reset test database and run all tests (from `api/`):
   ```bash
   docker exec task_blaster_postgres psql -U postgres -c "DROP DATABASE IF EXISTS task_blaster_test;"
   docker exec task_blaster_postgres psql -U postgres -c "CREATE DATABASE task_blaster_test;"
   DATABASE_URL=postgres://postgres:password@localhost:5433/task_blaster_test npm run db:reset
   set -a && source .env && set +a && NODE_ENV=test npm run test
   ```
3. Start the app: `npm run dev` (from project root)
4. Manual verification:
   - Create a new deliverable via the UI
   - Set file paths, approve plan
   - Transition to IN_PROGRESS
   - Verify task cards show deliverable footer
   - Drag deliverable cards between Kanban columns
   - Verify APIMOD project has different deliverable Kanban columns (includes UAT, PROD)
5. Run client linting: `cd client && npm run lint`

---

## Risk Areas

**Highest risk — `databaseService.js` refactor (Phase 3)**:
Every task query method references `TASKS.task_id` and `TASKS.git_pull_request_url`. Missing even one reference will cause a runtime SQL error. Mitigation: grep for `task_id` and `git_pull_request_url` after editing to verify zero remaining references to dropped columns.

**High risk — Test helper `createTestTask` (Phase 5a)**:
Every existing test uses `createTestTask()` which currently generates a `task_id` string. After the change, it must create a deliverable first (or accept a `deliverableId`). Every test file that calls `createTestTask()` needs updating. Mitigation: update the helper to auto-create a deliverable if `deliverableId` is not provided, reducing churn in existing test files.

**Medium risk — Seed data FK ordering (Phase 2)**:
Deliverables must be seeded before tasks (tasks reference deliverables). Task seed data must use correct deliverable integer IDs based on insert order. Mitigation: use explicit ID values in deliverable seeds or query after insert to confirm IDs match expectations.

**Medium risk — Task graph swim lanes (Phase 6a)**:
The graph rendering components in `client/src/components/graph/` need to group nodes by deliverable. The existing layout algorithm may need significant changes. Mitigation: implement swim lanes as a visual grouping layer on top of the existing graph layout rather than rewriting the layout engine.

---

## File Change Summary

**New files** (8):
- `api/scripts/seeders/seedDeliverables.js`
- `api/src/routes/deliverables.js`
- `api/__tests__/routes/deliverables.test.mjs`
- `api/__tests__/routes/deliverables.status.test.mjs`
- `api/__tests__/routes/deliverables.approval.test.mjs`
- `api/__tests__/routes/deliverables.tasks.test.mjs`
- `api/__tests__/routes/projectDeliverableStatuses.test.mjs`
- Client: ~7 new files (hooks, pages, components listed in Phase 6b)

**Modified files** (~20):
- `api/lib/db/schema.js`
- `api/src/services/databaseService.js`
- `api/src/routes/index.js`
- `api/src/routes/tasks.js`
- `api/src/routes/projects.js`
- `api/src/schemas/validation.js`
- `api/scripts/reset-and-seed.js`
- `api/scripts/seeders/seedProjects.js`
- `api/scripts/seeders/seedStatusDefinitions.js`
- `api/scripts/seeders/seedTasks.js`
- `api/scripts/seeders/seedTaskTags.js`
- `api/scripts/seeders/seedTaskRelations.js`
- `api/scripts/seeders/seedTranslations.js`
- `api/__tests__/helpers/testDatabase.js`
- `api/__tests__/routes/tasks.status.test.mjs`
- `api/__tests__/routes/taskGraph.test.mjs`
- `api/__tests__/routes/projectStatuses.test.mjs`
- Client: ~8 modified files (hooks, components, pages, i18n, routing listed in Phase 6a/6c)

---

**Document Version**: 1.2
**Last Updated**: 2026-02-17
**Status**: Phases 1–5 Complete, Phases 6–7 Remaining

### Progress Notes (2026-02-17 - Updated)

#### Backend Implementation (Phases 1–5) ✅ COMPLETE

**Phase 1 - Schema Changes**: ✅
- Added `DELIVERABLES` table with all required fields (id, project_id, deliverable_id, name, type, status, status_history, file paths, approval tracking)
- Added `deliverableTypeEnum` with 6 types (FEATURE, BUG_FIX, REFACTOR, ENHANCEMENT, CHORE, DOCUMENTATION)
- Added `deliverable_status_workflow` to PROJECTS (default: ['PLANNING', 'IN_PROGRESS', 'IN_REVIEW', 'STAGED', 'DONE'])
- Renamed `next_task_sequence` to `next_deliverable_sequence`
- Removed `task_id` (varchar) and `git_pull_request_url` from TASKS
- Added `deliverable_id` FK to TASKS (NOT NULL, CASCADE)

**Phase 2 - Seed Data**: ✅
- Created `seedDeliverables.js` with 6 deliverables across 4 projects
- Updated task seeds to use `deliverable_id` instead of `task_id`
- Verified: 5 users, 5 projects, 6 deliverables, 26 tasks, 17 task relations

**Phase 3 - Database Service**: ✅
- Removed all `task_id` and `git_pull_request_url` references
- Removed `getTaskByTaskId()` method (no longer needed)
- Added 10+ deliverable query methods (CRUD, status transitions, approval, task filtering)
- Updated project methods to handle `deliverable_status_workflow` and `nextDeliverableSequence`

**Phase 4 - API Routes**: ✅
- Created `deliverables.js` route file with 8 endpoints:
  - `GET /projects/:projectCode/deliverables` (with status/type filters)
  - `GET /projects/:projectCode/deliverables/:id`
  - `POST /projects/:projectCode/deliverables` (create)
  - `PUT /projects/:projectCode/deliverables/:id` (update)
  - `DELETE /projects/:projectCode/deliverables/:id`
  - `PATCH /projects/:projectCode/deliverables/:id/status` (with guards)
  - `PATCH /projects/:projectCode/deliverables/:id/approve` (plan approval)
  - `GET /projects/:projectCode/deliverables/:id/tasks`
- Added deliverable validation schemas
- Registered deliverable routes in `routes/index.js`

**Phase 5 - Test Infrastructure & Tests**: ✅ COMPLETE
- Updated test helpers: `createTestTask()` now requires `deliverableId`, added `createTestDeliverable()`
- Updated `testDatabase.js`: `clearTaskData()` now drops DELIVERABLES before TASKS
- Created 5 new test files:
  - `deliverables.test.mjs`: 7 CRUD tests
  - `deliverables.status.test.mjs`: 11 status transition tests
  - `deliverables.approval.test.mjs`: 10 plan approval tests
  - `deliverables.tasks.test.mjs`: 12 tasks-for-deliverable tests
  - `projectDeliverableStatuses.test.mjs`: 15 workflow config tests
- Updated 5 existing test files to work with new data model
- **Test Results**: ✅ **All 155 tests PASSING** (10 test files)
  - deliverables.test.mjs: 7/7 ✅
  - deliverables.status.test.mjs: 11/11 ✅
  - deliverables.approval.test.mjs: 10/10 ✅
  - deliverables.tasks.test.mjs: 12/12 ✅
  - projectDeliverableStatuses.test.mjs: 15/15 ✅
  - projectStatuses.test.mjs: 31/31 ✅
  - tasks.status.test.mjs: 15/15 ✅
  - taskGraph.test.mjs: 34/34 ✅
  - statusDefinitions.test.mjs: 8/8 ✅
  - translations.test.mjs: 12/12 ✅

**Verified**:
- `npm run db:reset`: 6 deliverables, 26 tasks, correct statuses ✅
- API starts successfully with seeded test data ✅
- All route refactoring complete and tested ✅
- Database schema matches SPEC specification ✅

**Bugs Fixed**:
- `seedTaskTags.js` referenced non-existent tags — mapped to existing tags
- `createDeliverable()` transaction issue — moved read outside transaction
- `projectStatuses.test.mjs` used wrong status — corrected to Zazz methodology
- Fixed duplicate task relations in `seedTaskRelations.js`

#### Remaining Work

**Phase 6 - Client Updates**: 🔲 Not started
- Update existing components (TaskCard, KanbanBoard, TaskGraphPage)
- Create new components for deliverables (DeliverableCard, DeliverableModal, DeliverableTable)
- Create new pages (DeliverableListPage, DeliverableKanbanPage)
- Add deliverable translations (en, es, fr, de)
- Add swim lane grouping by deliverable in task graph
- Update routing and navigation

**Phase 7 - Integration Verification**: 🔲 Not started
- End-to-end testing across all layers
- Manual UI verification
- Client linting
