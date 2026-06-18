---
last_updated_at: 2026-05-25
---

# Data Layer

This stack-specific baseline assumes a Python backend that calls SQL Server stored procedures through
`pymssql.callproc`. The `data` layer (`backend/src/data/`) wraps complex database objects; the `data.sprocs` package
contains one Python wrapper module per stored procedure. Wrappers are the project's single seam between Python and
stored procedures; every convention in this document protects that seam. Teams using an ORM, a document database,
PostgreSQL functions, or another data-access model should replace this file with equivalent guidance for their stack.

## Overview

Each module under `backend/src/data/sprocs/` is a thin, structurally uniform wrapper around one stored procedure of the
same name. The wrapper exposes:

- `SPROC_NAME: Final[str]` — the SQL object name as a constant.
- `SprocArguments` — a `@dataclass` representing the sproc's full parameter surface.
- `SprocReturnCode` — an `IntEnum` of every return code the wrapper handles.
- `exec_sproc(...)` — a keyword-only function that runs the sproc and either returns rows or raises a typed error.
- `SprocDataResultReturnRow` and `SPROC_RETURN_ROW_COLUMN_NAMES` — present when the sproc returns a result set.
- Wrapper-local subclasses of `StoredProcedureCallError` — one per business-distinct error the sproc surfaces.

Service-layer code constructs a `SprocArguments`, calls `exec_sproc`, and either receives rows or catches a typed
exception. No service file ever calls `cursor.execute(...)` or `cursor.callproc(...)` against a stored procedure
directly
(data-layer-guide.md §Quick Start;
review precedent).

### Directory layout

```text
backend/src/data/sprocs/
├── __init__.py                 # Shared exceptions: StoredProcedureCallError,
│                               # DatabaseErrorReturnCodeError, MismatchedColumnsError,
│                               # UnexpectedStoredProcedureCallError; __all__ lists wrappers
├── util.py                     # validate_column_names / column_names_are_expected
├── app_AddAccountRole.py
├── app_GetAllLinks.py
├── app_GetAllVendors.py
├── app_InsertProduct.py
├── app_UpdateVendor.py
├── app_CreateUnpostedTicketBulk.py
└── ... (one module per sproc)
```

Source:
`backend/src/data/sprocs/__init__.py`;
`data-layer-guide.md §Directory Layout`.

### Shared exception hierarchy

Every wrapper-local exception subclasses `StoredProcedureCallError`. `__init__.py` defines four exception classes that
wrappers reuse or inherit from:

- `StoredProcedureCallError` — base class; carries a `ClassVar[str]` `ERROR_MESSAGE` and an optional `sproc_name`.
- `DatabaseErrorReturnCodeError` — the generic catch-all for the `gcDatabaseError` return code.
- `MismatchedColumnsError` — raised by `validate_column_names` under `testing=True`.
- `UnexpectedStoredProcedureCallError` — raised when a return code is not one of the wrapper's enumerated cases.

Wrappers add entity-specific subclasses (`VendorNotFoundError`, `ProductNameInUseError`, `AccountRoleDuplicateError`)
when the sproc surfaces business-distinct error states
(__init__.py:51-118;
app_InsertProduct.py:15-50;
app_UpdateVendor.py:14-58).

## Service-layer / data-layer boundary

All access to stored procedures goes through a wrapper module. Service files in `backend/src/svc/` import the wrapper,
build a `SprocArguments`, and call `exec_sproc`. Service code does not assemble SQL strings for sprocs, does not call
`cursor.execute("EXEC ...")` to invoke a sproc, and does not call `cursor.callproc` directly. If a service operation
needs multiple sproc calls inside one transaction, compose `exec_sproc` calls on a shared connection rather than
dropping to raw SQL (review precedent).

### Desired ✅

```python
# backend/src/svc/role.py
from data.sprocs import app_CreateRole

def create_role(*, name: RoleName, display_name: str, description: str, connection) -> Role:
    sproc_args = app_CreateRole.SprocArguments(
        Name=name,
        DisplayName=display_name,
        Description=description,
    )
    app_CreateRole.exec_sproc(sproc_args=sproc_args, connection=connection)
    ...
```

### Not desired ❌

```python
# Not desired: raw SQL inside svc/ bypasses the sproc-wrapper seam
def create_role(name: str, conn):
    with conn.cursor() as cursor:
        cursor.execute("INSERT INTO Role (Name) VALUES (%s)", (name,))
```

The data layer is the only file set that names sproc objects, marshals OUTPUT parameters, decodes return codes, and
validates column names. Reproducing any of that in `svc/` re-creates exactly the parallel-access-path problem that the
wrapper layer was built to prevent.

## SprocArguments

### Mirror the SQL parameter surface in full

`SprocArguments` is the Python representation of the SQL sproc's parameter signature. Every parameter the sproc
declares is exposed as a dataclass field — no more, no less. Do not omit declared parameters and hardcode them inside
`exec_sproc`; that hides the sproc's actual API from callers and from static analysis. Do not invent fields that the
SQL sproc does not declare (review precedent).

The one exception is `@ErrorMessage OUTPUT`: it is a SQL-level OUTPUT parameter, not a caller-supplied value, and is
handled inside `exec_sproc` by passing `pymssql.output(str, None)` in the callproc tuple. Document the omission with a
comment in `SprocArguments` so a reader sees that the parameter is intentionally absent.

#### Desired ✅

```python
@dataclass
class SprocArguments:
    """Parameters accepted by `app_InsertProduct`.

    ProductDescription and ProductName are required. Username has a default.
    """

    ProductDescription: str
    ProductName: str
    Username: str = "FIXTHIS"
    # @ErrorMessage: Not in SprocArguments — captured as OUTPUT parameter in exec_sproc
```

Source:
app_InsertProduct.py:64-76.

#### Not desired ❌

```python
@dataclass
class SprocArguments:
    # Not desired: ProductName dropped from the dataclass and hardcoded in exec_sproc;
    # the Python type no longer reflects the SQL signature.
    ProductDescription: str
```

### Use qualified PascalCase field names that match the SQL parameter

Field names in `SprocArguments` match the SQL parameter name exactly. The convention for current `app_*` sprocs is
qualified PascalCase (`AccountId`, `GrantedById`, `RoleName`, `VendorID`, `LinkID`). Older sprocs (`legacy_*`) used
Hungarian notation (`lDataProviderID`, `tSortByColumn`, `sDataProviderName`); when wrapping or maintaining those,
mirror the SQL name and silence the linter with `# noqa: N815`. Either way, a bare `Id` is forbidden when more than one
domain entity is in scope on the same sproc (review precedent;
data-layer-guide.md §Matching SQL Parameter Names).

For `legacy_*` wrappers, the `SprocArguments` docstring must include an IMPORTANT paragraph explaining the
SQL-name-fidelity contract — that parameter names are intentionally non-Pythonic to mirror the SQL sproc's
Hungarian-notation names exactly, and that `# noqa: N815` suppresses the resulting lint warnings. This note is
necessary because the naming looks wrong to Python readers without context
(data-layer-sproc-examples.md §Stored Procedure That Returns Data).

```python
@dataclass
class SprocArguments:
    """Parameters accepted by `legacy_ListVendor`.

    IMPORTANT: Parameter names MUST exactly match the SQL stored procedure's
    parameter names, including Hungarian notation (e.g., lDataProviderID).
    Use # noqa: N815 to suppress naming convention warnings.
    """

    lDataProviderID: int | Literal[-1] = -1  # noqa: N815
```

Source:
data-layer-sproc-examples.md §Stored Procedure That Returns Data.

#### Desired ✅

```python
# Modern app_* convention — qualified PascalCase, no Hungarian prefix
@dataclass
class SprocArguments:
    """Parameters accepted by `app_AddAccountRole`."""

    AccountId: UUID
    GrantedById: UUID
    RoleName: str
```

Source:
app_AddAccountRole.py:39-44.

```python
# Legacy legacy_* convention — Hungarian notation preserved; noqa: N815 to silence lint
@dataclass
class SprocArguments:
    """Parameters accepted by `legacy_ListVendor`."""

    lDataProviderID: int | Literal[-1] = -1  # noqa: N815

    # tSortByColumn: int = 1
    # ^ Not exposed: always hardcoded to 1 in exec_sproc below
```

Source:
data-layer-sproc-examples.md §Stored Procedure That Returns Data.

#### Not desired ❌

```python
@dataclass
class SprocArguments:
    id: str       # Not desired: ambiguous — account_id? role_id? permission_id?
    granter: str
    role: str
```

### No-argument sprocs still define `SprocArguments` with `pass`

When the SQL sproc declares no parameters, `SprocArguments` is still required — it is defined as an empty dataclass
with a `pass` body. The uniform structural contract means `exec_sproc` always accepts a `sproc_args: SprocArguments`
keyword argument regardless of whether any parameters exist
(app_ListReturnAddress.py:23-26).

```python
@dataclass
class SprocArguments:
    """Parameters accepted by `app_ListReturnAddress`."""

    pass
```

Source:
app_ListReturnAddress.py:23-26.

### Type SQL `CHAR(1)` boolean-flag parameters as `Literal["Y", "N"]`

SQL `CHAR(1)` flag parameters (`@UpdateFlag`, `@IsActive`, `@SulfurCalculationFlag`, etc.) are typed as
`Literal["Y", "N"]` in `SprocArguments` — not as Python `bool`. Pass them directly in the callproc tuple without
conversion. This applies to both legacy `legacy_*` and current `app_*` wrappers
(legacy_UpdateDataProvider.py:30;
app_GetCustomerSegmentById.py:56-62).

```python
sUpdateFlag: Literal["Y", "N"]  # noqa: N815  # Y = update existing, N = insert new
```

Source:
legacy_UpdateDataProvider.py:30.

### Document hardcoded or omitted parameters with comments

A wrapper may legitimately omit a SQL parameter when the parameter is always hardcoded in `exec_sproc` (legacy `legacy_*`
style) or held for OUTPUT handling (`@ErrorMessage`). Mark the omission in `SprocArguments` with a commented-out field
or a one-line note. The reader of the dataclass should see the full SQL signature, with omissions explicit
(data-layer-guide.md §Omitting Parameters).

```python
@dataclass
class SprocArguments:
    """Parameters accepted by `legacy_ListVendor`."""

    lDataProviderID: int | Literal[-1] = -1  # noqa: N815

    # tSortByColumn: int = 1
    # ^ Not exposed: always hardcoded to 1 in exec_sproc below
```

Source:
data-layer-sproc-examples.md.
