-- Demo listings aligned with the "almoxarife geotécnico" positioning,
-- spread across the companies that actually exist and are approved.
insert into public.equipment
  (company_id, slug, title, brand, model, category_slug, price, mode, rental_period, condition, year, hours, city, state, image_key, description, specs)
values
('2f159640-4ec6-42f4-9394-aed80f34aade','bobcat-s650-mini-carregadeira','Mini Carregadeira Bobcat S650','Bobcat','S650','bobcat',312000,'venda',null,'Seminovo',2022,980,'Sabará','MG','bobcat',
 'Mini carregadeira robusta para movimentação de solo em canteiros urbanos e obras de fundação.',
 '[{"label":"Capacidade operacional","value":"1.202 kg"},{"label":"Potência","value":"74 HP"},{"label":"Peso operacional","value":"3.583 kg"}]'),

('55555555-5555-5555-5555-555555555555','guindaste-munck-15t','Guindaste Munck 15 Toneladas','Tadano','TM-150','guindastes',3800,'locacao','dia','Usado',2019,7400,'Belo Horizonte','MG','crane',
 'Guindaste articulado sobre caminhão, ideal para movimentação de estacas, tubulões e materiais de fundação.',
 '[{"label":"Capacidade máxima","value":"15 t"},{"label":"Lança","value":"18 m"},{"label":"Alcance máximo","value":"20 m"}]'),

('66666666-6666-6666-6666-666666666666','gerador-diesel-180kva','Gerador a Diesel 180 kVA','Cummins','C180D5','geradores',98000,'venda',null,'Novo',2024,0,'São Paulo','SP','generator',
 'Grupo gerador silenciado para obras que exigem energia contínua em operações de sondagem e bombeamento.',
 '[{"label":"Potência standby","value":"180 kVA"},{"label":"Tensão","value":"220/380 V"},{"label":"Nível de ruído","value":"70 dB(A)"}]'),

('66666666-6666-6666-6666-666666666666','perfuratriz-hidraulica-cbr10','Perfuratriz Hidráulica CBR 10','Casagrande','CBR 10','perfuratrizes',6500,'locacao','dia','Usado',2020,3100,'São Paulo','SP',null,
 'Perfuratriz hidráulica para sondagens rotativas e cravação de estacas em terrenos diversos.',
 '[{"label":"Profundidade máxima","value":"40 m"},{"label":"Torque","value":"10.000 Nm"},{"label":"Diâmetro de perfuração","value":"até 600 mm"}]'),

('66666666-6666-6666-6666-666666666666','trado-helicoidal-6-polegadas','Trado Helicoidal 6"','Geomak','TH-150','trados',18500,'venda',null,'Seminovo',2021,0,'São Paulo','SP',null,
 'Trado helicoidal para investigação de subsolo e coleta de amostras em sondagens a percussão.',
 '[{"label":"Diâmetro","value":"150 mm"},{"label":"Comprimento","value":"1 m por seção"},{"label":"Material","value":"Aço carbono tratado"}]'),

('55555555-5555-5555-5555-555555555555','estacas-helice-continua-kit','Conjunto para Estacas Hélice Contínua','Bauer','BG 15','equipamentos-fundacao',42000,'locacao','mes','Usado',2018,5200,'Belo Horizonte','MG',null,
 'Conjunto completo para execução de estacas hélice contínua em fundações profundas.',
 '[{"label":"Diâmetro de estacas","value":"até 600 mm"},{"label":"Profundidade máxima","value":"22 m"},{"label":"Torque","value":"150 kNm"}]'),

('66666666-6666-6666-6666-666666666666','amostrador-spt-completo','Amostrador SPT Completo','Geomak','SPT-Std','equipamentos-sondagem',8900,'venda',null,'Novo',2024,0,'São Paulo','SP',null,
 'Kit padrão para ensaio SPT: amostrador, martelo, hastes e composição completa conforme NBR 6484.',
 '[{"label":"Norma","value":"NBR 6484"},{"label":"Peso do martelo","value":"65 kg"},{"label":"Altura de queda","value":"75 cm"}]'),

('55555555-5555-5555-5555-555555555555','bomba-hidraulica-submersivel','Bomba Hidráulica Submersível 6"','Grundfos','SP-160','equipamentos-hidraulicos',15400,'venda',null,'Seminovo',2022,0,'Belo Horizonte','MG',null,
 'Bomba submersível de alta vazão para rebaixamento de lençol freático em obras de fundação.',
 '[{"label":"Vazão","value":"160 m³/h"},{"label":"Altura manométrica","value":"45 m"},{"label":"Potência","value":"15 cv"}]'),

('66666666-6666-6666-6666-666666666666','kit-ferramentas-sondagem','Kit de Ferramentas para Sondagem','Geomak','Kit-Completo','ferramentas',6200,'venda',null,'Seminovo',2023,0,'São Paulo','SP',null,
 'Kit completo de ferramentas manuais e acessórios para equipes de sondagem em campo.',
 '[{"label":"Itens","value":"32 peças"},{"label":"Maleta","value":"Rígida com espuma"},{"label":"Material","value":"Aço forjado"}]'),

('2f159640-4ec6-42f4-9394-aed80f34aade','motor-diesel-industrial-150cv','Motor Diesel Industrial 150cv','Cummins','6BT5.9','motores',54000,'venda',null,'Usado',2019,4200,'Sabará','MG',null,
 'Motor diesel industrial revisado, ideal para acionamento de bombas e perfuratrizes.',
 '[{"label":"Potência","value":"150 cv"},{"label":"Cilindros","value":"6"},{"label":"Refrigeração","value":"Líquida"}]'),

('55555555-5555-5555-5555-555555555555','retroescavadeira-4x4-obras','Retroescavadeira 4x4','Case','580N','retroescavadeiras',890,'locacao','dia','Usado',2020,6100,'Belo Horizonte','MG',null,
 'Retroescavadeira 4x4 para escavação, carregamento e abertura de valas em canteiros de fundação.',
 '[{"label":"Potência","value":"97 HP"},{"label":"Profundidade de escavação","value":"4,3 m"},{"label":"Tração","value":"4x4"}]'),

('2f159640-4ec6-42f4-9394-aed80f34aade','kit-pecas-reposicao-perfuratriz','Kit de Peças de Reposição para Perfuratriz','Casagrande','Universal','pecas',12800,'venda',null,'Novo',2024,0,'Sabará','MG',null,
 'Kit de peças de desgaste e reposição para perfuratrizes hidráulicas — vedações, buchas e mangueiras.',
 '[{"label":"Compatibilidade","value":"Perfuratrizes hidráulicas linha CBR"},{"label":"Itens","value":"18 peças"}]'),

('55555555-5555-5555-5555-555555555555','escavadeira-esteira-20t','Escavadeira de Esteira 20 Toneladas','Caterpillar','320D','maquinas-pesadas',720000,'venda',null,'Seminovo',2020,6800,'Belo Horizonte','MG','excavator',
 'Escavadeira de esteira de médio porte para escavação e movimentação de terra em fundações profundas.',
 '[{"label":"Peso operacional","value":"20.300 kg"},{"label":"Potência","value":"148 HP"},{"label":"Capacidade da caçamba","value":"1,0 m³"}]');
