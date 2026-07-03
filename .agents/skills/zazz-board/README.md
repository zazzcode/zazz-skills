# Zazz Board Skill — User Guide

How to use the Zazz Board skill when a repo operates in service-assisted mode with Zazz Board.

## What It Does

This skill gives other skills a consistent way to interact with Zazz Board.

It supports:
- deliverable and task operations
- status and note updates
- dependency graph operations
- readiness checks
- file-lock operations
- CLI-first interaction through `zazzctl`

This is a companion utility skill, not a human-facing workflow on its own.

## When to Use It

Use this skill only when the repo is operating in **service-assisted** mode.

That usually means:
- the repo uses Zazz Board for execution state
- deliverables or tasks need to be synchronized through the Board
- a workflow skill such as `spec-builder`, `qa-testing`, `pr-builder`, or `pr-review` needs Board capability

Do not require this skill in ordinary skills-assisted repos that are just following the process and directory structure.

## Preferred Interface

The preferred interface is the CLI:

- script: `.agents/skills/zazz-board/scripts/zazzctl.mjs`

The skill is intentionally CLI-first.

## Example Uses

Typical indirect use:
- `spec-builder` syncing a specification path to a board-backed deliverable
- an implementation agent updating task status or locks
- an agent creating tasks or dependency edges from an approved execution contract
- `qa-testing` appending validation findings or evidence

## Human Operator Notes

If you are setting up or debugging Board-assisted execution, make sure you have:
- `ZAZZ_API_BASE_URL`
- `ZAZZ_API_TOKEN`
- the correct project and deliverable context
- Node.js available for the CLI

## Notes

- This skill is optional in the methodology.
- It should stay cleanly separated from the base process and skills-assisted workflow.
- When the CLI does not support a needed capability yet, OpenAPI is the validation and fallback surface.
