---
last_updated_at: 2026-05-25
---

# Data layer wrapper templates

This standard contains canonical sproc wrapper templates for row-returning reads, writes with row returns, and writes
without result sets.

## Canonical wrapper templates

The two examples below are the canonical full-shape templates. New wrappers start from one of these and adjust for the
specific sproc's parameter surface, return codes, and result-row TypedDict.

### Wrapper that returns rows (GET sproc with `@ErrorMessage OUTPUT`)

```python
"""Wrapper for the `app_GetAllLinks` stored procedure."""

from dataclasses import dataclass
from datetime import datetime
from enum import IntEnum
from typing import Final, TypedDict, cast
from uuid import UUID

import pymssql

from data.sprocs import UnexpectedStoredProcedureCallError
from data.sprocs.util import validate_column_names

SPROC_NAME: Final[str] = "app_GetAllLinks"

class SprocReturnCode(IntEnum):
    """Return codes surfaced by `app_GetAllLinks`."""

    SUCCESS = 0            # gcOK
    NO_ROWS_FOUND = 1      # gcNoRowsFound

@dataclass
class SprocArguments:
    """Parameters accepted by `app_GetAllLinks`."""

    Username: str = "FIXTHIS"

    # @ErrorMessage: Not exposed — OUTPUT parameter; Python wrapper raises exceptions instead.

class SprocDataResultReturnRow(TypedDict):
    """Result row returned by `app_GetAllLinks`."""

    LinkID: int
    LinkName: str
    LinkDescription: str
    CreatedBy: str
    CreatedOn: datetime
    UpdateBy: str
    UpdatedOn: datetime
    Timestamp: bytes
    msrepl_tran_version: UUID

SPROC_RETURN_ROW_COLUMN_NAMES: Final[tuple[str, ...]] = tuple(
    SprocDataResultReturnRow.__annotations__.keys()
)

def exec_sproc(
    *,
    sproc_args: SprocArguments,
    connection: pymssql.Connection,
    testing: bool = False,
) -> list[SprocDataResultReturnRow]:
    """Execute `app_GetAllLinks` to retrieve all Link records."""
    with connection.cursor() as cursor:
        cursor.callproc(
            SPROC_NAME,
            (
                pymssql.output(str, None),  # @ErrorMessage OUTPUT
                sproc_args.Username,
            ),
        )

        return_code = cursor.returnvalue

        if return_code == SprocReturnCode.SUCCESS:
            pass

        elif return_code == SprocReturnCode.NO_ROWS_FOUND:
            return []

        else:
            raise UnexpectedStoredProcedureCallError(f"Return code not expected: {return_code}")

        # SUCCESS: validate columns and fetch data
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

        return [
            cast(SprocDataResultReturnRow, dict(zip(SPROC_RETURN_ROW_COLUMN_NAMES, row, strict=True)))
            for row in cursor_result
        ]
```

Source: app_GetAllLinks.py.

### Wrapper that performs a write (INSERT sproc returning a single row, with entity-specific error decoding)

```python
"""Wrapper for the `app_InsertProduct` stored procedure."""

from dataclasses import dataclass
from enum import IntEnum
from typing import ClassVar, Final, TypedDict, cast

import pymssql

from data.sprocs import (
    DatabaseErrorReturnCodeError,
    StoredProcedureCallError,
    UnexpectedStoredProcedureCallError,
)
from data.sprocs.util import validate_column_names

SPROC_NAME: Final[str] = "app_InsertProduct"

class ProductNameInUseError(StoredProcedureCallError):
    """Raised when the Product.ProductName is already in use."""

    ERROR_MESSAGE: ClassVar[str] = "Product Name is already in use."

class ProductDuplicateDataError(StoredProcedureCallError):
    """Raised when there is a duplicate data error but we cannot determine which field the error is about."""

    ERROR_MESSAGE: ClassVar[str] = "One or more of the unique fields is already in use by another Product."

class ProductNameTooLongError(StoredProcedureCallError):
    """Raised when the Product.ProductName exceeds its maximum length."""

    ERROR_MESSAGE: ClassVar[str] = "Product Name exceeds maximum length."

class ProductDescriptionTooLongError(StoredProcedureCallError):
    """Raised when the Product.ProductDescription exceeds its maximum length."""

    ERROR_MESSAGE: ClassVar[str] = "Product Description exceeds maximum length."

class ProductGenericFieldTooLongError(StoredProcedureCallError):
    """Raised when a Product text field exceeds its maximum length but we cannot determine which field."""

    ERROR_MESSAGE: ClassVar[str] = (
        "One or more text fields exceed their maximum length. Check: Product Name, Product Description."
    )

class SprocReturnCode(IntEnum):
    """Return codes surfaced by `app_InsertProduct`.

    Values are ErrorIDs from the ERROR table in the database.
    """

    SUCCESS = 0            # gcOK
    DATABASE_ERROR = 14    # gcDatabaseError
    DUPLICATE_DATA = 15    # gcDuplicateData
    STRING_TOO_LONG = 49   # gcStringTooLong

@dataclass
class SprocArguments:
    """Parameters accepted by `app_InsertProduct`.

    ProductDescription and ProductName are required. Username has a default.
    """

    ProductDescription: str
    ProductName: str
    Username: str = "FIXTHIS"
    # @ErrorMessage: Not in SprocArguments — captured as OUTPUT parameter in exec_sproc

class SprocDataResultReturnRow(TypedDict):
    """Result row returned by `app_InsertProduct` on success.

    Only returned on success (return code 0 / gcOK). On error the sproc returns
    no result set — errors are communicated via the RETURN code and
    @ErrorMessage OUTPUT parameter.
    """

    ProductID: int

SPROC_RETURN_ROW_COLUMN_NAMES: Final[tuple[str, ...]] = tuple(
    SprocDataResultReturnRow.__annotations__.keys()
)

def exec_sproc(
    *,
    sproc_args: SprocArguments,
    connection: pymssql.Connection,
    testing: bool = False,
) -> SprocDataResultReturnRow:
    """Execute `app_InsertProduct` to insert a new Product record."""
    with connection.cursor() as cursor:
        # pymssql maps callproc args alphabetically:
        # @ErrorMessage (OUTPUT), @ProductDescription, @ProductName, @Username
        result_params = cursor.callproc(
            SPROC_NAME,
            (
                pymssql.output(str, None),  # @ErrorMessage OUTPUT
                sproc_args.ProductDescription,
                sproc_args.ProductName,
                sproc_args.Username,
            ),
        )

        return_code = cursor.returnvalue
        error_message_output = cast(str | None, result_params[1])

        # Happy path
        if return_code == SprocReturnCode.SUCCESS:
            pass

        # Error paths; be careful and test the sproc manually when brittle substring matches are changed
        elif return_code == SprocReturnCode.DUPLICATE_DATA:
            if error_message_output is None:
                raise UnexpectedStoredProcedureCallError(
                    "Sproc returned a duplicate data error but no error message was provided."
                )
            elif "Product Name is already in use" in error_message_output:
                raise ProductNameInUseError()
            raise ProductDuplicateDataError()

        elif return_code == SprocReturnCode.STRING_TOO_LONG:
            if error_message_output is None:
                raise UnexpectedStoredProcedureCallError(
                    "Sproc returned a string too long error but no error message was provided."
                )
            if "Product Name exceeds maximum length" in error_message_output:
                raise ProductNameTooLongError()
            elif "Product Description exceeds maximum length" in error_message_output:
                raise ProductDescriptionTooLongError()
            raise ProductGenericFieldTooLongError()

        elif return_code == SprocReturnCode.DATABASE_ERROR:
            raise DatabaseErrorReturnCodeError()

        else:
            raise UnexpectedStoredProcedureCallError(f"Return code not expected: {return_code}")

        # Success path — read the result set (ProductID only)
        description = cursor.description or tuple()
        column_names = tuple(column[0] for column in description)
        validate_column_names(
            stored_procedure_name=SPROC_NAME,
            expected_column_names=SPROC_RETURN_ROW_COLUMN_NAMES,
            actual_column_names=column_names,
            testing=testing,
        )

        result = cursor.fetchone()
        if result is None:
            raise UnexpectedStoredProcedureCallError("Sproc returned no result when result set was expected.")

        return cast(
            SprocDataResultReturnRow,
            dict(zip(SPROC_RETURN_ROW_COLUMN_NAMES, result, strict=True)),
        )
```

Source: app_InsertProduct.py.

### Wrapper that performs a write with no result set (UPDATE sproc, PATCH semantics)

For UPDATE sprocs that return only a return code, the `exec_sproc` return type is `None`. The success branch `return`s
immediately and the column-validation / fetch block is absent.

```python
def exec_sproc(
    *,
    sproc_args: SprocArguments,
    connection: pymssql.Connection,
    testing: bool = False,
) -> None:
    """Execute `app_UpdateVendor` to update an existing Vendor record.

    PATCH semantics — only non-null parameters are updated. No result set.
    """
    with connection.cursor() as cursor:
        result_params = cursor.callproc(
            SPROC_NAME,
            (
                pymssql.output(str, None),         # @ErrorMessage OUTPUT — index 0
                sproc_args.VendorDescription,
                str(sproc_args.VendorID),         # Required — always convert to str
                sproc_args.VendorName,
                sproc_args.Username,
            ),
        )

        return_code = cursor.returnvalue
        error_message_output = cast(str | None, result_params[0])

        if return_code == SprocReturnCode.SUCCESS:
            return

        elif return_code == SprocReturnCode.NO_ROWS_FOUND:
            raise VendorNotFoundError(error_message=error_message_output)

        # ... duplicate-data and string-too-long branches as in the INSERT template ...

        elif return_code == SprocReturnCode.DATABASE_ERROR:
            raise DatabaseErrorReturnCodeError()

        else:
            raise UnexpectedStoredProcedureCallError(f"Return code not expected: {return_code}")
```

Source:
app_UpdateVendor.py:86-167.
