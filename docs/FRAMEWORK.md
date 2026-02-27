# The Zazz Framework

An opinionated, spec-driven framework for organizing software development with AI agents. It provides terminology, workflow, tools, and document management for coordinating deliverables from specification through implementation and review.

---

## What Is Zazz?

**Zazz** is both a framework for multi-agent software development and a task/deliverable management application (Zazz Board). The framework provides shared **terminology**, **workflow**, **tools**, and **document management** that enable AI agents to work autonomously and collaboratively on software deliverables.

A project or software product is an **succession of deliverables**. Greenfield projects typically start with a handful of deliverables in order to generate an MVP; as the product grows in size and complexity, subsequent deliverables become new features, enhancements to existing features, or refactors. This progression shapes the mix of deliverable types over the product lifecycle.

The core underpinning is a **kanban-like process** driven from specification documents and implementation plans, with **test-driven development (TDD)** embedded throughout. Work flows through defined stages—from specification through planning, implementation, verification, and review—with clear handoffs, explicit acceptance criteria, and test requirements at each step.

---

## Core Philosophy

### Spec-Driven Development

The Zazz framework prioritizes **clear specification** and **detailed planning** as the foundation for autonomous development. Requirements are captured before implementation begins; acceptance criteria are explicit and testable. This creates a source of truth that agents and humans can reference throughout the lifecycle. The overarching expectation is that the SPEC and PLAN, once approved, should not require changes during development. The framework nevertheless provides a **change mechanism** for flexibility when needed—discovery, Owner feedback, or iterative refinement (e.g., UI) may warrant updates. When changes occur: the Coordinator keeps the PLAN aligned with reality and documents updates in Change Notes; SPEC changes require Owner sign-off and must be recorded in the SPEC's Change Notes section. The Coordinator supports maintaining this audit trail. When deviations accumulate beyond a reasonable threshold, the Deliverable Owner may choose to abandon the current worktree and create a new deliverable with a refined spec, treating the first iteration as a prototype or learning experience rather than continuing to iterate in place.

**Testing is not an afterthought.** Test requirements (unit, API, E2E, performance, security) are woven throughout the workflow from specification to task completion.

### Test-Driven Development (TDD)

**TDD is a core differentiator of Zazz.** Unlike many spec-driven frameworks that treat testing as a separate phase or optional add-on, Zazz embeds test-driven development at every level. Every deliverable and every task must have well-defined test requirements and acceptance criteria before work begins.

**Why TDD matters for agent-driven development:**

- **Verifiable completion** — Agents and humans agree on "done" via tests. No ambiguity about whether a task or deliverable is complete.
- **Regression safety** — Tests run continuously; failures surface immediately. Rework and new work don't silently break existing behavior.
- **Spec alignment** — Acceptance criteria are testable by definition. If it can't be tested, it isn't well-specified.
- **Evidence for review** — QA and Deliverable Owner see test results, not just code. PRs include test evidence as proof of AC satisfaction.

**TDD flows through the lifecycle:**


| Stage              | TDD Requirement                                                                                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **SPEC**           | Each acceptance criterion is testable. Test requirements (unit, API, E2E, performance, security) are identified.                                                                     |
| **PLAN**           | Each task has explicit test requirements: what tests to create, what tests to run. Test creation tasks may precede or accompany feature tasks.                                       |
| **Task execution** | Workers create and run tests per task. No task is complete until its specified tests pass.                                                                                           |
| **QA**             | Verification is test-driven. QA runs all specified tests, documents evidence. Fresh context per evaluation. Creates rework task content and messages Coordinator when AC is not met. |
| **Rework**         | Rework tasks include the failing test that demonstrates the issue. Fix is verified when that test passes.                                                                            |


**Test types:** Unit (function/method), API (integration), E2E (user flows), performance (thresholds), security (scanning). The SPEC and PLAN specify which apply; STANDARDS.md defines tooling and patterns.

**Where TDD lives: SPEC vs PLAN**


| Document | TDD content                                                                                                                         | Purpose                                                                                                                                                                                                                 |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SPEC** | Acceptance criteria (testable statements of "done"); test requirements at deliverable level (unit, API, E2E, performance, security) | Defines *what* must be true for the deliverable to be complete. Every requirement should have at least one AC; every AC should be testable. Test requirements answer: "What tests will prove this deliverable is done?" |
| **PLAN** | Per-task AC (derived from SPEC); per-task test requirements (what tests to create, what tests to run)                               | Cascades SPEC down to executable tasks. Each task gets concrete test requirements—the Planner maps SPEC AC and test requirements to specific tasks.                                                                     |


**Cascade:** SPEC defines deliverable-level AC and test requirements → Planner decomposes into PLAN with per-task AC and test requirements → Coordinator creates tasks and hands them out → Workers create/run tests per task → QA verifies via test evidence. The SPEC is the source; the PLAN operationalizes it.

**TDD in both is required.** The framework expects TDD in both the SPEC and the PLAN. The SPEC establishes the testability contract (no requirement without AC, no AC without a way to test it). The PLAN makes it executable (each task knows exactly what tests to create and run). Without SPEC-level TDD, the PLAN has nothing to cascade. Without PLAN-level TDD, workers don't know what to build.

**Owner sign-off for UI and subjective AC:** Some acceptance criteria, especially for user interface components (layout, visual design, interaction feel, accessibility), cannot be fully verified by automated tests. These AC require **Deliverable Owner interaction and sign-off**. Mark such AC in the SPEC (e.g., "Owner sign-off required") so the PLAN and task cards reflect that verification is human-led. QA coordinates with the Owner to obtain sign-off before marking the task or deliverable complete. When Owner feedback during UI iteration warrants changes to scope or tasks, the Coordinator adjusts the PLAN and documents the change in Change Notes.

### Opinionated by Design

Zazz makes deliberate choices about how work is structured:

- **Document ownership**—Each document has a designated owner. When the change mechanism is invoked, revisions are tracked; the Coordinator supports the audit trail.
  - **STANDARDS.md** — Project Owner
  - **Deliverable Specification** — Deliverable Owner (with spec-builder-agent assistance); revisions require Owner sign-off and must be noted in the document's Change Notes section
  - **Implementation Plan** — Planner creates the initial draft; Coordinator updates during execution; changes tracked in Change Notes
- **Single writer per file**—enforced via task-level file locks to prevent concurrent edits
- **Explicit dependencies**—tasks declare DEPENDS_ON and COORDINATES_WITH; no circular dependencies
- **Independent agent contexts**—each agent has its own system prompt and memory; no shared context window
- **Worker context is per-task**—a worker agent's context is scoped to a single task. For each new task, the worker's context is cleared. Tasks can be sized as large or small as is reasonable for the LLM in use
- **QA context is fresh per evaluation**—each time the QA agent evaluates a task (or the final deliverable), it starts with fresh context. Inputs are SPEC, PLAN, task card, and code. No accumulation across evaluations; standard context window is sufficient.
- **Escalate ambiguity**—agents never auto-retry unclear decisions; they ask or escalate to the Deliverable Owner
- **No Blocked column**—Blocked is a *state*, not a column. A deliverable or task can be in a blocked state while remaining in its current column (e.g., In Progress). Never create a Blocked column on the board.

These constraints reduce coordination overhead and make agent behavior predictable.

### Human vs Agent Separation

Zazz clearly separates human and agent responsibilities. The **Deliverable Owner** is the human actor (product owner, stakeholder, or user) who focuses on **deliverables**. A project is a succession of deliverables—greenfield work typically begins with a handful of deliverables in order to generate an MVP; as the product matures, deliverables shift toward new features, enhancements, and refactors. All work is grouped under deliverables. The **Deliverable Board** displays deliverables as the primary unit of work for humans.

The Deliverable Owner owns the *what*: they define requirements, approve the SPEC and PLAN, perform final acceptance that the deliverable meets expectations, and conduct PR review and merge. For AC that require human judgment (e.g., UI components, visual design, interaction feel), the Owner provides **in-loop sign-off**—QA coordinates with the Owner to verify these AC before marking tasks or the deliverable complete. The *how* is defined in the STANDARDS.md, SPEC, and PLAN; agents execute it—planning (Planner), implementing (Workers), verifying (QA), and coordinating (Coordinator). This separation ensures humans make product and scope decisions while agents execute within approved boundaries.

**Two separate kanban boards:** The Deliverable Board is for the Deliverable Owner and human users; the Task Board is for agents. Do not confuse the two—each has its own workflow, columns, and audience.

---

## Core Terminology


| Term                                 | Definition                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **STANDARDS.md**                     | Project-level document defining the technical and functional context for all deliverables. Covers tech stack, language(s), database type, overall architecture, cloud provider, deployment model, testing tooling, and other project-wide specifications. Defined at the project level; only the Project Owner may revise it. Read-only reference for agents; SPEC and PLAN reference it. |
| **Deliverable Specification (SPEC)** | Source-of-truth document defining requirements, acceptance criteria, and test requirements. Created as `{deliverable-name}-SPEC.md`. Intended to be stable at approval; when revisions are warranted, they require Owner sign-off and must be recorded in the document's Change Notes section.                                                                                            |
| **Implementation Plan (PLAN)**       | Execution decomposition derived from the SPEC. Phases, steps, tasks, dependencies, file assignments, and test requirements. Created as `{deliverable-name}-PLAN.md` by the Planner. Intended to be complete at approval; when updates are warranted during development, the Coordinator keeps the PLAN aligned with reality and documents changes in Change Notes.                        |
| **Project Owner**                    | The human actor who owns the project and its technical standards. Only the Project Owner may revise STANDARDS.md. May be the same person as the Deliverable Owner in smaller projects.                                                                                                                                                                                                    |
| **Deliverable Owner**                | The human actor (product owner, stakeholder, or user) who owns deliverables. Defines requirements, approves SPEC and PLAN, performs final acceptance, and conducts PR review and merge. All work flows through the Deliverable Owner's lens.                                                                                                                                              |
| **Project**                          | Top-level container for a software product. A project is a succession of deliverables. Holds `deliverable_status_workflow` (Deliverable Board columns) and `status_workflow` (Task Board columns).                                                                                                                                                                                        |
| **Deliverable**                      | A unit of work on the Deliverable Board: a feature, bug fix, enhancement, refactor, chore, or documentation. ID format: `{PROJECT_CODE}-{int}`. Each has an approved SPEC and PLAN. Greenfield projects typically start with a handful of deliverables in order to generate an MVP; as the product grows, deliverables become new features, enhancements, or refactors.                   |
| **Task**                             | A piece of work performed by an agent. Belongs to exactly one deliverable. Each task has two representations: a **task node** (on the Task Graph) and a **task card** (on the Task Board). They are the same task—one node corresponds to one card.                                                                                                                                       |
| **Task Node**                        | A node on the Task Graph representing a task. Each task node corresponds to exactly one task card on the Task Board.                                                                                                                                                                                                                                                                      |
| **Task Card**                        | A card on the Task Board representing a task. Contains the prompt (description, objectives, acceptance criteria, guidance) and references to STANDARDS.md, SPEC, and PLAN. Each task card corresponds to exactly one task node on the Task Graph.                                                                                                                                         |
| **Task Graph**                       | A visualization of tasks being worked on by agents. Nodes represent tasks; edges represent dependencies. The Coordinator creates tasks via the Zazz Board API per the PLAN (created by the Planner) and hands them out to workers. The graph can branch, merge, and include coordination-style dependencies (e.g., two tasks must complete before a dependent can start).                 |


### Document Ownership and References

- **STANDARDS.md**: Project-level document; only the Project Owner may revise it. Read-only reference for agents. Defines project-wide technical and functional context (see [Project Standards](#project-standards-standardsmd) below).
- **SPEC**: Only the Deliverable Owner may revise the SPEC, potentially with spec-builder-agent assistance. When revisions are warranted during development, they require Owner sign-off and must be noted in the SPEC's Change Notes section. The Coordinator supports maintaining this audit trail.
- **PLAN**: The Planner creates the initial PLAN; only the Coordinator may update or revise the PLAN during execution. The PLAN is intended to be complete at approval; when updates are warranted during development, the Coordinator keeps it aligned with reality, verifies changes with the Deliverable Owner, and documents them in Change Notes. Tasks are checked off as they are completed.
- **Task prompt**: References the STANDARDS.md, SPEC, and PLAN. For the MVP, all documents reside in the repo and are accessible to all agents.

### Project Standards (STANDARDS.md)

STANDARDS.md is a project-level document that establishes the technical and functional context within which all deliverables are built. Only the Project Owner may revise it. It defines:

- **Tech stack** — Frameworks, libraries, and runtime versions
- **Language(s)** — Primary and secondary languages for the project
- **Database** — Database type, ORM or query patterns, schema conventions
- **Architecture** — Overall system architecture, layering, module boundaries, design patterns
- **Cloud and deployment** — Target cloud provider, deployment model, CI/CD expectations, environment strategy
- **Testing** — Testing frameworks, patterns, and tooling (unit, API, E2E, performance, security)
- **Other project-wide specifications** — Coding conventions, security requirements, observability (logging, metrics, tracing), API design standards

Agents consult STANDARDS.md to ensure deliverables align with project constraints. The SPEC and PLAN reference STANDARDS.md for tooling and patterns; task cards inherit this context.

### Task Prompt Template

Each task card must include:

- **Description** — What the task accomplishes
- **Objectives** — Clear goals for the worker
- **Guidance** — Any additional instructions beyond what exists in STANDARDS.md and the PLAN
- **Test plan** — Test requirements with references to STANDARDS.md (what tests to create, what tests to run) 
- **Acceptance criteria** — Testable conditions for completion. Some AC (e.g., UI layout, visual design) may require Deliverable Owner sign-off; mark these explicitly so QA coordinates with the Owner.

---

## Two Workflow Levels

The framework operates at two distinct levels:


| Level                 | Led By            | Focus                                                                      |
| --------------------- | ----------------- | -------------------------------------------------------------------------- |
| **Deliverable-level** | Deliverable Owner | Define/approve SPEC and PLAN; final acceptance; PR review and merge.       |
| **Task-level**        | Agents            | Execute tasks, coordinate dependencies, surface questions and escalations. |


The Deliverable Owner owns the *what* and *when*; agents execute the *how* (defined in the STANDARDS.md, SPEC, and PLAN) within approved boundaries.

---

## Two Kanban Boards

Zazz uses **two separate kanban boards**. Do not confuse them:


| Board                 | Audience                          | Content                                                | Data Model                               |
| --------------------- | --------------------------------- | ------------------------------------------------------ | ---------------------------------------- |
| **Deliverable Board** | Deliverable Owner and human users | Deliverables (features, bug fixes, enhancements, etc.) | `deliverable_status_workflow` on project |
| **Task Board**        | Agents                            | Tasks associated with deliverables                     | `status_workflow` on project             |


**Hierarchy:** `Project → Deliverable → Task`. A project is a succession of deliverables; every task belongs to exactly one deliverable. The two boards have **different flows** driven by different concerns: the Deliverable Board tracks human-led lifecycle (planning through merge); the Task Board tracks agent-led execution driven by the PLAN. Each board has its own configurable workflow (columns) stored at the project level.

The Zazz Board also provides a **Task Graph**—a third visualization of the same tasks. Each **task node** on the graph corresponds to a **task card** on the Task Board. They are two views of the same underlying task.

### Shared Worktree

Each deliverable has **one git worktree and branch**. All agents work against the same worktree for that deliverable—Workers, QA, and Coordinator all operate in the same branch. This shared worktree is a requirement and benefit: it keeps the deliverable's changes in one place and simplifies merging. The Planner's decomposition includes file assignments and parallel sequences to **minimize file conflicts** when tasks are executed and combined.

**Pivot option:** When deviations to the spec accumulate significantly, the Deliverable Owner may choose to abandon or archive the current worktree (rather than delete it) and create a new deliverable with a refined spec and a fresh worktree. The first iteration is then treated as a prototype or learning experience. This approach leverages git's isolation to avoid compounding drift and provides a clean slate for a better-informed specification.

**Order of operations (task and locks):**

1. Worker acquires file locks, implements, runs tests, **commits** to the work tree (commit stamp), then signals "ready for QA." Files remain locked; worker is released.
2. QA evaluates results against acceptance criteria and tests.
3. If pass: QA marks task complete and **releases all locks** for that task.
4. If fail: QA creates rework content and messages Coordinator; locks stay (rework inherits them).

---

## Deliverable Board Workflow

The **Deliverable Board** workflow is **intentionally flexible**. Each project configures its own columns by selecting and ordering statuses from instance-level definitions. The framework provides default statuses for teams that want a simple starting point.

### Default Deliverable Statuses (Deliverable Board)


| Status          | Description                                                                                                                                                |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Planning**    | Deliverable is in the planning phase; SPEC and PLAN are being created or refined. When the plan is approved, the deliverable automatically moves to Ready. |
| **Ready**       | Plan has been approved. The Coordinator picks up deliverables from Ready, creates tasks from the PLAN via API, and hands them out to workers.              |
| **In Progress** | Deliverable is being worked by agents based on the plan. A change mechanism exists for updates to the PLAN or SPEC when warranted.                         |
| **In Review**   | Deliverable Owner performs final sign-off; PR created, awaiting review and merge.                                                                          |
| **Stage**       | Deliverable is merged to the stage branch.                                                                                                                 |
| **Done**        | Deliverable is merged to the main branch.                                                                                                                  |


**Deliverable types:** FEATURE, BUG_FIX, REFACTOR, ENHANCEMENT, CHORE, DOCUMENTATION. Each deliverable has a human-readable ID: `{PROJECT_CODE}-{int}` (e.g., `ZAZZ-1`). The mix evolves over the product lifecycle: greenfield work begins with a handful of deliverables to build an MVP; mature products see more enhancements and refactors.

**Blocked is a state, not a column.** A deliverable or task can be marked blocked (e.g., via an `is_blocked` flag) while remaining in its current column. The item stays in place—it does not move to a Blocked column. **Never create a Blocked column** on either board.

**Workflow flexibility:** Projects can define custom workflows. For example, a release-pipeline workflow might use: Planning → In Progress → In Review → UAT → Staged → Prod (where Prod is the terminal state).

### Branching Model

As part of the opinionated framework, the expectation is **two main Git branches** in the development process: **stage** and **main**. Deliverables flow from implementation through stage (integration/staging) and finally to main. The framework is flexible—organizations may introduce additional branches (e.g., UAT, release branches) as part of their overall development process.

---

## Task Board Workflow

The **Task Board** is driven by the PLAN. Its status columns differ from the Deliverable Board because they reflect agent execution flow, not human lifecycle.

### Task Board Status Columns


| Status          | Description                                                                                                                   |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **TO_DO**       | (Optional) Task defined but not yet ready for pickup. Used when the plan structure requires an explicit backlog before READY. |
| **READY**       | Dependencies met; task is available for a worker agent to pick up.                                                            |
| **IN_PROGRESS** | Worker agent is actively performing the task.                                                                                 |
| **QA**          | Work submitted; QA agent is validating against acceptance criteria.                                                           |
| **COMPLETED**   | Task finished and verified.                                                                                                   |


The `TO_DO` column is optional—it depends on how the plan is structured. Some projects use `READY` as the first column; others use `TO_DO` → `READY` when tasks are promoted automatically once dependencies are satisfied.

---

## Task Graph

The **Task Graph** is a visualization of the workflow of tasks as they are started, worked on, QA'd, and completed. Each **task node** on the graph corresponds to exactly one **task card** on the Task Board—they represent the same task in different views.

### Task Node and Task Card Styling

Status is indicated by outline color on both the **task node** (Task Graph) and **task card** (Task Board):

- **Green outline** — Task in progress
- **Yellow outline** — Task blocked (e.g., file locked by another task in QA or rework)
- **Grey or shaded** — Task completed

### Coordinator Creates and Hands Out Tasks

Once the plan is approved and execution starts, the Coordinator creates tasks via the Zazz Board API per the PLAN (produced by the Planner). Tasks appear on the Task Graph and Task Board. The typical starting status for a new task is `READY` (or `TO_DO` if the project uses that column). The Coordinator hands out individual tasks to workers and adds follow-on tasks progressively as prerequisites complete. When the change mechanism is invoked (Owner feedback, discovery), the Coordinator adjusts tasks and documents updates in Change Notes.

### Graph Structure

The Task Graph is not necessarily sequential. It can:

- **Branch** — Multiple tasks may proceed in parallel from a single completed task
- **Merge** — Coordination-style dependencies where two or more tasks must complete before a dependent task can start (e.g., task C depends on both task A and task B)
- **Support multiple branches** — The graph can have several parallel branches, each associated with the plan for the deliverable. There is not necessarily a single linear path through the graph

The graph structure reflects the PLAN: phases, steps, dependencies (DEPENDS_ON, COORDINATES_WITH), and rework tasks (e.g., task-1.2.1) appear as separate nodes.

---

## The Kanban-Like Process (Agent Workflow)

Work flows through five stages (0–4). Each stage has clear inputs, outputs, and handoffs. On the **Task Board**, tasks move through the status columns above. Task identification uses the format `task-{phase}.{step}` (e.g., `task-1.1`, `task-1.2`), where the first number is the plan phase or major component and the decimal is the step. Rework adds a third segment: `task-1.2.1` is the first rework of task 1.2. A task can be in a blocked *state* (e.g., `is_blocked` flag) while remaining in its current column—blocked is never a column.

```
Stage 0: SPEC Creation     →  Stage 1: Planning  →  Stage 2: Implementation
                                                          ↓
Stage 4: PR & Review  ←  Stage 3: QA & Verification  ←────┘
```

### Stage 0: SPEC Creation

**Deliverable Owner + spec-builder-agent**

- Interactive questioning to clarify requirements
- Capture functional requirements, edge cases, constraints
- Define acceptance criteria (clear, testable)
- Identify test requirements (unit, API, E2E, performance, security)
- Output: `{deliverable-name}-SPEC.md`

### Stage 1: Planning

**Planner agent** (one-shot decomposition)

- Decompose approved SPEC into manageable chunks, phased and sequenced
- Define per-task acceptance criteria and test requirements
- Assign files to tasks using file names and conventions; identify sequences where tasks can run in parallel without impacting the same files
- Plan to **minimize file conflicts**—when work is combined in the shared worktree, conflicts are rare
- Output: `{deliverable-name}-PLAN.md`
- **Trigger:** Invoked when the Owner requests a plan (e.g., after SPEC approval). Owner reviews and approves the PLAN; deliverable moves to Ready.

**Coordinator agent** (takes over once execution starts)

- Subscribes to plan approval events; when a deliverable moves to Ready, creates initial tasks via Zazz Board API per the PLAN
- Hands out individual tasks to workers; adds follow-on tasks progressively as prerequisites complete
- Adjusts the PLAN as required when the change mechanism is invoked; documents updates in Change Notes

### Stage 2: Implementation

**Worker agents**

- Watch the Task Board for tasks in `READY` status (or promoted from `TO_DO` to `READY` when dependencies are met)
- Read the task card: prompt, reference documentation (STANDARDS.md, SPEC, PLAN)
- Perform the task: acquire file locks → implement → run tests → **commit** (commit stamp in work tree) → signal "ready for QA"
- Locks transfer to the task (files stay locked); worker is released immediately and may pick up the next task (context is cleared)
- May ask the Deliverable Owner clarifying questions via terminal; may work with the Owner to adjust requirements or the plan
- Any adjustments to requirements or plan must be noted in the task card notes; the Coordinator updates the PLAN to reflect reality. Requirements changes that affect the SPEC require Owner sign-off and must be recorded in the SPEC's Change Notes; the Coordinator supports the audit trail.
- Coordinator monitors for blockers, responds to questions, and keeps the PLAN document current

**Note:** A task is not complete until QA signs off. Worker release is independent of task completion—workers are released when ready for QA to maximize throughput.

### Stage 3: QA & Verification

**QA agent**

The QA agent is specifically designed to **find issues** and **validate acceptance criteria**. Its role is to rigorously test against the SPEC and PLAN, identify gaps, and ensure TDD and AC are satisfied.

- **Fresh context per evaluation**—each task evaluation and the final deliverable review start with cleared context. Inputs are SPEC, PLAN, task card, and code. No context accumulation; standard context window suffices.
- Operates in a **separate agent context** from workers—validates work independently
- Actively seeks to find issues: run all tests, verify each AC, analyze code quality
- Verifies each task against acceptance criteria and tests (worker has already committed)
- **When all pass:** Marks task complete and **releases all file locks** for that task
- **When AC or TDD criteria are not met:** Create the rework task content (full context for a fresh worker) and message the Coordinator. Locks stay (rework inherits them). Include in the rework card: failing test, AC violated, reproduction steps, relevant files, expected vs actual behavior. Any available worker may pick up rework.
- May interact with the Deliverable Owner via terminal to validate rework options; updates task card notes and shares with the worker
- Iterates until all acceptance criteria and test requirements are satisfied
- QA or worker may notify the Deliverable Owner if the process becomes stalled

**Once all tasks are complete for a deliverable, QA performs a final full review** (fresh context for this evaluation):

- QA does a final full review and quality assurance of the deliverable as a whole before presenting to the Owner
- This phase checks functionality and other items across the entire deliverable
- If rework is required, QA creates the rework task content and messages the Coordinator. The rework task card must be self-contained so any worker can execute it without prior context.
- Once QA is satisfied, QA proceeds to Stage 4

**Coordinator**

- Creates rework tasks when QA provides the task content; updates the PLAN and task graph. Rework tasks are unassigned—any available worker may pick them up.
- Works with QA during the final deliverable review to add rework tasks as needed
- Keeps the PLAN current when updates are warranted; documents changes in Change Notes
- Supports the audit of SPEC changes—ensures revisions are documented in the SPEC's Change Notes section

### Stage 4: PR & Review

**QA agent**

- Create PR with verification evidence (AC status, test results, rework history)
- Add the PR link to the deliverable card
- Move the deliverable into in-review status
- Ideally notify the Deliverable Owner that the deliverable is ready for review

**Deliverable Owner**

- Performs final acceptance, reviews PR, and merges

---

## Tools and Infrastructure

### Zazz Board

The Zazz Board application provides **two kanban boards** and a **Task Graph**:

**Deliverable Board** (for Deliverable Owner and human users):

- Deliverable management (features, bug fixes, enhancements, refactors, chores)
- Configurable deliverable workflow (see [Deliverable Board Workflow](#deliverable-board-workflow) above)
- Deliverable statuses: Planning, Ready, In Progress, In Review, Stage, Done

**Task Board** (for agents):

- Tasks scoped to deliverables (`Project → Deliverable → Tasks`)
- **Task cards** — each card corresponds to a task node on the Task Graph
- Task status columns driven by the plan: `READY`, `IN_PROGRESS`, `QA`, `COMPLETED`; `TO_DO` optional before READY
- Task cards include prompt (description, objectives, AC, guidance) and references to STANDARDS.md, SPEC, and PLAN
- Blocked is an `is_blocked` flag—never a column
- Task card notes for adjustments, clarifications, and audit trail
- API for agent orchestration (Swagger/OpenAPI); tasks under `/projects/:code/deliverables/:id/tasks`

**Task Graph** (for Coordinator and visibility):

- **Task nodes** — each node corresponds to a task card on the Task Board
- Visualizes workflow as tasks are started, worked on, QA'd, and completed
- MVP node styling: green outline (in progress), yellow outline (blocked), grey/shaded (completed)
- Coordinator creates tasks via API; new tasks typically start as `READY`
- Graph can branch, merge, and include coordination dependencies (multiple predecessors)
- Coordinator adds follow-on tasks progressively as tasks complete

### Zazz Board Implementation

The Zazz Board is the task coordination platform. Key implementation details:

- **Deliverable Board** route: `/projects/:code/deliverable-kanban`
- **Task Board** route: `/projects/:code/kanban`
- **Task Graph** route: `/projects/:code/taskGraph`
- **Task scope:** Tasks are created and managed under deliverables: `POST/GET/PATCH /projects/:code/deliverables/:id/tasks`
- **Plan approval:** `PATCH /deliverables/:id/approve` sets `approved_by` and `approved_at`. Automatically moves the deliverable from Planning to Ready. A plan-approved event is published to Redis pub/sub. The Coordinator subscribes via the API and picks up plan approval messages to create tasks and begin execution.
- **Workflow config:** Projects have `deliverable_status_workflow` and `status_workflow` arrays. Status definitions are instance-level; projects select and order which statuses to use.
- **Agent pub/sub (MVP):** Redis pub/sub backend, exposed via Zazz Board API endpoints. Agents publish/subscribe for heartbeat, agent status, and agent-to-agent messaging.

### Required API Skill

All agents use the **zazz-board-api** rule skill to communicate and manage deliverables/tasks. This is non-optional—without it, agents cannot coordinate.

### Local State (`.zazz/`)


| File               | Purpose                                                                            |
| ------------------ | ---------------------------------------------------------------------------------- |
| `agent-locks.json` | Task-level file locks (locks tied to task, not worker; released when QA signs off) |
| `audit.log`        | Timestamped event log for debugging and compliance                                 |
| `api-spec.json`    | Cached OpenAPI spec from Zazz Board                                                |


**Agent communication and shared state**: Redis pub/sub, exposed via Zazz Board API endpoints, provides direct and shared agent communication. Agents use this instead of local `agent-state.json` or `agent-messages.json` files.

### Concurrency Control

- **Shared worktree**: All agents work in the same git worktree/branch for the deliverable.
- **Task-level file locks**: Locks are tied to the **task** (and its rework chain), not the worker. Worker acquires locks, implements, commits, then signals "ready for QA"—files stay locked. Locks transfer to the task; QA releases them when marking the task complete. Rework tasks (e.g., 2.3.1) inherit the same locks as the original task (2.3). This prevents thrashing—no other task may edit those files while the original task is in QA or rework.
- **Planner decomposition**: The Planner minimizes file overlap across parallel tasks in the PLAN; when tasks must share files, uses DEPENDS_ON so the dependent task starts only after the prerequisite is QA-approved and has released its locks. The Coordinator executes the PLAN.
- **Blocked display**: When a worker is blocked by a file locked by another task (in QA or rework), show blocked status clearly on both the **task card** (Task Board) and the **task node** (Task Graph)—the task node uses a yellow outline when blocked.
- **Lock timeout**: Expired locks can be reclaimed (e.g., after agent crash or task abandonment).

### Worker Release and Rework

**Order of operations:**

1. **Worker:** Acquire locks → implement → run tests → **commit** → signal "ready for QA" → transfer locks to task → released. Files stay locked.
2. **QA:** Evaluate against AC and tests.
3. **If pass:** QA marks task complete and **releases all locks** for that task.
4. **If fail:** QA creates rework content, messages Coordinator; locks stay (rework inherits them).

**Worker release:** A worker is released from a task as soon as they signal "ready for QA." The worker commits before turning over to QA, updates task status, and may immediately pick up the next available task. Files remain locked until QA signs off.

**Task completion:** A task is not complete until QA signs off. QA releases the locks when marking the task complete.

**Rework flow:** When QA finds that AC or TDD criteria are not met, QA creates the rework task content and messages the Coordinator. Locks stay with the task chain; rework inherits them. The rework card must be self-contained (failing test, AC violated, reproduction steps, relevant files, expected vs actual) because workers have cleared context. Any available worker may pick up rework.

---

## Agent Roles


| Role             | Skill              | Responsibility                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Planner**      | planner-agent      | One-shot decomposition of SPEC into PLAN. Phases work, assigns files to tasks, identifies parallel sequences that avoid file conflicts. Output: `{deliverable-name}-PLAN.md`. Invoked when Owner requests a plan; does not participate in execution.                                                                                                                                                                                                                                                                                  |
| **Coordinator**  | coordinator-agent  | Takes over once execution starts. Creates tasks from PLAN via API, hands out tasks to workers, manages task graph, responds to blockers, creates rework tasks from QA content. **Only the Coordinator may update the PLAN** during execution; when the change mechanism is invoked, adjusts tasks and documents updates in Change Notes. Supports the audit of SPEC changes. When Slack is supported, the Coordinator is the only agent with a Slack account; Worker and QA communications to the Owner flow through the Coordinator. |
| **Worker**       | worker-agent       | Implement tasks with TDD (code, tests, commits), respect locks and dependencies. Context is cleared between tasks.                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **QA**           | qa-agent           | Find issues and validate acceptance criteria per task. Fresh context for each evaluation (task or final review). When AC or TDD criteria not met, creates rework content and messages Coordinator. Once all tasks complete: final full review of deliverable as a whole, create PR, add PR link to deliverable card, move deliverable to in-review, notify Owner.                                                                                                                                                                     |
| **Spec Builder** | spec-builder-agent | Guide Deliverable Owner through interactive questioning to create comprehensive SPECs. Assists the Owner in revising the SPEC.                                                                                                                                                                                                                                                                                                                                                                                                        |


Each agent loads one role skill plus the required zazz-board-api rule. Agents have **independent context** and communicate via the Zazz Board API (including pub/sub for agent-to-agent messaging and shared state), task comments, and local lock/audit files.

### MVP Execution Model

For the MVP, the Planner runs when invoked (e.g., when the Owner requests a plan after SPEC approval)—a one-shot decomposition. The Coordinator, worker agents, and QA agents run in **separate terminals** during execution. Each agent is designated with an identifier such as `coordinator`, `worker-1`, `worker-2`, `worker-3`, `qa-1`, etc. The Coordinator subscribes to plan approval events, creates tasks from the PLAN, and monitors progress. Workers watch the Task Board for tasks that transition to `READY`, then read the task card (prompt, reference docs), perform the work, and update status. Workers and QA can interact with the Deliverable Owner via terminal for clarifications and adjustments.

### Slack Communication (When Supported)

When the framework supports Slack, the **Coordinator agent is the only agent with a Slack account**. Communication from the QA agent or Worker agent to the Deliverable Owner (via Slack) goes through the Coordinator. Workers and QA relay questions, escalations, and status updates to the Coordinator; the Coordinator posts to Slack and relays Owner responses back. This design minimizes the number of Slack accounts that need to be maintained.

---

## Framework-Agnostic Design

The Zazz framework is **framework-agnostic**. Skills are markdown files with system prompts and instructions. They can be used with:

- **Warp** (oz CLI)
- **Claude API** (Anthropic)
- **LangGraph** (LangChain)
- **CrewAI**
- **AutoGen** (Microsoft)
- **OpenAI Swarm**
- **Kimi** (Moonshot AI)
- Custom implementations

See **FRAMEWORK-SETUP.md** for integration examples.

---

## Key Principles (Summary)

1. **Sequential phases** — Each stage depends on the previous (Planner → Coordinator → Workers → QA → PR)
2. **Parallel within phase** — Workers execute tasks in parallel, respecting locks and dependencies
3. **Explicit dependencies** — No circular dependencies; all relations declared upfront
4. **Single writer per file** — Task-level file locks prevent concurrent edits; locks held until QA signs off
5. **Independent contexts** — Each agent has separate context; worker context is cleared between tasks; QA context is fresh per evaluation
6. **Document ownership** — STANDARDS.md: Project Owner. SPEC: Deliverable Owner (with spec-builder). PLAN: Planner creates initial; Coordinator updates during execution. Complete at approval; change mechanism when warranted. Coordinator supports the audit trail. When deviations accumulate significantly, Owner may archive worktree and create new deliverable (pivot option).
7. **Explicit communication** — Questions and decisions logged via task card notes or API
8. **No auto-retry** — Ambiguous situations escalated to Deliverable Owner
9. **No Blocked column** — Blocked is a state; items stay in their column when blocked
10. **Two separate boards** — Deliverable Board (humans) and Task Board (agents); different flows, different columns
11. **Task node = Task card** — Each task node on the Task Graph corresponds to exactly one task card on the Task Board; they are two views of the same task
12. **Single Slack account** — When Slack is supported, only the Coordinator has a Slack account; Worker and QA communicate to the Owner through the Coordinator
13. **Shared worktree** — All agents work in the same git worktree/branch per deliverable; Planner decomposes with file assignments to minimize conflicts; Coordinator executes the PLAN
14. **Blocked = yellow** — When a worker is blocked by a file locked by another task (in QA or rework), show blocked status on both the task card and task node (yellow outline)
15. **Project as succession** — A project or software product is a succession of deliverables. Greenfield projects start with a handful of deliverables in order to generate an MVP; as the product grows, deliverables shift to new features, enhancements, and refactors.

---

## Related Documentation


| Document                  | Purpose                                                            |
| ------------------------- | ------------------------------------------------------------------ |
| **README.md**             | Skill collection overview, quick start                             |
| **WORKFLOW-OVERVIEW.md**  | Detailed stage-by-stage workflow                                   |
| **AGENT-ARCHITECTURE.md** | Technical architecture, communication, concurrency, error handling |
| **FRAMEWORK-SETUP.md**    | Integration with Warp, Claude, LangGraph, CrewAI, etc.             |
| **.agents/skills/**       | Individual skill definitions for each agent                        |
| **TEMPLATES/**            | Task prompt template, PR template, agent state file schemas        |


---

## Version

**Version**: 1.0.0  
**Last Updated**: 2026-02-27  
**Status**: Draft (awaiting Zazz Board API completion)