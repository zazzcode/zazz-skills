---
last_updated_at: 2026-05-25
---

# HTTP layer documentation and tests

This standard governs OpenAPI documentation, error-path tests, and iteration patterns for HTTP endpoints.

## OpenAPI documentation

The `@bp.doc(...)` block is the canonical place to declare every response shape a route may emit — APIFlask uses it to
assemble the OpenAPI spec exposed at `/docs`, and clients infer error contracts from what is declared there.

### Document 422 (and every other emitted status)

Every route that can `apiflask.abort(HTTPStatus.UNPROCESSABLE_ENTITY.value, ...)` declares the 422 response in
`@bp.doc(responses=...)`. The `description` value uses `HTTPStatus.UNPROCESSABLE_ENTITY.phrase`. The OpenAPI spec
silently omits error codes not declared in `@bp.doc`; clients and consumers of `/docs` need to know which error
conditions a route may return (review precedent; see
quality_bank_create.py).

### Desired

```python
@bp.doc(
    summary="Create a new pipeline",
    description=ROUTE_OPENAPI_DESCRIPTION,
    security=["BearerAuth"],
    responses={
        HTTPStatus.CREATED.value: {
            "description": HTTPStatus.CREATED.phrase,
            "content": {"application/json": {"schema": PipelineCreateResponseSchema}},
        },
        HTTPStatus.UNPROCESSABLE_ENTITY.value: {
            "description": HTTPStatus.UNPROCESSABLE_ENTITY.phrase,
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
```

### Not desired

```python
@bp.doc(responses={200: {...}})  # wrong: route emits 422 but it's missing from docs
```

### Route description and permissions trailer

Each endpoint defines a module-level `ROUTE_OPENAPI_DESCRIPTION: Final[str]` that ends with the output of
`generate_openapi_permissions_trailer(ROUTE_REQUIRED_PERMISSIONS)` so the rendered `/docs` page lists the permissions
required to call the route. View functions themselves do not carry docstrings — the summary and description come from
`@bp.doc`, and a Python docstring on the view would duplicate that content into a place APIFlask does not surface
(http-layer-guide.md §Endpoint Module).

### Desired

```python
ROUTE_OPENAPI_DESCRIPTION: Final[str] = f"""
Create a new pipeline.

Any special considerations when creating pipelines.
---
{generate_openapi_permissions_trailer(ROUTE_REQUIRED_PERMISSIONS)}
"""

@bp.route("", methods=["POST"])
...
def create_pipeline_view(json_data: PipelineCreateJSONInput) -> PipelineCreateResponse:
    # DO NOT provide a function docstring; rely on @bp.doc summary= and description=
    ...
```

### Exercise new endpoints via `/docs`

Before marking a PR ready for review, exercise each new endpoint via the repo's documented local API docs URL, commonly
`<LOCAL_API_BASE_URL>/docs`. A successful response proves the route registers, `@require_permissions` accepts a valid
caller with the required permission, and the data layer is reachable — integration failures the unit tests may miss.
This is not a substitute for automated tests; it catches misconfigurations (missing seed permissions, broken route
registration, DB connectivity) faster than code review alone.

## Error-path tests

Error-path HTTP tests lock the no-leak invariant explicitly. A status-code-only test passes while the body silently
leaks internals; locking the invariant prevents future regressions where someone reintroduces `str(exc)` into
`message=` or `detail`. The pattern: mock the service exception with internal markers in its message — file paths,
sproc names, schema-internal field names — then assert each marker is absent from the response body, assert the body
matches the canonical shape (`message == HTTPStatus.<STATUS>.phrase`; `detail` contains only safe fields), and name the
test method `_without_leaking_internals`.

### Desired

```python
def test_get_report_generation_error_returns_500_without_leaking_internals(
    test_app_for_http_layer, auth_headers,
):
    underlying_message = "renderer crashed; diagnostic_marker=raw_backend_detail"
    with patch("http_api.v1.report.report_get.run_report", autospec=True) as mock_run:
        mock_run.side_effect = ReportGenerationError(underlying_message)
        response = test_app_for_http_layer.test_client().get("/v1/report/foo?...", headers=auth_headers)

    assert response.status_code == HTTPStatus.INTERNAL_SERVER_ERROR
    body_text = response.data.decode("utf-8")
    assert underlying_message not in body_text
    assert "renderer crashed" not in body_text
    assert "raw_backend_detail" not in body_text

    body = response.get_json()
    assert body["message"] == HTTPStatus.INTERNAL_SERVER_ERROR.phrase
    assert body["detail"] == {"error": "Report generation failed"}
```

### Not desired

```python
def test_get_report_generation_error_returns_500(client, mocker):
    mocker.patch("svc.report.run", side_effect=ReportGenerationError("..."))
    response = client.get("/v1/report/foo")
    assert response.status_code == 500  # wrong: status-only assertion lets body leak silently
```

For deeper testing conventions (mocking strategies, fixture organization, naming), see the python-testing standard.

## Iteration patterns

When iterating over a filtered collection, extract the filter as a named intermediate with a descriptive identifier and
iterate that named collection. Inlining guard `continue` clauses inside the loop body is rejected because it obscures
iteration intent. A named filtered collection signals intent at the call site and lets the subsequent loop body focus
on action rather than guard clauses (review precedent; see
account_list.py:237-241).

### Desired

```python
publically_viewable_accounts = filter(
    lambda item: item.username not in settings.hidden_account_usernames,
    account_items,
)
for public_account in publically_viewable_accounts:
    ...
```

### Not desired

```python
for account in api_accounts:
    if account.username in settings.hidden_account_usernames:
        continue  # wrong: guard inside the loop body obscures the iteration intent
    ...
```

Long, descriptive names are preferred over short ones in this codebase — the keystroke cost is small; the gain in
readability for both humans and agents is large.
