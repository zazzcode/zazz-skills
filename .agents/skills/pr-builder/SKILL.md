---
name: pr-builder
description: Help an agent create, draft, refine, or update a pull request title and body from the current changes and verification evidence, with draft PR creation as the default Zazz workflow.
---

# PR Builder Skill

## Startup Sequence

Before drafting or updating PR content:
1. Use `AGENTS.md` as the source of truth for repo-specific settings such as tracking system, project-code conventions, docs root, and review workflow rules. Read it if that context is not already available, then inspect any PR templates or repo-specific review conventions.
2. Use repo guidance to determine the primary work-tracking system in use for this project:
   - Zazz deliverable
   - Jira issue
   - Avaza task
   - another repo-specific ticket system
3. Gather the authoritative links or paths that govern the PR:
   - primary work item link
   - deliverable specification, lightweight bug-fix specification, or external specification record
   - feature, proposal, or additional context only when they materially affect review
4. Gather the diff, commits, and verification evidence available.
5. Determine whether this is a single PR or a GH-stack PR, and capture stack position, parent branch, and dependent PRs when relevant.
6. Separate confirmed facts from assumptions or missing validation.
7. If a critical governing detail is still missing or ambiguous, ask the user a short targeted clarification before finalizing the PR draft.
8. Then draft concise PR content that is accurate, evidence-backed, and suitable for opening a draft PR by default.

## Mission

Create a clear pull request title and body, optimized first for opening a useful draft PR
that can support `pr-review`, human review, and cleanup before the Deliverable Owner
marks it ready for formal review.

The PR package should accurately explain:

- which governing deliverable, ticket, specification, or tracker record this PR belongs to
- what changed
- why it changed
- how it was verified
- which acceptance criteria were covered by automated tests versus manual confirmation
- whether the relevant automated tests passed
- why the PR is draft, or why it is ready if the owner has explicitly moved it out of draft
- what review-relevant risks or constraints remain
- for stacked PRs, where this PR sits in the stack and what parent assumptions it relies on

This skill packages work for review. It is a PR-document skill for creating and
maintaining PR descriptions, especially draft PR descriptions used by the
human-in-the-loop review workflow. It can be used by an implementation agent before
`pr-review` or by an agent running the `qa-testing` skill after verification work converges.

It does not review code, replace implementation, QA judgment, Deliverable Owner
judgment, approval, or merge authority. It may help create or refine PR content, but it
must never approve, mark ready on behalf of the owner, or merge a PR.

## Use This Skill When

- the user or another agent asks to create, draft, update, or polish a PR
- an implementation agent needs a draft PR package before `pr-review` or human review
- an agent running the `qa-testing` skill has completed verification and needs a high-quality PR description
- a deliverable needs consistent reviewer-facing evidence
- the repo has templates or conventions that should be applied reliably

## Required Inputs

Gather as many of these as are available:

1. Branch or diff against the target branch
2. Commit list or summary of changes
3. Primary work item link or identifier:
   - Zazz deliverable
   - Jira issue
   - Avaza task
   - repo-specific ticket
4. Deliverable specification path, Zazz Board record, or external specification record when the work follows the Zazz methodology
5. Acceptance criteria or scenario groupings from the governing specification when available
6. Test commands and results
7. Manual validation steps
8. Additional domain-specific verification notes when relevant, such as API checks, data inspection, admin workflows, background jobs, or operational checks
9. Stack context when this PR is part of a GH-stack: stack map, parent branch, base branch, sibling PRs, and which acceptance criteria this PR owns
10. Known risks, migrations, feature flags, or rollout notes

If a detail is missing, derive it from repository state when possible. Do not invent verification that did not happen.

If a required authoritative identifier cannot be derived reliably, ask the user instead of guessing.
Examples:
- Jira issue key
- Zazz deliverable link or code
- Avaza task link
- target specification when multiple plausible specifications exist

## Draft PR Handling

Draft is the default Zazz PR state. Create or update the PR content as a draft package unless the user explicitly says
the Deliverable Owner has decided the PR is ready for formal review.

If the PR is draft:

1. Make the draft state obvious near the top of the PR body.
2. Prefer a clear draft marker in the title only when repo conventions allow or expect it. Do not over-prefix titles if GitHub draft state is enough.
3. Briefly state what remains before the owner can mark it ready: author-side agent review, missing evidence, unresolved findings, stack dependency, or owner review.
4. Include an author-side review checklist: checks to run, automated review to request, findings to resolve, and evidence to update.
5. Keep the rest of the PR focused on the current change and current review ask.

If the PR is ready for review:

1. Only present it as ready when the user or Deliverable Owner explicitly says it should be ready.
2. Do not include draft markers in the title or body.
3. Present the PR as a bounded, reviewable change with verification evidence.

The skill may explain what is missing before ready-for-review, but it should not decide to convert a PR from draft to
ready on its own. That transition is interactive and owner-controlled.

## Tracking Context Detection

Before drafting the PR, determine which system should anchor the title/body:

1. Check `AGENTS.md` for explicit guidance.
2. Inspect deliverable paths and naming conventions:
   - Zazz: deliverable codes such as `ZAZZ-142`
   - Jira: issue keys such as `PROJ-453`
   - other repo-specific folder or branch conventions
3. Prefer the system that repo guidance declares as authoritative for the project.
4. If multiple systems are relevant, lead with the primary work item and include at most a few supporting links.
5. If the governing system is unclear, ask the user which system should anchor the PR instead of guessing.
6. Once the system is known, ask for the authoritative issue ID, deliverable link, task URL, or specification if it is not already available from provided context.

## Interactive Clarification Rules

This skill is agent-focused, but it runs inside a human-in-the-loop workflow. When the PR needs authoritative context
that is not already available from repo guidance or user-provided context, ask the user a short targeted question.

Ask a concise clarification when:

1. The repo uses Jira, Zazz, Avaza, or another tracker, but the primary issue/deliverable/task ID or URL is missing.
2. Multiple tickets, deliverables, or specifications could plausibly govern the same diff.
3. Manual validation or UAT expectations are missing and cannot be inferred safely.
4. A repo PR template requires a field that the agent cannot fill accurately from repo state.
5. The project system is known, but the PR still needs a human-supplied field such as:
   - Jira issue key
   - Zazz deliverable code or link
   - Avaza task URL
   - governing specification path or external record when several specifications exist

Do not ask broad open-ended questions.
Ask only for the minimum missing fact needed to make the PR accurate.
Do not infer authoritative ticket IDs from branch names or commit messages unless `AGENTS.md` explicitly authorizes that convention.

Good examples:

- `This repo uses Jira. What is the issue key for this PR?`
- `What is the Jira issue key for this PR?`
- `Which Zazz deliverable should be linked at the top of this PR?`
- `Please provide the Avaza task URL to include at the top of the PR.`
- `Which specification should anchor this PR: auth-session-hardening.md or login-hardening.md?`
- `What manual validation steps should reviewers follow for the admin flow?`

If the user does not have the answer or prefers not to provide it:

1. Keep the PR draft accurate but neutral.
2. Mark the missing field clearly as needing human completion.
3. Do not invent the missing ID, link, or validation evidence.

## Workflow

1. Inspect the repo for PR conventions:
   - `.github/pull_request_template.md`
   - `.github/PULL_REQUEST_TEMPLATE.md`
   - `.github/pull_request_template/*.md`
   - `.github/PULL_REQUEST_TEMPLATE/*.md`
   - other PR templates or contributing docs
   - `.agents/skills/pr-builder/PR-TEMPLATE.md` as the default fallback template for this skill
2. Resolve the project's tracking system from repo guidance and capture the link block that should appear near the top of the PR.
3. If the authoritative PR-specific issue ID, deliverable link, task URL, or governing specification is missing, ask the user for it before finalizing the PR draft.
4. Read the diff and identify the real user-facing or system-facing behavior change.
5. Read supporting docs that define intent when present:
   - deliverable specification, lightweight bug-fix specification, or external specification record
   - verification evidence, including evidence produced by an agent running the `qa-testing` skill when available
   - issue or ticket context supplied by the user
6. Separate the PR content into:
   - context and links
   - why this PR exists
   - functional behavior summary
   - draft state and author-side review checklist by default; ready-for-review state only when owner-confirmed
   - stack map when relevant
   - reviewer notes with checklist-style review items
   - acceptance-criteria review checklist sourced from the specification when available
   - testing and verification
   - manual or UAT validation steps mapped to acceptance criteria when possible
   - additional verification guidance only for concerns that actually matter to this PR, following repo templates or extensions when present
   - risks, rollout notes, or review blockers inside the current PR scope
7. Produce a concise PR title and body that match the repo's template if one exists.

## Template Precedence

Use the first applicable source below:

1. Repo PR template under `.github/`
2. This skill's fallback template at `.agents/skills/pr-builder/PR-TEMPLATE.md`

If a repo PR template exists, it is the primary structure.
Do not ignore or replace it with the skill template.

Instead:

1. Preserve the repo template's headings, order, tone, and required prompts.
2. Fill the template accurately from repository state.
3. Incorporate the PR Builder skill's added value inside that structure whenever possible:
   - governing context links
   - clearer `Why`
   - functional summary instead of file inventory
   - reviewer validation steps tied to acceptance criteria and sourced from the specification when available
   - explicit automated-test confirmation plus manual or domain-specific checks where relevant
   - scope, risk, and code-quality review focus
4. Add a short extra section only if the repo template has no good place for critical reviewer context.
5. Keep any add-on concise so the PR still feels native to the repo.

## PR Content Rules

- Start with the authoritative deliverable, ticket, or specification links when the repo has them.
- If the project system is known but the exact PR link is missing, ask the user for it and use a placeholder only when the user cannot provide it.
- Prefer one primary work item plus only the supporting links a reviewer actually needs.
- Describe shipped behavior and review scope, not coding play-by-play.
- Summarize functional areas, not a file-by-file inventory.
- Call out specific code hotspots only when they matter to review or risk.
- Keep the PR scoped to the change under review. Do not expand it into future features, backlog ideas, or unrelated follow-up work.
- Keep the PR intelligent and context-aware: omit sections that do not apply to the current change instead of filling them with boilerplate.
- Do not add a generic follow-up-work section by default.
- Mention an open item only when it directly affects how the current PR should be reviewed, merged, or treated as draft.
- Include only tests that were actually run.
- State whether the relevant automated test suite passed, failed, or remains incomplete.
- If verification is incomplete, say so plainly.
- Make it clear which acceptance criteria are already covered by automated tests and which still need manual confirmation.
- Do not require reviewers to manually re-prove every acceptance criterion when reliable automated coverage already demonstrates it.
- Call out schema changes, migrations, feature flags, or operational risk explicitly.
- Keep reviewer focus high: what changed, why it matters, where to pay attention, and how to validate.
- Reviewer instructions should include:
  - a checklist-style reviewer notes section rather than loose prose when the template allows it
  - what the human reviewer should inspect, test, or confirm
  - how to validate the acceptance criteria using specification guidance when available
  - which automated tests were run and what they cover
  - whether the relevant automated tests passed
  - which standards, guidelines, or repo-specific review rules were already checked by agents or automation
  - what still needs manual, functional, or UAT confirmation
  - additional verification guidance only when the change introduces review-relevant concerns beyond the baseline acceptance and UAT checks
  - what scope boundary the reviewer should confirm
  - a reminder to do a cursory code-quality inspection in the touched areas
- When a repo PR template exists, strongly incorporate it rather than generating a competing structure.
- Do not imply that agent-generated PR content replaces Deliverable Owner approval or human merge authority.
- Do not imply the PR is ready for formal review unless the owner has said so.
- For draft PRs, include a compact author-side review checklist before the formal reviewer notes.
- For stacked PRs, include a compact stack map and clarify whether the PR is lower, middle, or upper in the stack.

## Preferred Structure

When the repo does not provide a stronger template, use:

1. Context
2. Why
3. Functional overview
4. Draft status and author-side review checklist
5. Stack map when relevant
6. Reviewer notes
7. Verification
8. Risks or rollout notes when relevant
9. Demo when relevant

`What changed` is optional. Include it only when the functional overview is not self-evident.

## Reviewer Notes Requirements

The reviewer notes must be specific enough that a human can validate the acceptance criteria without reverse-engineering the diff.
It should use the governing specification or tracker record as the source of truth for acceptance checks.
When the template allows it, prefer checklist-style bullets that a reviewer can work through quickly.

Include:

1. Acceptance-criteria groupings or scenario checklist sourced from the specification when available
2. Setup or preconditions
3. Step-by-step validation actions
4. Expected results tied to acceptance criteria or core scenarios
5. Any commands, feature flags, test data, or environment notes required
6. Automated tests that were run and the coverage they provide
7. Whether the relevant automated tests passed, failed, or remain incomplete
8. A prompt for the reviewer to validate test quality: whether the tests prove the right
   behavior, cover realistic edge cases, and avoid low-value coverage padding
9. Standards, guidelines, or repo-specific review rules already checked by agents or automation
10. Manual validation still expected from the reviewer, especially for user-facing behavior, regressions, or high-risk flows
11. Some level of user acceptance testing when the change affects user-facing behavior or requires human confirmation beyond automated coverage
12. Additional domain-specific verification only when it materially helps review for this PR, such as API checks, data inspection, or operational validation
13. A short review-focus checklist that asks the reviewer to confirm:
   - the implementation satisfies the linked deliverable, specification, or ticket
   - the tests meaningfully prove the behavior rather than only passing
   - the code stays within the intended scope
   - the touched areas look reasonable from a code-quality and maintainability standpoint

If the validation was already performed by an agent running the `qa-testing` skill or by a human QA process, reuse that evidence and compress it into reviewer-friendly instructions.
It is acceptable to group acceptance criteria into meaningful scenarios rather than restating every criterion verbatim, especially when automated tests already provide reliable coverage.
Keep the fallback structure generic. Use repo templates and `AGENTS.md` to enforce more specific team workflows when present.
Omit optional subsections entirely when they do not apply to the current PR.

## Title Guidance

Prefer a title that states the outcome, not the implementation mechanism.

If the repo convention requires a ticket prefix, include it. If not, do not force one.
If the PR is draft, make that obvious in the title when repo conventions allow or expect it.

Good patterns:

- `Add role management UI for RBAC milestone 2`
- `Fix deliverable status transitions for blocked execution tasks`
- `Refactor standards loading to use docs-root index discovery`

Avoid vague titles like:

- `Updates`
- `Fix stuff`
- `Changes from review`

## Quality Bar

A PR package is complete when a human reviewer can quickly answer:

1. What governing work item or specification does this PR belong to?
2. Why was it needed?
3. What changed functionally?
4. How should I validate the acceptance criteria?
5. What must happen before a draft PR is ready for formal review?
6. If stacked, where does this PR sit and what does it depend on?
7. What should I review most carefully for scope and code quality?
8. Are there any review-relevant risks or rollout concerns inside this PR?
