---
last_updated_at: 2026-05-25
---

# Data layer errors

This standard governs wrapper-local exceptions, generic database errors, substring disambiguation, and unexpected
return codes.

## Errors

### Wrapper-local subclasses with `ClassVar[str] ERROR_MESSAGE`

For each business-distinct error a sproc surfaces, define a wrapper-local subclass of `StoredProcedureCallError` with a
`ClassVar[str] ERROR_MESSAGE`. The class-level message is the stable user-facing string; raising the subclass without
arguments uses it automatically
(__init__.py:51-68;
app_InsertProduct.py:15-50).

```python
class ProductNameInUseError(StoredProcedureCallError):
    """Raised when the Product.ProductName is already in use."""

    ERROR_MESSAGE: ClassVar[str] = "Product Name is already in use."

class ProductDuplicateDataError(StoredProcedureCallError):
    """Raised when there is a duplicate data error but we cannot determine which field the error is about."""

    ERROR_MESSAGE: ClassVar[str] = "One or more of the unique fields is already in use by another Product."
```

Source:
app_InsertProduct.py:15-26.

### Raise `DatabaseErrorReturnCodeError()` without `error_message`

`DatabaseErrorReturnCodeError` is the generic catch-all for the `gcDatabaseError` return code. Its `ERROR_MESSAGE`
(`"Stored procedure returned a database error."`) is the stable user-facing message for this scenario. Do not pass
`error_message=error_message_output` to it — that couples the Python error message to the SQL `CATCH` block's internal
`@DbErrorMsg` string and creates a leakage path for internal SQL detail
(review precedent; __init__.py:71-82).

Entity-specific subclasses that need `error_message_output` for disambiguation (e.g., `ProductNameInUseError` vs
`ProductDuplicateDataError`, decided by a substring match on the OUTPUT message) are the exception — those branches
read `error_message_output` to pick a more specific error class, then raise it without forwarding the raw text.

#### Desired ✅

```python
elif return_code == SprocReturnCode.DATABASE_ERROR:
    raise DatabaseErrorReturnCodeError()
```

Source:
app_InsertProduct.py:157-158.

#### Not desired ❌

```python
elif return_code == SprocReturnCode.DATABASE_ERROR:
    raise DatabaseErrorReturnCodeError(error_message=error_message_output)
# Not desired: couples the Python error message to the SQL CATCH block's
# internal @DbErrorMsg; the class-level ERROR_MESSAGE is the stable contract.
```

### Disambiguate duplicate-data and string-too-long errors with substring matches on `error_message_output`

When the SQL sproc cannot signal which specific column caused a `gcDuplicateData` or `gcStringTooLong` error (older SQL
Server versions), the wrapper inspects `@ErrorMessage` text and picks a more specific subclass. Substring matches are
brittle by nature; the wrapper carries a comment noting that the matches must be re-tested when the sproc's error
strings are changed. Always include a generic fallback subclass (e.g., `ProductDuplicateDataError`,
`ProductGenericFieldTooLongError`) for the case where no substring matches
(app_InsertProduct.py:135-156;
app_UpdateVendor.py:144-164).

```python
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
```

Source:
app_InsertProduct.py:135-156.

### Unrecognized return codes raise `UnexpectedStoredProcedureCallError`

The `else` branch of the return-code dispatch raises `UnexpectedStoredProcedureCallError` with the offending value.
This catches sproc-side drift — a new return code added to the SQL sproc that the wrapper has not been updated for — at
the first failing call
(__init__.py:108-118;
app_AddAccountRole.py:99-100).

```python
else:
    raise UnexpectedStoredProcedureCallError(f"Return code not expected: {return_code}")
```

Source:
app_AddAccountRole.py:99-100.
