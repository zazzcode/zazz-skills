---
last_updated_at: 2026-06-06
---

# Frontend

This stack-specific baseline governs a React/Next.js frontend service: custom hook shape, the admin CRUD vertical slice, RTK Query
usage, MUI form and modal conventions, TypeScript idioms used across consumers of the API layer, styling via theme
tokens, UI-side authorization, hygiene around component refactors, and the testing expectations that pair with
response-schema changes.

The two organizing axes are: **how hooks expose data to components** (sync selector hooks vs. async data-fetching
hooks) and **how a new admin entity is built end-to-end** (API client, response schemas, form schemas, page, modal
components). Both come from the legacy curated guides; PR review history fills in the conventions that hold inside
individual modal and component implementations.

## Overview — admin CRUD vertical slice

Admin data endpoints follow a consistent pattern. Backend URL `/v1/admin/<entity>` (e.g., `/v1/admin/data-provider`);
frontend route `/admin/<entity-slug>` (e.g., `/admin/modify-data-providers`); permissions are entity-specific
(`<entity>.create`, `<entity>.read`, `<entity>.update`); sidebar visibility is gated by `account.read` while individual
actions are gated by entity-specific permissions
(frontend-admin-crud-guide.md §Overview).

For each admin entity, files are organized as:

```text
src/
├── api/v1/
│   ├── <entity>.ts                        # RTK Query endpoints
│   └── responseSchemas/
│       └── <entity>.ts                    # Zod response schemas
├── components/admin/<entity>/             # UI components (nested per-entity)
│   ├── <Entity>Admin.tsx                  # Main list/table component
│   ├── Create<Entity>Modal.tsx            # Create form modal
│   └── Update<Entity>Modal.tsx            # Update form modal
├── pages/admin/<entity-slug>/
│   └── index.tsx                          # Page wrapper
└── schemas/
    └── <entity>.ts                        # Form validation schemas
```

This baseline keeps API clients at `src/api/v1/<entity>.ts`, response schemas at
`src/api/v1/responseSchemas/<entity>.ts`, and entity components under `src/components/admin/<entity>/` (for example,
`data-providers/`, `links/`, and `customer-segments/`). A complete admin implementation consists of a list page with a
table plus paired create/update modals using `react-hook-form`, `zod`, and RTK Query mutations.

## Hook design

Hook return values are flat — no wrapper arrays or unnecessary structures — regardless of whether the hook is sync or
async (useUser.ts;
useListAllTickets.ts). Custom
hooks match the shape of comparable hooks in the codebase — consistent return shapes reduce cognitive load across
consumers
(frontend-hook-design.md §Principles;
useListAllTickets.ts;
useTicketLookups.ts).

### Naming

Hook names describe what they return. Not preconditions, not implementation details. `useUser` returns the user state
(caller checks `loggedIn` themselves); `useListAllTickets` returns all tickets (posted + unposted combined). Names like
`useLoggedUser` imply a precondition the hook doesn't enforce — if `loggedIn` can be `false`, the name misleads
(frontend-hook-design.md §Naming).

### Sync hooks (selector hooks)

Sync hooks read from Redux state and return values directly. No wrapper arrays, no unnecessary structures
(frontend-hook-design.md §Sync Hooks;
useUser.ts).

#### Desired ✅

```typescript
// frontend/src/hooks/useUser.ts
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

const useUser = (): RootState["user"] => {
  const user = useSelector((state: RootState) => state.user);
  return user;
};

export default useUser;

// Usage
const user = useUser();
if (user.loggedIn) { /* ... */ }
```

### Async hooks (data-fetching)

Async hooks wrap RTK Query and return `{ data, error, isLoading, ... }` — the same shape RTK Query's auto-generated
hooks return. Additional domain-specific fields (e.g., `totalCount`, `totalTicketVolume`) are added to that object
rather than wrapped in a separate structure. This shape match means data-fetching presents one uniform interface
regardless of whether the consumer is calling an auto-generated `useListAccountsQuery` or a custom `useListAllTickets`
(frontend-hook-design.md §Async Hooks;
useListAllTickets.ts:20-28).

#### Desired ✅

```typescript
// frontend/src/hooks/useListAllTickets.ts
type TListAllTicketsReturn = {
  data: TTicketItem[];
  error: FetchBaseQueryError | SerializedError | undefined;
  isLoading: boolean;
  totalCount: number;
  totalTicketVolume: number;
  // additional domain-specific fields are fine
};

// Usage — alias when semantic names help readability
const { data: allTickets, isLoading } = useListAllTickets(params);
```

### Single-flight discipline for hooks wrapping a lazy trigger

Custom hooks that wrap `useLazyXxxQuery` (or any imperatively-triggered async source) MUST track the latest in-flight
call by ref and discard stale resolutions. RTK Query does not auto-cancel a prior lazy trigger when the consumer calls
the trigger again, so two rapid calls return two independent promises whose resolutions race. A `reset()` exposed by
the hook MUST also abort the in-flight call, and the unmount cleanup MUST abort and revoke any owned URLs/Blobs. The
shape: capture the pending trigger result in a ref, compare on resolution, drop the result if the ref has moved on
(review precedent; useReportPdf.ts).

This matters for hooks that own a side effect — a Blob URL, a download cursor, a one-shot mutation — where a stale
resolution would clobber newer state or orphan a resource the UI no longer references.

#### Desired ✅

```typescript
// frontend/src/hooks/useReportPdf.ts
const inFlightRef = useRef<{ abort: () => void } | null>(null);

const trigger = useCallback(async (args: TReportFetchArgs) => {
  inFlightRef.current?.abort();          // supersede the prior call
  setBlob(null);
  const pending = triggerEndpoint(args);
  inFlightRef.current = pending;
  const result = await pending;
  if (inFlightRef.current !== pending) return;   // a newer trigger superseded us
  inFlightRef.current = null;
  if (result.data) { /* set blob/URL/filename */ }
}, [triggerEndpoint]);

const reset = useCallback(() => {
  inFlightRef.current?.abort();
  inFlightRef.current = null;
  /* clear owned state */
}, []);

useEffect(() => () => { inFlightRef.current?.abort(); /* revoke owned URLs */ }, []);
```

#### Not desired ❌

```typescript
// wrong: no supersession or abort — a second trigger can resolve before the
// first, then the first arrives and overwrites the newer state. Cancel UI
// stops the spinner but the fetch keeps running and creates a Blob URL
// nothing references.
const trigger = useCallback(async (args) => {
  setBlob(null);
  const result = await triggerEndpoint(args);
  if (result.data) { /* set blob/URL/filename */ }
}, [triggerEndpoint]);
```

## Admin CRUD patterns

### Per-entity setup

Adding a new admin data entity touches seven places in a predictable order. The sequence below mirrors
frontend-admin-crud-guide.md §Adding a New Admin Data Entity.

1. **Permissions.** Add `<ENTITY>_CREATE`, `<ENTITY>_READ`, `<ENTITY>_UPDATE` to `src/models/enums/EnumPermissions.ts`,
   plus the matching permission selectors in `src/slices/userSlice.ts`
   (EnumPermissions.ts;
   userSlice.ts).
1. **Cache tag.** Add an entry to `EnumCacheTagType` in
   `src/api/v1/index.ts` and to the
   `tagTypes` array on `apiSlice`.
1. **Response schemas.** Create `src/api/v1/responseSchemas/<entity>.ts` with a Zod schema for the entity, a
   list-response schema wrapping `items[]` + `nextPageToken` + `totalCount`, and `TEntity` / `TEntityListResponse` type
   aliases. Wrap schemas in `z.preprocess(snakeCaseToCamelCaseKeys, …)` so backend snake_case maps to the frontend
   camelCase shape
   (qualityBank.ts).
1. **API client.** Create `src/api/v1/<entity>.ts` that injects endpoints into `apiSlice`. Each query declares
   `providesTags`; each mutation declares `invalidatesTags`. Request bodies pass through `camelCaseToSnakeCaseKeys`
   (qualityBank.ts;
   link.ts).
1. **Form schemas.** Create `src/schemas/<entity>.ts` with a `Create<Entity>Schema` (required fields for creation) and
   an `Update<Entity>Schema` (all optional for partial updates). Export `TCreate<Entity>Data` and `TUpdate<Entity>Data`
   type aliases
   (frontend-admin-crud-guide.md §Form Schemas).
1. **Page and components.** Page at `src/pages/admin/<entity-slug>/index.tsx`; components in
   `src/components/admin/<entity>/`. Pattern off Users.
1. **Enable in sidebar.** Add the route slug to `TEMPORARY_AVAILABLE` in `src/constants/appConfig.ts`.

### API client shape

The API client uses `apiSlice.injectEndpoints`, declares `providesTags` on queries, declares `invalidatesTags` on
mutations, runs request bodies through `camelCaseToSnakeCaseKeys`, and runs responses through the matching Zod schema
in `transformResponse`. See
`link.ts:18-110` for the current
convention.

#### Desired ✅

```typescript
// frontend/src/api/v1/<entity>.ts
export const <entity>ApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    list<Entity>s: builder.query({
      providesTags: [EnumCacheTagType.<ENTITY>],
      query: (params) => ({
        method: "GET",
        url: `/admin/<entity>?${queryString}`,
      }),
      transformResponse: (response) =>
        <Entity>ListResponseSchema.parse(response),
    }),
    create<Entity>: builder.mutation({
      invalidatesTags: [EnumCacheTagType.<ENTITY>],
      query: (data) => ({
        body: camelCaseToSnakeCaseKeys(data),
        method: "POST",
        url: "/admin/<entity>",
      }),
      transformResponse: (response) => <Entity>Schema.parse(response),
    }),
    update<Entity>: builder.mutation({
      invalidatesTags: [EnumCacheTagType.<ENTITY>],
      query: ({ id, ...payload }) => ({
        body: camelCaseToSnakeCaseKeys(payload),
        method: "PATCH",
        url: `/admin/<entity>/${id}`,
      }),
      transformResponse: (response) => <Entity>Schema.parse(response),
    }),
  }),
});

export const {
  useList<Entity>sQuery,
  useCreate<Entity>Mutation,
  useUpdate<Entity>Mutation,
} = <entity>ApiSlice;
```

## RTK Query

### Mutation side effects live inside `onSubmit`

All RTK Query mutation side effects — closing the dialog, showing a toast, updating parent state — go inside the
`onSubmit` handler's `try/catch`, using `.unwrap()` so a failed request raises an exception the catch can handle.
Calling parent `setState` (or `dispatch`) directly in the render body while a child is rendering produces React's
"Cannot update a component while rendering a different component" error and a render loop that locks up the app
(review precedent; CreateUserModal.tsx:64-79;
UpdateUserModal.tsx).

#### Desired ✅

```tsx
// frontend/src/components/admin/CreateUserModal.tsx
const onSubmit = async (data: TCreateAccountData) => {
  try {
    await createAccount(data).unwrap();
    setMessage("User created successfully");
    setSeverityType("success");
    setToggleAlert(true);
    handleClose();
  } catch (err) {
    const detail = (err as { data?: { detail?: unknown } })?.data?.detail;
    const formattedDetail = convertObjectToString(detail);
    setMessage(formattedDetail || UNKNOW_ERROR);
    setSeverityType("error");
    setToggleAlert(true);
    handleClose();
  }
};
```

#### Not desired ❌

```tsx
// wrong: setState in render body triggers "Cannot update during render"
// + render loop. Diagnosed and removed in review precedent.
if (isSuccess) { parentSetState(result); }
if (error) { setLocalError(error); }
```

### Cache-tag invalidation, not hand-rolled optimistic state

When a mutation changes what a GET endpoint returns, add the appropriate tag to the mutation's `invalidatesTags` and
let RTK Query refetch. Do not maintain a parallel `keptOnScreen` / `displayedRows` array that mirrors server state.
Modal tables source rows from the fresh RTK Query result, not from a manually maintained intermediate array
(review precedent;
link.ts:18-110;
LinkDetailsModal.tsx).

#### Desired ✅

```ts
// frontend/src/api/v1/link.ts
swapLinkDataProviderMapping: builder.mutation<
  TLinkDataProviderMapping,
  TSwapLinkDataProviderMappingRequest
>({
  invalidatesTags: [EnumCacheTagType.LINK],
  query: ({ linkId, mappingId, newMappingId }) => ({
    body: camelCaseToSnakeCaseKeys({ mappingId, newMappingId }),
    method: "PATCH",
    url: `/admin/link/${linkId}/data-provider-mappings/swap`,
  }),
  transformResponse: (response) =>
    LinkDataProviderMappingSchema.parse(response),
}),
```

#### Not desired ❌

```ts
// wrong: hand-rolled optimistic state diverges from server truth.
// User has to clear cache to see updates. Removed in review precedent.
const [keptOnScreen, setKeptOnScreen] = useState<Row[]>([]);
setKeptOnScreen(prev =>
  prev.map(r => r.id === edited ? { ...r, mappingId: next } : r)
);
// (no invalidatesTags on the mutation)
```

### Multi-row group operations use `Promise.allSettled`

When a single user action dispatches one mutation per row in a group (e.g., updating Mapping ID across every provider
in a shared group), use `Promise.allSettled`, not `Promise.all`. With `allSettled`, outcomes are reconciled per row:
only successfully updated peers feed the kept-on-screen list, and the edited cell reverts only if its own update
failed. `Promise.all` rejects immediately on the first failure, dropping context about which individual rows succeeded
(review precedent).

A later iteration on `LinkDetailsModal.tsx` replaced the per-row dispatch loop with a single server-side swap endpoint
plus cache invalidation, but the rule applies any time per-row fan-out is the right shape.

#### Desired ✅

```ts
const results = await Promise.allSettled(
  group.map((provider) =>
    patchMapping({ providerId: provider.id, newMappingId }).unwrap(),
  ),
);
const succeeded = group.filter((_, i) => results[i].status === "fulfilled");
const failed = group.filter((_, i) => results[i].status === "rejected");
```

#### Not desired ❌

```ts
// wrong: rejects on the first failure, drops context about which rows
// already succeeded; modal reports total failure on partial success.
const results = await Promise.all(
  group.map((p) => patchMapping(...).unwrap()),
);
```

### Composite row IDs regenerate on identity change

When a grid row's identity depends on a composite key (e.g., `${mappingId}-${dataProviderId}`), any change to a
component of that key regenerates the row's `id` from the new values. Spreading the old row and only updating the
changed field leaves a stale-key ghost — the refetch arrives with a new `id` while the kept row still has the old `id`,
so both appear in the grid until the modal closes
(review precedent).

#### Desired ✅

```ts
const updatedRow = {
  ...oldRow,
  dataProviderMappingId: newMappingId,
  id: `${newMappingId}-${oldRow.dataProviderId}`, // regenerate composite id
};
```

#### Not desired ❌

```ts
const updatedRow = {
  ...oldRow,
  dataProviderMappingId: newMappingId,
  // wrong: id stays at `${oldMappingId}-${dataProviderId}` — ghost row in grid
};
```

### Response schemas have tests in the same PR

When a PR adds new response schemas to a schema file, tests for those schemas land in the corresponding test file in
the same PR. The test file already demonstrates the expected pattern — shape validation, required fields, optional
fields, type coercions — so adding coverage alongside the schema change is low-effort. Pre-existing schemas without
coverage are out of scope; new schemas in the current PR are in scope
(review precedent;
`responseSchemas/link.test.ts`;
see also
`customerSegment.test.ts`,
`dataProvider.test.ts`).

## Related standards

- `frontend-hook-design.md` —
  legacy curated source for the hook section above.
- `frontend-admin-crud-guide.md`
  — legacy curated source for the admin CRUD section above.
- `frontend-pr-conventions.md` —
  intermediate synthesis from the PR-comment harvest.
