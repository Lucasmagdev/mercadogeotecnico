-- =========================================================
-- Listing analytics: event log + daily series RPC
-- =========================================================

create table public.listing_events (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  event_type text not null check (event_type in ('view','contact_unlock','message','favorite')),
  created_at timestamptz not null default now()
);

create index listing_events_company_idx on public.listing_events (company_id, created_at desc);
create index listing_events_equipment_idx on public.listing_events (equipment_id, event_type);

alter table public.listing_events enable row level security;

-- Writes happen only through security definer functions/triggers below.
create policy "listing_events_select_owner_or_admin" on public.listing_events
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.companies c
      where c.id = listing_events.company_id and c.owner_id = auth.uid()
    )
  );

create function public.log_listing_event(eq_id uuid, ev_type text)
returns void as $$
  insert into public.listing_events (equipment_id, company_id, event_type)
  select e.id, e.company_id, ev_type
  from public.equipment e
  where e.id = eq_id;
$$ language sql security definer set search_path = public;

-- views: keep the counter and also log the event
create or replace function public.increment_equipment_views(eq_id uuid)
returns void as $$
  update public.equipment set views = views + 1 where id = eq_id;
  select public.log_listing_event(eq_id, 'view');
$$ language sql security definer set search_path = public;

-- contact unlocks -> event
create function public.log_unlock_event()
returns trigger as $$
begin
  perform public.log_listing_event(new.equipment_id, 'contact_unlock');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_log_unlock_event
  after insert on public.contact_unlocks
  for each row execute function public.log_unlock_event();

-- favorites -> event
create function public.log_favorite_event()
returns trigger as $$
begin
  perform public.log_listing_event(new.equipment_id, 'favorite');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_log_favorite_event
  after insert on public.favorites
  for each row execute function public.log_favorite_event();

-- new conversation about an equipment -> message event (one per conversation)
create function public.log_message_event()
returns trigger as $$
begin
  if new.equipment_id is not null then
    perform public.log_listing_event(new.equipment_id, 'message');
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_log_message_event
  after insert on public.conversations
  for each row execute function public.log_message_event();

-- Daily series for the company dashboard (owner or admin only).
create function public.company_analytics(comp_id uuid, days int default 30)
returns table(day date, views bigint, contact_unlocks bigint, messages bigint, favorites bigint) as $$
begin
  if not (
    public.is_admin()
    or exists (select 1 from public.companies c where c.id = comp_id and c.owner_id = auth.uid())
  ) then
    raise exception 'not_authorized';
  end if;

  return query
  select
    d.day::date,
    count(*) filter (where ev.event_type = 'view'),
    count(*) filter (where ev.event_type = 'contact_unlock'),
    count(*) filter (where ev.event_type = 'message'),
    count(*) filter (where ev.event_type = 'favorite')
  from generate_series(current_date - (days - 1), current_date, interval '1 day') as d(day)
  left join public.listing_events ev
    on ev.company_id = comp_id and ev.created_at::date = d.day::date
  group by d.day
  order by d.day;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.company_analytics(uuid, int) to authenticated;
