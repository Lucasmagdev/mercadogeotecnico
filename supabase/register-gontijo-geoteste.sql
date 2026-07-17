-- Registra Gontijo Fundações e Geoteste como as únicas empresas da plataforma.
-- Todos os anúncios existentes passam a pertencer a elas; as 4 empresas mock
-- (TecnoMáquinas, Norte Equipamentos, PowerGen, Atlas) são removidas.

alter table public.companies disable trigger trg_force_pending;
alter table public.companies disable trigger trg_prevent_status_self_approval;

insert into public.companies (id, owner_id, name, slug, city, state, verified, years_on_market, rating, reviews, description, phone, whatsapp, site, services, status)
values
  ('55555555-5555-5555-5555-555555555555','4b2f1415-689b-46ce-bac4-e00117bb6a6b','Gontijo Fundações','gontijo-fundacoes','Belo Horizonte','MG',true,15,4.9,208,
   'Empresa especializada em fundações profundas, estacas hélice contínua e contenções. Reconhecimento técnico GeoSelos em fundações especiais.',
   '(31) 3333-4400','5531999994400','www.gontijofundacoes.com.br',
   array['Fundações profundas','Estacas hélice contínua','Contenções'],'approved'),
  ('66666666-6666-6666-6666-666666666666','a1f1aad2-b313-4b4b-a4da-bd1914ed7f13','Geoteste','geoteste','São Paulo','SP',true,20,4.8,176,
   'Investigações geotécnicas, sondagens e ensaios de campo e laboratório. Reconhecimento técnico GeoSelos em geotecnia.',
   '(11) 3777-2200','5511999992200','www.geoteste.com.br',
   array['Sondagem SPT','Ensaios geotécnicos','Investigação de subsolo'],'approved')
on conflict (slug) do update set verified = true, status = 'approved';

-- Reatribui todos os anúncios existentes para as duas empresas reais, alternando.
with ranked as (
  select id, row_number() over (order by created_at) as rn
  from public.equipment
  where company_id in (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444'
  )
)
update public.equipment e
set company_id = (case when ranked.rn % 2 = 0
  then '66666666-6666-6666-6666-666666666666'
  else '55555555-5555-5555-5555-555555555555'
end)::uuid
from ranked
where e.id = ranked.id;

-- Remove as empresas mock antigas (cascade limpa reviews/mensagens/analytics ligados a elas;
-- o equipamento já foi reatribuído acima, então nada de anúncio é perdido).
delete from public.companies
where id in (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444'
);

alter table public.companies enable trigger trg_force_pending;
alter table public.companies enable trigger trg_prevent_status_self_approval;
