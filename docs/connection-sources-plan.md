# More connection types + remove "Map fields to widgets" step

## Context

The New Dashboard wizard (`components/builder/CreateProjectWizard.tsx`, used by `app/projects/new/page.tsx`) currently supports three sources — API, Excel, Google Sheet — and has a 3-step flow ending in a manual "Map fields to widgets" page. The user wants:

1. **More connection types**: PostgreSQL, MySQL, GraphQL endpoint, CSV URL. DB connections must be **live/refreshable** (connection + query stored on the project, re-synced by the existing refresh cron), not snapshot-once.
2. **Remove step 3** ("Map fields to widgets"): the wizard ends after the data-path step and creates an **empty dashboard** (`widgets: []`, `layout: []`); the user builds widgets in the builder.

## Design

### Data model (new migration)

`supabase/migrations/20260717_source_connections.sql`:
- `alter table projects add column source_type text not null default 'api'` (`api | graphql | postgres | mysql | csv | excel | gsheet`)
- `alter table projects add column source_config jsonb not null default '{}'::jsonb` — holds `{ connectionString, query }` for DB sources and `{ query }` for GraphQL.
- Update the `public_dashboards` view **only if** it selects `projects.*` (it selects explicit columns, so likely no change needed — verify).

Note: connection strings live in `source_config` the same way tokens already live in `auth_config` (jsonb, RLS-protected, service-role for cron).

### Server-side source fetching

- **New** `lib/dashlink/db-query.ts` (server-only): `runDbQuery(engine: "postgres" | "mysql", connectionString, query)` using `pg` / `mysql2/promise`. Guards: SELECT/WITH-only statement check, single statement, 15s timeout, cap 5000 rows, always close the connection. Returns plain row objects.
- **New** `lib/dashlink/fetch-source.ts`: `fetchSourceDataset({ sourceType, apiUrl, authConfig, dataPath, sourceConfig })` dispatcher:
  - `api` → existing `fetchRemoteDataset` (`lib/dashlink/fetch-remote.ts`)
  - `graphql` → POST `{ query }` to the URL with the same auth headers, resolve `dataPath`, flatten via `flattenJsonToDataset` (`lib/dashlink/flatten.ts`)
  - `postgres`/`mysql` → `runDbQuery` + `flattenJsonToDataset`
  - `csv` → fetch URL text, parse CSV (move the wizard's `parseCsvLine`/`parseCsv` into a shared `lib/dashlink/csv.ts` so client and server reuse it)
  - `excel`/`gsheet` → return `[]` (snapshot-once, unchanged behavior)
- **New route** `app/api/data/db/route.ts` (POST, requires Supabase session via `lib/supabase/server.ts`): `{ engine, connectionString, query }` → rows. Used by the wizard's "Test connection".
- **Extend** `app/api/data/proxy/route.ts`: accept optional `graphql: { query }`; when present, POST with JSON body `{ query }` instead of GET. Everything else (SSRF checks, auth headers, timeout) unchanged.

### Refresh pipeline

- `app/api/cron/refresh-data/route.ts`: select the two new columns and swap `fetchRemoteDataset(...)` for `fetchSourceDataset(...)`. Same skip-empty / upsert-snapshot logic.
- `app/api/cron/check-alerts/route.ts`: same swap so alerts work for DB/GraphQL projects (it already falls back to the stored snapshot when fetch returns `[]`).

### Persistence

- `lib/supabase/queries.ts`: add `source_type` / `source_config` to the `ProjectRow` type, select lists, row→model mapping, and `createProject`/`updateProject` payloads (mirror how `refresh_enabled` is threaded at lines ~31/110/154/167+).
- `app/api/projects/route.ts` (POST): accept `sourceType`, `sourceConfig` from the wizard and pass them through.

### Wizard rewrite (`components/builder/CreateProjectWizard.tsx`)

**Step 1 — Connect.** Source tiles become 7: API, GraphQL, PostgreSQL, MySQL, CSV, Excel, Google Sheet (grid-cols-4, wraps to 2 rows).
- **API**: unchanged.
- **GraphQL**: endpoint URL + query textarea + existing auth selector; "Test" POSTs to `/api/data/proxy` with `graphql: { query }`. Response lands in the existing `rawResponse` → step 2 array-path picker handles the nested `data.…` shape as-is.
- **PostgreSQL / MySQL**: connection string (password input) + SQL textarea; "Test" POSTs to `/api/data/db`; rows go through the existing `toDataset` → `resolvedData`/`fields` path. Show a "live — refreshed on the project's schedule" note instead of the snapshot warning.
- **CSV**: URL input reusing the existing sync-once client fetch (`handleSyncSnapshot` already parses CSV via `parseTextData`); shares the Excel/GSheet snapshot warning.
- **Excel / Google Sheet**: unchanged.

**Step 2 — Select data path.** Unchanged UI, but its footer button becomes **"Create Dashboard"** (enabled when `resolvedData.length > 0`; for DB/CSV/Excel the root is already an array so it's immediately ready).

**Remove step 3 entirely**: delete `WEntry`, `uid`, `addKpi/addLine/addBar/addPie`, `WIDGET_ICON`, `entries` state, the step-3 JSX, and the now-unused field-badge UI (`KIND_BADGE`, `detectFields`, `inferKind`, `FieldInfo`) if nothing else references them. `Step` type becomes `1 | 2`; header subtitle and dot indicator updated.

**`handleCreate`**: posts `widgets: []`, `layout: []` (empty dashboard) plus `sourceType` and `sourceConfig` (DB: `{ connectionString, query }`; GraphQL: `{ query }`; others: `{}`). `apiUrl` stores the endpoint URL for api/graphql/csv/gsheet/excel-by-URL, and a **redacted label** (e.g. `postgres://user@host/db`) for DB sources — the real connection string lives only in `source_config`.

### Dependencies

`pnpm add pg mysql2` and `pnpm add -D @types/pg` (mysql2 ships its own types).

## Files

| File | Change |
|---|---|
| `supabase/migrations/20260717_source_connections.sql` | new — `source_type`, `source_config` columns |
| `lib/dashlink/db-query.ts` | new — pg/mysql query runner |
| `lib/dashlink/fetch-source.ts` | new — source-type dispatcher |
| `lib/dashlink/csv.ts` | new — CSV parser moved out of the wizard |
| `app/api/data/db/route.ts` | new — authed test-query endpoint |
| `app/api/data/proxy/route.ts` | optional GraphQL POST body |
| `app/api/cron/refresh-data/route.ts`, `app/api/cron/check-alerts/route.ts` | use `fetchSourceDataset` |
| `lib/supabase/queries.ts`, `app/api/projects/route.ts` | persist new columns |
| `components/builder/CreateProjectWizard.tsx` | new source types; delete step 3; create empty dashboard |

## Verification

1. `pnpm tsc --noEmit` and `pnpm lint` (no test suite exists).
2. Apply the migration to the Supabase project (`supabase db push` or SQL editor).
3. `pnpm dev`, then at `/projects/new`:
   - API source with `https://jsonplaceholder.typicode.com/todos` → step 2 → Create → lands in builder with an empty canvas.
   - GraphQL against a public endpoint (e.g. `https://countries.trevorblades.com/` with `{ countries { code name } }`) → array path `data.countries` selectable.
   - Postgres/MySQL with a local connection string → test returns rows → create → confirm `source_type`/`source_config` persisted; verify a non-SELECT query is rejected.
   - CSV URL and Excel file still sync once.
4. Trigger `GET /api/cron/refresh-data` with `Authorization: Bearer $CRON_SECRET` for a DB-backed project and confirm `project_snapshots.synced_at` updates.
