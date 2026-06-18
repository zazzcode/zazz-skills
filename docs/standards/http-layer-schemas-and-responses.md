---
last_updated_at: 2026-05-25
---

# HTTP layer schemas and responses

This standard governs HTTP input schemas, dataclass pairing, optional fields, response schemas, and response sourcing.

## Schemas and dataclass pairing

In an HTTP-route file, every marshmallow `Schema` class sits immediately below the `@dataclass` it serializes or
deserializes. Multiple dataclass/Schema pairs in the same file each follow the same immediate-pairing pattern; grouping
all dataclasses at the top and all schemas at the bottom is rejected because it forces readers to hunt across the file
to verify that field types and validation rules agree
.

### Desired

```python
@dataclass
class CreateAccountInput:
    username: str
    roles: list[RoleName]

class CreateAccountInputSchema(apiflask.schemas.Schema):
    username = apiflask.fields.String(required=True)
    roles = apiflask.fields.List(
        apiflask.fields.String(validate=validate.OneOf([r.value for r in RoleName])),
        required=True,
    )

    @post_load
    def make_input(self, data: Mapping[str, Any], **_: Any) -> CreateAccountInput:
        return CreateAccountInput(
            username=data["username"],
            roles=cast(list[RoleName], data["roles"]),
        )
```

### Input dataclass naming

JSON-body input dataclasses follow `<Resource>CreateJSONInput` and `<Resource>UpdateJSONInput`; the corresponding
schema appends `Schema` (e.g., `LinkCreateJSONInput` / `LinkCreateJSONInputSchema`). Patterns like
`<Resource>CreatePayloadInput` or the inverted `Update<Resource>Input` are rejected — consistent suffix and
resource-first ordering keep input types scannable and unambiguous in static analysis
(review precedent; see
http-layer-guide.md §Endpoint Module).
Query and header inputs follow `*QueryInput` and `*HeadersInput` for the same reason.

### Domain-typed fields

Dataclass fields carrying enum-validated or otherwise domain-typed values are typed with the domain type, not with
`str`. The Schema validates against the domain set via `fields.String(validate=OneOf([r.value for r in <Enum>]))` and
`@post_load` returns the dataclass with `cast(list[<Type>], data["field"])`. Carrying raw `str` on the dataclass defers
the type from the contract to the route body, where it tends to get re-validated or silently lost
(review precedent; see
role_update_permissions.py).

### Desired

```python
@dataclass
class CreateAccountInput:
    roles: list[RoleName]
```

### Not desired

```python
@dataclass
class CreateAccountInput:
    roles: list[str]  # wrong: defers type info from contract to route body
```

Domain types (`RoleName`, `AccountExternalID`, `PermissionName`, `Password`) are produced by callsite parsers — the
HTTP layer's marshmallow schemas deserialize raw request strings into the typed domain values. Service-layer signatures
accept the already-typed parameters and treat them as valid; they do not re-validate caller intent. Validation at every
layer produces inconsistent error reporting and undermines the static-analysis value of the typed domain values
(review precedent; see
types\_.py).

### Cast, don't re-comprehend

Schema-validated list fields are type-coerced with a single `cast` in `@post_load`. Writing a comprehension that
re-loops the validated data just to coerce types is rejected because the Schema has already validated the values — a
`cast` is sufficient and signals "the Schema validated this; I'm asserting the type for static analysis only." Reach
for a custom marshmallow field only when the cast pattern repeats enough to justify reuse
.

### Desired

```python
from typing import cast

@post_load
def make_input(self, data: Mapping[str, Any], **_: Any) -> UpdateRolePermissionsJSONInput:
    return UpdateRolePermissionsJSONInput(
        permissions=cast(list[PermissionName], data["permissions"]),
    )
```

### Not desired

```python
@post_load
def make_input(self, data, **_):
    return UpdateRolePermissionsJSONInput(
        permissions=[PermissionName(p) for p in data["permissions"]],  # wrong: re-loops validated data
    )
```

### Trust the Schema in `@post_load`

In `@post_load`, access fields with `data["<field>"]` direct subscript. Defensive `data.get("<field>", default)` calls
and conditional presence checks are rejected — if a field is optional, declare it optional on the Schema with
`load_default=None` (or another appropriate default) so the Schema guarantees `data["<field>"]` always exists.
Defensive `.get()` calls duplicate the Schema's job, let stale fallbacks survive after the Schema changes, and obscure
intent .

### Desired

```python
@post_load
def make_input(self, data: Mapping[str, Any], **_: Any) -> UpdateAccountInput:
    return UpdateAccountInput(
        roles=data["roles"],
        email=data["email"],
    )
```

### Not desired

```python
@post_load
def make_input(self, data, **_):
    return UpdateAccountInput(
        roles=data.get("roles", []),  # wrong: duplicates Schema work
        email=data.get("email"),       # wrong: hides intent
    )
```

## Optional fields and nullability

The project distinguishes "omit allowed, null not allowed" from "omit and null both allowed" using two distinct field
configurations. For optional fields where the caller may omit the value but may not send `null` — and where the
dataclass should still receive `None` for the omitted case — use `load_default=CALLER_BARRED_DEFAULT_NONE` with
`allow_none=False`. `CALLER_BARRED_DEFAULT_NONE` is a callable returning `None` defined in `http_api.v1.shared`; it
prevents OpenAPI/Swagger from advertising `null` as a valid value while still defaulting the dataclass field to `None`
(http-layer-guide.md §Optional input fields).

### Desired

```python
from http_api.v1.shared import CALLER_BARRED_DEFAULT_NONE

filter_id = apiflask.fields.Integer(
    required=False,
    load_default=CALLER_BARRED_DEFAULT_NONE,
    allow_none=False,
    metadata={"description": "Filter by ID; omit to return all"},
)
```

When the caller may explicitly send `null` (e.g., a nullable database column where `null` means "clear this field"),
use `load_default=None` with `allow_none=True` instead
(http-layer-guide.md §Optional input fields: omit and null both allowed).

For update schemas specifically, NOT NULL database columns use
`load_default=CALLER_BARRED_DEFAULT_NONE, allow_none=False`. Setting `allow_none=True` on a NOT NULL field creates a
false contract in the OpenAPI spec — the docs show `null` as valid when the database will reject it. `allow_none=True`
is reserved for nullable columns where `null` is a legitimate update value
.

### Not desired

```python
# Update schema field for a NOT NULL column
name = apiflask.fields.String(
    required=False,
    load_default=None,
    allow_none=True,  # wrong: advertises null as valid in OpenAPI spec for a NOT NULL column
)
```

### Enum constraints

Use a validator as the single source of truth for enum constraints. APIFlask automatically derives the OpenAPI `enum`
from `validate.OneOf` and from `apiflask.fields.Enum`; duplicating the constraint in `metadata={"enum": [...]}` is
rejected because the duplicate is a second source of truth that can drift. Prefer `Literal` with `validate.OneOf` over
introducing a new Enum class — only introduce an Enum when a pre-existing domain type already exists in
`backend/src/types_.py`
(http-layer-guide.md §Enum constraints).

### Desired

```python
flag = apiflask.fields.String(
    required=True,
    validate=validate.OneOf(["Y", "N"]),
    metadata={"description": "Whether the feature is enabled", "example": "Y"},
)
```

### Not desired

```python
flag = apiflask.fields.String(
    required=True,
    validate=validate.OneOf(["Y", "N"]),
    metadata={
        "description": "Whether the feature is enabled",
        "example": "Y",
        "enum": ["Y", "N"],  # wrong: redundant with the validator; second source of truth
    },
)
```

## Response schemas

Every field in a response schema carries `metadata={"description": "..."}`. The OpenAPI documentation at `/docs` is the
contract for frontend and integration consumers; fields without descriptions show up as undescribed properties and
force consumers to infer semantics from field names alone
(review precedent; see
account_list.py:89-97).

### Desired

```python
class LinkItemSchema(apiflask.schemas.Schema):
    id = apiflask.fields.Integer(
        required=True,
        metadata={"description": "Unique identifier for the link."},
    )
    name = apiflask.fields.String(
        required=True,
        metadata={"description": "Display name of the link."},
    )
```

### Not desired

```python
class LinkItemSchema(apiflask.schemas.Schema):
    id = apiflask.fields.Integer(required=True)  # wrong: no description
```

### List response shape

List endpoints return an array of items under a top-level `data` key. When aggregates need to be returned (totals,
counts) they live under a sibling `aggregates` key with a dedicated `*Aggregates` dataclass and schema nested into the
response type. Endpoints that do not need aggregates use the simple `{"data": [...]}` shape
(http-layer-guide.md §List response shapes).

### Desired

```python
@dataclass
class FoobarListAggregates:
    total_count: int

@dataclass
class FoobarListResponse:
    data: list[FoobarItem]
    aggregates: FoobarListAggregates
```

### Sourcing response fields

HTTP route bodies build the response by reading the service-layer return value, never by looping back through the
inbound request body. Even when the response field set overlaps with input fields, response data comes from the service
return — never from `data["roles"]` or equivalent inbound copies. Sourcing from request input lets stale or divergent
values silently appear in responses and creates surface area for future bugs
(review precedent; see
svc/role.py).

### Desired

```python
all_roles = svc.role.list_all_roles(connection=connection)
response_roles = [
    {"name": r.name, "display_name": r.display_name}
    for r in all_roles
]
```

### Not desired

```python
# wrong: response fields read from inbound JSON instead of service return
response_roles = [{"name": r, "display_name": r} for r in data["roles"]]
```

### CRUD update — validate, write, fetch, serialize

CRUD update routes read as `validate → write → fetch → serialize`. After the write commits, re-read the entity via a
`get_X()` service method that returns the canonical post-write shape and serialize from that. Inline assembly that
mixes input fields and service lookups is rejected because it produces silent divergence between the response and the
stored entity .

### Desired

```python
@bp.route("/<account_id>", methods=["PUT"])
def update_account_view(account_id: AccountExternalID, json_data: UpdateAccountJSONInput):
    with g.db_connection_factory() as conn:
        svc.account.update_account(account_id=account_id, **json_to_kwargs(json_data), connection=conn)
        conn.commit()
        updated = svc.account.get_account(account_id=account_id, connection=conn)
    return AccountResponseSchema().dump(updated)
```

### Not desired

```python
# wrong: mixes inputs with service lookups to build response inline
svc.account.update_account(account_id=account_id, **json, connection=conn)
return {"id": account_id, **json, "roles": svc.role.list_for_account(...)}
```

The companion convention is that `get_X()` returns the canonical entity shape including related collections by default
— `get_account` always returns roles, for example.
