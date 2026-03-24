# Worker Skill — User Guide

How to use the Worker skill to implement an approved deliverable from its SPEC and PLAN.

## What It Does

The Worker skill is the implementation skill in the Zazz execution flow.

It should:
- read the approved SPEC and PLAN
- read `AGENTS.md` for the repo's shared-file coordination policy
- execute work in dependency order
- follow TDD
- keep execution status truthful in the workflow the repo actually uses
- stop and escalate when the contract is unclear

## When to Use It

Use this skill when:
- the deliverable SPEC is approved
- the PLAN is approved or the team is executing directly from an approved plan structure
- implementation is ready to begin
- a worktree is already scoped to one active deliverable

## Compatibility

- **Skills-assisted**: implement from the repo, worktree, SPEC, and PLAN without requiring Zazz Board.
- **Service-assisted**: implement the same work while also keeping Zazz Board state truthful.

## What You Should Have Ready

Before using this skill, you should have:
- an approved SPEC path
- an approved PLAN path
- the current worktree for the deliverable
- the current task or execution slice you want the worker to handle

If the repo uses Zazz Board, also provide the board identifiers and access.

For shared-file coordination, `AGENTS.md` is the source of truth.
If `AGENTS.md` does not declare an external coordination tool, the worker should not infer one and should use the native coordination available in the active agent harness.

## Example Prompts

```text
Use worker.
The SPEC and PLAN are approved.
Please implement the next dependency-ready steps using TDD and keep execution status truthful.
```

```text
Use worker.
We are in skills-assisted mode, not using Zazz Board.
Please execute the approved PLAN from the current worktree and report blockers clearly.
```

```text
Use worker.
This deliverable is board-backed.
Please implement the assigned work and keep task, blocker, and lock state synchronized through the supported workflow.
```

## Output

The skill should produce:
- working code aligned to the approved contract
- task-level test evidence
- clear blocker escalation when needed
- truthful execution status in the repo workflow being used
- shared-file coordination applied according to `AGENTS.md`, with overlapping-file work serialized when safe isolation is not guaranteed

## Notes

- This skill is not for defining scope; use `spec-builder` and `planner` first.
- One active deliverable per worktree is the intended operating model.
- If the implementation contract is unclear, the worker should escalate instead of guessing.
- The PLAN can restate deliverable-specific coordination guidance, but `AGENTS.md` is the repo-level source of truth for whether Zazz Board locks, Switchman, harness-native coordination, or serialization should be used.
