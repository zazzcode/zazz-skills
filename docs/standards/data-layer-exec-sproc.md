---
last_updated_at: 2026-05-25
---

# Data layer exec_sproc

This standard governs exec_sproc signatures, callproc tuple ordering, output parameters, ID coercion, and return-code
dispatch.

## exec_sproc — signature, callproc tuple, return-code handling

### Signature is keyword-only

`exec_sproc` accepts three keyword-only arguments and returns either rows, a single row, or `None` depending on the
sproc shape. `testing` is `True` only inside the test suite
(data-layer-guide.md §exec_sproc Function).
The `testing` parameter is present on all `exec_sproc` functions, including write sprocs that do not validate columns,
to keep the call-site signature uniform across all wrapper kinds
(app_UpdateVendor.py:90).

```python
def exec_sproc(
    *,
    sproc_args: SprocArguments,
    connection: pymssql.Connection,
    testing: bool = False,
) -> list[SprocDataResultReturnRow]:  # or SprocDataResultReturnRow, or None
    ...
```

Source:
app_GetAllLinks.py:69-74;
app_InsertProduct.py:93-98;
app_UpdateVendor.py:86-91.

### Alphabetical callproc tuple matching the SQL parameter declaration

`pymssql.callproc` binds parameters positionally, not by name. The Python wrapper's `callproc` tuple follows the same
alphabetical order as the SQL sproc's parameter declaration, and each element carries an inline comment naming the SQL
parameter it satisfies. New sprocs are authored with alphabetical SQL parameter order; the Python tuple is the derived
artifact that must match the SQL order exactly
(review precedent).

A few legacy sprocs are not yet alphabetical in their SQL declaration (e.g., `app_CreateUnpostedTicketBulk` declares
`@ImportFileName, @ImportFileDescription` in declaration order). In those wrappers the Python tuple matches the SQL
declaration order, and a `# TODO:` comment records that both sides should be re-alphabetized later
(app_CreateUnpostedTicketBulk.py:122-133).

#### Desired ✅

```python
with connection.cursor() as cursor:
    # Params in alphabetical order:
    # @AccountId, @ErrorMessage (OUTPUT), @GrantedById, @RoleName
    result_params = cursor.callproc(
        SPROC_NAME,
        (
            str(sproc_args.AccountId),
            pymssql.output(str, None),     # @ErrorMessage OUTPUT
            str(sproc_args.GrantedById),
            sproc_args.RoleName,
        ),
    )
```

Source:
app_AddAccountRole.py:71-82.

#### Not desired ❌

```python
cursor.callproc(
    SPROC_NAME,
    (
        sproc_args.Username,               # Not desired: @U before @E breaks the
        pymssql.output(str, None),         # alphabetical match with the SQL signature
        str(sproc_args.AccountId),
        str(sproc_args.GrantedById),
        sproc_args.RoleName,
    ),
)
```

### `@ErrorMessage OUTPUT` is always `pymssql.output(str, None)` at the correct position

This section applies only to sprocs that declare `@ErrorMessage varchar(...) OUTPUT` in their SQL signature; legacy
`legacy_*` sprocs that predate this pattern do not include this slot and their callproc tuples omit the placeholder
entirely
(legacy_UpdateDataProvider.py;
legacy_ListVendor.py).

Every sproc with `@ErrorMessage varchar(...) OUTPUT` in its SQL signature gets a `pymssql.output(str, None)`
placeholder at the corresponding position in the callproc tuple. The position matches the alphabetical slot of
`@ErrorMessage` in the SQL declaration. Forgetting the placeholder is not a no-op: `pymssql` will silently shift every
subsequent positional argument left by one, so the next argument's value lands in `@ErrorMessage` and the last SQL
parameter is left unbound. No exception is raised. This is the silent data-corruption bug that review precedent fixed in
`app_GetAllLinks` (review precedent; app_GetAllLinks.py:88-92).

When the wrapper needs to read `@ErrorMessage` after the call — to disambiguate entity-specific errors from a generic
return code — capture the return of `cursor.callproc(...)` and read it positionally:

```python
result_params = cursor.callproc(SPROC_NAME, (...))
error_message_output = cast(str | None, result_params[0])
```

Source:
app_InsertProduct.py:120-128.
When the wrapper does not need the message text (no entity-specific error decoding), the assignment is prefixed with
`_` to mark it intentionally unused, or omitted entirely
(app_AddAccountRole.py:84-85).

#### Desired ✅

```python
cursor.callproc(
    SPROC_NAME,
    (
        pymssql.output(str, None),         # @ErrorMessage OUTPUT
        sproc_args.Username,               # @Username
    ),
)
```

Source:
app_GetAllLinks.py:86-93.

#### Not desired ❌

```python
cursor.callproc(
    SPROC_NAME,
    (
        sproc_args.Username,               # Not desired: @ErrorMessage OUTPUT slot omitted;
                                           # @Username silently binds to @ErrorMessage,
                                           # and is unavailable from the SQL parameter list.
    ),
)
```

### Convert integer IDs to `str` before passing them in the tuple

Several wrappers cast integer ID arguments to `str` in the callproc tuple (`str(sproc_args.VendorID)`,
`str(sproc_args.lDataProviderID)`). This matches the existing wrapper convention for required integer IDs
(app_UpdateVendor.py:125;
data-layer-sproc-examples.md §Stored Procedure With No Data Return).
UUID-typed IDs are also stringified (`str(sproc_args.AccountId)`,
app_AddAccountRole.py:75).

```python
cursor.callproc(
    SPROC_NAME,
    (
        pymssql.output(str, None),         # @ErrorMessage OUTPUT — index 0
        sproc_args.VendorDescription,
        str(sproc_args.VendorID),         # Required — always convert to str
        sproc_args.VendorName,
        sproc_args.Username,
    ),
)
```

### Return-code dispatch is a flat `if / elif / else` chain

After `cursor.callproc`, read `cursor.returnvalue` into a local named `return_code` (or `sql_sproc_return_value` in
older modules) and dispatch with a single `if / elif / else` chain. Order is: SUCCESS first, then specific error codes
as `elif` branches in any stable order (alphabetical or declaration order), then a final `else` that raises
`UnexpectedStoredProcedureCallError`
(data-layer-guide.md §Return Code Handling;
app_InsertProduct.py:130-160).

The `else` clause is mandatory. An unrecognized return code is a sproc-side change that the wrapper has not been
updated for; raising `UnexpectedStoredProcedureCallError` makes that drift loud and fast
(app_GetAllLinks.py:104-107).

A return code that means zero results (`NO_ROWS_FOUND`, `NO_RESULTS`) on a read sproc returns an empty list — it is a
normal variant, not an error, and must not raise
(app_GetAllLinks.py:101-103;
legacy_ListVendor.py). On write
sprocs the inverse rule applies: a zero-rows-affected code (`NO_ROWS_AFFECTED`, `NO_ROWS_FOUND`) indicates a logic or
data error and must raise — the entity the caller expected to exist was not found
(app_UpdateVendor.py:137-138;
legacy_UpdateDataProvider.py).

#### Desired ✅

```python
return_code = cursor.returnvalue

if return_code == SprocReturnCode.SUCCESS:
    pass

elif return_code == SprocReturnCode.NO_ROWS_FOUND:
    return []

else:
    raise UnexpectedStoredProcedureCallError(f"Return code not expected: {return_code}")
```

Source:
app_GetAllLinks.py:94-107.
