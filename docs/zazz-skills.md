# Zazz Board Agent Skills

Methodology for agents (manager, worker, QA) to interact with the Zazz Board API and the application being developed. Agents fetch the API spec at runtime from `{API_BASE_URL}/docs/json` and infer routes from descriptions. This doc lives in a separate repo; skills reference the running Zazz Board instance.

---

## 1. Agent Roles

| Role | Responsibility |
|------|----------------|
| **Manager agent** | Selects deliverable, creates tasks from plan, polls for completion, coordinates QA, spawns rework |
| **Worker agent(s)** | Pick up tasks, implement per prompt, commit to worktree/branch |
| **QA agent** | Verifies AC, runs tests, analyzes code (performance, security, best practice), creates rework tasks for flaws |

---

## 2. Workflow Overview

1. Manager selects approved deliverable (API or human prompt)
2. Manager retrieves SPEC + plan docs, analyzes them
3. Manager (or delegated agent) creates tasks from plan via API with dependencies and collaboration rules → task graph
4. Worker(s) pick up tasks, respect dependencies, reference local AGENTS.md + tech specs
5. Manager polls API until all tasks are COMPLETED
6. Manager assigns QA agent to verify AC, tests, and code analysis
7. QA creates rework/bug tasks for each flaw
8. Manager polls; workers pick up rework tasks
9. QA + Manager minimize multiple agents editing same file (file conflict avoidance)
10. Workers commit after each task; QA ensures all files committed, creates PR from template, updates deliverable to IN_REVIEW
11. Workflow ends; agents reset; next manager picks next approved deliverable

---

## 3. Step-by-Step Workflow

### Step 1: Select Deliverable

**Manager agent** selects a deliverable whose plan has been approved.

- **Option A**: Human tells manager which deliverable (project code + deliverable id)
- **Option B**: Manager calls API to get next approved deliverable (future: polling endpoint)
- **API**: List deliverables filtered by status; find one with approved plan (deliverable status/approval fields)

### Step 2: Retrieve and Analyze SPEC + Plan

Deliverable has `dedFilePath` (path to deliverable specification), `planFilePath`, `prdFilePath` (local paths or URLs).

- Manager fetches those docs (file read or URL fetch)
- Analyzes SPEC and implementation plan to understand scope, dependencies, acceptance criteria
- Uses this to craft tasks in Step 3

### Step 3: Create Task Graph

**Manager** (or delegated agent) reads the plan and creates tasks via API.

- Create tasks per deliverable: `POST /projects/:code/deliverables/:delivId/tasks`
- Set task relations (DEPENDS_ON, COORDINATES_WITH) for dependencies and collaboration
- Each task needs a **well-formed prompt** (see Task Prompt Template below)
- Task prompt should be self-contained: goal, instructions, tech spec, acceptance criteria, required automated tests

**Task creation methodology:**

- One task = one coherent unit of work (file/module/feature slice)
- Dependencies: tasks that touch the same file or have strict ordering
- Collaboration: tasks that can run in parallel but need awareness of each other

### Step 4: Workers Execute Tasks

**Worker agents** pick up tasks (status TO_DO → IN_PROGRESS).

- Call API to update task status when picking up
- Reference: **local AGENTS.md** (project conventions) + **tech specs** for the deliverable
- Task prompt should be sufficient; workers generally do **not** need SPEC or full plan
- Respect dependency graph: only pick up tasks whose dependencies are COMPLETED
- After completing work: update task status to COMPLETED, commit to worktree/branch

### Step 5: Manager Polls for Task Completion

**Manager** polls API until all tasks for the deliverable are COMPLETED.

- `GET /projects/:projectCode/deliverables/:id/tasks` with status filter
- Or check task graph / readiness endpoints
- When all done → proceed to QA

### Step 6: QA Agent Verifies Deliverable

**Manager** assigns (spawns or delegates to) **QA agent**.

QA agent:

- Confirms all acceptance criteria are met
- Runs automated tests
- Analyzes code for performance, security, best practices
- May run specialized scripts (performance, security scans)

### Step 7: QA Creates Rework Tasks

If QA finds flaws:

- Create a rework or bug task for **each issue**
- Link to original task/deliverable as needed
- Set appropriate status so workers can pick up

### Step 8: Workers Pick Up Rework Tasks

**Manager** polls; when rework tasks exist, workers pick them up.

- Same flow as Step 4
- Rework tasks may have dependencies (e.g., fix A before fix B)

### Step 9: File Conflict Minimization

**QA and Manager** consider files affected by tasks.

- Avoid multiple agents writing to the same file at once
- When two or more tasks must touch the same file → sequence them (DEPENDS_ON) so they run in series
- Use task graph to plan who works on what

### Step 10: Commit and Create PR

- **After each task**: Worker commits changes to worktree/branch
- **After QA is satisfied**: QA ensures all files are committed
- QA creates PR using a template
- API: Update deliverable status to IN_REVIEW

### Step 11: Reset and Next Deliverable

- Workflow ends for this deliverable
- Agents reset
- New manager agent selects next approved deliverable
- Repeat from Step 1

---

## 4. Task Prompt Template

Each task created via the API should have a `prompt` field containing:

```
## Goal
[One-sentence objective for this task]

## Instructions
[Step-by-step implementation guidance]

## Tech Spec
[Relevant snippets from SPEC/plan for this task; file paths, interfaces, constraints]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- ...

## Required Automated Tests
[Tests that must pass for AC; file paths, test names]
```

Task should be **self-contained** so a worker can execute without re-reading SPEC or full plan.

---

## 5. API Usage Summary

Agents infer routes from the OpenAPI spec at `{API_BASE_URL}/docs/json`. Key operations (by intent; paths may change):

| Intent | Typical API usage |
|--------|-------------------|
| List projects | GET projects |
| List deliverables | GET projects/:projectCode/deliverables |
| Get deliverable (SPEC, plan paths) | GET projects/:projectCode/deliverables/:id |
| Create tasks | POST projects/:code/deliverables/:delivId/tasks |
| Set task relations | POST projects/:code/tasks/:taskId/relations |
| List deliverable tasks | GET projects/:projectCode/deliverables/:id/tasks |
| Update task status | PATCH projects/:code/tasks/:taskId/status |
| Update task | PUT projects/:code/deliverables/:delivId/tasks/:taskId |
| Update deliverable status | PATCH projects/:projectCode/deliverables/:id/status |
| Get task graph / readiness | GET projects/:code/graph, tasks/:taskId/readiness |

Agents use **descriptions** in the spec to match intent to operations. Paths can change; the spec is the source of truth.

---

## 6. Skill Distribution

Skills live in a **separate repo** (e.g. `zazz-board-agent-skill`).

- Agents install the skill into their environment
- Skill teaches this methodology and patterns; it does not hardcode routes
- Skill may include: task prompt template, file conflict rules, AGENTS.md usage
- API spec is fetched at runtime from the running Zazz Board instance
