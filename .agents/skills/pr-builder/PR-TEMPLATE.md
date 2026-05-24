# Pull Request Template (PR Builder)

Use this when the repo does not provide a stronger PR template.
Omit sections that do not add reviewer value.
Keep this fallback template generic.
Use repo templates or `AGENTS.md` when a team needs stricter or more specific review workflow requirements.

## Context
- Primary work item:
- Deliverable specification / tracker record:
- Additional governing link(s):
- PR status: Draft by default / Ready for review only after Deliverable Owner confirmation

Put the most authoritative link first.
Use the repo's actual system of record for this change, such as Zazz, Jira, Avaza, or another project tracker.
Do not dump every related link into the PR.
If the project uses a tracker but the final URL or ID is not yet available, leave a clear placeholder such as `TODO: add Avaza task URL`.
If the PR is draft, make that obvious here and briefly state what remains before the
Deliverable Owner can mark it ready for formal review.

## Why
Explain why this PR exists.
Focus on the problem, user outcome, or business/technical need.
Do not turn this section into an implementation diary.

## Functional Overview
- Summarize the user-facing or system-facing behavior that changed.
- Call out the most important functional areas a reviewer should understand.
- Mention notable implementation areas only when they materially affect review.
- If helpful, group the summary by subsystem or behavior area rather than by file path.

Avoid file-by-file inventories unless a specific file or subsystem deserves reviewer attention.

## Draft Readiness
- Draft reason:
- Author-side automated review:
- Critical or important findings still open:
- Evidence still missing:
- Owner action needed before marking ready:

Remove this section only when the Deliverable Owner has explicitly confirmed the PR is ready for formal review.

## Stack Map (When Relevant)
- Stack position:
- Parent branch / PR:
- Dependent branch(es) / PR(s):
- Acceptance criteria owned by this PR:

Remove this section when the PR is not part of a GH-stack.

## Reviewer Notes

### Acceptance Criteria Checklist
Use the deliverable specification, lightweight bug-fix specification, or tracker record as the source of truth when available.
Group acceptance criteria into reviewable scenarios instead of restating every line item when that is clearer.
If automated tests already prove a criterion reliably, cite that coverage and only ask for manual confirmation where it still adds value.

- [ ] Acceptance criteria / scenario:
  Source:
  Automated coverage already run:
  Automated tests passed:
  Manual confirmation still needed:
  Expected result:

Repeat for each meaningful acceptance-criteria group or scenario when needed.

### User Acceptance Testing (When Relevant)
- [ ] Manual user acceptance testing completed
  Scenarios or journeys checked:
  What the reviewer should confirm:
  Evidence or notes:

Remove this subsection entirely when the PR does not require meaningful human validation beyond automated coverage.

### Additional Verification (Optional)
- [ ] Additional verification completed
  Type of check:
  Commands, queries, tools, or notes:
  Expected outcome:

Use this only when domain-specific checks materially help review, such as API checks, data inspection, admin workflows, operational validation, or other team-specific checks.
Remove this subsection entirely when it does not add reviewer value.

### Review Focus
Ask the reviewer to confirm:
- [ ] The implementation satisfies the linked deliverable, ticket, and/or specification
- [ ] The changed code stays within the intended scope
- [ ] The touched areas look reasonable from a code-quality and maintainability standpoint

## Verification
- Automated tests run:
- Automated tests passed:
- Manual or functional validation performed:
- User acceptance testing performed:
- Additional verification performed:
- Not run / not verified:

Include only verification that actually happened.

## Risks / Rollout Notes
- Known risks:
- Rollout, migration, or feature-flag notes:

Keep this section limited to review-relevant concerns inside the current PR scope.
Do not use the PR as a default place to discuss future features or unrelated follow-up work.

## Demo (Optional)
- GIF, video, screenshots, CLI transcript, or reproduction notes when they materially help review

Remove this section when demo artifacts do not materially help review.
