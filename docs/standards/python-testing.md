---
last_updated_at: 2026-06-10
---

# Python testing

This standard governs how Python tests are organized, named, and scoped in the backend. It covers test layout, the
relationship between unit and integration tests, when to use the `db` marker, the no-leak invariant on HTTP error-path
tests, and what may not be committed (skip-on-missing-migration tests). Code patterns are drawn from `backend/tests/`
within the last six months; reviewer conventions are drawn from the PR-comment harvest.

## Why each test exists

Every test carries commentary explaining why it exists. Future refactors need to know whether removing a test is safe;
the answer comes from the test's _why_, not just its name. Every test function carries a docstring — even if only a
one-liner restatement of the name — so review tooling and IDE hovers surface the intent without reading the body. A
comment beyond the docstring elaborates quirky or special-case rationale
(test_links.py,
python-testing-guide.md).

### Desired

```python
def test_create_account_prevents_duplicates_account_with_same_email(...) -> None:
    """Test that creating an account fails with expected error when the same email is used."""
    ...

def test_batch_validation_rejects_mixed_movement_types() -> None:
    """Confirm that batch validation rejects mixed movement types"""
    # legacy app Desktop exports sometimes include header rows with MovementType="H"
    # mixed with actual transaction rows. The legacy import silently filtered
    # these, but the new validator must explicitly reject them to avoid
    # partial imports that confuse reconciliation.
    ...
```

If the test's name is sufficient, the docstring can simply restate it. If the test exists because of a quirky scenario,
surface the quirk in the docstring and add a comment beneath it for elaboration — the comment supplements the docstring
rather than replacing it.

## Test layout and naming

Tests mirror the production layout under `backend/tests/`:

```
backend/tests/
├── conftest.py                          # cross-cutting fixtures (transactional_db_connection, dud_connection_factory, …)
├── data/
│   └── sprocs/                          # one test file per stored procedure
│       └── test_app_InsertLink.py
├── svc/                                 # one test file per service module
│   ├── test_links.py
│   ├── reports/vendor_summary/
│   │   ├── conftest.py
│   │   ├── test_service.py
│   │   ├── test_document.py
│   │   └── test_pdf_renderer.py
│   └── tickets/
│       ├── conftest.py
│       └── test_create_unposted_ticket.py
└── http_api/
    ├── conftest.py
    └── v1/
        ├── link/
        │   ├── test_link_create.py
        │   └── test_link_data_provider_mapping_swap.py
        └── ticket/
            ├── conftest.py
            └── test_ticket_unposted_bulk_validate.py
```

Test files are named `test_<module>.py` and live alongside a directory matching the module they cover. Each
`svc/<module>.py` has a matching `tests/svc/test_<module>.py`; each `data/sprocs/<sproc>.py` has a matching
`tests/data/sprocs/test_<sproc>.py`; each `http_api/v1/<resource>/<endpoint>.py` has a matching
`tests/http_api/v1/<resource>/test_<endpoint>.py`
(test_link_create.py,
test_links.py).

Within a service test file, tests are organized by function under a banner comment and ordered from happy-path unit
tests through integration tests
(test_links.py:44).

### Desired

```python
# ──────────────────────────────────────────────────────────────────────────────
# get_all_links tests
# ──────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def build_app_GetAllLinks_row() -> (  # noqa: N802
    Callable[[Mapping[str, object] | None], app_GetAllLinks.SprocDataResultReturnRow]
):
    """Factory fixture for building app_GetAllLinks stored procedure rows."""
    ...

def test_get_all_links_returns_list_of_links(...) -> None: ...

@pytest.mark.db
def test_get_all_links_integration(transactional_db_connection: Connection) -> None: ...
```

HTTP route tests group cases by behavior using nested `TestX` classes — success, errors, validation, authorization —
each with their own `auth_headers` and `valid_body` fixtures
(test_link_data_provider_mapping_swap.py:24-247).

```python
class TestSwapLinkDataProviderMappingSuccess:
    def test_returns_204_and_forwards_args_to_service(...): ...

class TestSwapLinkDataProviderMappingErrors:
    def test_source_junction_missing_returns_404(...): ...
    def test_invalid_new_mapping_returns_404(...): ...
    def test_duplicate_target_returns_409(...): ...
    def test_service_error_returns_500(...): ...

class TestSwapLinkDataProviderMappingValidation:
    def test_missing_new_mapping_id_returns_422(...): ...

class TestSwapLinkDataProviderMappingAuthorization:
    def test_without_auth_returns_401(...): ...
    def test_deactivated_account_returns_403(...): ...
    def test_without_link_update_permission_returns_403(...): ...
```

Test method names encode the assertion: `test_<action>_<condition>_returns_<status>` for HTTP tests,
`test_<function>_<behavior>` for service and data tests. The expected outcome lives in the name, not in the docstring.

## Unit tests for display and data-shaping logic

Logic that transforms or formats rows returned by the service — grouping, sorting, display-type coercion, column
reshaping — is unit-tested by constructing the row data in Python and passing it to the document or formatter function
directly. Do not reach for the `db` marker when no database behavior is being exercised
(review precedent:
vendor_summary/test_service.py).

### Desired

```python
# Unit test: no DB connection needed
def test_groups_locations_by_state():
    rows = [Row(state="TX", ...), Row(state="OK", ...), Row(state="TX", ...)]
    output = build_document(rows)
    assert len(output.sections["TX"].rows) == 2
```

### Not desired

```python
# A 20s integration test that only exercises display grouping
@pytest.mark.db
@pytest.mark.parametrize("display_state", DISPLAY_STATES)
def test_grouping_per_state(transactional_db_connection, display_state):
    insert_locations(transactional_db_connection, ...)
    ...
```

Integration tests that exercise only display or formatting logic impose a DB-dependency cost without verifying any
database behavior. At roughly 20 seconds per report module, ten to fifteen reports would push the local integration
suite past the point of practical use. Keep display tests fast and unit-scoped; reserve integration runs for behavior
the database actually drives.

Service-layer unit tests use the `dud_connection_factory` fixture and `patch(...exec_sproc)` to mock the data-layer
call. The unit test verifies what was forwarded to the sproc, not that the sproc returned anything in particular
(test_links.py:252-308).

```python
def test_insert_link_passes_sproc_arguments(
    dud_connection_factory: db.ConnectionFactory,
) -> None:
    """Verify all fields in InsertLinkData are forwarded to the sproc args."""
    with (
        dud_connection_factory() as connection,
        patch(
            "svc.links.app_InsertLink.exec_sproc",
            autospec=True,
        ) as mock_exec_sproc,
    ):
        mock_exec_sproc.return_value = {"LinkID": 1}

        insert_link(data=MINIMAL_INSERT_DATA, connection=connection)

    sproc_args = mock_exec_sproc.call_args.kwargs["sproc_args"]
    assert sproc_args.LinkName == MINIMAL_INSERT_DATA.link_name
```

A row-factory fixture (e.g., `build_app_GetAllLinks_row`) keeps unit tests for shaping logic short and intent-focused.
The factory defaults represent a typical row; each test overrides only the fields it cares about
(test_links.py:48-72).

## Happy-path integration test per service-layer PR

Every service-layer PR includes at least one integration test covering the happy path. The integration test exercises
the sproc through the real test database — using `transactional_db_connection` or an equivalent fixture — not a mock.
Unit-test-only coverage for a service-layer function is insufficient to merge
.

### Desired

```python
@pytest.mark.db
def test_insert_link_integration(transactional_db_connection: Connection) -> None:
    """Integration test against the real database.

    Inserts a Link and confirms a positive integer ID is returned.
    The transactional_db_connection fixture rolls back automatically, so
    no cleanup is needed.
    """
    data = InsertLinkData(
        link_name="IntTstLnk",
        link_description="Created by integration test",
    )
    result_id = insert_link(data=data, connection=transactional_db_connection)
    assert isinstance(result_id, int)
    assert result_id > 0
```

### Not desired

```python
def test_create_link_calls_sproc(mocker):
    mock_exec = mocker.patch("data.sprocs.app_InsertLink.exec_sproc")
    svc.links.create_link(...)
    mock_exec.assert_called_once()
# only unit-test coverage; the sproc's actual return shape is never verified
```

Unit tests alone verify call signatures, not that the sproc returns the expected shape. The service layer's job is to
orchestrate the data layer, and that orchestration must be verified end-to-end at least once per service function. Edge
cases (validation, error mapping) stay unit-scoped — but the happy path runs through the real sproc.

The `transactional_db_connection` fixture rolls back at test exit, so the integration test leaves no residue; no manual
cleanup is required (conftest.py).

## The `db` marker — reserve it for actual DB-state behavior

Mark a test with `@pytest.mark.db` only when the test scenario requires actual database rows to exercise the logic.
Valid reasons include verifying a sproc column-mapping, verifying `NO_ROWS_FOUND` behavior, verifying a join's output
shape, or confirming round-trip type coercion through pymssql.
.

The marker is what gates the local `-m db` integration run and what CI uses to keep the unit suite fast. Misusing it
(marking unit tests `db` to "be safe") inflates the integration run for no behavioral coverage; omitting it on a real
integration test (a sproc invocation against `transactional_db_connection`) lets the test leak into the unit run and
break in CI.

### Desired

```python
@pytest.mark.db
def test_get_all_links_integration(transactional_db_connection: Connection) -> None:
    """Integration test against the real database.

    Calls the service with no filtering and confirms a list of Link objects is
    returned. Catches sproc signature drift that mocks cannot detect.
    """
    result = get_all_links(connection=transactional_db_connection)

    if not result:
        pytest.skip("No Links found in test database")

    assert all(isinstance(link, Link) for link in result)
    assert all(link.id > 0 for link in result)
```

### Not desired

```python
@pytest.mark.db
@pytest.mark.parametrize("display_state", DISPLAY_STATES)
def test_grouping_per_state(transactional_db_connection, display_state):
    insert_locations(transactional_db_connection, ...)
    ...
```

When a parametrized matrix expands an integration test into dozens of scenarios that all probe the same SQL path,
that's a sign the matrix belongs in a unit test instead. Keep the integration matrix narrow — one or two cases that pin
the column mapping and the join shape — and push the breadth into Python-level unit tests of the shaping function.

A convergence test (byte-for-byte comparison against a locked JSON fixture) is a legitimate `-m db` use because it pins
the entire round-trip from sproc through service-layer mapping; the breadth comes from the fixture matrix, not from a
wide parametrize over the sproc itself
(vendor_summary/test_service.py:33-71).

```python
@pytest.mark.db
@pytest.mark.parametrize(
    ("slug", "customer_segment_id", "year", "month", "variant"),
    [
        (slug, legacy_id, year, month, variant)
        for (slug, legacy_id, year, month) in CASES
        for variant in VARIANTS
    ],
    ids=[...],
)
def test_run_report_matches_locked_fixture(  # noqa: PLR0913
    slug, customer_segment_id, year, month, variant,
    transactional_db_connection: pymssql.Connection,
) -> None:
    """Verify that run_report() output is byte-for-byte identical to the locked service fixture.

    The service layer maps SprocDataResultReturnRow → ReportDataRow before feeding
    rows into the document builder. If the mapping is wrong, the output will diverge
    from the fixture. This test catches any regression in that mapping, as well as
    any drift in the SP's column ordering or values.
    """
    document = run_report(...)
    actual = dumps_canonical_json(document)
    expected = _load_fixture(slug, variant)
    assert actual == expected
```

The matrix here is justified: each case exercises a different production-database edge (sparse rows, the
`HasGsDifferentialType=True` hidden-sulfur-ratio branch, the `GRAVCAP` subtotal exception). The fixture-comparison
style means every case is verifying actual DB-driven output, not Python-level shaping in isolation.

## Assert the exact message, not a menu of alternatives

An assertion that or-chains several acceptable outputs means the test does not know which behavior the code actually
has — it locks in nothing and silently keeps passing when the error path changes. Determine the real output and assert
that one message. When review precedent tightened such an assertion, it revealed the failure came from the CLI's own
quality-bank resolution, not the orchestrator translation the docstring claimed
(review precedent).

### Desired

```python
assert result.exit_code != 0
assert "No customer group found with ID 999999999" in result.output
```

### Not desired

```python
assert result.exit_code != 0
assert (
    "InvalidCustomerSegment" in result.output
    or "999999999" in result.output
    or "no rows" in result.output.lower()
    or "no data" in result.output.lower()
)
```

## Related standards

- [http-layer.md](./http-layer.md) — response-body shape and error-mapping contract that route-level tests assert
  against
- [data-layer.md](./data-layer.md) — sproc test conventions in `backend/tests/data/sprocs/`
- [service-layer.md](./service-layer.md) — service-layer structure that drives test layout under `backend/tests/svc/`
- [reports.md](./reports.md) — report-specific test rules (PDF byte determinism, case-matrix modules) layered on top of
  this document
- [database.md](./database.md) — migration discipline that the no-skip-on-missing-migration rule depends on
