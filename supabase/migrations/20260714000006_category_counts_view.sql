-- Real per-category counts of active listings. security_invoker makes the
-- view respect the querying user's RLS on the underlying tables.
create view public.categories_with_counts
with (security_invoker = true) as
select
  c.slug,
  c.name,
  coalesce(cnt.n, 0)::int as count
from public.categories c
left join (
  select category_slug, count(*) as n
  from public.equipment
  where status = 'active'
  group by category_slug
) cnt on cnt.category_slug = c.slug;

grant select on public.categories_with_counts to anon, authenticated;
