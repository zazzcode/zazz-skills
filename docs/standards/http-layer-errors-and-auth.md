---
last_updated_at: 2026-05-25
---

# HTTP layer errors and auth

This standard governs HTTP status codes, error envelopes, authentication, authorization, and permission seed-data
verification.

## Status codes

The project uses a small, deliberately uniform set of status codes.

### 422 for all validation failures

Every HTTP route returns `422 UNPROCESSABLE_ENTITY` for validation failures. The APIFlask
`VALIDATION_ERROR_STATUS_CODE` setting governs both schema-level validation (raised automatically by APIFlask when a
payload fails a marshmallow Schema) and route-level orchestrator validation (raised manually via `apiflask.abort`). No
HTTP route in the codebase returns 400 for validation. A single status code for "request shape is wrong" keeps client
error handling uniform regardless of whether the Schema or a manual gate caught the failure
(review precedent; see
v1/__init__.py:15).

### Desired

```python
apiflask.abort(
    HTTPStatus.UNPROCESSABLE_ENTITY.value,
    message=HTTPStatus.UNPROCESSABLE_ENTITY.phrase,
    detail={"json": {"name": ["already in use"]}},
)
```

### Not desired

```python
apiflask.abort(400, message="Bad Request", detail={...})  # wrong: 400 is unused at this layer
```

### 204 for empty-result GET, 404 for unknown resource

A GET endpoint that runs successfully but produces zero rows returns `204 NO_CONTENT` with an empty body.
`404 NOT_FOUND` is reserved for the unknown-resource case — an ID lookup that finds no record, a registry lookup with
no entry. An empty-result GET is "request succeeded, no content," not "resource not found"; using 404 for an empty set
implies the URL is invalid when in fact the URL is a valid resource that happened to compute to an empty set. The 204
response shape must also appear in the route's `@bp.doc(responses=...)` declaration
(review precedent; see
quality_bank_update.py:376,
report_get.py:140 (review precedent)).

### Desired

```python
except NoDataForReportError:
    return Response(status=HTTPStatus.NO_CONTENT.value)
```

### Not desired

```python
result = svc.report.run(name=name)
if not result.rows:
    apiflask.abort(HTTPStatus.NOT_FOUND.value, ...)  # wrong: empty result is not "resource not found"
return ReportResponseSchema().dump(result)
```

Mutation success with no body also uses 204 — see `quality_bank_update.py` line 376 and `account_update.py` line 227
for the canonical shape.

## Error responses

The project enforces a strict shape on every error response: `message` is always an HTTPStatus phrase, and
field-specific or developer-meaningful text lives in a structured `detail` dict.

### `message=HTTPStatus.X.phrase`; never leak `str(exc)`

Every `apiflask.abort(...)` call uses `message=HTTPStatus.<NAME>.phrase` for the public `message` field. Field-specific
or developer-meaningful text goes in a structured `detail` dict. `str(exc)` does not appear in `message=` — capture the
exception via `logger.exception(...)` for log content instead. Separating the public envelope from developer-facing
exception text gives clients a stable, enumerated `message` while preserving rich debugging context in logs
(review precedent; see
quality_bank_create.py:301-318).

Canonical shapes:

- 422 validation: `detail={"json": {"<field>": ["<message>"]}}`
- 404 unknown resource: `detail={"<entity>": "<dev-facing message>"}`
- 500 service error: `detail={"error": "<safe generic message>"}` plus `logger.exception(exc)`

### Desired

```python
except svc.report.ReportGenerationError as exc:
    logger.exception(exc)
    apiflask.abort(
        HTTPStatus.INTERNAL_SERVER_ERROR.value,
        message=HTTPStatus.INTERNAL_SERVER_ERROR.phrase,
        detail={"error": "Report generation failed"},
    )
```

### Not desired

```python
except svc.report.ReportGenerationError as exc:
    apiflask.abort(
        HTTPStatus.INTERNAL_SERVER_ERROR.value,
        message=str(exc),  # wrong: leaks internal text into the public message
        detail={"error": str(exc)},  # wrong: also leaks
    )
```

### Wrap field-keyed error detail under a `"json"` envelope

When `detail` carries a field-keyed dict — for any of 422 validation, 404 not-found whose detail is field-specific, or
500 service errors whose detail is field-specific — the field map sits under a `"json"` outer key. Non-field-keyed
`detail` payloads (e.g., the generic `{"error": "..."}` for 500) are not wrapped in `"json"`. The project's
error-handling middleware in `http_api/v1/__init__.py` expects the nested `"json"` envelope; without it, the client
sees a malformed response shape (review precedent; see
v1/__init__.py:14-40).

### Desired

```python
apiflask.abort(
    HTTPStatus.UNPROCESSABLE_ENTITY.value,
    message=HTTPStatus.UNPROCESSABLE_ENTITY.phrase,
    detail={"json": {"roles": ["unknown role"]}},
)
```

### Not desired

```python
apiflask.abort(
    HTTPStatus.UNPROCESSABLE_ENTITY.value,
    message=HTTPStatus.UNPROCESSABLE_ENTITY.phrase,
    detail={"roles": str(e)},  # wrong: missing "json" envelope key
)
```

### Translating "unknown resource" exceptions

When a service-layer exception signals "unknown resource," the HTTP route sets `message=HTTPStatus.NOT_FOUND.phrase`
and places the exception's developer-meaningful text in `detail`, keyed by the entity name. The exception's own message
string is left untouched — making service exception messages serve dual duty as public copy is avoided. This keeps the
public `message` enumerated to HTTP status phrases while preserving the exception's text for developers consuming
`detail` programmatically (review precedent; see
report_get.py:130-137 (review precedent)).

### Desired

```python
except UnknownReportError:
    abort(
        HTTPStatus.NOT_FOUND.value,
        message=HTTPStatus.NOT_FOUND.phrase,
        detail={"report_name": f"Unknown report: {report_name}"},
    )
```

### Not desired

```python
except UnknownReportError as exc:
    apiflask.abort(
        HTTPStatus.NOT_FOUND.value,
        message=str(exc),  # wrong: exception text must not appear in message
    )
```

## Authentication and permissions

HTTP layer security is maintained through JWT tokens using the `require_permissions()` decorator from
`http_api/auth_decorators.py`. The decorator verifies the JWT and checks that the caller has every permission listed.
For the rare case where any authenticated user should have access without specific permission checks (e.g., the
diagnostic endpoint), use `@jwt_required()` from flask-jwt-extended directly. Unless explicitly called out, every route
requires at least the `login` permission; public routes are exceptional (e.g., `/v1/health/healthz`)
(http-layer-guide.md §Security).

### `ROUTE_REQUIRED_PERMISSIONS` and decorator placement

Each endpoint declares a module-level `ROUTE_REQUIRED_PERMISSIONS: Final[set[PermissionName]]` set populated with
constants imported from `svc.permission`, and passes it to `@require_permissions(*ROUTE_REQUIRED_PERMISSIONS)`. Bare
string literals (e.g., `@require_permissions("pipeline.create")`) are rejected because they bypass the `svc.permission`
constants module — they can't be grepped from one place and break the OpenAPI permissions trailer generator.
`@require_permissions` sits between `@bp.doc` and `@bp.output` per the decorator order rule above
(review precedent; see
pipeline_create.py:122).

### Desired

```python
from svc.permission import LOGIN, PIPELINE_CREATE
from types_ import PermissionName

ROUTE_REQUIRED_PERMISSIONS: Final[set[PermissionName]] = {LOGIN, PIPELINE_CREATE}

@bp.route("", methods=["POST"])
@bp.input(PipelineCreateJSONInputSchema)
@bp.doc(...)
@require_permissions(*ROUTE_REQUIRED_PERMISSIONS)
@bp.output(PipelineCreateResponseSchema, status_code=HTTPStatus.CREATED.value)
def create_pipeline_view(json_data: PipelineCreateJSONInput) -> PipelineCreateResponse: ...
```

### Not desired

```python
@require_permissions("pipeline.create")  # wrong: bare string bypasses svc.permission constants
def create_pipeline_view(...): ...
```

### Permission names

Permission name strings follow `<entity>.<verb>`, all lowercase. The entity is the singular noun for the resource
(`account`, not `accounts`; `dataprovider`, not `dataproviders`; `customersegment`, not `customersegments`). The verb is the
CRUD action: `create`, `read`, `update`, or `delete` — not every entity uses all four; only declare the verbs the
system needs. The separator is a single dot. The bare permission `login` is the sole exception — it has no entity
prefix because it gates authentication, not a specific resource. The Python constant in `svc/permission.py` is
screaming-snake-case derived from the string value (`account.read` → `ACCOUNT_READ`), and constants are alphabetized
within the file (permission.py;
R\_\_seed_permissions.sql).

### Desired

```python
# backend/src/svc/permission.py
ACCOUNT_CREATE: Final[PermissionName] = PermissionName("account.create")
ACCOUNT_DELETE: Final[PermissionName] = PermissionName("account.delete")
ACCOUNT_READ:   Final[PermissionName] = PermissionName("account.read")
ACCOUNT_UPDATE: Final[PermissionName] = PermissionName("account.update")
DATAPROVIDER_CREATE: Final[PermissionName] = PermissionName("dataprovider.create")
LOGIN: Final[PermissionName] = PermissionName("login")
```

```sql
-- backend/database/sql_migrations/seed/R__seed_permissions.sql
('account.read',         'Can view and list user accounts'),
('dataprovider.create',  'Can create new dataproviders'),
('login',                'Can log in to the system'),
```

### Wiring a new `@require_permissions` endpoint end-to-end

A new endpoint gated by `@require_permissions(...)` is dead on deploy unless its permission exists in the seeded
`dbo.permission` table AND the `admin` role's grant-all loop re-runs to attach it. The four-touch pattern must land in
the same PR :

1. **Declare the permission constant** in `backend/src/svc/permission.py` as `Final[PermissionName]`, named in
   screaming-snake-case matching the `<entity>.<verb>` string value, and added to `ALL_PERMISSIONS`. The constants list
   is alphabetized; insert in the correct slot.
1. **Use the constant** in the route file as a member of a `ROUTE_REQUIRED_PERMISSIONS: Final[set[PermissionName]]` set
   passed to `@require_permissions(*ROUTE_REQUIRED_PERMISSIONS)`. No bare strings.
1. **Seed the row** in `backend/database/sql_migrations/seed/R__seed_permissions.sql` by adding
   `('<entity>.<verb>', '<description>')` to the idempotent `MERGE … VALUES (...)` block. Keep entries alphabetized.
1. **Bust the Flyway checksum on `R__seed_roles.sql`** by editing its `-- Last re-run trigger:` comment (bump the date
   and list the added permissions). Flyway only re-runs an `R__*` file when its checksum changes, so the comment edit
   is the project's chosen mechanism for re-running the "grant all permissions to admin" loop. Without this, admin
   never gets the new permission and the endpoint stays unreachable for everyone.

This is also the rule that catches the seed-data verification gap reviewers flag — before a PR introducing a
`@require_permissions`-gated route merges, the required permission names must exist in the seed data migration script;
a missing seed entry means the permission cannot be granted and the endpoint is unreachable for all roles
.

### Desired

```python
# 1. backend/src/svc/permission.py — alphabetical position
PIPELINE_CREATE: Final[PermissionName] = PermissionName("pipeline.create")
PIPELINE_READ:   Final[PermissionName] = PermissionName("pipeline.read")
PIPELINE_UPDATE: Final[PermissionName] = PermissionName("pipeline.update")

ALL_PERMISSIONS: Final[set[PermissionName]] = {
    ...,
    PIPELINE_CREATE,
    PIPELINE_READ,
    PIPELINE_UPDATE,
    ...,
}
```

```python
# 2. backend/src/http_api/v1/pipeline/pipeline_create.py
from svc.permission import LOGIN, PIPELINE_CREATE

ROUTE_REQUIRED_PERMISSIONS: Final[set[PermissionName]] = {LOGIN, PIPELINE_CREATE}

@bp.route("", methods=["POST"])
@bp.input(PipelineCreateJSONInputSchema)
@bp.doc(...)
@require_permissions(*ROUTE_REQUIRED_PERMISSIONS)
@bp.output(PipelineCreateResponseSchema, status_code=HTTPStatus.CREATED.value)
def create_pipeline_view(json_data: PipelineCreateJSONInput) -> PipelineCreateResponse: ...
```

```sql
-- 3. backend/database/sql_migrations/seed/R__seed_permissions.sql
merge dbo.permission as [target] using (
    values
    ...
    ('pipeline.create', 'Can create new pipelines'),
    ('pipeline.read',   'Can view and list pipelines'),
    ('pipeline.update', 'Can update existing pipelines'),
    ...
) as [source] ([name], description) on [target].[name] = [source].[name] ...
```

```sql
-- 4. backend/database/sql_migrations/seed/R__seed_roles.sql
-- Edit this comment block when new permissions are added so Flyway's
-- checksum changes and the "grant all perms to admin" loop re-runs.
-- Last re-run trigger: 2026-05-25 — added pipeline.{create,read,update}.
```

### Not desired

```python
# wrong: bare string literal; bypasses svc.permission constants and the alphabetized registry
@require_permissions("pipeline.create")
def create_pipeline_view(...): ...
# AND: nothing added to R__seed_permissions.sql — admin role never receives the permission
# AND: R__seed_roles.sql untouched — Flyway sees the same checksum and skips the re-run,
#      so admin's role_permission grant is never refreshed
```
