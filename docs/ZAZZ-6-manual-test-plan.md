# ZAZZ-6 Manual Test Plan

## Purpose
This plan covers the remaining manual verification for deliverable `ZAZZ-6`:
- project-scoped agent token management UI
- leader vs non-leader behavior
- exact-phrase token revocation flow
- deliverable approval baby step when dragging from `PLANNING` to `IN_PROGRESS`

## Environment
- Start the app normally.
- Client URL: `http://localhost:3001`
- API URL: `http://localhost:3030`
- Use the standard seeded user token in the UI login/access-token modal:
  - `550e8400-e29b-41d4-a716-446655440000`

## Seeded Context
- Project `ZAZZ`
  - leader: Michael (user token above)
  - seeded agent tokens exist for Michael in `ZAZZ`
- Project `ZED_MER`
  - seeded agent tokens exist for Jane/Steve

## Expected High-Level Outcomes
- Project rows expose a manage-agent-tokens action.
- Leaders can view project-wide token groups for that project.
- Non-leaders can only view their own tokens for that project.
- Creating a token returns a visible value that can be copied.
- Revoking a token requires typing the exact phrase `delete this token`.
- Dragging a deliverable card from `PLANNING` to `IN_PROGRESS` auto-approves it when a plan filepath exists.

## Test Cases

### 1. Access Token Login
1. Open `http://localhost:3001`.
2. Set the access token to `550e8400-e29b-41d4-a716-446655440000`.
3. Confirm the projects page loads.

Expected:
- Project list renders without auth errors.
- `ZAZZ` and other seeded projects are visible.

### 2. Project Row Entry Point
1. On the projects page, inspect a project row.
2. Find the key/manage-agent-tokens action.
3. Click it for `ZAZZ`.

Expected:
- The Agent Tokens modal opens.
- The modal title references the selected project.

### 3. Leader View for ZAZZ
1. Open the Agent Tokens modal for `ZAZZ` while logged in as Michael.
2. Review the modal contents.

Expected:
- The modal shows leader-oriented text.
- Multiple user sections are visible for the project-wide view, or at minimum the UI is clearly rendering grouped user/token data rather than a single self-only card.
- Existing seeded tokens are visible with labels and token values.

### 4. Create Token in Leader View
1. In the `ZAZZ` Agent Tokens modal, enter an optional label for a target user row.
2. Click the create/generate button.

Expected:
- A new token appears successfully.
- A success area or newest-token area shows the created token value.
- The new token is copyable.
- The token value is visible in full, not masked.

### 5. Copy Token
1. Use the copy action on the newly created token.

Expected:
- Copy feedback changes to a success state such as `Copied`.
- No modal crash or UI reset occurs.

### 6. Revoke Token Guard
1. Choose a token and click revoke/delete.
2. Do not type the confirmation phrase yet.

Expected:
- A confirmation section appears.
- The destructive confirm button remains disabled until the exact phrase is entered.

### 7. Revoke Token Exact Phrase
1. Type an incorrect value such as `Delete this token` or extra spaces/other text.
2. Verify the destructive action is still gated.
3. Type exactly `delete this token`.
4. Confirm the revocation.

Expected:
- Incorrect values do not enable the destructive action.
- Exact lowercase phrase enables the destructive action.
- After confirmation, the token disappears from the list.

### 8. Reopen Modal After Create/Delete
1. Close the Agent Tokens modal.
2. Reopen it for the same project.

Expected:
- The list reflects the latest created/deleted state.
- The modal opens cleanly without stale confirmation UI.

### 9. Non-Leader Self View
Use any non-leader user token available in your environment. If you do not have one handy in the UI, this case can be done later once a non-leader login path is available.

1. Log in as a non-leader user.
2. Open the Agent Tokens modal for a project where that user is not the leader.

Expected:
- The modal shows self-oriented copy.
- Only that user’s own tokens are visible.
- No project-wide multi-user tree is exposed.
- Create/revoke still works for that user’s own tokens only.

### 10. Project Isolation Sanity Check
1. Open the Agent Tokens modal for `ZAZZ`.
2. Note the visible users/tokens.
3. Open the Agent Tokens modal for another project.

Expected:
- Token data changes with the selected project.
- No `ZED_MER` tokens appear in `ZAZZ`, and vice versa.

### 11. Deliverable Approval Baby Step
1. Navigate to the deliverable board for a project that has a deliverable with:
   - status `PLANNING`
   - a non-empty `plan_filepath`
2. Drag that deliverable card from `PLANNING` to `IN_PROGRESS`.

Expected:
- The move succeeds.
- The deliverable becomes approved automatically as part of the move.
- No separate manual approve call is required first.

### 12. Deliverable Approval Negative Check
1. Find or create a deliverable in `PLANNING` without a `plan_filepath`.
2. Attempt to move it to `IN_PROGRESS`.

Expected:
- The transition is rejected or blocked.
- A deliverable without a plan cannot enter `IN_PROGRESS`.

## Suggested Notes to Capture During Testing
- Which user/token was used
- Which project was tested
- Whether the modal content matched leader vs non-leader expectations
- Whether copy feedback was clear
- Whether delete gating behaved exactly as expected
- Whether drag-to-approve worked with and without `plan_filepath`
- Any console/network errors seen in browser devtools

## Exit Criteria
Manual verification is complete when all of the following are true:
- UI entry point is discoverable and opens reliably
- Leader flow passes
- Non-leader flow passes
- Create/copy/delete flows pass
- Exact-phrase revocation guard passes
- Project isolation is visually correct
- Dragging `PLANNING -> IN_PROGRESS` auto-approves when `plan_filepath` exists
- The negative approval case without `plan_filepath` is blocked
