# Deterministic Quality Gates

AI agents are probabilistic. Linters, formatters, type checkers, accessibility checks, schema validators, doc linters,
and test runners are deterministic enough to make review safer and cheaper. Zazz treats these tools as part of the
methodology, not as optional polish.

The principle is simple: automate every quality rule that can be expressed reliably in tooling, then use agents and
humans for judgment, architecture, product intent, tradeoffs, and ambiguous failures.

## Why This Matters

Deterministic quality gates improve agent-assisted delivery because they:

- turn style and mechanical code-quality expectations into repeatable checks
- reduce reviewer time spent on nits and convention drift
- give agents fast feedback while they work
- make PR evidence easier to trust
- keep documentation and standards readable as the methodology evolves
- catch classes of accessibility, type-safety, formatting, security, and documentation issues before human review

They do not replace tests, QA, or human review. They reduce the surface area that subjective review has to cover.

## Baseline Expectations

Every adopting repo should define deterministic checks for the stack it actually uses. At minimum, document:

- **Formatter**: code and document formatting commands, config files, and when auto-fix is allowed.
- **Linter/static analysis**: source-code linting, rule ownership, suppressions, and fail conditions.
- **Type/schema checks**: TypeScript, mypy, OpenAPI, JSON Schema, SQL linting, or equivalent stack checks.
- **Tests**: unit, integration, API, browser, database, and smoke-test commands.
- **Accessibility checks**: automated checks for frontend work, plus the manual checks that automation cannot prove.
- **Documentation checks**: markdown formatting, link checks, table-of-contents generation, YAML/TOML validation, and
  sensitive-reference scans.
- **CI gates**: which checks block merge and which are advisory.

The repo's `AGENTS.md`, standards index, and deliverable specifications should point agents at these commands. A
standard that cannot name its verification command should explain why the requirement is manual.

## Stack-Specific Examples

These examples are baselines, not universal requirements:

- JavaScript/TypeScript repos can use ESLint for configurable rules that identify code problems and enforce
  expectations, including rules from plugins for TypeScript, React, accessibility, or framework-specific practices
  ([ESLint Core Concepts](https://eslint.org/docs/latest/use/core-concepts/)).
- TypeScript repos should consider type-aware linting for rules that need TypeScript's type checker. The extra runtime
  cost is a tradeoff, but it catches issues syntax-only linting cannot see
  ([typescript-eslint typed linting](https://typescript-eslint.io/getting-started/typed-linting/)).
- JavaScript/TypeScript repos commonly separate formatting from code-quality linting: Prettier owns formatting; linters
  own code-quality rules. This avoids rule conflicts and keeps formatting debates out of review
  ([Prettier: Why Prettier?](https://prettier.io/docs/why-prettier),
  [Prettier: Integrating with Linters](https://prettier.io/docs/integrating-with-linters)).
- Frontend repos should automate accessibility checks where possible, but still require human evaluation for issues
  tools cannot determine. W3C WAI notes that tools help evaluate accessibility, but no tool alone can determine whether
  a site meets accessibility standards
  ([W3C WAI Evaluating Web Accessibility](https://www.w3.org/WAI/test-evaluate/)).
- Browser or component test suites can integrate accessibility engines such as axe-core so accessibility checks run
  inside unit, integration, or browser tests rather than only at the end of a release
  ([axe-core](https://github.com/dequelabs/axe-core)).
- Documentation-heavy repos should lint and format Markdown and structured docs so standards stay readable and easy
  for agents to parse. Markdown rule sets such as markdownlint provide a concrete starting point
  ([markdownlint rules](https://github.com/markdownlint/markdownlint/blob/main/docs/RULES.md)).

Adopting teams should replace these examples with their actual stack: Ruff or mypy for Python, gofmt and staticcheck
for Go, cargo fmt and Clippy for Rust, ktlint for Kotlin, dotnet format and analyzers for .NET, SQLFluff for SQL, or
whatever equivalent tools the repo can run reliably.

## Agent Workflow

Agents should use deterministic gates throughout implementation:

1. Read repo instructions and standards before editing.
2. Identify the narrowest relevant checks for the files being changed.
3. Run fast local checks early when they can prevent wasted work.
4. Run the required verification set before packaging a PR.
5. Include command results in PR or QA evidence.
6. If a deterministic gate fails repeatedly or conflicts with a standard, stop and ask for direction rather than
   bypassing the tool.

Agents may apply auto-formatters and safe lint fixes when the repo standard allows it. They must not silence lint
rules, loosen type checks, skip accessibility checks, or weaken CI gates just to make a PR pass.

## Standards And Specifications

Standards should distinguish between:

- rules enforced by tooling
- rules verified by tests
- rules requiring human review
- rules requiring owner or subject-matter signoff

Specifications should name the checks that apply to the deliverable. For example:

```markdown
Verification:

- `npm run lint` — TypeScript, React, and accessibility lint rules
- `npm run typecheck` — TypeScript compile-time contract
- `npm run test:api` — API behavior and mocking tests
- `npm run test:a11y` — automated accessibility checks
- `npm run lint:docs` — markdown and YAML formatting
```

When a repo does not yet have deterministic tooling for an important quality bar, the standard should record that as a
gap and define the manual evidence expected until the tooling exists.

## Halt Conditions

Stop and ask for human direction when:

- no repo-standard command exists for a quality requirement that should be deterministic
- a linter/type checker/accessibility rule conflicts with existing code or product behavior
- a proposed suppression is broad, permanent, or not explained inline
- automated accessibility checks pass but the UI still has likely keyboard, focus, contrast, or screen-reader risks
- a formatter would rewrite unrelated files or obscure a focused diff
- CI and local results disagree and the cause is not understood

## Related Sections

- [Code Generation](./code-generation.md)
- [Testing and Validation](./testing-and-validation.md)
- [Self-Review](./self-review.md)
- [Standards Baseline](../standards/README.md)
