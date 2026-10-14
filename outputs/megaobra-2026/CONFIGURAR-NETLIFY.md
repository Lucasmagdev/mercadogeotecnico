# Configurar a IA no Netlify — 14/10/2026

A prévia está publicada e o banco já recebeu o SQL. A IA autenticada retornou 503; isso ainda não identifica qual configuração ou dependência está indisponível. Lucas escolheu ajustar as variáveis manualmente.

## 1. Abrir o projeto correto

Abra o [projeto Mercado Geotécnico no Netlify](https://app.netlify.com/projects/mercadogeotecnico/) e localize **Environment variables** nas configurações do projeto. Confira o nome do projeto antes de salvar.

## 2. Conferir as variáveis

| Nome exato | Valor a usar | Escopo |
| --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave `service_role` do mesmo projeto Supabase do site. Está configurada localmente em `.env.local`. | **Functions**, ou **All scopes** se a conta não oferecer seleção individual. |
| `OPENAI_API_KEY` | Chave válida do projeto OpenAI usado pelo site. Há configuração local em `.env`; preserve o valor do painel se ele já estiver correto. | **Functions**, ou **All scopes**. |
| `VITE_SUPABASE_URL` | `https://bxbuczlauduamijveozf.supabase.co` | **Builds**, ou **All scopes**. |
| `VITE_SUPABASE_ANON_KEY` | Chave pública `anon` desse mesmo projeto Supabase; preserve a configuração existente se correta. | **Builds**, ou **All scopes**. |

Para cada variável, confira os valores nos contextos **Deploy Previews** e **Production**. O primeiro atende a PR; o segundo será usado quando a versão chegar ao domínio principal. Um valor definido só em Production pode deixar a prévia sem acesso.

Se houver `SUPABASE_URL` ou `SUPABASE_ANON_KEY` já configuradas, elas têm prioridade no servidor e também precisam apontar ao projeto correto. Não é necessário criá-las: o código aceita as duas variáveis públicas da tabela como alternativa.

As duas primeiras variáveis são segredos de servidor: mantenha exatamente esses nomes, sem prefixo `VITE_`, e não envie seus valores pelo chat ou ao GitHub. A chave `anon` não substitui a `service_role`. O Netlify não carrega automaticamente os arquivos `.env` desta máquina durante o build remoto. [Documentação de ambiente](https://docs.netlify.com/build/configure-builds/environment-variables/).

## 3. Gerar uma nova prévia

Depois de salvar, abra **Deploys**, localize o deploy da PR **#1**, branch `fix/megaobra-primeiro-ciclo`, e use a opção de repetir o deploy (**Retry deploy**). Confira que está repetindo a prévia dessa PR.

Espere o deploy terminar e abra a [prévia da PR #1](https://deploy-preview-1--mercadogeotecnico.netlify.app/). As variáveis das funções ficam associadas ao momento do deploy; apenas salvar no painel não atualiza uma função já publicada. [Documentação das variáveis de Functions](https://docs.netlify.com/build/functions/environment-variables/).

Avise quando a nova prévia estiver pronta. Não é necessário reenviar o SQL nem compartilhar qualquer chave. O domínio principal continua aguardando a promoção desta versão.

## 4. Validação seguinte

Com o novo deploy pronto, repetir a chamada autenticada e verificar os logs do servidor. A prova deve distinguir autenticação, aprovação, cota e acesso ao provedor. Depois, executar uma chamada controlada e medir duração e uso. A publicação manual precisa continuar funcionando em caso de falha.

Os modelos padrão permanecem os do projeto: `gpt-5.6-terra`, `gpt-5.6-luna` e `gpt-4o-mini-transcribe`. As variáveis `OPENAI_LISTING_MODEL`, `OPENAI_SPECS_MODEL` e `OPENAI_TRANSCRIBE_MODEL` são opcionais; confirmar acesso aos modelos antes do ensaio pago. Um erro de modelo deve ser diagnosticado com o retorno do provedor.

`AI_MODEL_PRICES_JSON` é opcional e aceita preços verificados por nome exato de modelo, no formato documentado em [OPERACAO.md](OPERACAO.md). Sem preço ou uso compatível, o custo fica desconhecido. As cotas do banco limitam unidades operacionais, não dólares; definir orçamento e alertas continua pendente.
