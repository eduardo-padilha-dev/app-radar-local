# Plano — Issue #3

## Decisões técnicas

- Usar os modelos `User` e `EmailVerification` da US01. Reaproveitar a geração, o hash SHA-256 e a validade do `VerificationToken`, a construção do link público e o adaptador de e-mail existente. A primeira versão usa o esquema atual.
- A página `/confirmar-email?token=…` lê o token e chama `POST /auth/verify-email` com `{ token }`. A resposta de sucesso contém `data.status` com `confirmed` ou `already-confirmed`. A API devolve `VERIFICATION_LINK_INVALID` (400) ou `VERIFICATION_LINK_EXPIRED` (410) para os estados correspondentes. A API documenta o contrato via Swagger. A navegação abre a página e o envio explícito da requisição pela aplicação grava a confirmação. Excluir o token de logs da aplicação e das respostas. Manter a URL original disponível para reabrir o link após falha e evitar o envio dessa URL como referenciador nas chamadas da página.
- Confirmar e marcar o token como usado na mesma transação. Serializar confirmação e nova emissão para a mesma conta, relendo o estado dentro da transação. Conferir a associação ao endereço atual e manter o instante da primeira confirmação. Na repetição, usar o vínculo do token conhecido com o endereço confirmado para retornar o estado anterior. Um link já usado para aquele endereço conserva essa resposta depois da sua validade original.
- `POST /auth/resend-verification` recebe `{ email }` e reaproveita a normalização do cadastro. Para endereço sintaticamente válido, devolver HTTP 202 com o mesmo corpo em todos os resultados previstos, incluindo falha do provedor. Usar uma janela de resposta comum que inclua o tempo limite do adaptador, sem devolver ao cliente o resultado do provedor. Registrar falhas operacionais com informações seguras. Persistir o novo link antes de chamar o provedor e manter a chamada fora da transação. Confirmações e reenvios utilizam a mesma trava transacional por conta, de modo que o intervalo por conta sobreviva a recargas e solicitações paralelas. O intervalo proposto é de 60 segundos, calculado a partir da emissão mais recente, com o mesmo intervalo exibido na tela em todos os resultados previstos, inclusive quando a rede falha.
- A tela de link expirado pede o endereço. O cadastro reaproveita o endereço informado quando o envio inicial fica sem confirmação. Ambas as telas usam o mesmo estado de reenvio, conservam o endereço durante a tentativa e aplicam o prazo exibido. Usar os tokens visuais e padrões de acessibilidade já adotados no cadastro.
- A regra de acesso verifica o estado persistido da conta no servidor. Manter a ligação futura à US04 explícita no código com `TODO US04` e acrescentar a referência ao número quando a issue existir, conforme a premissa da spec. A regra opera antes de qualquer etapa de busca ou consumo.
- Testes da API usam o PostgreSQL de testes e o adaptador de e-mail substituído. Testes de interface montam as páginas reais com transporte controlado. Controlar o relógio nos limites de validade, no prazo de reenvio e nas falhas do provedor. Para o fechamento, executar `npm test`, `npm run lint`, `npm run typecheck` e `npm run build`.

## Tarefas

- [x] **Tarefa 1 — Confirmar e-mail ao abrir link válido**
  - Cobre: CA1.
  - Teste primeiro: emitir um link pelo cadastro e abri-lo pela rota real com a API de teste ou transporte controlado no teste de interface. O teste HTTP deve confirmar o e-mail, marcar o token como usado na mesma operação, preservar o estado da demonstração e comprovar que a resposta não inicia sessão. Simular falha de gravação para verificar que as duas alterações são revertidas juntas. O teste de interface deve mostrar “E-mail confirmado”. O RED vem da ausência da rota, da operação e da página.
  - Arquivos previstos: `apps/api/test/email-verification.e2e-spec.ts`, `apps/api/src/modules/auth/{auth.controller.ts,auth.service.ts,verification-token.ts,dto/verify-email.dto.ts,dto/email-verification-result.dto.ts}`, `apps/web/src/app/router/index.ts`, `apps/web/src/features/auth/{VerifyEmailPage.vue,VerifyEmailPage.spec.ts,email-verification.service.ts,useEmailVerification.ts}`, `apps/web/index.html`, `apps/web/vite.config.ts`.

- [x] **Tarefa 2 — Informar por que o link não pode ser usado**
  - Cobre: CA2.
  - Teste primeiro: testar token ausente, malformado, desconhecido, associado a outro endereço e exatamente no limite de 24 horas. Verificar respostas distintas para expiração e invalidade, sem mudar o estado persistido. A interface deve distinguir os resultados e exibir a opção de reenvio para o expirado. A emissão real pelo botão entra na tarefa 5. O RED vem das respostas ou estados ainda ausentes.
  - Arquivos previstos: `apps/api/test/email-verification.e2e-spec.ts`, `apps/api/src/modules/auth/{auth.controller.ts,auth.service.ts,dto/verify-email.dto.ts}`, `apps/api/src/common/api-exception.filter.ts`, `apps/web/src/features/auth/{VerifyEmailPage.vue,VerifyEmailPage.spec.ts,email-verification.service.ts,useEmailVerification.ts}`.

- [x] **Tarefa 3 — Recusar busca com e-mail pendente**
  - Cobre: CA3.
  - Teste primeiro: com uma conta real no banco de testes, executar a regra a partir da tentativa de acesso. Exigir recusa específica antes da etapa que continuaria a busca e conferir `demoUsedAt` no banco. Confirmar o e-mail e repetir para provar que o fluxo pode avaliar as demais condições. O RED vem da ausência da regra de acesso.
  - Arquivos previstos: `apps/api/test/email-verification.e2e-spec.ts`, `apps/api/src/modules/auth/{auth.module.ts,search-email-eligibility.service.ts}`.

- [ ] **Tarefa 4 — Retomar confirmação após perda da resposta**
  - Cobre: CA5.
  - Teste primeiro: concluir a confirmação no servidor, descartar a resposta e reenviar o mesmo token. Conferir que a primeira data é preservada, inclusive sob concorrência e reabertura posterior à validade original. Na interface, simular falha antes da gravação e depois dela. A nova tentativa com link válido deve mostrar “E-mail confirmado” no primeiro caso e “E-mail já confirmado” no segundo. O RED vem da ausência do estado de retomada ou do tratamento da repetição.
  - Arquivos previstos: `apps/api/test/email-verification.e2e-spec.ts`, `apps/api/src/modules/auth/{auth.controller.ts,auth.service.ts,dto/email-verification-result.dto.ts}`, `apps/web/src/features/auth/{VerifyEmailPage.vue,VerifyEmailPage.spec.ts,email-verification.service.ts}`.

- [ ] **Tarefa 5 — Reenviar o link de confirmação**
  - Cobre: CA4.
  - Teste primeiro: solicitar reenvio a partir de link expirado e do cadastro com envio inicial não comprovado. Conferir com relógio controlado que o novo link pertence à conta pendente, tem validade de 24 horas e confirma pelo fluxo real. Para endereço inexistente ou já confirmado, exigir o mesmo status e corpo sem tentativa de envio. Enviar duas solicitações concorrentes para a mesma conta fora do intervalo e comprovar emissão única. Na interface, exercitar os pontos de entrada reais, incluindo o estado de envio não comprovado na tela de cadastro. O RED vem da ausência da operação e de sua ligação às telas.
  - Arquivos previstos: `apps/api/test/email-verification.e2e-spec.ts`, `apps/api/src/modules/auth/{auth.controller.ts,auth.service.ts,dto/resend-verification.dto.ts,dto/resend-verification-result.dto.ts}`, `apps/web/src/features/auth/{RegisterPage.vue,RegisterPage.spec.ts,VerifyEmailPage.vue,VerifyEmailPage.spec.ts,email-verification.service.ts,useVerificationResend.ts}`.

- [ ] **Tarefa 6 — Permitir nova tentativa de reenvio após falha**
  - Cobre: CA6.
  - Teste primeiro: simular rejeição e timeout do provedor, comparar o resultado público e sua janela de resposta com os outros desfechos e comprovar que a confirmação continua pendente. Testar perda de conexão na interface e a restrição durante o intervalo exibido. Com o relógio avançado, repetir, receber o novo link pelo adaptador falso e comprovar que ele funciona. O RED vem do comportamento ausente diante da falha ou da tentativa posterior.
  - Arquivos previstos: `apps/api/test/email-verification.e2e-spec.ts`, `apps/api/src/modules/auth/{auth.controller.ts,auth.service.ts}`, `apps/web/src/features/auth/{RegisterPage.vue,RegisterPage.spec.ts,VerifyEmailPage.vue,VerifyEmailPage.spec.ts,useVerificationResend.ts}`.

## Critérios sem tarefa
