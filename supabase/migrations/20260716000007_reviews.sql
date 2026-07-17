-- =========================================================
-- Reviews: avaliações de empresas por usuários autenticados
-- + recálculo automático de companies.rating / reviews
-- =========================================================

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, author_id)
);

create index reviews_company_idx on public.reviews (company_id, created_at desc);

-- Owner cannot review their own company.
create function public.prevent_self_review()
returns trigger as $$
begin
  if exists (
    select 1 from public.companies c
    where c.id = new.company_id and c.owner_id = new.author_id
  ) then
    raise exception 'cannot_review_own_company';
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_prevent_self_review
  before insert or update on public.reviews
  for each row execute function public.prevent_self_review();

alter table public.reviews enable row level security;

create policy "reviews_select_all" on public.reviews
  for select using (true);
create policy "reviews_insert_own" on public.reviews
  for insert with check (author_id = auth.uid());
create policy "reviews_update_own" on public.reviews
  for update using (author_id = auth.uid());
create policy "reviews_delete_own_or_admin" on public.reviews
  for delete using (author_id = auth.uid() or public.is_admin());

-- Keep the denormalized rating/reviews columns (already read by the app)
-- in sync with the reviews table.
create function public.refresh_company_rating()
returns trigger as $$
declare
  comp uuid;
begin
  comp := coalesce(new.company_id, old.company_id);
  update public.companies c
  set
    rating = coalesce((select round(avg(r.rating)::numeric, 1) from public.reviews r where r.company_id = comp), 0),
    reviews = (select count(*) from public.reviews r where r.company_id = comp)
  where c.id = comp;
  return null;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_refresh_company_rating
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_company_rating();

-- companies UPDATE policy allows owner/admin only, and the guard trigger
-- trg_prevent_status_self_approval only protects status/verified, so the
-- security definer function above is the sanctioned write path for rating.

-- Public author names for review listings without opening profiles RLS.
create view public.reviews_public
with (security_invoker = false) as
select
  r.id,
  r.company_id,
  r.author_id,
  r.rating,
  r.comment,
  r.created_at,
  r.updated_at,
  coalesce(p.full_name, 'Usuário') as author_name
from public.reviews r
left join public.profiles p on p.id = r.author_id;

grant select on public.reviews_public to anon, authenticated;
