---
last_review_sha: fa3f78239416aba82dada42ce7a4ac1ad54da7d4
---

# Settings and Import Order

## Overview

The application has five distinct entrypoints. Logging auto-configures on first use via `get_logger()`, but explicit
`configure_logging()` calls in entrypoints are recommended for clarity and to allow custom settings (e.g.,
`environment="test"` in tests).

## Why Import Order Matters

Python executes module-level code at import time. Key design decisions:

1. `settings.py` is lazy — importing it does nothing; `get_settings()` triggers env parsing
1. `get_logger()` auto-configures if needed — module-level `logger = get_logger(__name__)` just works
1. `get_settings()` is cached via `@cache` to ensure single execution

## Entrypoints

### 1. Lambda Web Server

**File:** `src/http_app_entrypoint.py`

```
wsgi_handler.py (vendor)
  └── imports http_app_entrypoint.py
        └── configure_logging()        # logging ready
        └── from http_api.app import create_app
        └── app = create_app()         # settings parsed here
```

The serverless framework loads the app via `http_app_entrypoint.py`. Logging is configured before the Flask app is
imported.

### 2. Local Dev Web Server

**Command:** `flask run` or similar

Uses the same `http_app_entrypoint.py` via `FLASK_APP` environment variable:

```bash
FLASK_APP=http_app_entrypoint:app flask run
```

Same initialization order as Lambda.

### 3. CLI Script Invocation

**Location:** `scripts/*.py`

Standalone scripts should configure logging explicitly at the top:

```python
#!/usr/bin/env -S uv run
from logging_config import configure_logging

configure_logging()

# Now import app modules
from logging_config import get_logger
from svc.account import create_account

logger = get_logger(__name__)
```

### 4. Module Scripts

**Location:** Modules with `if __name__ == "__main__"` blocks (e.g., `src/svc/tickets/list_tickets.py`)

These work automatically — `get_logger()` auto-configures if needed. No special setup required.

### 5. Test Suite

**File:** `tests/conftest.py`

```python
# First lines of conftest.py
from logging_config import configure_logging, get_logger
configure_logging(environment="test")

# Now safe to import app modules
from settings import Settings
```

Tests pass `environment="test"` explicitly because:

- Test settings are constructed manually (not from env vars)
- The `test_settings` fixture isn't available at import time
- Test runs should use console output

## Settings Module Design

`settings.py` follows these principles:

1. **Lazy evaluation** — No code runs at import time
1. **Single source of truth** — All config comes from `get_settings()`
1. **Cached** — `@cache` ensures env vars are parsed once
1. **Testable** — Tests construct `Settings` directly without env vars

```python
# Importing does nothing
from settings import Settings, get_settings

# This triggers env parsing (once, cached)
settings = get_settings()
```

## Auto-Configuration Behavior

`get_logger()` automatically calls `configure_logging()` if logging hasn't been configured yet:

```python
from logging_config import get_logger

logger = get_logger(__name__)  # Auto-configures, then returns logger
```

This allows module scripts to work without explicit setup. A debug-level log message is emitted when auto-configuration
occurs, useful for debugging initialization order issues.

Explicit `configure_logging()` calls in entrypoints are still recommended — they document intent and allow passing
`environment="test"` in tests. If already configured, subsequent calls are no-ops.

## Adding New Configuration

When adding new settings:

1. Add the field to the `Settings` dataclass
1. Parse the env var inside `get_settings()`
1. No module-level code — all parsing happens in the function
