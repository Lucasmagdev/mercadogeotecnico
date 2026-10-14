# Tarefa: proteger assistência de IA e medir uso

Aberta e implementada no primeiro ciclo de 14/10/2026. **Estado: código e cotas validados; função autenticada na prévia retorna 503 e aguarda configuração manual do Netlify. Provedor e custo real ainda pendentes.** Veja [CONFIGURAR-NETLIFY.md](CONFIGURAR-NETLIFY.md).

## Resultado esperado

Somente uma sessão validada pelo Supabase Auth e vinculada a empresa aprovada pode acionar geração de rascunho, sugestão de campos ou transcrição. Entradas inválidas e limites excedidos devem falhar antes do provedor pago. O anunciante pode publicar preenchendo manualmente.

## Implementação

- `src/lib/ai-validation.ts`: Zod com MIME/base64, assinatura de arquivo, tamanho individual/total, quantidade de fotos e limites de texto/categorias.
- `src/lib/ai-policy.ts`: ordem de autenticação/aprovação/reserva e cálculo de uso/custo configurável.
- `src/lib/ai-guard.server.ts`: token validado por `auth.getUser`, verificação de empresa no banco e RPC de reserva somente com credencial do servidor; prazo total de 45 segundos e finalização de telemetria limitada a 5 segundos. Sem retries automáticos do provedor.
- `src/lib/ai-listing.ts`: as três funções protegidas, preservando a identificação/revisão existentes; teto de saída para cada chamada e dois erros de tipos corrigidos.
- `src/routes/publicar.tsx`: envio do token no header, compressão das fotos para a análise, limite de gravação e tamanho, formulário manual explícito e mensagem de foto ausente.
- `20261014000002_ai_request_limits.sql`: cotas por conta/minuto, conta/dia e conjunto/dia, compartilhadas entre workers; falhas continuam consumindo a reserva. Controle para suspender assistência sem parar o cadastro manual.

## Evidência

- Testes unitários de autorização, entradas, bytes e custo calculado com taxas sintéticas.
- SQL executado em PostgreSQL PGlite isolado: permissões, empresa aprovada, cotas/minuto/dia/global, reset de janelas, falhas sem reembolso e controle de suspensão.
- Testes HTTP dos três endpoints compilados: anônimo recebe 401 sem nenhuma chamada externa. Integração sintética cobre sessão expirada (401), empresa pendente (403), cota excedida (429), sucesso (200) e falha do provedor (502), incluindo gravação de tempo/tokens/custo.

As taxas sintéticas dos testes não são preços comerciais. Nenhuma chamada paga foi realizada neste ciclo. Para medir custo real, preencher `AI_MODEL_PRICES_JSON` com taxas verificadas do projeto/modelo e executar um anúncio controlado após atualizar banco/servidor. Sem taxas ou uso compatíveis, a estimativa permanece `null`; os logs não fingem custo zero.

## Aceitação em ambiente real

- [ ] Migração aplicada e segredos disponíveis apenas no servidor.
- [ ] Anônimo, sessão inválida e empresa não aprovada recusados no domínio publicado.
- [x] Cota respeitada em chamadas concorrentes no Supabase real: sete reservas simultâneas, seis aceitas e uma recusada, sem chamar provedor pago; registros temporários removidos.
- [ ] Uma execução controlada real registra duração, tokens/áudio e custo com preço verificado.
- [ ] Falha de rede/limite/timeouts permite continuar manualmente com os dados já preenchidos.
- [ ] Lucas recebe alertas operacionais de erros/cotas/orçamento pelo canal configurado.

Configuração, limites e recuperação estão em [OPERACAO.md](OPERACAO.md). Aplicação manual em [APLICAR-SQL.md](APLICAR-SQL.md).

Atualização: SQL aplicado e conferido; endpoints anônimos da prévia recusam com 401. A chamada autenticada da conta aprovada retornou 503, portanto a configuração do servidor e o funcionamento pago da IA ainda não estão validados. Ver [ensaio remoto](VALIDACAO-REMOTA.md).
