---
last_updated_at: 2026-05-25
---

# Data layer utilities and platform quirks

This standard governs platform-quirk comments and shared sproc utilities.

## Platform-quirk comments — preserve them across deletions

When a wrapper carries an explanatory comment about non-obvious pymssql, SQL Server, or Flyway behavior (the kind of
comment a future maintainer would re-derive painfully), and the wrapper is being deleted, the explanation moves to a
surviving file that depends on the same behavior. The comment is not dropped on the floor and it is not allowed to live
only in the deleted file's git history (review precedent).

The canonical example is the `pymssql.callproc` empty-result-set quirk. `cursor.callproc` silently drops empty result
sets — `cursor.description` is `None` and `fetchall()` raises `OperationalError`. `cursor.execute("EXEC ...")` surfaces
empty result sets correctly. When `app_ValidateUnpostedTicket.py` was deleted, the explanation was migrated into the
surviving `app_CreateUnpostedTicketBulk.py`, which is now the single place in the codebase that documents the quirk
(app_CreateUnpostedTicketBulk.py:137-143):

```python
# pymssql callproc silently drops empty result sets (description=None,
# fetchall raises OperationalError). This is a confirmed callproc
# limitation — cursor.execute("EXEC ...") surfaces empty result sets
# correctly, but callproc does not, even when the sproc runs a SELECT
# that returns zero rows. When all rows pass validation, the sproc's
# SELECT returns zero error rows — callproc won't surface it.
# Empty column_names = all rows valid.
if not column_names:
    return []
```

Source:
app_CreateUnpostedTicketBulk.py:137-145.

Before deleting a wrapper, grep its comments for `pymssql`, `callproc`, `SQL Server`, `Flyway`, or `# Note:`. If the
comment is non-obvious and any surviving file depends on the same behavior, migrate the comment to that file. If no
surviving file relies on the behavior, the comment can be dropped.

## util.py — shared utilities

`data.sprocs.util` exposes:

- `column_names_are_expected(*, expected_column_names, actual_column_names) -> bool` — boolean column-name comparison.
- `validate_column_names(*, stored_procedure_name, expected_column_names, actual_column_names, testing)` — raises
  `MismatchedColumnsError` when `testing=True`, logs an error otherwise.
- `stored_procedure_returned_unexpected_columns(...)` — the internal raise/log helper that `validate_column_names`
  delegates to.

Wrappers that return a result set import and call `validate_column_names` after the success branch of the return-code
dispatch and before `fetchall` / `fetchone`
(util.py;
data-layer-guide.md §util.py Functions).

```python
from data.sprocs.util import validate_column_names

validate_column_names(
    stored_procedure_name=SPROC_NAME,
    expected_column_names=SPROC_RETURN_ROW_COLUMN_NAMES,
    actual_column_names=column_names,
    testing=testing,
)
```

Source:
app_GetAllLinks.py:112-117.

## Related standards

- [`service-layer.md`](./service-layer.md) — service-layer functions that call `exec_sproc` and translate sproc errors
  into typed service exceptions.
- [`database.md`](./database.md) — SQL-side sproc authoring conventions: alphabetical parameter declaration,
  `@ErrorMessage OUTPUT` shape, ErrorID assignment from `dbo.Error`.
