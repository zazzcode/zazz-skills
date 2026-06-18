# Standards contextual split

This note explains how the unified standards are split and how the team should maintain that split. It is written for
humans. `index.yaml` is the machine-readable source agents use to decide which standards to load.

## Why split standards

Standards have to be usable during implementation and review. When one file covers too many topics, agents load rules
unrelated to the task, humans scan too much text, and edits to unrelated rules collide in the same document.

The goal is contextual loading: an agent working on HTTP response schemas should load the schema and response rules,
not route permissions or OpenAPI test guidance unless the task also touches those areas. A reviewer should be able to
point to the specific standard for the work under review.

Line-count thresholds are a reviewability signal:

- Under 400 lines is preferred. A file this size usually fits in agent context alongside the code, tests, specs, and
  command output for the task.
- Up to 500 lines is acceptable when the topic is still cohesive and another split would make discovery worse.
- Over 600 lines should block review unless the file is split or an explicit exception is accepted. At that size, the
  file is probably mixing contexts.

Splits should follow work areas, not arbitrary halves. Do not create `part-1` / `part-2` files. Use names that describe
the context: schemas, authorization, migrations, wrapper templates, runtime logging, hooks, and similar.

## Provenance requirement

Splitting a standard must not remove hard references. Each normative standard keeps clickable citations to the PR
comment, precedent file, or established best-practice source that justifies the rule. The citation requirement comes
from the docs-hygiene standard and originated in PR review feedback requiring verifiable source URLs
(review precedent).

This file is a map of the split. The rule text and its citations remain in the individual standards listed below.

## HTTP layer

- `http-layer.md`: route layout, endpoint naming, shared component tiers, lookup endpoints, blueprints, and decorator
  order. Use for endpoint file structure and route registration.
- `http-layer-schemas-and-responses.md`: request schemas, response schemas, dataclass pairing, optional fields, enum
  constraints, domain-typed fields, and response sourcing. Use for request/response shape work.
- `http-layer-errors-and-auth.md`: status codes, error envelopes, exception translation, authentication, authorization,
  permission names, and permission seed-data verification. Use for error handling and auth changes.
- `http-layer-docs-and-tests.md`: OpenAPI response documentation, `/docs` verification, HTTP error-path tests, and
  endpoint iteration patterns. Use for documentation and tests.

## Database

- `database.md`: table/column naming, primary keys, foreign keys, unique constraints, and index rules. Use for database
  object shape and naming.
- `database-sproc-shape.md`: `app_*` procedure signatures, parameter order, `@DbErrorMsg`, and structured result rows.
  Use for procedure shape.
- `database-sproc-errors.md`: parent lookup handling, `@@ROWCOUNT` checks, case-specific `@ErrorMessage`, and
  catch-block error-code mapping. Use for procedure error behavior.
- `database-migrations-and-modernization.md`: versioned/repeatable migration policy, sproc tombstones, modernization
  sequence, and performance tuning workflow. Use for migration and modernization work.
- `database-testing.md`: tSQLt commentary, behavior references, `KNOWNBUG_` tests, expectation naming,
  `tSQLt.DropClass`, and test-file naming. Use for database tests.

## Data layer

- `data-layer.md`: wrapper purpose, directory layout, shared exceptions, the service/data boundary, and
  `SprocArguments`. Use when creating or modifying wrapper arguments.
- `data-layer-exec-sproc.md`: `exec_sproc` signatures, `callproc` tuple order, output parameters, ID coercion, and
  return-code dispatch. Use for the Python-to-SQL call seam.
- `data-layer-results.md`: `SprocReturnCode`, row `TypedDict`s, column validation, and multiple result sets. Use when
  wrappers return rows.
- `data-layer-errors.md`: wrapper-local errors, generic database errors, substring disambiguation, and unexpected
  return codes. Use for exception mapping.
- `data-layer-templates.md`: canonical wrapper templates. Use when starting a wrapper from an approved shape.
- `data-layer-utilities.md`: platform-quirk comments and shared utilities. Use when editing shared helper behavior or
  preserving context during wrapper deletion.

## Service layer

- `service-layer.md`: service/data boundary, composition over raw SQL, service error classes, and sproc exception
  translation. Use for service-layer business logic.
- `service-layer-data-and-exceptions.md`: dataclasses, result shapes, exception text, helper docstrings, and
  replace-semantics naming. Use for service APIs and domain exceptions.
- `service-layer-modules-and-cli.md`: module layout, lookup helpers, guide documentation, and Click scripts over
  service calls. Use for service organization and CLI scripts.

## Reports

- `reports.md`: one-document architecture, the legacy-parity contract (line order, `ROUND_HALF_UP`, byte-equal
  convergence), the registry/style contract, report query timeouts, and PDF test determinism. Use when creating or
  modifying a report's service, document builder, renderer, CLI, or route.
- `report-test-strategy.md`: per-report-aggregate test-time budget, minimal data-coverage-driven input selection, no
  env-var gates, the functional-vs-load/latency separation, and per-layer coverage ownership. Use when choosing which
  cases a report's test battery runs and how many.

## Frontend

- `frontend.md`: hook design, admin CRUD vertical slices, RTK Query mutation placement, cache invalidation, group
  operations, composite IDs, and response-schema tests. Use for data flow and CRUD behavior.
- `frontend-forms-ui.md`: forms, modals, dropdowns, option sets, JavaScript/TypeScript idioms, theme tokens,
  permissions, no transitional scaffolding, Storybook, and frontend tests. Use for UI behavior and frontend hygiene.

## Cross-cutting standards

- `code-structure.md`: file-size thresholds, contextual splitting, module cohesion, incrementally discoverable skills
  and docs, agentic slop patterns, and compute-once guidance. Use when creating or reviewing authored files that may
  grow too large or duplicate structure or runtime work.
- `ci-workflows.md`: workflow triggers, permissions, cache warmers, deploy triggers, and prek action usage. Use for
  normal GitHub Actions checks and deploy workflows.
- `ci-llm-conformance-workflows.md`: LLM workflow secrets, settings-first prompt layout, `display_report`, and
  conformance automation. Use for AI-backed workflow changes.
- `docs-hygiene.md`: voice, Desired/Not-desired examples, MCP/tool references, database-table references,
  cross-document links, cleanup clauses, and banned transient identifiers. Use for standards docs and agent guides.
- `docs-hygiene-reference-structure.md`: standard-doc exclusions, citation formats, section ordering, and worked
  structure. Use when shaping standards documentation.
- `logging-observability.md`: logger setup, initialization order, reserved log-key namespaces, request-context binding,
  and deploy context. Use for structured logging setup.
- `logging-runtime-behavior.md`: request completion logs, cold-start signal, header sanitization, local rendering,
  route business events, and local profiling. Use for emitted runtime behavior.
- `python-testing.md`: test purpose, layout, naming, display/data-shaping tests, integration tests, and `db` marker
  discipline. Use for backend Python test shape.
- `python-testing-http-behavior.md`: HTTP no-leak tests, migration-skip discipline, concrete behavior checks,
  consolidation, and existence rationale. Use for error-path tests and test-value review.
- `tooling-lint-format.md`: mypy, yamlfmt, ruff, banned imports, and import formatting. Use for lint and format
  configuration.
- `tooling-hooks-and-formatters.md`: prek/pre-commit hooks, pinned revisions, mdformat, and taplo. Use for hook and
  formatter wiring.

## Process, security, and operations

- `pr-process.md`: PR title scopes, one logical change per PR, legacy-replacement evidence, no transitional cruft, CVE
  title format, and repo hygiene. Use when opening, titling, or scoping pull requests.
- `security.md`: workflow-scoped secrets, minimum permissions, CVE PR titles, the `lodash` ban, `npm audit`
  documentation, and security verification. Use for CVE remediation and supply-chain work.
- `deployment.md`: vendored WSGI handler, serverless bundle artifact sequence, Flask entrypoint coupling, and the
  Serverless/Terraform scope boundary. Use for lambda packaging and deployment artifact changes.
- `settings.md`: the `Settings` dataclass, cached `get_settings`, lazy env reads, adding settings, and the testing
  contract. Use for configuration values, environment-variable reads, and settings-dependent tests.

## Maintenance rules

When adding a rule, put it in the file whose context an agent would naturally load for the task. If a rule spans
contexts, keep the normative rule in the most specific file and add a short cross-reference only where it prevents
missed discovery.

When a file approaches 400 lines, look for a contextual boundary. Split by task area, artifact type, or review
question. Do not split by page count alone.

After adding, moving, or renaming a standards file, update `index.yaml` with:

- the file name
- the paths or activities that should trigger the file
- a concise purpose that names the decisions the file governs
