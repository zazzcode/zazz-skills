# Verification Evidence Template (QA)

This is not a pull request body template. QA uses this structure to capture verification
evidence, rework history, test-quality findings, and owner manual validation steps.
`pr-builder` consumes this evidence, along with the diff and governing work item, when a
PR title/body needs to be created or refreshed.

## Summary
- Deliverable code:
- Deliverable ID:
- Project code:
- Branch/worktree:
- Deliverable specification:
- Run log / external execution record:

## Acceptance Criteria Verification
- AC-1:
  - Status: PASS/FAIL
  - Evidence:
- AC-2:
  - Status: PASS/FAIL
  - Evidence:

## Automated Test Results
List required and risk-relevant tests. Do not pad this section with unrelated suites.

### Unit Tests
- Command(s):
- Result:

### API/Integration Tests
- Command(s):
- Result:

### E2E Tests
- Command(s):
- Result:

### Performance/Security Tests (if applicable)
- Command(s):
- Result:

## Code Quality + Standards Conformance
- Standards reviewed:
- Coding patterns/conventions verified:
- Notes:

## Test Quality
- Meaningful coverage / realistic edge cases verified:
- Test structure, scope, fixtures, and assertions inspected:
- Specified test contract preserved, or approved revision cited:
- Existing coverage intentionally reused:
- Low-value or duplicate tests removed / flagged:

## Rework History
- Rework task:
  - Root cause:
  - Resolution:
  - Verification evidence:

## Run Log Entries
- QA findings appended:
- Test-quality/specification-gap findings appended:
- Rework/re-verification outcomes appended:

## Scope / Diff Reviewed
- Branch or diff base:
- Files or paths reviewed:
- Out-of-scope files observed:

## Owner Manual Test Plan
Provide explicit steps for the owner to validate behavior manually after automated verification is complete.

1. Preconditions/setup:
2. Step-by-step manual test actions:
3. Expected outcomes for each step:
4. Edge-case checks owner should perform:

## QA Verification Recommendation
- Status: READY_FOR_OWNER_REVIEW / NOT_READY
- Outstanding risks (if any):
