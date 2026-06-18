---
last_updated_at: 2026-05-25
---

# Database

This standard governs SQL Server objects under `backend/database/sql_migrations/` — tables, columns, primary and
foreign keys, unique constraints, indexes, stored procedures, migrations, and the tSQLt tests that cover them. The
database is a brownfield adaptation of a twenty-year-old legacy schema that accumulated significant business logic
inside its stored procedures, so this document codifies both the conventions every net-new object must follow and the
modernization discipline that brings legacy objects into conformance over time
(database-guide.md,
database-modernization-approach.md).

## Overview

Naming database objects in a consistent way lets both humans and agents reason about the system and avoid mistakes. The
conventions here apply to every new object and to legacy objects whenever they are touched, regardless of how the
surrounding code is named. The legacy database carried no systemic approach to formatting, linting, or testing;
modernization is incremental — coverage is added object by object, formatting and linting are enabled once an object is
brought to standard, and bugs that surface in the process are first captured as `KNOWNBUG_` tests so subsequent
rewrites can change behavior with confidence
(database-modernization-approach.md).

Every new stored procedure is named with the `app_` prefix and lives in a Flyway repeatable migration
(`R__dbo.app_<Name>.sql`). The `legacy_` prefix is reserved for legacy procedures ported from the old system that retained
their original name. A sproc is net-new if it was authored in this repository rather than migrated from an earlier
database (review precedent; see
`R__dbo.app_ListReturnAddress.sql`).

### Desired ✅

```sql
create or alter procedure dbo.app_ListReturnAddress
    @ErrorMessage varchar(500) = null output,
    @Username varchar(128) = 'FIXTHIS'
as
begin
    -- ...
end
go
```

### Not desired ❌

```sql
create or alter procedure dbo.legacy_ListReturnAddress
-- wrong: net-new sproc using the legacy legacy_ prefix
    ...
```

## Object naming

Table names and column names are singular, PascalCase, and contain no word separators. `MyTable` is correct;
`MyTables`, `My_Table`, and `myTable` are not. Column names follow the same shape — `MyColumn`, not `MyColumns` or
`My_Column`
(database-guide.md §Naming).

Primary key columns are named with the suffix `ID` (both letters capitalized) and are prefixed by the table name. For a
table `InvoiceLine` the primary key is `InvoiceLineID`, never `InvoiceLine_ID` or `InvoiceLineIDs`. Foreign key columns
are identical in name to the primary key of the parent table — so the child table `InvoiceLine` references parent
`Invoice` via a column named `InvoiceLine.InvoiceID`. This convention means any column whose name ends in `ID` and
matches a known table is, at a glance, either that table's PK or an FK to it
(database-guide.md §Column Names).

Primary key constraint names follow the brownfield convention `<TableName>_PK`. This is inherited from the legacy
database and is preserved on new tables for continuity
(database-guide.md §Primary Keys).

Foreign key constraints are named in the form `FK_<ParentTable>$<ChildTable>`. The dollar-sign separator is a
deliberate choice that makes the parent–child relationship readable at a glance and the constraint name
pattern-matchable in stored-procedure error-handling code (see [database-sproc-errors.md](./database-sproc-errors.md)).
Auto-generated names like `FK__DataProvi__LinkI__1C873BEC` are unacceptable for new constraints; existing such names
should be surfaced to the developer and only renamed when explicitly directed to do so, because renames must be
coordinated with every sproc and test that pattern-matches the old name
(database-guide.md §Foreign Key Constraints).

### Desired ✅

```sql
alter table CustomerSegmentPipeline
add constraint FK_CustomerSegment$CustomerSegmentPipeline
foreign key (CustomerSegmentID) references CustomerSegment (CustomerSegmentID);
```

```sql
-- Renaming an auto-generated FK to the convention
exec sp_rename
    'FK__LegacyTa__Paren__28ED12D1',
    'FK_CustomerSegment$CustomerSegmentPipeline',
    'OBJECT';
```

(Source:
`V00032__rename_fk_CustomerSegmentPipeline.sql`.)

### Not desired ❌

```sql
-- SQL Server auto-generated name; opaque and not pattern-matchable in catch blocks
FK__DataProvi__LinkI__1C873BEC
```

### Unique constraints (alternate keys)

The unique-key convention serves a business-rule purpose: a unique constraint is documentation that a column or column
combination is an alternate key to the primary key, and the underlying index it creates also accelerates queries that
filter on those columns. Names use the prefix `AK_` followed by the table name and the column name(s), all separated by
underscores
(database-guide.md §Unique Indexes - As Constraints).

For a single-column alternate key:

```sql
alter table Location
add constraint AK_Location_LocationName unique (LocationName);
```

For a compound alternate key, list each column in order, separated by underscores:
`AK_InvoiceLine_InvoiceID_ControlCode`. Names like `AK_Location` alone are unacceptable — when SQL Server raises a
constraint violation, the constraint name is the only signal in the error message about which column or combination was
the problem, and a name that omits the column makes the failure impossible to localize
(database-guide.md §Unique Indexes - As Constraints).

### Not desired ❌

```sql
-- Ambiguous: which column violated?
constraint AK_Location unique (LocationName)
```

```sql
-- Missing word separator; loses the table/column boundary
constraint AKInvoiceLineInvoiceIDControlCode unique (InvoiceID, ControlCode)
```

## Constraints

### Declarative UNIQUE, never CREATE UNIQUE INDEX

Column uniqueness in new and modified tables is enforced through `ALTER TABLE … ADD CONSTRAINT … UNIQUE` (or the
equivalent inline `CREATE TABLE` constraint). Do not use `CREATE UNIQUE INDEX` for a uniqueness rule. The declarative
form documents business intent at the table level, is ANSI-SQL standard compliant, and can be the target of foreign-key
references — three properties unique indexes lose. The accompanying naming convention is `AK_<TableName>_<Cols>` (the
legacy `UQ_` prefix appears in some early discussions but the codified, in-use form in
`backend/database/sql_migrations/versioned/` is `AK_<Table>_<Cols>`)
(review precedent;
database-guide.md §Unique Indexes - As Constraints;
`V00017__add_unique_constraints_DataProvider.sql`).

### Desired ✅

```sql
-- From V00017__add_unique_constraints_DataProvider.sql
alter table DataProvider
add constraint AK_DataProvider_DataProviderName unique (DataProviderName);

alter table DataProvider
add constraint AK_DataProvider_DataProviderCode unique (DataProviderCode);

-- The migration also drops any pre-existing non-convention unique indexes
-- it is replacing:
drop index if exists IX_DataProvider_DataProviderName on DataProvider;
```

### Not desired ❌

```sql
create unique index IX_Accounts_Email on Accounts (Email);
-- wrong: index, not declarative constraint; loses FK-target eligibility and
-- documents nothing at the table level
```

### Unique index as an exception for tolerated legacy duplicates

The one place a unique index is acceptable is when a column should be unique going forward but already contains a fixed
set of duplicate values inherited from the legacy database, and those duplicates cannot be cleaned up. A filtered
unique index lets you enforce uniqueness for everything outside that small exception set without forcing the schema to
swallow the duplicates as if they were intended
(database-guide.md §Unique Indexes as Exceptions to the rule).

### Desired ✅

```sql
create unique index AK_Product_ProductName
on dbo.Product(ProductName)
where ProductName <> 'a'
  and ProductName <> 'CCB'
  and ProductName <> 'CRUDE'
  and ProductName <> 'TCS';
```

The where clause names the known duplicates explicitly. New duplicates outside the listed values cannot be inserted,
and any sproc that catches error_number 2627/2601 (unique violation) will receive a constraint name it can
pattern-match against.

### Foreign key renames must propagate to sprocs and tests in the same PR

The sproc layer translates SQL Server FK-violation messages to typed business error codes by string-matching the
constraint name inside the catch block (`@DbErrorMsg like '%<FK name>%'`). The same constraint name appears in tSQLt
tests that apply or remove the constraint by name. Renaming a foreign-key constraint without updating those string
matches breaks the error contract silently: callers fall through to the generic `gcDatabaseError` branch instead of
receiving `gcNoParentRecord` or `gcInvalidReference`
(review precedent at
`app_InsertCustomerSegment.sql:222`
and
`app_UpdateCustomerSegment.sql:217`).

The audit checklist for a FK-rename PR:

1. Grep `backend/database/sql_migrations/stored-procedure/` for the old constraint name.
1. Grep `backend/database/sql_migrations/tests/` for the old name (used in `tSQLt.ApplyConstraint` and `RemoveObject`
   calls).
1. Grep `backend/src/data/sprocs/` and `backend/src/svc/` for any Python references in error-mapping dicts.
1. Include the rename and every downstream string-match update in the same migration `.sql` (or at minimum the same PR)
   so the schema and the sproc error-handling change atomically.

### Desired ✅

```sql
-- Same PR rolls out the rename and the catch-block update together:

-- 1. Migration
alter table CustomerSegment drop constraint FK_CustomerSegment$CustomerSegmentPipeline;
alter table CustomerSegment add constraint FK_CustomerSegmentPipeline$CustomerSegment
    foreign key (CustomerSegmentPipelineID) references CustomerSegmentPipeline (CustomerSegmentPipelineID);

-- 2. app_InsertCustomerSegment.sql catch block updated in the same PR:
else if @DbErrorMsg like '%FK_CustomerSegmentPipeline$CustomerSegment%'
    select @ErrorMessage = 'Invalid Customer Segment Pipeline ID.'
```

### Not desired ❌

```sql
-- wrong: rename ships without updating the catch-block string match
alter table CustomerSegment drop constraint FK_CustomerSegment$CustomerSegmentPipeline;
alter table CustomerSegment add constraint FK_CustomerSegmentPipeline$CustomerSegment
    foreign key (CustomerSegmentPipelineID) references CustomerSegmentPipeline (CustomerSegmentPipelineID);
-- The sproc still pattern-matches the old name and now falls through to
-- gcDatabaseError on every FK violation against this constraint.
```

## Related standards

- data-layer-pr-conventions.md
  — the Python wrapper around these sprocs, including `SprocArguments` and the alphabetical-`callproc` order this
  document's sproc-parameter rule was created to enable.
- http-layer-guide.md — the HTTP route
  layer that consumes `@ReturnCode` / `@ErrorMessage` and maps them to status codes and response bodies.
