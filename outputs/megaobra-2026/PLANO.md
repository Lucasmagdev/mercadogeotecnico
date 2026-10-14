# Mercado Geotécnico — preparação para a Megaobra 2026

Diagnóstico em **14/10/2026**, horário de Brasília. Objetivo confirmado: **conquistar empresas para anunciar**. Participação como visitantes, com produto e presença digital preparados para conversas e contatos.

## Decisão sobre a arquitetura

**A arquitetura é adequada para um piloto B2B e para captar anunciantes na feira.** A recomendação é manter React/TanStack Start, Supabase e Netlify e concentrar as próximas semanas em segurança, ativação de empresas, confiança e uso pelo celular.

O código já inclui cadastro de conta e empresa, aprovação administrativa, anúncios com fotos e especificações, catálogo paginado, busca textual, mensagens, favoritos, avaliações e registro de interessados. As 11 tabelas públicas definidas nas migrações têm RLS; há proteção para papel administrativo, aprovação e verificação. Isso é uma base aproveitável.

Essa avaliação **não é uma garantia de capacidade de acessos simultâneos**. Faltam confirmar planos e cotas contratados, migrações e permissões efetivamente aplicadas, entrega de e-mails, backups e comportamento sob carga. Há lacunas no código que precisam ser resolvidas antes de ampliar a divulgação.

## Prazo real

A feira será de **24 a 26 de novembro de 2026**, no **Expominas, Belo Horizonte**. Temos **41 dias até a abertura**. A organização oferece ingresso de visitante; o plano pode se apoiar em conversas, demonstrações pelo celular e acompanhamento posterior. O acesso de visitantes às rodadas B2B e à plataforma de matchmaking precisa ser confirmado com a organização.

Fontes: [Megaobra — site oficial](https://feiramegaobra.com.br/) e [bilheteria oficial vinculada](https://credenciatickets.com.br/cubo-megaobra-eventos/megaobra-2026). A tabela de dias da semana do site tem inconsistência; usar as datas confirmadas pela bilheteria.

## O que significa chegar redondinho

Uma empresa nova deve conseguir entender a proposta, cadastrar sua conta, confirmar o e-mail, acompanhar a aprovação e publicar o primeiro anúncio sem depender de explicações técnicas. Vocês devem conseguir demonstrar o resultado e o caminho do contato em 60–90 segundos.

O anúncio precisa ter informações verdadeiras, foto identificável e canal de contato funcionando. A operação precisa saber quem aprova cadastros, quem ajuda o anunciante e como acompanhar as empresas conhecidas na feira.

## Backlog prioritário

P0 = resolver antes de ampliar a divulgação. P1 = condição para convidar empresas para uso real. P2 = melhorar aquisição e experiência após o fluxo essencial estar confiável. Os achados de código abaixo ainda são correções pendentes; a observação em produção está identificada quando ocorreu.

| Prioridade | Problema e impacto | Entrega mínima e prova de conclusão | Evidência |
| --- | --- | --- | --- |
| P0 | Funções de IA usam a chave paga do servidor sem autenticação, cota ou validação real de tamanho. Ocultar o botão no cliente não protege o endpoint. | Validar sessão/token no servidor e autorização da empresa; limitar texto, imagens e áudio; adicionar cotas e timeout. Chamada anônima deve falhar antes de atingir o provedor. Excesso de cota deve ser tratado. Publicação manual deve continuar utilizável. | `src/lib/ai-listing.ts:227`, `:405`, `:451`, `:464`; `src/start.ts:20`. Confirmado no código local; não foi feita chamada paga em produção. |
| P1 | TypeScript falha no processamento da IA; o build sozinho não revela isso. | Corrigir o estreitamento de `leadingCandidate` e `confidence_percent`; executar `tsc --noEmit`, lint no escopo do produto e build como gates de entrega. | `src/lib/ai-listing.ts:179` e `:180`; ver [QA](QA.md). |
| P1 | UI e política prometem contato após login, mas consultas públicas retornam os campos de telefone/WhatsApp. | Definir a regra de negócio. Se contato for restrito, usar projeção pública sem esses campos e consulta autenticada para desbloqueio. Se for público, alinhar interface, política e definição de lead. Verificar resposta anônima sem expor dados no relatório. | `src/lib/queries.ts:31`, `:57`, `:111`; `src/routes/privacidade.tsx:28`; `src/routes/pecas.$slug.tsx:293`. |
| P1 | Proprietário pode alterar nota/contagem de avaliações; anúncio ativo pode continuar público depois de a empresa ser suspensa/rejeitada. | Proteger campos derivados `rating` e `reviews`; calcular a partir das avaliações. Vincular visibilidade/publicação ao status aprovado da empresa. Testar empresa A, B, admin e visitante. | `20260713000001_initial_schema.sql:108`, `:126`, `:154`; `20260716000007_reviews.sql:57`, `:70`, em `supabase/migrations`. |
| P1 | A home apresenta 9.430+ anúncios, 1.240+ empresas verificadas e 870 negócios/mês definidos como constantes. Isso prejudica a confiança se não houver comprovação. | Remover os números ou substituí-los por métricas reais com definição e fonte. Explicar o produto com benefícios e anúncios reais. Logos apresentados como exemplos não devem ser usados como prova de clientes. | `src/routes/index.tsx:72–75`, `:532`. Números também observados no site público após a animação. |
| P1 | Cadastro depende de confirmação de e-mail e aprovação manual, mas falta orientação de prazo e suporte acionável. | Validar SMTP, remetente e redirects em produção; oferecer reenvio de confirmação; mostrar status, responsável e contato de suporte. Sugestão operacional: aprovação em até um dia útil e atendimento mais frequente durante a feira, se houver responsável disponível. | `src/routes/cadastro.empresa.tsx:228`; `src/routes/publicar.tsx:361`; `src/routes/painel.tsx:84`. |
| P1 | Login sempre retorna à home; upload de logo pode fazer um cadastro já concluído parecer totalmente malsucedido; erro de catálogo parece lista vazia. | Retomar o destino após login; separar falha opcional de imagem do sucesso do cadastro; mostrar erro de rede e ação de tentar novamente. Testar retorno após perda de conexão. | `src/routes/entrar.tsx:41`; `src/routes/cadastro.empresa.tsx:345`; `src/components/equipment-browser.tsx:110`, `:473`. |
| P1 | Anúncio sem foto pode receber imagem genérica de escavadeira. | Usar placeholder explicitamente ilustrativo ou exigir foto real antes de publicar. IA deve sugerir informações para revisão, sem transformar inferência em especificação comprovada. | `src/routes/publicar.tsx:195`; qualidade da IA também está em trabalho local. |
| P2 | Home consulta o catálogo inteiro; fotos de até 8 MB são servidas sem versões menores. | Limitar a vitrine, selecionar os campos necessários, comprimir/redimensionar fotos e carregar a imagem maior no detalhe. Medir em 4G com catálogo representativo. | `src/routes/index.tsx:133`; `src/lib/queries.ts:30`; `src/lib/equipment-images.ts:12`, `:24`, `:35`. |
| P2 | Compartilhamento não tem imagem/URL OG e título próprio por anúncio; sitemap usa caminhos relativos. | Definir domínio canônico, sitemap com URLs absolutas e preview de anúncio com foto/título/descrição renderizados no servidor. Conferir prévia no WhatsApp. | `src/routes/__root.tsx:88`; `src/routes/pecas.$slug.tsx:41`, `:79`; `src/routes/sitemap[.]xml.ts:5`. Sitemap relativo confirmado em produção. |
| P2 | Analytics mede parte do uso, mas não atribui aquisição e ativação da feira. | Registrar origem UTM e etapas cadastro, confirmação, aprovação e primeiro anúncio. Proteger funções internas de analytics e deduplicar eventos quando necessário. Validar privilégios reais no banco. | `supabase/migrations/20260716000009_analytics_events.sql:9`, `:28`, `:37`; `src/lib/queries.ts:467`. |
| P2 | Marca e operação não têm presença de contato completa no site. | Escolher o conceito visual, finalizar arquivos vetoriais, preparar Instagram com bio e três publicações fixadas, cadastrar canal de suporte e ligar perfis ao site. | `src/components/logo.tsx:4`; `src/components/site-footer.tsx:4`; `src/routes/privacidade.tsx:36`; ver [kit Instagram](INSTAGRAM.md). |

## Plano de seis semanas

| Período | Foco | Entrega verificável |
| --- | --- | --- |
| **14–20/10** | Segurança e confiança | Fechar IA no servidor, corrigir os dois erros de tipos, ajustar números da home, decidir regra de contato e proteger avaliação/status. Confirmar planos, ambiente, migrations, backups e responsável pela aprovação. |
| **21–27/10** | Ativação do anunciante | Percorrer cadastro → confirmação → aprovação → primeiro anúncio → recebimento de contato com contas de teste. Implementar suporte acionável, reenvio de confirmação, retorno após login e recuperação de falhas. |
| **28/10–03/11** | Conteúdo real e celular | Convidar um grupo pequeno de empresas conhecidas; revisar primeiros anúncios e fotos. Otimizar vitrine/imagens e testar em Android/iPhone e 4G. Selecionar direção visual da marca. |
| **04–10/11** | Marca e aquisição | Finalizar logo/avatar, preparar e publicar perfil Instagram pelo titular, corrigir preview de links/sitemap, medir a origem dos cadastros e preparar entrada direta para anunciantes. |
| **11–17/11** | Piloto e ensaio | Pedir a empresas que façam o fluxo sem ajuda; corrigir bloqueios; demonstrar em 90 segundos; exercitar duas contas e isolamento de dados; testar carga moderada no ambiente apropriado. Encerrar novas funcionalidades em 17/11. |
| **18–23/11** | Estabilização | Trabalhar apenas nas correções necessárias; revisar anúncios, canais, e-mails, aprovação e monitoramento. Preparar gravação curta para conexão instável e verificar restauração/rollback do deploy. |
| **24–26/11** | Feira | Mostrar benefício e exemplos reais, obter permissão para o acompanhamento, registrar interesse e origem, ajudar o interessado no primeiro passo. |
| **27/11–03/12** | Conversão | O responsável comercial retoma os contatos que autorizaram acompanhamento, ajuda na publicação e mede empresas ativadas. |

O cronograma é uma ordem de trabalho sugerida. Volume de entregas deve ser ajustado à disponibilidade da equipe; P0/P1 prevalecem sobre expansão de funcionalidades.

## Primeiro ciclo de trabalho

1. Abrir uma tarefa para proteger as três funções de IA e suas entradas; medir custo/tempo e incluir publicação manual como alternativa funcional.
2. Corrigir os dois erros de tipos e configurar gate reproduzível de typecheck, lint do produto e build. Separar temporários/gerados do escopo de lint, sem esconder erros reais de `src`.
3. Remover os números sem fonte da home e escolher regra de contato público/restrito.
4. Proteger derivados de avaliações e aplicar a regra de suspensão aos anúncios.
5. Escolher um responsável por aprovação/suporte e executar o fluxo completo com contas controladas.

### Execução do primeiro ciclo — atualização em 14/10

O backlog acima registra os problemas encontrados no diagnóstico inicial. A implementação agora avançou no workspace; isso ainda não libera a divulgação da versão publicada.

| Item | Estado atual | Próxima prova necessária |
| --- | --- | --- |
| IA e entradas | As três funções exigem token validado no servidor, empresa aprovada, limites de arquivo/texto e reserva de cota persistente. Há deadline total, medição de tempo/uso/custo configurável e opção explícita de preencher manualmente. | Aplicar cotas, configurar segredos/preços no servidor e medir uma chamada controlada real. Estimativa sem preço é desconhecida, não zero. |
| Tipos e gates | Erros de tipos corrigidos; gate reproduzível inclui typecheck, lint, testes unitários, SQL PostgreSQL isolado, build e testes HTTP do servidor compilado. Temporários/saídas excluídos do lint; `src` permanece inteiro. | Execução remota do CI após envio do código; gate local registrado no QA. |
| Confiança e contatos | Números sem fonte removidos da home; regra escolhida é contato após login e desbloqueio. Views públicas não expõem contato/CNPJ; consultas de catálogo e telas foram atualizadas. | Aplicar a migração e publicar o aplicativo compatível; verificar resposta anônima e desbloqueio pelo PostgREST real. |
| Avaliação e suspensão | Migração e testes impedem nota/contagem inventadas pelo proprietário e escondem anúncios de empresas não aprovadas. | Aplicar e exercitar a regra no ambiente atualizado. |
| Operação e jornada | Lucas é responsável; e-mail e WhatsApp autorizados estão no código. Reenvio de confirmação, status atualizável, retorno após login e recuperação de falhas foram implementados. E-mail de recuperação chegou à caixa controlada. | Cadastro/confirmacão/aprovação/publicação/primeiro contato em celular real ainda não foram concluídos. |

Você aplicou as migrações pelo painel, e a conferência pela API confirmou catálogo público sem contato, bloqueios anônimos e cotas configuradas. **Não reaplique o SQL.** As [instruções de publicação coordenada](APLICAR-SQL.md) continuam válidas para a próxima etapa: publicar o aplicativo compatível e validar o fluxo autenticado real. O agente não executou migração remota nem deploy.

A tarefa de IA está registrada em [TAREFA-IA.md](TAREFA-IA.md); ver também [operação](OPERACAO.md) e [resultados](QA.md).

## Metas sugeridas para o piloto

São metas iniciais para discussão, **não resultados atuais nem promessa comercial**:

- Antes da feira: 5 empresas piloto aprovadas e ao menos 20 anúncios reais, com permissão e qualidade revisada.
- Fluxo: 3 empresas novas conseguem publicar um anúncio sem assistência técnica; pelo menos um contato de teste chega corretamente ao anunciante.
- Na feira: priorizar 15 conversas com empresas do perfil procurado e 5 interessados em experimentar, em vez de uma meta de seguidores.
- Até 03/12: acompanhar quantos interessados viraram empresas aprovadas e publicaram o primeiro anúncio.

A métrica central é **empresa ativada = aprovada + primeiro anúncio publicado**. Cadastros abandonados e seguidores não substituem esse resultado.

## Critérios para liberar a divulgação

- [ ] Endpoint de IA recusa chamada não autorizada e respeita limites/cotas.
- [ ] Empresa A não altera dados da B; visitante não acessa o que a política classifica como restrito.
- [ ] Empresa suspensa deixa de ter anúncios públicos conforme a regra definida.
- [ ] Typecheck, lint do produto e build passam no ambiente de entrega.
- [ ] Confirmação e recuperação de senha chegam a caixas reais; redirects estão corretos no domínio público.
- [ ] Cadastro, aprovação e primeiro anúncio funcionam de ponta a ponta em celular.
- [ ] Foto/texto do anúncio correspondem ao item; falhas de IA/rede têm recuperação clara.
- [ ] Desbloqueio de contato/mensagem registra e entrega o interessado ao anunciante.
- [ ] Home, Instagram e discurso usam apenas números e provas verificáveis.
- [ ] Links compartilhados mostram prévia adequada; suporte e responsável pela aprovação estão acessíveis.
- [ ] Há alertas de erros/custo, conhecimento das cotas e procedimento de recuperação.

## Entregáveis desta revisão

- [Verificações realizadas e limitações](QA.md).
- [Bio, três posts fixados, roteiro e acompanhamento](INSTAGRAM.md).
- [Proposta de logo v1](marca/logo-conceito-v1.png) e [avatar v1](marca/avatar-instagram-v1.png).
- Prompts e verificações das imagens: [logo](marca/logo-conceito-v1-prompt.md) e [avatar](marca/avatar-instagram-v1-prompt.md).

As imagens são propostas raster para revisão; a etapa de finalização inclui vetor, versões claras/escuras e regras de uso. A conta Instagram ainda precisa ser criada/configurada pelo titular. As correções do primeiro ciclo foram implementadas no workspace e testadas no escopo descrito no QA; aplicação do banco, publicação e integração real permanecem pendentes.
