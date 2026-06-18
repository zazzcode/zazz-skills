---
last_updated_at: 2026-05-25
---

# Service layer data and exceptions

This standard governs service-layer dataclasses, result shapes, exception text, helper docstrings, and
replace-semantics naming.

## Data classes

`Update*Data` dataclasses use `@dataclass(frozen=True)`. `Insert*Data` dataclasses use plain `@dataclass`. The
distinction is intentional: update payloads carry a fixed set of fields between caller construction and the sproc call,
and `frozen=True` makes accidental mutation impossible; insert payloads sometimes need to be assembled or defaulted in
steps before the call, and the mutability supports that
(review precedent;
customer_segments.py:108;
links.py:205).

### Desired

```python
@dataclass(frozen=True)
class UpdateLinkData:
    """Data for updating a Link (PATCH semantics — only non-None fields are written)."""

    link_name: str | None = None
    link_description: str | None = None

@dataclass
class InsertLinkData:
    """Data for inserting a new Link."""

    link_name: str
    link_description: str
```

Source: `backend/src/svc/links.py:144` and
`backend/src/svc/links.py:205`.

### Not desired

```python
@dataclass
class UpdateLinkData:  # wrong: update payloads must be immutable; use frozen=True
    name: str
# Source: shape lifted from review precedent
```

### Result dataclasses

Domain-result dataclasses (e.g., `Link`, `Location`, `CustomerSegment`, `Ticket`) are plain `@dataclass` — they're read on
the way out of the service, never mutated. Type hints use `datetime` (UTC-aware), `Decimal`, the `NewType`-defined
identifiers from `types_.py` (`AccountExternalID`, `AccountInternalID`, `RoleName`, `PermissionName`, etc.), and
`Literal["Y", "N"]` for the project's char-flag columns
(customer_segments.py:134;
links.py:94;
tickets/list_tickets.py).

### Legacy column-name asymmetries — annotate inline

When a row-mapper reads a column whose DB name is legacy or asymmetric with sibling columns, the assignment carries an
inline comment naming the asymmetry. The canonical case is `UpdateBy` (no `d`) paired with `UpdatedOn` (with `d`) — the
inline comment anchors the intent at the point of use so a future developer doesn't "fix" the spelling and break the
mapping (review precedent;
links.py:137;
locations.py:118;
pipelines.py:109;
products.py:109;
vendors.py:109).

The comment goes at the assignment line itself — not in the dataclass docstring, not in a module-level note. The
comment must be visible to whoever is reading the row-mapping block, not to someone hunting elsewhere in the file.

#### Desired

```python
return [
    Link(
        id=row["LinkID"],
        name=row["LinkName"],
        description=row["LinkDescription"],
        created_by=row["CreatedBy"],
        created_on=row["CreatedOn"].replace(tzinfo=UTC),
        updated_by=row["UpdateBy"],  # DB column is "UpdateBy" (not "UpdatedBy") — legacy naming
        updated_on=row["UpdatedOn"].replace(tzinfo=UTC),
    )
    for row in rows
]
```

Source: `backend/src/svc/links.py:137`.

#### Not desired

```python
updated_by=row["UpdateBy"],   # wrong: silent asymmetry invites "fix it" renames that break the mapping
updated_on=row["UpdatedOn"],
# Source: shape lifted from review precedent
```

Apply the same annotation to any other legacy column name that breaks the otherwise-consistent column naming the table
uses, not only `UpdateBy`. The pattern is "explain the asymmetry at the assignment, not elsewhere."

### Domain types from `types_.py`

Service signatures accept and return domain types (`AccountExternalID`, `AccountInternalID`, `RoleName`,
`PermissionName`, `HashedPassword`, `Password`, `TicketState`, `YearMonth`, etc.) — not raw `str` / `int` / `UUID`. The
HTTP layer's marshmallow schemas and the CLI's Click param-types do the parse-into-domain-type work at the seam; the
service interior trusts the types (review precedent;
account.py:14;
manage-account.py:51).

A residual format check that the type alone can't enforce — e.g., `ROLE_NAME_PATTERN.match(name)` in `create_role` — is
a defense-in-depth assertion for the INVALID-FORMAT case, not a duplicate validation of caller intent. It stays inside
the service because it guards a constraint that no upstream parser could fully enforce
(role.py:15).

Full type annotations are required on all service functions — public signatures, internal helpers, and return types —
consistent with the project's `mypy --strict` configuration
(backend/pyproject.toml;
account.py:275).

#### Desired

```python
def create_role(
    *,
    name: RoleName,
    display_name: str,
    permission_names: list[PermissionName],
    connection: pymssql.Connection,
) -> Role:
    ...

def update_account_roles(
    account_external_id: AccountExternalID,
    role_names: list[RoleName],
    connection: pymssql.Connection,
) -> list[RoleListItem]:
    ...
```

Sources: `backend/src/svc/role.py:50`;
`backend/src/svc/account.py:347`.

## Exception messages

Service-layer exception messages are developer- and log-facing. The text is designed to help an engineer reading a log
line, a CLI user looking at stderr, or a debugger reading `detail` dict values in an HTTP response — not the public
envelope of an HTTP response. Construct the message with the data the engineer needs: the entity identifier, the
failing field, what was expected (review precedent;
links.py:163).

The HTTP layer never propagates `str(exc)` into the response `message` field — it uses
`message=HTTPStatus.<NAME>.phrase` for the public message and places service-derived text only in the structured
`detail` dict when the route opts in (see
http-layer.md). The service-layer message
therefore lives a parallel life across surfaces:

- `logger.exception(exc)` in a route handler captures the full developer text in the log line.
- `click.echo(f"Error: {exc}", err=True)` in a CLI script (see
  [service-layer-modules-and-cli.md](./service-layer-modules-and-cli.md)) prints it directly to the developer running
  the script.
- The route may include `str(exc)` inside `detail={'<entity>': str(exc)}` when the field-level detail is safe to
  expose; the public `message` stays the `HTTPStatus.X.phrase` value.

### Desired

```python
class UnknownReportError(ValueError):
    def __init__(self, report_name: str) -> None:
        super().__init__(f"Unknown report: {report_name}")

class InvalidReportParametersError(ValueError):
    def __init__(self, report_name: str, missing_keys: list[str]) -> None:
        super().__init__(
            f"Param validation failed for {report_name}: missing={missing_keys}"
        )
```

Source: `backend/src/svc/links.py:163`
follows the same convention for its sproc-translation messages.

### Not desired

```python
class UnknownReportError(ValueError):
    def __init__(self) -> None:
        super().__init__("Not Found")  # wrong: too terse to help engineers in logs / CLI
# Source: shape lifted from review precedent
```

## Internal-helper docstrings

Internal helper functions (anything prefixed with `_`, or any function whose audience is exclusively the same module)
carry short docstrings that explain WHY the function exists — its load-bearing constraint or its non-obvious
responsibility. They do not restate behavior or signature details that the body already shows. Public service entry
points may carry longer docstrings because they document the contract for external callers
(review precedent).

Behavior-restating docstrings duplicate the code they sit above, drift as the function evolves, and obscure the "why" —
the context the code cannot show by itself.

### Desired

```python
def _validate_params(...) -> None:
    """Defensive gate for non-public callers; primary type validation runs upstream."""
    ...
```

### Not desired

```python
def _validate_params(report_name, params):
    """Validate the params dict for the report named in report_name.

    Iterates over the expected keys for the report, checks each value is
    present and of the right type, and raises InvalidReportParametersError
    if any are missing or wrong.

    Args:
        report_name: ...
        params: ...
    """
    # wrong: restates what the code already shows; drifts as the function evolves
    ...
# Source: shape lifted from review precedent
```

Public entry points (e.g., `update_account_roles`, `run_report`, `get_all_links`) keep an Args / Returns / Raises block
when the function is consumed by routes or CLI scripts. The handler reads the Raises block to know which exceptions to
catch; the route's `apiflask.abort` mapping is driven by that list.

## Naming and replace-semantics

A service function name must accurately describe the operation's semantics. When the function always replaces a full
set, the name plus its first docstring sentence make that explicit. A maintainer reading the signature should be able
to predict whether the call (a) adds to an existing set, (b) replaces the set, or (c) modifies a partial subset
(review precedent;
account.py:347).

If the name alone is ambiguous, the first sentence of the docstring disambiguates. `set_account_roles` would be wrong
because `set` is ambiguous between "assign" and "amend"; `update_account_roles` paired with "Atomically replace an
account's role set." removes the ambiguity. Mirror pattern in `update_role_permissions`
(role.py).

### Desired

```python
def update_account_roles(
    account_external_id: AccountExternalID,
    role_names: list[RoleName],
    connection: pymssql.Connection,
) -> list[RoleListItem]:
    """Atomically replace an account's role set.

    Returns:
        The assigned roles with their display names, so callers don't need
        to make a separate query to build responses.
    """
    ...
```

Source: `backend/src/svc/account.py:347`.

### Not desired

```python
def set_account_roles(*, account_external_id, role_names, connection):
    # wrong: name + missing docstring leaves replace-vs-amend ambiguous
    ...
# Source: shape called out at review precedent
```

### PATCH-vs-replace at the dataclass level

When the underlying sproc supports PATCH semantics (only non-None fields are written), the `Update*Data` dataclass uses
`... | None = None` defaults and the function docstring says so explicitly. `UpdateLinkData` and
`UpdateCustomerSegmentData` are the reference shapes
(links.py:206;
customer_segments.py:108).

#### Desired

```python
@dataclass(frozen=True)
class UpdateLinkData:
    """Data for updating a Link (PATCH semantics — only non-None fields are written)."""

    link_name: str | None = None
    link_description: str | None = None

def update_link(
    link_id: int,
    *,
    data: UpdateLinkData,
    connection: pymssql.Connection,
    username: str = "FIXTHIS",
) -> None:
    """Update an existing Link.

    Implements PATCH semantics — only non-None fields in `data` are written.
    """
    ...
```

Source: `backend/src/svc/links.py:205`.

### Signature conventions

- Connection passed as an explicit `connection: pymssql.Connection` parameter; no `g`, no `current_app`, no implicit
  thread-local
  (service-layer-guide.md §Dependency Injection;
  links.py:101).
- `data: <Insert|Update>EntityData` keyword-only for any function that takes a dataclass payload. The `*,` separator
  appears before `data` and `connection` in current modules
  (links.py:151).
- No pre-serialization to JSON-safe types inside the service. If the callsite is going to return JSON, the callsite is
  responsible for handling `Decimal`, `datetime`, and any other type that needs encoding
  (service-layer-guide.md §Dependency Injection).
- Audit-trail `username` parameter on insert/update functions defaults to `"FIXTHIS"` until the audit-trail wiring
  lands; existing modules carry the stub uniformly
  (links.py:151).
