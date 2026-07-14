-- =========================================================
-- EngiMercado schema: profiles, companies, categories,
-- equipment, contact_unlocks + RLS
-- =========================================================

create extension if not exists pgcrypto;

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user','company','admin')),
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_admin()
returns boolean as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$ language sql security definer stable set search_path = public;

create function public.prevent_role_escalation()
returns trigger as $$
begin
  if new.role <> old.role and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

alter table public.profiles enable row level security;

create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin());
create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid());

-- ---------- categories ----------
create table public.categories (
  slug text primary key,
  name text not null,
  count int not null default 0
);

alter table public.categories enable row level security;
create policy "categories_select_all" on public.categories for select using (true);

-- ---------- companies ----------
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null unique,
  cnpj text,
  city text,
  state text,
  phone text,
  whatsapp text,
  site text,
  description text,
  services text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  verified boolean not null default false,
  years_on_market int not null default 0,
  rating numeric not null default 0,
  reviews int not null default 0,
  created_at timestamptz not null default now()
);

create function public.force_pending_on_insert()
returns trigger as $$
begin
  if not public.is_admin() then
    new.status := 'pending';
    new.verified := false;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_force_pending
  before insert on public.companies
  for each row execute function public.force_pending_on_insert();

create function public.prevent_status_self_approval()
returns trigger as $$
begin
  if (new.status <> old.status or new.verified <> old.verified) and not public.is_admin() then
    new.status := old.status;
    new.verified := old.verified;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_prevent_status_self_approval
  before update on public.companies
  for each row execute function public.prevent_status_self_approval();

alter table public.companies enable row level security;

create policy "companies_select_approved_or_own_or_admin" on public.companies
  for select using (status = 'approved' or owner_id = auth.uid() or public.is_admin());
create policy "companies_insert_own" on public.companies
  for insert with check (owner_id = auth.uid());
create policy "companies_update_own_or_admin" on public.companies
  for update using (owner_id = auth.uid() or public.is_admin());

-- ---------- equipment ----------
create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  slug text not null unique,
  title text not null,
  brand text,
  model text,
  category_slug text references public.categories(slug),
  price numeric not null,
  mode text not null check (mode in ('venda','locacao')),
  condition text not null check (condition in ('Novo','Seminovo','Usado')),
  year int,
  hours int not null default 0,
  city text,
  state text,
  image_key text,
  description text,
  specs jsonb not null default '[]'::jsonb,
  status text not null default 'active' check (status in ('active','paused','removed')),
  created_at timestamptz not null default now()
);

alter table public.equipment enable row level security;

create policy "equipment_select_active_or_owner_or_admin" on public.equipment
  for select using (
    status = 'active'
    or public.is_admin()
    or exists (select 1 from public.companies c where c.id = equipment.company_id and c.owner_id = auth.uid())
  );
create policy "equipment_insert_approved_company" on public.equipment
  for insert with check (
    exists (
      select 1 from public.companies c
      where c.id = company_id and c.owner_id = auth.uid() and c.status = 'approved'
    )
  );
create policy "equipment_update_own_or_admin" on public.equipment
  for update using (
    public.is_admin()
    or exists (select 1 from public.companies c where c.id = equipment.company_id and c.owner_id = auth.uid())
  );
create policy "equipment_delete_own_or_admin" on public.equipment
  for delete using (
    public.is_admin()
    or exists (select 1 from public.companies c where c.id = equipment.company_id and c.owner_id = auth.uid())
  );

-- ---------- contact_unlocks ----------
create table public.contact_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, equipment_id)
);

alter table public.contact_unlocks enable row level security;
create policy "unlocks_insert_own" on public.contact_unlocks
  for insert with check (user_id = auth.uid());
create policy "unlocks_select_own_or_admin" on public.contact_unlocks
  for select using (user_id = auth.uid() or public.is_admin());

-- RPC: unlock contact info for an equipment listing (any authenticated user)
create function public.unlock_equipment_contact(eq_id uuid)
returns table(phone text, whatsapp text) as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  insert into public.contact_unlocks (user_id, equipment_id)
  values (auth.uid(), eq_id)
  on conflict (user_id, equipment_id) do nothing;

  return query
    select c.phone, c.whatsapp
    from public.companies c
    join public.equipment e on e.company_id = c.id
    where e.id = eq_id;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.unlock_equipment_contact(uuid) to authenticated;

-- RPC: unlock contact info for a company profile page (any authenticated user)
create function public.unlock_company_contact(comp_id uuid)
returns table(phone text, whatsapp text, site text) as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  return query
    select c.phone, c.whatsapp, c.site
    from public.companies c
    where c.id = comp_id;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.unlock_company_contact(uuid) to authenticated;
