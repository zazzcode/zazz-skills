---
last_updated_at: 2026-05-25
---

# Database testing

This standard governs tSQLt test commentary, behavior references, KNOWNBUG tests, expectation naming, DropClass usage,
and test-file naming.

## Database testing

The project uses tSQLt for stored-procedure tests. Test files shadow the object they cover: tests for
`backend/database/sql_migrations/stored-procedure/app_SomethingSomething.sql` always live at
`backend/database/sql_migrations/tests/app_SomethingSomethingTests.sql`
(database-testing-guide.md §File names).

### Tests carry "why" commentary

Tests exist to enforce behavior, and the commentary on each test explains *why* the behavior matters. Without that
explanation, a future refactor cannot judge whether a test is still relevant — it may be enforcing an invariant that
has since been moved elsewhere, or it may be documenting a tradeoff that no longer applies
(database-testing-guide.md).

For straightforward tests, a single-line title banner is enough:

```sql
-- =============================================================================
-- 'R' value returns valid
-- =============================================================================
create or alter procedure
test_app_ValidateMovementType.[test_R_ReturnsValid]
```

For tests with non-obvious behavior, the banner is followed by an explanatory block:

```sql
-- =============================================================================
-- Missing hierarchy level auto-passes
-- =============================================================================
-- Edge case: incomplete CustomerSegment hierarchy. If any of the 5 hierarchy
-- levels is missing, the cross-level JOIN produces no rows and the check
-- silently passes. This matches trigger behavior where the 5-table JOIN
-- simply has no matching rows.
-- =============================================================================
create or alter procedure
test_app_ValidateCustomerSegmentHierarchy.[test_MissingHierarchyLevel_AutoPasses]
```

Add "why" commentary specifically when the test documents a tradeoff or known limitation, when it tests execution order
or dependencies between stages, when it tests the distinction between optional and required fields, or when it
documents a testing pattern or workaround (such as the `@Testing=1` mode used to dodge SQL Server's nested
`INSERT EXEC` limitation, error 8164)
(database-testing-guide.md §When to add "why" commentary).

### References to behavior, not to line numbers

Test commentary describes scenarios in terms of behavior — what the trigger or sproc does, in what order, under what
conditions — never in terms of locations in source. Line numbers drift whenever the object is edited, and a comment
that points at "lines 133–172" of the implementation becomes a brittle coupling to a moving target that does not
survive refactors. Prefer concept names ("at the start of the trigger body"), branch labels ("PipelineLocation check
when both PipelineID and LocationID are non-NULL"), or phased-logic terms ("Hierarchy Phase 1") over
`(see trigger lines 133–172)` or `Section (lines 12–18)`
(database-testing-guide.md §Stable references in comments).

### `KNOWNBUG_` tests

The `KNOWNBUG_` prefix marks tests that document legacy bugs which cannot be fixed yet but must not be changed
accidentally. The test asserts the *actual buggy behavior* (so the test passes) and the commentary explains what the
*correct* behavior should be. The pattern delivers three things at once: a record that the bug exists and what triggers
it, a guard that prevents an inadvertent "fix" that changes behavior without anyone noticing, and a ready-made test
that fails the moment the bug is genuinely fixed
(database-testing-guide.md §KNOWNBUG tests).

### Desired ✅

```sql
-- Test: DataProvider with no pipelines returns gcInvalidDataProvider due to bug
-- KNOWN BUG: The sproc incorrectly checks "DataProviderMappingID = @lDataProviderID"
-- instead of "DataProviderID = @lDataProviderID" in the error handling section.
-- This causes it to return gcInvalidDataProvider (3) instead of gcNoRowsFound (1)
-- when a valid DataProvider exists but has no associated pipelines.
create or alter procedure
test_ListPipeline.[test_KNOWNBUG_DataProviderWithNoPipelinesReturnsInvalidDataProvider]
```

For more involved bugs, include a root-cause analysis in the test body:

```sql
create or alter procedure
test_GetPostedTickets.[test_KNOWNBUG_ReturnsSuccessInsteadOfNoResultsWhenFilteredByNonExistentPipeline]
as
begin
    -- BUG: When filtering by a non-existent PipelineID results in no data,
    -- the stored procedure should return ErrorID 1 (gcNoRowsFound) but
    -- instead returns ErrorID 0 (gcOK/Success).
    --
    -- The bug occurs because:
    -- 1. The initial query finds tickets (e.g., for accounting period 2021/1)
    -- 2. The PipelineID filter deletes all matching rows (@@ROWCOUNT > 0)
    -- 3. Since @@ROWCOUNT > 0, it doesn't check if the Pipeline exists
    -- 4. @lRowCount is updated to 0, but @lReturnCode stays as gcOK
    -- 5. The final no-rows handling should set gcNoRowsFound, but doesn't
    --
    -- Expected behavior: Return code should be 1 (gcNoRowsFound)
    -- Actual behavior: Return code is 0 (gcOK)
    -- ...
```

The test name describes what *actually* happens, not what *should* happen — otherwise the test would fail as written.
`[test_KNOWNBUG_DataProviderWithNoPipelinesReturnsInvalidDataProvider]` is correct;
`[test_KNOWNBUG_DataProviderWithNoPipelinesReturnsNoRowsFound]` is wrong because the second name asserts behavior the
sproc does not currently produce
(database-testing-guide.md §KNOWNBUG tests).

### Test naming

Test procedure names describe the scenario plainly enough to read without opening the test body.
`[test_NullValue_ReturnsErrorAndReturnCode1]`, `[test_LowercaseR_ReturnsError]`, and
`[test_CrossFieldValidation_LocationNotOnPipeline_ReturnsError]` all spell out the input shape and the expected
outcome. Where the *why* belongs in the name itself — typically for tests that document a multi-step or order-sensitive
scenario — fold it in: `[test_TwoRoundValidation_FieldErrorThenCrossFieldError]`,
`[test_InvalidDataProviderCode_IndependentValidatorsStillRun]`
(database-testing-guide.md §Test naming).

### Test expectations track sproc error codes in the same commit

When a sproc's error code for a given scenario changes — for example, FK violations switching from `gcDatabaseError` to
`gcNoParentRecord` — the corresponding tSQLt test's expected `ErrorID` must change in the same commit. A test that
asserts the old code while the sproc returns the new one passes on stale code and fails on the corrected code, which is
the exact inverse of what a test is for. The expectation enforces the taxonomy, not a frozen snapshot of it
.

### Desired ✅

```sql
-- Sproc changed: FK violation now returns gcNoParentRecord (not gcDatabaseError / 14)
-- Same commit updates the test expectation:
exec tSQLt.AssertEquals
    @Expected = @gcNoParentRecord_ErrorID,
    @Actual   = @ReturnCode
```

### Not desired ❌

```sql
-- wrong: sproc returns gcNoParentRecord but the test still asserts 14 (gcDatabaseError)
exec tSQLt.AssertEquals @Expected = 14, @Actual = @ReturnCode
```

### `tSQLt.DropClass` is already idempotent

`exec tSQLt.DropClass '<schema>'` is documented as a no-op when the schema does not exist. Do not wrap it in an
existence guard — the guard is redundant, adds noise, and signals a misreading of the tSQLt API. Trust the documented
idempotency guarantee .

### Desired ✅

```sql
exec tSQLt.DropClass 'test_app_ValidateUnpostedTicket';
```

### Not desired ❌

```sql
-- wrong: tSQLt.DropClass is already idempotent
if schema_id('test_app_ValidateUnpostedTicket') is not null
    exec tSQLt.DropClass 'test_app_ValidateUnpostedTicket';
```

### Test files shadow the sproc file name

Every test file's name is the sproc file's name with a `Tests` suffix. The tests for `R__dbo.app_UpdateLink.sql` live
in `R__app_UpdateLinkTests.sql`; the tests for `R__dbo.app_ValidateCustomerSegmentHierarchy.sql` live in
`R__app_ValidateCustomerSegmentHierarchyTests.sql`. This shadow-naming is the single rule that makes it possible to find the
tests for a sproc by mechanical transformation, without grep
(database-testing-guide.md §File names).

```sql
-- backend/database/sql_migrations/tests/R__app_UpdateLinkTests.sql
exec tSQLt.NewTestClass 'test_app_UpdateLink';
go

-- =============================================================================
-- Test 1: Update LinkName successfully
-- =============================================================================
create or alter procedure
test_app_UpdateLink.[test_UpdateLinkName_Success]
as
begin
    -- Fake the required tables
    exec tSQLt.FakeTable 'dbo', 'Link';
    exec tSQLt.FakeTable 'dbo', 'Error';

    -- Insert the Error rows the sproc resolves by ErrorCode
    insert into dbo.Error (ErrorID, ErrorCode)
    values
        (0,  'gcOK'),
        (15, 'gcDuplicateData'),
        (49, 'gcStringTooLong'),
        (14, 'gcDatabaseError');

    -- ... arrange, act, assert ...
end
go
```
