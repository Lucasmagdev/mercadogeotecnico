-- Durable quota shared across Netlify workers. Only server-side service_role may reserve
-- or finish a request. User identity is verified by Supabase Auth before these RPCs.
create table public.ai_limits (
  singleton boolean primary key default true check (singleton),
  enabled boolean not null default true,
  requests_per_minute integer not null default 6 check (requests_per_minute between 1 and 60),
  daily_units_per_user integer not null default 60 check (daily_units_per_user between 1 and 1000),
  daily_units_global integer not null default 1200 check (daily_units_global between 1 and 100000)
);
insert into public.ai_limits (singleton) values (true);

create table public.ai_request_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  operation text not null check (operation in ('draft', 'specs', 'transcribe')),
  units integer not null check (units > 0),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'reserved' check (status in ('reserved', 'succeeded', 'failed')),
  duration_ms integer,
  input_tokens integer,
  output_tokens integer,
  estimated_cost_usd numeric check (estimated_cost_usd >= 0)
);
create index ai_request_usage_user_time on public.ai_request_usage (user_id, created_at);
create index ai_request_usage_time on public.ai_request_usage (created_at);
alter table public.ai_limits enable row level security;
alter table public.ai_request_usage enable row level security;
revoke all on public.ai_limits, public.ai_request_usage from public, anon, authenticated;
grant select, insert, update, delete on public.ai_limits, public.ai_request_usage to service_role;

create function public.reserve_ai_request(p_user_id uuid, p_operation text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_limits public.ai_limits%rowtype;
  v_units integer;
  v_user_units bigint;
  v_global_units bigint;
  v_minute_requests bigint;
  v_id uuid;
  v_day timestamptz := date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';
begin
  v_units := case p_operation when 'draft' then 4 when 'specs' then 1 when 'transcribe' then 2 else null end;
  if v_units is null then raise exception 'AI_INVALID_OPERATION' using errcode = '22023'; end if;
  if not exists (select 1 from public.companies where owner_id = p_user_id and status = 'approved') then
    raise exception 'AI_COMPANY_NOT_APPROVED' using errcode = '42501';
  end if;

  -- All reservations, including those from different users/instances, serialize before
  -- checking the global budget. The lock ends before the external provider is called.
  perform pg_catalog.pg_advisory_xact_lock(177831067, 1);
  select * into v_limits from public.ai_limits where singleton;
  if not found or not v_limits.enabled then raise exception 'AI_DISABLED'; end if;
  select count(*) into v_minute_requests from public.ai_request_usage
    where user_id = p_user_id and created_at > now() - interval '1 minute';
  select coalesce(sum(units), 0) into v_user_units from public.ai_request_usage
    where user_id = p_user_id and created_at >= v_day;
  select coalesce(sum(units), 0) into v_global_units from public.ai_request_usage where created_at >= v_day;
  if v_minute_requests >= v_limits.requests_per_minute
     or v_user_units + v_units > v_limits.daily_units_per_user
     or v_global_units + v_units > v_limits.daily_units_global then
    raise exception 'AI_QUOTA';
  end if;
  insert into public.ai_request_usage (user_id, operation, units)
    values (p_user_id, p_operation, v_units) returning id into v_id;
  return v_id;
end;
$$;

create function public.finish_ai_request(
  p_request_id uuid, p_status text, p_duration_ms integer,
  p_input_tokens integer, p_output_tokens integer, p_estimated_cost_usd numeric
)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_status not in ('succeeded', 'failed') or p_duration_ms < 0
     or p_input_tokens < 0 or p_output_tokens < 0 then
    raise exception 'AI_INVALID_USAGE' using errcode = '22023';
  end if;
  update public.ai_request_usage set status = p_status, completed_at = now(),
    duration_ms = p_duration_ms, input_tokens = p_input_tokens, output_tokens = p_output_tokens,
    estimated_cost_usd = p_estimated_cost_usd
    where id = p_request_id and status = 'reserved';
end;
$$;

revoke all on function public.reserve_ai_request(uuid, text) from public, anon, authenticated;
revoke all on function public.finish_ai_request(uuid, text, integer, integer, integer, numeric) from public, anon, authenticated;
grant execute on function public.reserve_ai_request(uuid, text) to service_role;
grant execute on function public.finish_ai_request(uuid, text, integer, integer, integer, numeric) to service_role;
