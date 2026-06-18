---
last_review_sha: 468bb0335df5338d4d02447fcd256bb165019219
---

> **Stack-specific baseline example; superseded by [`frontend.md`](frontend.md).** The unified standard is the
> authoritative source for current rules. This older guide is retained as a worked CRUD example. If it conflicts with
> `frontend.md`, follow `frontend.md` and adapt the file paths to the adopting repo's frontend structure.

# Admin Data Endpoints

This document describes the architecture and patterns for admin data management features. These are CRUD interfaces for
core database entities, accessible under the Admin section of the sidebar.

## Overview

Admin data endpoints follow a consistent pattern:

- **Backend URL**: `/v1/admin/<entity>` (e.g., `/v1/admin/data-provider`)
- **Frontend route**: `/admin/<entity-slug>` (e.g., `/admin/modify-data-providers`)
- **Permissions**: Entity-specific (e.g., `dataprovider.create`, `dataprovider.read`, `dataprovider.update`)
- **Access control**: Sidebar visibility gated by `account.read`; individual actions gated by entity-specific
  permissions

## File Structure

For each admin data entity, files are organized as follows:

```
src/
├── api/v1/admin/                           # Admin-specific API clients
│   ├── <entity>.ts                         # RTK Query endpoints
│   └── responseSchemas/
│       └── <entity>.ts                     # Zod response schemas
├── components/admin/<entity>/              # UI components (nested per-entity)
│   ├── <Entity>Admin.tsx                   # Main list/table component
│   ├── Create<Entity>Modal.tsx             # Create form modal
│   └── Update<Entity>Modal.tsx             # Update form modal
├── pages/admin/<entity-slug>/
│   └── index.tsx                           # Page wrapper
└── schemas/
    └── <entity>.ts                         # Form validation schemas
```

### Current Entities

| Entity       | Route Slug              | API Path                  | Status                   |
| ------------ | ----------------------- | ------------------------- | ------------------------ |
| DataProvider | `modify-data-providers` | `/v1/admin/data-provider` | Scaffolded, awaiting API |

## Adding a New Admin Data Entity

### 1. Permissions

Add entity permissions to `src/models/enums/EnumPermissions.ts`:

```typescript
// <Entity> permissions
<ENTITY>_CREATE = "<entity>.create",
<ENTITY>_READ = "<entity>.read",
<ENTITY>_UPDATE = "<entity>.update",
```

Add permission selectors to `src/slices/userSlice.ts`:

```typescript
export const has<Entity>ReadPermissions = (state: RootState) =>
  state.user.permissions.includes(EnumPermissions.<ENTITY>_READ);

export const has<Entity>CreatePermissions = (state: RootState) =>
  state.user.permissions.includes(EnumPermissions.<ENTITY>_CREATE);

export const has<Entity>UpdatePermissions = (state: RootState) =>
  state.user.permissions.includes(EnumPermissions.<ENTITY>_UPDATE);
```

### 2. Cache Tag

Add a cache tag to `src/api/v1/index.ts`:

```typescript
export enum EnumCacheTagType {
  // ...existing tags
  <ENTITY> = "<Entity>",
}
```

And add it to the `tagTypes` array in `apiSlice`.

### 3. Response Schemas

Create `src/api/v1/admin/responseSchemas/<entity>.ts`:

```typescript
import { z } from "zod";
import { snakeCaseToCamelCaseKeys } from "@/api/core/caseConverter";

export const <Entity>Schema = z.preprocess(
  snakeCaseToCamelCaseKeys,
  z.object({
    id: z.string(),
    // Add entity fields here
  }),
);

export type T<Entity> = z.infer<typeof <Entity>Schema>;

export const <Entity>ListResponseSchema = z.preprocess(
  snakeCaseToCamelCaseKeys,
  z.object({
    items: z.array(<Entity>Schema),        // Backend returns items in "items" key
    nextPageToken: z.string().nullable(),
    totalCount: z.number(),
  }),
);

export type T<Entity>ListResponse = z.infer<typeof <Entity>ListResponseSchema>;
```

### 4. API Client

Create `src/api/v1/admin/<entity>.ts`:

```typescript
import { apiSlice, EnumCacheTagType } from "@/api/v1/index";
import { camelCaseToSnakeCaseKeys } from "@/api/core/caseConverter";
// ... imports for schemas

export const <entity>ApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    list<Entity>s: builder.query({
      providesTags: [EnumCacheTagType.<ENTITY>],
      query: (params) => ({
        method: "GET",
        url: `/admin/<entity>?${queryString}`,
      }),
      transformResponse: (response) => <Entity>ListResponseSchema.parse(response),
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

### 5. Form Schemas

Create `src/schemas/<entity>.ts`:

```typescript
import { z } from "zod";

export const Create<Entity>Schema = z.object({
  // Required fields for creation
});

export type TCreate<Entity>Data = z.infer<typeof Create<Entity>Schema>;

export const Update<Entity>Schema = z.object({
  // All fields optional for partial updates
});

export type TUpdate<Entity>Data = z.infer<typeof Update<Entity>Schema>;
```

### 6. Page and Components

- Create page at `src/pages/admin/<entity-slug>/index.tsx`
- Create components in `src/components/admin/<entity>/`
- Use `UsersAdmin.tsx`, `CreateUserModal.tsx`, `UpdateUserModal.tsx` as reference implementations

### 7. Enable in Sidebar

Add the route slug to `TEMPORARY_AVAILABLE` in `src/constants/appConfig.ts`:

```typescript
export const TEMPORARY_AVAILABLE = [
  "users",
  "tickets",
  "import",
  "<entity-slug>",  // Add here
] as const;
```

## DataProvider: Completing the Implementation

The DataProvider entity is scaffolded but awaiting the backend API. When the API is ready:

### Files to Update

Search for `TODO` comments in these files:

| File                                                              | What to Add                           |
| ----------------------------------------------------------------- | ------------------------------------- |
| `src/api/v1/admin/responseSchemas/dataProvider.ts`                | Entity fields in `DataProviderSchema` |
| `src/schemas/dataProvider.ts`                                     | Form fields, remove `_placeholder`    |
| `src/components/admin/data-providers/DataProvidersAdmin.tsx`      | Table columns                         |
| `src/components/admin/data-providers/CreateDataProviderModal.tsx` | Form inputs                           |
| `src/components/admin/data-providers/UpdateDataProviderModal.tsx` | Form inputs and field mapping         |

### Expected API Contract

**List**: `GET /v1/admin/data-provider`

```json
{
  "items": [{ "id": "...", ...fields }],
  "next_page_token": null,
  "total_count": 10
}
```

**Create**: `POST /v1/admin/data-provider`

- Request: Entity fields (snake_case)
- Response: Created entity

**Update**: `PATCH /v1/admin/data-provider/:id`

- Request: Partial entity fields (snake_case)
- Response: Updated entity

### Step-by-Step Completion

1. Get the API response shape from backend
1. Update `DataProviderSchema` with all fields
1. Update `CreateDataProviderSchema` with required fields (remove `_placeholder`)
1. Update `UpdateDataProviderSchema` with optional fields (remove `_placeholder`)
1. Add table columns to `DataProvidersAdmin.tsx`
1. Add form fields to both modal components
1. Update the `onSubmit` handler in `UpdateDataProviderModal.tsx` to map form values to payload
1. Test the full CRUD flow

## Reference Files

For working examples of this pattern, see the Users admin implementation:

- `src/api/v1/account.ts` - API client
- `src/api/v1/responseSchemas/account.ts` - Response schemas
- `src/schemas/account.ts` - Form schemas
- `src/components/admin/UsersAdmin.tsx` - Main component
- `src/components/admin/CreateUserModal.tsx` - Create modal
- `src/components/admin/UpdateUserModal.tsx` - Update modal
