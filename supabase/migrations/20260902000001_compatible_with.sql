-- =========================================================
-- "Compatível com" as a first-class, searchable field
-- (machine/equipment models this part is known to fit)
-- =========================================================

alter table public.equipment
  add column compatible_with text[] not null default '{}';

-- search_tsv was a stored generated column; folding compatible_with
-- (via array_to_string) into it makes the generation expression not
-- provably immutable, so it's rebuilt as a trigger-maintained column
-- instead — triggers have no such restriction.
drop index if exists equipment_search_idx;
alter table public.equipment drop column search_tsv;
alter table public.equipment add column search_tsv tsvector;

create function public.equipment_search_tsv_update()
returns trigger as $$
begin
  new.search_tsv :=
    setweight(to_tsvector('portuguese', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(new.brand, '') || ' ' || coalesce(new.model, '')), 'B') ||
    setweight(to_tsvector('portuguese', array_to_string(new.compatible_with, ' ')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(new.description, '')), 'C');
  return new;
end;
$$ language plpgsql;

create trigger trg_equipment_search_tsv
  before insert or update on public.equipment
  for each row execute function public.equipment_search_tsv_update();

-- backfill existing rows (trigger only fires on future writes)
update public.equipment set search_tsv =
  setweight(to_tsvector('portuguese', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('portuguese', coalesce(brand, '') || ' ' || coalesce(model, '')), 'B') ||
  setweight(to_tsvector('portuguese', array_to_string(compatible_with, ' ')), 'B') ||
  setweight(to_tsvector('portuguese', coalesce(description, '')), 'C');

create index equipment_search_idx on public.equipment using gin (search_tsv);
