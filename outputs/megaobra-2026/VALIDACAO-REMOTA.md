# Validação remota após aplicação do SQL — 14/10/2026

**Banco aplicado e confirmado. Prévia publicada e verificada. IA ainda indisponível na prévia (503), aguardando conferir configuração no Netlify. O domínio de produção ainda não recebeu esta versão.**

- Código candidato: commit `1db20d2`, branch `fix/megaobra-primeiro-ciclo`.
- [PR em rascunho](https://github.com/Lucasmagdev/mercadogeotecnico/pull/1).
- [Prévia Netlify](https://deploy-preview-1--mercadogeotecnico.netlify.app/).
- [CI do push aprovado](https://github.com/Lucasmagdev/mercadogeotecnico/actions/runs/38579866821).
- [CI da PR aprovado](https://github.com/Lucasmagdev/mercadogeotecnico/actions/runs/38579970992).

## Migração

O usuário executou o SQL pelo painel e obteve os três objetos presentes. A conferência pelo PostgREST confirmou:

- Views de empresas e anúncios retornam dados públicos sem telefone, WhatsApp, site ou CNPJ.
- A tabela privada de empresas retorna zero linhas para visitante.
- Leitura de `ai_limits`, reserva de cota e desbloqueio de contato recusam visitante com HTTP 401 / `42501`.
- Configuração real: assistência habilitada, 6 solicitações/minuto por conta, 60 unidades/conta/dia e 1.200 unidades/dia no conjunto.

O SQL já foi aplicado. Não executar novamente o pacote de criação.

## Site candidato

Home, empresas, cadastro de empresa e publicação responderam 200 na prévia. Em Chromium com viewport de 390 × 844 px, as quatro páginas não apresentaram overflow horizontal nem exceção de página. Catálogo e empresas carregaram do backend real. Contatos de suporte estavam acessíveis, números fabricados ausentes e o login preservou o destino de cadastro/publicação.

O sitemap da prévia usa URLs absolutas. Há `og:image` nos metadados gerais. As três funções de IA responderam 401 a chamadas HTTP anônimas no Netlify, sem chamada paga.

Isso é teste de viewport em navegador, não teste em aparelho físico nem comprovação de preview no WhatsApp.

## Jornada autenticada pelo Auth/PostgREST reais

Foram usadas duas contas temporárias em aliases da caixa controlada informada pelo usuário. A primeira foi criada pelo signup público; a segunda foi preparada pela API administrativa para o papel de comprador/empresa B. O teste usou uma sessão nova do administrador já existente, sem alterar seu papel ou senha, e encerrou apenas essa sessão de teste ao concluir.

O signup público exigiu confirmação de e-mail e aceitou o envio da confirmação. Lucas confirmou que esse e-mail chegou à caixa de entrada. A confirmação da conta A foi feita administrativamente para o ensaio; o callback pelo link recebido continua pendente.

| Verificação real | Resultado |
| --- | --- |
| Signup gera empresa pendente | Passou para as duas contas. |
| Empresa pendente tenta publicar/aprovar a si própria | Publicação recusada; aprovação/verificação própria não ocorreu. |
| Empresa A tenta alterar B | Nenhuma linha de B alterada. |
| Administrador aprova empresa A | Status aprovado e notificação de aprovação entregues. |
| Empresa aprovada publica anúncio | Registro temporário explicitamente identificado como QA apareceu no catálogo. |
| Visitante e comprador consultam contato privado | Projeção pública sem contato; comprador não leu a tabela privada da outra empresa. |
| Comprador desbloqueia contato duas vezes | Recebeu contato controlado e gerou apenas um lead para o anunciante. |
| Comprador envia mensagem | Mensagem recebida pelo anunciante na conversa do item correto. |
| Avaliação de comprador | Nota/contagem recalculadas; proprietário recebeu `42501` ao tentar inventar nota e contagem. |
| Sete reservas simultâneas de cota | Seis aprovadas e uma recusada por `AI_QUOTA`, em requisições reais ao Supabase. Nenhum provedor pago acionado. |
| Proprietário tenta reservar cota diretamente | RPC privilegiado recusou com `42501`. |
| Administrador rejeita empresa com anúncio ativo | Anúncio desapareceu da view e da consulta direta anônima à tabela. |
| Limpeza | Contas, empresas, anúncio e registros dependentes temporários removidos; ausência verificada. |

O anúncio temporário não representava estoque ou oferta comercial e ficou identificado como teste. Nenhuma mensagem foi enviada a anunciante/usuário externo às contas controladas. As senhas e tokens de teste permaneceram em memória e não foram impressos ou publicados.

Este ensaio comprova operações reais de Auth/PostgREST e entrega de lead/mensagem dentro do backend. Não comprova que uma pessoa concluiu toda a jornada pela interface de um celular.

## IA: pendência de ambiente

Após esgotar a cota da conta temporária, a chamada autenticada à função na prévia retornou **503**, em vez do 429 esperado com o servidor configurado. No código atual isso indica indisponibilidade de configuração/dependência antes de atingir o provedor; a mensagem pública não permite distinguir qual variável/dependência está faltando. Não tratar essa etapa como IA funcional.

Conferir `SUPABASE_SERVICE_ROLE_KEY` e `OPENAI_API_KEY` no contexto de servidor da prévia/produção do Netlify, além da URL e chave pública Supabase. Nunca usar prefixo `VITE_` na chave de serviço. Confirmar modelos e configurar taxas verificadas em `AI_MODEL_PRICES_JSON` antes da medição de custo real. A seleção de contexto de ambiente pode explicar uma diferença entre prévia e produção; não foi inspecionada no painel deslogado.

Lucas escolheu configurar as variáveis manualmente. O passo a passo está em [CONFIGURAR-NETLIFY.md](CONFIGURAR-NETLIFY.md). Não publicar credenciais no chat, no repositório ou em arquivo de relatório.

## Próximas provas

1. Conferir a configuração do servidor e repetir a recusa por cota no endpoint autenticado.
2. Medir uma chamada controlada de IA com tempo, uso e preço reais; testar falha com continuidade manual.
3. Validar o callback da confirmação de cadastro no domínio permitido; o recebimento na caixa de entrada já foi confirmado.
4. Percorrer a jornada pela interface em celular e conferir a prévia real do WhatsApp.
5. Promover a versão compatível ao domínio público, verificar os endpoints novamente e configurar alertas/recuperação.

As metas de empresas/anúncios piloto continuam sendo metas comerciais; os registros temporários de QA não contam como empresas ativadas.
