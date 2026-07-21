-- =========================================================
-- Company branding (logo/banner) + self-service company
-- registration for already-authenticated users.
-- =========================================================

alter table public.companies add column logo_path text;
alter table public.companies add column banner_path text;

-- Banner is a GeoSelos-verified perk; strip it whenever the company
-- isn't verified (covers both direct edits and admin un-verifying later).
create function public.enforce_banner_requires_verification()
returns trigger as $$
begin
  if not new.verified then
    new.banner_path := null;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_enforce_banner_requires_verification
  before insert or update on public.companies
  for each row execute function public.enforce_banner_requires_verification();

-- Storage bucket for company logo/banner uploads (owner-scoped folders,
-- same pattern as equipment-images).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('company-images', 'company-images', true, 8388608, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "company_images_read" on storage.objects
  for select using (bucket_id = 'company-images');

create policy "company_images_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'company-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "company_images_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'company-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "company_images_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'company-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow the one-time upgrade from 'user' to 'company' role (self-service
-- company registration below). Every other self-escalation stays blocked.
create or replace function public.prevent_role_escalation()
returns trigger as $$
begin
  if new.role <> old.role and not public.is_admin() then
    if old.role = 'user' and new.role = 'company' then
      return new;
    end if;
    new.role := old.role;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- RPC: register a company for the current session's user in one step —
-- no second signup/email confirmation needed since the account already
-- exists and is already verified.
create function public.register_company(
  p_name text,
  p_cnpj text,
  p_city text,
  p_state text,
  p_phone text,
  p_whatsapp text,
  p_description text
) returns uuid as $$
declare
  new_id uuid;
  new_slug text;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if exists (select 1 from public.companies where owner_id = auth.uid()) then
    raise exception 'company_already_exists';
  end if;

  new_slug := lower(regexp_replace(coalesce(p_name, 'empresa'), '[^a-zA-Z0-9]+', '-', 'g'))
    || '-' || substr(auth.uid()::text, 1, 6);

  insert into public.companies (owner_id, name, cnpj, city, state, phone, whatsapp, description, slug)
  values (auth.uid(), p_name, p_cnpj, p_city, p_state, p_phone, p_whatsapp, p_description, new_slug)
  returning id into new_id;

  update public.profiles set role = 'company' where id = auth.uid();

  return new_id;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.register_company(text, text, text, text, text, text, text) to authenticated;
