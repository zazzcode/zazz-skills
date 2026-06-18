# Standards Baseline

This directory is a starting point for teams adopting the Zazz methodology.

The standards here are not a universal corporate policy or a complete set of rules for every stack. They are a starting baseline for efficient AI-assisted software product development: concrete enough for humans and agents to use during implementation, QA, automated review, and human review, but intentionally incomplete until an adopting organization adds its own stack, risk, and governance requirements.

Use them as a template for building your own standards library.

## What This Baseline Is

This library contains two kinds of standards:

- **Generic methodology standards** that should be reusable in most software repos, such as code structure, docs hygiene,
  specification hygiene, PR process, and agent routing.
- **Stack-specific baseline examples** that show the expected level of detail for a particular stack, such as Python
  testing, React admin UI patterns, SQL Server stored procedures, GitHub Actions, AWS Lambda deployment, and
  Serverless packaging.

Adopting teams should not treat stack-specific examples as universal requirements. Keep them when they match the repo,
replace them when they do not, and preserve the same level of concrete guidance, halt conditions, and review evidence.

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

1. Keep generic methodology standards that fit your workflow.
2. Keep stack-specific baseline examples only when they match your architecture and stack.
3. Replace stack-specific examples that do not apply with equivalent standards for your repo's languages, frameworks,
   database, infrastructure, and review workflow.
4. Add corporate guidelines for security, privacy, compliance, accessibility, release management, and coding conventions.
5. Add stack-specific standards for the languages, frameworks, databases, cloud services, and deployment systems your team actually uses.
6. Keep standards discoverable through `index.yaml` so agents can load the smallest useful set for each task.

## Prompt For Drafting Repo-Specific Standards

Use this prompt with the `standard-builder` skill when you want an agent to inspect an existing codebase and draft
standards from the patterns your team already uses. The output should be a reviewable draft, not an automatic policy
decision.

```text
Use $standard-builder to inspect this repository and draft stack-specific engineering standards for team review.

Context:
- This repo is a <monorepo / service repo / frontend app / backend service>.
- The area to inspect is <repo-relative path or service name>.
- The target stack is <language, framework, runtime, database, test runner, CI/deploy tools>, if known.
- Requested standards: <architecture / microservice design / API patterns / unit testing / integration testing /
  API testing and mocking / data access / observability / deployment / other>.

Please:
1. Inspect representative source files, tests, configuration, and docs before drafting.
2. Infer observed patterns from repo-relative examples; do not invent rules without evidence.
3. Separate observed patterns, recommended standards, and open questions.
4. Propose a decomposed standards set when one large standard would mix unrelated work contexts.
5. Include concrete desired and not-desired examples using neutral repo-relative paths.
6. Include halt conditions and required review evidence for each standard.
7. Note where the codebase is inconsistent and ask the team to choose the intended direction.
8. Suggest the `docs/standards/index.yaml` entries needed for agent routing.
9. Run a sensitive-reference scan before finalizing the draft.
```

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
- Avoid company names, personal paths, restricted project names, and local machine references.
- Replace extracted project names, customer names, branch names, line-number fossils, and review breadcrumbs with neutral
  repo-relative examples before publishing standards outside the source repo.
- Update `index.yaml` whenever a standard is added, renamed, split, or removed.
- Remove obsolete guidance instead of letting agents load stale instructions.

Standards should evolve with the product. When implementation or review reveals a repeated issue, turn the lesson into a small standards update so the next agent and the next reviewer start with better context.
