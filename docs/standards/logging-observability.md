---
last_updated_at: 2026-05-25
---

# Logging and observability

Application logs are structured (key/value), bound to a per-request context, and emitted through a single `structlog`
pipeline shared with stdlib third-party loggers. Every HTTP request produces exactly one access-style log line —
`"request completed"` — that carries the full bound context: deploy info, request info, AWS Lambda info, and response
info. Route handlers do not emit their own access logs; their job is business events and errors. Context binding
happens in `@before_request` so that any error log raised before the response is built still carries `request.*`,
`account.*`, `aws.lambda.*`, and `deploy.*` keys.

## Overview

Logging is configured once per process by `configure_logging()` in `backend/src/logging_config.py`
(logging_config.py). It is
environment-aware: `environment == "local"` renders a colored console view; every other environment renders JSON with
structured tracebacks. The `structlog` pipeline is bridged into stdlib via `ProcessorFormatter` so Flask, werkzeug, and
other third-party logs share the same processors and key set
(logging_config.py#L61-L67).

Application code never instantiates loggers directly. It calls `get_logger(__name__)`, which auto-configures logging on
first use and returns a `structlog.stdlib.BoundLogger`
(logging_config.py#L75-L83;
backend-entrypoint-initialization-guide.md §Auto-Configuration Behavior).

```text
process startup
  └── configure_logging(environment=...)        # explicit in entrypoints + tests
       └── structlog.configure(...)             # JSON for deployed envs, console for local
       └── stdlib root logger handler set       # third-party logs share the pipeline

per HTTP request
  └── @before_request _before_request()
       ├── structlog.contextvars.clear_contextvars()        # drop stale binds
       ├── bind deploy.*                                    # git_sha, environment, timestamp
       ├── bind request.*                                   # via build_log_ctx_from_request
       ├── bind aws.lambda.*  (if serverless.context)       # request_id, cold_start
       └── g.request_start_time = time.perf_counter()
  └── (route handler runs; any logger.* call carries the bound context)
  └── @after_request _after_request(response)
       ├── compute response_duration_ms
       ├── bind response.*  (status_code, content_length, duration_ms)
       └── if environment != "local":
              logger.info(HTTP_REQUEST_COMPLETED_LOG_MESSAGE)   # the one access log
```

## Logger acquisition

Acquire loggers at module scope with `get_logger(__name__)`. Do not call `structlog.get_logger` or `logging.getLogger`
directly in application code — `get_logger` is the single supported entry point and it auto-configures on first use
(logging_config.py#L75;
backend-entrypoint-initialization-guide.md §Auto-Configuration Behavior).

### Desired ✅

```python
from logging_config import get_logger

logger = get_logger(__name__)
```

Source: app.py#L40-L42

The one place in the codebase that uses stdlib `logging.getLogger` is `logging_config.py` itself, and it carries a
`# noqa: TID251` comment explaining why: the main logger is not yet configured when that fallback path runs
(logging_config.py#L78-L80).

## Initialization order at entrypoints

`settings.py` is lazy — importing it does nothing; `get_settings()` triggers env parsing and is cached via `@cache`
(backend-entrypoint-initialization-guide.md §Settings Module Design;
settings.py#L37). This separation exists so
that `configure_logging()` can run before settings parsing, so any error raised by env parsing is itself logged through
the configured pipeline.

Each entrypoint configures logging explicitly before importing the Flask app or other application modules:

| Entrypoint                                   | File                         | Logging call                                                               |
| -------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------- |
| Lambda / `flask run`                         | `src/http_app_entrypoint.py` | `configure_logging()` before `from http_api.app import create_app`         |
| CLI scripts                                  | `scripts/*.py`               | `configure_logging()` at the top, before app imports                       |
| Module scripts (`if __name__ == "__main__"`) | inside `src/svc/...`         | No explicit call required — `get_logger()` auto-configures                 |
| Test suite                                   | `tests/conftest.py`          | `configure_logging(environment="test")` at the top, before any app imports |

(Source:
backend-entrypoint-initialization-guide.md §Entrypoints.)

Module scripts that need a logger acquire it with `get_logger(__name__)` at module scope, just as any other module
does. Because `get_logger` auto-configures on first use, no separate `configure_logging()` call is needed in the
`if __name__ == "__main__"` block
(backend-entrypoint-initialization-guide.md §Module Scripts).

### Desired ✅

```python
# src/svc/tickets/list_tickets.py (or any module with an __main__ block)
from logging_config import get_logger

logger = get_logger(__name__)  # auto-configures logging; no configure_logging() call needed

if __name__ == "__main__":
    # logger is already available; proceed directly with argument parsing and business logic
    ...
```

Source:
svc/tickets/list_tickets.py

Tests pass `environment="test"` explicitly because `Settings` is constructed manually in tests rather than from env
vars, and the `test_settings` fixture is not available at import time
(backend-entrypoint-initialization-guide.md §Test Suite).

### Desired ✅

```python
# tests/conftest.py — first lines of the file
from logging_config import configure_logging, get_logger

configure_logging(environment="test")

# Now safe to import app modules
from settings import Settings
```

Source:
backend-entrypoint-initialization-guide.md §Test Suite

```python
# scripts/some_script.py
#!/usr/bin/env -S uv run
from logging_config import configure_logging

configure_logging()

# Now import app modules
from logging_config import get_logger
from svc.account import create_account

logger = get_logger(__name__)
```

Source:
backend-entrypoint-initialization-guide.md §CLI Script Invocation

## Log-key naming and reserved namespaces

Structured log keys are dotted, namespaced, and built through the `to_log_key(*segments)` helper rather than spelled
out as raw strings. This keeps the namespace machine-enforceable and prevents accidental collisions like
`request_method` vs `request.method`
(util.py#L38-L40).

Reserved top-level namespaces — emitted by the request-lifecycle middleware on every request, and not safe to overload
from business code:

| Namespace         | Bound by                                          | Examples                                                                                                                              |
| ----------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `deploy.*`        | `build_deploy_info_log_ctx`                       | `deploy.git_sha`, `deploy.environment`, `deploy.timestamp`                                                                            |
| `http.request.*`  | `build_log_ctx_from_request`                      | `http.request.method`, `http.request.path`, `http.request.body_size`, `http.request.header.<name>`, `http.request.query_param.<name>` |
| `http.response.*` | `build_log_ctx_from_response`                     | `http.response.status_code`, `http.response.content_length`, `http.response.duration_ms`                                              |
| `aws.lambda.*`    | `build_log_ctx_from_aws_lambda_context`           | `aws.lambda.request_id`, `aws.lambda.cold_start`                                                                                      |
| `account.*`       | authentication code, once identity is established | `account.external_id`, `account.username`                                                                                             |

(Sources: util.py#L38;
http_api/util.py#L121-L154;
http_api/util.py#L157-L173;
http_api/util.py#L188-L197;
review precedent.)

When adding new structured log keys from business code, pick a new namespace prefix that does not collide with the
reserved set, and build the key through `to_log_key` so the dot-delimiter convention is enforced by one helper.

### Desired ✅

```python
from util import to_log_key

structlog.contextvars.bind_contextvars(
    **{
        to_log_key("ticket", "id"): ticket_id,
        to_log_key("ticket", "audit_number"): audit_number,
    }
)
```

```python
# build_log_ctx_from_request (excerpt)
log_request_key_prefix = ("http", "request")
ctx_to_return[to_log_key(*log_request_key_prefix, "method")] = request.method
ctx_to_return[to_log_key(*log_request_key_prefix, "path")] = request.path
```

Source: http_api/util.py#L131-L141

## Context binding lives in `@before_request`, not `@after_request`

The Flask `_before_request` handler binds `deploy.*`, `http.request.*`, and (when a Lambda context is present)
`aws.lambda.*` on every request, before any route handler runs. Response context is bound in `_after_request`. The
split is deliberate: `@after_request` does not fire on error paths, so any log emitted between request entry and the
error must already carry `request.*` and `deploy.*` for the log to be useful
(review precedent; app.py#L155-L196).

Binding order inside `_before_request`:

1. `structlog.contextvars.clear_contextvars()` — drops stale context from prior Lambda invocations or dev-server
   requests on the same process
   (app.py#L158).
1. Bind deploy context via `build_deploy_info_log_ctx(...)`.
1. Bind request context via `build_log_ctx_from_request(request)`.
1. If `request.environ["serverless.context"]` is present, wrap it in `AWSLambdaLogContext` and bind via
   `build_log_ctx_from_aws_lambda_context(...)`. Read fields from the third-party Lambda context with defensive
   `getattr(..., "<attr>", "")` since the shape is not owned by this codebase
   (app.py#L184-L192).
1. Set `flask.g.request_start_time = time.perf_counter()` for the duration measurement in `_after_request`.

Account context is bound separately by authentication code once the account identity has been established (see
`account.external_id` / `account.username` references across `backend/src/http_api/v1/`) — `_before_request` itself
does not have an account yet .

Use `structlog.contextvars.bind_contextvars(...)`, never `logger.bind(...)`. The contextvars binding survives across
function boundaries within the same request, which is what makes the bound keys reach the end-of-request access log
(review precedent; app.py#L168).

### Desired ✅

```python
@app.before_request
def _before_request() -> None:
    """Perform any setup that needs to happen before each request."""
    structlog.contextvars.clear_contextvars()

    structlog.contextvars.bind_contextvars(
        **build_deploy_info_log_ctx(
            git_sha=settings.git_sha,
            environment=settings.environment,
            deployed_timestamp=settings.deployed_timestamp,
        )
    )
    structlog.contextvars.bind_contextvars(**build_log_ctx_from_request(request))

    global _AWS_LAMBDA_COLD_START
    aws_lambda_context = request.environ.get("serverless.context")
    if aws_lambda_context is not None:
        _ctx_pre_bind = AWSLambdaLogContext(
            request_id=str(getattr(aws_lambda_context, "aws_request_id", "")),
            cold_start=_AWS_LAMBDA_COLD_START,
        )
        structlog.contextvars.bind_contextvars(**build_log_ctx_from_aws_lambda_context(_ctx_pre_bind))
    _AWS_LAMBDA_COLD_START = False

    g.request_start_time = time.perf_counter()
```

Source: app.py#L155-L196

### Not desired ❌

```python
@app.after_request
def _after_request(response):
    # wrong: any error log that fires before this handler will lack request/account context
    structlog.contextvars.bind_contextvars(**build_log_ctx_from_request(request))
    return response
```

Source: pre-fix anti-pattern where response context was bound too late for error logs emitted before the
`@after_request` handler.

## Deploy context is bound on every request

Every emitted structured log must carry the `deploy.*` keys: `deploy.git_sha`, `deploy.environment`,
`deploy.timestamp`. The values come from `Settings` (`git_sha`, `environment`, `deployed_timestamp`), parsed once per
process by `get_settings()`. Binding happens once per request inside `_before_request`, alongside the request and
Lambda context binds (review precedent; app.py#L168-L174;
util.py#L43-L49).

Re-binding per-request is intentional even though the values do not change between requests: it colocates
context-binding logic in one handler and makes it impossible for a log to slip through without the deploy keys
attached.

### Desired ✅

```python
# backend/src/util.py
def build_deploy_info_log_ctx(*, git_sha: str, environment: str, deployed_timestamp: str) -> LogContext:
    """Build a structured log context from deploy information."""
    return {
        to_log_key("deploy", "git_sha"): git_sha,
        to_log_key("deploy", "environment"): environment,
        to_log_key("deploy", "timestamp"): deployed_timestamp,
    }
```

Source: util.py#L43-L49

```python
# Settings fields backing the deploy context
@dataclass
class Settings:
    environment: str
    git_sha: str
    deployed_timestamp: str
    # ...
```

Source: settings.py#L17-L21

The `git_sha` and `deployed_timestamp` source values are derived from CI: when `environment == "local"` they are filled
in with `"local"` and the current UTC timestamp; otherwise they come from `GITHUB_SHA` and `DEPLOYED_TIMESTAMP` env
vars (settings.py#L48-L57).

## Related standards

- HTTP layer guide — routing,
  decorators, error mapping.
- Backend entrypoint initialization guide
  — full settings and import-order context that the logging configuration relies on.
