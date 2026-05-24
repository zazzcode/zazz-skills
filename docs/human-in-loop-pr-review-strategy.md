# Human-in-the-Loop PR Review Strategy for Agent-Generated Code

## Executive Summary

Agentic development changes the bottleneck. Code generation gets cheaper, but reviewer
attention does not. The Zazz response is a risk-tiered, evidence-gated review process:
agents prepare, package, and pre-review work; humans retain approval and merge authority.

Core rules:

- Require clear intent and evidence before formal human review.
- Use `pr-builder` for draft-first PR title/body packaging and `pr-review` for automated
  review of the draft branch or submitted PR.
- Review against the governing specification, the PR evidence, and repo standards loaded
  through `<DOCS_ROOT>/standards/index.yaml`.
- Route review depth by risk, not by one flat rule for every PR.
- Keep PRs reviewable; use stacked PRs when one PR would overload reviewer context.
- Treat bug fixes as execution contracts too, often through a lightweight tracker item.
- Require meaningful regression coverage for bug fixes by default.
- Preserve named human ownership for critical paths.
- Measure queue health and defect outcomes before setting hard service-level targets.

The goal is not to remove humans from review. The goal is to reserve human judgment for
product correctness, system contracts, architecture fit, risk, evidence quality, and
merge readiness.

## Why This Strategy

Agent-assisted development changes the review problem in predictable ways:

- Agents can produce more code faster than humans can review it.
- Large diffs become more likely unless the process actively keeps work reviewable.
- Reviewers fatigue when one PR touches too many concepts, files, or layers.
- CI can prove some objective properties, but it does not prove product correctness,
  architecture fit, rollback safety, or whether tests assert the right behavior.
- Agent-generated tests can create false confidence when they are numerous but shallow,
  mock-heavy, or coupled to private implementation details.

The recommended strategy follows from those failure modes:

- **Draft-first PRs** create a place for automated checks and author-side `pr-review`
  before a human is asked to spend attention.
- **Risk-tiered routing** keeps low-risk work moving while preserving deeper review for
  changes with real blast radius.
- **Standards-driven review** keeps review guidance repo-specific without bloating the
  generic methodology.
- **Evidence gates** make the PR explain what was proven, how it was proven, and what
  still requires human judgment.
- **Stacked PRs** preserve human comprehension when one deliverable crosses natural
  layers.
- **Human-controlled approval and merge** preserves accountability for the final product
  decision.

This is deliberately not a "more process everywhere" recommendation. The process should
add structure where agent speed would otherwise reduce review quality, and it should stay
light where automation and a focused human review are enough.

## Strategy Examples

### Small Actionable Bug

A route returns `500` when an organization has no primary contact.

Recommended shape:

- lightweight bug-fix specification in the tracker
- one draft PR
- API-level regression test that creates the missing-contact case and asserts the stable
  response shape
- `pr-review` checks that the test would fail before the fix, that it asserts API-visible
  behavior, and that no unrelated service behavior changed
- standard human review unless auth, tenant boundaries, or data integrity are involved

Why this works: the bug has a narrow contract, so a full deliverable specification would
add overhead. The regression test and PR evidence are the durable protection.

### Browser Client Workflow

A UI change modifies a destructive user action, such as deleting a record or submitting a
customer-facing form.

Recommended shape:

- deliverable specification when behavior, copy, permissions, or workflow state changes
- frontend/browser standards loaded through the standards index
- tests for state transitions and realistic edge cases such as disabled state, failed
  request, retry, permission denial, and success confirmation
- manual evidence for visual fit or UAT where automation cannot judge quality
- critical tier if data loss, permissions, privacy, or customer commitments are involved

Why this works: browser-client risk is often in edge states, not the happy path. Review
needs both automated behavior evidence and human judgment about workflow correctness.

### Backend Service And Database Change

A deliverable adds a schema field, writes it from service logic, and exposes it through an
API.

Recommended shape:

- deliverable specification with explicit scope and acceptance criteria
- likely stacked PRs: migration/repository, service behavior, API contract, caller/UI
- database, backend, API, and testing standards selected through
  `<DOCS_ROOT>/standards/index.yaml`
- regression or contract tests for realistic null/default/backfill/permission cases
- critical tier if migration, compatibility, or rollback risk is meaningful

Why this works: each layer has a different review concern. Stacking lets humans review
the migration contract before consuming layers depend on it.

### Mechanical Or Generated Refresh

A deterministic generated client or schema artifact is refreshed after an approved
contract change.

Recommended shape:

- automated or standard tier depending on the artifact's blast radius
- generated-artifact standard loaded through the standards index
- reproducibility command or CI proof
- human review focused on the source contract and whether generated output matches it,
  not line-by-line generated code inspection

Why this works: the reviewer should spend attention on the source of truth and
reproducibility, not on thousands of deterministic generated lines.

## Zazz Methodology Fit

This document is a platform strategy inside the Zazz methodology. It explains how PR
review should work when agents implement more of the code.

Relevant Zazz artifacts:

- **Proposal**: exploratory decision artifact.
- **Feature requirements document**: durable capability-level context.
- **Deliverable specification**: execution contract for one deliverable, including scope,
  acceptance criteria, validation expectations, and implementation guidance.
- **Lightweight bug-fix specification**: tracker-native contract for a narrow actionable
  bug.
- **Standards**: repo-specific engineering and review rules under
  `<DOCS_ROOT>/standards/`, indexed by `<DOCS_ROOT>/standards/index.yaml`.

Authority boundary:

- Agents may prepare PRs, run checks, summarize risk, review diffs, comment on findings,
  and recommend a review tier.
- Agents may not approve, mark ready on behalf of the Owner, merge, or override human
  review requirements.
- The Deliverable Owner or another authorized human owns final approval and merge.

## Reference Patterns

Several external patterns support the Zazz approach. They are not copied wholesale; each
contributes one useful lesson:

- Warp separates specification, automated review, and human approval. Zazz uses the same
  separation but keeps merge authority human-owned.
- OpenHands demonstrates automated PR review that can post comments and require evidence.
  Zazz adopts the first-pass review idea while grounding findings in specifications and
  repo standards.
- Worktrunk is relevant for parallel agent workflows and worktree lifecycle management.
  Zazz keeps local isolation in worktrees and uses GH-stack for dependent PR review.
- Hugging Face Transformers and verl emphasize no duplicate work, no low-value busywork
  PRs, and human responsibility for changed code. Zazz applies that lesson to agentic
  slop, redundant code, and low-value tests.
- Trunk shows the value of objective code-quality feedback before human review. Zazz
  treats those checks as early gates, not substitutes for product review.
- Google, GitHub, and Microsoft guidance all reinforce small focused PRs, clear reviewer
  context, and tests for changed behavior. Zazz extends that guidance with explicit
  risk tiers and stacked review for agent-generated work.

Sources:

- OpenHands PR review plugin: https://github.com/OpenHands/extensions/tree/main/plugins/pr-review
- OpenHands PR review docs: https://docs.openhands.dev/sdk/guides/github-workflows/pr-review
- Worktrunk repository: https://github.com/max-sixty/worktrunk
- Hugging Face Transformers agent policy: https://github.com/huggingface/transformers/blob/main/.ai/AGENTS.md
- verl agent policy: https://github.com/verl-project/verl/blob/main/AGENTS.md
- Trunk GitHub Action: https://github.com/trunk-io/trunk-action
- Google small CL guidance: https://google.github.io/eng-practices/review/developer/small-cls.html
- Google review speed guidance: https://google.github.io/eng-practices/review/reviewer/speed.html
- GitHub guidance on helping reviewers: https://github.com/github/docs/blob/main/content/pull-requests/collaborating-with-pull-requests/getting-started/helping-others-review-your-changes.md
- Microsoft pull request guidance: https://github.com/microsoft/code-with-engineering-playbook/blob/main/docs/code-reviews/pull-requests.md

## Operating Model

Zazz uses this hybrid review model:

1. Define intent before implementation through a proposal, feature requirements document,
   deliverable specification, or lightweight bug-fix specification when the change is
   non-trivial or risk-bearing.
2. Open implementation PRs as draft PRs first.
3. Use `pr-builder` to keep PR titles and bodies accurate: intent, scope, governing
   context, evidence, risk notes, stack context, and reviewer guidance.
4. Run objective gates early: format, lint, typecheck, tests, security checks,
   dependency checks, generated-file consistency, and service-specific validations.
5. Use `pr-review` during draft cleanup and again when useful at ready-for-review time.
6. Route PR review depth by risk tier.
7. Split hard-to-review work into stacked PRs or get explicit large-PR exception approval.
8. Preserve human approval and merge authority for every tier, including every PR in a
   stack.

Human reviewers are not being asked to re-check everything. They review the risk summary,
inspect the important parts of the diff, validate design and behavior, and decide whether
the change should enter the system.

## Standards-Driven Review

Repo-specific review policy belongs in `<DOCS_ROOT>/standards/`, not in this strategy
document and not in the generic `pr-review` skill.

The standards index should make standards discoverable by changed path, language,
service, domain, or activity. Useful tags include:

- `frontend`
- `browser-client`
- `accessibility`
- `api`
- `backend`
- `database`
- `migration`
- `auth`
- `security`
- `integration`
- `generated`
- `testing`

The `pr-review` skill should:

1. Read `AGENTS.md` to resolve the docs root and review workflow.
2. Inspect the diff and governing specification or tracker item.
3. Load `<DOCS_ROOT>/standards/index.yaml`.
4. Select only the standards that match the changed paths and activities.
5. Review against those standards first, then apply general engineering judgment.
6. Report missing or stale standards coverage as residual review risk.

This keeps the methodology generic while letting each repo define what "good" means for
its frontend, services, database, tests, security model, and release process.

## Review Workflow

### Before Draft PR Opens

The author or agent should complete:

- self-review of the diff
- local or CI-equivalent checks
- removal of unrelated edits
- stack plan when the work will use GH-stack
- test evidence or explanation for missing evidence

### Draft PR Stage

Draft PRs are for author-side cleanup before formal review.

Expected automation and agent support:

- `pr-builder` creates or refreshes the PR title/body.
- objective checks run early
- advisory risk and size labels are applied where useful
- template fields are validated
- `pr-review` runs against the draft branch as an author-side automated review pass
- missing governing context or evidence is flagged

The author should address critical and important findings, improve evidence, and decide
whether the PR should stay whole or become a stack before marking it ready.

### Ready For Review

Before requesting human review, the PR should have:

- passing required checks or a documented failure reason
- no unresolved critical agent findings
- evidence section completed
- clear reviewer guidance
- recommended review tier and rationale
- stack map and parent assumptions when stacked

The human reviewer may run `pr-review` again at this point, especially for standard,
critical, large exception, or stack PRs.

### Before Merge

Before merge, the PR should have:

- required human approvals for its risk tier
- no unresolved critical or important review comments
- merge queue or up-to-date base validation
- rollback or monitoring notes when operational risk exists

Every PR in a stack needs human sign-off before merge. Stacking reduces context load; it
does not remove the human gate.

## Review Tiers

### Automated Tier

Low-risk changes where automated checks can do most verification before a lighter human
review.

Examples:

- docs-only edits
- deterministic generated-file refreshes
- formatting-only changes
- dependency patch bumps within an approved policy
- mechanical changes with strong test evidence

This tier does not mean auto-merge, unattended approval, or no human accountability.

### Standard Tier

Normal application or service logic changes.

Requirements:

- passing checks
- `pr-review` first pass
- evidence section complete
- one human approval

### Critical Tier

Changes where failure can cause production incidents, data loss, security exposure,
broken external contracts, or broad downstream rework.

Requirements:

- named owner or CODEOWNER approval
- `pr-review` first pass
- stronger evidence and regression coverage
- additional reviewer or domain lead when blast radius is high

### Large Exception

A PR that exceeds the normal review budget but cannot reasonably be split.

Requirements:

- explain why it cannot be split
- provide a review map by file group
- identify files requiring deepest human attention
- include stronger tests and runtime evidence
- get reviewer consent before expecting full review

## Criticality and Risk Signals

Risk should be assigned from a combination of:

- **Path category**: known sensitive areas such as auth, migrations, public APIs,
  infrastructure, or shared packages.
- **Change type**: behavior, contracts, data shape, permissions, deployment wiring,
  retries, error handling, rollback paths, or feature flags.
- **Blast radius**: services, browser clients, jobs, external consumers, or user
  workflows affected.
- **Complexity**: high cyclomatic complexity, many state transitions, async races,
  cross-service side effects, or logic that is hard to test.
- **Churn and fragility**: frequent recent changes, known bug history, flaky tests,
  brittle mocks, or unclear ownership.
- **Observability and rollback**: whether failures are easy to detect, isolate, and roll
  back.
- **Evidence quality**: whether tests and runtime evidence match the introduced risk.

Default critical-path categories:

- authentication and authorization
- sensitive data and privacy
- external contracts
- persistence and migrations
- infrastructure and deployment
- shared libraries and platform packages
- money, compliance, or customer commitments
- browser-client critical paths
- service critical paths

Each repo should map these categories to concrete standards, CODEOWNERS, and labels.
Reviewers and Deliverable Owners can raise or lower the tier when the actual change is
safer or riskier than the default.

## PR Review Skill Strategy

The `pr-review` skill is the automated review surface for this strategy. It can be run by
the PR author on their own draft branch or by a human reviewer evaluating someone else's
submitted PR.

It should produce structured findings, not a vague "looks good." It should prioritize:

- correctness and behavioral regressions
- specification and acceptance-criteria alignment
- standards conformance through `<DOCS_ROOT>/standards/index.yaml`
- realistic edge-case coverage
- test quality, including low-value or duplicate tests
- security, data, privacy, and operational risk
- scope drift and unrelated changes
- redundant code, agentic slop, and unnecessary abstraction
- review tier recommendation and rationale

The skill should distinguish:

- **Detected facts**: files changed, APIs touched, tests added, commands run, missing
  evidence.
- **Risk inference**: why those facts affect review depth.
- **Recommendation**: keep current tier, escalate, request stack split, or request more
  evidence before human review.

When the diff touches a specialized surface, the skill should load only the relevant
repo standards and any optional domain references. This prevents context bloat while
still giving frontend, backend, database, auth, integration, and generated-artifact
reviews enough shape.

## Testing and Regression Policy

Testing prevents agent-generated code from becoming review theater. A PR should prove
that the deliverable specification or bug-fix contract is satisfied.

For bug fixes:

- include a regression test that would have failed before the fix and passes after it
- if automated regression coverage is not practical, explain why and provide stronger
  manual or runtime evidence
- treat "fixed without regression coverage" as an exception

Test planning should prefer meaningful coverage over test volume:

- choose the lowest layer that proves the behavior
- add higher-level tests when the bug crosses boundaries
- cover realistic field edge cases, not fanciful permutations
- prefer compact table-driven or parameterized tests when several cases share one
  behavior boundary
- assert observable behavior or stable contracts rather than private mechanics
- avoid mock-only tests that merely confirm collaborators were called
- reuse existing fixtures and stronger nearby tests when they already prove the behavior

For API defects, prefer automated API-level regression tests over manual request
screenshots. Manual API tools can provide evidence, but future regression prevention
requires an automated check when practical.

A lightweight bug-fix specification should include:

- observed behavior
- expected behavior
- reproduction steps or diagnostic evidence
- acceptance criteria
- test layer and command
- realistic edge cases to cover
- validation evidence required in the PR
- rollback or mitigation notes when operational risk exists
- documented exception and approver if no automated regression test is added

## Review Shape and Stacked PRs

PR size is a signal, not a policy by itself. A large mechanical PR can be reviewable,
and a smaller PR can be risky when it changes contracts, data, permissions, migrations,
or high-complexity logic.

Use these signals to decide whether a PR should stay whole, become a stack, or receive
deeper review:

- number of concepts a reviewer must hold at once
- number of architectural layers touched
- whether foundation work is mixed with consumer work
- whether the diff crosses ownership boundaries
- whether generated or mechanical changes obscure hand-written changes
- whether each review branch could have a clear acceptance/evidence story
- whether a human reviewer can honestly understand the change without trusting the
  generator

Zazz expects active development to happen in Git worktrees. The normal case is one
deliverable, one branch, one worktree, and one PR. A stacked branch workflow is an
exception for larger deliverables or dependent deliverable sequences where ordered PRs
make review safer.

Use stacked PRs when:

- the deliverable crosses natural layers such as schema, service logic, API, UI, and
  rollout
- the single-PR diff would exceed the team's review budget
- the specification can name stack slices before implementation starts
- work can be split by stable boundaries
- the team wants earlier human feedback on foundational decisions

Avoid stacked PRs when:

- the change is already small enough for honest review
- each PR only makes sense as "part 1 of a function"
- the team lacks a merge procedure for dependent PRs
- CI or branch protection cannot handle dependent PRs
- the lower slice is volatile enough to invalidate upper slices repeatedly
- the only reason for stacking is to continue coding before the specification is settled

For command-level stack workflow, use the `gh-stack` skill and
[docs/using-gh-stack.md](using-gh-stack.md).

## Provenance and Risk Notes

If AI-assisted development is the default, requiring "AI-assisted" disclosure on every
PR adds noise. The review process should assume agents may have produced, modified,
reviewed, or tested the change.

Instead, disclose information that changes review depth, evidence expectations, or trust
boundaries:

- implementation source: approved specification, lightweight bug-fix specification, or
  ad hoc prompt
- whether the author reviewed the final diff and accepts responsibility
- copied external snippets or generated code from outside the repo
- agent-generated tests and whether their assertions were reviewed
- autonomous run versus guided session versus manual follow-up edit
- uncertain assumptions, generated migrations, generated schemas, generated clients, or
  model-inferred behavior

Review should be based on risk, evidence, and ownership, not on whether a human or agent
typed the first draft.

## Human Reviewer Expectations

Human reviewers should focus on:

- Is this the right change for the problem?
- Does it preserve system contracts?
- Does it follow repo standards?
- Does it fit local architecture and ownership boundaries?
- Are tests meaningful and edge cases realistic?
- Are failure modes and rollback clear?
- Are there security, data, privacy, or operational risks?
- Is the PR small enough to review honestly?
- Does the risk tier recommendation make sense?

Humans should not spend review time on:

- formatting
- import ordering
- trivial lint issues
- generated output consistency when deterministic checks can verify it
- template omissions that automation can catch

## Metrics

Track these per team and per service:

- PRs opened per week by workflow type
- median and 75th percentile review turnaround by risk tier
- percentage of PRs converted into stacks during draft review
- time to first review
- time from review requested to merge
- number of human review rounds
- number of agent findings fixed before human review
- number of risk-tier escalations and overrides
- post-merge defects by PR size and risk tier
- revert rate
- percentage of PRs with complete evidence
- percentage of bug fixes with regression tests
- percentage of `pr-review` findings later judged false positive or missed risk

Do not set a formal first-response SLA before the pilot. Measure first, then set
realistic targets for standard and critical PRs.

The goal is not simply faster merges. The goal is fewer overloaded reviews, fewer risky
rubber-stamps, and better signal for where human attention is needed.

## Rollout Plan

### Phase 1: Baseline Platform Deliverable

- Create a deliverable specification for PR template, risk-label, and evidence-gate
  changes.
- Update PR template with governing context, risk tier, evidence, test plan,
  provenance/risk notes, and reviewer guide fields.
- Add advisory review-shape signals when useful.
- Define initial critical-path categories in standards, CODEOWNERS, or both.
- Start measuring review time, review rounds, draft-stage findings, stack usage, and
  bug regression coverage.

### Phase 2: PR Review Skill Deliverable

- Create a deliverable specification for the `pr-review` workflow.
- Add author-side `pr-review` for draft PRs and reviewer-side `pr-review` for ready PRs
  where useful.
- Require no unresolved critical agent findings before human review.
- Add repo-specific standards so review agents evaluate architecture, testing, service
  boundaries, security, and risk-tier heuristics through the standards index.

### Phase 3: Risk-Tiered Routing Deliverable

- Create a deliverable specification for routing rules, CODEOWNERS behavior, complexity
  signals, and exception handling.
- Route standard and critical PRs differently.
- Define automated-tier PRs as low-risk changes that receive simplified human review
  after checks and `pr-review` are clean.
- Require explicit human owners for critical paths.

### Phase 4: Stack-First Large Deliverable Pilot

- Create a deliverable specification for the stacked PR pilot.
- Add guidance for GH-stack, stack maps, and single-worktree lanes.
- Require split plans for hard-to-review deliverables.
- Use worktrees for local isolation and GH-stack for dependent PR branches.
- Add cleanup and merge procedures so stacks do not become long-lived branches.

### Phase 5: Continuous Calibration

- Review false positives and false negatives from `pr-review`.
- Sample automated-tier approvals for quality and missed risk.
- Adjust critical-path definitions.
- Tune standards and review-shape guidance based on defect and review data.
- Measure first-response time during the pilot before setting a formal SLA.

## Open Decisions

- Which repo-specific paths map to critical-path categories for service repos,
  browser-client repos, and mixed monorepos?
- Which complexity and churn signals are practical to collect automatically?
- Which provenance and risk notes should be required when implementation path affects
  review depth or trust boundaries?
- What is the minimum human review expectation for automated-tier PRs after checks and
  `pr-review` pass?
- After piloting the process, what first-response targets are realistic for standard and
  critical PRs?
