# Human-in-the-Loop PR Review Strategy for Agent-Generated Code

## Executive Summary

Agentic development changes the bottleneck. Code generation gets cheaper, but reviewer attention does not. A traditional one-reviewer PR model, with a second reviewer added only for complex or high-risk changes, needs more structure when agents can generate larger, broader, multi-file changes faster than humans can review them.

The recommended process is not "let agents merge code." It is a risk-tiered, evidence-gated human review process where agents prepare and pre-review work, while humans retain approval and merge authority.

Process rules:

- Require clear intent and evidence before human review: proposal, feature requirements document, deliverable specification, lightweight bug-fix specification, test plan, commands run, and runtime/manual evidence as appropriate.
- Use agents as draft-PR first-pass reviewers and risk triage assistants, not final approvers.
- Route PRs by review risk, not by a flat rule that every PR receives the same depth of review.
- Keep PRs reviewable by default; use stacked PRs when a single PR would force a reviewer to understand too many files, layers, or concepts at once.
- Treat bug fixes as reviewable execution contracts too, often through a lightweight bug-fix specification embedded in Jira, Zazz Board, GitHub Issues, or the team's tracker.
- Require regression tests for bug fixes by default.
- Preserve named human ownership for critical paths.
- Measure review queue health with quality and throughput metrics before setting hard service-level targets.

## Problem Statement

Our current review model assumes human-authored changes at human scale. Agent-assisted work breaks that assumption:

- Agents can produce more code, faster, across more files.
- Large PRs become more common unless the process actively constrains them.
- Human reviewers fatigue when asked to inspect thousands of lines.
- Reviewers tend to skim or rubber-stamp broad diffs because they cannot hold the whole change in working memory.
- CI passing is necessary, but it does not prove product correctness, architecture fit, rollback safety, or maintainability.

The goal is not to remove humans from review. The goal is to reserve human judgment for the decisions that require judgment: product correctness, system contracts, architecture fit, risk, evidence quality, and merge readiness.

## Zazz Methodology Fit

This proposal should be read as a platform process proposal inside the Zazz methodology. Its purpose is to preserve human approval quality while agents execute more implementation work.

Relevant Zazz terms:

- **Project**: the long-lived software context, normally represented by `project.md`.
- **Proposal**: an exploratory decision artifact used when the team is still choosing an approach or process direction.
- **Feature requirements document**: a durable capability-level document that explains why a feature exists, what is live today, and how it evolves across milestones.
- **Milestone**: a meaningful increment of a feature that may require one or more deliverables.
- **Deliverable**: one bounded execution slice with one deliverable specification.
- **Deliverable specification**: the execution contract for one deliverable, including scope, acceptance criteria, validation expectations, and implementation guidance.
- **Task**: the smallest execution unit, usually derived dynamically during implementation.

In this vocabulary, this document is a **platform proposal**. If approved, it should create one or more platform deliverables, each with its own deliverable specification. Likely deliverables include:

- Update PR templates and review labels.
- Add automated risk-tier labeling and optional size/change-shape signals.
- Add agent first-pass review.
- Define critical-path ownership and approval policy.
- Pilot stacked PRs for large deliverables.
- Add metrics dashboards for review queue health.

The Zazz authority boundary is important: agents may prepare review packages, run checks, generate summaries, perform QA, and comment on findings, but PR approval and merge remain human-controlled gates owned by the Deliverable Owner or another authorized reviewer.

## External Reference Pattern

This is a Warp-inspired process in the narrow sense that specification, automated review, and human approval are distinct stages. Zazz does not copy Warp's workflow wholesale. The Zazz process is: draft PRs are used for author-side automated review and cleanup, then ready PRs receive formal automated review and human approval.

For small actionable bugs, the issue or tracker item can become the lightweight execution contract. It should describe:

- observed behavior
- expected behavior
- reproduction steps or diagnostic evidence
- suspected scope, if known
- acceptance criteria
- required regression test or explicit reason one is not practical
- validation evidence required in the PR
- rollback or mitigation notes when operational risk exists

Zazz uses this distinction:

- **Small actionable bugs** can use a lightweight bug-fix specification embedded directly in Jira, Zazz Board, GitHub Issues, or the team's tracker.
- **Ambiguous or behavior-shaping bugs** should move into fuller Zazz documentation. If the bug reveals unclear product behavior, changes a public contract, affects durable feature behavior, or requires non-trivial design tradeoffs, update the feature requirements document as needed and create a reviewed deliverable specification before implementation.

This preserves the Zazz principle that implementation should execute against an approved contract, while allowing the contract for a narrow bug to live in the team's tracker instead of a separate markdown document.

Reference:

- Contributing guide: https://github.com/warpdotdev/warp/blob/master/CONTRIBUTING.md

## Additional Reference Patterns

Several other projects and tools reinforce the same direction.

- **OpenHands** provides a public PR review automation model that can post inline comments and require evidence in PR descriptions.
- **Worktrunk** is not a PR review system, but it is relevant because it is designed for parallel AI agent workflows using Git worktrees. Its useful lesson is operational: parallel agent work needs branch/worktree lifecycle management, hook points, CI visibility, PR links, and cleanup.
- **Hugging Face Transformers** and **verl** publish stricter agentic contribution policies. They emphasize no duplicate work, no low-value busywork PRs, human responsibility for every changed line, and disclosure of AI-assisted work. That disclosure requirement is useful for open source ecosystems where AI-assisted contributions may be exceptional or anonymous, but it is less useful for an internal process where AI-assisted implementation is the expected default.
- **Trunk** shows the value of pushing objective code-quality feedback into CI annotations before humans review.
- **Google, GitHub, and Microsoft review guidance** all support small, focused PRs, clear reviewer context, and tests for changed behavior.

Sources:

- OpenHands PR review plugin: https://github.com/OpenHands/extensions/tree/main/plugins/pr-review
- OpenHands PR review docs: https://docs.openhands.dev/sdk/guides/github-workflows/pr-review
- Worktrunk repository: https://github.com/max-sixty/worktrunk
- Worktrunk skill docs: https://github.com/max-sixty/worktrunk/blob/c8aa1848a3ba023ac42232d3341b9c040abd046d/skills/worktrunk/SKILL.md
- Hugging Face Transformers agent policy: https://github.com/huggingface/transformers/blob/main/.ai/AGENTS.md
- verl agent policy: https://github.com/verl-project/verl/blob/main/AGENTS.md
- Trunk GitHub Action: https://github.com/trunk-io/trunk-action
- Trunk Codex integration guidance: https://github.com/trunk-io/docs/blob/main/code-quality/overview/ide-integration/openai-codex-support.md
- Google small CL guidance: https://google.github.io/eng-practices/review/developer/small-cls.html
- Google review speed guidance: https://google.github.io/eng-practices/review/reviewer/speed.html
- GitHub guidance on helping reviewers: https://github.com/github/docs/blob/main/content/pull-requests/collaborating-with-pull-requests/getting-started/helping-others-review-your-changes.md
- Microsoft pull request guidance: https://github.com/microsoft/code-with-engineering-playbook/blob/main/docs/code-reviews/pull-requests.md

## Operating Model

Zazz uses this hybrid review model:

1. Use proposals, feature requirements documents, deliverable specifications, or lightweight bug-fix specifications before implementation when the change is non-trivial or risk-bearing.
2. Require PR template fields for intent, scope, evidence, risk tier, test plan, provenance/risk notes when relevant, and reviewer guidance.
3. Open implementation PRs as draft PRs first so the author can run checks, agent review, and cleanup before asking another human to review.
4. Run objective gates early: format, lint, typecheck, unit tests, security checks, dependency checks, generated-file consistency, and service-specific validations.
5. Run author-side agent review during the draft PR stage, then run formal agent review again when the PR is marked ready.
6. Label review risk automatically where practical, with size and file-count signals treated as advisory context rather than hard thresholds.
7. Use GH-stack for stacked PRs when a change is easier to review as ordered dependent branches.
8. Route PR review depth by risk tier.
9. Split hard-to-review work into stacked PRs or get explicit large-PR exception approval.
10. Require named human owners for critical paths regardless of agent or CI results.
11. Preserve human approval and merge authority for every tier, including every PR in a stack.

The cultural rule: human approvers are not being asked to re-check everything. They are being asked to review the risk summary, inspect the important parts of the diff, validate design and behavior, and decide whether the change should enter the system.

## Review Workflow

### Before Draft PR Opens

The author or agent should complete:

- self-review of the diff
- local or CI-equivalent checks
- removal of unrelated edits
- stack plan when the work will use GH-stack
- test evidence or explanation for missing evidence

### Draft PR Stage

The author opens a draft PR first. During this stage, automation and author-side agent review should help the developer find and fix issues before formal review begins.

Agents should use the `pr-builder` skill to create or refresh draft PR titles and bodies. That skill is intentionally
agent-facing: it packages the governing work item, deliverable specification or tracker record, stack context,
verification evidence, draft-readiness checklist, and reviewer guidance without turning the PR body into process
documentation.

Draft PR automation should:

- add advisory risk labels from path ownership, change type, and complexity signals
- add size or file-count labels when useful for review planning
- validate PR template fields
- run code quality checks
- trigger author-side agent review
- identify whether the required proposal, feature requirements document, deliverable specification, lightweight bug-fix specification, or linked issue is missing

The author should address critical and important agent findings, improve evidence, update the reviewer guide, and decide whether the PR should remain a single PR or become a GH-stack before marking it ready.

### Ready For Review

When the PR is marked ready for review, automation should:

- add advisory risk labels from path ownership, change type, and complexity signals
- validate PR template fields
- run code quality checks
- trigger formal agent first-pass review
- identify whether the required proposal, feature requirements document, deliverable specification, lightweight bug-fix specification, or linked issue is missing

### Before Human Review

The PR should have:

- passing required checks or documented failure reason
- no unresolved critical agent findings
- evidence section completed
- clear reviewer guide: files to review first, areas of concern, and known non-goals
- recommended review tier and rationale from the agent
- for stacked PRs, the stack map, branch order, and parent assumptions are clear

### Before Merge

The PR should have:

- required human approvals for its risk tier
- no unresolved critical or important review comments
- merge queue or up-to-date base validation
- rollback or monitoring notes when operational risk exists

Every PR in a stack needs human sign-off before merge. Stacking reduces the amount of context a human must review at once; it does not remove the human approval gate.

## Review Tiers

### Automated Tier

The automated tier is for low-risk changes where automated checks can do most of the verification work before a human performs a lighter final review.

Examples:

- docs-only edits
- deterministic generated-file refreshes
- formatting-only changes
- dependency patch bumps within an approved policy
- mechanical changes with strong test evidence

This tier does **not** mean auto-merge, unattended approval, or no human accountability. Final approval and merge remain human-controlled.

### Standard Tier

The standard tier is for normal application or service logic changes.

Requirements:

- passing checks
- agent first-pass review
- evidence section complete
- one human approval

### Critical Tier

The critical tier is for changes where failure can cause production incidents, data loss, security exposure, broken external contracts, or broad downstream rework.

Requirements:

- named owner or CODEOWNER approval
- agent first-pass review
- stronger evidence and regression coverage
- additional reviewer or domain lead when blast radius is high

### Large Exception

A large exception is a PR that exceeds the normal review budget but cannot reasonably be split.

Requirements:

- explain why it cannot be split
- provide a review map by file group
- identify the files requiring deepest human attention
- include stronger tests and runtime evidence
- get reviewer consent before expecting full review

## Criticality and Risk Signals

Criticality should not be determined only by repository paths. Path ownership is useful, but a safe-looking path can contain complex business logic, and a critical path can be touched indirectly through a shared helper, dependency, generated client, migration, or configuration change.

Risk should be assigned from a combination of:

- **Path category**: whether changed files sit in known sensitive areas such as auth, migrations, public APIs, infrastructure, or shared packages.
- **Change type**: whether the PR changes behavior, contracts, data shape, permissions, deployment wiring, error handling, retries, or rollback paths.
- **Blast radius**: how many services, browser clients, jobs, external consumers, or user workflows can be affected.
- **Complexity**: whether the touched code has high cyclomatic complexity, deeply nested conditionals, many state transitions, high coupling, or hard-to-exercise edge cases.
- **Churn and fragility**: whether the area has frequent recent changes, known bug history, flaky tests, brittle mocks, or repeated production incidents.
- **Observability and rollback**: whether failures would be easy to detect, isolate, and roll back.
- **Evidence quality**: whether tests and runtime evidence are strong enough for the risk being introduced.

Cyclomatic complexity is especially useful as a review-depth signal. A small PR that changes a high-complexity decision function can deserve more scrutiny than a larger mechanical PR. The same applies to changes with many branches, permissions, retries, asynchronous states, or cross-service side effects.

Default critical-path categories:

- **Authentication and authorization**: login, session handling, token validation, role checks, permission boundaries, account linking, SSO, and access-control middleware.
- **Sensitive data and privacy**: PII handling, secrets, credentials, logging of sensitive fields, data export, retention, deletion, anonymization, and consent flows.
- **External contracts**: public APIs, GraphQL schemas, REST request/response shapes, event schemas, SDK interfaces, webhook contracts, and backward-compatibility-sensitive behavior.
- **Persistence and migrations**: database schema changes, data migrations, destructive updates, backfills, indexes with operational risk, and transaction behavior.
- **Infrastructure and deployment**: CI/CD, Kubernetes, Terraform or IaC, Dockerfiles, runtime configuration, feature flags, routing, service discovery, and production environment wiring.
- **Shared libraries and platform packages**: common auth, logging, configuration, middleware, error handling, database clients, UI design systems, and packages imported by many services or clients.
- **Money, compliance, or customer commitments**: billing, payments, entitlements, audit trails, warranty or registration commitments, regulatory reports, and customer-facing SLAs.
- **Browser-client critical paths**: authentication flows, checkout or submission flows, destructive user actions, offline/cache behavior, telemetry and privacy controls, permissions prompts, and accessibility-critical flows.
- **Service critical paths**: inter-service communication, queues, retries, idempotency, rate limiting, timeout behavior, circuit breakers, and failure handling.

Each repo should map these categories to concrete paths through CODEOWNERS, risk labels, or standards, but that mapping is only the starting point. A reviewer or Deliverable Owner should be able to raise or lower the tier when the actual change is safer or riskier than the default.

Automation can help by adding advisory labels such as `risk/critical-path`, `risk/high-complexity`, `risk/high-churn`, `risk/public-contract`, or `risk/migration`.

## Agent First-Pass Review

The first-pass review agent should produce structured output, not a vague "looks good."

Required sections:

- summary of intent
- scope check: unrelated changes, hidden behavior changes, and deliverable specification alignment
- recommended review tier: automated, standard, critical, or large exception
- risk escalation rationale: path category, change type, blast radius, complexity, churn, observability, rollback safety, and test evidence
- correctness risks
- security and data-handling risks
- reliability and failure modes
- performance and scalability concerns
- test coverage assessment
- deployment, migration, rollback, and observability concerns
- files requiring human attention
- findings grouped as critical, important, suggestion, and nit

The agent should not approve the PR. It should prepare the PR for human review and reduce the amount of undifferentiated code the human has to inspect.

### Agent Risk Triage

The review agent should recommend raising the review tier when it sees:

- **Critical path files or contracts**: auth, permissions, public API contracts, schemas, migrations, deployment config, shared packages, browser critical flows, or inter-service communication.
- **Behavior-changing edits**: changed branching logic, validation rules, state transitions, retry behavior, caching, error handling, data writes, deletion behavior, or feature flag logic.
- **High blast radius**: shared code used by multiple services or clients, package exports, generated clients, common middleware, or code reached by high-volume user flows.
- **High complexity**: high cyclomatic complexity, deeply nested conditionals, many edge cases, async races, cross-service side effects, or logic that is hard to exhaustively test.
- **High churn or fragility**: files with recent repeated edits, known incident history, flaky tests, fragile mocks, or unclear ownership.
- **Weak rollback or observability**: changes that would be hard to detect, roll back, feature-flag off, or safely retry in production.
- **Insufficient evidence**: missing regression tests for bugs, missing API-level tests for contract changes, missing migration proof, or manual evidence standing in for automatable checks.

The agent's output should distinguish:

- **Detected facts**: files changed, APIs touched, tests added, commands run, missing evidence.
- **Risk inference**: why those facts increase or reduce review risk.
- **Recommendation**: keep current tier, escalate to standard, escalate to critical, request stack split, or request more evidence before human review.

Humans keep final authority. A Deliverable Owner or reviewer can override the agent's tier recommendation, but the override should be visible in the PR so the team can tune the heuristics over time.

Supporting source:

- AI checklist example: https://dev.to/suifeng023/the-ai-code-review-checklist-a-copy-paste-prompt-for-safer-pull-requests-3e58

## Testing and Regression Policy

Testing is the main way this process prevents agent-generated code from becoming review theater. A PR should prove that the deliverable specification or bug-fix contract is satisfied.

For bug fixes, the default rule is:

- every bug fix includes a regression test that would have failed before the fix and passes after the fix
- if a regression test is not practical, the PR explains why and provides stronger manual or runtime evidence
- reviewers treat "fixed without regression coverage" as an exception, not the norm

This aligns with Zazz's expectation that acceptance criteria and TDD are core mechanisms for proving the right software was built correctly.

### Test Layer Selection

The deliverable specification or lightweight bug-fix specification should name the required test layer before implementation starts.

Use the lowest layer that proves the behavior, plus higher-level tests when the bug crosses boundaries:

- **Unit tests**: pure functions, validation rules, state transitions, mapping logic, error handling branches, and isolated business rules.
- **Service or integration tests**: persistence, external clients, configuration, queue behavior, transactions, or multiple modules collaborating.
- **API-level tests**: request/response behavior, status codes, validation errors, auth behavior, and response shape.
- **Contract tests**: caller/provider compatibility, including Pact-style tests or equivalent checks when a service promises behavior to another service or external consumer.
- **End-to-end or workflow tests**: user journeys and multi-step workflows.
- **Manual validation evidence**: exploratory confirmation, visual review, or environment-specific behavior. It should not replace automated regression coverage when automation is practical.

### API Testing Guidance

For API defects, prefer an automated API-level regression test over a screenshot of a manual request.

Likely options:

- PactumJS or a similar Node API testing library for repeatable HTTP assertions in CI.
- Supertest-style tests when the Express app can be exercised in-process.
- Postman/Newman collections when the team already maintains shared API collections and wants them in CI.
- Hoppscotch for manual exploration and evidence capture, but not as the primary regression mechanism unless the collection can be exported and run automatically.

Manual API tools are still valuable. A PR can include a Postman or Hoppscotch request/response capture as evidence that the author exercised the fix. For regression prevention, the stronger bar is an automated test that CI runs on every future change.

### Bug-Fix Test Contract

A lightweight bug-fix specification in Jira, Zazz Board, GitHub Issues, or another tracker should include:

- what test would have failed before the fix
- which layer should capture the regression
- what command proves the regression test passes
- what edge cases should be included so the same class of bug does not reappear
- if no automated regression test is added, the documented exception and who accepted it

Example:

```text
Bug: `/v1/organizations/:id` returns 500 when the org has no primary contact.
Expected: returns 200 with `primaryContact: null`.
Regression test: API-level test creates org without contact and asserts 200 response shape.
Command: pnpm --filter organization-manager test -- organization-routes
Manual evidence: sample request/response from local environment.
```

### Reviewer Expectations for Tests

Reviewers should ask:

- Would this test have failed before the fix?
- Does the test prove behavior rather than implementation details?
- Does the test cover the user-visible or API-visible contract that broke?
- Are async assertions awaited and isolated so the test cannot pass falsely?
- Are mocks limited to boundaries that should be mocked, rather than replacing the behavior under review?
- Does the PR include enough edge cases to prevent the same class of defect from returning?

Agent first-pass review should also inspect test quality. An agent-generated test that only asserts the mocked implementation was called is not enough.

## Review Shape and Stacked PRs

### Reviewability Signals

PR size is a signal, not a policy by itself. A 30-file PR can be reviewable when the files follow one clear pattern, and a much smaller PR can be risky when it changes contracts, data, permissions, migrations, or high-complexity logic.

Use these signals to decide whether a PR should stay whole, become a GH-stack, or receive deeper review:

- number of concepts a reviewer must hold at once
- number of architectural layers touched
- whether the PR mixes foundation work with consumer work
- whether the diff crosses ownership boundaries
- whether generated or mechanical changes obscure important hand-written changes
- whether each review branch could have a clear acceptance/evidence story
- whether a human reviewer can honestly understand the change without relying on trust in the generator

### Stacked PR Model

Zazz expects active development to happen in Git worktrees. The normal case is one active deliverable, one branch, one worktree, and one PR.

A stacked branch workflow is an exception for larger deliverables or dependent deliverable sequences where one branch would produce a PR too large for honest human review, or where ordered PRs make review safer.

The intended model:

- **Standard deliverable**: one deliverable specification -> one worktree -> one branch -> one PR.
- **Single-lane stack**: one worktree lane -> several ordered branches -> one PR per branch.
- **Large deliverable stack**: one deliverable specification -> several stack slices -> one branch per slice -> one PR per slice.
- **Dependent deliverable stack**: several deliverables -> one deliverable specification per deliverable -> one branch per deliverable -> one PR per branch.
- **Competing approaches**: separate deliverables, not one stack.

In a stacked PR flow, PR 1 targets the integration branch. PR 2 targets PR 1's branch. PR 3 targets PR 2's branch, and so on. Each PR should show only its own incremental diff.

Use stacked PRs when:

- the deliverable crosses natural layers such as schema, service logic, API, UI, and rollout
- the single-PR diff would exceed the team's review budget
- the deliverable specification can name the intended stack slices before implementation starts
- the work can be split by stable boundaries such as migration, domain model, service behavior, API, UI, documentation, or rollout wiring
- one builder or agent benefits from one shared filesystem, dependency install, build cache, and scratch space while moving through related branches
- multiple agents or builders need a shallow dependent PR stack, with coordination clear enough to avoid editing the same worktree at the same time
- the team wants earlier human feedback on foundational decisions
- the stack can stay shallow, usually three or four PRs

Avoid stacked PRs when:

- the change is already small enough for honest review
- the stack would exceed four or five PRs without a clear reason
- each PR only makes sense as "part 1 of a function"
- the team lacks a merge procedure for dependent PRs
- CI or branch protection assumes every PR targets only the integration branch
- a lower slice is volatile and likely to invalidate all upper slices repeatedly
- the work would be clearer as separate deliverables
- the only reason for stacking is to keep coding before the deliverable specification is settled

### Stacked PR Process

1. The Deliverable Owner approves a deliverable specification that says this deliverable will use stacked PRs.
2. The specification defines the stack map: slice names, dependency order, acceptance criteria covered by each slice, expected reviewers, and merge order.
3. The builder or agent creates one worktree lane for the stack, then creates one branch per stack slice or dependent deliverable, using flat branch names that are safe for Zazz worktree layout.
4. The first branch targets the integration branch. Each later branch is based on the previous slice's branch.
5. Each branch gets its own PR. Every PR body links the deliverable specification and includes the stack map.
6. Agent first-pass review runs on each PR and checks whether the slice still matches the overall deliverable specification.
7. Human reviewers review bottom-up for the full stack, while upper PRs can still receive early review before lower PRs merge.
8. Approved slices merge bottom-up. If an early slice changes materially, upper slices are restacked and rechecked.
9. When the stack lands, durable knowledge is promoted back into the feature requirements document, `project.md`, or standards where applicable.

Example stack for a new API-backed feature milestone:

- PR 1: data model, migration, and repository tests.
- PR 2: service-layer behavior and unit tests.
- PR 3: HTTP/API contract, validation, and integration tests.
- PR 4: UI or caller integration behind a feature flag.
- PR 5: durable doc updates, rollout notes, and cleanup if not already included.

Example stack for a refactor-heavy deliverable:

- PR 1: behavior-preserving extraction with existing tests green.
- PR 2: new abstraction or interface with focused tests.
- PR 3: migrate one production call path to the new abstraction.
- PR 4: remove old path once coverage and runtime evidence are complete.

### Stacked PR Tooling

Zazz standardizes on GitHub `gh stack` for stacked branch and stacked PR workflows.

`gh stack` is the expected tool for:

- creating branches in dependency order
- navigating the stack
- keeping upper branches rebased on lower branches
- pushing the stack
- submitting linked draft PRs
- syncing local branches with GitHub state after parent branches merge

Worktrunk or native `git worktree` still provides local isolation. GH-stack manages the dependent branches and PRs inside that isolated lane.

References:

- [docs/using-gh-stack.md](using-gh-stack.md)
- GitHub `gh stack`: https://github.com/github/gh-stack
- GitHub `gh stack` overview: https://github.github.com/gh-stack/introduction/overview/

## Provenance and Risk Notes

If AI-assisted development is the default, requiring "AI-assisted" disclosure on every PR adds noise without improving review quality. The review process should assume that agents may have produced, modified, reviewed, or tested the change.

Instead of asking whether AI was used, the PR should disclose information that changes review risk, provenance, or accountability.

Useful provenance and risk notes include:

- whether the implementation was generated from an approved deliverable specification, lightweight bug-fix specification, or an ad hoc prompt
- whether the author reviewed the final diff and accepts responsibility for it
- whether any generated code was copied from an external source or third-party snippet
- whether the PR includes agent-generated tests, and whether those tests were reviewed for meaningful assertions
- whether the PR was produced by a fully autonomous run, a guided pair-programming session, or a manual follow-up edit after agent output
- whether any part of the PR depends on uncertain assumptions, generated migrations, generated schemas, generated API clients, or model-inferred behavior

Example PR note:

```text
Implementation generated from the approved deliverable specification.
Author reviewed the final diff, revised the service-layer changes, and ran the listed validation.
Agent-generated tests were reviewed to ensure they fail on the original bug and assert API-visible behavior.
```

The policy should not require disclosure merely because an agent wrote the code. It should require disclosure when the way the work was produced affects review depth, evidence expectations, or trust boundaries.

This is also consistent with the broader recommendation: review should be based on risk, evidence, and ownership, not on whether a human or agent typed the first draft.

## Human Reviewer Expectations

Human reviewers should focus on:

- Is this the right change for the problem?
- Does it preserve system contracts?
- Does it fit local architecture and ownership boundaries?
- Are the tests meaningful rather than just numerous?
- Are failure modes and rollback clear?
- Are there security, data, privacy, or operational risks?
- Is the PR small enough to review honestly?
- Does the agent's risk tier recommendation make sense?

Humans should not spend review time on:

- formatting
- import ordering
- trivial lint issues
- generated output consistency when a deterministic check can verify it
- changelog or template omissions that automation can catch

## Metrics

Track these per team and per service:

- PRs opened per week by workflow type: guided agent session, autonomous agent run, manual follow-up edit, or mixed.
- Median and 75th percentile review turnaround by risk tier.
- Percentage of PRs converted from single PRs into GH-stacks during draft review.
- Time to first review.
- Time from review requested to merge.
- Number of human review rounds.
- Number of AI findings fixed before human review.
- Number of risk-tier escalations and overrides.
- Post-merge defects by PR size and risk tier.
- Revert rate.
- Percentage of PRs with complete evidence.
- Percentage of bug fixes with regression tests.

Do not set a formal first-response SLA before the pilot. Measure the process first, then set realistic targets for standard and critical PRs.

The goal is not simply faster merges. The goal is fewer overloaded reviews, fewer risky rubber-stamps, and better signal for where human attention is needed.

## Rollout Plan

### Phase 1: Baseline Platform Deliverable

- Create a deliverable specification for PR template, risk-label, and evidence-gate changes.
- Update PR template with proposal, feature, deliverable specification, risk tier, evidence, test plan, provenance/risk notes, and reviewer guide fields.
- Add advisory review-shape signals when useful.
- Define initial critical-path categories and CODEOWNERS.
- Start measuring review time, review rounds, draft-stage AI findings, GH-stack usage, and bug regression coverage.

### Phase 2: Agent First-Pass Review Deliverable

- Create a deliverable specification for the agent-review workflow and required review output shape.
- Add author-side AI review for draft PRs and formal AI review for ready PRs.
- Require no unresolved critical AI findings before human review.
- Add repo-specific review instructions so the agent reviews against architecture, testing expectations, service boundaries, and risk-tier heuristics.

### Phase 3: Risk-Tiered Routing Deliverable

- Create a deliverable specification for routing rules, CODEOWNERS behavior, complexity signals, and exception handling.
- Route standard and critical PRs differently.
- Define automated-tier PRs as low-risk changes that receive simplified human review after CI and agent checks are clean.
- Require explicit human owners for critical paths.

### Phase 4: Stack-First Large Deliverable Pilot

- Create a deliverable specification for the stacked PR pilot.
- Add guidance for GH-stack, stack maps, and single-worktree lanes.
- Require split plans for hard-to-review deliverables.
- Use Worktrunk or native worktrees for local isolation and GH-stack for dependent PR branches.
- Add cleanup and merge procedures so stacks do not become long-lived branches.

### Phase 5: Continuous Calibration

- Review false positives and false negatives from AI review.
- Sample automated-tier approvals for quality and missed risk.
- Adjust critical-path definitions.
- Tune review-shape guidance based on actual defect and review data.
- Measure first-response time during the pilot before setting a formal SLA.

## Open Decisions

- Which repo-specific paths map to the default critical-path categories for service repos, browser-client repos, and mixed monorepos?
- Which complexity and churn signals are practical to collect automatically?
- Which provenance and risk notes should be required when the implementation path affects review depth or trust boundaries?
- Which tool should provide author-side draft PR review and formal ready PR review?
- What is the minimum human review expectation for automated-tier PRs after CI and agent checks pass?
- After piloting the process, what first-response targets are realistic for standard and critical PRs?
