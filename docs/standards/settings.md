---
last_updated_at: 2026-05-25
---

# Settings

This standard governs `backend/src/settings.py` — the module that parses environment variables into a typed contract
and exposes them to the rest of the application. It covers the shape of the `Settings` dataclass, the caching contract
of `get_settings()`, the rule that environment variables are read in exactly one place, and the testing pattern that
keeps settings injectable without environment coupling. Code that reads configuration must go through `get_settings()`;
code outside `settings.py` that reads `os.environ` directly violates this contract
(settings.py).

## The `Settings` dataclass

`Settings` is a plain `@dataclass` (not frozen) whose fields carry every piece of runtime configuration the application
needs. Each field is named in lowercase `snake_case` and annotated with a Python type — including optional fields,
which use `str | None`, `bool`, or `Path` with a `field(default_factory=...)` or a literal default where appropriate
(settings.py#L16-L34).

Fields that warrant inline explanation carry a comment directly above the field declaration, not in a separate
docstring block. The `hidden_account_usernames` field is the live example — it explains the comma-delimited env-var
format and the business reason for the exclusion in two sentences above the field
(settings.py#L29-L32).

The module-level `__all__` export is `["Settings", "get_settings"]` — these are the only two names that the rest of the
application needs to import from `settings.py`
(settings.py#L13-L14).

### Desired ✅

```python
from dataclasses import dataclass, field
from datetime import timedelta
from pathlib import Path

from types_ import MSSQLConnectionArgs


@dataclass
class Settings:
    environment: str
    git_sha: str
    deployed_timestamp: str
    jwt_secret_key: str
    jwt_access_token_expiration: timedelta
    hash_algorithms: list[str]
    db_conn_args: MSSQLConnectionArgs
    frontend_allowed_origins: list[str]
    # Some accounts, set via comma-delimited list ('name1,name2,name3'), are
    # flagged as special and should not be returned in API responses
    # or interacted with through the HTTP layer.
    hidden_account_usernames: list[str] = field(default_factory=list)
    bugsnag_api_key: str | None = None
    bugsnag_testing_endpoints_enabled: bool = False
    profiling_enabled: bool = False
    profiling_output_dir: Path = Path("scratch/profiles")
```

Source: settings.py#L16-L34

## `get_settings()` is the single entry point

All environment variable reads are centralized inside `get_settings()`. Application code imports the function and calls
it; it does not import `os` or `environs` directly to read configuration. The function is decorated with `@cache` from
`functools`, which memoizes the return value after the first call so that env vars are parsed exactly once per process
(settings.py#L37-L40).

`get_settings()` uses `environs.Env()` as its primary parsing vehicle. The `Env` instance reads `.env` files with
`env.read_env(verbose=True)` and provides typed accessors (`env.str`, `env.bool`, `env.list`, `env.timedelta`,
`env.path`) that raise `EnvError` on missing or malformed values. For two CI-supplied variables (`GITHUB_SHA`,
`DEPLOYED_TIMESTAMP`) that are only set outside `local` environments, the function falls back to bare `os.environ[...]`
— but both accesses are still inside `get_settings()`, not at module scope
(settings.py#L44-L79).

Importing `settings.py` has no side effects. No `Env()` is constructed, no `.env` file is read, and no `os.environ` key
is accessed until the first call to `get_settings()`. This separation allows `configure_logging()` to run before
settings are parsed so that any error thrown during env-var parsing is itself logged through the configured pipeline
(backend-entrypoint-initialization-guide.md §Settings Module Design).

### Desired ✅

```python
import os
from functools import cache

from environs import Env

from types_ import MSSQLConnectionArgs
from util import mssql_conn_string_parser


@cache
def get_settings() -> Settings:
    """Parse environment variables and return application settings.

    All env var parsing happens here, not at import time. This allows logging
    to be configured before settings are parsed. Results are cached.
    """
    env = Env()
    env.read_env(verbose=True)

    environment = env.str("ENVIRONMENT")

    if environment == "local":
        git_sha = "local"
        deployed_timestamp = datetime.now(UTC).isoformat()
    else:
        git_sha = os.environ["GITHUB_SHA"]
        deployed_timestamp = os.environ["DEPLOYED_TIMESTAMP"]

    return Settings(
        environment=environment,
        git_sha=git_sha,
        # ... remaining fields parsed via env.*
    )
```

Source: settings.py#L37-L79

## Adding a new setting

Adding a new configuration value is a three-step operation:

1. **Add the field to `Settings`.** Give it the most specific Python type that fits the value — `str`, `bool`, `Path`,
   `list[str]`, `timedelta`, or a domain type from `types_.py`. Fields with safe defaults use a keyword argument with
   the default value; fields that are always required are positional (no default). If the field requires explanation,
   add an inline comment directly above the declaration.

1. **Parse the env var inside `get_settings()`.** Use the `env.*` accessor that matches the field's type (`env.str`,
   `env.bool`, `env.list`, `env.timedelta`, `env.path`, `env.int`). Pass `default=...` for optional values. When a
   value requires non-trivial transformation (like the MSSQL connection string), register a custom parser with
   `env.parser_for(...)` before calling the accessor.

1. **Never write env-var parsing code outside `get_settings()`.** Module-level `os.environ` reads, top-of-file `Env()`
   constructions, and any other code that reads environment state at import time are prohibited in every file including
   `settings.py` itself. All configuration flows through the one cached function.

(settings.py#L37-L79;
backend-entrypoint-initialization-guide.md §Adding New Configuration)

## Lazy evaluation

The constraint that importing `settings.py` has no side effects is structural, not stylistic. Python executes
module-level code at import time. If `get_settings()` were called at module scope, or if an `Env()` object were
constructed there, every module that imports from `settings.py` would trigger env-var reads during its own import —
making it impossible to import the module before the environment is configured. The `@cache` decorator on
`get_settings()` and the total absence of module-level logic in `settings.py` are what make the safe import-order
sequence in `http_app_entrypoint.py` and `tests/conftest.py` possible
(settings.py#L1-L14;
backend-entrypoint-initialization-guide.md §Why Import Order Matters).

The consequence is that `Settings` objects are never obtained by importing module-level variables. Application code
calls `get_settings()` at the point of use and accesses named fields on the returned object:

```python
from settings import get_settings

settings = get_settings()
db_conn_args = settings.db_conn_args
```

A call to `get_settings()` from any module is cheap after the first: `@cache` returns the already-constructed
`Settings` object without re-reading any environment state.

## Testing contract

The test suite avoids calling `get_settings()` entirely. Instead, `tests/conftest.py` constructs a `Settings` object
directly with test values and exposes it as the `test_settings` session-scoped fixture. Any test or fixture that needs
settings receives `test_settings` as a parameter rather than calling `get_settings()`
(tests/conftest.py#L30-L44).

```python
@pytest.fixture(scope="session")
def test_settings(mssql_test_connection_args: MSSQLConnectionArgs) -> Settings:
    return Settings(
        environment="test",
        git_sha="test",
        deployed_timestamp="test",
        jwt_secret_key="test",
        jwt_access_token_expiration=datetime.timedelta(hours=1),
        hash_algorithms=["argon2"],
        db_conn_args=mssql_test_connection_args,
        frontend_allowed_origins=[],
    )
```

Source: tests/conftest.py#L30-L44

`conftest.py` also calls `configure_logging(environment="test")` as the first two lines of the file, before any
application modules are imported. The `environment="test"` argument is explicit because the test environment is not
reflected in real env vars — the test settings object is built by hand — and because the call ensures console output is
available during test runs rather than the silent JSON renderer used in deployed environments
(tests/conftest.py#L1-L4;
backend-entrypoint-initialization-guide.md §Test Suite).

### Desired ✅

```python
# tests/conftest.py — first lines of the file
from logging_config import configure_logging, get_logger

configure_logging(environment="test")

# Now safe to import app modules
from settings import Settings
```

Source: tests/conftest.py#L1-L7

Because `Settings` is a plain dataclass with no required env-var binding, constructing it directly in tests keeps them
fast, deterministic, and side-effect-free. Tests never depend on a `.env` file being present.

## Related standards

- Logging and observability —
  entrypoint initialization order and how `configure_logging()` interacts with the settings module.
- Backend entrypoint initialization guide
  — the full import-order context across all five entrypoints.
