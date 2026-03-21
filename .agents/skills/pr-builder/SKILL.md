---
name: pr-builder
description: Builds reviewer-ready pull request titles and bodies from repository state, deliverable context, test evidence, and manual validation notes. Use when preparing or updating a PR for human review.
---

# PR Builder Skill

## Mission

Create a clear, reviewer-ready pull request title and body that accurately explains:

- what changed
- why it changed
- how it was verified
- what risks or follow-ups remain

This skill packages work for review. It does not replace implementation, QA, or owner judgment.
It may help create or refine PR content, but it must never approve or merge a PR.

## Use This Skill When

- the user asks to create, draft, update, or polish a PR
- QA has completed verification and needs a high-quality PR description
- a deliverable needs consistent reviewer-facing evidence
- the repo has templates or conventions that should be applied reliably

## Required Inputs

Gather as many of these as are available:

1. Branch or diff against the target branch
2. Commit list or summary of changes
3. Deliverable SPEC / PLAN paths when the work follows the Zazz framework
4. Test commands and results
5. Manual validation steps
6. Known risks, migrations, feature flags, or rollout notes

If a detail is missing, derive it from repository state when possible. Do not invent verification that did not happen.

## Workflow

1. Inspect the repo for PR conventions:
   - `.github/pull_request_template.md`
   - `.github/PULL_REQUEST_TEMPLATE.md`
   - other PR templates or contributing docs
   - `.agents/skills/qa/PR-TEMPLATE.md` when working in a Zazz repo
2. Read the diff and identify the real user-facing or system-facing behavior change.
3. Read supporting docs that define intent when present:
   - deliverable SPEC
   - PLAN
   - QA evidence
   - issue or ticket context supplied by the user
4. Separate the PR content into:
   - summary of change
   - notable implementation areas
   - testing and verification
   - manual validation steps
   - risks, rollout notes, or follow-ups
5. Produce a concise PR title and body that match the repo's template if one exists.

## PR Content Rules

- Describe shipped behavior, not coding play-by-play.
- Include only tests that were actually run.
- If verification is incomplete, say so plainly.
- Call out schema changes, migrations, feature flags, or operational risk explicitly.
- Keep reviewer focus high: what changed, where to pay attention, and how to validate.
- Do not imply that agent-generated PR content replaces Deliverable Owner approval or human merge authority.

## Preferred Structure

When the repo does not provide a stronger template, use:

1. Summary
2. Why
3. What changed
4. Testing
5. Manual test plan
6. Risks / follow-ups

## Title Guidance

Prefer a title that states the outcome, not the implementation mechanism.

Good patterns:

- `Add role management UI for RBAC milestone 2`
- `Fix deliverable status transitions for blocked worker tasks`
- `Refactor standards loading to use docs-root index discovery`

Avoid vague titles like:

- `Updates`
- `Fix stuff`
- `Changes from review`

## Quality Bar

A PR package is complete when a human reviewer can quickly answer:

1. What changed?
2. Why was it needed?
3. How was it verified?
4. What should I review most carefully?
5. Are there any rollout, risk, or follow-up concerns?
