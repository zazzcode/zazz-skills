---
last_updated_at: 2026-06-06
---

# Frontend forms and UI hygiene

This standard governs frontend forms, option sets, JavaScript and TypeScript idioms, theme styling, permissions,
Storybook, and frontend tests.

## Forms and modals

### Required fields are visually marked from first render

MUI `TextField` and other form inputs for required fields include `required` so the label renders with an asterisk on
initial render. Required status is not hidden until a submit-time validation error
(review precedent;
CreateUserModal.tsx:115;
CreateCustomerSegmentModal.tsx).

#### Desired ✅

```tsx
<TextField
  label="Name"
  required
  value={name}
  onChange={onChange}
/>
```

#### Not desired ❌

```tsx
<TextField label="Name" value={name} onChange={onChange} />
{/* wrong: no `required`, label looks optional until submit */}
```

#### Wrapped controls: pass `required` to the inner TextField

The rule above applies wherever the TextField actually lives in the tree, not only to top-level `<TextField>` callers.
When the TextField is built inside an `Autocomplete`'s `renderInput`, a `DatePicker`'s `slotProps.textField`, or any
other wrapped/controlled MUI input, `required` MUST be passed through to that inner TextField. React Hook Form's
`Controller` with `rules={{ required }}` enforces validation but does not affect rendering — the asterisk only appears
when the TextField itself carries `required` (review precedent;
CustomerSegmentPeriodDialog.tsx).

##### Desired ✅

```tsx
<Controller
  control={control}
  name="qualityBankId"
  rules={{ required: "Customer Segment is required" }}
  render={({ field }) => (
    <Autocomplete
      {...field}
      options={qbOptions}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Customer Segment"
          required        // ← asterisk on first render
          error={!!errors.qualityBankId}
          helperText={errors.qualityBankId?.message}
        />
      )}
    />
  )}
/>

<Controller
  control={control}
  name="accountingPeriod"
  rules={{ required: "Accounting period is required" }}
  render={({ field }) => (
    <DatePicker
      {...field}
      slotProps={{
        textField: {
          required: true,   // ← asterisk on first render
          error: !!errors.accountingPeriod,
          helperText: errors.accountingPeriod?.message,
        },
      }}
    />
  )}
/>
```

##### Not desired ❌

```tsx
<Controller
  rules={{ required: "Customer Segment is required" }}   // validation only
  render={({ field }) => (
    <Autocomplete
      {...field}
      renderInput={(params) => (
        <TextField {...params} label="Customer Segment" />
        // wrong: no `required` on the inner TextField — asterisk
        // does not render until submit-time validation fires.
      )}
    />
  )}
/>
```

### Shared `CloseModalButton` over inline reimplementations

All modal components in `frontend/src/components/admin/` use `<CloseModalButton handleClose={handleClose} />` for the
close button. The shared component encapsulates positioning, icon choice, and `aria-label`; re-implementing it inline
with bare `IconButton` + `CloseIcon` diverges silently across modals
(review precedent comment;
CreateLinkModal.tsx:17;
CreateLinkModal.tsx:112;
LinkDetailsModal.tsx:1016).

#### Desired ✅

```tsx
import CloseModalButton from "@/components/Buttons/CloseModalButton";

<CloseModalButton handleClose={handleClose} />
```

#### Not desired ❌

```tsx
<IconButton
  onClick={handleClose}
  sx={{ position: "absolute", top: 8, right: 8 }}
>
  <CloseIcon />
</IconButton>
// wrong: re-implements the shared component inline
```

### Searchable dropdowns for bounded queryable values

When valid values come from an enumerable, queryable table (DataProviders, Locations, Pipelines, etc.), the input is a
searchable dropdown labeled with both the ID and a human-readable identifier (e.g., `{id}: {provider name}`), sourced
from the live list via an RTK Query lookup hook. Already-used values are filtered out of the picker options so
producing a 409 conflict is impossible. Free-text numeric ID fields are rejected — numeric IDs are opaque to users and
bypass implicit validation (review precedent comment;
LinkDetailsModal.tsx:336).

#### Desired ✅

```tsx
import { Autocomplete } from "@mui/material";

<Autocomplete
  options={availableDataProviders.filter(
    (dp) => !alreadyMapped.has(dp.id),
  )}
  getOptionLabel={(dp) => `${dp.id}: ${dp.name}`}
  value={selectedDp}
  onChange={(_, v) => setSelectedDp(v)}
  renderInput={(params) => (
    <TextField {...params} label="Mapping ID" required />
  )}
/>
```

#### Not desired ❌

```tsx
<TextField
  label="Mapping ID"
  type="number"
  value={mappingId}
  onChange={(e) => setMappingId(Number(e.target.value))}
/>
{/* wrong: free-text numeric ID with no discoverability and no validation
    that the value names a real DataProvider. */}
```

### Recurring fixed option sets live in a shared typed module

When the same fixed enumerable option set (Month, Year, etc. — values whose domain is fixed and known at build time)
appears across multiple components, extract it into a shared typed module under `frontend/src/models/` rather than
re-inlining the literals. The shared definition carries both a typed value (for storage/transmission) and a display
label (review precedent discussion).

#### Desired ✅

```ts
// frontend/src/models/Month.ts
export interface SelectOption<T> {
  value: T;
  label: string;
}

export const MONTH_OPTIONS: SelectOption<number>[] = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  // …
];
```

#### Not desired ❌

```tsx
// wrong: third inlined Month picker in the codebase; label changes (i18n,
// copy edits) will drift across the inlined copies.
<Select>
  <MenuItem value={1}>January</MenuItem>
  <MenuItem value={2}>February</MenuItem>
  {/* … */}
</Select>
```

## JavaScript and TypeScript idioms

### Use `??` for empty-array fallbacks on API response fields

When guarding an absent or unloaded API response field with an empty-array fallback, use `??` (nullish coalescing), not
`||` (logical OR). `??` falls back only when the left side is `null` or `undefined` — the precise guard needed for an
absent API response. `||` would coerce on any falsy value (`0`, `false`, `""`), creating silent bugs when the API
legitimately returns a zero-valued field
(review precedent comment;
CustomerSegmentsAdmin.tsx:115).

#### Desired ✅

```ts
// frontend/src/components/admin/customer-segments/CustomerSegmentsAdmin.tsx
rows={data?.data ?? []}
```

#### Not desired ❌

```ts
rows={data?.data || []}
// wrong: || coerces on any falsy value (0, false, ""), masking valid responses
```

The rule generalizes beyond empty-array fallbacks: when the only meaningful falsy state for a value is "absent," prefer
`??`.

### Time-dependent bounds evaluate at parse time, not module load

When a Zod schema (or any module-level constant) depends on the current date or time AND the corresponding UI control
samples the same clock at a different lifecycle phase (per render, on submit, etc.), move the schema bound into a
`.refine()` that reads the clock at parse time. Capturing `new Date().getFullYear()` at module load freezes the bound
for the lifetime of the process, while a render-time `dayjs().add(1, "year")` (or similar) re-reads the clock on every
render — a tab open across midnight Dec 31 ends up with the schema and the UI disagreeing about which years are valid
(review precedent;
schemas/report.ts).

#### Desired ✅

```ts
// frontend/src/schemas/report.ts
export const ReportParametersSchema = z.object({
  accountingPeriodYear: z
    .number({ error: "Year is required" })
    .int("Year must be a whole number")
    .min(1900, "Enter a valid year")
    // Upper bound evaluated at parse time, matching the dialog's
    // render-time `dayjs().add(1, "year")`.
    .refine(
      (v) => v <= new Date().getFullYear() + 1,
      "Year cannot be more than one year in the future",
    ),
  // …
});
```

#### Not desired ❌

```ts
// wrong: currentYear is frozen at module load. A long-lived browser tab
// (or any process surviving midnight Dec 31) sees the schema reject a
// year the DatePicker accepts.
const currentYear = new Date().getFullYear();

export const ReportParametersSchema = z.object({
  accountingPeriodYear: z
    .number()
    .min(1900)
    .max(currentYear + 1, "Year cannot be more than one year in the future"),
  // …
});
```

## Styling

### Theme tokens, not hardcoded colors

Component styles reference MUI theme tokens via `useTheme()` or the `sx` prop's theme-aware syntax. Hardcoded color
literals (`#1976d2`, `#fff`, `rgb(...)`) are permitted only when the theme cannot represent the needed color, and the
inline must document why. Theme colors propagate through light/dark mode toggles and design-system updates without code
edits; inline literals create silent visual divergence
(review precedent discussion;
theme.ts).

#### Desired ✅

```tsx
sx={{
  color: "primary.main",
  backgroundColor: "background.paper",
  borderColor: "divider",
}}
```

#### Not desired ❌

```tsx
sx={{
  color: "#1976d2",          // wrong: hardcoded literal escapes light/dark switching
  backgroundColor: "#fff",   // wrong
}}
```

## Authorization in the UI

### Reference permissions through `EnumPermissions`

Frontend code references permission identifiers through the `EnumPermissions` enum at
`frontend/src/models/enums/EnumPermissions.ts`.
String literals for permission identifiers are not used in components, tests, selectors, or hooks. Permission names are
fixed and known; a string literal decouples from the enum so a rename or typo passes type-check while breaking behavior
at runtime (review precedent discussion;
userSlice.ts:38-54).

#### Desired ✅

```ts
// frontend/src/slices/userSlice.ts
import EnumPermissions from "@/models/enums/EnumPermissions";

export const hasReadPermissions = (state: RootState) =>
  state.user.permissions.includes(EnumPermissions.READ);

export const hasDataProviderReadPermissions = (state: RootState) =>
  state.user.permissions.includes(EnumPermissions.DATAPROVIDER_READ);
```

#### Not desired ❌

```ts
const canLogIn = userPermissions.includes("login");
// wrong: string literal decoupled from the enum
```

Permission selectors live in `src/slices/userSlice.ts` and follow the `has<Entity><Action>Permissions` naming
convention
(frontend-admin-crud-guide.md §Permissions).

## Hygiene

### No transitional scaffolding on merge

Transitional types, parameters, and interfaces added "for the migration" are removed in the same PR if they offer no
value after merge. Code that exists only to support the prior version of a component, or to keep old Storybook stories
compiling, is cruft from day one of the merge. Update the consumers (including stories) in the same PR and delete the
bridge (review precedent discussion).

#### Desired ✅

```tsx
// New shape only; Storybook stories updated in the same PR.
export interface RolePermissionMatrixProps {
  permissionGroups: PermissionGroup[];
  roles: Role[];
  // … current shape
}

export const RolePermissionMatrix: FC<RolePermissionMatrixProps> = (
  props,
) => {
  // …
};
```

#### Not desired ❌

```tsx
// wrong: legacy props interface kept "for transition" — immediately cruft on merge.
// `TRole` and `_props` removed in review precedent after this exact feedback.
export interface RolePermissionMatrixProps { /* legacy shape */ }
export type TRole = string; // used only by old Storybook stories
export const RolePermissionMatrix: FC<NewProps> = (_props) => {
  // …
};
```

### Storybook stories travel with the component refactor

Component refactors update each `*.stories.tsx` in the same PR rather than leaving legacy props or types in the
component to keep old stories compiling. Storybook compatibility is not a reason to leak deprecated types into runtime
component code (review precedent discussion;
RolePermissionMatrix.stories.tsx).

The mechanical sequence is:

1. Refactor the component's props/types.
1. Update each `*.stories.tsx` file in the same PR to use the new shape.
1. Delete any types or parameters that exist only to support old stories.

## Frontend testing

Response-schema changes carry their tests. New schemas added to a response schema file have at least one matching test
in the corresponding `.test.ts` file in the same PR, following the existing test's pattern: shape validation,
required-field coverage, optional-field coverage, and type coercion checks where the preprocessor converts snake_case
to camelCase (review precedent comment;
`responseSchemas/link.test.ts`;
`responseSchemas/qualityBank.test.ts`;
`responseSchemas/role.test.ts`;
`responseSchemas/dataProvider.test.ts`).

Pre-existing schemas without coverage are out of scope; only schemas added or modified in the current PR are in scope
for new tests. The test file demonstrates the shape — duplicate the pattern for the new schema and move on.
