# Zazz Skills

A collection of LLM agent skills for autonomous software development using the Zazz Board API and methodology.

**Zazz** is both a methodology for multi-agent software development and a task/deliverable management application (Zazz Board). This skill collection teaches agents how to work autonomously using Zazz's structured workflow.

## Overview

### Required Infrastructure Skill

Every agent MUST use this methodology rule:

- **zazz-board-api** (type: `rule`) - Required API for all agents to communicate and manage deliverables/tasks

### Role Skills

Each agent loads one of these role-specific skills:

- **coordinator-agent** - Orchestrates deliverable workflow, decomposes SPEC into PLAN, manages adaptive task creation
- **worker-agent** - Implements tasks with test-driven development (code, tests, commits)
- **qa-agent** - Verifies acceptance criteria and quality, creates rework tasks and PRs
- **spec-builder-agent** - Helps requestor create comprehensive Deliverable Specifications through interactive questioning

Each agent has **independent context** and communicates through terminal interaction (MVP), with synchronization to Zazz Board notes/comments and local shared state files.

## Methodology Core Terminology
- **Deliverable Specification (SPEC)**: Source-of-truth requirements and acceptance criteria.
- **Implementation Plan (PLAN)**: Execution decomposition derived from the SPEC.
- **Reference Architecture**: Project-level technical guidance (stack, conventions, constraints) that SPEC/PLAN reference.

## Two Workflow Levels
- **Deliverable-level workflow (human-led)**: Define/approve SPEC and PLAN, review merge-ready results.
- **Task-level workflow (agent-led)**: Execute and coordinate tasks with human interaction only when needed.

## MVP Status
This repository is an MVP documentation/skills package. The Zazz Board API integration skill is intentionally draft while the API is still being finalized. Once ready, agents will use the published Swagger/OpenAPI endpoint through the shared `zazz-board-api` rule skill for task retrieval and status updates.
For the MVP execution model, **human ↔ agent interaction happens primarily in terminal sessions**. Key decisions, clarifications, and outcomes from terminal interaction should then be **posted to task notes/comments on Zazz Board** to preserve traceability.

## Quick Start

1. Clone/install this skill collection
2. Set environment variables (see `AGENT-ARCHITECTURE.md`)
3. Create a Deliverable Specification (SPEC) with spec-builder-agent
4. Coordinator creates Implementation Plan (PLAN) by decomposing SPEC
5. Trigger implementation workflow:
   ```bash
   # Using Warp
   oz agent run --skill "coordinator-agent" \
     --prompt "Start deliverable DEL-001 with approved SPEC and create PLAN"
   
   # Using another framework (Claude, CrewAI, etc.)
   # Load skill from .agents/skills/coordinator-agent/SKILL.md
   ```

## Documentation Structure

**Start here:**
- **WORKFLOW-OVERVIEW.md** - High-level workflow phases and skill integration
- **FRAMEWORK-SETUP.md** - How to use zazz-skills with your agent framework (Warp, Claude, CrewAI, Kimi, etc.)

**For agents/developers:**
- **.agents/skills/** - Individual skill definitions for all five agents
  - Each skill has system prompt + instructions + examples
- **TEMPLATES/** - Task prompt template, state file schemas, SPEC and PLAN document templates

**For reference:**
- **AGENT-ARCHITECTURE.md** - Technical architecture (agent roles, communication, concurrency)

## Current Maturity (MVP)

### What is ready
- Core docs are in place: `README.md`, `WORKFLOW-OVERVIEW.md`, `AGENT-ARCHITECTURE.md`, `FRAMEWORK-SETUP.md`
- Draft role skills are in place:
  - `.agents/skills/spec-builder-agent/SKILL.md`
  - `.agents/skills/coordinator-agent/SKILL.md`
  - `.agents/skills/worker-agent/SKILL.md`
  - `.agents/skills/qa-agent/SKILL.md`
- Required rule skill is in place:
  - `.agents/skills/zazz-board-api/SKILL.md`

### In progress
- Example artifacts referenced by docs are not fully populated yet
- Template/reference folders are not fully populated yet
- API contract details in skills are still draft-level while Zazz Board API evolves

## Target Directory Structure (In Progress)

```
zazz-skills/
├── README.md                           # This file
├── WORKFLOW-OVERVIEW.md                # High-level workflow phases
├── AGENT-ARCHITECTURE.md               # Technical architecture & reference
│
├── .agents/skills/                     # Skills directory (Warp compatible)
│   ├── zazz-board-api/                 # Required: All agents use this
│   │   ├── SKILL.md
│   │   └── examples/
│   │       └── example-api-calls.md
│   │
│   ├── coordinator-agent/
│   │   ├── SKILL.md
│   │   └── examples/
│   │       ├── example-plan.md
│   │       └── example-task-graph.json
│   │
│   ├── worker-agent/
│   │   ├── SKILL.md
│   │   └── examples/
│   │       ├── example-task-execution.md
│   │       └── example-commit.txt
│   │
│   ├── qa-agent/
│   │   ├── SKILL.md
│   │   └── examples/
│   │       ├── example-rework-plan.md
│   │       └── example-pr.md
│   │
│   └── spec-builder-agent/
│       ├── SKILL.md
│       └── examples/
│           └── example-spec.md
│
├── TEMPLATES/                          # Reusable templates
│   ├── task-prompt-template.md         # Template for creating task prompts
│   ├── PR-TEMPLATE.md                  # PR template for QA
│   ├── agent-state.json.template       # Template for .zazz/agent-state.json
│   ├── agent-locks.json.template       # Template for .zazz/agent-locks.json
│   ├── agent-messages.json.template    # Template for .zazz/agent-messages.json
│   └── audit.log.template              # Template for .zazz/audit.log
│
└── docs/                               # Detailed reference docs (planned)
    ├── error-handling.md               # Error scenarios and recovery
    ├── monitoring.md                   # Heartbeat, deadlock detection, logging
    ├── performance-tuning.md           # Optimization and benchmarks
    └── case-studies.md                 # Real-world examples
```

## For Different Agent Frameworks

These skills are framework-agnostic. Use them with:

- **Warp** - Place in `.agents/skills/` (or `.warp/skills/`), invoke with oz CLI
- **Claude API** - Load skill markdown as system prompt
- **LangGraph** - Use as node instructions
- **CrewAI** - Use as role backstory + task
- **AutoGen** - Use as agent system message
- **OpenAI Swarm** - Use as agent instructions
- **Kimi Agent Swarm** - Use with dynamic worker spawning (up to 100 agents)

Example: Loading with Claude API
```python
with open('.agents/skills/coordinator-agent/SKILL.md') as f:
    system_prompt = f.read()

response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=4096,
    system=system_prompt,
    messages=[{"role": "user", "content": "Start deliverable DEL-001 with SPEC"}]
)
```

## Environment Setup

Required variables (see `AGENT-ARCHITECTURE.md` for full list):

```bash
# Zazz Board API
export ZAZZ_API_BASE_URL="http://localhost:3000"
export ZAZZ_API_TOKEN="your-api-token"

# Agent identity
export AGENT_ID="coordinator|worker_1|worker_2|qa"
export AGENT_ROLE="coordinator|worker|qa"

# LLM provider
export LLM_PROVIDER="anthropic|openai"
export LLM_API_KEY="your-llm-api-key"
export LLM_MODEL="claude-3-5-sonnet-20241022"

# Workspace
export ZAZZ_WORKSPACE="/path/to/project"
export ZAZZ_STATE_DIR="${ZAZZ_WORKSPACE}/.zazz"

# Timeouts (optional)
export AGENT_POLL_INTERVAL_SEC=15
export AGENT_HEARTBEAT_INTERVAL_SEC=10
export AGENT_TIMEOUT_SEC=120
export FILE_LOCK_TIMEOUT_MIN=10
```

## Key Concepts

### Deliverable

A complete feature, bugfix, or project module with:
- **Deliverable Specification (SPEC)** - {deliverable-name}-SPEC.md - The source of truth defining what should be delivered, created interactively with spec-builder-agent
- **Implementation Plan (PLAN)** - {deliverable-name}-PLAN.md - Detailed decomposition of SPEC into phases, steps, and tasks with acceptance criteria, created by coordinator-agent
- **Reference Architecture** - Project-level document defining tech stack, DB, frameworks, and architecture patterns that SPEC can reference
- **Acceptance Criteria** - Clear, testable criteria for verifying deliverable is complete

### SPEC and PLAN Immutability

**SPEC and PLAN cannot be edited during development.** Instead:
- Changes are tracked in task notes and Change Notes sections within the documents
- Decisions and clarifications are logged as close to the original requirement as possible
- Creates a permanent audit trail of what changed and why

### Task Graph

Coordinator breaks PLAN into tasks with dependencies (DEPENDS_ON, COORDINATES_WITH):
- Single writer per file (enforced via locks)
- Tasks respect dependencies (only start when prerequisites done)
- No circular dependencies (acyclic)
- Tasks created as-needed during execution, not all upfront

### Workflow Stages

0. **SPEC Creation** (Requestor + spec-builder-agent) - Create {deliverable-name}-SPEC.md with clear requirements and AC
1. **Planning** (Coordinator) - Create {deliverable-name}-PLAN.md by decomposing SPEC, define task graph
2. **Implementation** (Workers) - Execute tasks from PLAN, commit changes
3. **QA & Rework** (QA + Coordinator) - Verify quality against AC, fix issues, refine PLAN as needed
4. **PR & Review** (QA + Coordinator) - Create PR with evidence, update deliverable status

### Communication
- **Primary (MVP):** Terminal interaction between human and agents
- **Board sync (MVP):** Post key terminal decisions, clarifications, blockers, and outcomes to task notes/comments
- **Target state:** Zazz Board API orchestration (task comments, status updates)
- **Secondary:** `.zazz/agent-messages.json` (local file queue)
- **State:** `.zazz/agent-state.json` (heartbeat, agent status)
- **Locks:** `.zazz/agent-locks.json` (file-level locks)

## Best Practices

1. **Task design** - Self-contained prompts, explicit AC, clear file dependencies
2. **Communication** - Ask clarifications immediately, don't guess
3. **Concurrency** - File locks, dependencies, generous timeouts
4. **QA** - Test isolation, detailed evidence, escalate complex issues early
5. **Reliability** - Frequent commits, heartbeats, idempotent operations

See `AGENT-ARCHITECTURE.md` section 10 for complete best practices list.

## Next Steps

1. Read **WORKFLOW-OVERVIEW.md** to understand the five stages (0-4)
2. Review **.agents/skills/** for individual skill content
3. Check **AGENT-ARCHITECTURE.md** for technical details
4. Set up environment variables and test with a single deliverable

## Support

- For agent architecture questions → `AGENT-ARCHITECTURE.md`
- For step-by-step procedures → See individual skill files
- For error handling (current MVP) → `AGENT-ARCHITECTURE.md` section 10
- For monitoring/observability (current MVP) → `AGENT-ARCHITECTURE.md` section 9

## License

[Your license]

## Version

**Version**: 1.0.0  
**Last Updated**: 2026-02-23  
**Status**: Draft (awaiting Zazz Board API completion)
