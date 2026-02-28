# Zazz Workflow Overview

This document explains the high-level workflow and how the agent skills work together to complete a deliverable.

The Zazz framework prioritizes **clear specification** and **detailed planning** as the foundation for autonomous multi-agent development. A comprehensive Deliverable Specification (SPEC) defines what should be built with explicit acceptance criteria and test requirements. The Planner agent performs a one-shot decomposition of the SPEC into a detailed Implementation Plan (PLAN) with test requirements (unit, API, E2E) integrated at every step. The Coordinator takes over once execution starts.

**Test-driven development (TDD) is a core differentiator.** Unlike frameworks that treat testing as a separate phase, Zazz embeds TDD at every level. Every deliverable and task has well-defined test requirements and acceptance criteria before work begins. Workers create and run tests per task; QA verifies via test evidence; rework tasks include failing tests that demonstrate the issue.

This document describes two workflow levels:
- **Deliverable-level workflow (Deliverable Owner-led)**: The Deliverable Owner defines/approves SPEC and PLAN, performs final acceptance, and conducts PR review and merge.
- **Task-level workflow (agent-led)**: Execute tasks, coordinate dependencies, and surface questions/escalations.

MVP note: the Zazz Board API integration is still being finalized; agent skills currently define target behavior and will align fully once the Swagger/OpenAPI endpoint is finalized.
During MVP execution, Deliverable Owner-to-agent coordination is terminal-first; important interaction outcomes are later posted into task notes/comments on Zazz Board for auditability.

---

## Five Workflow Stages (0-4)

### Stage 0: SPEC Creation (Deliverable Owner + spec-builder-agent)

**Goal**: Create a clear, comprehensive Deliverable Specification that defines what should be delivered.

**spec-builder-agent Actions:**
1. Guides Deliverable Owner through interactive questioning to clarify requirements
2. Captures functional requirements and edge cases
3. Defines acceptance criteria (AC) - clear, testable statements
4. Identifies test requirements:
   - Unit test scenarios
   - API integration test scenarios  
   - End-to-end test scenarios
   - Performance/load test thresholds (if applicable)
   - Security test requirements (if applicable)
5. References project standards (.zazz/standards/) and project.md (tech stack, DB, frameworks)
6. Documents constraints, dependencies, assumptions
7. Creates .zazz/deliverables/{deliverable-name}-SPEC.md

**Outputs:**
- .zazz/deliverables/{deliverable-name}-SPEC.md - The source of truth
- Clear, testable acceptance criteria
- Explicit test requirements
- Ready for approval before Phase 1

**Key Principle**: SPEC is NOT edited during development. Changes tracked in Change Notes sections for audit trail.

---

### Stage 1: Planning (Planner Agent + Coordinator Agent)

**Goal**: Decompose the approved SPEC into a detailed Implementation Plan; once approved, Coordinator creates tasks and begins execution.

**Planner Agent Actions** (one-shot, does not participate in execution):
1. Receives approved .zazz/deliverables/{deliverable-name}-SPEC.md
2. Decomposes SPEC into manageable chunks, phased and sequenced
3. Assigns files to tasks using file names and conventions
4. Identifies parallel sequences where tasks can run without impacting the same files
5. Creates .zazz/deliverables/{deliverable-name}-PLAN.md with phases, steps, per-task AC, test requirements, file assignments, and dependencies (DEPENDS_ON, COORDINATES_WITH)
6. **Output**: .zazz/deliverables/{deliverable-name}-PLAN.md. Owner reviews and approves; deliverable moves to Ready.

**Coordinator Agent Actions** (takes over once plan approved):
1. Subscribes to plan approval events; when deliverable moves to Ready, picks it up
2. Creates initial tasks via Zazz Board API per the PLAN (only tasks with no dependencies)
3. Hands out tasks to workers; adds follow-on tasks as prerequisites complete
4. Monitors progress; adjusts PLAN when change mechanism invoked; documents in Change Notes

**Outputs:**
- .zazz/deliverables/{deliverable-name}-PLAN.md (from Planner)
- Initial task graph via Zazz Board API (Coordinator creates tasks from PLAN)
- Workers ready to poll for tasks; QA ready for Phase 2

**Key Principle**: Planner does one-shot decomposition; Coordinator executes the PLAN. Only tasks with no dependencies are created initially. As workers complete tasks, Coordinator creates additional tasks based on PLAN phases.

---

### Stage 2: Implementation (Worker Agents)

**Goal**: Execute tasks from PLAN and produce working code with all tests passing.

**Task Types in PLAN:**
- **Feature/Code Tasks**: Write code for features
- **Test Creation Tasks**: Create unit test suites, API tests, or E2E tests
- **Test Execution Tasks**: Run tests and document results

Tasks are ordered by dependencies so that:
- Feature code is written and tested with unit tests
- Test creation tasks create API or E2E test suites
- Subsequent tasks run the test suites against features

**Worker Agent Actions:**
1. Polls for tasks with status `TO_DO` and satisfied dependencies
2. When task found:
   - Acquires file locks for the task via `.zazz/agent-locks.json`
   - Updates task status to `IN_PROGRESS`
   - Reads task prompt (Goal, Instructions, Test Requirements, AC, project standards)
3. Executes per task type:
   - **Code task**: Writes code, creates unit tests, runs tests until passing
   - **Test creation task**: Creates API/E2E test suites with test cases
   - **Test execution task**: Runs test suite, captures results, documents evidence
   - All tests must pass before signaling ready for QA
   - May ask Coordinator questions if prompt unclear (posts to task comments)
4. **Commits** changes with format: `TASK-{id}: {description} [{agent_id}]` (commit stamp in work tree)
5. Transfers locks to task (files stay locked until QA signs off); worker is released
6. Updates task status to `QA` (ready for QA)
7. Repeats until no more `TO_DO` tasks

**Coordinator's Role During Phase 2:**
- Polls for `BLOCKED` tasks and worker questions
- Responds to worker questions via task comments
- Escalates ambiguous questions or scope changes to Deliverable Owner
- Monitors for worker timeouts and missing heartbeats
- As tasks complete, creates next set of tasks with no dependencies from PLAN
- Tracks progress and refines PLAN as learning occurs (documents changes in Change Notes)

**Outputs:**
- All initial and subsequent tasks with status `COMPLETED`
- Code committed to worktree/branch with all tests passing
- All file locks released
- Complete audit trail in task comments
- Updated PLAN with any refinements made during execution

---

### Stage 3: QA & Verification (QA Agent + Coordinator)
**Goal**: Verify all Acceptance Criteria are met, all tests pass, and deliverable is complete.

**QA Agent Design**: The QA agent is specifically designed to **find issues** and **validate acceptance criteria**. **Fresh context per evaluation**—each task evaluation and the final deliverable review start with cleared context. Evaluates results against AC and tests (worker has already committed). When all pass: marks task complete and **releases all file locks** for that task. When AC or TDD criteria are not met, QA creates rework content and messages the Coordinator; locks stay (rework inherits them).

**QA Agent Actions:**
1. Waits for Coordinator signal that all tasks `COMPLETED`
2. Reviews SPEC to understand all requirements and acceptance criteria
3. Actively verifies each Acceptance Criterion (seeks to find issues, not rubber-stamp):
   - Tests the feature/code against the AC statement from SPEC
   - Documents evidence (test results, screenshots, logs)
   - Confirms implementation matches requirements
4. Runs all tests defined in SPEC and PLAN:
   - Unit test suite: confirms all pass, captures results
   - API integration tests: confirms all pass, captures results
   - E2E tests: confirms all pass, captures results
   - Performance tests: measures against spec thresholds, documents results
   - Security tests: identifies vulnerabilities, documents findings
5. Analyzes Code Quality:
   - Performance: response times, memory, queries vs thresholds
   - Security: vulnerabilities, authentication, authorization gaps
   - Best Practices: error handling, logging, code patterns
6. Interacts with Deliverable Owner to confirm deliverable meets expectations

**If Issues Found:**

**Rework Task Numbering**:
Rework tasks are numbered hierarchically:
- Original task: `2.3` (PLAN Phase 2, Step 3)
- First rework iteration: `2.3.1` (PLAN Phase 2, Step 3, Rework Iteration 1)
- Second rework iteration: `2.3.2` (PLAN Phase 2, Step 3, Rework Iteration 2)
- And so on...

This creates a clear audit trail showing which tasks required multiple rework cycles.

**Simple isolated issue** (affects 1-2 files, low risk, passes updated tests):
- QA creates rework task content (full context: failing test, AC violated, reproduction steps, relevant files, expected vs actual)
- QA messages Coordinator; Coordinator creates rework task (ID: `{original_task_id}.{rework_iteration}`, e.g., `2.3.1`)
- Any available worker picks up and executes (workers are released when ready for QA; original worker has moved on)
- QA verifies fix passes tests and satisfies AC

**Complex interdependent issues** (2+ fixes, architectural impact, test failures across modules):
- QA messages Coordinator with detailed summary:
  - What AC is not met
  - Which tests are failing and why
  - Impact on other components
- Coordinator analyzes interdependencies and test failures
- Coordinator creates rework sub-plan with:
  - Individual rework tasks addressing root causes
  - Dependencies between fixes
  - Updated test requirements for each fix
  - Verification order
- Workers execute rework tasks
- QA verifies each fix passes updated tests and retests AC

**Coordinator's Role During Phase 3:**
- Creates rework tasks when QA provides the task content (QA authors the rework card; Coordinator creates the task in plan and graph)
- Analyzes complex escalations and test failures
- Creates rework sub-plans for interdependent fixes
- Updates PLAN with Change Notes documenting decisions and rationale
- Escalates unresolvable issues or scope changes to Deliverable Owner
- Ensures all rework is tracked for audit trail

**Rework Loop (if issues found):**
- QA creates rework task content (full context for a fresh worker); Coordinator creates the task. Any available worker picks up rework.
- Workers execute fixes and ensure all tests pass
- QA verifies fixes against tests and AC
- Repeat until all AC met and all tests passing

**Outputs:**
- All AC from SPEC verified and met
- All tests passing (unit, API, E2E, performance, security)
- All test evidence captured and documented
- Code quality confirmed (performance, security, best practices)
- PLAN updated with any changes and documented in Change Notes
- Deliverable Owner confirmed deliverable meets expectations
- Ready for PR

---

### Stage 4: PR & Review (QA Agent + Coordinator)

**Goal**: Create PR with full verification evidence and update status.

**QA Agent Actions:**
1. Ensures all files committed:
   ```
   git status → "working tree clean"
   ```

2. Creates PR using `PR-TEMPLATE.md` with:
   - Deliverable ID and project code
   - **Acceptance Criteria Status** - Each AC with verification evidence
   - **Testing Summary** - Test results (unit, integration, E2E, performance)
   - **Code Analysis** - Performance, security, best practices findings
   - **Rework History** - All cycles with root causes and resolutions
   - **Files Changed** - New, modified, deleted files
   - **Dependencies** - Any new or updated packages
   - **QA Sign-off** - Approval for Deliverable Owner review

3. Updates deliverable status to `IN_REVIEW` via API

4. Logs PR creation to `.zazz/audit.log`

**Coordinator's Role During Phase 4:**
- Monitors PR creation
- Logs completion event
- Prepares to reset state
- Notifies (if needed) that PR ready for Deliverable Owner review

**Deliverable Owner Actions (Final Acceptance & PR Review):**
- Performs final acceptance that deliverable meets expectations
- Reviews PR on GitHub/GitLab
- Checks code quality, architecture, documentation
- Approves or requests changes
- Merges when satisfied

**Outputs:**
- PR created with full verification evidence
- Deliverable status: `IN_REVIEW`
- Audit trail complete
- Ready for Deliverable Owner review and merge

**Duration:** Immediate (PR creation < 1 minute)

---

## Multi-Deliverable Loop

After Phase 4 completes:

**Coordinator Reset:**
1. Archives logs to `.zazz/archive/{deliverable_id}/`
2. Clears task graph
3. Releases all file locks
4. Resets agent state via Zazz Board API (pub/sub)
5. Signals workers/QA to set status `IDLE`
6. Returns to Phase 0 to support next SPEC or Phase 1 to create next PLAN

**Worker & QA Reset:**
- Clear task-specific context
- Release any held locks
- Set status to `IDLE` via Zazz Board API (pub/sub)
- Ready for next deliverable

---

## Skill Integration & Communication

### Skills Involved

```
Phase 1: Planning
  Coordinator Skill (.agents/skills/coordinator-agent/SKILL.md)
    ↓
Phase 2: Implementation
  Worker Skill (.agents/skills/worker-agent/SKILL.md)
  Coordinator Skill (monitors + responds)
    ↓
Phase 3: QA & Rework
  QA Skill (.agents/skills/qa-agent/SKILL.md)
  Coordinator Skill (escalations + rework planning)
  Worker Skill (executes rework)
    ↓
Phase 4: PR & Review
  QA Skill (creates PR)
  Coordinator Skill (monitors + resets)
    ↓
Loop back to Phase 1
```

### Communication Channels
**Primary (MVP): Terminal interaction**
- Deliverable Owner-to-agent clarifications and approvals happen in terminal sessions
- Agents follow terminal instructions and summarize decisions clearly

**Slack (when supported):** Only the Coordinator has a Slack account. Worker and QA communicate with the Deliverable Owner through the Coordinator.

**Board sync (MVP): Zazz Board task notes/comments**
- Post key clarifications, decisions, blockers, and outcomes to task notes/comments
- Treat board notes as the durable audit trail for what happened during terminal interaction

**Target state: Zazz Board API-first orchestration**
- Task creation/status updates
- Task comments (worker questions, coordinator answers, QA findings)
- Deliverable status updates
- Commit messages

**Agent state & messaging:** Zazz Board API pub/sub (heartbeat, agent status, agent-to-agent communication)

**Local files:**
- `.zazz/agent-locks.json` - Task-level file locks (held until QA signs off)
- `.zazz/audit.log` - Event log

---

## Example Timeline

For a moderate deliverable with 8 tasks, 1 rework cycle:

```
00:00 - 00:05  Phase 1: Coordinator selects deliverable, creates 8 tasks
00:05 - 00:25  Phase 2: Workers execute 8 tasks in parallel
                (respecting dependencies, acquiring file locks)
00:25 - 00:35  Phase 3: QA verifies AC, runs tests
                QA finds 2 issues → messages Coordinator to create 2 rework tasks
00:35 - 00:40  Phase 3 (Rework): Workers execute 2 rework tasks
00:40 - 00:42  Phase 3 (Verify): QA verifies fixes
00:42 - 00:43  Phase 4: QA creates PR with evidence
00:43         Ready for Deliverable Owner review
Total: ~43 minutes
```

---

## Key Principles

1. **Sequential Phases** - Each phase depends on previous (Planner → Coordinator → Workers → QA → PR)
2. **Parallel Within Phase** - Workers can execute tasks in parallel (respecting locks)
3. **Explicit Dependencies** - No circular dependencies, all relations declared upfront
4. **Single Writer Per File** - File locks prevent concurrent edits
5. **Independent Contexts** - Each agent has separate context (not shared)
6. **Explicit Communication** - Questions/decisions logged via API or local files
7. **No Auto-Retry** - Ambiguous situations escalated to Deliverable Owner, not auto-retried

---

## Error Scenarios

**Worker crashes mid-task:**
- Git changes lost (intentional - atomic commits)
- Task reverted to `TO_DO`
- Coordinator detects via heartbeat timeout
- Coordinator releases file locks
- Task reassigned to available worker

**Coordinator unresponsive (>60 sec no heartbeat):**
- Workers detect timeout
- Workers mark current tasks as `BLOCKED`
- Escalation logged to `.zazz/audit.log`
- Deliverable Owner intervention or failover Coordinator needed

**QA timeout:**
- Coordinator detects via heartbeat
- Spawns new QA agent
- QA re-runs tests from scratch (tests should be idempotent)

**Circular dependency detected:**
- Coordinator re-analyzes plan
- Indicates planning error (should not happen)
- Escalate to Deliverable Owner for clarification

See `AGENT-ARCHITECTURE.md` section 10 for current MVP scenarios and recovery procedures.

---

## Next Steps

1. **Read skill definitions** - Start with Planner skill (`.agents/skills/planner-agent/SKILL.md`) and Coordinator skill (`.agents/skills/coordinator-agent/SKILL.md`)
2. **Review AGENT-ARCHITECTURE.md** - Understand agent roles, communication, concurrency control
3. **Set up environment** - Configure variables per `README.md`
4. **Test with single deliverable** - Run complete workflow end-to-end
5. **Monitor with observability** - Check `AGENT-ARCHITECTURE.md` section 9 for current MVP guidance

---

## Related Documents

- **README.md** - Skill collection overview
- **AGENT-ARCHITECTURE.md** - Technical architecture, agent roles, communication
- **.agents/skills/** - Individual skill definitions
- **TEMPLATES/** - Reusable templates (task prompts, PR, state files)
- **docs/** - Planned detailed reference (error handling, monitoring, performance)
