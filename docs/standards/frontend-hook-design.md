---
last_review_sha: 6183f8931a1b1bfc2b3926efea95746d1b771253
---

# Hook Design Guidelines

## Principles

1. **Names describe what's returned** — not preconditions or implementation details
1. **Return values directly** — no wrapper arrays or unnecessary structures
1. **Match similar hooks** — consistent shapes reduce cognitive load

## Naming

Hook names should honestly describe what they return:

```typescript
// Returns user state (check loggedIn yourself)
const useUser = () => { ... };

// Returns all tickets (posted + unposted combined)
const useListAllTickets = () => { ... };
```

Avoid names that imply preconditions the hook doesn't enforce. `useLoggedUser` suggests you'll get a logged-in user,
but if `loggedIn` can be `false`, the name misleads.

## Sync Hooks (Selector Hooks)

Sync hooks read from Redux state and return values directly:

```typescript
const useUser = (): RootState["user"] => {
  return useSelector((state: RootState) => state.user);
};

// Usage
const user = useUser();
if (user.loggedIn) { ... }
```

## Async Hooks (Data-Fetching)

Async hooks wrap RTK Query and return `{ data, error, isLoading, ... }`:

```typescript
const useListAllTickets = (params): {
  data: TTicketItem[];
  error: FetchBaseQueryError | SerializedError | undefined;
  isLoading: boolean;
  totalCount: number;  // additional domain-specific fields are fine
} => { ... };

// Usage - alias when semantic names help readability
const { data: allTickets, isLoading } = useListAllTickets(params);
```

This matches RTK Query's auto-generated hooks (`useListAccountsQuery`, etc.) so all data-fetching has a uniform
interface.
