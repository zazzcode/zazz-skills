# Client API Integration - Routes Refactoring Documentation

**Date**: 2026-02-17  
**Status**: Complete (Backend phases 1-5 done, Client integration in progress)

---

## Overview

The Task Blaster MVP has undergone a major refactoring to support **Deliverables** as first-class entities in the system. All task operations have been moved from project-scoped endpoints to **deliverable-scoped** endpoints. This document describes all API endpoint changes and the corresponding client integration updates.

---

## API Endpoint Changes Summary

### Old Architecture (Pre-Refactor)
- Task operations were globally or project-scoped: `/tasks`, `/projects/:id/tasks`
- Tasks had a `task_id` varchar field (human-readable string like "PROJ-1")
- Tasks had a `git_pull_request_url` field
- No deliverables existed; projects contained tasks directly

### New Architecture (Current)
- **Projects** contain **Deliverables**
- **Deliverables** contain **Tasks**
- All task operations are now deliverable-scoped
- Tasks use integer IDs (serial PK) instead of string `task_id`
- Tasks reference `deliverable_id` (FK to DELIVERABLES)

---

## Endpoint Mapping: Old → New

### Task CRUD Operations

| Operation | Old Route | New Route | Notes |
|-----------|-----------|-----------|-------|
| List project tasks | `GET /tasks?projectId=X` | `GET /projects/:code/deliverables/:delivId/tasks` | Must iterate deliverables and fetch from each |
| Create task | `POST /tasks` | `POST /projects/:code/deliverables/:delivId/tasks` | Requires deliverableId |
| Get task | `GET /tasks/:id` | `GET /projects/:code/deliverables/:delivId/tasks/:id` | Deliverable ID is now required in path |
| Update task | `PUT /projects/:code/tasks/:id` | `PUT /projects/:code/deliverables/:delivId/tasks/:id` | Deliverable ID now in path |
| Delete task | `DELETE /projects/:code/tasks/:id` | `DELETE /projects/:code/deliverables/:delivId/tasks/:id` | Deliverable ID now in path |

### Deliverable Operations (New)

| Operation | Route | Method | Purpose |
|-----------|-------|--------|---------|
| List deliverables | `GET /projects/:code/deliverables` | GET | Fetch all deliverables in a project |
| Get deliverable | `GET /projects/:code/deliverables/:id` | GET | Fetch single deliverable with details |
| Create deliverable | `POST /projects/:code/deliverables` | POST | Create new deliverable |
| Update deliverable | `PUT /projects/:code/deliverables/:id` | PUT | Update name, description, file paths, etc. |
| Delete deliverable | `DELETE /projects/:code/deliverables/:id` | DELETE | Delete deliverable (CASCADE deletes tasks) |
| Change status | `PATCH /projects/:code/deliverables/:id/status` | PATCH | Transition to new status in workflow |
| Approve plan | `PATCH /projects/:code/deliverables/:id/approve` | PATCH | Approve SPEC/plan and set approval metadata |
| Get tasks in deliverable | `GET /projects/:code/deliverables/:id/tasks` | GET | Fetch tasks for this deliverable |

### Project Status Workflow (New)

| Operation | Route | Method |
|-----------|-------|--------|
| Get deliverable status workflow | `GET /projects/:code/deliverable-statuses` | GET |
| Update deliverable status workflow | `PUT /projects/:code/deliverable-statuses` | PUT |

---

## Client Hook Changes

### 1. **New: `useDeliverables` Hook**
**Location**: `client/src/hooks/useDeliverables.js`

Provides CRUD operations for deliverables within a project.

**Usage**:
```javascript
const {
  deliverables,
  loading,
  createDeliverable,
  updateDeliverable,
  updateDeliverableStatus,
  approveDeliverable,
  deleteDeliverable
} = useDeliverables(selectedProject);
```

**Key Methods**:
- `createDeliverable(data)` → `POST /projects/:code/deliverables`
- `updateDeliverable(id, updates)` → `PUT /projects/:code/deliverables/:id`
- `updateDeliverableStatus(id, status)` → `PATCH /projects/:code/deliverables/:id/status`
- `approveDeliverable(id)` → `PATCH /projects/:code/deliverables/:id/approve`
- `deleteDeliverable(id)` → `DELETE /projects/:code/deliverables/:id`

### 2. **Updated: `useTasks` Hook**
**Location**: `client/src/hooks/useTasks.js`

**Breaking Change**: Now requires deliverables array as second parameter.

**Old Usage**:
```javascript
const { tasks, ... } = useTasks(selectedProject);
```

**New Usage**:
```javascript
const { deliverables } = useDeliverables(selectedProject);
const { tasks, ... } = useTasks(selectedProject, deliverables);
```

**How it Works**:
1. Fetches tasks from each deliverable: `GET /projects/:code/deliverables/:id/tasks`
2. Concatenates all task arrays
3. Sorts by status (from project workflow) then position
4. Returns combined, sorted task list

**IMPORTANT**: The hook waits for `deliverables` to be populated before fetching tasks. If `deliverables.length === 0`, it will not fetch tasks.

**Updated Methods**:
- `addTask(taskData)` - Requires `taskData.deliverableId`
- `updateTask(taskId, updates)` - Uses deliverableId from task object
- `deleteTask(taskId)` - Uses deliverableId from task object
- `refreshTasks()` - Fetches from all deliverables

---

## Component Integration Changes

### KanbanPage.jsx

**Before**:
```javascript
const { tasks, ... } = useTasks(selectedProject);
```

**After**:
```javascript
const { deliverables } = useDeliverables(selectedProject);
const { tasks, ... } = useTasks(selectedProject, deliverables);
```

This ensures:
1. Deliverables are fetched first
2. Tasks are fetched from all deliverables
3. Both loading states are tracked

### TaskCard.jsx

Already supports `deliverableName` field in task objects.  
Task objects now include: `{ ..., deliverableId, deliverableName, ... }`

The TaskCard footer displays:
```
📦 {deliverableName}
```

---

## Data Shape Changes

### Task Object (Before Refactor)
```javascript
{
  id: 1,
  taskId: "PROJ-1",              // ← REMOVED
  title: "Create database",
  status: "TO_DO",
  projectId: 1,
  // No deliverableId
  gitPullRequestUrl: "...",      // ← REMOVED
  assigneeName: "Alice",
  tags: [{ tag: "database", color: "#..." }]
}
```

### Task Object (After Refactor)
```javascript
{
  id: 1,                          // ← Integer PK only
  title: "Create database",
  status: "TO_DO",
  projectId: 1,
  deliverableId: 3,              // ← NEW: FK to DELIVERABLES
  deliverableName: "API Layer",  // ← NEW: For display
  assigneeId: 2,
  assigneeName: "Alice",
  tags: [{ tag: "database", color: "#..." }]
}
```

### Deliverable Object
```javascript
{
  id: 3,
  projectId: 1,
  deliverableId: "ZAZZ-1",       // Human-readable ID
  name: "API Layer",
  type: "FEATURE",               // FEATURE | BUG_FIX | REFACTOR | ENHANCEMENT | CHORE | DOCUMENTATION
  status: "IN_PROGRESS",
  description: "Build REST API",
  statusHistory: [
    { status: "PLANNING", changedAt: "2026-02-17T...", changedBy: 1 },
    { status: "IN_PROGRESS", changedAt: "2026-02-17T...", changedBy: 1 }
  ],
  dedFilePath: "/path/to/SPEC.md",
  planFilePath: "/path/to/PLAN.md",
  prdFilePath: "/path/to/PRD.md",
  pullRequestUrl: "https://github.com/.../pull/123",
  approvedAt: "2026-02-17T10:30:00Z",
  approvedByName: "Michael",
  position: 10,
  taskCount: 5,
  completedTaskCount: 2
}
```

---

## Task Creation Flow Update

### App.jsx - Create Task Modal

**Before**:
```javascript
const response = await fetch('http://localhost:3030/tasks', {
  method: 'POST',
  headers: { 'TB_TOKEN': token, ... },
  body: JSON.stringify({
    title: newTask.title,
    projectId: targetProject.id,
    // No deliverableId
    ...
  })
});
```

**After**:
```javascript
// 1. Fetch deliverables
const deliverablesResponse = await fetch(
  `http://localhost:3030/projects/${targetProject.code}/deliverables`,
  { headers: { 'TB_TOKEN': token, ... } }
);
const deliverables = await deliverablesResponse.json();

if (deliverables.length === 0) {
  console.error('Cannot create task without at least one deliverable');
  return;
}

// 2. Create task in first deliverable
const response = await fetch(
  `http://localhost:3030/projects/${targetProject.code}/deliverables/${deliverables[0].id}/tasks`,
  {
    method: 'POST',
    headers: { 'TB_TOKEN': token, ... },
    body: JSON.stringify({
      title: newTask.title,
      deliverableId: deliverables[0].id,  // ← NEW: Required
      projectId: targetProject.id,
      ...
    })
  }
);
```

---

## Database Service (Backend) Response Examples

### GET /projects/:code/deliverables
```json
[
  {
    "id": 1,
    "name": "Deliverables Feature",
    "type": "FEATURE",
    "status": "IN_PROGRESS",
    "deliverableId": "ZAZZ-1",
    "projectId": 1,
    "description": "Implement deliverables module",
    "taskCount": 5,
    "completedTaskCount": 2,
    ...
  }
]
```

### GET /projects/:code/deliverables/:id/tasks
```json
[
  {
    "id": 1,
    "title": "Create schema",
    "status": "COMPLETED",
    "deliverableId": 1,
    "deliverableName": "Deliverables Feature",
    "projectId": 1,
    "assigneeId": 2,
    "assigneeName": "Alice",
    "tags": [
      { "tag": "database", "color": "#FF5733" }
    ],
    "position": 10,
    ...
  }
]
```

---

## Error Handling

All endpoints enforce:
1. **Authentication**: `TB_TOKEN` header required (401 Unauthorized)
2. **Authorization**: Project leaders can only modify their projects (403 Forbidden)
3. **Validation**: Invalid status codes, missing required fields (400 Bad Request)
4. **Existence**: Non-existent projects/deliverables/tasks (404 Not Found)

Client hooks should handle:
```javascript
if (response.status === 401) {
  console.error('Token invalid - redirect to login');
}
if (response.status === 403) {
  console.error('Permission denied');
}
if (response.status === 404) {
  console.error('Resource not found');
}
if (response.status === 400) {
  console.error('Validation error');
}
```

---

## Backward Compatibility

**None**. This is a breaking change:
- Old routes (`/tasks`, `/projects/:id/tasks`) no longer exist
- Task objects have different structure (no `taskId`, has `deliverableId`)
- Client must be fully updated to work with new API

---

## Testing

### Manual API Testing

```bash
TOKEN="550e8400-e29b-41d4-a716-446655440000"

# List deliverables
curl -H "TB_TOKEN: $TOKEN" \
  http://localhost:3030/projects/ZAZZ/deliverables

# Create deliverable
curl -X POST -H "TB_TOKEN: $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"New Deliverable","type":"FEATURE"}' \
  http://localhost:3030/projects/ZAZZ/deliverables

# List tasks in deliverable
curl -H "TB_TOKEN: $TOKEN" \
  http://localhost:3030/projects/ZAZZ/deliverables/1/tasks

# Create task in deliverable
curl -X POST -H "TB_TOKEN: $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"New Task","deliverableId":1,"status":"TO_DO"}' \
  http://localhost:3030/projects/ZAZZ/deliverables/1/tasks
```

### Integration Tests

All 155 API integration tests pass, including:
- 7 deliverables CRUD tests
- 11 deliverables status transition tests
- 10 deliverables plan approval tests
- 12 deliverables-scoped task tests
- 15 deliverable status workflow tests
- Updated task and project tests

---

## Two-Board Architecture

The client now supports **two distinct Kanban boards**, each with its own columns and drag-and-drop:

### 1. Task Kanban Board
**Route**: `/projects/:code/kanban` (or `/projects/:code/task-kanban`)  
**Purpose**: Track individual work items (tasks) assigned to agents  
**Columns**: To Do | Ready | In Progress | QA | Completed (Zazz methodology)  
**Cards**: Task cards with title, priority, assignee, tags, and deliverable name footer  
**Flow**:
- Agents pick up tasks from Ready column
- Work them through In Progress → QA → Completed
- QA failures loop back to In Progress for rework

### 2. Deliverable Kanban Board
**Route**: `/projects/:code/deliverable-kanban`  
**Purpose**: Track high-level work products from specification through deployment  
**Columns**: Planning | In Progress | In Review | Staged | Done (configurable per project)  
**Cards**: Deliverable cards with name, type, task progress bar, PR link, approval status  
**Flow**:
- Deliverables start in Planning (SPEC + plan creation)
- Move to In Progress when plan is approved
- Move to In Review when PR is created
- Move to Staged when merged to staging
- Move to Done when merged to main

### Navigation Between Boards
Users switch between boards using a segmented control or navigation menu:
```
[Task Kanban] [Task Graph] [Deliverables List] [Deliverable Board]
```

## Remaining Client Work

### Phase 6: Client Updates (In Progress)
- ✅ Create `useDeliverables` hook
- ✅ Update `useTasks` hook for deliverable-scoped routes
- ✅ Update KanbanPage to use both hooks
- 🔄 Update App.jsx task creation modal
- 🔲 Create DeliverableListPage component (sortable table with copy-to-clipboard)
- 🔲 Create DeliverableKanbanPage component (board with drag-and-drop)
- 🔲 Create DeliverableCard component
- 🔲 Create DeliverableTable component
- 🔲 Add deliverable translations (en, es, fr, de)
- 🔲 Update task graph with swim lanes per deliverable
- 🔲 Add deliverable management UI (create/edit modals)
- 🔲 Update App.jsx navigation to include new routes

### Phase 7: Integration & Verification
- 🔲 End-to-end testing (both boards working together)
- 🔲 Manual UI testing (drag-and-drop, filtering, search)
- 🔲 Client linting (ESLint)
- 🔲 Verify cross-board workflows (task completion → deliverable progress → PR link)
- 🔲 Verify navigation between all views works correctly

---

## Configuration

**API Base URL**: `http://localhost:3030`  
**Client Dev Server**: `http://localhost:3001`  
**Authentication**: `TB_TOKEN` header (localStorage)

---

## Contact & Support

For questions about the refactoring:
1. Review AGENTS.md for full project structure
2. Check api/__tests__/README.md for test patterns
3. See deliverables-mvp-PLAN.md for implementation details
