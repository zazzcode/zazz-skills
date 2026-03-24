# Planner Skill — User Guide

How to use the Planner skill to turn an approved SPEC into an execution-ready PLAN.

## What It Does

The Planner skill converts an approved bounded deliverable SPEC into a concrete execution plan.

It should:
- verify current repository reality
- decompose the work into phases and steps
- make those steps concrete enough to become executable tasks for agents or sub-agents
- recommend implementation patterns when applicable standards or repo conventions should shape execution
- map acceptance criteria to implementation and tests
- identify safe parallelization
- identify file ownership so parallel tasks do not collide on the same files
- document the shared-file coordination approach from `AGENTS.md` when parallel work or shared-file risk exists, so downstream execution agents know how to coordinate safely
- produce a PLAN file beside the SPEC
- support review-and-revision when the owner sees planning gaps or mistakes

This skill produces a detailed PLAN document. It does not implement product code.

## When to Use It

Use this skill when:
- the SPEC is approved
- the deliverable is large enough to benefit from explicit planning
- multiple workers or execution waves may be involved
- you want task and test traceability before implementation starts

## Compatibility

- **Skills-assisted**: create a PLAN from the repo, docs, and current codebase only.
- **Service-assisted**: create the same PLAN with any required Zazz Board identifiers and conventions.

## What You Should Have Ready

Before using this skill, you should have:
- an approved SPEC path
- relevant standards available through `AGENTS.md`

In most cases, the planner should derive project code, deliverable code, issue key, and PLAN location from the approved SPEC and repo conventions.
Only provide those identifiers separately when the SPEC or repo context does not already make them clear.

For shared-file coordination, `AGENTS.md` is the source of truth.
If `AGENTS.md` does not declare an external locking or coordination tool, the planner should not infer one and should plan around the native coordination available in the active agent harness.
The planner should treat `AGENTS.md` as short repo policy, then turn that policy into explicit sequencing and parallelization guidance in the PLAN.

## Example Prompts

```text
Use planner.
The SPEC is approved at .zazz/deliverables/role-management-ui-SPEC.md.
Please create an execution-ready PLAN with phased steps, AC traceability, file ownership, and explicit verification commands.
```

```text
Use planner.
We are in skills-assisted mode, not using Zazz Board.
Please plan this deliverable from the approved SPEC and current repository reality only, and call out any gaps you need me to clarify.
```

```text
Use planner.
The SPEC is approved and uses the Zazz Board folder convention.
Please derive the canonical PLAN path from the SPEC, then include parallelization and merge points.
```

```text
Use planner.
We are using Jira for deliverable folders and the SPEC is approved.
Please derive the canonical PLAN beside the SPEC and keep the Jira folder convention.
```

## Output

The skill should produce:
- a `-PLAN.md` file beside the approved SPEC
- a clear execution structure for implementation and QA
- phased decomposition with task-sized steps that can be assigned to agents or sub-agents
- specific steps and recommended implementation guidance where standards materially shape the work
- explicit file ownership and parallelization guidance so concurrent work does not create avoidable file conflicts
- explicit shared-file coordination guidance from `AGENTS.md` for the worker/coordinator when concurrent work could touch the same files
- traceability from acceptance criteria to work steps and tests
- a revised PLAN when the owner identifies a real planning gap or incorrect assumption

## Notes

- Use this after `spec-builder`, not instead of it.
- A good PLAN should reduce ambiguity for `worker`, `qa`, and `coordinator`.
- A good PLAN should break complex work into phases and task-sized steps that can be executed safely in parallel when files do not overlap.
- If shared-file coordination matters, the planner should derive the execution approach from `AGENTS.md`.
- The planner records that approach in the PLAN and makes the sequencing consequences explicit; the worker or coordinator is responsible for applying it during execution.
- If `AGENTS.md` is silent, the planner should not infer an external tool; it should document harness-native coordination and serialization rules when parallel edits are not safe.
- The planner should derive as much context as possible from the approved SPEC before asking follow-up questions.
- If the work is tiny, a team may choose to execute directly from the SPEC without a formal PLAN.
