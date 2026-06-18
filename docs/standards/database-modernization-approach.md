---
last_review_sha: 7382b3504161a22c3ac86aa95fcd0aa0c16a8ade
---

# Database modernization approach

Our database is an adaptation from a legacy database that accumulated cruft over twenty years.

This database contains highly valuable business logic, distributed over many stored procedures. Instead of doing common
operations like simple inserts or selects from the legacy application layer, the pattern was to design a custom stored
procedure that would do most of the lifting for the legacy app and hand back results.

None of these stored procedures have tests. There was no systemic approach to formatting or linting either.

## Approach today

The approach we are taking today is to slowly add test coverage, as well as reformatting/linting as we go. During this
process we have encountered many bugs in the business logic. The approach is to first understand the bugs from a domain
perspective, build tests around them _confirming_ the bugs, then later tweak those stored procedures with the
confidence that we aren't changing behavior without realizing it.

For formatting and linting, this is accomplished by having an ignore file listing all database objects in version
control. As we get to them, we remove a database object and lint and test it.
