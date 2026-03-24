---
name: jira-api
description: Draft only, not yet implemented. Planned future companion utility skill for Jira-backed repos, intended to eventually fetch story details, acceptance criteria, links, and workflow metadata through an MCP or CLI interface.
---

# Jira API Skill

## Draft Status

This skill is a draft placeholder for the framework.
It is not implemented yet.

Do not present this skill as live Jira connectivity.
Do not claim that Jira lookups, ticket sync, or issue validation have actually occurred through this skill.

If a task needs Jira context today:

1. Read repo guidance such as `AGENTS.md` and any skill extension that declares Jira conventions.
2. Ask the user for the Jira issue key, URL, acceptance criteria, or related story details when they are not already available in repo docs.
3. Use the user-provided or repo-provided Jira information as context for planning, QA, PR drafting, or execution.
4. Clearly distinguish provided facts from anything still missing.

## Intended Future Role

This skill is expected to become the Jira counterpart to `zazz-board-api` for repos that use Jira as the authoritative issue-management system.

Planned responsibilities may include:

- fetching Jira issue summaries, descriptions, and acceptance criteria
- retrieving issue URLs, statuses, assignees, and workflow metadata
- resolving related parent/child issue context when review or planning depends on it
- providing authoritative PR-facing Jira references for skills such as `pr-builder`
- helping `spec-builder`, `planner`, `worker`, and `qa` validate that work remains aligned with the governing Jira issue

## Intended Interface Direction

The framework expects this to be implemented later through one of these approaches:

- an MCP-backed Jira integration
- a CLI-first adapter that agents can call consistently

The final implementation path is not decided in this draft.
Until that exists, this skill is documentation-only.

## Usage Rules For Now

- Treat this skill as a roadmap marker, not an executable integration.
- Do not invent Jira API endpoints, auth flows, or commands.
- Do not imply that Jira data can be fetched automatically through this skill yet.
- If a repo uses Jira, ask the user for the authoritative Jira reference when it is required and unavailable.
- If repo conventions later define a real Jira integration path, update this skill and any related skill extensions to match that implementation.

## Future Integration Contract

When this skill is implemented, it should likely follow the same broad framework pattern as other companion utility skills:

1. Read repo guidance first.
2. Resolve project-specific Jira conventions and authentication source.
3. Use a stable agent-facing interface rather than embedding ad hoc HTTP requests in every skill.
4. Return authoritative issue context for downstream skills.
5. Make it easy for other skills to distinguish verified Jira data from user-supplied fallback context.

## Non-Goals In This Draft

- no live Jira API behavior
- no bundled scripts
- no auth instructions
- no required environment variables yet
- no guarantee of future field names or route shapes
