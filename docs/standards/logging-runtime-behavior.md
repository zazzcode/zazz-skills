---
last_updated_at: 2026-05-25
---

# Logging runtime behavior

This standard governs request completion logging, cold-start signal, header sanitization, local rendering, route
business logs, and local profiling.

## The "request completed" log line

`_after_request` emits exactly one `logger.info(HTTP_REQUEST_COMPLETED_LOG_MESSAGE)` per request, where
`HTTP_REQUEST_COMPLETED_LOG_MESSAGE` is a module-level `Final[str]` constant defined at the top of `app.py`. This is the project's
application-level access log; it carries the full bound context (deploy, request, Lambda, response) and is queryable by
stable message string.

The constant carries an inline comment marking it as stable:

```python
# This is a stable log message. Do not change it without searching for
# documentation that cites it and updating that at the same time.
HTTP_REQUEST_COMPLETED_LOG_MESSAGE: Final[str] = "request completed"
```

The emission is gated on `settings.environment != "local"`. The Flask local dev server emits its own access log, and
double-logging the same request in local would be redundant.

Response context is bound just before the emission, wrapped in a `try/except` that warning-logs on failure and does not
crash the response. Duration is computed
as `round((time.perf_counter() - g.request_start_time) * 1000)` and bound as `http.response.duration_ms`; the
`getattr(g, "request_start_time", None)` guard handles the case where `_before_request` did not run
(app.py#L210-L212).

Route handlers do not emit access-log lines of their own. The single end-of-request emission is the project's access
log; route-level logger calls are reserved for business events or errors.

### Desired ✅

```python
# Module-level constant
HTTP_REQUEST_COMPLETED_LOG_MESSAGE: Final[str] = "request completed"
# This is a stable log message. Do not change it without searching for
# documentation that cites it and updating that at the same time.

@app.after_request
def _after_request(response: Response) -> Response:
    """Perform any teardown that needs to happen after each request."""

    # Extremely defensive: an error raised here could crash an otherwise
    # successful response.
    try:
        response_duration_ms: int | None = None
        if getattr(g, "request_start_time", None) is not None:
            response_duration_ms = round((time.perf_counter() - g.request_start_time) * 1000)

        structlog.contextvars.bind_contextvars(
            **build_log_ctx_from_response(response=response, response_duration_ms=response_duration_ms)
        )
    except Exception:
        logger.warning("Error building response log context", exc_info=True)

    if settings.environment != "local":
        logger.info(HTTP_REQUEST_COMPLETED_LOG_MESSAGE)

    return response
```

Source: app.py#L200-L226

### Not desired ❌

```python
# wrong: per-route access logs duplicate the end-of-request emission
@bp.route("", methods=["GET"])
def list_links_view():
    logger.info("GET /v1/link served")
    return ...
```

Source: anti-pattern from route-level access logs duplicating the single end-of-request emission.

## Lambda cold-start signal

`_AWS_LAMBDA_COLD_START` is a module-level boolean used as a one-shot signal for whether the current Lambda execution
environment is cold-starting. The variable is initialized to `True` at module load, read by `_before_request` to
populate `aws.lambda.cold_start`, and then set to `False`. The next request on the same execution environment will see
it as `False` (app.py#L43-L53;
app.py#L180-L193).

The only location that mutates this variable is `_before_request`. The module comment is explicit:

> To be clear: _the only_ location that mutates this variable is the `@before_request` handler. If that changes this
> list MUST be updated.

If a future change adds another mutator, update the comment at the variable's declaration too — the comment is the
single source of truth for the invariant
(app.py#L43-L53).

### Desired ✅

```python
# Module-level flag at top of app.py
_AWS_LAMBDA_COLD_START: bool = True

@app.before_request
def _before_request() -> None:
    # ...
    global _AWS_LAMBDA_COLD_START
    aws_lambda_context = request.environ.get("serverless.context")
    if aws_lambda_context is not None:
        _ctx_pre_bind = AWSLambdaLogContext(
            request_id=str(getattr(aws_lambda_context, "aws_request_id", "")),
            cold_start=_AWS_LAMBDA_COLD_START,
        )
        structlog.contextvars.bind_contextvars(**build_log_ctx_from_aws_lambda_context(_ctx_pre_bind))
    _AWS_LAMBDA_COLD_START = False
```

Source: app.py#L43-L193

## Sensitive headers are sanitized

`build_log_ctx_from_request` replaces the values of headers in `SANITIZED_HEADERS_LOWERCASE` with `"*******"` before
binding them to the log context. The default set is `frozenset({"authorization", "cookie"})`. The `sanitized_headers`
parameter **replaces** the default rather than augmenting it — passing `sanitized_headers={"x-api-key"}` would mean
`Authorization` and `Cookie` are no longer sanitized
(http_api/util.py#L117-L143).

When extending the sanitized set from a caller, pass a superset that includes the defaults:

### Desired ✅

```python
custom_sanitized = SANITIZED_HEADERS_LOWERCASE | {"x-api-key"}
log_ctx = build_log_ctx_from_request(request, sanitized_headers=custom_sanitized)
```

Source: pattern derived from
http_api/util.py#L113-L143

## Local vs deployed rendering

`configure_logging()` picks the final rendering processors based on `environment`. Local renders through
`structlog.dev.ConsoleRenderer(colors=True)`; every other environment renders through
`structlog.processors.JSONRenderer()` after `format_exc_info` and `dict_tracebacks` so that exception traces remain
structured (logging_config.py#L31-L48).

Shared processors run for both modes: `merge_contextvars` (this is what surfaces the `bind_contextvars` keys onto each
log line), `add_log_level`, `add_logger_name`, `TimeStamper(fmt="iso", utc=True)`, `StackInfoRenderer`,
`UnicodeDecoder`
(logging_config.py#L23-L29).

Stdlib third-party logs are routed through `ProcessorFormatter` with `foreign_pre_chain=shared_processors`, so a
`werkzeug` or `flask` log line gets the same shape (and the same `deploy.*` / `request.*` keys) as an application log
line (logging_config.py#L61-L67).

### Desired ✅

```python
# logging_config.py — final rendering selection
if is_local:
    final_processors = [
        structlog.stdlib.ProcessorFormatter.remove_processors_meta,
        structlog.dev.ConsoleRenderer(colors=True),
    ]
else:
    final_processors = [
        structlog.stdlib.ProcessorFormatter.remove_processors_meta,
        structlog.processors.format_exc_info,
        structlog.processors.dict_tracebacks,
        structlog.processors.JSONRenderer(),
    ]
```

Source: logging_config.py#L33-L48

## Route handlers log business events, not access lines

The end-of-request `"request completed"` emission is the access log. Route handlers and service-layer code use the
logger for:

- business events worth a permanent record (`"ticket validated"`, `"link created"`,
  `"shared mapping group edit had partial failures"`)
- errors and exceptions, ideally with `exc_info=True`

They do not log "entered handler" / "served GET /v1/link" lines, and they do not log on every successful path that
already has a 200 response — that information is already in the access log.

When a business log is emitted, the bound contextvars supply the request/account/deploy context automatically; the log
call itself should add only the event-specific keys.

### Desired ✅

```python
# inside a route handler
logger.info(
    "ticket validation rejected",
    **{
        to_log_key("ticket", "id"): ticket_id,
        to_log_key("ticket", "rejection_reason"): reason,
    },
)
```

(No need to re-bind `request.*` or `account.*` — they are already on the line.)

## Flask request profiling (local dev only)

Two settings control per-request cProfile output from the running Flask application. Both are off by default and must
never be enabled in deployed environments — the cProfile files accumulate on disk and the overhead is not acceptable in
production or staging (settings.py#L32-L33;
app.py#L151-L153).

| Env var                | Default              | Purpose                                                  |
| ---------------------- | -------------------- | -------------------------------------------------------- |
| `PROFILING_ENABLED`    | `False`              | Truthy value enables the profiler middleware             |
| `PROFILING_OUTPUT_DIR` | `./scratch/profiles` | Directory where one cProfile file is written per request |

When `PROFILING_ENABLED` is truthy, `create_app()` wraps `app.wsgi_app` with Werkzeug's `ProfilerMiddleware`, which
writes one cProfile-format file per request to `PROFILING_OUTPUT_DIR`. The directory must already exist
(app.py#L151-L153;
[Werkzeug ProfilerMiddleware docs](https://werkzeug.palletsprojects.com/en/stable/middleware/profiler/)).

### Desired ✅

```shell
# Run the dev server with profiling enabled; inspect files in scratch/profiles/
PROFILING_ENABLED=True just be-web
```

Source:
backend-profiling-guide.md
