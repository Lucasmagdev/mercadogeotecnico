# Operação do Mercado Geotécnico — primeiro ciclo

Atualizado em 14/10/2026, horário de São Paulo. Preparação para visitar a Megaobra em 24–26/11/2026, sem estande.

**Estado mais recente:** migrações aplicadas pelo titular, CI remoto aprovado e prévia no ar. A jornada real de Auth/PostgREST passou com contas temporárias e limpeza. IA autenticada na prévia retornou 503 e aguarda conferir ambiente do Netlify. Evidências consolidadas em [VALIDACAO-REMOTA.md](VALIDACAO-REMOTA.md).

## Gate de código

Ambiente reproduzível: Node 24.15.0 e Bun 1.3.14, com dependências no `bun.lock`. Bun executa os testes unitários; PGlite 0.5.9 foi acrescentado como dependência de desenvolvimento para executar SQL real em banco descartável.

```sh
bun install --frozen-lockfile
bun run check
```

`check` interrompe na primeira falha e executa, nesta ordem:

1. `bun run typecheck` — TypeScript do produto, sem emitir arquivos.
2. `bun run lint` — ESLint do repositório, incluindo todo `src`.
3. `bun run test` — testes Bun em `tests/` e suítes SQL em PostgreSQL PGlite isolado.
4. `bun run build` — build de produção do Vite/TanStack/Netlify.
5. `bun run test:server` — endpoints HTTP compilados e preview SSR, com respostas sintéticas de Auth/banco/provedor e nenhuma chamada externa.

O ESLint exclui somente `.codex-tmp/`, `.netlify/`, `dist/`, `outputs/`, `.output/` e `.vinxi/`, além das exclusões padrão de dependências do ESLint. Nenhum componente, rota, biblioteca ou arquivo gerado dentro de `src` foi excluído para esconder falhas.

O workflow [check.yml](../../.github/workflows/check.yml) executa o mesmo comando em pushes e pull requests, com instalação congelada. Utiliza placeholders locais de Supabase, sem segredos de produção, e não publica o projeto. O código já foi enviado; os checks do push e da PR passaram, conforme [VALIDACAO-REMOTA.md](VALIDACAO-REMOTA.md). As versões das ações seguem suas documentações oficiais: [checkout](https://github.com/actions/checkout), [setup-node](https://github.com/actions/setup-node) e [setup-bun](https://github.com/oven-sh/setup-bun).

As suítes SQL exercitam regras PostgreSQL/RLS reais, incluindo A/B/anônimo/admin. Auth/Storage são simulações mínimas no runner; os testes HTTP usam respostas sintéticas. Isso não substitui JWT/PostgREST/Storage/SMTP reais ou concorrência entre workers hospedados. Aprovar o gate não significa que as migrações foram aplicadas ou que o ambiente publicado está pronto.

## Evidências locais e limites de acesso

| Item | Inspeção em 14/10/2026 | Consequência |
| --- | --- | --- |
| Node / Bun / npm | 24.15.0 / 1.3.14 / 11.12.1 disponíveis | Gate pode rodar localmente. |
| Docker | CLI disponível; Desktop foi iniciado, mas API do engine respondeu 500 e depois expirou | Supabase local completo não pôde ser usado; SQL foi executado em PGlite. |
| CLI Supabase / psql / CLI Netlify | Não encontrados no PATH | Não houve dump nem aplicação de migração remota. |
| Configuração Supabase local | `supabase/config.toml` ausente | Falta preparar ambiente isolado para integração. |
| Vínculo Netlify | Estado local presente, sem `siteId`; integração GitHub gerou a prévia do projeto `mercadogeotecnico` | Prévia validada; painel deslogado e publicação no domínio principal pendente. |
| GitHub | CLI autenticada, permissão administrativa no repositório; PR em rascunho e dois checks remotos aprovados | Proteção de branch e merge/publicação ainda não foram executados. |
| Credenciais | Utilizadas internamente para consultas, teste de e-mail e ensaio autenticado autorizado | Nenhum segredo impresso ou publicado. Views/cotas novas estão aplicadas; sessões e contas temporárias de QA foram encerradas/removidas. |
| Painel Supabase | Sessão Chrome estava em organização com outros projetos; acesso ao identificador conectado redirecionou | Usuário aplicou o SQL manualmente; agente validou APIs e removeu os registros temporários do ensaio. |
| Responsável | Lucas, `lucasemb999@gmail.com`, WhatsApp `5531991666106`, conforme autorizado | Contatos inseridos em suporte, aprovação, rodapé e política. |

Nomes encontrados em `.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `keysender`, `OPENAI_API_KEY`. Nome encontrado em `.env.local`: `SUPABASE_SERVICE_ROLE_KEY`. Não foram encontrados nomes de conexão direta PostgreSQL, SMTP ou monitoramento nos arquivos inspecionados. Presença de um nome não comprova validade, permissões, entrega de e-mail ou configuração equivalente no Netlify.

## Configuração de IA no servidor

O primeiro ciclo passa a exigir sessão válida, empresa aprovada e reserva durável de cota antes de chamar o provedor. Sem credenciais, schema ou autorização, a assistência deve falhar de modo fechado e o preenchimento manual deve continuar disponível.

| Variável | Uso |
| --- | --- |
| `OPENAI_API_KEY` | Credencial do provedor, somente no servidor. |
| `SUPABASE_SERVICE_ROLE_KEY` | Obrigatória no servidor para reserva/finalização de cota; nunca prefixar com `VITE_`. |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Alternativas de configuração do servidor; código aceita fallback às variáveis públicas `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`. |
| `OPENAI_LISTING_MODEL`, `OPENAI_SPECS_MODEL`, `OPENAI_TRANSCRIBE_MODEL` | Opcionais; preservam os defaults do código quando ausentes. Confirmar disponibilidade no projeto do provedor antes do smoke test pago. |
| `AI_MODEL_PRICES_JSON` | Opcional; mapa por nome exato do modelo para estimativa de custo. Não é um limite financeiro. |

Formato de `AI_MODEL_PRICES_JSON`: objeto `modelo -> { inputUsdPerMillion, cachedInputUsdPerMillion?, outputUsdPerMillion, audioUsdPerMinute? }`. Preencher com preços oficiais verificados na data da operação. Sem preço/uso compatível, custo estimado deve permanecer desconhecido; não tratar ausência como custo zero.

A migração [20261014000002_ai_request_limits.sql](../../supabase/migrations/20261014000002_ai_request_limits.sql) define `ai_limits`, `ai_request_usage`, `reserve_ai_request` e `finish_ai_request`, com acesso privilegiado restrito ao servidor. Foi aplicada pelo titular e conferida no projeto conectado: 6 requisições/minuto por usuário, 60 unidades/dia por usuário e 1.200 unidades/dia global, com virada diária em UTC. São unidades operacionais, não dólares. O controle `ai_limits.enabled` permite suspender a assistência; o ensaio hospedado dessa suspensão continua pendente. Para ajustar o servidor, siga [CONFIGURAR-NETLIFY.md](CONFIGURAR-NETLIFY.md).

Logs estruturados previstos no servidor: `ai_reservation_denied`, `ai_provider_usage` e `ai_operation`, com identificador da requisição, operação, duração, status e uso quando informado pelo provedor. Não registrar token de sessão, chave, áudio ou conteúdo de anúncio. Coleta, retenção, destinatário de alertas e orçamento diário em USD ainda precisam de configuração operacional.

O prazo de 45 segundos inclui autenticação, aprovação/reserva e as etapas do provedor; a gravação final tem teto próprio de 5 segundos. Isso deixa margem para a resposta dentro do limite síncrono de 60 segundos documentado pelo Netlify. Limite de fotos/áudio foi escolhido para manter o payload base64 abaixo do teto de 6 MB. [Limites oficiais](https://docs.netlify.com/build/functions/configuration/).

## Backend e ensaio de integração

Próximo ensaio deve usar Supabase local ou projeto de homologação isolado. A documentação oficial exige CLI e runtime de containers para `supabase start` no Windows: [desenvolvimento local](https://supabase.com/docs/guides/local-development). O Docker disponível nesta máquina ainda precisa estar em execução; a configuração local não existe.

1. Preparar runtime e CLI com versão fixada; criar configuração local sem vincular produção.
2. Aplicar a sequência completa das migrações a um banco descartável e capturar o resultado. Não executar os seeds comerciais em produção como parte desse teste.
3. Criar duas empresas de teste, uma aprovada e outra pendente, e dois usuários. Validar anon, usuário A, usuário B e servidor privilegiado.
4. Provar isolamento de anúncios, leads, conversas, favoritos e objetos do Storage; verificar leitura pública apenas do conteúdo permitido.
5. Provar reserva simultânea de IA em mais de um worker, esgotamento por usuário e global, falha do provedor e tentativa de chamada por empresa pendente. Falhas e timeouts não podem devolver unidades de modo que permita contornar a cota.
6. Exercitar cadastro, confirmação de e-mail, recuperação de senha e callback. Localmente, o Supabase oferece Mailpit para inspecionar os e-mails sem destinatário real: [testes locais](https://supabase.com/docs/guides/local-development/cli/testing-and-linting).

O runner local executou todas as 20 migrações com pré-requisitos sintéticos da antiga migração de demonstração, 55 verificações de acesso e 27 de cotas; fixtures das duas suítes foram revertidas. Depois da aplicação manual do SQL, o ensaio real de Auth/PostgREST criou contas e um anúncio temporários explicitamente identificados como QA, validou autorização, lead/mensagem, avaliação, suspensão e seis reservas simultâneas permitidas com uma recusada. Todos esses registros foram removidos e a limpeza foi verificada. Storage real, jornada completa pela interface e concorrência entre workers de IA permanecem pendentes. Veja [VALIDACAO-REMOTA.md](VALIDACAO-REMOTA.md).

## E-mail de autenticação

O SMTP padrão do Supabase não é destinado à produção e restringe destinatários a endereços autorizados da equipe. Isso afeta diretamente cadastros feitos após a feira. Confirmar configuração de SMTP próprio no painel, domínio remetente, autenticação DNS, URLs de redirecionamento e limites de envio antes de convidar empresas externas. [Fonte oficial](https://supabase.com/docs/guides/auth/auth-smtp).

`keysender` é apenas um nome encontrado no ambiente local; não foi encontrado uso no código inspecionado e ele não comprova a configuração de SMTP do Supabase Auth. Lucas confirmou chegada na caixa de entrada tanto da recuperação para `lucasemb999@gmail.com` quanto da confirmação para o alias temporário de cadastro. Nenhuma senha do titular foi alterada. O callback da confirmação e a entrega a endereços externos à equipe continuam pendentes. O painel de SMTP/redirects ainda precisa ser verificado.

## Deploy, rollback e alertas

Antes de publicar, registrar commit, identificador do último deploy estável, migrações necessárias e quem pode operar Netlify/Supabase. Validar a versão candidata em preview com ambiente separado. O Netlify permite republicar um deploy bem-sucedido anterior pelo botão **Publish Deploy**; novos deploys automáticos podem substituí-lo, portanto o ensaio também precisa tratar o auto publishing. [Procedimento oficial](https://docs.netlify.com/deploy/manage-deploys/manage-deploys-overview/).

Rollback do aplicativo não desfaz schema nem dados do Supabase. Para cada migração, registrar compatibilidade com a versão anterior, backup disponível e procedimento específico de recuperação. Não executar rollback SQL genérico ou restaurar backup sem avaliar os dados gravados desde o backup.

Pendências operacionais antes da feira:

- Confirmar acesso dos responsáveis aos painéis e configurar proteção do branch com o gate obrigatório.
- Manter migrações já aplicadas; preparar ambiente de homologação separado e ensaio de recuperação sem reaplicar o pacote de criação no projeto conectado.
- Validar SMTP, confirmação e recuperação de senha a partir do domínio final.
- Configurar monitoramento de disponibilidade, erros de servidor, falhas de e-mail, rejeições de cota e consumo/custo de IA, com canal e responsável definidos.
- Definir orçamento de IA e limiares de alerta; preço estimado em log não bloqueia gastos por si só.
- Ensaiar suspensão de IA mantendo publicação manual, rollback de deploy e recuperação de dados no ambiente isolado.
- Guardar demonstração curta gravada, conta de teste e roteiro de contato para uso durante a feira.

## Registro do gate deste ciclo

`bun install --frozen-lockfile` passou sem mudanças. `bun run check` passou no conjunto final, saída 0, em aproximadamente 103 segundos: typecheck, lint (zero erros e oito avisos React Refresh preexistentes), 31 testes unitários, 82 verificações SQL com 20 migrações, build cliente/servidor e testes HTTP do servidor compilado, incluindo prévias SSR de peça e empresa. Os testes de servidor não enviaram solicitações remotas nem consumiram IA paga.

Uma execução intermediária expirou em 210 segundos durante o build; ela não foi contabilizada como aprovação. O processo terminou e a execução final confirmou todos os gates. Finais de linha são aceitos por plataforma no Prettier; `.gitattributes` padroniza os arquivos de código para LF nos próximos checkouts. Nenhum diretório de código do produto foi retirado do lint.

Aplicação pelo usuário está preparada em [APLICAR-PRIMEIRO-CICLO.sql](APLICAR-PRIMEIRO-CICLO.sql), com [instruções e compatibilidade](APLICAR-SQL.md). A meta permanece em andamento até validar o banco, a publicação e o fluxo real.
