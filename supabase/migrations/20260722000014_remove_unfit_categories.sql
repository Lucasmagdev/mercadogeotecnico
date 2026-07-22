-- Drop categories that don't fit the "almoxarife geotécnico" positioning.
-- Escavadeiras had real listings, so fold them into Máquinas Pesadas first.
update public.equipment set category_slug = 'maquinas-pesadas' where category_slug = 'escavadeiras';

delete from public.categories where slug in ('escavadeiras', 'equipamentos-laboratorio');
