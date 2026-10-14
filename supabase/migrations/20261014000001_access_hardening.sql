-- Public catalog data must never include contact information. Owners/admins
-- retain access to the private row; other users use the explicit projections.
drop policy "companies_select_approved_or_own_or_admin" on public.companies;
create policy "companies_select_own_or_admin" on public.companies
  for select to authenticated
  using (owner_id = auth.uid() or public.is_admin());

create view public.companies_public
with (security_barrier = true, security_invoker = false) as
select
  id, owner_id, name, slug,
  null::text as cnpj,
  city, state,
  null::text as phone,
  null::text as whatsapp,
  null::text as site,
  description, services, status, verified, years_on_market, rating, reviews,
  created_at, logo_path, banner_path
from public.companies
where status = 'approved';
revoke all on public.companies_public from public, anon, authenticated;
grant select on public.companies_public to anon, authenticated;

-- RLS helpers return only availability, even when the private company row is
-- invisible to the caller. A guessed ID must not reveal its private fields.
create function public.is_company_approved(comp_id uuid)
returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.companies c
    where c.id = comp_id and c.status = 'approved'
  );
$$;

create function public.is_public_equipment(eq_id uuid, comp_id uuid default null)
returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.equipment e
    join public.companies c on c.id = e.company_id
    where e.id = eq_id and e.status = 'active' and c.status = 'approved'
      and (comp_id is null or e.company_id = comp_id)
  );
$$;
revoke all on function public.is_company_approved(uuid) from public, anon, authenticated;
revoke all on function public.is_public_equipment(uuid, uuid) from public, anon, authenticated;
grant execute on function public.is_company_approved(uuid) to anon, authenticated;
grant execute on function public.is_public_equipment(uuid, uuid) to anon, authenticated;

drop policy "equipment_select_active_or_owner_or_admin" on public.equipment;
create policy "equipment_select_public_or_owner_or_admin" on public.equipment
  for select using (
    (status = 'active' and public.is_company_approved(company_id))
    or public.is_admin()
    or exists (
      select 1 from public.companies c
      where c.id = equipment.company_id and c.owner_id = auth.uid()
    )
  );

-- Explicit columns prevent future private columns from silently becoming
-- public. security_invoker also enforces equipment RLS on this view.
create view public.equipment_public
with (security_barrier = true, security_invoker = true) as
select
  e.id, e.company_id, e.slug, e.title, e.brand, e.model, e.category_slug,
  e.price, e.mode, e.condition, e.year, e.hours, e.city, e.state, e.image_key,
  e.description, e.specs, e.status, e.created_at, e.views, e.images,
  e.search_tsv, e.rental_period, e.compatible_with,
  e.has_invoice, e.has_calibration_cert, e.maintenance_history_informed,
  to_jsonb(c) as companies
from public.equipment e
join public.companies_public c on c.id = e.company_id
where e.status = 'active';
revoke all on public.equipment_public from public, anon, authenticated;
grant select on public.equipment_public to anon, authenticated;

-- Ratings are derived from reviews. Direct owner writes cannot invent scores;
-- the existing review trigger and admin maintenance remain supported.
create function public.protect_company_rating()
returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  expected_rating numeric;
  expected_reviews integer;
begin
  if public.is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.rating := 0;
    new.reviews := 0;
  elsif new.rating is distinct from old.rating or new.reviews is distinct from old.reviews then
    select coalesce(round(avg(r.rating)::numeric, 1), 0), count(*)::integer
      into expected_rating, expected_reviews
    from public.reviews r where r.company_id = new.id;
    if new.rating is distinct from expected_rating or new.reviews is distinct from expected_reviews then
      raise exception 'company_rating_is_derived' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
create trigger trg_protect_company_rating
  before insert or update on public.companies
  for each row execute function public.protect_company_rating();

-- Moving a review would otherwise leave the previous company's aggregate
-- stale. Author/company identity is immutable; rating/comment remain editable.
create function public.prevent_review_reassignment()
returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.company_id is distinct from old.company_id or new.author_id is distinct from old.author_id then
    raise exception 'review_identity_is_immutable' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger trg_prevent_review_reassignment
  before update on public.reviews
  for each row execute function public.prevent_review_reassignment();

create or replace function public.refresh_company_rating()
returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  comp uuid;
begin
  comp := coalesce(new.company_id, old.company_id);
  -- Serialize aggregates for simultaneous reviews of the same company.
  perform 1 from public.companies where id = comp for update;
  update public.companies c set
    rating = coalesce((select round(avg(r.rating)::numeric, 1) from public.reviews r where r.company_id = comp), 0),
    reviews = (select count(*) from public.reviews r where r.company_id = comp)
  where c.id = comp;
  return null;
end;
$$;

drop policy "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own_approved_company" on public.reviews
  for insert to authenticated
  with check (author_id = auth.uid() and public.is_company_approved(company_id));

-- Replace historical/demo aggregates with their actual review totals.
update public.companies c set
  rating = coalesce((select round(avg(r.rating)::numeric, 1) from public.reviews r where r.company_id = c.id), 0),
  reviews = (select count(*) from public.reviews r where r.company_id = c.id);

-- Contact unlocks are written only by validated RPCs, never by direct inserts.
drop policy "unlocks_insert_own" on public.contact_unlocks;
revoke insert, update, delete on public.contact_unlocks from anon, authenticated;

create table public.company_contact_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, company_id)
);
create index company_contact_unlocks_company_idx
  on public.company_contact_unlocks (company_id, created_at desc);
alter table public.company_contact_unlocks enable row level security;
revoke all on public.company_contact_unlocks from public, anon, authenticated;
grant select on public.company_contact_unlocks to authenticated;
create policy "company_unlocks_select_own_or_admin" on public.company_contact_unlocks
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

create or replace function public.unlock_equipment_contact(eq_id uuid)
returns table(phone text, whatsapp text)
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.equipment e join public.companies c on c.id = e.company_id
    where e.id = eq_id and (
      (e.status = 'active' and c.status = 'approved')
      or c.owner_id = auth.uid() or public.is_admin()
    )
  ) then
    raise exception 'listing_not_available' using errcode = '42501';
  end if;

  insert into public.contact_unlocks (user_id, equipment_id)
  values (auth.uid(), eq_id) on conflict (user_id, equipment_id) do nothing;

  return query select c.phone, c.whatsapp from public.companies c
    join public.equipment e on e.company_id = c.id where e.id = eq_id;
end;
$$;

create or replace function public.unlock_company_contact(comp_id uuid)
returns table(phone text, whatsapp text, site text)
language plpgsql security definer set search_path = '' as $$
declare
  target_owner uuid;
  target_name text;
  unlocked_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  select c.owner_id, c.name into target_owner, target_name from public.companies c
    where c.id = comp_id and (
      c.status = 'approved' or c.owner_id = auth.uid() or public.is_admin()
    );
  if not found then
    raise exception 'company_not_available' using errcode = '42501';
  end if;

  insert into public.company_contact_unlocks (user_id, company_id)
  values (auth.uid(), comp_id) on conflict (user_id, company_id) do nothing
  returning id into unlocked_id;
  if unlocked_id is not null and target_owner <> auth.uid() then
    insert into public.notifications (user_id, type, title, body, link)
    values (target_owner, 'novo_lead', 'Novo contato interessado',
      'Uma pessoa desbloqueou o contato da empresa "' || target_name || '".', '/painel');
  end if;

  return query select c.phone, c.whatsapp, c.site from public.companies c where c.id = comp_id;
end;
$$;

-- Both direct conversation inserts and the definer RPC validate the company
-- and the equipment/company relationship. This prevents cross-company leads.
drop policy "conversations_insert_buyer" on public.conversations;
create policy "conversations_insert_buyer_available_company" on public.conversations
  for insert to authenticated with check (
    buyer_id = auth.uid() and public.is_company_approved(company_id)
    and (equipment_id is null or public.is_public_equipment(equipment_id, company_id))
  );
-- Conversation creation goes through the RPC so deduplication/first-message
-- checks cannot be bypassed with a direct REST insert. Existing messages remain
-- writable by their participants according to messages_insert_participant.
revoke insert, update, delete on public.conversations from anon, authenticated;
alter table public.messages add constraint messages_body_length
  check (length(btrim(body)) between 1 and 4000) not valid;

create or replace function public.start_conversation(comp_id uuid, eq_id uuid, first_message text)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  conv_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if not public.is_company_approved(comp_id)
    or (eq_id is not null and not public.is_public_equipment(eq_id, comp_id)) then
    raise exception 'listing_not_available' using errcode = '42501';
  end if;
  if first_message is null or length(btrim(first_message)) = 0 or length(first_message) > 4000 then
    raise exception 'invalid_message';
  end if;

  -- One short transaction lock per buyer/company prevents concurrent first
  -- messages from creating duplicate company-only conversations (NULL eq_id).
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text || ':' || comp_id::text, 0));
  select id into conv_id from public.conversations
  where buyer_id = auth.uid() and company_id = comp_id
    and equipment_id is not distinct from eq_id;
  if conv_id is null then
    insert into public.conversations (buyer_id, company_id, equipment_id)
    values (auth.uid(), comp_id, eq_id) returning id into conv_id;
  end if;
  insert into public.messages (conversation_id, sender_id, body)
  values (conv_id, auth.uid(), btrim(first_message));
  return conv_id;
end;
$$;

-- Internal event writers cannot be invoked through PostgREST to forge leads,
-- messages or favorites. The public view counter accepts public listings only.
revoke all on function public.log_listing_event(uuid, text) from public, anon, authenticated;
create or replace function public.increment_equipment_views(eq_id uuid)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if public.is_public_equipment(eq_id) then
    update public.equipment set views = views + 1 where id = eq_id;
    perform public.log_listing_event(eq_id, 'view');
  end if;
end;
$$;

revoke all on function public.unlock_equipment_contact(uuid) from public, anon, authenticated;
revoke all on function public.unlock_company_contact(uuid) from public, anon, authenticated;
revoke all on function public.start_conversation(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.company_analytics(uuid, int) from public, anon, authenticated;
revoke all on function public.count_company_favorites(uuid) from public, anon, authenticated;
revoke all on function public.register_company(text, text, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.increment_equipment_views(uuid) from public, anon, authenticated;
grant execute on function public.unlock_equipment_contact(uuid) to authenticated;
grant execute on function public.unlock_company_contact(uuid) to authenticated;
grant execute on function public.start_conversation(uuid, uuid, text) to authenticated;
grant execute on function public.company_analytics(uuid, int) to authenticated;
grant execute on function public.count_company_favorites(uuid) to authenticated;
grant execute on function public.register_company(text, text, text, text, text, text, text) to authenticated;
grant execute on function public.increment_equipment_views(uuid) to anon, authenticated;

notify pgrst, 'reload schema';
