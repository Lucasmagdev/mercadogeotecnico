# Database regression tests

Run `bun run test:db`, or the full product gate with `bun run check`.

The runner `scripts/test-database.mjs` uses pinned PGlite PostgreSQL 0.5.9 in a disposable in-memory database. It creates minimal Auth/Storage roles, tables and functions compatible with the tested RLS policies, executes the full migration chain and runs both SQL suites. Each suite rolls back its own fixtures. No hosted Supabase project, mailbox or paid provider is used.

The historical data migration `20260722000015_geotechnical_theme_listings.sql` assumes existing demo companies/categories. The isolated runner creates synthetic prerequisite records before that migration and removes the synthetic owner/companies/listings after the chain completes. It does not skip or rewrite the migration. A fresh hosted database still needs a reviewed strategy for this historical seed dependency; do not copy those synthetic prerequisites to production.

PGlite provides `gen_random_uuid` directly; the runner omits only the `CREATE EXTENSION pgcrypto` statement because its extension files are absent in this runtime. No tested authorization behavior depends on that extension.

Suites:

- `access_hardening.sql`: anonymous/private projections, owner A/B isolation, authenticated contact unlock, lead notification, derived ratings, immutable review identity, messaging and suspended/rejected visibility.
- `ai_request_limits.sql`: restricted server RPCs, weighted per-account/global limits, expiry/reset, failure reservations, telemetry and kill switch.

These execute actual PostgreSQL SQL and RLS rules. They do not prove real GoTrue JWT validation, PostgREST schema discovery, Storage service behavior, SMTP delivery or concurrency across hosted workers. Repeat the suites with `psql -v ON_ERROR_STOP=1` only in an isolated Supabase staging/local database, then exercise the real HTTP/browser workflow. Never run test fixtures in production by default.
