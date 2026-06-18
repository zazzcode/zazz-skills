---
last_updated_at: 2026-05-25
---

# Database stored procedure shape

This standard governs stored procedure parameter ordering, DbErrorMsg declarations, and structured result rows.

## Stored procedures

Every `app_*` sproc follows a small set of structural conventions that together define the project's stored-procedure
API contract. The contract has three return channels: the integer `RETURN` code (sourced from the `Error` table by
`ErrorCode`), the `@ErrorMessage` OUTPUT parameter (developer-facing detail string, surfaced to logs and service-layer
exceptions by the Python wrapper), and the result set (the actual data the caller requested, or nothing on the error
paths). Every convention below exists to keep those three channels consistent across the family.

### Alphabetical parameter ordering

All `app_*` stored-procedure parameter lists are ordered alphabetically by parameter name, case-insensitive. Required
and optional parameters are both alphabetized within their respective groups; the two-group structure
(required-then-optional) is preserved in SQL just as it is in the Python `SprocArguments` wrapper. The Python
`callproc` tuple follows the same order, which means a sproc whose params drift out of alphabetical order silently
misroutes positional arguments — the bug that originally surfaced this rule in review precedent was an
`@ErrorMessage`/`@Username` swap that escaped because the Python wrapper tracked a bespoke per-sproc order
(review precedent; see
`app_GetAllLinks.sql`
and
`app_GetAllLocations.sql`).

### Desired ✅

```sql
create or alter procedure dbo.app_UpdateLink
    @ErrorMessage varchar(500) = null output,
    @LinkID int,
    @LinkName varchar(max) = null,
    @Username varchar(128) = 'FIXTHIS'
```

### Not desired ❌

```sql
create or alter procedure dbo.app_UpdateLink
    @ErrorMessage varchar(500) = null output,
    @Username varchar(128) = 'FIXTHIS',     -- wrong: U sorts after L
    @LinkID int,
    @LinkName varchar(max) = null
```

When out-of-order sprocs are discovered, fix them in a targeted follow-up PR rather than bundling the reorder with
unrelated feature work. Bundling cosmetic reordering makes both halves harder to review and to revert; a dedicated PR
keeps `git log -p` clean (review precedent).

### `@DbErrorMsg` declaration uses `nvarchar(4000)`

Inside a `app_*` sproc, the local variable used to capture `error_message()` is declared `nvarchar(4000)`. Older
outliers such as `app_UpdateDataProvider.sql` declare it `varchar(max)`, but the dominant in-use pattern is
`nvarchar(4000)` and new sprocs follow that
(review precedent; see
`app_UpdateLink.sql`).

### Desired ✅

```sql
declare @DbErrorMsg nvarchar(4000)
```

### Not desired ❌

```sql
declare @DbErrorMsg varchar(max)
-- diverges from the dominant pattern in new sprocs
```

### Return structured rows, never formatted display strings

Sprocs are a data interface. They do not return comma-joined lists, `STRING_AGG` aggregations,
`STUFF(... FOR XML PATH)` concatenations, or any other rendered display form. A list endpoint returns one row per
logical record (or one row per record-relationship pair, with `NULL` columns where the relationship is absent); the
Python service layer or CLI is responsible for any display formatting. Pushing display concerns into T-SQL couples the
DB output to a specific UI/CLI and prevents reuse from other callers
(review precedent; see
`app_ListRoles.sql`).

### Desired ✅

```sql
-- app_ListRoles: one row per role-permission pair, NULL when a role has no
-- permissions assigned. Caller stitches into whatever shape it needs.
select
    r.RoleID        as id,
    r.Name          as name,
    r.DisplayName   as display_name,
    r.Description   as description,
    r.CreateTime    as create_time,
    p.PermissionName as permission_name
from Role r
left join RolePermission rp on rp.RoleID = r.RoleID
left join Permission     p  on p.PermissionID = rp.PermissionID
```

### Not desired ❌

```sql
-- wrong: collapses display formatting into the data layer
select STRING_AGG(r.Name, ', ') as roles
from Role r
```
