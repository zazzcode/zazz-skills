# Standards Baseline

This directory is a starting point for teams adopting the Zazz methodology.

The standards here are not meant to be a universal corporate policy or a complete set of rules for every stack. They are baseline examples that show how to make engineering expectations explicit enough for both humans and agents to use during implementation, QA, automated review, and human review.

Use them as a template for building your own standards library.

## Why Standards Matter

AI-assisted delivery works best when agents do not have to infer engineering expectations from scattered code, old PR comments, or private team habits. Standards give the team a shared reference for:

- how code should be structured
- how tests should prove behavior
- how APIs, services, data access, security, logging, and deployment should be reviewed
- what evidence is required before human review and merge
- when an agent should stop and ask for human direction

Good standards reduce repeated explanation, improve review quality, and make agent output easier to trust.

## How To Use This Directory

Start with [index.yaml](index.yaml). Agents use the index to decide which standards apply to a task without loading every document.

When adopting these standards:

1. Keep the standards that match your architecture and stack.
2. Remove standards that do not apply.
3. Rewrite examples so they match your repo paths, naming, frameworks, tools, and review process.
4. Add corporate guidelines for security, privacy, compliance, accessibility, release management, and coding conventions.
5. Add stack-specific standards for the languages, frameworks, databases, cloud services, and deployment systems your team actually uses.
6. Keep standards discoverable through `index.yaml` so agents can load the smallest useful set for each task.

## Baseline, Not Final Policy

Some files in this directory are intentionally technology-specific. For example, there are baseline standards for Python testing, frontend implementation, HTTP layers, databases, stored procedures, CI, deployment, and observability.

That does not mean every Zazz repo should use those exact technologies. It means the repository includes worked examples of the level of specificity that useful agent-facing standards need.

For a different stack, create equivalent standards for your environment. Examples:

- replace Python testing guidance with Java, Go, Rust, .NET, Ruby, or JavaScript testing guidance
- replace SQL Server or stored-procedure guidance with PostgreSQL, MySQL, document database, event-store, or ORM guidance
- replace frontend examples with the UI framework and accessibility practices your product uses
- replace deployment guidance with your cloud, container, infrastructure-as-code, and release process

## What To Add For Your Organization

Your local standards should include the rules that matter for your business and risk profile:

- security, privacy, data handling, and compliance requirements
- accessibility and UX quality bars
- production observability, incident response, and rollback expectations
- dependency, license, and supply-chain policy
- API compatibility and versioning rules
- database migration and data retention rules
- code ownership, review tiers, and required approvers
- required evidence before merge

The goal is not to create a large rulebook. The goal is to make important decisions explicit, easy to find, and usable by both engineers and agents.

## Maintenance Rules

- Keep standards concise and prescriptive.
- Prefer concrete desired and not-desired examples.
- Use repo-relative paths.
- Avoid company names, personal paths, private project names, and local machine references.
- Update `index.yaml` whenever a standard is added, renamed, split, or removed.
- Remove obsolete guidance instead of letting agents load stale instructions.

Standards should evolve with the product. When implementation or review reveals a repeated issue, turn the lesson into a small standards update so the next agent and the next reviewer start with better context.
