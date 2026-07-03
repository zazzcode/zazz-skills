---
name: jira
description: Draft only, not yet implemented. Future companion utility skill for Jira-backed repos, intended to eventually fetch story details, acceptance criteria, links, and workflow metadata through an MCP or CLI interface.
---

# Jira Skill

## Draft Status

This skill is a draft placeholder for the methodology.
It is not implemented yet.

Do not present this skill as live Jira connectivity.
Do not claim that Jira lookups, ticket sync, or issue validation have actually occurred through this skill.

If a task needs Jira context today:

1. Use `AGENTS.md` as the source of truth for repo-specific settings such as tracking system, project-code conventions, and Jira workflow rules. Read it if that context is not already available, along with any skill extension that declares Jira conventions.
2. Ask the user for the Jira issue key, URL, acceptance criteria, or related story details when they are not already available in repo docs.
3. Use the user-provided or repo-provided Jira information as context for specification, QA, PR drafting, or execution.
4. Clearly distinguish provided facts from anything still missing.

## Operating Modes

This draft skill is intended for two future usage patterns:

1. **Interactive support** for a human-in-the-loop agent that needs Jira context during specification, QA review, PR drafting, or execution.
2. **Companion utility support** for automation-driven agents, including an agent running the `qa-testing` skill, that need authoritative Jira issue context to validate acceptance criteria, confirm scope, or anchor reviewer evidence.

Today, both modes still rely on repo guidance and user-provided Jira context because live integration is not implemented yet.
The important distinction is that this skill is not only for conversational lookup. It is also meant to inform downstream agents such as an agent running `qa-testing`, `pr-builder`, `spec-builder`, or `pr-review`.

## Intended Future Role

This skill is expected to become the Jira counterpart to `zazz-board` for repos that use Jira as the authoritative issue-management system.

Future responsibilities may include:

- fetching Jira issue summaries, descriptions, and acceptance criteria
- retrieving issue URLs, statuses, assignees, and workflow metadata
- resolving related parent/child issue context when specification or review depends on it
- providing authoritative PR-facing Jira references for skills such as `pr-builder`
- helping `spec-builder`, `pr-builder`, `pr-review`, and an agent running `qa-testing` validate that work remains aligned with the governing Jira issue
- informing automation-driven QA-agent flows with authoritative Jira acceptance criteria and issue metadata

## Intended Interface Direction

The methodology expects this to be implemented later through one of these approaches:

- an MCP-backed Jira integration
- a CLI-first adapter that agents can call consistently

The final implementation path is not decided in this draft.
Until that exists, this skill is documentation-only.

## Usage Rules For Now

- Treat this skill as a roadmap marker, not an executable integration.
- Do not invent Jira endpoints, auth flows, or commands.
- Do not imply that Jira data can be fetched automatically through this skill yet.
- If a repo uses Jira, ask the user for the authoritative Jira reference when it is required and unavailable.
- If an automation-driven agent such as an agent running `qa-testing` needs Jira context, use repo guidance plus user-provided Jira details as the current fallback input.
- If repo conventions later define a real Jira integration path, update this skill and any related skill extensions to match that implementation.

## Future Integration Contract

When this skill is implemented, it should likely follow the same broad methodology pattern as other companion utility skills:

1. Use repo guidance first, with `AGENTS.md` as the source of truth for repo-specific settings.
2. Resolve project-specific Jira conventions and authentication source.
3. Use a stable agent-facing interface rather than embedding ad hoc HTTP requests in every skill.
4. Return authoritative issue context for downstream skills.
5. Make it easy for other skills to distinguish verified Jira data from user-supplied fallback context.
6. Support both interactive agent use and automation-driven companion use without changing the source-of-truth model.

## Non-Goals In This Draft

- no live Jira behavior
- no bundled scripts
- no auth instructions
- no required environment variables yet
- no guarantee of future field names or route shapes
