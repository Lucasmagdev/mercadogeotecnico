-- RPC: total favorites across all of a company's equipment.
-- Restricted to the company owner or an admin (favorites rows are private per user).
create function public.count_company_favorites(comp_id uuid)
returns int as $$
declare
  cnt int;
begin
  if not exists (select 1 from public.companies where id = comp_id and owner_id = auth.uid()) and not public.is_admin() then
    raise exception 'not_authorized';
  end if;
  select count(*) into cnt from public.favorites f
  join public.equipment e on e.id = f.equipment_id
  where e.company_id = comp_id;
  return cnt;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.count_company_favorites(uuid) to authenticated;
