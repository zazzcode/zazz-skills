---
last_review_sha: ac73578bab3bd2c329a6b67232c5146bce90eb89
---

> **Superseded by [`data-layer.md`](data-layer.md).** The unified standard is the authoritative source for current
> rules. Sections of this guide describe older patterns the team has moved away from — notably the "MAY omit hardcoded
> parameters" permission and the framing of Hungarian-notation field names as the primary convention. Where this guide
> conflicts with `data-layer.md`, the unified standard wins.

# Data Layer Guide

## Table of Contents

- [Quick Start](#quick-start)
- [Directory Layout](#directory-layout)
- [Required Idioms](#required-idioms)
- [Optional Idioms](#optional-idioms)
- [Reference](#reference)

## Quick Start

The `data` layer (`/src/data`) wraps complex database objects. This baseline assumes many stored procedures with
idiosyncratic behavior; the `data.sprocs` package contains Python bindings to them.

This baseline wraps only stored procedures. The service layer may write SQL queries against tables and
views inline.

For complete, copy-paste-ready examples, see [Data Layer Sproc Examples](data-layer-sproc-examples.md).

## Directory Layout

```
src/data/sprocs/
├── __init__.py
├── legacy_GetPostedTickets.py
├── legacy_GetUnpostedTicket.py
├── legacy_GetUnpostedTickets.py
├── legacy_ListAuditNumber.py
├── legacy_ListDataProvider.py
├── legacy_ListLink.py
├── legacy_ListLocation.py
├── legacy_ListPipeline.py
├── legacy_ListPipelineCode.py
├── legacy_ListProduct.py
├── legacy_ListCustomerSegment.py
├── legacy_ListVendor.py
├── legacy_UpdateDataProvider.py
└── util.py                    # Shared utilities for all stored procedures
```

Each module (except `util.py`) is a Python wrapper around a stored procedure with the same name. There are many more
stored procedures in the database that do not yet have Python wrappers.

## Required Idioms

All stored procedure modules **MUST** have the following module attributes.

### Procedure Name Constant

```python
SPROC_NAME: Final[str] = "storedProcedureName"
```

### SprocArguments Dataclass

```python
@dataclass
class SprocArguments:
    """Parameters accepted by the stored procedure.

    IMPORTANT: Parameter names MUST exactly match the SQL stored procedure's
    parameter names, including Hungarian notation (e.g., lDataProviderID,
    tSortByColumn). Use # noqa: N815 to suppress naming convention warnings.
    """
    ...
```

If the SQL sproc itself doesn't take arguments, define a `SprocArguments` dataclass without any attributes:

```python
@dataclass
class SprocArguments
    """Parameters accepted by `<name of sql sproc>`"""

    pass
```

### exec_sproc Function

```python
def exec_sproc(
    *,
    sproc_args: SprocArguments,
    connection: pymssql.Connection,
    testing: bool = False,
) -> list[SprocDataResultReturnRow]:  # or None if sproc doesn't return data
    ...
```

The `testing` parameter is passed as `True` only in the test suite; service callsites should not pass this.

## Optional Idioms

These are present when the stored procedure's behavior requires them.

### SprocReturnCode Enum

Present if the stored procedure returns status codes:

```python
class SprocReturnCode(IntEnum):
    """Return codes surfaced by `storedProcedureName`."""

    SUCCESS = 0
    NO_RESULTS = 1
    ...
```

### Return Code Handling

Always handle return codes with a single `if/elif/else` chain. Check `SUCCESS` first, then specific error codes as
`elif` branches, then `else` as a catch-all for unexpected codes:

```python
if return_value == SprocReturnCode.SUCCESS:
    pass  # or `return` for void sprocs

elif return_value == SprocReturnCode.NO_RESULTS:
    return []

else:
    raise StoredProcedureCallError(
        f"Failed to do something: {return_value}",
    )
```

### SprocDataResultReturnRow TypedDict

Present if the stored procedure returns data rows:

```python
class SprocDataResultReturnRow(TypedDict):
    ColumnOne: int
    ColumnTwo: str
    ...
```

For columns that cannot be expressed as Python identifiers:

```python
SprocDataResultReturnRow = TypedDict(
    "SprocDataResultReturnRow",
    {
        "A Column With Spaces": int,
        ...
    }
)
```

### Column Names Tuple

Present alongside `SprocDataResultReturnRow` for column validation:

```python
SPROC_RETURN_ROW_COLUMN_NAMES: Final[tuple[str, ...]] = tuple(
    SprocDataResultReturnRow.__annotations__.keys()
)
```

## Reference

### Matching SQL Parameter Names

Python `SprocArguments` must match SQL parameter names exactly:

```sql
-- SQL Stored Procedure
CREATE OR ALTER PROCEDURE legacy_ListVendor
 @lDataProviderID Integer  = -1,
 @tSortByColumn  TinyInt  = 1
AS
...
```

```python
# Python Wrapper
@dataclass
class SprocArguments:
    """Parameters accepted by `legacy_ListVendor`."""

    lDataProviderID: int | Literal[-1] = -1  # noqa: N815
    # tSortByColumn omitted - hardcoded in implementation
```

Service layer code converts from snake_case to Hungarian notation:

```python
sproc_args = legacy_ListVendor.SprocArguments()
if filters.data_provider_id is not None:
    sproc_args.lDataProviderID = filters.data_provider_id
```

### Omitting Parameters

A Python wrapper **MAY** omit parameters that are always hardcoded. Document omissions with comments:

```python
@dataclass
class SprocArguments:
    """Parameters accepted by the stored procedure."""

    sSomeStringArgument: str  # noqa: N815
    # iProductionPeriodYear: int  # Not exposed - hardcoded in exec_sproc
    # iProductionPeriodMonth: int  # Not exposed - hardcoded in exec_sproc
    sSomeOtherArgument: str  # noqa: N815
```

### util.py Functions

The `data.sprocs.util` module provides shared utilities:

- `validate_column_names()` - Validates that result columns match expected names and order. Raises
  `MismatchedColumnsError` in tests, logs error in production.
- `column_names_are_expected()` - Returns boolean for column name comparison.

Import and use in sprocs that return data:

```python
from data.sprocs.util import validate_column_names

# In exec_sproc, after fetching results:
validate_column_names(
    stored_procedure_name=SPROC_NAME,
    expected_column_names=RETURN_ROW_COLUMN_NAMES,
    actual_column_names=column_names,
    testing=testing,
)
```
