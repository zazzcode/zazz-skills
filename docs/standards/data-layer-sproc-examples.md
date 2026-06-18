---
last_review_sha: ac73578bab3bd2c329a6b67232c5146bce90eb89
---

> **Superseded by [`data-layer.md`](data-layer.md).** The unified standard is the authoritative source for current
> rules. The example wrappers in this document raise the base `StoredProcedureCallError` directly in their `else`
> branch; the unified standard now prescribes `UnexpectedStoredProcedureCallError`. Where this document conflicts with
> `data-layer.md`, the unified standard wins.

# Data Layer Sproc Examples

Complete, production-ready examples for wrapping stored procedures. See [Data Layer Guide](data-layer-guide.md) for
idiom explanations and reference material.

## Stored Procedure That Returns Data

Use this pattern when the stored procedure returns result rows.

```python
"""Wrapper for the `legacy_ListVendor` stored procedure."""

from dataclasses import dataclass
from enum import IntEnum
from typing import Final, Literal, TypedDict, cast

import pymssql

from data.sprocs import StoredProcedureCallError
from data.sprocs.util import validate_column_names

SPROC_NAME: Final[str] = "legacy_ListVendor"


class SprocReturnCode(IntEnum):
    """Return codes surfaced by `legacy_ListVendor`."""

    SUCCESS = 0
    NO_RESULTS = 1


@dataclass
class SprocArguments:
    """Parameters accepted by `legacy_ListVendor`.

    IMPORTANT: Parameter names MUST exactly match the SQL stored procedure's
    parameter names, including Hungarian notation (e.g., lDataProviderID).
    Use # noqa: N815 to suppress naming convention warnings.
    """

    lDataProviderID: int | Literal[-1] = -1  # noqa: N815

    # tSortByColumn: int = 1
    # ^ Not exposed: always hardcoded to 1 in exec_sproc below


class SprocDataResultReturnRow(TypedDict):
    """Shape of each row returned by the stored procedure."""

    VendorName: str
    VendorID: int
    VendorCode: str | None


SPROC_RETURN_ROW_COLUMN_NAMES: Final[tuple[str, ...]] = tuple(
    SprocDataResultReturnRow.__annotations__.keys()
)


def exec_sproc(
    *,
    sproc_args: SprocArguments,
    connection: pymssql.Connection,
    testing: bool = False,
) -> list[SprocDataResultReturnRow]:
    """Execute `legacy_ListVendor` and return the raw rows.

    Args:
        sproc_args: Parameters to pass to the stored procedure.
        connection: Active database connection.
        testing: When True, raises on column mismatch instead of logging.
            Only pass True from test code.

    Returns:
        List of vendor records from the database.

    Raises:
        StoredProcedureCallError: If the stored procedure returns an unexpected code.
    """

    with connection.cursor() as cursor:
        cursor.callproc(
            SPROC_NAME,
            (
                str(sproc_args.lDataProviderID),
                str(1),  # tSortByColumn hardcoded
            ),
        )

        return_value = cursor.returnvalue

        if return_value == SprocReturnCode.SUCCESS:
            pass

        elif return_value == SprocReturnCode.NO_RESULTS:
            return []

        else:
            raise StoredProcedureCallError(
                f"Failed to list vendors: {return_value}",
            )

        description = cursor.description or tuple()
        column_names = tuple(column[0] for column in description)
        validate_column_names(
            stored_procedure_name=SPROC_NAME,
            expected_column_names=SPROC_RETURN_ROW_COLUMN_NAMES,
            actual_column_names=column_names,
            testing=testing,
        )

        cursor_result = cursor.fetchall()
        assert cursor_result is not None
        results = [
            cast(
                SprocDataResultReturnRow,
                dict(zip(SPROC_RETURN_ROW_COLUMN_NAMES, row, strict=True)),
            )
            for row in cursor_result
        ]

        return results
```

## Stored Procedure With No Data Return

Use this pattern when the stored procedure performs an action but doesn't return result rows.

```python
"""Wrapper for the `legacy_UpdateDataProvider` stored procedure."""

from dataclasses import dataclass
from enum import IntEnum
from typing import Final, Literal

import pymssql

from data.sprocs import StoredProcedureCallError

SPROC_NAME: Final[str] = "legacy_UpdateDataProvider"


class SprocReturnCode(IntEnum):
    """Return codes surfaced by `legacy_UpdateDataProvider`."""

    SUCCESS = 0
    NO_ROWS_AFFECTED = 1


@dataclass
class SprocArguments:
    """Parameters accepted by `legacy_UpdateDataProvider`.

    IMPORTANT: Parameter names MUST exactly match the SQL stored procedure's
    parameter names, including Hungarian notation (e.g., lDataProviderID).
    Use # noqa: N815 to suppress naming convention warnings.
    """

    lDataProviderID: int  # noqa: N815
    sDataProviderName: str  # noqa: N815
    sDataProviderDescription: str  # noqa: N815
    sDataProviderCode: str  # noqa: N815
    lDataProviderMappingID: int  # noqa: N815
    sUpdateFlag: Literal["Y", "N"]  # noqa: N815


def exec_sproc(
    *,
    sproc_args: SprocArguments,
    connection: pymssql.Connection,
    testing: bool = False,
) -> None:
    """Execute `legacy_UpdateDataProvider` to update or insert a DataProvider record.

    This sproc performs either UPDATE or INSERT based on sUpdateFlag:
    - 'Y': Updates existing DataProvider with lDataProviderID
    - 'N': Inserts new DataProvider (lDataProviderID is ignored)

    Args:
        sproc_args: Parameters to pass to the stored procedure.
        connection: Active database connection.
        testing: When True, raises on column mismatch instead of logging.
            Only pass True from test code.

    Raises:
        StoredProcedureCallError: If no rows affected or unexpected return code.
    """

    with connection.cursor() as cursor:
        cursor.callproc(
            SPROC_NAME,
            (
                str(sproc_args.lDataProviderID),
                sproc_args.sDataProviderName,
                sproc_args.sDataProviderDescription,
                sproc_args.sDataProviderCode,
                str(sproc_args.lDataProviderMappingID),
                sproc_args.sUpdateFlag,
            ),
        )

        sql_sproc_return_value = cursor.returnvalue

        if sql_sproc_return_value == SprocReturnCode.SUCCESS:
            return

        elif sql_sproc_return_value == SprocReturnCode.NO_ROWS_AFFECTED:
            raise StoredProcedureCallError(
                "No rows affected when updating/inserting DataProvider",
            )

        else:
            raise StoredProcedureCallError(
                f"Failed to update/insert DataProvider: {sql_sproc_return_value}",
            )
```
