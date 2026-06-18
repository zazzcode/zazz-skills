---
last_updated_at: 2026-05-25
---

# Service layer modules and CLI scripts

This standard governs service module layout, lookup helpers, guide documentation, and CLI scripts that call
service-layer code.

## Subdirectory layout

Each flat top-level service module covers operations for a single domain — `pipelines.py` handles Pipeline CRUD and
nothing else; a second domain's operations belong in its own module, not appended to an existing one
(pipelines.py).

Services move from a single module to a subdirectory when:

- multiple related operations exist for one domain (e.g., `tickets/`, `lookups/`, `reports/`),
- those operations share types or error vocabulary (use `shared.py` for types, `errors.py` for exceptions),
- or domain complexity warrants per-operation files (e.g., distinct get / list / create-unposted files for tickets)
  (service-layer-guide.md §Subdirectories).

`tickets/errors.py` carries the `TicketsServiceError` base for the whole subtree; per-operation modules import it
(tickets/errors.py:1;
tickets/list_tickets.py).
`lookups/shared.py` carries the `ListLookupsPageResult` generic type used across lookup services
(service-layer-guide.md §Subdirectory-Level).

The reports subtree is the largest example. Each report, such as `vendor_summary`, sits in its own subdirectory
with one file per concern:

```text
svc/reports/vendor_summary/
├── service.py     # run_report() — entry point; calls sproc, builds document
├── document.py    # Domain dataclasses, REPORT_VARIANTS table, error classes
├── formatting.py  # Format-agnostic value formatting helpers
├── markdown.py    # Markdown renderer
└── pdf.py         # PDF renderer
```

`service.py` is the only file an outside caller imports; rendering and formatting helpers are internal to the
subdirectory. The CLI's `generate-report.py` imports `run_report` from `service.py` and the renderers from the sibling
files explicitly
(generate-report.py:30;
vendor_summary/service.py:1).

## Lookups pattern

Lookup services live under `backend/src/svc/lookups/` and provide simplified entity views for dropdown / select menu
population. They follow a uniform shape
(service-layer-guide.md §Lookups Pattern):

- The dataclass is named `Lookup<Entity>` (e.g., `LookupPipeline`, not `Pipeline`) to distinguish it from the full
  entity view.
- The dataclass is slim — typically `id`, `name`, `code` and any required filter fields, never the full audit-trail.
- No pagination: lookups return the complete filtered result set because clients need every option to populate UI
  controls.
- Hierarchical filter support where the domain demands it (e.g., filter pipelines by location).

The shared `ListLookupsPageResult` generic in `lookups/shared.py` is the canonical return shape for list lookups.

## Documenting new modules in the guide

When a PR adds a new top-level module under `backend/src/svc/`, the directory tree in
`docs/standards/service-layer-guide.md` is updated in the same PR. A stale directory listing causes agents and
developers to miss modules when navigating the service layer; the guide is only useful if it reflects the current
structure (review precedent).

## CLI scripts

CLI scripts under `backend/scripts/` are service-layer consumers, not a parallel access path. The rules below sit
alongside the service-layer rules because the CLI and the HTTP layer share the same service interior — and the
differences (exception rendering, `str(exc)` propagation) are intentional asymmetries that only make sense in
service-layer context.

### Thin Click wrappers over service calls

CLI scripts are thin Click wrappers that parse arguments, open a `db.connect(...)` context, call one or more
service-layer functions, and render the result. They do not execute raw SQL strings, `cursor.execute("SELECT ...")`, or
`callproc(...)` against business tables. Any data-shaping logic that would otherwise be duplicated in the CLI moves
into the service or data layer first (review precedent;
manage-account.py:14).

The only acceptable direct cursor use is a `db_check(...)` helper executing `SELECT 1` to confirm connectivity before
the CLI does any real work
(manage-account.py:40).

#### Desired

```python
@click.command()
def list_accounts_cmd() -> None:
    settings = get_settings()
    with db.connect(settings.db_conn_args) as connection:
        accounts = list_accounts(connection=connection)
        for a in accounts:
            click.echo(f"{a.external_id} {a.username}")
```

Source: shape modeled on
`backend/scripts/manage-account.py`.

#### Not desired

```python
@click.command()
def list_accounts_cmd() -> None:
    with db.connect(...) as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT ExternalID, Username FROM Account")  # wrong: CLI bypasses svc/
            for row in cursor:
                click.echo(f"{row[0]} {row[1]}")
# Source: shape called out at review precedent
```

### Parse domain types at the CLI seam

The CLI side of the "parse, don't validate" pattern uses Click `ParamType` subclasses that convert raw string arguments
into the typed domain values the service interior expects. `PermissionNameType`, `PasswordType`, `RoleNameType`,
`AccountExternalIDType` are the reference shapes in `manage-account.py`; new CLIs that pass typed domain values follow
the same pattern (review precedent;
manage-account.py:51).

#### Desired

```python
class RoleNameType(click.ParamType):
    """A type for role names. Validates snake_case format at parse time."""

    name = "role-name"

    def convert(
        self,
        value: str,
        param: click.Parameter | None,
        ctx: click.Context | None,
    ) -> RoleName:
        if not re.match(r"^[a-z][a-z0-9_]*$", value):
            self.fail(
                f"Invalid role name: '{value}'. "
                "Role names must be snake_case (lowercase letters, digits, and underscores; must start with a letter)."
            )
        return RoleName(value)

ROLE_NAME_TYPE = RoleNameType()
```

Source:
`backend/scripts/manage-account.py:80`.

### CLI exception handling — surface `str(exc)`

CLI scripts surface the service-layer exception text directly to the developer running the script. The two canonical
shapes both pass `str(exc)` through:

- `raise click.ClickException(str(exc)) from exc` — Click prints `Error: <message>` and exits non-zero
  (generate-report.py:240;
  manage-account.py:349).
- `click.echo(f"Error: {exc}", err=True)` followed by `sys.exit(1)` — equivalent shape used in the report-CLI's
  exception handling and in `db-snapshot.py`.

The HTTP layer does the opposite — it translates the same exceptions into `message=HTTPStatus.X.phrase` plus structured
`detail`, never letting the service text reach the public `message` field. The asymmetry is intentional: CLI users are
developers reading exception messages directly, so the developer-meaningful service text is exactly what they need;
HTTP clients consume the stable `phrase` envelope and pick out structured fields from `detail`
(review precedent).

#### Desired

```python
try:
    document = run_report(
        customer_segment_id=resolved_id,
        accounting_period_year=accounting_period_year,
        accounting_period_month=accounting_period_month,
        report_variant=variant,
        connection=connection,
    )
except (VendorSummaryServiceError, NoDataForReportError) as exc:
    raise click.ClickException(str(exc)) from exc
except StoredProcedureCallError as exc:
    raise click.ClickException(f"Database error: {exc}") from exc
```

Source:
`backend/scripts/generate-report.py:231`.

Equivalent `click.echo` + `sys.exit(1)` shape:

```python
try:
    result = run_report(...)
except (UnknownReportError, InvalidReportParametersError,
        ReportGenerationError, NoDataForReportError) as exc:
    click.echo(f"Error: {exc}", err=True)
    sys.exit(1)
```

Source: shape lifted from review precedent.

#### Not desired

```python
try:
    result = run_report(...)
except UnknownReportError:
    click.echo("Error: Not Found", err=True)  # wrong: hides the developer-meaningful service text
    sys.exit(1)
# Source: shape lifted from review precedent
```

### Service-exception-text guarantees this asymmetry

The CLI / HTTP asymmetry only works because the service layer takes responsibility for producing exception text
suitable for a developer audience. A service exception with the message `"Not Found"` would be useless to the CLI user;
a service exception with `f"Customer segment {customer_segment_id} was not found."` carries the identifier the developer
needs.
The exception-message convention in
[service-layer-data-and-exceptions.md](./service-layer-data-and-exceptions.md#exception-messages) is what enables the
CLI handler to pass `str(exc)` through unmodified
(review precedent;
reports/vendor_summary/service.py:47).

### CLI script structure

Scripts live directly under `backend/scripts/` (no nested package by default — `db-query-mcp/` is the one MCP-server
exception). The file starts with `#!/usr/bin/env -S uv run`, a module docstring, imports from `svc.*`, then Click
`ParamType` definitions, then the `@click.group()` and `@click.command()` definitions. The script ends with `cli()`
invoked under `if __name__ == "__main__":`
(manage-account.py:1;
generate-report.py:1).

Always invoke through the `withenv` wrapper so `DB_URL` and other settings are loaded from the env file:

```bash
scripts/withenv ../.env uv run python scripts/manage-account.py account list
```

The wrapper convention is part of the CLI's deployment story; scripts should document it in their `--help` text rather
than hard-coding env-loading inside the Click body
(generate-report.py:60).
