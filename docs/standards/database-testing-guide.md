# TSQLT Database testing patterns

Tests should always have commentary that emphasizes _why_ the test exists.

This is important so future refactors can know if it's reasonable to remove the test because the _why_ is no longer
valid.

## Per-test headers

Each test procedure should have a header block. For straightforward tests, a title line is sufficient:

```sql
-- =============================================================================
-- 'R' value returns valid
-- =============================================================================
create or alter procedure
test_app_ValidateMovementType.[test_R_ReturnsValid]
```

For tests with non-obvious behavior, add explanatory commentary after the title:

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

## When to add "why" commentary

Add explanatory comments when:

1. **Testing a tradeoff or known limitation**

   ```sql
   -- =============================================================================
   -- Two-round validation scenario (documents known tradeoff)
   -- =============================================================================
   -- Documents a KNOWN TRADEOFF, not a bug. Cross-field validation (Stage 4) only
   -- runs when all field-level validations pass. A user with both field errors AND
   -- cross-field errors needs two validation rounds...
   -- =============================================================================
   ```

1. **Testing execution order or dependencies**

   ```sql
   -- Tests Stage 1 failure. DataProviderCode must resolve first to obtain the
   -- DataProviderMappingID needed by downstream validators. When it fails,
   -- MappingID-dependent validators (Stage 2) are SKIPPED...
   ```

   Describe order using **named stages**, **phases**, or **behavioral** wording (what runs before what, under which
   conditions). Do **not** cite line numbers in the trigger or stored procedure file—see
   [Stable references in comments](#stable-references-in-comments).

1. **Testing optional vs required field distinctions**

   ```sql
   -- Tests the OPTIONAL FIELD pattern. PriorDetailCode is the only optional field
   -- among the 19 parameters — NULL is valid (unlike required fields where NULL
   -- errors).
   ```

1. **Documenting testing patterns or workarounds**

   ```sql
   -- TESTING PATTERN:
   -- Due to SQL Server's nested INSERT EXEC limitation (error 8164), these tests
   -- use @Testing=1 mode which writes results to #result_rows instead of returning
   -- a result set.
   ```

## Stable references in comments

Test comments should tie scenarios to **behavior**—what the trigger or stored procedure does, in what order, and under
what conditions—not to **locations in source** (line numbers, or “lines X–Y” in the object’s `.sql` file).

Line numbers drift whenever the object is edited. They create a brittle coupling to a moving target and do not survive
refactors.

**Prefer:**

- Concept or branch names: e.g. “at the start of the trigger body”, “year validation before code-resolution branches”,
  “PipelineLocation check when both PipelineID and LocationID are non-NULL”.
- **Phased logic** (e.g. Hierarchy Phase 1 / Phase 2): keep phase labels and conditions; omit `(lines …)` after the
  phase name.
- **Section banners** in large test files (e.g. “A. Baseline — …”): the title is enough; do not add parentheticals that
  only point at implementation line ranges.

**Avoid:** “See trigger lines 133–172”, or section titles like `Section (lines 12–18)`.

**Instead:** state the behavior under test in plain language.

## KNOWNBUG tests

Use the `KNOWNBUG_` prefix in test names to document bugs in legacy code that cannot be fixed yet. These tests assert
the **actual buggy behavior** (not the correct behavior) so the test passes, while the commentary explains what the
correct behavior should be.

This pattern is valuable because:

- It documents the bug exists and what triggers it
- It prevents accidental "fixes" that change behavior without understanding impact
- It provides a ready-made test that will fail when the bug is actually fixed

```sql
-- Test: DataProvider with no pipelines returns gcInvalidDataProvider due to bug
-- KNOWN BUG: The sproc incorrectly checks "DataProviderMappingID = @lDataProviderID"
-- instead of "DataProviderID = @lDataProviderID" in the error handling section.
-- This causes it to return gcInvalidDataProvider (3) instead of gcNoRowsFound (1)
-- when a valid DataProvider exists but has no associated pipelines.
create or alter procedure
test_ListPipeline.[test_KNOWNBUG_DataProviderWithNoPipelinesReturnsInvalidDataProvider]
```

For more complex bugs, include root cause analysis:

```sql
create or alter procedure
test_GetPostedTickets.[test_KNOWNBUG_ReturnsSuccessInsteadOfNoResultsWhenFilteredByNonExistentPipeline]
as
begin
    -- BUG: This test documents incorrect behavior - when filtering by a non-existent
    -- PipelineID results in no data, the stored procedure should return ErrorID 1
    -- (gcNoRowsFound) but instead returns ErrorID 0 (gcOK/Success).
    --
    -- The bug occurs because:
    -- 1. The initial query finds tickets (e.g., for accounting period 2021/1)
    -- 2. The PipelineID filter deletes all matching rows (@@ROWCOUNT > 0)
    -- 3. Since @@ROWCOUNT > 0, it doesn't check if the Pipeline exists
    -- 4. @lRowCount is updated to 0, but @lReturnCode stays as gcOK
    -- 5. The final return-code / no-rows handling should set gcNoRowsFound, but doesn't
    --
    -- Expected behavior: Return code should be 1 (gcNoRowsFound)
    -- Actual behavior: Return code is 0 (gcOK)
```

The test name should describe the **actual** behavior (what the bug does), not the expected behavior:

```sql
-- Good: describes what actually happens
[test_KNOWNBUG_DataProviderWithNoPipelinesReturnsInvalidDataProvider]
[test_KNOWNBUG_ReturnsSuccessInsteadOfNoResultsWhenFilteredByNonExistentPipeline]

-- Bad: describes expected behavior (test would fail)
[test_KNOWNBUG_DataProviderWithNoPipelinesReturnsNoRowsFound]
```

## Test naming

### Procedure names

Test procedure names should be descriptive enough to understand the scenario:

```sql
-- Good: clear inputs and expected outcome
[test_NullValue_ReturnsErrorAndReturnCode1]
[test_LowercaseR_ReturnsError]
[test_CrossFieldValidation_LocationNotOnPipeline_ReturnsError]

-- Good: documents the "why" in the name when appropriate
[test_TwoRoundValidation_FieldErrorThenCrossFieldError]
[test_InvalidDataProviderCode_IndependentValidatorsStillRun]
```

### File names

Test file names should ALWAYS 'shadow' the object they're creating tests for by suffixing the name with `Tests`:

For instance: the tests for the objects in
`backend/database/sql_migrations/stored-procedure/app_SomethingSomething.sql` should _ALWAYS_ be
`backend/database/sql_migrations/tests/app_SomethingSomethingTests.sql`
