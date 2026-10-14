# Aplicação pelo painel — primeiro ciclo

Você escolheu aplicar o SQL pelo painel Supabase. Nenhuma migração remota foi executada pelo agente.

**Atualização de 14/10:** você aplicou o arquivo e a conferência pela API confirmou os três objetos, as projeções sem contato e a recusa anônima dos RPCs privilegiados. **Esta etapa já foi concluída; não execute novamente.** Prossiga com a publicação da versão compatível e a validação autenticada.

## Arquivo e projeto

Use [APLICAR-PRIMEIRO-CICLO.sql](APLICAR-PRIMEIRO-CICLO.sql), que contém exatamente as duas migrações novas, envolvidas em uma transação. Não inclui seeds comerciais nem criação/exclusão de empresas ou anúncios.

O projeto conectado ao código é `bxbuczlauduamijveozf`. Confirme o identificador no painel antes de executar. A sessão Chrome observada nesta revisão estava em outra organização, sem acesso a esse projeto.

## Coordenação com o site

A nova versão do site lê `companies_public` e `equipment_public`. A migração restringe a tabela privada `companies`; por isso o código antigo pode deixar de mostrar empresas/contatos até entrar a nova versão. Prepare a publicação e escolha uma janela curta para aplicar banco e site juntos. Não publique a versão nova enquanto as views ainda estiverem ausentes.

1. Confirme o projeto, o backup/exportação disponível e o responsável pela publicação no Netlify. Não presuma que rollback de site restaura o banco.
2. Confira que as tabelas e funções da versão atual já existem; o arquivo contém alterações sobre o schema existente, não uma instalação vazia do Supabase.
3. No SQL Editor, abra uma consulta nova, cole o conteúdo inteiro do arquivo e execute **uma vez**. Um erro antes de `commit` aborta o conjunto, impedindo aplicação parcial. Copie o erro para diagnóstico; não apague tabelas nem execute seeds para contornar erros.
4. O resultado final deve indicar `exists = true` para `companies_public`, `equipment_public` e `ai_limits`.
5. Configure `SUPABASE_SERVICE_ROLE_KEY` e `OPENAI_API_KEY` somente no servidor do Netlify, além dos valores públicos Supabase já usados. A chave de serviço nunca deve ter prefixo `VITE_`.
6. Publique a versão nova do aplicativo e verifique catálogo, login, cadastro, contato e preenchimento manual. Sem configuração de IA ou cota, a assistência fica indisponível e o anúncio manual permanece disponível.
7. Avise quando o SQL estiver aplicado para conferir pela API a presença das views/RPCs e continuar o teste com contas controladas. Não envie chaves, senha de banco ou tokens pelo chat.

Não execute novamente o mesmo arquivo se a primeira aplicação concluiu: ele cria objetos novos e o segundo envio pode acusar que já existem. Se a execução falhou, confirme que foi abortada e compartilhe apenas a mensagem de erro, sem segredos.

## O que muda

- Contatos e CNPJ saem das consultas públicas; desbloqueio autenticado registra o interessado.
- Empresas não aprovadas deixam de ter anúncios públicos, inclusive os anúncios que já estavam ativos.
- Nota/contagem derivadas das avaliações deixam de aceitar valores inventados pelo proprietário.
- Regras de mensagens e funções internas são restringidas; acesso do dono/admin permanece.
- A IA ganha cota persistente: 6 chamadas/minuto por conta, 60 unidades/dia por conta e 1.200 unidades/dia no conjunto. Rascunho custa 4 unidades, campos 1, áudio 2. São limites operacionais, não valores em dinheiro.

As migrações originais estão em `supabase/migrations/20261014000001_access_hardening.sql` e `20261014000002_ai_request_limits.sql`. Guarde o registro da execução; se depois for usar a CLI Supabase, reconcilie essas versões no histórico remoto antes de um `db push` para não reaplicá-las.

## Recuperação

Se apenas a IA apresentar problema, mantenha o site e suspenda a assistência com `update public.ai_limits set enabled = false where singleton;`. Isso não impede a publicação manual. A alteração deve ser feita pelo responsável no painel.

Para falha no catálogo após a migração, priorize publicar a versão compatível ou corrigir as views/permissões preservando a restrição de contatos. Voltar ao código antigo, sozinho, pode continuar incompatível. Não reabra contatos anonimamente como rollback automático.

Backup, restauração, publicação e monitoração remotos ainda precisam ser verificados. O teste local de SQL usa PostgreSQL PGlite com simulações de Auth/Storage e não substitui o teste real de PostgREST/Auth no Supabase.
