Tests should always have commentary that emphasizes _why_ the test exists.

This is important so future refactors can know if it's reasonable to remove the test because the _why_ is no longer
valid.

Sometimes a test is straightforward enough that the name of the test can sufficiently self descriptive:

```python
def test_create_account_prevents_duplicates_account_with_same_email(...) -> None:
    """Test that creating an account fails with expected error when the same email is used."""
    ...
```

Sometimes a test exists for strange cases that would be too awkward to include in a title:

```python
def test_batch_validation_rejects_mixed_movement_types() -> None:
    """Confirm that batch validation rejects mixed movement types"""
    # legacy app Desktop exports sometimes include header rows with MovementType="H"
    # mixed with actual transaction rows. The legacy import silently filtered
    # these, but the new validator must explicitly reject them to avoid
    # partial imports that confuse reconciliation.
    ...
```

In both cases, use a docstring, but treat a docstring as a more verbose version of a title.

A comment can be used that elaborates on the special 'why'.
