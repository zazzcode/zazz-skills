---
name: "Zazz Board API"
type: "rule"
description: "Required API skill for all agents to communicate and manage deliverables"
required_for: ["coordinator", "worker", "qa", "spec-builder"]
---

# Zazz Board API (Required Rule Skill)

**Purpose**: Defines how all agents communicate via the Zazz Board API for creating/managing deliverables and tasks

**Required By**: All agents (Coordinator, Worker, QA, Spec-Builder) MUST use this API

---

## Overview

The Zazz Board API provides REST endpoints for managing deliverables and tasks. All agents use this API for:
- Creating and updating deliverables
- Creating and updating tasks
- Posting task comments and questions
- Updating task status
- Managing task relations (dependencies)

---

## Quick Reference

**API Documentation (Swagger/OpenAPI)**: `{ZAZZ_API_BASE_URL}/docs`

Open this URL in a browser to explore the full API interactively while developing.

---

## Authentication

All API requests require:
- **Header**: `Authorization: Bearer {ZAZZ_API_TOKEN}`
- **Base URL**: `{ZAZZ_API_BASE_URL}` (e.g., `http://localhost:3000`)

---

## Deliverable Endpoints

### GET /projects/{project_code}/deliverables/{deliverable_id}
Fetch deliverable details.

**Parameters**:
- `project_code` (string): Project identifier (e.g., "APP")
- `deliverable_id` (string): Deliverable ID (e.g., "DEL-001")

**Response**:
```json
{
  "id": "DEL-001",
  "project_code": "APP",
  "name": "User Authentication",
  "status": "PLANNING",
  "spec_url": "project-repo/user-auth-SPEC.md",
  "plan_url": "project-repo/user-auth-PLAN.md",
  "created_at": "2026-02-23T00:00:00Z",
  "updated_at": "2026-02-23T10:30:00Z"
}
```

### PATCH /projects/{project_code}/deliverables/{deliverable_id}
Update deliverable status or metadata.

**Request Body**:
```json
{
  "status": "IN_PROGRESS|IN_REVIEW|COMPLETED|BLOCKED",
  "plan_url": "updated-url-if-needed"
}
```

---

## Task Endpoints

### POST /projects/{project_code}/deliverables/{deliverable_id}/tasks
Create a new task.

**Request Body**:
```json
{
  "title": "Add JWT validation to auth handler",
  "goal": "Implement JWT token validation for all protected endpoints",
  "instructions": "See implementation plan section 2.3...",
  "acceptance_criteria": [
    "JWT token is validated on every protected endpoint",
    "Invalid tokens return 401 Unauthorized",
    "Expired tokens return 401 Unauthorized"
  ],
  "test_requirements": {
    "unit_tests": ["JWT validation logic"],
    "api_tests": ["Valid token acceptance", "Invalid token rejection", "Expired token rejection"],
    "e2e_tests": []
  },
  "files_to_modify": ["src/middleware/auth.ts", "tests/middleware/auth.test.ts"],
  "depends_on": ["TASK-10"],
  "coordinates_with": [],
  "estimated_complexity": "medium"
}
```

**Response**:
```json
{
  "id": "TASK-42",
  "title": "Add JWT validation to auth handler",
  "status": "TO_DO",
  "created_at": "2026-02-23T10:30:00Z"
}
```

### GET /projects/{project_code}/deliverables/{deliverable_id}/tasks
List all tasks for a deliverable.

**Query Parameters**:
- `status` (optional): Filter by status (TO_DO, IN_PROGRESS, COMPLETED, BLOCKED)
- `assigned_to` (optional): Filter by agent

**Response**:
```json
[
  {
    "id": "TASK-1",
    "title": "Setup authentication routes",
    "status": "COMPLETED",
    "assigned_to": "worker_1"
  },
  {
    "id": "TASK-42",
    "title": "Add JWT validation to auth handler",
    "status": "TO_DO",
    "depends_on": ["TASK-10"]
  }
]
```

### GET /projects/{project_code}/deliverables/{deliverable_id}/tasks/{task_id}
Fetch task details.

**Response**:
```json
{
  "id": "TASK-42",
  "title": "Add JWT validation to auth handler",
  "goal": "Implement JWT token validation...",
  "instructions": "See implementation plan section 2.3...",
  "status": "IN_PROGRESS",
  "assigned_to": "worker_1",
  "created_at": "2026-02-23T10:30:00Z",
  "started_at": "2026-02-23T11:00:00Z",
  "depends_on": ["TASK-10"],
  "coordinates_with": [],
  "comments": [...]
}
```

### PATCH /projects/{project_code}/deliverables/{deliverable_id}/tasks/{task_id}
Update task status or assignment.

**Request Body**:
```json
{
  "status": "IN_PROGRESS|COMPLETED|BLOCKED",
  "assigned_to": "worker_1"
}
```

---

## Task Comments

### POST /projects/{project_code}/deliverables/{deliverable_id}/tasks/{task_id}/comments
Post a comment or question on a task.

**Request Body**:
```json
{
  "author": "worker_1",
  "type": "question|answer|note",
  "content": "Should JWT validation happen in middleware or in route handler?"
}
```

**Response**:
```json
{
  "id": "comment-001",
  "task_id": "TASK-42",
  "author": "worker_1",
  "type": "question",
  "content": "Should JWT validation happen in middleware or in route handler?",
  "created_at": "2026-02-23T11:15:00Z"
}
```

### GET /projects/{project_code}/deliverables/{deliverable_id}/tasks/{task_id}/comments
Fetch all comments for a task.

**Response**:
```json
[
  {
    "id": "comment-001",
    "author": "worker_1",
    "type": "question",
    "content": "Should JWT validation happen in middleware or in route handler?",
    "created_at": "2026-02-23T11:15:00Z"
  },
  {
    "id": "comment-002",
    "author": "coordinator",
    "type": "answer",
    "reply_to": "comment-001",
    "content": "Use middleware per tech spec section 3.2. See example in src/middleware/auth-old.ts",
    "created_at": "2026-02-23T11:20:00Z"
  }
]
```

---

## Task Relations

### POST /projects/{project_code}/deliverables/{deliverable_id}/tasks/{task_id}/relations
Create a dependency or coordination relation to another task.

**Request Body**:
```json
{
  "type": "DEPENDS_ON|COORDINATES_WITH|REWORK_FOR",
  "related_task_id": "TASK-10"
}
```

### GET /projects/{project_code}/deliverables/{deliverable_id}/tasks/{task_id}/relations
Fetch all relations for a task.

---

## Error Handling

All endpoints return standard HTTP status codes:

- **200**: Success
- **201**: Created
- **400**: Bad Request (invalid parameters)
- **401**: Unauthorized (missing/invalid token)
- **404**: Not Found (resource doesn't exist)
- **409**: Conflict (race condition, e.g., task status changed)
- **500**: Internal Server Error

Error response:
```json
{
  "error": "Task not found",
  "status": 404,
  "timestamp": "2026-02-23T11:20:00Z"
}
```

---

## Rate Limiting

- **Requests per minute**: 60 (per agent)
- **Burst**: Up to 10 concurrent requests
- **Backoff**: Exponential backoff if rate limited (429 status)

---

## Example: Coordinator Creating Task

```bash
curl -X POST http://localhost:3000/projects/APP/deliverables/DEL-001/tasks \
  -H "Authorization: Bearer ${ZAZZ_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Add JWT validation",
    "goal": "Implement JWT token validation",
    "instructions": "1. Create JWT validation middleware...",
    "acceptance_criteria": ["Valid tokens accepted", "Invalid tokens rejected"],
    "test_requirements": {
      "unit_tests": ["JWT validation logic"],
      "api_tests": ["Token validation"]
    },
    "files_to_modify": ["src/middleware/auth.ts"],
    "depends_on": ["TASK-10"],
    "estimated_complexity": "medium"
  }'
```

---

## Example: Worker Posting Question

```bash
curl -X POST http://localhost:3000/projects/APP/deliverables/DEL-001/tasks/TASK-42/comments \
  -H "Authorization: Bearer ${ZAZZ_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "author": "worker_1",
    "type": "question",
    "content": "Should validation happen in middleware or route handler?"
  }'
```

---

## Best Practices

1. **Retry on Failure**: Implement exponential backoff for transient errors
2. **Validate Input**: Check task dependencies are valid before creating
3. **Use Meaningful Messages**: Clear commit messages and comments for audit trail
4. **Batch Operations**: Group related API calls to minimize requests
5. **Cache When Possible**: Cache deliverable SPEC and PLAN locally
6. **Log Everything**: Log all API calls for debugging and audit

---

## Environment Variables Required

```bash
export ZAZZ_API_BASE_URL="http://localhost:3000"
export ZAZZ_API_TOKEN="your-api-token"
export PROJECT_CODE="APP"
export DELIVERABLE_ID="DEL-001"
```

---

## Reference

See examples for:
- How Coordinator creates initial task graph
- How Worker posts questions
- How QA creates rework tasks
- How to handle API errors and retries
