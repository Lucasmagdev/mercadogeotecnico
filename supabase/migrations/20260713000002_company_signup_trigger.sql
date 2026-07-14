-- Extend handle_new_user: company signups (account_type=company in user metadata)
-- also create a pending company row automatically.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  meta jsonb := new.raw_user_meta_data;
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    meta->>'full_name',
    case when meta->>'account_type' = 'company' then 'company' else 'user' end
  );

  if meta->>'account_type' = 'company' then
    insert into public.companies (owner_id, name, cnpj, city, state, phone, whatsapp, description, slug)
    values (
      new.id,
      meta->>'company_name',
      meta->>'cnpj',
      meta->>'city',
      meta->>'state',
      meta->>'phone',
      meta->>'whatsapp',
      meta->>'description',
      lower(regexp_replace(coalesce(meta->>'company_name','empresa'), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(new.id::text, 1, 6)
    );
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;
