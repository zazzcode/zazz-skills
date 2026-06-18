---
last_updated_at: 2026-06-10
---

# Service layer

This stack-specific baseline assumes a Python backend with explicit HTTP, service, and data layers. The service layer
(`backend/src/svc/`) carries the project's business logic, domain validation, and composite domain
operations. Services are pure business logic — no Flask globals, no HTTP concerns, no JSON serialization, no connection
construction. Call sites (HTTP routes, CLI scripts, and background workers) build connections, pass them in, and
consume the typed dataclasses, generators, or scalar returns the services produce. This document governs every file
under `backend/src/svc/` and `backend/scripts/`, including the report subtree and the lookups subtree.

## Overview

The service layer sits between the HTTP layer (`backend/src/http_api/`) and the data layer
(`backend/src/data/sprocs/`). HTTP routes translate requests into typed inputs and call into `svc/`; CLI scripts in
`backend/scripts/` are thin Click wrappers that do the same thing for a developer audience. The data layer exposes one
Python module per sproc; the service layer composes those wrappers into named domain operations and translates
sproc-return-code exceptions into service-typed exceptions
(service-layer-guide.md §Overview).

```text
src/svc/
├── __init__.py
├── account.py                # Account lifecycle and credential management
├── data_providers.py         # Data provider CRUD operations
├── links.py                  # Link CRUD + DataProviderLink junction operations
├── locations.py              # Location CRUD operations
├── permission.py             # RBAC permission management
├── pipelines.py              # Pipeline CRUD
├── products.py               # Product CRUD
├── customer_segments.py        # Customer segment CRUD operations
├── role.py                   # Role management
├── security.py               # Cryptographic operations and token handling
├── vendors.py                 # Vendor CRUD
├── json_utils.py             # JSON canonicalization helpers used by reports/CLI
├── lookups/                  # Slim entity views for dropdown population
│   ├── pipeline_codes.py
│   ├── return_addresses.py
│   ├── wire_instructions.py
│   └── ...
├── reports/                  # Report runners and rendering helpers
│   └── vendor_summary/
│       ├── service.py        # run_report() entry point
│       ├── document.py       # Errors + dataclasses + variant table
│       ├── formatting.py
│       ├── markdown.py
│       └── pdf.py
└── tickets/                  # Ticket retrieval, list, bulk validate
    ├── errors.py             # TicketsServiceError base
    ├── create_unposted_ticket.py
    ├── get_posted_ticket.py
    ├── get_unposted_ticket.py
    ├── list_tickets.py
    └── validate_unposted_tickets.py
```

The directory listing above is load-bearing: when a PR adds a new top-level module (e.g., `svc/links.py`,
`svc/locations.py`), the `service-layer-guide.md` tree must be updated in the same PR so agents and developers don't
miss modules when navigating the layer .

## Composition over raw SQL

Service functions in `backend/src/svc/` invoke sproc wrappers from `backend/src/data/sprocs/`. They do not assemble raw
SQL strings, call `cursor.execute(...)` against business tables, or call `callproc(...)` directly. When a domain
operation needs more than one sproc — for example, the "always full replacement" semantics of `update_account_roles` —
the service composes sproc calls inside a single connection and transaction, rather than dropping to raw SQL
(review precedent; account.py replace block).

The sproc-wrapper-per-sproc pattern is the project's single DB seam. Bypassing it loses the data-layer's error
vocabulary (typed `*NotFoundError` / `*InUseError` / `*TooLongError` raised from sproc return codes), the
alphabetical-`SprocArguments` convention, and OUTPUT-param handling. Routes and CLI scripts then see different
exception shapes depending on which path the code took.

### Desired

```python
def update_account_roles(
    account_external_id: AccountExternalID,
    role_names: list[RoleName],
    connection: pymssql.Connection,
) -> list[RoleListItem]:
    """Atomically replace an account's role set."""
    granted_by_id = AccountExternalID(DB_SERVICE_ACCOUNT_EXTERNAL_ID)

    try:
        app_ClearAccountRoles.exec_sproc(
            sproc_args=app_ClearAccountRoles.SprocArguments(AccountId=account_external_id),
            connection=connection,
        )
    except app_ClearAccountRoles.AccountNotFoundForClearError as e:
        raise AccountNotFoundError(f"Account with external ID {account_external_id} not found") from e

    for role_name in role_names:
        try:
            app_AddAccountRole.exec_sproc(
                sproc_args=app_AddAccountRole.SprocArguments(
                    AccountId=account_external_id,
                    GrantedById=granted_by_id,
                    RoleName=str(role_name),
                ),
                connection=connection,
            )
        except app_AddAccountRole.AccountRoleNotFoundError as e:
            raise RoleNotFoundError(str(role_name)) from e
```

Source: `backend/src/svc/account.py:347`.

### Not desired

```python
def update_account_roles(*, account_external_id, role_names, connection):
    with connection.cursor() as cursor:
        cursor.execute("DELETE FROM AccountRole WHERE AccountID = ...")  # wrong: raw SQL in svc/
        for r in role_names:
            cursor.execute("INSERT INTO AccountRole ...")  # wrong: bypasses sproc + error vocabulary
# Source: shape lifted from review precedent
```

### Closing the post-sproc lookup

Where a service operation needs to enrich the sproc result with a display-name lookup that no sproc provides,
perform the lookup inside the same `connection` cursor — but only after the sproc-driven domain work is complete. The
post-sproc display query in `update_account_roles` is the canonical example: roles have just been validated by the
sproc (so a subsequent `SELECT name, display_name FROM dbo.role WHERE name IN (...)` is guaranteed to match), and the
lookup carries a `noqa: S608` comment because the placeholder list is constructed from a length count, not user input
(account.py:387). Net-new business-table
reads still need their own sproc.

The same carve-out covers a small read-only display-metadata lookup that runs **before** the sproc when the lookup
doubles as the existence check for the sproc's key parameter — for example, resolving a customer segment's name and
description for a report header and raising the binding's invalid-key error when no row matches. Keep such a lookup
inline at its call site with a one-line comment citing this carve-out; do not collect these into a separate `queries`
directory or module. They are single-cursor display reads scoped to one service operation, and moving the SQL away from
its call site hides the connection/transaction context it shares with the sproc call
(review precedent). Business-table reads that
carry domain logic still need their own sproc.

### Do not re-derive in the service layer what the sproc already computed

When the service layer needs a different shape of data the sproc already produced — for example a finer breakdown of
rows the sproc returned in aggregate — do not issue a second query (or call a second sproc) that re-runs the same
underlying source. That doubles the expensive computation: the source ran once inside the sproc and now runs again to
recover the shape the first call discarded. The fix lives in the data layer, not here: have the sproc return the
additional shape as a second result set from its already-materialized working set, and consume both via the wrapper.
See
[data-layer.md §Multiple result sets — compute once, return many](./data-layer.md#multiple-result-sets--compute-once-return-many).
This both removes the redundant work and keeps all SQL behind the sproc seam (per
[Composition over raw SQL](#composition-over-raw-sql)).

## Error classes

Error classes live at the top of the service file, grouped together, after imports and module-level constants and
before any function definition. New error classes added to an existing file join the top-of-file group; they do not get
appended after the function bodies that raise them
(review precedent; links.py L21-91).

Top-of-file grouping lets a reader enumerate the full error vocabulary of a service at a glance. Error classes
scattered throughout the file force readers to hunt for them, and reviewers can't tell from the top of the file whether
the service has 3 errors or 13.

### Desired

```python
"""Service layer for Link operations."""

from dataclasses import dataclass
from datetime import UTC, datetime

import pymssql

from data.sprocs import (
    StoredProcedureCallError,
    UnexpectedStoredProcedureCallError,
    app_DeleteDataProviderLink,
    app_GetAllLinks,
    app_InsertLink,
    app_UpdateLink,
)

class LinkServiceError(Exception):
    """A base class for all Link service errors."""

class LinkNotFoundError(LinkServiceError):
    """Raised when attempting to update a Link that does not exist."""

class LinkNameInUseError(LinkServiceError):
    """Raised when the Link name is already in use."""

class LinkDuplicateDataError(LinkServiceError):
    """Raised when a unique constraint is violated but we cannot determine which field."""

class LinkFieldTooLongError(LinkServiceError):
    """Raised when a text field exceeds its column length limit but we cannot
    determine which field was too long."""

class LinkNameTooLongError(LinkFieldTooLongError):
    """Raised when LinkName exceeds 10 characters."""

# (additional Link errors follow in the same top-of-file block)

@dataclass
class Link:
    ...

def get_all_links(...) -> list[Link]:
    ...
```

Source: `backend/src/svc/links.py:21-91`.

### Not desired

```python
def create_link(...): ...
def update_link(...): ...

# wrong: new error appended after function bodies; will not be seen
# alongside the existing top-of-file error group
class LinkDataProviderConflictError(Exception): ...
# Source: shape lifted from review precedent
```

### Service-error base class per module

Each top-level service module defines a single `<Entity>ServiceError(Exception)` base and inherits every
domain-specific error from it. Callers that want to catch "anything this service might throw" reach for the base;
callers that need a specific outcome reach for the specific subclass. `LinkServiceError` is the canonical shape;
`CustomerSegmentServiceError`, `RoleServiceError`, `AccountServiceError`, `TicketsServiceError`, `LocationServiceError`,
`PipelineServiceError`, `ProductServiceError`, `VendorServiceError`, `DataProviderServiceError`, and
`LookupsServiceError` follow the same pattern.

### Field-too-long: prefer a parameterized error to per-field subclasses

When several fields all need the same shape of error (most commonly "too long" / "duplicate"), prefer a single
parameterized exception class that accepts the field name as data. Per-field subclasses (`NoteMemoFieldTooLongError`,
`AddressFieldTooLongError`, `CommentFieldTooLongError`) duplicate boilerplate for what is really one error with a data
attribute. The field name is data, not a type
.

Existing modules may still carry per-field subclasses such as `LinkNameTooLongError`, `LinkDescriptionTooLongError`,
and `LinkCodeTooLongError`. Treat those as compatibility leftovers. New service modules should start from the
parameterized shape rather than spawning new per-field classes.

#### Desired

```python
class FieldTooLongError(Exception):
    def __init__(self, *, field_name: str) -> None:
        super().__init__(f"{field_name} exceeds maximum length")
        self.field_name = field_name

raise FieldTooLongError(field_name="address")
```

#### Not desired

```python
class NoteMemoFieldTooLongError(Exception): ...   # wrong: one subclass per field
class AddressFieldTooLongError(Exception): ...
class CommentFieldTooLongError(Exception): ...
# Source: shape called out by reviewer at review precedent
```

### Dead error classes

An error class with no reachable raise site in the file (or any importing caller) is dead code. It misleads readers
into thinking the failure mode is recoverable at a call site, and static analysis tools cannot flag callers as
incomplete because the class still resolves. Remove the class outright when it can never be raised under current sproc
behavior; if the unreachability is temporary (e.g., the sproc returns `SUCCESS` for the case today but will be updated
later), add an inline comment naming the condition under which the class becomes live
.

The original `LinkDataProviderMappingNotFoundError` was deleted on this basis: `app_DeleteDataProviderLink` returns
`SUCCESS` even when the `(LinkID, MappingID)` pair did not exist, so no raise site was reachable. The class remains in
`links.py` only when subsequent stored procedure work re-introduces a reachable case. The principle of "delete or
annotate" is unchanged.

### Annotate when the DB compat version blocks fine-grained errors

When a generic error class exists because the production SQL Server compatibility level cannot surface the specific failure
case (e.g., "which field was too long", "which unique constraint was violated"), say so in the class docstring with a
date stamp. The block in `links.py` is the reference shape.

#### Desired

```python
class LinkDuplicateDataError(LinkServiceError):
    """Raised when a unique constraint is violated but we cannot determine which field."""

    # As of 2026/03/03, the deployed DB compat version is 120, which does not support
    # specifying which column was duplicated

    pass
```

Source: `backend/src/svc/links.py:39`.

### Translate every sproc exception at the call site

Each sproc wrapper exposes its own typed exceptions (e.g., `app_InsertLink.LinkNameInUseError`,
`app_UpdateLink.LinkNotFoundError`). Service functions catch each one explicitly and re-raise the corresponding
service-typed exception with `str(exc)` carried through and `from exc` preserving the chain. Both
`UnexpectedStoredProcedureCallError` and `StoredProcedureCallError` are caught last and translated to the module's
`<Entity>ServiceError` base
(links.py:170-195).

#### Desired

```python
try:
    result = app_InsertLink.exec_sproc(
        sproc_args=sproc_args,
        connection=connection,
    )
except app_InsertLink.LinkNameInUseError as exc:
    raise LinkNameInUseError(str(exc)) from exc
except app_InsertLink.LinkDuplicateDataError as exc:
    raise LinkDuplicateDataError(str(exc)) from exc
except app_InsertLink.LinkNameTooLongError as exc:
    raise LinkNameTooLongError(str(exc)) from exc
except app_InsertLink.LinkDescriptionTooLongError as exc:
    raise LinkDescriptionTooLongError(str(exc)) from exc
except app_InsertLink.LinkGenericFieldTooLongError as exc:
    raise LinkFieldTooLongError(str(exc)) from exc
except (UnexpectedStoredProcedureCallError, StoredProcedureCallError) as exc:
    raise LinkServiceError(str(exc)) from exc
```

Source: `backend/src/svc/links.py:170`.

## Related standards

- HTTP layer — the other primary consumer of
  the service layer; defines the response-envelope vs `detail` split that the CLI deliberately deviates from.
- Data layer — the sproc-wrapper conventions
  that the service layer composes over.
- [Reports](./reports.md) — report-specific rules (parity contract, registry/style contract, report query timeouts)
  layered on top of this document for the report subtree.
- Python testing — service-layer test
  placement and fixture conventions.
- Legacy `service-layer-guide.md` and `service-layer-pr-conventions.md` are read-only inputs to this file; they remain
  in the tree for traceability.
