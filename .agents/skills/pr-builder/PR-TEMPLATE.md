# Pull Request Template (PR Builder)

Use this when the repo does not provide a stronger PR template.
Omit sections that do not add reviewer value.

## Context
- Primary work item:
- SPEC:
- PLAN:
- Additional governing link(s):
- PR status: Ready for review / Draft

Put the most authoritative link first.
Use the repo's actual system of record for this change, such as Zazz, Jira, Avaza, or another project tracker.
Do not dump every related link into the PR.
If the project uses a tracker but the final URL or ID is not yet available, leave a clear placeholder such as `TODO: add Avaza task URL`.
If the PR is draft, make that obvious here and briefly state why.

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

## Reviewer Guide

### Validate Acceptance Criteria
List the concrete ways a reviewer can confirm the acceptance criteria or key scenarios.

1. Preconditions / setup:
2. Action:
3. Expected result:
4. Evidence already available:

Repeat for each meaningful acceptance-criteria group or scenario when needed.

### Review Focus
Ask the reviewer to confirm:
- the implementation satisfies the linked deliverable, ticket, and/or specification
- the changed code stays within the intended scope
- the touched areas look reasonable from a code-quality and maintainability standpoint

## Verification
- Automated tests run:
- Manual or functional validation performed:
- UAT coverage:
- Not run / not verified:

Include only verification that actually happened.

## Risks / Rollout Notes
- Known risks:
- Rollout, migration, or feature-flag notes:

Keep this section limited to review-relevant concerns inside the current PR scope.
Do not use the PR as a default place to discuss future features or unrelated follow-up work.

## Demo (Optional)
- GIF, video, screenshots, CLI transcript, or reproduction notes when they materially help review
