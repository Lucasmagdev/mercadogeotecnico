-- =========================================================
-- Full-text search + indexes for server-side catalog queries
-- =========================================================

alter table public.equipment
  add column search_tsv tsvector
  generated always as (
    setweight(to_tsvector('portuguese', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(brand, '') || ' ' || coalesce(model, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(description, '')), 'C')
  ) stored;

create index equipment_search_idx on public.equipment using gin (search_tsv);

create index equipment_status_category_idx on public.equipment (status, category_slug);
create index equipment_status_state_idx on public.equipment (status, state);
create index equipment_status_price_idx on public.equipment (status, price);
create index equipment_status_created_idx on public.equipment (status, created_at desc);
create index equipment_company_idx on public.equipment (company_id);
