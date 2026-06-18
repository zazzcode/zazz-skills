---
last_updated_at: 2026-05-25
---

# HTTP layer

The HTTP layer translates HTTP requests into typed service-layer inputs, serializes service-layer outputs back to HTTP,
maps service errors to standard HTTP status responses, and enforces authentication and authorization via
`@require_permissions`. Routes are organized as one endpoint per file with route-specific dataclasses and marshmallow
schemas living alongside the view function. The conventions below are binding on every new or modified file under
`backend/src/http_api/`.

## Overview

The HTTP layer owns translating between "HTTP world" and the internal service/data layers. Concretely it is responsible
for request deserialization (turning HTTP requests into typed inputs using `@bp.input()` and schemas), response
serialization (turning service-layer results into HTTP responses using `@bp.output()` and response schemas), error
mapping to HTTP, OpenAPI description (via APIFlask autogeneration), and AuthN / AuthZ enforcement so that only
authenticated and authorized callers reach the service layer
(http-layer-guide.md §HTTP layer responsibilities).

## Directory layout

```text
src/http_api/
├── __init__.py
├── app.py                    # Flask application factory
├── auth_decorators.py        # HTTP-app-wide auth decorators
├── jwt.py                    # JWT manager factory and error handlers
├── util.py                   # HTTP-app-wide utilities
└── v1/                       # API version 1
    ├── __init__.py           # error_processor_callback, VALIDATION_ERROR_SCHEMA
    ├── account/              # Account resource endpoints
    │   ├── __init__.py       # Defines blueprint for all account endpoints
    │   ├── account_list.py   # GET  /v1/account
    │   ├── account_create.py # POST /v1/account
    │   ├── account_update.py # PATCH /v1/account/{account_id}
    │   └── shared.py         # Account-specific shared components
    ├── auth/                 # Authentication endpoints
    ├── health/               # Health check endpoints
    ├── lookups/              # Constrained entity views for dropdowns
    ├── ticket/               # Ticket endpoints
    └── shared/               # Version-specific shared components
        ├── __init__.py       # CALLER_BARRED_DEFAULT_NONE, etc.
        └── errors.py         # Shared error response schemas
```

The diagram is lifted from
http-layer-guide.md §Directory Structure.
Each resource directory owns a single shared blueprint defined in its `__init__.py`; sibling endpoint modules import
that blueprint and attach routes to it.

### Endpoint file naming

Endpoint files follow `<resource>_<action>.py` and each file holds one endpoint together with its route-specific
dataclasses and schemas (e.g., `account_list.py`, `account_create.py`, `auth_login.py`). Use the bare resource name for
directories (`account/`, `auth/`, `health/`) and suffix view functions with `_view` (`list_foobar_view`,
`create_foobar_view`). Input dataclass names are qualified by location: `*QueryInput`, `*HeadersInput`, `*JSONInput`
(http-layer-guide.md §Naming Conventions).

### Shared component tiers

There is a hierarchy for shared components. Application-wide helpers (`auth_decorators.py`, `util.py`) live directly
under `http_api/`. API-version-wide shared resources live under `http_api/v1/shared/` — `errors.py` for error response
schemas, `__init__.py` for cross-resource constants such as `CALLER_BARRED_DEFAULT_NONE`. Resource-specific shared
components live in `http_api/v1/<resource>/shared.py` and are reserved for components used by more than one endpoint in
that resource. Route-specific inputs and outputs stay in the endpoint file
(http-layer-guide.md §Shared Resources Tiers).

### Lookup endpoints

Lookup endpoints live under `v1/lookups/` and provide constrained entity views for populating dropdown and select
controls in the UI. They have three distinguishing characteristics: no pagination (the full filtered result set is
returned so the client has all options), a deliberately slim data model (only essential fields like `id`, `name`, and
`code`), and filtering only — they support hierarchical filters (e.g., by data provider, location) to narrow to a
relevant context but do not accept sort or page parameters
(http-layer-guide.md §Lookup Endpoints).

Lookup endpoint files follow a four-part naming pattern: the entity type uses a `Lookup<Entity>` prefix (not the full
entity name), the query-input dataclass is `ListLookup<Entity>sQueryInput`, the response dataclass is
`ListLookup<Entity>sResponse`, and the view function is `list_lookup_<entity>s_view()`. This naming signals at a glance
that these are purpose-built lookup types, distinct from the full entity representations used in resource endpoints
(http-layer-guide.md §Lookup Endpoints / Naming Convention).

#### Desired

```python
# http_api/v1/lookups/lookups_location.py

@dataclass
class LookupLocation:
    """LookupLocation for HTTP responses (constrained view of Location entity)."""
    id: int
    name: str
    code: str | None

@dataclass
class ListLookupLocationsQueryInput:
    """Query parameters for listing LookupLocations."""
    data_provider_id: int | None
    pipeline_id: int | None
    customer_segment_id: int | None

@dataclass
class ListLookupLocationsResponse:
    """Response for listing LookupLocations."""
    data: list[LookupLocation]
    total_count: int

@bp.route("/location", methods=["GET"])
@bp.input(ListLookupLocationsQueryInputSchema, location="query")
@bp.doc(...)
@require_permissions(*ROUTE_REQUIRED_PERMISSIONS)
@bp.output(ListLookupLocationsResponseSchema)
def list_lookup_locations_view(query_data: ListLookupLocationsQueryInput) -> ListLookupLocationsResponse: ...
```

See the live file at
lookups_location.py.

### Bugsnag routes

The files under `src/http_api/v1/bugsnag/` are not idiomatic REST and exist solely to exercise the Bugsnag monitoring
integration; do not use them as a pattern reference for new endpoints. The bugsnag blueprint is only mounted when
`settings.bugsnag_testing_endpoints_enabled` is `True` (driven by the `BUGSNAG_TESTING_ENDPOINTS_ENABLED` environment
variable), so the routes are never active in normal operation
(app.py:135,
settings.py:76).

## Blueprints

Each resource directory defines exactly one `APIBlueprint` in its `__init__.py`. The blueprint is the integration point
between routes and the Flask app; endpoint modules are imported underneath the blueprint definition with `noqa: F401`
to dodge circular imports while sharing a single blueprint object.

### Desired

```python
# http_api/v1/foobar/__init__.py
from apiflask import APIBlueprint

bp = APIBlueprint("foobar", __name__, url_prefix="/v1/foobar")

# Imports done below bp definition to dodge circular imports while re-using
# the same blueprint
from http_api.v1.foobar import (
    foobar_create,  # noqa: F401
    foobar_list,    # noqa: F401
)
```

See
http-layer-guide.md §Blueprint Organization
and the live example at
pipeline/__init__.py.

The application factory registers each resource blueprint individually so that path filters in CI and the route table
stay one-blueprint-per-resource.

## Decorator order

The canonical decorator order on every view is `@bp.route` → `@bp.input` (when present) → `@bp.doc` →
`@require_permissions` → `@bp.output`. `@bp.output` is the final decorator before the view function — placing it
earlier (for example, immediately after `@bp.route` or before `@bp.doc`) is incorrect because decorator order affects
how APIFlask assembles the OpenAPI spec and the route middleware chain
(review precedent; see
account_list.py:212-214,
pipeline_create.py:92-123).

### Desired

```python
@bp.route("", methods=["GET"])
@bp.doc(
    summary="List links",
    description=ROUTE_OPENAPI_DESCRIPTION,
    security=["BearerAuth"],
    responses={...},
)
@require_permissions(*ROUTE_REQUIRED_PERMISSIONS)
@bp.output(LinkListResponseSchema)
def list_links_view() -> LinkListResponse: ...
```

### Not desired

```python
@bp.route("", methods=["GET"])
@bp.output(LinkListResponseSchema)  # wrong: before @bp.doc and @require_permissions
@bp.doc(...)
@require_permissions(*ROUTE_REQUIRED_PERMISSIONS)
def list_links_view(): ...
```

POST endpoints carry `@bp.input(..., location="json")` between `@bp.route` and `@bp.doc`; GET list endpoints carry
`@bp.input(..., location="query")` (and, when needed, `@bp.input(..., location="headers")`) in that same slot
(http-layer-guide.md §List endpoint (GET)).

### POST endpoint — Desired

```python
# http_api/v1/pipeline/pipeline_create.py

ROUTE_REQUIRED_PERMISSIONS: Final[set[PermissionName]] = {LOGIN, PIPELINE_CREATE}

ROUTE_OPENAPI_DESCRIPTION: Final[str] = f"""
Create a new pipeline. Successful response is 201 with the new pipeline ID.
---
{generate_openapi_permissions_trailer(ROUTE_REQUIRED_PERMISSIONS)}
"""

@bp.route("", methods=["POST"])
@bp.input(PipelineCreateJSONInputSchema, location="json")
@bp.doc(
    summary="Create a new pipeline",
    description=ROUTE_OPENAPI_DESCRIPTION,
    security=["BearerAuth"],
    responses={
        HTTPStatus.CREATED.value: {
            "description": HTTPStatus.CREATED.phrase,
            "content": {"application/json": {"schema": PipelineCreateResponseSchema}},
        },
        HTTPStatus.UNPROCESSABLE_ENTITY.value: {"description": HTTPStatus.UNPROCESSABLE_ENTITY.phrase},
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
@bp.output(PipelineCreateResponseSchema, status_code=HTTPStatus.CREATED.value)
def create_pipeline_view(json_data: PipelineCreateJSONInput) -> PipelineCreateResponse: ...
```

See the live file at
pipeline_create.py.

## Related standards

- http-layer-guide.md — original
  architectural guide; this document supersedes it for PR-derived conventions while lifting forward its directory and
  naming scaffolding.
- http-layer-pr-conventions.md
  — per-rule source synthesis with full PR-comment citations.
- Service-layer and python-testing standards cover the layers adjacent to the HTTP boundary; service signatures accept
  already-typed domain values produced here, and error-path tests for the HTTP layer follow the no-leak pattern
  documented above.
