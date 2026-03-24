# Planner Skill — User Guide

How to use the Planner skill to turn an approved SPEC into an execution-ready PLAN.

## What It Does

The Planner skill converts a bounded deliverable SPEC into a concrete execution plan.

It should:
- verify current repository reality
- decompose the work into phases and steps
- map acceptance criteria to implementation and tests
- identify safe parallelization
- produce a PLAN file beside the SPEC

This skill does not implement code.

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
- the project code
- relevant standards available through `AGENTS.md`

If the repo uses Zazz Board, also provide:
- deliverable code
- deliverable numeric ID

If the repo uses the Jira directory convention, also provide:
- the Jira issue key

## Example Prompts

```text
Use planner.
The SPEC is approved at .zazz/deliverables/role-management-ui-SPEC.md.
Please create an execution-ready PLAN with phased steps, AC traceability, file ownership, and explicit verification commands.
```

```text
Use planner.
We are in skills-assisted mode, not using Zazz Board.
Please plan this deliverable from the approved SPEC and current repository reality only.
```

```text
Use planner.
The deliverable is ZAZZ-142 and the SPEC is approved.
Please generate the canonical PLAN file beside the SPEC and include parallelization and merge points.
```

```text
Use planner.
We are using Jira for deliverable folders.
The issue key is PROJ-453 and the SPEC is approved.
Please generate the canonical PLAN beside the SPEC and keep the Jira folder convention.
```

## Output

The skill should produce:
- a `-PLAN.md` file beside the approved SPEC
- a clear execution structure for implementation and QA
- traceability from acceptance criteria to work steps and tests

## Notes

- Use this after `spec-builder`, not instead of it.
- A good PLAN should reduce ambiguity for `worker`, `qa`, and `coordinator`.
- If the work is tiny, a team may choose to execute directly from the SPEC without a formal PLAN.
