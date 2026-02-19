# Zazz Board Agent Skill

**Overview**: This skill defines the methodology for LLM-based agent teams (Manager, Worker, QA) to autonomously develop software deliverables using the Zazz Board API. Agents work collaboratively on a single worktree/branch, coordinating via explicit message passing and shared state files.

**Supporting Documents**:
- `agent-architecture.md` - Agent orchestration, communication, concurrency control
- `pr-template.md` - PR template for QA agent
- `workflow-operations.md` - Detailed step-by-step operational procedures

---

## 1. Skill Definition

### Purpose

Enables LLM agents to:
- Autonomously plan and execute software development tasks
- Collaborate within multi-agent teams (Manager, Worker, QA)
- Integrate with Zazz Board API for task management
- Minimize human intervention through structured communication
- Produce high-quality code with built-in QA verification

### Agent Roles

| Role | Responsibility |
|------|----------------|
| **Manager** | Orchestrates deliverable workflow: selects, plans (task graph), monitors, responds to escalations, manages multi-deliverable sequence |
| **Worker(s)** | Executes tasks: implements per specifications, asks clarifying questions, commits code, respects dependencies |
| **QA** | Verifies quality: tests, code analysis (performance/security/best practices), creates rework tasks, authors PR |

### Key Assumptions

1. All agents run on **single laptop/server** sharing one worktree/branch
2. Each agent has **independent LLM context** (not shared memory)
3. **Zazz Board API** is running and provides OpenAPI spec at `{API_BASE_URL}/docs/json`
4. All work happens in **explicit task graph** with dependencies
5. **No circular dependencies** in task graph (acyclic; enforced by Manager)
6. **File-level locking** prevents concurrent edits to same file

---

## 2. Core Workflow Phases

### Phase 1: Deliverable Selection & Planning
1. Manager selects approved deliverable (human signal or API poll)
2. Manager retrieves DED, plan, PRD documents from API
3. Manager analyzes docs and creates task graph with dependencies (DEPENDS_ON, COORDINATES_WITH)
4. Manager fetches OpenAPI spec from `{API_BASE_URL}/docs/json` and caches to `.zazz/api-spec.json`

### Phase 2: Implementation
1. Workers poll for tasks with status `TO_DO` and satisfied dependencies
2. Workers acquire file locks before editing
3. Workers implement per task prompt and acceptance criteria
4. Workers commit with format: `TASK-{id}: {description} [{agent_id}]`
5. Workers release locks and mark task `COMPLETED`

### Phase 3: QA & Rework
1. Manager signals QA when all tasks `COMPLETED`
2. QA verifies AC, runs tests, analyzes code (performance/security/best practices)
3. QA creates rework tasks for simple issues OR escalates complex issues to Manager
4. Manager creates rework sub-plan for complex interdependent fixes
5. Workers execute rework tasks
6. QA repeats until all issues resolved

### Phase 4: PR & Review
1. **QA creates PR** (not Manager) using `pr-template.md` with full verification evidence
2. QA updates deliverable status to `IN_REVIEW` via API
3. Human reviews PR and decides merge
4. Manager resets state, archives logs, repeats from Phase 1 for next deliverable

---

## 3. Task Prompt Template

Each task created via API should have a `prompt` field with this structure:

```markdown
## Goal
[One-sentence objective for this task]

## Instructions
[Step-by-step implementation guidance]

## Tech Spec
[Relevant snippets from DED/plan for this task; file paths, interfaces, constraints]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] ...

## Required Automated Tests
[Tests that must pass for AC; file paths, test names]

## Files to Modify
[Explicit list of files this task will edit; used for lock acquisition]
```

**Key principles:**
- Task should be **self-contained** (worker doesn't re-read DED/plan)
- One task = one coherent unit (file/module/feature slice)
- Dependencies explicit (tasks touching same file have DEPENDS_ON relation)
- AC must be testable and verifiable by QA

---

## 4. API Integration

### Fetching the OpenAPI Spec

**Manager fetches at deliverable start:**
```
GET {API_BASE_URL}/docs/json
```

**Cache to local file:**
```
.zazz/api-spec.json
```

**All agents read from cached file** (single source of truth for workflow duration).

### Key API Operations

Agents infer routes from spec descriptions. Typical operations:

| Intent | Typical API Pattern |
|--------|---------------------|
| List projects | `GET /projects` |
| List deliverables | `GET /projects/:projectCode/deliverables` |
| Get deliverable details | `GET /projects/:projectCode/deliverables/:id` |
| Create task | `POST /projects/:code/deliverables/:delivId/tasks` |
| Set task relations | `POST /projects/:code/tasks/:taskId/relations` |
| List deliverable tasks | `GET /projects/:projectCode/deliverables/:id/tasks` |
| Update task status | `PATCH /projects/:code/tasks/:taskId/status` |
| Post task comment | `POST /projects/:code/tasks/:taskId/comments` |
| Update deliverable status | `PATCH /projects/:projectCode/deliverables/:id/status` |

**Important**: Paths may change. Agents must use spec descriptions to match intent to operations.

---

## 5. Communication Patterns

### Worker → Manager

**When worker needs clarification:**
1. Post question to task via API (`POST /tasks/:taskId/comments`)
2. Mark task status as `BLOCKED`
3. Include: unclear area, implementation impact, available options
4. Wait for Manager response

**Manager responds:**
1. Monitor for `BLOCKED` tasks (polling every 10-30 sec)
2. Provide clarification OR escalate to human-in-loop
3. Update task comment with decision
4. Clear `BLOCKED` status

### QA → Manager

**When QA finds complex rework:**
1. Summarize issue: root cause, affected areas, interdependencies
2. Indicate if design/architecture decision needed
3. Post to Manager via API or `.zazz/agent-messages.json`

**Manager responds:**
1. Analyze issue
2. If simple fixes → QA creates tasks directly
3. If complex (2+ interdependent fixes) → Manager creates rework sub-plan
4. If ambiguous → escalate to human

### Manager → Human

**Escalation triggers:**
- Worker questions requiring product/design decisions
- Rework involves 2+ interdependent fixes with architectural impact
- Circular dependency detected (indicates planning error)
- Ambiguity in AC or technical constraints

**Format:**
- Summarize issue, decision required, context, deadline
- Link to affected tasks/comments
- Wait for human response (do not auto-retry or speculate)

---

## 6. File Conflict Avoidance

### Rules

1. **Single writer per file** - Enforced via `.zazz/agent-locks.json`
2. **Task dependencies for shared files** - If Task A and B both edit `src/auth.ts` → create DEPENDS_ON relation
3. **Manager reviews high-conflict areas** - If >2 tasks touch same file → create explicit dependency chain (A → B → C)
4. **Commit atomicity** - Each agent commits immediately after finishing task
5. **Lock timeout safety** - If agent crashes, lock expires after timeout (default 10 min); Manager detects via heartbeat and releases

### Lock Format

See `agent-architecture.md` for detailed lock acquisition/release procedures and `.zazz/agent-locks.json` schema.

---

## 7. Multi-Deliverable Manager Strategy

### Sequential Approach (Recommended for v1)

**Manager manages one deliverable at a time:**

```
Manager Loop:
  1. Check for next approved deliverable (human signal or API poll)
  2. Load deliverable context
  3. Execute full workflow (Phases 1-4)
  4. Update deliverable to IN_REVIEW
  5. Reset state:
     - Clear task graph
     - Release all file locks
     - Archive logs to `.zazz/archive/{DEL-ID}/`
     - Signal workers/QA to set status IDLE
     - Clear `.zazz/agent-messages.json`
  6. Loop to step 1
```

**Benefits:**
- Simple state management
- No context switching overhead
- Single Manager instance
- Easy debugging

**Drawbacks:**
- Only one deliverable in progress at a time

### Parallel Approach (Future Phase)

**Manager manages multiple deliverables simultaneously:**
- Maintain separate context/state per deliverable
- Spawn dedicated sub-managers OR multiplex in single Manager
- More complex but higher throughput

---

## 8. Environment Variables

All agents require:

```bash
# Zazz Board API
export ZAZZ_API_BASE_URL="http://localhost:3000"
export ZAZZ_API_TOKEN="your-api-token"

# Agent identity
export AGENT_ID="manager|worker_1|worker_2|qa"
export AGENT_ROLE="manager|worker|qa"

# LLM provider
export LLM_PROVIDER="anthropic|openai"
export LLM_API_KEY="your-llm-api-key"
export LLM_MODEL="claude-3-5-sonnet-20241022"

# Workspace
export ZAZZ_WORKSPACE="/path/to/project"
export ZAZZ_STATE_DIR="${ZAZZ_WORKSPACE}/.zazz"

# Timeouts (optional, defaults shown)
export AGENT_POLL_INTERVAL_SEC=15
export AGENT_HEARTBEAT_INTERVAL_SEC=10
export AGENT_TIMEOUT_SEC=120
export FILE_LOCK_TIMEOUT_MIN=10
```

---

## 9. Skill Installation

### Repository Structure

```
zazz-board-agent-skill/
├── README.md
├── zazz-skills.md              # This file (skill definition)
├── agent-architecture.md        # Technical architecture
├── workflow-operations.md       # Detailed step-by-step ops
├── pr-template.md               # PR template for QA
├── examples/
│   ├── example-task-prompt.md
│   ├── example-pr.md
│   └── example-rework-escalation.md
└── .zazz/                       # Template state files
    ├── agent-state.json.template
    ├── agent-locks.json.template
    └── agent-messages.json.template
```

### Installation

1. Clone skill repo into agent environment
2. Set environment variables (section 8)
3. Configure agent framework (Claude API, LangGraph, CrewAI, etc.)
4. Write system prompts for each role (Manager, Worker, QA)
5. Test with single deliverable

---

## 10. Best Practices

### Task Design
1. Task prompts should be self-contained
2. Include explicit, testable acceptance criteria
3. Provide code examples (show patterns, not just descriptions)
4. Limit task scope (one file or coherent feature slice)
5. Declare file dependencies upfront

### Communication
6. Manager should poll frequently (every 10-30 sec) to catch blockers early
7. Workers should ask questions immediately (don't guess)
8. Log all decisions via API task comments for audit trail
9. Escalate ambiguity (don't speculate)

### Concurrency
10. Lock timeouts should be generous (if task ~5 min, set expiry to 10 min)
11. Commit frequently (workers commit after each task)
12. Avoid over-parallelization (don't spawn 10 workers if only 3 tasks available)
13. Monitor file contention (if >2 tasks need same file, create dependencies)

### Quality Assurance
14. QA should run tests in isolation with timeouts
15. QA analyzes code, not just tests (performance, security, best practices)
16. Create detailed rework tasks with reproduction steps
17. Escalate complex issues early (don't create 5 interdependent rework tasks)

### Reliability
18. Agents should never auto-retry decisions (always escalate ambiguity)
19. Heartbeats are non-negotiable (update every 10 sec or risk being marked crashed)
20. Clean up on shutdown (release locks, archive logs, reset state)
21. Design for idempotency (tasks and tests safely re-runnable)

---

## 11. Future Enhancements

**Phase 2 improvements** (after initial implementation):

1. **Dynamic worker scaling** - Spawn more workers when task queue grows
2. **Specialized workers** - Frontend, backend, database workers with distinct skills
3. **Parallel QA** - Multiple QA agents review independent task groups
4. **Predictive lock acquisition** - Manager pre-assigns file locks based on task graph
5. **WebSocket communication** - Replace polling with real-time push notifications
6. **Distributed deployment** - Multiple laptops/servers coordinating via API
7. **Agent performance metrics** - Track completion time, question frequency, rework rate
8. **Human-in-loop UI** - Dashboard showing agent status, task graph, escalations

---

## 12. Related Documents

- **`agent-architecture.md`** - Detailed agent orchestration, communication protocols, concurrency control, error handling, recovery procedures
- **`workflow-operations.md`** - Step-by-step operational procedures for each workflow phase
- **`pr-template.md`** - PR template for QA agent with full verification checklist
- **Examples** - Sample task prompts, PRs, escalations

---

## 13. Skill Maintenance

**This skill will be enriched with:**
- Concrete implementation examples (once Swagger API complete)
- Error handling patterns (agent crashes, API failures, merge conflicts)
- Performance benchmarks (task completion time, rework rates)
- Real-world case studies (successful deliverable workflows)

**Version**: 1.0.0  
**Last Updated**: 2026-02-19  
**Status**: Draft (awaiting Zazz Board API completion)
