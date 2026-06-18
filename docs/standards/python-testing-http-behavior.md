---
last_updated_at: 2026-05-25
---

# Python testing HTTP and behavior checks

This standard governs HTTP error-path tests, migration-skip discipline, concrete behavior checks, and test
consolidation.

## HTTP route error-path tests — assert no internal leak

Error-path HTTP tests lock the no-leak invariant explicitly. A status-code-only test passes while the body silently
leaks internals; the invariant only stays locked if the test asserts that internal markers are absent from the response
body. This complements the response-shape contract enforced by the HTTP layer itself (see
[http-layer.md](./http-layer.md)).

The pattern has four parts:

1. Mock the service exception with a message containing internal markers — implementation names, diagnostic tokens, or
   schema-internal field names: `ReportGenerationError("renderer crashed; diagnostic_marker=raw_backend_detail")`.
1. Assert each marker is absent from the response body: `"renderer crashed"`, `"raw_backend_detail"`.
1. Assert the body matches the canonical shape: `message == HTTPStatus.<STATUS>.phrase` and `detail` contains only safe
   fields (e.g., `{"error": "Report generation failed"}` for 500; `{"locations": {"_schema": [...]}}` for 422).
1. Name the test method ending in `_without_leaking_internals` so the invariant is visible in test output.

### Desired

```python
def test_get_report_generation_error_returns_500_without_leaking_internals(client, mocker):
    mocker.patch(
        "svc.report.run",
        side_effect=ReportGenerationError(
            "renderer crashed; diagnostic_marker=raw_backend_detail"
        ),
    )
    response = client.get("/v1/report/foo")
    assert response.status_code == 500
    body = response.get_json()
    assert "renderer crashed" not in str(body)
    assert "raw_backend_detail" not in str(body)
    assert body["message"] == HTTPStatus.INTERNAL_SERVER_ERROR.phrase
    assert body["detail"] == {"error": "Report generation failed"}
```

### Not desired

```python
def test_get_report_generation_error_returns_500(client, mocker):
    mocker.patch("svc.report.run", side_effect=ReportGenerationError("..."))
    response = client.get("/v1/report/foo")
    assert response.status_code == 500
# status-only assertion lets the body silently leak internals
```

Apply the four-part pattern to every error path that maps a service exception to a 4xx or 5xx response — both PDF and
JSON variants of a route, both 500 and 422 cases. The point isn't to test the route once; it's to keep the no-leak
invariant intact as new error paths are added.

A 422 error path that maps a domain validation error to a structured `detail` block uses the same pattern. The mocked
exception message contains internals; the response body asserts the canonical shape and the absence of those internals
(test_link_create.py:80-103).

```python
def test_create_link_name_conflict_returns_422(
    self,
    test_app_for_http_layer: ExampleFlaskApp,
    auth_headers: dict[str, str],
    valid_body: dict[str, Any],
) -> None:
    """Test that LinkNameInUseError maps to 422 with link_name detail key."""
    with patch("svc.links.insert_link", autospec=True) as mock_insert:
        mock_insert.side_effect = LinkNameInUseError("Link Name is already in use")

        response = test_app_for_http_layer.test_client().post(
            "/v1/link",
            headers=auth_headers,
            json=valid_body,
        )

    assert response.status_code == HTTPStatus.UNPROCESSABLE_ENTITY
    data = response.get_json()
    assert data["message"] == HTTPStatus.UNPROCESSABLE_ENTITY.phrase
    assert "link_name" in data["detail"]["locations"]["json"]
```

Note that this test asserts both the status code and the structured `detail` shape; an exception message of
`"Link Name is already in use"` would never appear in the response body because the HTTP layer maps the exception to a
known `detail` envelope. The no-leak assertion is implicit in asserting the canonical shape — but on routes where the
message text could plausibly leak (the 500 case above), make the absence explicit.

## Migration discipline — no skip-on-missing-migration commits

A test that contains a skip-reason string like `"the sproc is not yet deployed to the test database"` is not committed.
Tests reflect the state of the database at the time of PR merge, not a future state.
.

There are two acceptable remediations:

1. Hold the test out of the PR until the migration lands.
1. Replace it with a unit test that mocks the data layer until the integration test can run clean.

### Desired

```python
@pytest.mark.db
def test_create_link_inserts_row(transactional_db_connection):
    # Sproc app_InsertLink IS deployed in the test db. Test runs.
    ...
```

### Not desired

```python
@pytest.mark.db
@pytest.mark.skip(reason="the sproc is not yet deployed to the test database")
def test_create_link_inserts_row(transactional_db_connection):
    ...
# commits a permanently-disabled test; coverage gap from day one
```

A committed skip telegraphs "this test doesn't run" to every future reader. At worst, the skip persists across PRs and
the integration coverage never materializes. At minimum, it makes PR history misleading — the PR claims to add coverage
that doesn't actually run.

The same constraint applies to `pytest.skip(...)` calls in test bodies that gate on missing migrations. The check
pattern at PR-review time is mechanical:

- No `@pytest.mark.skip` with a "not yet deployed" reason.
- No `pytest.skip(...)` calls hiding missing migrations.

A `pytest.skip("No Links found in test database")` guarding an integration assertion on a possibly-empty table is a
different case and is fine — the sproc is deployed; the test is defending against an empty fixture data set, not a
missing migration
(test_links.py:218-219).

If test generation precedes migration deployment (e.g., the agent had not pulled `dev` before generating tests), the
remediation is to pull, re-run the migrations against the local test DB, and regenerate the tests against the current
schema. Do not paper over the stale state with a skip.

## Test concrete behaviors, not abstract properties

Tests exercise the system the way real callers use it — through public interfaces, with realistic inputs, asserting
observable outputs. A test that constructs a scenario no caller can produce, or asserts a property only visible through
introspection, does not catch regressions in behavior anyone depends on.

Route tests call the route. Service tests call the service function. Data-layer tests call `exec_sproc`. The assertion
targets the return value, the raised exception, or the observable side effect — not the internal path the
implementation took to get there. If the only way to verify a property is to inspect source code, read the AST, or
assert on mock call ordering, the property is not testable behavior — document it in the function's docstring or type
signature instead.

Synthetic inputs that bypass validation the real caller would hit (e.g., passing `None` to a parameter that the HTTP
schema rejects before it reaches the service layer) produce tests that pass forever and protect nothing. Match the
test's entry point and input shape to the boundary where the behavior is consumed.

## Prefer fewer, multi-scenario tests over many single-case tests

Every test in the suite runs on every push. Test count has a direct cost in CI time, and each additional test is a
maintenance liability — fixtures to keep current, names to keep honest, docstrings to keep accurate. The goal is
coverage breadth per test, not test count.

When multiple scenarios share the same fixture setup and exercise the same behavioral boundary, consolidate them into a
single test with multiple assertions or a parametrized matrix rather than writing one test function per case. The
consolidation is justified when:

- The setup (mocks, fixtures, client configuration) is identical across cases.
- The cases vary only in input and expected output, not in the behavior path being tested.
- A single descriptive test name or parametrize ID set communicates what the group covers.

Error-mapping tests are a natural consolidation target. When a service function translates five sproc error codes into
five service-layer exceptions, one parametrized test with five `(sproc_error, expected_exception)` pairs shares the
mock setup once and verifies the full mapping surface. Five separate test functions with identical setup, differing
only in the side_effect and the `pytest.raises` target, repeat the fixture world five times for no additional
behavioral coverage.

### Desired

```python
@pytest.mark.parametrize(
    ("sproc_error", "expected_exception"),
    [
        (SomeSprocError("not found"), EntityNotFoundError),
        (SomeSprocError("duplicate"), EntityConflictError),
        (SomeSprocError("invalid ref"), InvalidReferenceError),
    ],
    ids=["not-found", "duplicate", "invalid-ref"],
)
def test_create_entity_translates_sproc_errors(
    dud_connection_factory, sproc_error, expected_exception
):
    """Each sproc error code maps to a specific service exception."""
    with dud_connection_factory() as conn, patch(
        "svc.entity.app_InsertEntity.exec_sproc",
        autospec=True,
        side_effect=sproc_error,
    ):
        with pytest.raises(expected_exception):
            create_entity(data=VALID_DATA, connection=conn)
```

### Not desired

```python
def test_create_entity_not_found_error(dud_connection_factory):
    """..."""
    # identical setup to below, only side_effect differs
    ...

def test_create_entity_duplicate_error(dud_connection_factory):
    """..."""
    # identical setup to above, only side_effect differs
    ...

def test_create_entity_invalid_ref_error(dud_connection_factory):
    """..."""
    # identical setup to above, only side_effect differs
    ...
# Three functions with repeated fixture setup for the same behavioral boundary.
# A single parametrized test covers the same mapping surface with less noise.
```

HTTP route error-path tests follow the same principle. When multiple error conditions share the same `client`,
`auth_headers`, and `valid_body` fixtures and differ only in the mocked exception and expected status code, consolidate
them. Separate test methods are warranted when the setup genuinely differs — different mock targets, different request
shapes, different fixture configurations.

The threshold is not "always parametrize" — it is "do not repeat identical setup across multiple tests when the only
variation is input and expected output." When setup genuinely differs between cases, separate test functions remain
correct.

## Every test must justify its existence

A test earns its place by encoding an external specification the implementation can fail to meet. If the test cannot
fail under any plausible refactor that preserves the documented behavior, it adds no review value and must be removed.
The same applies to a test whose name promises one assertion but whose body verifies something narrower, weaker, or
different. Generated tests are not exempt — every test is read, maintained, and run on every push, and a misleading or
value-free test costs the team more than a missing one
(review precedent).

Four anti-patterns recur. Each has a concrete signal a reviewer or agent can grep for.

**Source-text introspection.** A test that reads the implementation's own source via `inspect.getsource`, `ast`, or
regex against module bodies is asserting on how the function is *written*, not what it *does*. The assertion fails
under behavior-preserving refactors and passes under behavior-breaking ones — the opposite of what a test is for. When
the invariant under test is structural ("this function does not write files," "this orchestrator does not open
sockets," "this path is purely in-memory"), exercise the function in a sandboxed environment and assert the observable
consequence. If the invariant cannot be exercised, delete the test; document the property in the function's docstring
or signature instead (review precedent).

```python
# Desired ✅ — exercise behavior in a sandbox
def test_run_report_does_not_write_files(tmp_path: Path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    run_report(report_request, db_connection=dud_connection_factory(...))
    assert list(tmp_path.iterdir()) == []
```

```python
# Not-desired ❌ — assert on the function's source text
import inspect, re

def test_run_report_does_not_write_files():
    src = inspect.getsource(run_report)
    assert not re.search(r"\bopen\s*\(", src)
    assert "Path(" not in src
# Source: described in review precedent at
# review precedent
```

**Framework or type-system tautology.** Asserting that a `@dataclass(frozen=True)` rejects attribute assignment, that a
`Literal["a", "b"]` type rejects `"c"` at runtime when no runtime check exists, that an APIFlask schema with
`required=True` raises when the field is absent, or that an `Enum` instance equals itself — none of these are behavior
under team control. The framework or interpreter guarantees them; a test verifies only that the framework hasn't been
monkey-patched. Delete these tests; rely on type checking and framework defaults.

**Naming dishonesty.** The test name encodes the assertion (per the layout-and-naming section). A test named
`test_run_report_propagates_no_data_error` whose body asserts a 404 response when the route now returns 204 is
dishonest in two ways at once — the name and the assertion both lie. Names and assertions must be re-verified together
when route behavior changes; a name that disagrees with its body is a defect, not a stylistic concern
(review precedent).

**Trivially-passing assertions.** `assert result is not None` after a function whose return type is non-Optional,
`assert len(rows) >= 0`, `assert isinstance(value, dict)` when the function's return annotation already says
`dict[str, Any]` — these patterns pass under any code change including a stubbed-out implementation. An assertion must
be strong enough that the test fails when the documented behavior changes. If the strongest available assertion is
trivially true, the test does not have enough specification to justify itself; delete it.

When in doubt about whether a test has value, ask: *what code change, short of removing the function entirely, would
make this test fail?* If the answer is "none" or "any refactor," the test is in one of the four categories above and
should be removed or rewritten against a behavior contract.
