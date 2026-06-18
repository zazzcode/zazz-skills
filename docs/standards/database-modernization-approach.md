---
last_review_sha: 7382b3504161a22c3ac86aa95fcd0aa0c16a8ade
---

# Database modernization approach

This stack-specific baseline assumes a product database adapted from a long-lived legacy schema.

The database contains highly valuable business logic, distributed over many stored procedures. Instead of doing common
operations like simple inserts or selects from the legacy application layer, the pattern was to design a custom stored
procedure that would do most of the lifting for the legacy app and hand back results.

None of these stored procedures have tests. There was no systemic approach to formatting or linting either.

## Approach

Modernization is incremental: add test coverage, then reformat and lint objects as they come up for change. When a
bug appears in legacy business logic, first understand it from a domain perspective and build tests that _confirm_ the
existing behavior. Later changes can then fix or refactor the stored procedure with confidence that behavior is not
changing accidentally.

For formatting and linting, this is accomplished by having an ignore file listing all database objects in version
control. As each object comes up for change, remove it from the ignore list, lint it, and test it.
