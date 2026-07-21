-- Rental period (day/week/month) for locação listings.
alter table public.equipment
  add column rental_period text check (rental_period in ('dia', 'semana', 'mes'));

-- Catch-all category for listings that don't fit the curated list, so the
-- publish form can offer "Outro" without spawning ad-hoc categories.
insert into public.categories (slug, name, count)
values ('outros', 'Outros', 0)
on conflict (slug) do nothing;
