# Zazz Workflow Overview

This document explains the high-level workflow and how the three agent skills (Manager, Worker, QA) work together to complete a deliverable.

---

## Four Workflow Phases

### Phase 1: Deliverable Selection & Planning (Manager Agent)

**Goal**: Understand the deliverable and create a task graph with dependencies.

**Manager Agent Actions:**
1. Receives request to start a deliverable (human signal or API poll)
2. Fetches deliverable from Zazz Board API:
   - Detailed Engineering Document (DED)
   - Implementation Plan
   - Product Requirements Document (PRD)
   - Acceptance Criteria
3. Analyzes plan and breaks it into tasks
4. Fetches OpenAPI spec from `{ZAZZ_API_BASE_URL}/docs/json` and caches to `.zazz/api-spec.json`
5. Creates task graph via API with:
   - Task title, goal, instructions
   - Self-contained prompts (Task Prompt Template)
   - Task relations: DEPENDS_ON, COORDINATES_WITH
   - Files to modify (for lock management)
6. Initializes `.zazz/agent-state.json` with deliverable context
7. Signals workers and QA that tasks are ready

**Outputs:**
- Task graph with N tasks and dependencies
- `.zazz/agent-state.json` with deliverable context
- `.zazz/api-spec.json` (cached OpenAPI spec)
- Workers ready to poll for tasks
- QA waiting for Manager signal

**Duration:** 2-5 minutes (task creation + analysis)

---

### Phase 2: Implementation (Worker Agents)

**Goal**: Execute tasks and produce working code with tests.

**Worker Agent Actions:**
1. Polls every 15 seconds for tasks with status `TO_DO` and satisfied dependencies
2. When task found:
   - Acquires file locks via `.zazz/agent-locks.json`
   - Updates task status to `IN_PROGRESS`
   - Reads task prompt (Goal, Instructions, Tech Spec, AC, Tests)
3. Implements per task requirements:
   - Writes code following project conventions (AGENTS.md)
   - Runs tests to verify AC
   - May ask Manager questions if prompt unclear (posts to task comments)
4. Commits changes with format: `TASK-{id}: {description} [{agent_id}]`
5. Releases file locks
6. Updates task status to `COMPLETED`
7. Updates heartbeat in `.zazz/agent-state.json`
8. Repeats until no more `TO_DO` tasks

**Manager's Role During Phase 2:**
- Polls every 10-30 seconds for `BLOCKED` tasks
- Responds to worker questions via task comments
- Escalates ambiguous questions to human-in-loop
- Monitors for worker timeouts (>120 sec = missing heartbeat)

**Outputs:**
- All tasks with status `COMPLETED`
- Code committed to worktree/branch
- All file locks released
- Complete audit trail in task comments

**Duration:** Depends on task complexity (typically 5-30 minutes for moderate deliverable)

---

### Phase 3: QA & Rework (QA Agent + Manager)

**Goal**: Verify quality and fix any issues found.

**QA Agent Actions:**
1. Waits for Manager signal that all tasks `COMPLETED`
2. Verifies Acceptance Criteria:
   - Reviews each AC from deliverable
   - Checks against implemented code
   - Confirms per task comments and commits
3. Runs Tests:
   - Unit tests: captures results
   - Integration tests: captures results
   - E2E tests: captures results
   - Performance tests: measures against spec
   - Security scan: identifies vulnerabilities
4. Analyzes Code:
   - Performance: response times, memory, database queries
   - Security: vulnerabilities, authentication, authorization
   - Best Practices: patterns, error handling, logging

**If Issues Found:**

**Simple isolated issue** (affects 1-2 files, low risk):
- QA creates rework task via API
- Sets task status to `TO_DO`
- Creates REWORK_FOR relation to original task
- Workers pick up and execute like Phase 2

**Complex interdependent issues** (2+ fixes, architectural impact):
- QA escalates to Manager with summary
- Manager analyzes interdependencies
- Manager creates rework sub-plan (like Phase 1) with:
  - Individual rework tasks
  - Dependencies between fixes
  - Execution order
- Workers execute rework tasks
- QA verifies fixes

**Manager's Role During Phase 3:**
- Monitors for rework tasks created by QA
- Analyzes complex escalations
- Creates rework sub-plans for interdependent fixes
- Escalates architectural questions to human-in-loop

**Rework Loop:**
- QA creates/receives rework tasks
- Workers execute
- QA verifies fixes
- Repeat until all issues resolved

**Outputs:**
- All AC verified
- All tests passing
- No security issues (critical/high)
- No performance issues
- Ready for PR

**Duration:** Depends on issue complexity (typically 5-20 minutes + rework time)

---

### Phase 4: PR & Review (QA Agent + Manager)

**Goal**: Create PR with full verification evidence and update status.

**QA Agent Actions:**
1. Ensures all files committed:
   ```
   git status → "working tree clean"
   ```

2. Creates PR using `pr-template.md` with:
   - Deliverable ID and project code
   - **Acceptance Criteria Status** - Each AC with verification evidence
   - **Testing Summary** - Test results (unit, integration, E2E, performance)
   - **Code Analysis** - Performance, security, best practices findings
   - **Rework History** - All cycles with root causes and resolutions
   - **Files Changed** - New, modified, deleted files
   - **Dependencies** - Any new or updated packages
   - **QA Sign-off** - Approval for human review

3. Updates deliverable status to `IN_REVIEW` via API

4. Logs PR creation to `.zazz/audit.log`

**Manager's Role During Phase 4:**
- Monitors PR creation
- Logs completion event
- Prepares to reset state
- Notifies (if needed) that PR ready for human review

**Human Reviewer Actions:**
- Reviews PR on GitHub/GitLab
- Checks code quality, architecture, documentation
- Approves or requests changes
- Merges when satisfied

**Outputs:**
- PR created with full verification evidence
- Deliverable status: `IN_REVIEW`
- Audit trail complete
- Ready for human review and merge

**Duration:** Immediate (PR creation < 1 minute)

---

## Multi-Deliverable Loop

After Phase 4 completes:

**Manager Reset:**
1. Archives logs to `.zazz/archive/{deliverable_id}/`
2. Clears task graph
3. Releases all file locks
4. Clears `.zazz/agent-messages.json`
5. Updates `.zazz/agent-state.json` to reset state
6. Signals workers/QA to set status `IDLE`
7. Returns to Phase 1 to select next deliverable

**Worker & QA Reset:**
- Clear task-specific context
- Release any held locks
- Set status to `IDLE` in agent-state.json
- Ready for next deliverable

---

## Skill Integration & Communication

### Skills Involved

```
Phase 1: Planning
  Manager Skill (.agents/skills/zazz-manager-agent/SKILL.md)
    ↓
Phase 2: Implementation
  Worker Skill (.agents/skills/zazz-worker-agent/SKILL.md)
  Manager Skill (monitors + responds)
    ↓
Phase 3: QA & Rework
  QA Skill (.agents/skills/zazz-qa-agent/SKILL.md)
  Manager Skill (escalations + rework planning)
  Worker Skill (executes rework)
    ↓
Phase 4: PR & Review
  QA Skill (creates PR)
  Manager Skill (monitors + resets)
    ↓
Loop back to Phase 1
```

### Communication Channels

**Primary: Zazz Board API**
- Task creation/status updates
- Task comments (worker questions, manager answers, QA findings)
- Deliverable status updates
- Commit messages

**Secondary: Local Files**
- `.zazz/agent-state.json` - Heartbeat, agent status
- `.zazz/agent-messages.json` - Message queue for rapid comms
- `.zazz/agent-locks.json` - File-level locks
- `.zazz/audit.log` - Event log

---

## Example Timeline

For a moderate deliverable with 8 tasks, 1 rework cycle:

```
00:00 - 00:05  Phase 1: Manager selects deliverable, creates 8 tasks
00:05 - 00:25  Phase 2: Workers execute 8 tasks in parallel
                (respecting dependencies, acquiring file locks)
00:25 - 00:35  Phase 3: QA verifies AC, runs tests
                QA finds 2 issues → creates 2 rework tasks
00:35 - 00:40  Phase 3 (Rework): Workers execute 2 rework tasks
00:40 - 00:42  Phase 3 (Verify): QA verifies fixes
00:42 - 00:43  Phase 4: QA creates PR with evidence
00:43         Ready for human review
Total: ~43 minutes
```

---

## Key Principles

1. **Sequential Phases** - Each phase depends on previous (Manager → Workers → QA → PR)
2. **Parallel Within Phase** - Workers can execute tasks in parallel (respecting locks)
3. **Explicit Dependencies** - No circular dependencies, all relations declared upfront
4. **Single Writer Per File** - File locks prevent concurrent edits
5. **Independent Contexts** - Each agent has separate context (not shared)
6. **Explicit Communication** - Questions/decisions logged via API or local files
7. **No Auto-Retry** - Ambiguous situations escalated to human, not auto-retried

---

## Error Scenarios

**Worker crashes mid-task:**
- Git changes lost (intentional - atomic commits)
- Task reverted to `TO_DO`
- Manager detects via heartbeat timeout
- Manager releases file locks
- Task reassigned to available worker

**Manager unresponsive (>60 sec no heartbeat):**
- Workers detect timeout
- Workers mark current tasks as `BLOCKED`
- Escalation logged to `.zazz/audit.log`
- Human intervention or failover Manager needed

**QA timeout:**
- Manager detects via heartbeat
- Spawns new QA agent
- QA re-runs tests from scratch (tests should be idempotent)

**Circular dependency detected:**
- Manager re-analyzes plan
- Indicates planning error (should not happen)
- Escalate to human for clarification

See `docs/error-handling.md` for complete scenarios and recovery procedures.

---

## Next Steps

1. **Read skill definitions** - Start with Manager skill (`.agents/skills/zazz-manager-agent/SKILL.md`)
2. **Review ARCHITECTURE.md** - Understand agent roles, communication, concurrency control
3. **Set up environment** - Configure variables per `README.md`
4. **Test with single deliverable** - Run complete workflow end-to-end
5. **Monitor with observability** - Check `docs/monitoring.md` for debugging

---

## Related Documents

- **README.md** - Skill collection overview
- **ARCHITECTURE.md** - Technical architecture, agent roles, communication
- **.agents/skills/** - Individual skill definitions
- **TEMPLATES/** - Reusable templates (task prompts, PR, state files)
- **docs/** - Detailed reference (error handling, monitoring, performance)
