---
last_updated_at: 2026-06-08
---

# Database stored procedure errors

This standard governs stored procedure lookup resolution, row-count checks, case-specific ErrorMessage text,
catch-block error-code dispatch, and guarding against `NULL` return codes from a missing `dbo.Error` row.

### External-ID resolution at the top of the body

Sprocs that accept a `uniqueidentifier` (the external ID for entities that expose one to HTTP callers) resolve it to
the internal integer ID at the very top of the sproc body. If the resolution returns `NULL`, the sproc must return
`gcNoRowsFound` (1) with a case-specific `@ErrorMessage` that names exactly which lookup failed — silent no-ops on
unknown external IDs hide caller bugs and produce "succeeded but did nothing" semantics that mask data-integrity
problems. Each external-ID parameter has its own resolution block and its own message text, even when the return code
is identical across them (review precedent; see
`app_AddAccountRole.sql`).

### Desired ✅

```sql
-- Account lookup
declare @AccountInternalId int = (
    select id from dbo.account
    where external_id = @AccountId
);

if @AccountInternalId is null
    begin
        select @ReturnCode = ErrorID from dbo.Error
        where ErrorCode = 'gcNoRowsFound';
        set @ErrorMessage = 'Account not found for external_id '
            + cast(@AccountId as varchar(36));
        return @ReturnCode;
    end

-- Role lookup
declare @RoleInternalId int = (
    select id from dbo.role
    where name = @RoleName
);

if @RoleInternalId is null
    begin
        select @ReturnCode = ErrorID from dbo.Error
        where ErrorCode = 'gcNoRowsFound';
        set @ErrorMessage = 'Role not found for name ''' + @RoleName + '''';
        return @ReturnCode;
    end

-- Granting-account lookup
declare @GrantedByInternalId int = (
    select id from dbo.account
    where external_id = @GrantedById
);

if @GrantedByInternalId is null
    begin
        select @ReturnCode = ErrorID from dbo.Error
        where ErrorCode = 'gcNoRowsFound';
        set @ErrorMessage = 'Granting account not found for external_id '
            + cast(@GrantedById as varchar(36));
        return @ReturnCode;
    end
```

### Not desired ❌

```sql
-- wrong: silent no-op when @AccountId doesn't exist; UPDATE simply matches zero rows
update AccountRole
set ...
where AccountID = (
    select AccountID from Account where ExternalID = @AccountId
)
return @gcOK
```

```sql
-- wrong: single generic message across all lookup paths; caller cannot tell which
-- entity was missing without re-running
select @ErrorMessage = 'Not found'
```

### Case-specific `@ErrorMessage` per lookup path

A combined "not found" message forces callers to re-look-up which entity was actually missing. Case-specific messages
turn the sproc's OUTPUT into actionable diagnostic information that flows directly into Python logs and service-level
exceptions. Use distinct strings for each path even when the return code (`gcNoRowsFound`, `gcNoParentRecord`, etc.) is
the same (review precedent; see
`app_AddAccountRole.sql`).

The same discipline applies inside the catch block. When `IX_CustomerSegment` is the constraint that fired, the message
names the Customer Segment Code; when `CustomerSegmentName` is in the violation text, the message names the Name. Generic
"Duplicate data" and "Foreign key constraint violation" prefixes appear only as a fallback when no constraint name in
`@DbErrorMsg` matches a known case
(`app_InsertCustomerSegment.sql`).

### Desired ✅

```sql
-- Specific messages for each FK that can fail on insert
if @DbErrorMsg like '%FK_CalculationMethod$CustomerSegment%'
    or @DbErrorMsg like '%CalculationMethod%'
    select @ErrorMessage = 'Invalid Calculation Method ID.'
else if @DbErrorMsg like '%FK_CustomerSegmentType$CustomerSegment%'
    or @DbErrorMsg like '%CustomerSegmentType%'
    select @ErrorMessage = 'Invalid Customer Segment Type ID.'
else if @DbErrorMsg like '%FK_ReturnAddress$CustomerSegment%'
    or @DbErrorMsg like '%ReturnAddress%'
    select @ErrorMessage = 'Invalid Return Address ID.'
else if @DbErrorMsg like '%FK_WireInstruction$CustomerSegment%'
    or @DbErrorMsg like '%WireInstruction%'
    select @ErrorMessage = 'Invalid Wire Instruction ID.'
else
    -- Fallback only when no known constraint name matched
    select @ErrorMessage = 'Foreign key constraint violation: ' + @DbErrorMsg
```

### `@@ROWCOUNT` check on every UPDATE

UPDATE sprocs capture `@@ROWCOUNT` into a local variable immediately after the `UPDATE` statement. Zero rows affected
returns `gcNoRowsFound` with a descriptive `@ErrorMessage` naming the entity and its ID. The `@ReturnCode` variable is
initialized to `gcOK` *before* the `BEGIN TRY` block — not after the `UPDATE` — so the success path needs no extra
`SELECT` after the affecting statement and the failure paths only have to overwrite the value when something went wrong
(review precedent; see
`app_UpdateLink.sql`).

An UPDATE that silently returns `gcOK` when no row was modified is a silent data-integrity bug — the caller commits a
transaction it believes succeeded, the audit trail records the operation, and the underlying record never changed. The
rule applies to every UPDATE sproc, no exceptions.

### Desired ✅

```sql
declare @ReturnCode int
declare @RowsAffected int
declare @DbErrorMsg nvarchar(4000)

-- Initialize @ReturnCode to gcOK BEFORE the try block
select @ReturnCode = ErrorID
from Error
where ErrorCode = 'gcOK'

begin try
    update Link
    set
        LinkName        = isnull(@LinkName, LinkName),
        LinkDescription = isnull(@LinkDescription, LinkDescription),
        UpdateBy        = @Username,
        UpdatedOn       = getdate()
    where LinkID = @LinkID

    -- Capture how many rows were affected
    select @RowsAffected = @@ROWCOUNT

    if @RowsAffected = 0
        begin
            select @ReturnCode = ErrorID
            from Error
            where ErrorCode = 'gcNoRowsFound'

            select @ErrorMessage = 'No Link found with ID: '
                + cast(@LinkID as varchar(10))
        end
end try
begin catch
    -- ... error_number() dispatch
end catch

return @ReturnCode
```

### Not desired ❌

```sql
update Link set ...
where LinkID = @LinkID
-- wrong: no @@ROWCOUNT check; sproc returns gcOK even when no row matched
return @ReturnCode
```

### Catch-block error-code dispatch

The `BEGIN CATCH` block is where the sproc's three-channel return contract is sealed. It is structured as an
`if/else if/else` chain that inspects `error_number()` first, then refines `@ErrorMessage` by pattern-matching on
`@DbErrorMsg` against known constraint and column names. The first branch handles unique-constraint violations
(`error_number() in (2627, 2601)` → `gcDuplicateData`). The second handles foreign-key violations
(`error_number() = 547` → `gcNoParentRecord`, never the generic `gcDatabaseError`). The third handles truncation
(`error_number() in (8152, 2628)` → `gcStringTooLong`). The default branch maps everything else to `gcDatabaseError`
(review precedent; see
`app_InsertCustomerSegment.sql`
and
`app_UpdateCustomerSegment.sql`).

Returning a domain-level error code rather than a generic database error gives callers a stable signal they can branch
on without treating it as an unexpected system failure. `gcNoParentRecord` means "the parent record you referenced
doesn't exist" and is a routine 4xx-style condition; `gcDatabaseError` means "something the sproc cannot classify went
wrong" and should be rare in production code.

### Desired ✅

```sql
begin catch
    select @DbErrorMsg = error_message()

    -- Unique constraint violations
    if error_number() in (2627, 2601)
        begin
            select @ReturnCode = ErrorID from Error
            where ErrorCode = 'gcDuplicateData'

            if @DbErrorMsg like '%IX_CustomerSegment%'
                or @DbErrorMsg like '%CustomerSegmentCode%'
                select @ErrorMessage = 'Customer Segment Code is already in use.'
            else if @DbErrorMsg like '%CustomerSegmentName%'
                select @ErrorMessage = 'Customer Segment Name is already in use.'
            else
                select @ErrorMessage = 'Duplicate data: ' + @DbErrorMsg
        end
    -- Foreign key constraint violation
    else if error_number() = 547
        begin
            select @ReturnCode = ErrorID from Error
            where ErrorCode = 'gcNoParentRecord'

            if @DbErrorMsg like '%FK_CalculationMethod$CustomerSegment%'
                or @DbErrorMsg like '%CalculationMethod%'
                select @ErrorMessage = 'Invalid Calculation Method ID.'
            -- ... other FK branches ...
            else
                select @ErrorMessage = 'Foreign key constraint violation: '
                    + @DbErrorMsg
        end
    -- Truncation
    else if error_number() in (8152, 2628)
        begin
            select @ReturnCode = ErrorID from Error
            where ErrorCode = 'gcStringTooLong'
            -- ... column-specific messages ...
        end
    -- Default
    else
        begin
            select @ReturnCode = ErrorID from Error
            where ErrorCode = 'gcDatabaseError'

            select @ErrorMessage = 'Database error: ' + @DbErrorMsg
        end
end catch
```

### Not desired ❌

```sql
begin catch
    -- wrong: FK violations collapse into the generic database error code,
    -- losing the gcNoParentRecord branch the callers depend on
    select @ReturnCode = ErrorID from Error where ErrorCode = 'gcDatabaseError'
end catch
```

### Guard against `NULL` `@ReturnCode` from a missing `dbo.Error` row

`select @ReturnCode = ErrorID from dbo.Error where ErrorCode = '...'` is the standard idiom for resolving a return
code, and it silently leaves `@ReturnCode = NULL` when the row is missing. A sproc that then `RETURN @ReturnCode` hands
`NULL` to its data-layer wrapper, which the wrapper's `SprocReturnCode` enum cannot classify — the failure mode ranges
from a confusing wrapper exception to a non-error treatment depending on how the wrapper handles unknown codes. The
invariant is: **no code path may RETURN a `NULL` `@ReturnCode`.** How you enforce that depends on the sproc shape.

For **read / report sprocs** (no `BEGIN TRY` / `BEGIN CATCH`, multiple distinct return codes flowing through plain
control flow), resolve every `dbo.Error` code the sproc can return at proc entry, into named local variables, and fail
loudly with `raiserror(..., 16, 1)` if any row is missing. Subsequent branches assign the local variable rather than
re-querying `dbo.Error`. A misconfigured `dbo.Error` becomes a loud, immediate signal once at proc entry instead of an
intermittent `NULL` that leaks out only when a particular branch fires
(review precedent; see
`app_ReportVendorSummary.sql`).

For **write sprocs** (UPDATE / INSERT / DELETE with `BEGIN TRY` / `BEGIN CATCH`), the per-branch ad-hoc lookup
documented in *External-ID resolution at the top of the body* and *Catch-block error-code dispatch* above remains the
expected pattern — each lookup sits next to the `@ErrorMessage` it pairs with, which keeps the code/message contract
visible at the call site. The same `NULL` risk theoretically applies, but the codes used in `BEGIN CATCH`
(`gcDuplicateData`, `gcNoParentRecord`, `gcStringTooLong`, `gcDatabaseError`) and the external-ID `gcNoRowsFound`
lookup are foundational seed rows: a missing row breaks every write sproc in the system at once, which is loud enough
to surface without per-sproc guarding.

The choice is not "eager vs lazy" — it is "given this sproc's shape, what is the cheapest way to guarantee
`@ReturnCode` is never `NULL` on a RETURN?" For read sprocs, that answer is eager resolution at proc entry. For write
sprocs, it is the existing per-branch pattern.

### Desired ✅

```sql
-- Read / report sproc: resolve every return code this proc can hand back, at
-- proc entry, with a severity-16 raise if dbo.Error is misconfigured.
declare @Ok int;
declare @NoRowsFound int;
declare @InvalidCustomerSegment int;

select @Ok = ErrorID
from dbo.Error
where ErrorCode = 'gcOK';
if @Ok is null
    raiserror ('Missing Error table row: gcOK', 16, 1);

select @NoRowsFound = ErrorID
from dbo.Error
where ErrorCode = 'gcNoRowsFound';
if @NoRowsFound is null
    raiserror ('Missing Error table row: gcNoRowsFound', 16, 1);

select @InvalidCustomerSegment = ErrorID
from dbo.Error
where ErrorCode = 'gcInvalidCustomerSegment';
if @InvalidCustomerSegment is null
    raiserror ('Missing Error table row: gcInvalidCustomerSegment', 16, 1);

-- ... existence checks and main query ...

if @@rowcount = 0
    return @NoRowsFound;

return @Ok;
```

### Not desired ❌

```sql
-- wrong: read sproc resolves gcNoRowsFound / gcOK ad-hoc after the heavy
-- query; a missing seed row leaves @ReturnCode = NULL and the wrapper sees an
-- unclassifiable return code instead of a loud severity-16 from the sproc.
if @@rowcount = 0
    select @ReturnCode = ErrorID from dbo.Error where ErrorCode = 'gcNoRowsFound';
else
    select @ReturnCode = ErrorID from dbo.Error where ErrorCode = 'gcOK';

return @ReturnCode;
```
