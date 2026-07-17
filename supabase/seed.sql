-- categories
insert into public.categories (slug, name, count) values
  ('maquinas-pesadas','Máquinas Pesadas',1284),
  ('bobcat','Bobcat',312),
  ('escavadeiras','Escavadeiras',894),
  ('retroescavadeiras','Retroescavadeiras',476),
  ('perfuratrizes','Perfuratrizes',143),
  ('guindastes','Guindastes',208),
  ('geradores','Geradores',561),
  ('motores','Motores',389),
  ('equipamentos-hidraulicos','Equipamentos Hidráulicos',267),
  ('trados','Trados',98),
  ('pecas','Peças',2140),
  ('ferramentas','Ferramentas',1732),
  ('equipamentos-fundacao','Equipamentos de Fundação',176),
  ('equipamentos-sondagem','Equipamentos de Sondagem',121),
  ('equipamentos-laboratorio','Equipamentos de Laboratório',89),
  ('servicos','Serviços',640);

-- disable guard triggers just for seeding (owner_id insert lacks an authenticated session)
alter table public.companies disable trigger trg_force_pending;
alter table public.companies disable trigger trg_prevent_status_self_approval;
alter table public.profiles disable trigger trg_prevent_role_escalation;

-- companies (owner ids from seed-users.json)
insert into public.companies (id, owner_id, name, slug, city, state, verified, years_on_market, rating, reviews, description, phone, whatsapp, site, services, status)
values
  ('11111111-1111-1111-1111-111111111111','4b2f1415-689b-46ce-bac4-e00117bb6a6b','TecnoMáquinas Engenharia','tecnomaquinas','São Paulo','SP',true,18,4.9,312,
   'Especialistas em locação e venda de máquinas pesadas para grandes obras de infraestrutura. Frota própria e manutenção certificada.',
   '(11) 3555-1200','5511999990000','www.tecnomaquinas.com.br',
   array['Locação de máquinas','Manutenção preventiva','Transporte especializado'],'approved'),
  ('22222222-2222-2222-2222-222222222222','a1f1aad2-b313-4b4b-a4da-bd1914ed7f13','Norte Equipamentos','norte-equipamentos','Belo Horizonte','MG',true,11,4.7,154,
   'Distribuidora de equipamentos de fundação e sondagem com atuação nacional e assistência técnica em campo.',
   '(31) 3222-8080','5531988887777','www.norteequipamentos.com.br',
   array['Sondagem','Fundações','Consultoria técnica'],'approved'),
  ('33333333-3333-3333-3333-333333333333','ad07c23d-2a82-4f8f-a68d-52a4279dd041','PowerGen Energia','powergen','Curitiba','PR',false,6,4.5,87,
   'Soluções em geração de energia: geradores, motores e sistemas de backup para canteiros e indústrias.',
   '(41) 3010-4545','5541977776666','www.powergen.com.br',
   array['Locação de geradores','Instalação','Manutenção 24h'],'approved'),
  ('44444444-4444-4444-4444-444444444444','0c4e81f5-a44b-4f74-9b61-be90f4d4a3ae','Atlas Construção Pesada','atlas','Rio de Janeiro','RJ',true,24,4.8,421,
   'Referência em guindastes e içamento de cargas. Operadores certificados e planos de rigging completos.',
   '(21) 2555-3030','5521966665555','www.atlaspesada.com.br',
   array['Içamento de cargas','Guindastes','Planos de rigging'],'approved'),
  ('55555555-5555-5555-5555-555555555555','4b2f1415-689b-46ce-bac4-e00117bb6a6b','Gontijo Fundações','gontijo-fundacoes','Belo Horizonte','MG',true,15,4.9,208,
   'Empresa especializada em fundações profundas, estacas hélice contínua e contenções. Reconhecimento técnico GeoSelos em fundações especiais.',
   '(31) 3333-4400','5531999994400','www.gontijofundacoes.com.br',
   array['Fundações profundas','Estacas hélice contínua','Contenções'],'approved'),
  ('66666666-6666-6666-6666-666666666666','a1f1aad2-b313-4b4b-a4da-bd1914ed7f13','Geoteste','geoteste','São Paulo','SP',true,20,4.8,176,
   'Investigações geotécnicas, sondagens e ensaios de campo e laboratório. Reconhecimento técnico GeoSelos em geotecnia.',
   '(11) 3777-2200','5511999992200','www.geoteste.com.br',
   array['Sondagem SPT','Ensaios geotécnicos','Investigação de subsolo'],'approved');

update public.profiles set role='company' where id in (
  '4b2f1415-689b-46ce-bac4-e00117bb6a6b','a1f1aad2-b313-4b4b-a4da-bd1914ed7f13',
  'ad07c23d-2a82-4f8f-a68d-52a4279dd041','0c4e81f5-a44b-4f74-9b61-be90f4d4a3ae'
);
update public.profiles set role='admin' where id = '228b1353-42d0-468b-85b9-876f48d0c738';

alter table public.companies enable trigger trg_force_pending;
alter table public.companies enable trigger trg_prevent_status_self_approval;
alter table public.profiles enable trigger trg_prevent_role_escalation;

-- equipment
insert into public.equipment (company_id, slug, title, brand, model, category_slug, price, mode, condition, year, hours, city, state, image_key, description, specs) values
('11111111-1111-1111-1111-111111111111','escavadeira-cat-320','Escavadeira Hidráulica CAT 320','Caterpillar','320 GC','escavadeiras',685000,'venda','Seminovo',2021,3200,'São Paulo','SP','excavator',
 'Escavadeira hidráulica de esteira com excelente estado de conservação, revisada e pronta para operação. Ideal para terraplenagem e obras de grande porte.',
 '[{"label":"Peso operacional","value":"22.900 kg"},{"label":"Potência","value":"122 HP"},{"label":"Capacidade da caçamba","value":"1,19 m³"},{"label":"Profundidade de escavação","value":"6.720 mm"}]'),
('44444444-4444-4444-4444-444444444444','guindaste-tadano-25t','Guindaste Hidráulico 25 Toneladas','Tadano','GR-250XL','guindastes',4200,'locacao','Usado',2018,8600,'Rio de Janeiro','RJ','crane',
 'Guindaste sobre caminhão para içamento de cargas médias. Disponível para locação com ou sem operador certificado.',
 '[{"label":"Capacidade máxima","value":"25 t"},{"label":"Lança principal","value":"30,5 m"},{"label":"Alcance máximo","value":"34 m"},{"label":"Tração","value":"4x4"}]'),
('33333333-3333-3333-3333-333333333333','gerador-diesel-250kva','Gerador a Diesel 250 kVA','Cummins','C250D5','geradores',132000,'venda','Novo',2024,0,'Curitiba','PR','generator',
 'Grupo gerador silenciado com painel automático e QTA. Ideal para indústrias, hospitais e canteiros de obra.',
 '[{"label":"Potência standby","value":"250 kVA"},{"label":"Tensão","value":"220/380 V"},{"label":"Consumo (75%)","value":"38 L/h"},{"label":"Nível de ruído","value":"72 dB(A)"}]'),
('22222222-2222-2222-2222-222222222222','bobcat-s70','Mini Carregadeira Bobcat S70','Bobcat','S70','bobcat',2800,'locacao','Seminovo',2022,1450,'Belo Horizonte','MG','bobcat',
 'Mini carregadeira compacta ideal para espaços reduzidos, reformas e obras urbanas. Baixo consumo e alta manobrabilidade.',
 '[{"label":"Capacidade operacional","value":"445 kg"},{"label":"Potência","value":"23,5 HP"},{"label":"Largura","value":"914 mm"},{"label":"Altura de descarga","value":"2.007 mm"}]'),
('11111111-1111-1111-1111-111111111111','escavadeira-komatsu-pc200','Escavadeira Komatsu PC200','Komatsu','PC200-8','escavadeiras',520000,'venda','Usado',2017,9800,'São Paulo','SP','excavator',
 'Escavadeira robusta e confiável, ótima relação custo-benefício. Manutenções em dia com histórico completo.',
 '[{"label":"Peso operacional","value":"20.000 kg"},{"label":"Potência","value":"148 HP"},{"label":"Capacidade da caçamba","value":"0,80 m³"},{"label":"Profundidade de escavação","value":"6.620 mm"}]'),
('33333333-3333-3333-3333-333333333333','gerador-stemac-150kva','Gerador Stemac 150 kVA','Stemac','ST150','geradores',1900,'locacao','Seminovo',2020,2100,'Curitiba','PR','generator',
 'Gerador silenciado para eventos e obras. Locação com combustível opcional e suporte 24h.',
 '[{"label":"Potência standby","value":"150 kVA"},{"label":"Tensão","value":"220/380 V"},{"label":"Consumo (75%)","value":"24 L/h"},{"label":"Autonomia tanque","value":"10 h"}]'),
('44444444-4444-4444-4444-444444444444','guindaste-liebherr-40t','Guindaste Liebherr 40 Toneladas','Liebherr','LTM 1040','guindastes',890000,'venda','Usado',2015,12400,'Rio de Janeiro','RJ','crane',
 'Guindaste móvel de alta capacidade para montagens industriais e içamentos de grande porte.',
 '[{"label":"Capacidade máxima","value":"40 t"},{"label":"Lança telescópica","value":"35 m"},{"label":"Jib","value":"16 m"},{"label":"Eixos","value":"3"}]'),
('22222222-2222-2222-2222-222222222222','bobcat-t595','Bobcat Esteira T595','Bobcat','T595','bobcat',3400,'locacao','Novo',2024,120,'Belo Horizonte','MG','bobcat',
 'Mini carregadeira de esteira com alta tração, ideal para terrenos acidentados e obras de infraestrutura.',
 '[{"label":"Capacidade operacional","value":"998 kg"},{"label":"Potência","value":"66 HP"},{"label":"Largura","value":"1.676 mm"},{"label":"Velocidade","value":"11,4 km/h"}]');

-- pending company example, so the admin approval queue isn't empty
insert into public.companies (owner_id, name, slug, city, state, phone, whatsapp, description, services)
values ('ac9bbfb0-e909-4c13-b0b1-93be267f0fe4','Obras Vale Máquinas','obras-vale-maquinas','Joinville','SC','(47) 3222-1010','5547999991111',
 'Locadora regional de máquinas para construção civil, em fase de cadastro na plataforma.',
 array['Locação de máquinas','Transporte']);
