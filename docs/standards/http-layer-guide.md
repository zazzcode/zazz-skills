---
last_review_sha: 0d2b5358692b73cd4224096ab2cb7e0f4b5ee161
---

# HTTP Layer Design Guide

## Overview

This stack-specific baseline documents organizational patterns for an APIFlask HTTP API layer. The design prioritizes
maintainability and constrained context through small, focused files that contain the schemas, route logic, and
documentation needed by a route.

## HTTP layer responsibilities

The HTTP layer owns translating between “HTTP world” and the internal service/data layers. Concretely, it is
responsible for:

- **Request deserialization**: Turning HTTP requests into typed inputs using `@bp.input()` and schemas. Query, JSON,
  header params, etc should all be deserialized via dedicated schemas to typed inputs (`*QueryInput`, `#JSONInput`,
  etc).
- **Response serialization**: Turning service-layer results into HTTP responses using `@bp.output()` and response
  schemas.
- **Error mapping to HTTP**: Converting domain/service errors into standardized HTTP error responses.
- **OpenAPI description**: Owning all API documentation concerns for HTTP endpoints. This baseline uses APIFlask
  autogeneration utilities to build OpenAPI documentation from marshmallow schemas.
- **AuthN and AuthZ enforcement**: Ensuring that only authenticated (and authorized) callers reach the service layer.

## Directory Structure

```
src/http_api/
├── __init__.py
├── app.py                    # Flask application factory
├── auth_decorators.py        # HTTP-app-wide auth decorators
├── jwt.py                    # JWT manager factory and error handlers
├── util.py                   # HTTP-app-wide utilities
└── v1/                       # API version 1
    ├── __init__.py
    ├── account/              # Account resource endpoints
    │   ├── __init__.py       # Defines blueprint for all account endpoints
    │   ├── account_list.py   # GET /v1/account
    │   ├── account_create.py # POST /v1/account
    │   ├── account_update.py # PATCH /v1/account/{account_id}
    │   └── shared.py         # Account-specific shared components
    ├── auth/                 # Authentication endpoints
    │   ├── __init__.py       # Defines blueprint for all auth endpoints
    │   └── auth_login.py     # POST /v1/auth/login
    ├── bugsnag/              # Bugsnag integration testing endpoints. See below for more detail.
    ├── health/               # Health check endpoints
    │   ├── __init__.py       # Defines blueprint for all health endpoints
    │   ├── health_check.py   # GET /v1/health/healthz
    │   └── health_diagnostic.py # GET /v1/health/diagnostic
    ├── lookups/              # Lookup endpoints (constrained entity views for dropdowns)
    │   ├── __init__.py       # Defines blueprint for all lookup endpoints
    │   ├── lookups_audit_number.py  # GET /v1/lookups/audit-number
    │   ├── lookups_data_provider.py # GET /v1/lookups/data-provider
    │   ├── lookups_link.py          # GET /v1/lookups/link
    │   ├── lookups_location.py      # GET /v1/lookups/location
    │   ├── lookups_pipeline.py      # GET /v1/lookups/pipeline
    │   ├── lookups_pipeline_code.py # GET /v1/lookups/pipeline-code
    │   ├── lookups_product.py       # GET /v1/lookups/product
    │   ├── lookups_quality_bank.py  # GET /v1/lookups/quality-bank
    │   └── lookups_vendor.py       # GET /v1/lookups/vendor
    ├── ticket/               # Ticket endpoints
    │   ├── __init__.py                     # Defines blueprint for all ticket endpoints
    │   ├── shared.py                       # Ticket-specific shared components
    │   ├── ticket_list.py                  # GET /v1/ticket
    │   ├── ticket_posted_get.py            # GET /v1/ticket/posted/{ticket_id}
    │   ├── ticket_unposted_bulk_validate.py # POST /v1/ticket/unposted/validate-bulk
    │   └── ticket_unposted_get.py          # GET /v1/ticket/unposted/{ticket_id}
    └── shared/               # Version-specific shared components
        ├── __init__.py
        └── errors.py         # Shared error response schemas
```

## Lookup Endpoints

Lookup endpoints provide constrained views of entities specifically designed for dropdown/select menu population in
client applications.

### Key Characteristics

- **No pagination**: Lookups return the complete filtered result set, as clients need all options to populate UI
  controls
- **Slim data model**: Only essential fields (typically `id`, `name`, `code`) needed for display and selection
- **Filtering only**: Support hierarchical filtering (e.g., by data provider, location) to narrow results to relevant
  context

### Naming Convention

Lookups follow the `Lookup<Entity>` pattern to emphasize that these are specialized lookup types, distinct from full
entity representations:

- Entity type ex: `LookupPipeline` (not `Pipeline`)
- Query params ex: `ListLookupPipelinesQuery`
- Response ex: `ListLookupPipelinesResponse`
- View function ex: `list_lookup_pipelines_view()`

## Security

HTTP layer security is maintained through JWT tokens using the `require_permissions()` decorator (source code available
in `src/http_api/auth_decorators.py`). This decorator verifies the JWT and checks that the user has all specified
permissions.

For rare cases where any authenticated user should have access without specific permission checks (e.g., the diagnostic
endpoint), use `@jwt_required()` from flask-jwt-extended directly.

An example of an endpoint that requires both the 'login' and 'account.create' permissions is available in
`src/http_api/v1/account/account_create.py`.

JWT tokens are created by 'logging in' via the `/v1/auth/login` route, which checks for a 'login' permission. If
successful, a token is returned that lists all associated account permissions.

Requests to other protected endpoints in the application look at the permissions on the JWT token sent with the
request.

**Important**: Unless explicitly called out, all routes should require at least the 'login' permission. Public routes
are typically exceptional cases (such as /v1/health/healthz).

## Naming Conventions

### Endpoint Files

- Pattern: `<resource>_<action>.py`
  - Examples: `account_list.py`, `account_create.py`, `auth_login.py`
- Unless called out as an exception, each file contains one endpoint with its route-specific schemas and dataclass
  objects
- Use the resource name directly in directories: `account/`, `auth/`, `health/`
- View functions should use the `*_view` suffix (e.g., `list_foobar_view`, `create_foobar_view`)
- Input types are qualified by location in their names: `*QueryInput`, `*HeadersInput`, `*JSONInput`

## Shared Resources Tiers

### Application-Wide (`http_api/`)

- `auth_decorators.py` - Permission decorators used across all API versions
- `util.py` - Utilities like pagination token encoding

### API Version-Wide (`http_api/v1/shared/`)

- `errors.py` - Error response schemas used by multiple resources
- `__init__.py` - Generic shared constants
- Only place schemas in http_api/v1/shared/ if they're actually shared across multiple endpoint files

### Resource-Specific (`http_api/v1/<resource>/shared.py`)

- Components shared among multiple endpoints within a single resource
- Example: `account/shared.py` for schemas used by multiple account endpoints
- Use when schemas are too specific to a resource to belong in version-wide shared

### Route-Specific (with the route)

- Input/output dataclasses and schemas specific to a single endpoint stay in that endpoint's file
- Example: `CreateAccountInput` and `CreateAccountOutput` stay in `account_create.py`

## Blueprint Organization

### Resource `__init__.py`

Each resource directory defines a single shared blueprint. For an idiomatic example:

```python
# http_api/v1/foobar/__init__.py
from apiflask import APIBlueprint

bp = APIBlueprint("foobar", __name__, url_prefix="/v1/foobar")

# Imports done below bp definition to dodge circluar imports while re-using same
# blueprint
from http_api.v1.foobar import (
    foobar_create,  # noqa: F401
    foobar_list,  # noqa: F401
    # ...
)
```

### Endpoint Module

Each endpoint file imports and uses the shared blueprint. Input types are qualified by location in the name:
`*QueryInput`, `*HeadersInput`, `*JSONInput`.

#### List endpoint (GET): query + headers

Below is an example that uses two input types. The `# RSN0001` and `# RSN0002` comments on the decorators reference
entries in `docs/reasons-catalog/` that explain why those `type: ignore[...]` suppressions are required. See the
reasons catalog for full background and alternatives.

```python
# http_api/v1/foobar/foobar_list.py
from collections.abc import Mapping
from dataclasses import dataclass
from http import HTTPStatus
from typing import Any, Final

import apiflask
from marshmallow import post_load

from http_api.auth_decorators import require_permissions
from http_api.util import generate_openapi_permissions_trailer
from http_api.v1.foobar import bp
from http_api.v1.shared import CALLER_BARRED_DEFAULT_NONE
from http_api.v1.shared.errors import (
    AuthenticationErrorSchema,
    AuthorizationErrorSchema,
    InternalServerErrorResponseSchema,
)
from svc.permission import LOGIN
from types_ import PermissionName
# ... other imports ...

@dataclass
class FoobarListQueryInput:
    """Query parameters for listing foobars."""
    page_size: int
    page_token: str | None

# Schemas should always follow the object they describe
class FoobarListQueryInputSchema(apiflask.schemas.Schema):
    """Query parameters for listing foobars."""
    page_size = apiflask.fields.Integer(
        required=True, metadata={"description": "Page size", "example": 50}
    )
    page_token = apiflask.fields.String(
        required=False,
        load_default=CALLER_BARRED_DEFAULT_NONE,
        allow_none=False,
        metadata={"description": "Token for next page; omit for first page"},
    )

    @post_load
    def make_object(self, data: Mapping[str, Any], **kwargs: Any) -> FoobarListQueryInput:
        return FoobarListQueryInput(**data)

# If headers are needed:
@dataclass
class FoobarListHeadersInput:
    """Headers for list requests"""
    example_header: str | None

class FoobarListHeadersInputSchema(apiflask.schemas.Schema):
    """Optional headers for list requests."""
    example_header = apiflask.fields.String(
        required=False,
        load_default=CALLER_BARRED_DEFAULT_NONE,
        allow_none=False,
        data_key="Example-Header",
        metadata={"description": "Example header to demonstrate multiple input types"},
    )

    @post_load
    def make_object(self, data: Mapping[str, Any], **kwargs: Any) -> FoobarListHeadersInput:
        return FoobarListHeadersInput(**data)


@dataclass
class FoobarItem:
    """A single foobar in the response."""
    id: int
    name: str


@dataclass
class FoobarListResponse:
    """Response for listing foobars."""
    data: list[FoobarItem]
    aggregates: FoobarListAggregates


class FoobarItemSchema(apiflask.schemas.Schema):
    """Schema for a foobar item."""
    id = apiflask.fields.Integer(required=True, metadata={"description": "Foobar ID"})
    name = apiflask.fields.String(required=True, metadata={"description": "Foobar name"})


class FoobarListResponseSchema(apiflask.schemas.Schema):
    """Response schema for listing foobars."""
    data = apiflask.fields.List(
        apiflask.fields.Nested(FoobarItemSchema),
        required=True,
        metadata={"description": "Array of foobars"},
    )
    aggregates = apiflask.fields.Nested(
        FoobarListAggregatesSchema,
        required=True,
        metadata={"description": "Aggregated metrics for the foobar list"},
    )


ROUTE_REQUIRED_PERMISSIONS: Final[set[PermissionName]] = {LOGIN}

ROUTE_OPENAPI_DESCRIPTION: Final[str] = f"""
List foobars.

Any special considerations when working with foobars. <typically contains domain context about foobars; omit this entirely if you don't have meaningful domain content to contribute>
---
{generate_openapi_permissions_trailer(ROUTE_REQUIRED_PERMISSIONS)}
"""


@bp.route("", methods=["GET"])  # type: ignore[type-var] # RSN0001 – see reasons catalog
@bp.input(FoobarListQueryInputSchema, location="query")
@bp.input(FoobarListHeadersInputSchema, location="headers")
@bp.doc(
    summary="List foobars with pagination",
    description=ROUTE_OPENAPI_DESCRIPTION,
    security=["BearerAuth"],
    responses={  # type: ignore[arg-type] # RSN0002 – see reasons catalog
        HTTPStatus.OK.value: {
            "description": HTTPStatus.OK.phrase,
            "content": {"application/json": {"schema": FoobarListResponseSchema}},
        },
        HTTPStatus.UNAUTHORIZED.value: {
            "description": HTTPStatus.UNAUTHORIZED.phrase,
            "content": {"application/json": {"schema": AuthenticationErrorSchema}},
        },
        HTTPStatus.FORBIDDEN.value: {
            "description": HTTPStatus.FORBIDDEN.phrase,
            "content": {"application/json": {"schema": AuthorizationErrorSchema}},
        },
        HTTPStatus.INTERNAL_SERVER_ERROR.value: {
            "description": HTTPStatus.INTERNAL_SERVER_ERROR.phrase,
            "content": {"application/json": {"schema": InternalServerErrorResponseSchema}},
        },
    },
)
@require_permissions(*ROUTE_REQUIRED_PERMISSIONS)
@bp.output(FoobarListResponseSchema)
def list_foobar_view(
    query_data: FoobarListQueryInput,
    headers_data: FoobarListHeadersInput,
) -> FoobarListResponse:
    # DO NOT provide a function docstring
    # ... implementation ...
```

#### List response shapes

All list endpoints return an array of items under a top-level `data` key:

```json
{
"data": [/* items */]
}
```

If aggregates need to be returned (for example, total counts or totals across all rows), add a top level container
called 'aggregates' to house those attributes:

```json
{
"data": [/* items */],
"aggregates": {
    "total_count": 123,
    "total_volume": "100000.00"
}
}
```

For the aggregates pattern, define a dedicated `*Aggregates` dataclass and schema and nest it under `aggregates` on the
response type. For example:

```python
@dataclass
class FoobarListAggregates:
    total_count: int


class FoobarListAggregatesSchema(apiflask.schemas.Schema):
    total_count = apiflask.fields.Integer(
        required=True,
        metadata={"description": "Total number of foobars available", "example": 42},
    )


@dataclass
class FoobarListResponse:
    data: list[FoobarItem]
    aggregates: FoobarListAggregates
```

Endpoints that don’t need aggregates should use the simple `{ "data": ... }` pattern.

#### Create endpoint (POST): json

POST endpoints typically have a JSON body.

```python
# http_api/v1/foobar/foobar_create.py
from collections.abc import Mapping
from dataclasses import dataclass
from http import HTTPStatus
from typing import Any, Final

import apiflask
from marshmallow import post_load

from http_api.auth_decorators import require_permissions
from http_api.util import generate_openapi_permissions_trailer
from http_api.v1.foobar import bp
from http_api.v1.shared.errors import (
    AuthenticationErrorSchema,
    AuthorizationErrorSchema,
    InternalServerErrorResponseSchema,
)
from svc.permission import LOGIN
from types_ import PermissionName

@dataclass
class FoobarCreateJSONInput:
    """JSON body for creating a foobar."""
    name: str


class FoobarCreateJSONInputSchema(apiflask.schemas.Schema):
    name = apiflask.fields.String(required=True, metadata={"description": "Foobar name"})

    @post_load
    def make_object(self, data: Mapping[str, Any], **kwargs: Any) -> FoobarCreateJSONInput:
        return FoobarCreateJSONInput(**data)


@dataclass
class FoobarCreateResponse:
    """Response for create."""
    id: int
    name: str


class FoobarCreateResponseSchema(apiflask.schemas.Schema):
    id = apiflask.fields.Integer(required=True)
    name = apiflask.fields.String(required=True)


ROUTE_REQUIRED_PERMISSIONS: Final[set[PermissionName]] = {LOGIN}

ROUTE_OPENAPI_DESCRIPTION: Final[str] = f"""
Create a new foobar.

Any special considerations when creating foobars.
---
{generate_openapi_permissions_trailer(ROUTE_REQUIRED_PERMISSIONS)}
"""


@bp.route("", methods=["POST"])  # type: ignore[type-var] # RSN0001 – see reasons catalog
@bp.input(FoobarCreateJSONInputSchema, location="json")
@bp.output(FoobarCreateResponseSchema, status_code=HTTPStatus.CREATED.value)
@bp.doc(
    summary="Create a new foobar",
    description=ROUTE_OPENAPI_DESCRIPTION,
    security=["BearerAuth"],
    responses={  # type: ignore[arg-type] # RSN0002 – see reasons catalog
        HTTPStatus.CREATED.value: {
            "description": HTTPStatus.CREATED.phrase,
            "content": {"application/json": {"schema": FoobarCreateResponseSchema}},
        },
        HTTPStatus.UNAUTHORIZED.value: {
            "description": HTTPStatus.UNAUTHORIZED.phrase,
            "content": {"application/json": {"schema": AuthenticationErrorSchema}},
        },
        HTTPStatus.FORBIDDEN.value: {
            "description": HTTPStatus.FORBIDDEN.phrase,
            "content": {"application/json": {"schema": AuthorizationErrorSchema}},
        },
        HTTPStatus.INTERNAL_SERVER_ERROR.value: {
            "description": HTTPStatus.INTERNAL_SERVER_ERROR.phrase,
            "content": {"application/json": {"schema": InternalServerErrorResponseSchema}},
        },
    },
)
@require_permissions(*ROUTE_REQUIRED_PERMISSIONS)
def create_foobar_view(
    json_data: FoobarCreateJSONInput,
) -> FoobarCreateResponse:
    # DO NOT provide a function docstring; rely on @bp.doc() summary= and description= parameters
    # ... implementation ...
```

### Application Registration

The main app registers resource blueprints:

```python
# http_api/app.py
from http_api.v1.foobar import bp as foobar_bp

def create_app(...) -> ExampleFlaskApp:
    app = ExampleFlaskApp(__name__)

    # Register blueprints
    app.register_blueprint(foobar_bp)  # /v1/foobar/*
    # ...

    return app
```

## Error Handling

Use `apiflask.abort()` with HTTPStatus codes for consistent error responses:

```python
apiflask.abort(HTTPStatus.BAD_REQUEST.value, HTTPStatus.BAD_REQUEST.phrase, detail={"field": "error details"})
```

## Schema organization guidelines

Each endpoint will have input and output shapes, defined as marshmallow schemas. Use `apiflask.schemas.Schema` with
explicit `apiflask.fields.*` definitions.

Input and output shapes should stay within the module in which they're used (unless they're shared, in which case they
should be located into the appropriate `shared.py` directory).

## Schema quirks

### Optional input fields: omit allowed, null not allowed

For optional fields where the caller may omit the value, may not send `null` (IE `allow_none=False`), and the dataclass
should receive `None` when the value is omitted, use `CALLER_BARRED_DEFAULT_NONE` from `http_api.v1.shared`:

```python
from http_api.v1.shared import CALLER_BARRED_DEFAULT_NONE

filter_id = apiflask.fields.Integer(
    required=False,
    load_default=CALLER_BARRED_DEFAULT_NONE,
    allow_none=False,
    metadata={"description": "Filter by ID; omit to return all"},
)
```

Using `load_default=None` causes OpenAPI/Swagger to show `null` as an allowed value. `CALLER_BARRED_DEFAULT_NONE` (a
callable returning `None`) prevents this while still defaulting to `None` when the field is omitted.

### Optional input fields: omit and null both allowed

When the caller may explicitly send `null`, use `load_default=None` and `allow_none=True`:

```python
optional_code = apiflask.fields.String(
    required=False,
    load_default=None,
    allow_none=True,
    metadata={"description": "Optional code; omit or send null to clear"},
)
```

### Enum constraints: use validators, not metadata

APIFlask automatically generates `enum` constraints in the OpenAPI spec from `validate.OneOf` and
`apiflask.fields.Enum`. Do not duplicate the constraint in `metadata={"enum": [...]}` — that's redundant and creates a
second source of truth that can drift.

```python
# Good: validator is the single source of truth, OpenAPI enum is auto-generated
flag = apiflask.fields.String(
    required=True,
    validate=validate.OneOf(["Y", "N"]),
    metadata={"description": "Whether the feature is enabled", "example": "Y"},
)

# Bad: redundant metadata enum that must be kept in sync with the validator
flag = apiflask.fields.String(
    required=True,
    validate=validate.OneOf(["Y", "N"]),
    metadata={"description": "Whether the feature is enabled", "example": "Y", "enum": ["Y", "N"]},
)
```

The same applies to `apiflask.fields.Enum` — the field type itself produces the `enum` constraint from the provided
enum class.

Additionally, unless specifically told otherwise (or if a pre-existing domain type exists in `src/backend/types_.py`),
use `Literal` and `validate.OneOf`. Do not create new Enum classes for usage in the input or output dataclasses.

## Bugsnag

The application uses Bugsnag for error monitoring. There are multiple routes files in `src/http_api/v1/bugsnag/` that
exist for debugging interaction with the Bugsnag monitoring integration. These routes are NOT idiomatic to REST
paradigms and should NOT be used as reference for convention.

The Bugsnag blueprint containing these routes is only mounted on the application when a special environment variable is
set.
