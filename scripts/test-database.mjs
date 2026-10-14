import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const db = new PGlite();
try {
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    create schema storage;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb not null default '{}');
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
    create table storage.buckets (id text primary key, name text, public boolean default false, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
    alter table storage.objects enable row level security;
    create function storage.foldername(name text) returns text[] language sql immutable as $$
      select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1)-1];
    $$;
    grant usage on schema public, auth, storage to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
    grant all on storage.objects to anon, authenticated, service_role;
    create publication supabase_realtime;
  `);
  const migrations = (await readdir(path.join(root, "supabase/migrations")))
    .filter((name) => name.endsWith(".sql"))
    .sort();
  for (const name of migrations) {
    if (name === "20260722000015_geotechnical_theme_listings.sql") {
      // This historical data migration assumes companies/categories from an existing
      // demo database. Provide its prerequisites only inside the disposable test DB.
      // No migration is skipped or changed, and no hosted environment is touched.
      await db.exec(`
        insert into auth.users(id, email) values ('01234567-89ab-4cde-8f01-234567890abc', 'demo-bootstrap@migration-test.invalid');
        alter table public.profiles disable trigger trg_prevent_role_escalation;
        update public.profiles set role = 'admin' where id = '01234567-89ab-4cde-8f01-234567890abc';
        alter table public.profiles enable trigger trg_prevent_role_escalation;
        select set_config('request.jwt.claim.sub', '01234567-89ab-4cde-8f01-234567890abc', false);
        insert into public.companies(id, owner_id, name, slug, status)
        select id::uuid, '01234567-89ab-4cde-8f01-234567890abc'::uuid, 'Synthetic migration prerequisite', 'migration-test-' || id, 'approved'
        from unnest(array['2f159640-4ec6-42f4-9394-aed80f34aade', '55555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666']) id;
        insert into public.categories(slug, name)
        select slug, slug from unnest(array['bobcat', 'guindastes', 'geradores', 'perfuratrizes', 'trados', 'equipamentos-fundacao', 'equipamentos-sondagem', 'equipamentos-hidraulicos', 'ferramentas', 'motores', 'retroescavadeiras', 'pecas', 'maquinas-pesadas']) slug
        on conflict (slug) do nothing;
      `);
    }
    let sql = await readFile(path.join(root, "supabase/migrations", name), "utf8");
    // PGlite has gen_random_uuid built in but not the pgcrypto extension files.
    // No extension behavior is involved in the authorization tests.
    sql = sql.replace(/^create extension if not exists pgcrypto;\r?\n/m, "");
    try {
      await db.exec(sql);
    } catch (error) {
      throw new Error(`Migration ${name}: ${error.message}`, { cause: error });
    }
  }
  await db.exec(`
    delete from auth.users where id = '01234567-89ab-4cde-8f01-234567890abc';
    select set_config('request.jwt.claim.sub', '', false);
  `);
  const suites = [];
  for (const suite of ["access_hardening", "ai_request_limits"]) {
    const sql = await readFile(path.join(root, `supabase/tests/${suite}.sql`), "utf8");
    const results = await db.exec(sql);
    const checks = (
      sql.match(/select (access_test|ai_test)\.(assert_true|expect_rejected|expect_error)\(/g) ?? []
    ).length;
    const rollback = await db.query(
      "select count(*)::int as rows from public.companies where slug like 'access-test-%' or slug like 'ai-test-%'",
    );
    if (rollback.rows[0].rows !== 0) throw new Error("Fixture rollback failed");
    suites.push({ suite, checks, fixtureRowsAfterRollback: 0, statements: results.length });
  }
  console.log(
    JSON.stringify({
      status: "PASS",
      migrations: migrations.length,
      suites,
      runtime: "PGlite PostgreSQL (auth/storage mocks; not PostgREST)",
      historicalDataPrerequisites:
        "Synthetic companies/categories only in disposable DB; full migration chain executed",
    }),
  );
} catch (error) {
  console.error(
    JSON.stringify({
      status: "FAIL",
      message: error.message,
      code: error.cause?.code ?? error.code,
      detail: error.cause?.detail ?? error.detail,
    }),
  );
  process.exitCode = 1;
} finally {
  await db.close();
}
