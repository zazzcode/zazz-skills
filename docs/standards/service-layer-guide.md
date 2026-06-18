---
last_review_sha: da4238c71202dbed9185bbcf9e8c829270e43215
---

> **Superseded by [`service-layer.md`](service-layer.md).** The unified standard is the authoritative source for
> current rules. This guide previously permitted direct `cursor.execute(...)` calls in service functions ("a service
> may make a direct database query"); the unified standard now prohibits raw SQL in services and requires composition
> through the data layer. Where this guide conflicts with `service-layer.md`, the unified standard wins.

# Service Layer Design Guide

## Overview

The service layer (`src/svc/`) contains business logic, data validation, and domain operations. Services are pure
business logic without concerns of their callsites (HTTP invocation, serialization to JSON, efficient construction of
db connections, etc).

## Directory Structure

```
src/svc/
├── __init__.py
├── account.py                # Account lifecycle and credential management
├── data_providers.py         # Data provider CRUD operations
├── links.py                  # Link CRUD operations
├── locations.py              # Location CRUD operations
├── permission.py             # RBAC permission management and authorization
├── customer_segments.py      # Customer segment CRUD operations
├── role.py                   # Role management
├── security.py               # Cryptographic operations and token handling
├── lookups/                  # 'lookup' services; see below section for elaboration on 'lookups'
│   ├── __init__.py
│   ├── audit_numbers.py      # Audit number lookup operations
│   ├── data_providers.py     # Data provider lookup operations
│   ├── links.py              # Link lookup operations
│   ├── locations.py          # Location lookup operations
│   ├── pipeline_codes.py     # Pipeline code lookup operations
│   ├── pipelines.py          # Pipeline lookup operations
│   ├── products.py           # Product lookup operations
│   ├── customer_segments.py  # Customer segment lookup operations
│   ├── return_addresses.py   # Return address lookup operations
│   ├── shared.py             # Shared lookup types and utilities
│   ├── vendors.py            # Vendor lookup operations
│   └── wire_instructions.py  # Wire instruction lookup operations
└── tickets/                          # Ticket management services
    ├── __init__.py
    ├── errors.py                     # Ticket-specific error types
    ├── get_posted_ticket.py          # Retrieve posted ticket operations
    ├── get_unposted_ticket.py        # Retrieve unposted ticket operations
    ├── list_tickets.py               # List and filter tickets
    └── validate_unposted_tickets.py  # Bulk validation of unposted tickets
```

## Key Patterns

### Dependency Injection

- Database connections passed as explicit parameters
- No use of Flask globals (`g`, `current_app`)
- The callsite initializes connections and passes them to services
- No pre-serialization (if a callsite might have to return JSON, it would be the callsite's responsibility to serialize
  a Decimal object to a json compatible type, not the service layer)

### Custom Exceptions

- Each service module defines domain-specific exceptions
- Base exception classes per domain (e.g., `AccountServiceError`, `LookupsServiceError`, `TicketsServiceError`)
- Specific exceptions for different error cases (e.g., `AccountUsernameTakenError`, `AccountEmailTakenError`)

### Type Safety

- Heavy use of domain types from `types_.py` (e.g., `AccountInternalID`, `PermissionName`, `HashedPassword`)
- Dataclasses for structured data (e.g., `Ticket`, `LookupPipeline`, `ListLookupPipelineFilters`)
- Type hints throughout for static analysis with mypy

### Subdirectories

Services are organized into subdirectories when:

- Multiple related operations exist for a domain (e.g., `tickets/`, `lookups/`)
- Operations share common types or error handling (use `shared.py` or `errors.py`)
- Domain complexity warrants separation (e.g., distinct get/list operations for tickets)

### Lookups Pattern

Lookup services provide simplified entity views for dropdown/select menus:

- Naming: `LookupEntity` types (e.g., `LookupPipeline`, not `Pipeline`)
- No pagination (return complete filtered result sets)
- Slim data model (typically `id`, `name`, `code` only)
- Hierarchical filtering support (e.g., filter pipelines by location)

## Shared Resources

### Module-Level (`src/svc/<module>.py`)

- Top-level modules contain related operations for a single domain
- Examples: `account.py`, `permission.py`, `security.py`

### Subdirectory-Level (`src/svc/<subdirectory>/shared.py`)

- Shared types and utilities for related operations
- Example: `lookups/shared.py` contains `ListLookupsPageResult` generic type used by all lookup services
- Example: `tickets/errors.py` contains `TicketsServiceError` base exception

## Integration with Other Layers

### Called by HTTP Layer

HTTP endpoints import service functions and call them with injected dependencies:

```python
from svc.tickets.list_tickets import list_posted_tickets
from db import get_connection

# In HTTP view function
conn = get_connection()
result = list_posted_tickets(filters=filters, connection=conn)
```

### Calls Data Layer

Services may call stored procedure wrappers from `src/data/sprocs/`:

```python
from data.sprocs import legacy_ListPipeline

raw_rows = legacy_ListPipeline.exec_sproc(
    sproc_args=sproc_args,
    connection=connection,
)
```

or, a service may make a direct database query.

### Uses Core Types

Services heavily use domain types from `types_.py` for type safety and domain modeling.
