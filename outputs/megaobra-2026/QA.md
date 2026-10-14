# Verificações do diagnóstico — 14/10/2026

**Atualização:** o primeiro ciclo foi implementado no workspace; o gate completo passou. O usuário aplicou as migrações e a API confirmou as novas views, cotas e restrições anônimas. A publicação do aplicativo compatível ainda está em preparação. Os registros do diagnóstico inicial abaixo permanecem para comparação.

## Escopo do diagnóstico inicial

Revisão do repositório local e navegação pública de leitura em `https://mercadogeotecnico.com/`. Não foram criadas contas, enviados formulários, publicadas mudanças, acionadas chamadas pagas de IA ou lidos valores de `.env`.

O estado inicial já tinha modificações em `src/lib/ai-listing.ts` e `src/routes/publicar.tsx`, além de `.codex-tmp/` e `outputs/`. As análises consideram esse trabalho local em andamento. As duas modificações de código continuaram no estado de trabalho ao final dos comandos de build; não foram corrigidas nesta etapa.

## Gates locais

| Verificação | Resultado | Interpretação |
| --- | --- | --- |
| TypeScript, `tsc --noEmit` | **Falhou**, saída 2 | `src/lib/ai-listing.ts:179`: `leadingCandidate.confidence_percent` possivelmente indefinido. Linha 180: `leadingCandidate` possivelmente indefinido. |
| ESLint, `eslint . --format json` | **Falhou**, saída 1 | 227 erros e 8 avisos, em 22 arquivos com ocorrências. O escopo inclui `.codex-tmp`, arquivo gerado de `.netlify`, `eslint.config.js` e código de `src`; a quantidade total não representa apenas falhas do produto. Há várias ocorrências de formatação. |
| Build de produção, `node node_modules/vite/bin/vite.js build` | **Passou**, saída 0 | Build cliente/servidor concluído. Executado com o Node instalado; o script `build` do projeto é `vite build`. Isso não substitui typecheck nem comprova a configuração remota de deploy. |
| Testes automatizados/CI versionados | **Não encontrados** | `package.json` não tem script de testes; não foi localizada suíte/workflow versionado para os fluxos essenciais. |

A primeira tentativa de build usando o runtime Bun do executor local atingiu 70 segundos e foi inconclusiva. A verificação seguinte usou explicitamente `C:/Program Files/nodejs/node.exe` e concluiu em aproximadamente 53 segundos, incluindo ambas as etapas do build. O comando/configuração do ambiente Netlify deve ser validado no próprio ambiente antes da entrega.

## Site público

Navegação em Chromium, com viewport emulado; não equivale a teste em aparelho físico ou rede 4G.

| Página/checagem | Observação |
| --- | --- |
| Home, 390 px | HTTP 200; título e conteúdo renderizaram; sem overflow horizontal; nenhuma falha HTTP >=400 ou exceção de página observada na carga inicial. |
| `/publicar`, 390 px, visitante | HTTP 200; informa necessidade de empresa aprovada e oferece entrada. Sem overflow horizontal. |
| `/cadastro`, 390 px | HTTP 200; opções de usuário e empresa visíveis. Sem overflow horizontal. |
| `/entrar`, 390 px | HTTP 200; campos de e-mail/senha, recuperação de senha e cadastro visíveis. Sem overflow horizontal. |
| `/cadastro/empresa`, 390 e 320 px | HTTP 200; formulário e descrição da aprovação renderizaram sem overflow horizontal. Nenhum dado foi submetido. |
| Home, 1440 px | HTTP 200; sem overflow horizontal. Após rolar até o CTA e concluir a animação, aparecem 9.430+ anúncios, 1.240+ empresas e 870 negócios/mês. Código local define esses valores como constantes. |
| Metadados da home | Há `og:title`, `og:description`, `og:type` e `og:locale`; não foram encontrados `og:image`, `og:url` ou canonical nessa página. |
| Redes sociais da home | Não encontrados links para Instagram ou `wa.me` na navegação observada. |
| `/sitemap.xml` | HTTP 200, mas `<loc>` contém caminhos relativos como `/`, `/pecas` e `/empresas`. |
| `/robots.txt` | HTTP 200; permite rastreamento. |

[Captura da home em 390 px](qa/home-mobile-20261014.png). A captura mostra o tema escuro, navegação inferior e aviso de cookies. A ausência de overflow não garante que todos os elementos estejam adequados para toque, teclado ou leitores de tela.

## O que precisa ser validado na próxima etapa

- Migrations e privilégios efetivos do Supabase, incluindo RLS, funções expostas e visibilidade de contato.
- Isolamento entre duas empresas e entre papéis de visitante, usuário e admin.
- Entrega real de confirmação/recuperação, redirects de Auth e retomada do fluxo.
- Cadastro → aprovação → publicação → recebimento de contato/mensagem com contas controladas.
- Fotos, áudio e IA sob falha/lentidão; cotas, custo, timeout e alternativa manual.
- Aprovação e suporte com responsável disponível.
- Android/iPhone, 4G, upload de câmera e navegação com teclado.
- Preview de anúncio em WhatsApp, canonical e sitemap após correção.
- Planos e cotas Netlify/Supabase/provedor de IA; monitoramento, backups e restauração.
- Carga representativa no ambiente apropriado, com metas acordadas antes de prometer escala.

Os achados de segurança vieram de revisão de código; não foram executadas tentativas de exploração em produção. A existência de RLS é um ponto positivo, mas a correção das regras precisa ser exercitada com identidades distintas.

## Execução do primeiro ciclo — estado atual

### Gate final

`bun install --frozen-lockfile` passou sem mudanças. `bun run check` terminou com **saída 0** em aproximadamente **103 segundos**, no conjunto final de código.

| Etapa | Resultado e escopo |
| --- | --- |
| Typecheck | Passou; os dois erros da IA foram corrigidos preservando sua lógica de identificação/revisão. |
| Lint | Zero erros, oito avisos preexistentes de React Refresh. Todo `src`, testes e scripts seguem cobertos. Temporários/saídas não entram no lint. |
| Unitários | 31 testes passaram: autorização/cota antes de IA paga, entradas/bytes/MIME, custo com taxas sintéticas e retorno de login interno seguro. |
| PostgreSQL isolado | 20 migrações executadas; 55 verificações de acesso e 27 de cotas passaram. Fixtures das suítes revertidas. |
| Build | Cliente e servidor Vite/TanStack/Netlify passaram. |
| HTTP compilado | Três endpoints de IA retornaram 401 a chamadas anônimas, sem chamadas externas. Integração sintética validou sessão expirada 401, empresa pendente 403, cota 429, sucesso 200 e falha do provedor 502, com finalização de métricas. |
| Preview SSR | Páginas de peça e empresa renderizaram título/URL OG no HTML do servidor; anúncio incluiu foto. Dados/respostas sintéticos, sem acessar banco remoto. |
| Dependências de servidor | Varredura do JavaScript cliente gerado não encontrou símbolos `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `AI_MODEL_PRICES_JSON` ou `reserve_ai_request`. Isso comprova essa varredura específica, não uma auditoria geral de segredos. |

O runner PostgreSQL usa PGlite 0.5.9 com roles e funções mínimas de Auth/Storage, conforme [README dos testes](../../supabase/tests/README.md). A migração histórica de demonstração recebeu pré-requisitos sintéticos apenas no banco descartável; nenhuma migração foi pulada ou alterada. Isso não prova GoTrue/PostgREST/Storage reais nem concorrência hospedada.

O teste HTTP usa a entrada compilada real e SDKs reais com respostas de rede simuladas; nenhuma chamada paga ou requisição a serviços externos foi executada por esse teste. Custo de teste não é preço/medição de uso comercial.

### Alterações de produto

- Três funções de IA protegidas, limites de entrada/saída, cota durável, deadline e telemetria; botão explícito de preenchimento manual.
- Contato escolhido como restrito a login/desbloqueio; views públicas explícitas e telas com contato somente após RPC.
- Regras SQL para avaliação derivada, isolamento de empresas, suspensão de anúncios, mensagens e funções internas.
- Números sem fonte e promessas de escala removidos; cadastro de empresa destacado.
- Reenvio de confirmação, destino após login, status atualizável de aprovação, suporte real do Lucas e recuperação de erro de logo/catálogo.
- Placeholder explícito quando não há foto, vitrine limitada e sitemap absoluto/escapado.
- Canonical/OG gerais e metadata específica de peça/empresa renderizada no servidor.

### Estado remoto e operação

Antes da aplicação manual, consultas pela API confirmaram ausência de `companies_public`, `equipment_public` e `ai_limits` no Supabase remoto (HTTP 404/PGRST205). A conta controlada `lucasemb999@gmail.com` já existe e está confirmada; as configurações públicas indicam signup habilitado e confirmação de e-mail exigida.

O Auth remoto aceitou um envio de recuperação (HTTP 200) com destino solicitado `https://mercadogeotecnico.com/redefinir-senha`; Lucas confirmou chegada à **caixa de entrada**. Não houve troca de senha. Isso comprova esse envio/recebimento; não comprova confirmação de novo cadastro nem a lista de redirects configurada no painel.

A sessão Supabase no Chrome não tinha acesso ao identificador de projeto conectado. O usuário escolheu aplicar o SQL pelo painel; estão prontos [arquivo em transação](APLICAR-PRIMEIRO-CICLO.sql) e [instruções de aplicação/publicação](APLICAR-SQL.md). O pacote foi comparado às duas migrações e contém ambas integralmente, com um `begin` e um `commit` externos.

### Pendências para concluir o objetivo

| Critério | Evidência atual | Falta comprovar |
| --- | --- | --- |
| Recusa/cota de IA | HTTP compilado + SQL local aprovados | Ambiente remoto atualizado, concorrência real e uma execução controlada com preço/uso verificado. |
| Isolamento/contato | SQL A/B/anônimo/admin aprovado | JWT/PostgREST e telas reais após aplicar/publicar. |
| Suspensão | SQL esconde anúncio ativo de empresa rejeitada | Mesma regra no banco remoto. |
| Gates | Gate local completo aprovado; CI preparado | Execução remota do workflow após enviar o código. |
| E-mail | Recuperação recebida na caixa controlada | Novo cadastro/confirmacão, redirects e entrega fora da equipe. |
| Jornada mobile | UI atualizada e testes de código | Cadastro → confirmação → aprovação → anúncio → primeiro contato em aparelho real. |
| Anúncio/falhas | Placeholder, revisão e formulário manual implementados | Fotos/textos reais do piloto e recuperação de rede/IA exercitada no aparelho. |
| Lead/mensagem | SQL de desbloqueio/notificações/mensagens aprovado | Contato entregue ao anunciante pelo serviço real. |
| Confiança/comunicação | Home local sem números fabricados; kit Instagram preparado | Publicação da versão correta e revisão dos anúncios/perfil reais. |
| Compartilhamento/suporte | HTML SSR de teste e suporte autorizado no código | Prévia no WhatsApp com URL publicada; Lucas operando aprovação/suporte. |
| Alertas/recuperação | Logs e cotas implementados; runbook preparado | Alertas/canal, orçamento, planos, backup/restauração e rollback ensaiados. |

O objetivo permanece inconcluso. Nenhuma evidência desta revisão permite marcar todas as condições de divulgação como concluídas.

## Migração remota aplicada — confirmação em 14/10/2026

O usuário executou o pacote no painel e obteve `exists = true` para os três objetos. A conferência posterior pelo PostgREST real confirmou:

| Requisição | Resultado |
| --- | --- |
| `companies_public` anônimo | HTTP 200; duas empresas retornadas; nenhum contato ou CNPJ preenchido na projeção consultada. |
| `equipment_public` anônimo | HTTP 200; três anúncios amostrados; nenhum contato/CNPJ na empresa aninhada. |
| Contatos em `companies` anônimo | HTTP 200 com zero linhas, conforme RLS. |
| `ai_limits` anônimo | HTTP 401 / PostgreSQL `42501`. |
| `reserve_ai_request` anônimo | HTTP 401 / `42501`; não houve reserva ou chamada paga. |
| `unlock_equipment_contact` anônimo | HTTP 401 / `42501`; nenhum contato desbloqueado. |
| `ai_limits` com credencial do servidor | HTTP 200; assistência habilitada, 6 solicitações/minuto, 60 unidades/conta/dia e 1.200 unidades/dia globais. |

A presença dos objetos e as restrições acima estão comprovadas no ambiente remoto. As linhas de pendências da seção anterior devem ser interpretadas com essa atualização: aplicação do SQL já ocorreu; ainda faltam publicação compatível e teste autenticado completo. Nenhuma senha, telefone de anunciante ou credencial foi impresso na conferência.

O domínio público ainda respondeu com sitemap relativo e sem `og:image`, sinais da versão anterior do aplicativo. O Netlify neste navegador está deslogado. Preparação de branch/prévia prossegue antes de publicar a versão nova; não reaplicar o SQL.
