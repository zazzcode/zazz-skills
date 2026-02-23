# Zazz Workflow Overview

This document explains the high-level workflow and how the agent skills work together to complete a deliverable.

The Zazz methodology prioritizes **clear specification** and **detailed planning** as the foundation for autonomous multi-agent development. A comprehensive Deliverable Specification (SPEC) defines what should be built with explicit acceptance criteria and test requirements. A detailed Implementation Plan (PLAN) decomposes the SPEC into executable tasks with test requirements (unit, API, E2E) integrated at every step.

**Testing is not an afterthought**—it is woven throughout the workflow from SPEC to task completion.

---

## Five Workflow Stages (0-4)

### Stage 0: SPEC Creation (Requestor + spec-builder-agent)

**Goal**: Create a clear, comprehensive Deliverable Specification that defines what should be delivered.

**spec-builder-agent Actions:**
1. Guides requestor through interactive questioning to clarify requirements
2. Captures functional requirements and edge cases
3. Defines acceptance criteria (AC) - clear, testable statements
4. Identifies test requirements:
   - Unit test scenarios
   - API integration test scenarios  
   - End-to-end test scenarios
   - Performance/load test thresholds (if applicable)
   - Security test requirements (if applicable)
5. References project Reference Architecture document (tech stack, DB, frameworks)
6. Documents constraints, dependencies, assumptions
7. Creates {deliverable-name}-SPEC.md stored in project repo/shared drive

**Outputs:**
- {deliverable-name}-SPEC.md - The source of truth
- Clear, testable acceptance criteria
- Explicit test requirements
- Ready for approval before Phase 1

**Key Principle**: SPEC is NOT edited during development. Changes tracked in Change Notes sections for audit trail.

---

### Stage 1: Planning (Coordinator Agent)

**Goal**: Decompose the approved SPEC into a detailed Implementation Plan with task definitions and test requirements.

**Coordinator Agent Actions:**
1. Receives approved {deliverable-name}-SPEC.md
2. Analyzes SPEC and extracts:
   - All acceptance criteria
   - All test requirements (unit, API, E2E)
   - Technical constraints and dependencies
   - Reference to Reference Architecture
3. Decomposes SPEC into phases and steps:
   - Group related work into logical phases
   - Identify task dependencies and parallelization opportunities
   - Plan test tasks (unit test creation, API test creation, E2E test creation)
4. Creates {deliverable-name}-PLAN.md with:
   - Phases and steps
   - Per-task acceptance criteria (derived from SPEC)
   - Per-task test requirements (what tests to create/run)
   - Task dependencies and file locks (which files each task modifies)
   - Estimated complexity and order of execution
5. Fetches OpenAPI spec from `{ZAZZ_API_BASE_URL}/docs/json` and caches to `.zazz/api-spec.json`
6. Initializes `.zazz/agent-state.json` with deliverable and PLAN context
7. Creates task graph via Zazz Board API with:
   - Task title, goal, instructions (derived from PLAN)
   - Self-contained prompts (Task Prompt Template)
   - Task relations: DEPENDS_ON, COORDINATES_WITH
   - Files to modify (for lock management)
   - Test criteria for each task
8. Signals workers and QA that PLAN is approved and tasks are ready

**Outputs:**
- {deliverable-name}-PLAN.md - Detailed implementation plan with phases and steps
- `.zazz/agent-state.json` with deliverable and PLAN context
- `.zazz/api-spec.json` (cached OpenAPI spec)
- Initial task graph via Zazz Board API (only tasks with no dependencies)
- Workers ready to poll for tasks
- QA ready for Phase 2

**Key Principle**: Only tasks with no dependencies are created initially. As workers complete tasks and learning occurs, Coordinator creates additional tasks based on PLAN phases, allowing the plan to be adapted and refined during development.

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
   - Acquires file locks via `.zazz/agent-locks.json`
   - Updates task status to `IN_PROGRESS`
   - Reads task prompt (Goal, Instructions, Test Requirements, AC, Reference Architecture)
3. Executes per task type:
   - **Code task**: Writes code, creates unit tests, runs tests until passing
   - **Test creation task**: Creates API/E2E test suites with test cases
   - **Test execution task**: Runs test suite, captures results, documents evidence
   - All tests must pass before task completion
   - May ask Coordinator questions if prompt unclear (posts to task comments)
4. Commits changes with format: `TASK-{id}: {description} [{agent_id}]`
5. Releases file locks
6. Updates task status to `COMPLETED`
7. Updates heartbeat in `.zazz/agent-state.json`
8. Repeats until no more `TO_DO` tasks

**Coordinator's Role During Phase 2:**
- Polls for `BLOCKED` tasks and worker questions
- Responds to worker questions via task comments
- Escalates ambiguous questions or scope changes to human-in-loop
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

**QA Agent Actions:**
1. Waits for Coordinator signal that all tasks `COMPLETED`
2. Reviews SPEC to understand all requirements and acceptance criteria
3. Verifies each Acceptance Criterion:
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
6. Interacts with requestor (human) to confirm deliverable meets expectations

**If Issues Found:**

**Rework Task Numbering**:
Rework tasks are numbered hierarchically:
- Original task: `2.3` (PLAN Phase 2, Step 3)
- First rework iteration: `2.3.1` (PLAN PLAN Phase 2, Step 3, Rework Iteration 1)
- Second rework iteration: `2.3.2` (PLAN PLAN Phase 2, Step 3, Rework Iteration 2)
- And so on...

This creates a clear audit trail showing which tasks required multiple rework cycles.

**Simple isolated issue** (affects 1-2 files, low risk, passes updated tests):
- QA creates rework task via API with clear description of issue and test case
- Task ID: `{original_task_id}.{rework_iteration}` (e.g., `2.3.1` if `2.3` needs rework)
- Sets task status to `TO_DO`
- Creates REWORK_FOR relation to original task
- Workers pick up and execute like Phase 2
- QA verifies fix passes tests

**Complex interdependent issues** (2+ fixes, architectural impact, test failures across modules):
- QA escalates to Coordinator with detailed summary:
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
- Monitors for rework tasks created by QA
- Analyzes complex escalations and test failures
- Creates rework sub-plans for interdependent fixes
- Updates PLAN with Change Notes documenting decisions and rationale
- Escalates unresolvable issues or scope changes to human-in-loop
- Ensures all rework is tracked for audit trail

**Rework Loop (if issues found):**
- QA creates/receives rework tasks with failing test evidence
- Workers execute fixes and ensure all tests pass
- QA verifies fixes against tests and AC
- Repeat until all AC met and all tests passing

**Outputs:**
- All AC from SPEC verified and met
- All tests passing (unit, API, E2E, performance, security)
- All test evidence captured and documented
- Code quality confirmed (performance, security, best practices)
- PLAN updated with any changes and documented in Change Notes
- Requestor (human) confirmed deliverable meets expectations
- Ready for PR

---

### Stage 4: PR & Review (QA Agent + Coordinator)

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

**Coordinator's Role During Phase 4:**
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

**Coordinator Reset:**
1. Archives logs to `.zazz/archive/{deliverable_id}/`
2. Clears task graph
3. Releases all file locks
4. Clears `.zazz/agent-messages.json`
5. Updates `.zazz/agent-state.json` to reset state
6. Signals workers/QA to set status `IDLE`
7. Returns to Phase 0 to support next SPEC or Phase 1 to create next PLAN

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
