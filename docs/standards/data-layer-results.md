---
last_updated_at: 2026-05-25
---

# Data layer results

This standard governs sproc return-code enums, row TypedDicts, result-column validation, and multiple result sets.

## SprocReturnCode

### Enumerate every code the wrapper handles, annotate with the SQL ErrorCode

`SprocReturnCode` is an `IntEnum` with one member per return code the wrapper expects. Each value is annotated with an
inline comment naming the corresponding `ErrorCode` from `dbo.Error` (`gcOK`, `gcNoRowsFound`, `gcDatabaseError`,
`gcDuplicateData`, `gcStringTooLong`, ...) so a reader can cross-reference the SQL source without leaving the file
(app_GetAllLinks.py:24-30;
app_InsertProduct.py:52-60).

```python
class SprocReturnCode(IntEnum):
    """Return codes surfaced by `app_InsertProduct`.

    Values are ErrorIDs from the ERROR table in the database.
    """

    SUCCESS = 0            # gcOK
    DATABASE_ERROR = 14    # gcDatabaseError
    DUPLICATE_DATA = 15    # gcDuplicateData
    STRING_TOO_LONG = 49   # gcStringTooLong
```

Source:
app_InsertProduct.py:52-60.

### Docstring is one-line purpose + one-line source-of-truth, nothing else

The `SprocReturnCode` docstring has at most two short paragraphs: a one-line statement of what the enum is for and a
one-line source-of-truth statement. Discovery SQL
(`SELECT ErrorID, ErrorCode FROM dbo.Error WHERE ErrorCode IN (...)`), runtime-implementation notes about what the SQL
body does at execution time, and authoring-time scaffolding do not belong in the docstring. The SQL query used to
derive the enum values lives in PR descriptions or scratch notes; the enum values themselves are the committed record
(review precedent).

#### Desired ✅

```python
class SprocReturnCode(IntEnum):
    """Return codes surfaced by `app_UpdateVendor`.

    Values are ErrorIDs from the ERROR table in the database.
    """

    SUCCESS = 0            # gcOK
    NO_ROWS_FOUND = 1      # gcNoRowsFound
    DATABASE_ERROR = 14    # gcDatabaseError
    DUPLICATE_DATA = 15    # gcDuplicateData
    STRING_TOO_LONG = 49   # gcStringTooLong
```

Source:
app_UpdateVendor.py:59-69.

#### Not desired ❌

```python
class SprocReturnCode(IntEnum):
    """Return codes surfaced by `app_UpdateVendor`.

    Values are ErrorIDs from the ERROR table in the database, confirmed via:
    SELECT ErrorID, ErrorCode FROM dbo.Error WHERE ErrorCode IN (
        'gcOK', 'gcNoRowsFound', 'gcDatabaseError', 'gcDuplicateData'
    )

    Note: the sproc looks up codes at runtime from the Error table; ...
    """
# Not desired: discovery SQL and runtime-implementation trivia bloat the
# docstring. The query belongs in a one-time investigation note, not in
# committed Python prose.
```

## Result rows — SprocDataResultReturnRow and column validation

### Define a `TypedDict` per result row, derive `SPROC_RETURN_ROW_COLUMN_NAMES`

When a sproc returns a result set, define a `TypedDict` named `SprocDataResultReturnRow` with one field per result
column, in the order the SQL `SELECT` declares them. Derive `SPROC_RETURN_ROW_COLUMN_NAMES` from
`SprocDataResultReturnRow.__annotations__.keys()` so the column-name tuple stays in lockstep with the type
(data-layer-guide.md §SprocDataResultReturnRow TypedDict;
app_GetAllLinks.py:45-63).

```python
class SprocDataResultReturnRow(TypedDict):
    """Result row returned by `app_GetAllLinks`."""

    LinkID: int
    LinkName: str
    LinkDescription: str
    CreatedBy: str
    CreatedOn: datetime
    UpdateBy: str
    UpdatedOn: datetime
    Timestamp: bytes
    msrepl_tran_version: UUID

SPROC_RETURN_ROW_COLUMN_NAMES: Final[tuple[str, ...]] = tuple(
    SprocDataResultReturnRow.__annotations__.keys()
)
```

Source:
app_GetAllLinks.py:45-63.

For columns whose names are not legal Python identifiers (spaces, leading digits), use the functional `TypedDict` form:

```python
SprocDataResultReturnRow = TypedDict(
    "SprocDataResultReturnRow",
    {
        "A Column With Spaces": int,
        ...
    },
)
```

Source:
data-layer-guide.md §SprocDataResultReturnRow TypedDict.

### Validate columns with `validate_column_names`, then `dict(zip(..., strict=True))` into the TypedDict

After the success-path return-code dispatch, read `cursor.description`, derive the actual column-name tuple, and call
`validate_column_names` from `data.sprocs.util`. Under `testing=True` it raises `MismatchedColumnsError`; in production
it logs the discrepancy. Then `fetchall` (or `fetchone` for single-row sprocs) and zip each row into the `TypedDict`
with `strict=True` so a row with an unexpected arity raises
(util.py;
app_GetAllLinks.py:108-126).

After `fetchall`, a bare `assert cursor_result is not None` is the correct guard — `pymssql` guarantees `fetchall` on a
non-empty result set returns a list, never `None`, so the assertion is a contract check rather than a plausible runtime
condition. After `fetchone`, use a guarded `if result is None: raise UnexpectedStoredProcedureCallError(...)` instead —
`fetchone` genuinely returns `None` when no row is present, which is a real failure for sprocs that must return exactly
one row
(app_GetAllLinks.py:121-122;
app_InsertProduct.py:176-178).

```python
description = cursor.description or tuple()
column_names = tuple(column[0] for column in description)

validate_column_names(
    stored_procedure_name=SPROC_NAME,
    expected_column_names=SPROC_RETURN_ROW_COLUMN_NAMES,
    actual_column_names=column_names,
    testing=testing,
)

cursor_result = cursor.fetchall()
assert cursor_result is not None

results = [
    cast(SprocDataResultReturnRow, dict(zip(SPROC_RETURN_ROW_COLUMN_NAMES, row, strict=True)))
    for row in cursor_result
]

return results
```

Source:
app_GetAllLinks.py:108-126.

For an INSERT-style sproc that returns one row (the inserted PK), fetch a single row with `fetchone`, guard for `None`,
and `cast` into the TypedDict:

```python
result = cursor.fetchone()

if result is None:
    raise UnexpectedStoredProcedureCallError("Sproc returned no result when result set was expected.")

row = cast(
    SprocDataResultReturnRow,
    dict(zip(SPROC_RETURN_ROW_COLUMN_NAMES, result, strict=True)),
)
return row
```

Source:
app_InsertProduct.py:166-176.

## Multiple result sets — compute once, return many

When a caller needs two different shapes of data that both derive from the same expensive computation — for example, a
fully-aggregated view *and* a finer-grained breakdown of the same rows — the stored procedure returns both as
**separate result sets from a single execution**, and the wrapper reads both. Do not have a caller (a service function,
a second query, or a second stored procedure) re-run the underlying source to recover the shape the first call
discarded.

The principle is **compute once, return many**. A stored procedure that has already materialized its working set (e.g.,
into a temp table) can emit additional `SELECT`s off that same working set almost for free. Re-deriving the second
shape elsewhere re-runs the expensive source — and splitting the work into a second procedure does not help, because
each procedure still pays the full cost of the underlying computation. What matters is the number of *executions* of
the expensive source, not the number of call sites. A procedure's local temp tables (`#temp`) are dropped when it
returns, so the only way to reuse that materialized work is an additional result set *inside* the same procedure — the
wrapper cannot read the temp table after the call.

The wrapper reads result sets in order: `fetchall()` (or `fetchone()`) consumes the first, then `cursor.nextset()`
advances to the next. Define a `TypedDict` and a derived `*_COLUMN_NAMES` tuple per result set, validate each with
`validate_column_names`, and return them together (a small dataclass or a tuple) so the service layer composes the
shapes instead of re-querying. Gate optional result sets on the parameters that produce them, and have the procedure
emit any additive result set *after* its return-code / `@@ROWCOUNT` logic so the extra `SELECT` cannot perturb the
return code.

> **Verify `cursor.returnvalue` timing.** Some pymssql/driver versions do not populate `cursor.returnvalue` until every
> result set has been consumed. When a wrapper reads more than one result set, confirm the return-code dispatch
> (including the error and no-rows paths) still behaves correctly, and restructure to read `returnvalue` after draining
> the sets if it reads stale.

### Desired ✅

```python
class SprocDataResultReturnRow(TypedDict):
    """First result set — fully aggregated rows."""

    VendorID: int
    StatementSubTotal: Decimal

SPROC_RETURN_ROW_COLUMN_NAMES: Final[tuple[str, ...]] = tuple(
    SprocDataResultReturnRow.__annotations__.keys()
)

class SprocBreakdownRow(TypedDict):
    """Second result set — finer breakdown off the same materialized working set."""

    VendorID: int
    Partition: str
    StatementSubTotal: Decimal

SPROC_BREAKDOWN_COLUMN_NAMES: Final[tuple[str, ...]] = tuple(
    SprocBreakdownRow.__annotations__.keys()
)

@dataclass
class SprocResult:
    rows: list[SprocDataResultReturnRow]
    breakdown_rows: list[SprocBreakdownRow] | None  # None when the procedure did not emit it

# inside exec_sproc, after the first result set is fetched into `results`:
breakdown_rows: list[SprocBreakdownRow] | None = None
if cursor.nextset():
    description = cursor.description or tuple()
    validate_column_names(
        stored_procedure_name=SPROC_NAME,
        expected_column_names=SPROC_BREAKDOWN_COLUMN_NAMES,
        actual_column_names=tuple(c[0] for c in description),
        testing=testing,
    )
    breakdown_rows = [
        cast(SprocBreakdownRow, dict(zip(SPROC_BREAKDOWN_COLUMN_NAMES, row, strict=True)))
        for row in (cursor.fetchall() or [])
    ]

return SprocResult(rows=results, breakdown_rows=breakdown_rows)
```

### Not desired ❌

```python
# Not desired: the service layer re-runs the same expensive source to recover the
# breakdown the first call aggregated away. The underlying computation now executes
# twice per request. A second stored procedure would not fix this — it would still
# re-run the source. The breakdown should be a second result set off the one execution.
rows = app_SomeReport.exec_sproc(sproc_args=args, connection=connection)
with connection.cursor() as cursor:
    cursor.execute("SELECT ... FROM dbo.fn2_ExpensiveSource(%s, ...)", (...))  # wrong
    breakdown = cursor.fetchall()
```
