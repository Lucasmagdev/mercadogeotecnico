-- Drop the "equipamentos" wording from category names/slugs to match the
-- peças/ferramentas/acessórios positioning. New categories are inserted
-- first so the equipment.category_slug FK stays satisfied while rows are
-- repointed, then the old rows are removed.
insert into public.categories (slug, name, count)
select 'pecas-hidraulicas', 'Peças Hidráulicas', count from public.categories where slug = 'equipamentos-hidraulicos'
union all
select 'pecas-fundacao', 'Peças de Fundação', count from public.categories where slug = 'equipamentos-fundacao'
union all
select 'pecas-sondagem', 'Peças de Sondagem', count from public.categories where slug = 'equipamentos-sondagem';

update public.equipment set category_slug = 'pecas-hidraulicas' where category_slug = 'equipamentos-hidraulicos';
update public.equipment set category_slug = 'pecas-fundacao' where category_slug = 'equipamentos-fundacao';
update public.equipment set category_slug = 'pecas-sondagem' where category_slug = 'equipamentos-sondagem';

delete from public.categories where slug in ('equipamentos-hidraulicos', 'equipamentos-fundacao', 'equipamentos-sondagem');
