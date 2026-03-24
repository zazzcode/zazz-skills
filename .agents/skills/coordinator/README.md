# Coordinator Skill — User Guide

How to use the Coordinator skill to manage execution of an approved deliverable plan.

## What It Does

The Coordinator skill manages delivery after planning is complete.

It helps keep execution organized by:
- turning an approved PLAN into active execution waves
- managing dependency order and follow-on work
- handling blockers and rework flow
- keeping the execution record truthful in the workflow the repo actually uses

This skill does not implement product code itself.

## When to Use It

Use this skill when:
- a deliverable SPEC and PLAN are already approved
- multiple tasks or workers need coordination
- QA rework needs to be fed back into execution cleanly
- you want one agent responsible for execution flow rather than just individual coding tasks

## Compatibility

- **Skills-assisted**: coordinate through the repo, worktree, terminal workflow, and local task conventions.
- **Service-assisted**: coordinate through the same process plus Zazz Board.

## What You Should Have Ready

Before using this skill, you should have:
- an approved SPEC
- an approved PLAN
- clarity on who is acting as Deliverable Owner
- the execution context for the current worktree

If the repo uses Zazz Board, have the deliverable context and board access ready as well.

## Typical Workflow

1. Start after the PLAN is approved.
2. Ask the agent to coordinate execution for the deliverable.
3. Let it manage task readiness, blockers, and rework flow.
4. Use it as the control point for clarifications, execution changes, and QA-driven rework.
5. Keep the Worker focused on implementation and QA focused on verification.

## Example Prompts

```text
Use coordinator.
The deliverable PLAN is approved and ready to execute.
Please coordinate task rollout, handle blockers, and manage rework until the deliverable is ready for review.
```

```text
Use coordinator.
We are in skills-assisted mode, not using Zazz Board.
Please manage execution from the approved PLAN using terminal coordination and the local repo workflow.
```

```text
Use coordinator.
QA found rework for steps 2.3 and 2.4.
Please update the execution flow and prepare the next worker wave.
```

## Output

The skill should produce:
- an actively managed execution flow
- clear worker handoffs
- rework routing when QA finds issues
- updated PLAN or SPEC changes when properly approved
- a truthful execution record in the workflow the repo uses

## Notes

- This is primarily an execution-management skill, not a document-authoring skill.
- It works best after `planner` has produced a strong PLAN.
- In service-assisted repos, it may use Zazz Board.
- In skills-assisted repos, it should still work cleanly without Board dependency.
