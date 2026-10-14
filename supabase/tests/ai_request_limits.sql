-- Isolated test database only. All fixtures, changed limits and helpers roll back.
-- psql "$LOCAL_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/ai_request_limits.sql
begin;
set local statement_timeout = '30s';
create schema ai_test;
create function ai_test.assert_true(ok boolean, message text)
returns void language plpgsql as $$
begin
  if ok is distinct from true then raise exception 'ASSERTION FAILED: %', message; end if;
end;
$$;
create function ai_test.expect_error(statement text, expected_message text default null)
returns void language plpgsql as $$
begin
  begin
    execute statement;
  exception when insufficient_privilege or raise_exception or invalid_parameter_value then
    if expected_message is not null and position(expected_message in sqlerrm) = 0 then
      raise exception 'WRONG ERROR: %', sqlerrm;
    end if;
    return;
  end;
  raise exception 'UNEXPECTED SUCCESS: %', statement;
end;
$$;
grant usage on schema ai_test to anon, authenticated, service_role;
grant execute on all functions in schema ai_test to anon, authenticated, service_role;

insert into auth.users (id, email, raw_user_meta_data) values
  ('a2222222-2222-4222-8222-222222222222', 'owner-a@ai-test.invalid', '{}'),
  ('b2222222-2222-4222-8222-222222222222', 'owner-b@ai-test.invalid', '{}'),
  ('c2222222-2222-4222-8222-222222222222', 'pending@ai-test.invalid', '{}'),
  ('f2222222-2222-4222-8222-222222222222', 'admin@ai-test.invalid', '{}');
alter table public.profiles disable trigger trg_prevent_role_escalation;
update public.profiles set role = 'admin' where id = 'f2222222-2222-4222-8222-222222222222';
alter table public.profiles enable trigger trg_prevent_role_escalation;
select set_config('request.jwt.claim.sub', 'f2222222-2222-4222-8222-222222222222', true);
select set_config('request.jwt.claims', '{"sub":"f2222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
insert into public.companies(owner_id, name, slug, status) values
  ('a2222222-2222-4222-8222-222222222222', 'Quota A', 'ai-test-a', 'approved'),
  ('b2222222-2222-4222-8222-222222222222', 'Quota B', 'ai-test-b', 'approved'),
  ('c2222222-2222-4222-8222-222222222222', 'Quota Pending', 'ai-test-pending', 'pending');

set local role anon;
select ai_test.expect_error($q$select public.reserve_ai_request('a2222222-2222-4222-8222-222222222222', 'draft')$q$);
select ai_test.expect_error($q$select * from public.ai_limits$q$);
select ai_test.expect_error($q$select * from public.ai_request_usage$q$);
select ai_test.expect_error($q$update public.ai_limits set enabled = false$q$);
select ai_test.expect_error($q$select public.finish_ai_request(gen_random_uuid(), 'succeeded', 1, 0, 0, 0)$q$);
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a2222222-2222-4222-8222-222222222222', true);
select set_config('request.jwt.claims', '{"sub":"a2222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
select ai_test.expect_error($q$select public.reserve_ai_request('a2222222-2222-4222-8222-222222222222', 'draft')$q$);
select ai_test.expect_error($q$select public.reserve_ai_request('b2222222-2222-4222-8222-222222222222', 'draft')$q$);
select ai_test.expect_error($q$delete from public.ai_request_usage$q$);
select ai_test.expect_error($q$update public.ai_limits set daily_units_global = 100000$q$);
select ai_test.expect_error($q$select public.finish_ai_request(gen_random_uuid(), 'failed', 1, 0, 0, 0)$q$);

set local role service_role;
select ai_test.expect_error($q$select public.reserve_ai_request('c2222222-2222-4222-8222-222222222222', 'draft')$q$, 'AI_COMPANY_NOT_APPROVED');
select ai_test.expect_error($q$select public.reserve_ai_request('00000000-0000-4000-8000-000000000000', 'draft')$q$, 'AI_COMPANY_NOT_APPROVED');
select ai_test.expect_error($q$select public.reserve_ai_request('a2222222-2222-4222-8222-222222222222', 'unpriced_operation')$q$, 'AI_INVALID_OPERATION');
select public.reserve_ai_request('a2222222-2222-4222-8222-222222222222', 'draft');
select ai_test.assert_true((select count(*) = 1 and sum(units) = 4 from public.ai_request_usage where user_id = 'a2222222-2222-4222-8222-222222222222'), 'draft reserves four units');
select public.finish_ai_request((select id from public.ai_request_usage where user_id = 'a2222222-2222-4222-8222-222222222222'), 'succeeded', 1500, 1000, 100, null);
select ai_test.assert_true((select status = 'succeeded' and duration_ms = 1500 and input_tokens = 1000 and output_tokens = 100 and estimated_cost_usd is null from public.ai_request_usage where user_id = 'a2222222-2222-4222-8222-222222222222'), 'usage persists without fabricating unknown price');
select public.finish_ai_request((select id from public.ai_request_usage where user_id = 'a2222222-2222-4222-8222-222222222222'), 'failed', 1, 1, 1, 0);
select ai_test.assert_true((select status = 'succeeded' and duration_ms = 1500 from public.ai_request_usage where user_id = 'a2222222-2222-4222-8222-222222222222'), 'completion cannot be overwritten');
select ai_test.expect_error($q$select public.finish_ai_request(gen_random_uuid(), 'reserved', 1, 0, 0, 0)$q$, 'AI_INVALID_USAGE');

-- Minute cap is shared by all three operations.
delete from public.ai_request_usage where user_id in ('a2222222-2222-4222-8222-222222222222', 'b2222222-2222-4222-8222-222222222222');
update public.ai_limits set requests_per_minute = 2, daily_units_per_user = 1000, daily_units_global = 100000;
select public.reserve_ai_request('a2222222-2222-4222-8222-222222222222', 'specs');
select public.reserve_ai_request('a2222222-2222-4222-8222-222222222222', 'transcribe');
select ai_test.expect_error($q$select public.reserve_ai_request('a2222222-2222-4222-8222-222222222222', 'draft')$q$, 'AI_QUOTA');
select ai_test.assert_true((select count(*) = 2 from public.ai_request_usage where user_id = 'a2222222-2222-4222-8222-222222222222'), 'denied calls do not create reservations');
update public.ai_request_usage set created_at = now() - interval '2 minutes' where user_id = 'a2222222-2222-4222-8222-222222222222';
select public.reserve_ai_request('a2222222-2222-4222-8222-222222222222', 'specs');
select ai_test.assert_true((select count(*) = 3 from public.ai_request_usage where user_id = 'a2222222-2222-4222-8222-222222222222'), 'minute window expires');

-- Weighted daily cap, including failed and in-flight requests.
delete from public.ai_request_usage where user_id = 'a2222222-2222-4222-8222-222222222222';
update public.ai_limits set requests_per_minute = 60, daily_units_per_user = 5;
select public.reserve_ai_request('a2222222-2222-4222-8222-222222222222', 'draft');
select ai_test.expect_error($q$select public.reserve_ai_request('a2222222-2222-4222-8222-222222222222', 'transcribe')$q$, 'AI_QUOTA');
select public.finish_ai_request((select id from public.ai_request_usage where user_id = 'a2222222-2222-4222-8222-222222222222'), 'failed', 100, 0, 0, null);
select public.reserve_ai_request('a2222222-2222-4222-8222-222222222222', 'specs');
select ai_test.expect_error($q$select public.reserve_ai_request('a2222222-2222-4222-8222-222222222222', 'specs')$q$, 'AI_QUOTA');
select ai_test.assert_true((select sum(units) = 5 from public.ai_request_usage where user_id = 'a2222222-2222-4222-8222-222222222222'), 'failure does not refund quota');
update public.ai_request_usage set created_at = now() - interval '2 days' where user_id = 'a2222222-2222-4222-8222-222222222222';
select public.reserve_ai_request('a2222222-2222-4222-8222-222222222222', 'draft');
select ai_test.assert_true((select sum(units) = 4 from public.ai_request_usage where user_id = 'a2222222-2222-4222-8222-222222222222' and created_at >= date_trunc('day', now() at time zone 'UTC') at time zone 'UTC'), 'daily window resets in UTC');

-- Global cap cannot be bypassed with a second approved account.
delete from public.ai_request_usage where user_id in ('a2222222-2222-4222-8222-222222222222', 'b2222222-2222-4222-8222-222222222222');
update public.ai_limits set daily_units_per_user = 100, daily_units_global = 4;
select public.reserve_ai_request('a2222222-2222-4222-8222-222222222222', 'draft');
select ai_test.expect_error($q$select public.reserve_ai_request('b2222222-2222-4222-8222-222222222222', 'specs')$q$, 'AI_QUOTA');
select ai_test.assert_true((select count(*) = 0 from public.ai_request_usage where user_id = 'b2222222-2222-4222-8222-222222222222'), 'global rejection also leaves no reservation');
update public.ai_limits set enabled = false;
select ai_test.expect_error($q$select public.reserve_ai_request('b2222222-2222-4222-8222-222222222222', 'specs')$q$, 'AI_DISABLED');
reset role;
rollback;
