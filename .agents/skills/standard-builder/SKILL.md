---
name: standard-builder
description: Help a user create, draft, refine, or update engineering standards by inspecting an existing codebase for stack-specific patterns, architecture boundaries, tests, mocking, API behavior, service design, and review evidence; use when the user asks to infer standards from a repo, codify existing team patterns, tailor the Zazz standards library to an organization, split standards by domain, or draft standards such as TypeScript Express microservice patterns, API testing and mocking, unit/integration testing, frontend conventions, data access, CI, deployment, or observability.
---

# Standards Builder

Use this skill to turn existing codebase practice into reviewable standards for the Zazz methodology. The output is a
draft standard or a small set of decomposed standards that a human team can review, correct, and adopt.

## Core Rule

Infer standards from evidence, not vibes. Inspect representative files, tests, configuration, docs, and recent diffs.
Separate:

- **Observed pattern**: what the codebase consistently does today.
- **Recommended standard**: what the team should make normative.
- **Open question**: what needs human confirmation because the code is inconsistent, risky, or ambiguous.

Do not turn every existing habit into a rule. Prefer patterns that improve clarity, reviewability, testability,
security, reliability, or agent execution.

## Intake

Establish the target before drafting:

1. Identify the repo, service, package, or bounded area to inspect.
1. Identify the intended standard type, such as microservice design, unit testing, integration testing, API testing and
   mocking, error handling, data access, CI, deployment, logging, or frontend patterns.
1. Identify the adopting team's stack and architecture from code, config, and docs rather than assuming it.
1. If the target is broad, propose a decomposed standard set instead of one giant document.

Example decomposition for a TypeScript Express microservice:

- `microservice-structure.md` — folder layout, module boundaries, configuration, dependency injection.
- `microservice-api.md` — route shape, request validation, response envelopes, error mapping, auth.
- `microservice-testing-unit.md` — unit test boundaries, test data builders, mocks, assertions.
- `microservice-testing-api.md` — API tests, supertest/fetch clients, dependency mocking, error-path coverage.
- `microservice-observability.md` — logging keys, correlation IDs, metrics, health checks.

## Evidence Collection

Use `rg` and repo-native tools first. Collect enough evidence to prove the pattern without reading the whole repo by
default.

Look for:

- docs: `README`, `AGENTS.md`, `docs/`, architecture notes, standards, ADRs.
- package/config: `package.json`, `tsconfig.json`, `eslint`, `vitest`, `jest`, `playwright`, `docker`, CI workflows.
- source layout: representative services, route modules, middleware, controllers, clients, repositories, workers.
- tests: unit, integration, API, contract, fixtures, mocks, test builders, snapshot usage.
- runtime seams: env parsing, logging, dependency injection, auth, database clients, queues, outbound HTTP clients.
- review evidence: PR templates, CI checks, test commands, coverage or smoke-test expectations.

When using examples, cite repo-relative paths and concise identifiers. Avoid personal paths, local machine details,
restricted project names, and line-number fossils. Use path examples like `services/billing/src/routes/invoices.ts`, not
absolute checkout paths.

## Pattern Analysis

For each candidate rule, record:

1. **Evidence**: 2-5 representative repo-relative examples.
1. **Consistency**: consistent, emerging, mixed, or one-off.
1. **Purpose**: why the rule matters for implementation, tests, review, or operations.
1. **Blast radius**: which paths and activities the standard should apply to.
1. **Counterexamples**: places where the code differs and whether they are legacy, exceptions, or unresolved.
1. **Review evidence**: what proof a PR must include before human review.
1. **Halt condition**: when an agent must stop and ask for direction.

Promote a pattern to a standard only when the purpose is clear and the evidence is strong enough. If evidence is mixed,
write an open question or a migration note instead of pretending the rule is settled.

## Standard Shape

Draft standards as concrete, agent-usable docs:

- title and short scope statement.
- stack-specific baseline note when the standard assumes a particular language, framework, database, cloud, or test
  runner.
- `applies_to` guidance that can be reflected in `docs/standards/index.yaml`.
- prescriptive rules with desired and not-desired examples.
- halt conditions.
- required review evidence.
- related standards.

Keep standards decomposed by work context. A microservice unit-testing standard should not also carry API route design,
deployment, and logging rules unless those concerns are inseparable.

## Drafting Rules

- Preserve useful specificity. Replace private names with neutral, repo-relative examples; do not erase the technical
  detail that makes the standard actionable.
- Clearly label stack-specific guidance as a baseline example that adopting teams can replace.
- Use RFC-2119 language (`MUST`, `MUST NOT`, `SHOULD`) for requirements when the repo's docs style uses it.
- Include desired and not-desired examples where they clarify behavior.
- Include commands for verification only when they are repo-native and discovered from the codebase.
- Add index entry updates when creating or splitting standards.
- If modifying public/shared standards, run a sensitive-reference scan before finishing.

## Halt Conditions

Stop and ask for human direction when:

- the codebase shows two incompatible patterns and no docs identify the intended direction.
- the inferred standard would require broad migration or deprecating live behavior.
- the standard touches security, privacy, compliance, accessibility, or production deployment policy without existing
  organization guidance.
- representative examples contain restricted customer, credential, local-machine, or proprietary names that cannot be
  safely neutralized.
- tests or CI evidence cannot be identified for a proposed requirement.

## Output

Return:

- standards drafted or updated, with repo-relative paths.
- evidence inspected, summarized by path or area.
- open questions for the team.
- `index.yaml` updates needed or applied.
- verification and sensitive-reference scans run.

When the user wants a first draft only, do not over-edit unrelated standards. Create the smallest useful standard or
decomposed set that the team can review.
