# Jira Skill — Draft User Guide

This is a draft placeholder for a future Jira integration skill.
It is not implemented yet.

## What It Will Eventually Do

The intent is to give agents a consistent way to interact with Jira when a repo uses Jira as the authoritative issue-management system.

That future skill will likely help with:
- pulling story or ticket details
- reading acceptance criteria
- resolving Jira links and workflow context
- supporting specification, PR, QA, and execution flows with authoritative Jira issue data

It is expected to support both:
- interactive, human-in-the-loop use
- automation-driven agent use, such as informing an agent running the `qa-testing` skill with Jira issue context

## Future Interface

The current expectation is that this will eventually be implemented through:
- an MCP integration
- or a CLI-based adapter

The final choice has not been made yet.

## Current Limitation

Today this skill is documentation-only.
Agents should not claim to have contacted Jira through it.

If Jira information is needed right now, the agent should:
- use `AGENTS.md` as the source of truth for repo-specific settings and read it when that context is not already available
- ask the user for the Jira issue key or URL when missing
- use that user-provided issue context explicitly and truthfully

That fallback applies whether the consumer is:
- a human-facing workflow
- or an automation-driven agent such as an agent running the `qa-testing` skill

## Why This Exists Now

The methodology is expected to need a Jira utility skill over time, similar in spirit to `zazz-board` for Zazz Board.

Adding the draft now makes that future dependency visible and gives downstream skills a place to point once Jira integration is implemented.
