# Plano — Issue #2

## Decisões técnicas

- Referências: [spec aprovada](spec.md), `docs/architecture.md` e
  `docs/design-tokens.md`. Este plano prepara a Atividade 10; nenhuma tarefa será
  executada na Atividade 09. A execução segue `/utf-task`, com os portões humanos
  e revisores definidos pelo repositório.
- Dados desta história: `User`/`users`, com `id`, `name`, `email` único,
  `passwordHash`, `phone` anulável, `role` (`DEVELOPER` ou `ADMIN`), `isActive`,
  `emailVerifiedAt`, `demoUsedAt` e `accessExpiresAt` anuláveis;
  `EmailVerification`/`email_verifications`, com `id`, `userId`, `email`,
  `tokenHash` único, `expiresAt` e `usedAt` anulável. Criar somente esses modelos
  e sua migration. Os padrões de nomes e tipos são os da arquitetura.
- `AuthModule`, `AuthController`, `AuthService` e `RegisterDto` em
  `apps/api/src/modules/auth/`. Interface principal:
  `AuthService.register(input: RegisterDto): Promise<RegistrationResult>`;
  `RegistrationResult` contém `accountCreated: true` e
  `verificationEmailStatus: 'accepted'`. A falha de envio usa exceção específica
  após a persistência, sem rollback da conta. `PrismaModule` fornece o acesso ao
  banco; `ResendModule` fornece o adaptador de e-mail.
- Contrato específico: `POST /auth/register`, público, recebe somente
  `name`, `email`, `password` e `phone` opcional. Sucesso: HTTP 201 com os campos
  de `RegistrationResult` em `data`. HTTP 400: `VALIDATION_ERROR` com detalhes
  por campo; HTTP 409: `EMAIL_ALREADY_REGISTERED`; HTTP 502:
  `VERIFICATION_EMAIL_UNCONFIRMED`, com detalhes seguros `accountCreated: true`
  e `emailVerificationPending: true`. As mensagens são as da spec. A UI só
  considera a conta criada após 201 ou esse 502 específico; erros de rede ou
  falhas genéricas não permitem inferir persistência. Documentar os DTOs e
  respostas em OpenAPI na implementação, conforme a arquitetura.
- Persistir usuário e emissão do token em uma transação; chamar o provedor
  somente depois do commit. Falha de banco desfaz ambos e não chama o provedor.
  Usar a unicidade de `email` para resolver concorrência, traduzindo a violação
  em HTTP 409. Não usar atualização de conta existente como forma de cadastro.
- Senhas: serviço `PasswordHasher` usando `node:crypto.scrypt` assíncrono,
  salt aleatório de 16 bytes, chave derivada de 64 bytes, `N=16384`, `r=8`,
  `p=1`, `maxmem=64 MiB`; armazenar versão, parâmetros, salt e hash numa string
  verificável pela futura US03. Token: 32 bytes aleatórios em base64url, hash
  SHA-256 persistido, original somente no link enviado. Não registrar senha,
  token original ou corpo sensível em logs ou respostas.
- Adaptador `ResendEmailService.sendVerificationEmail(to, link): Promise<void>`
  com `fetch`, usando `RESEND_API_KEY`, `EMAIL_FROM` e `WEB_URL`. Destino previsto:
  `${WEB_URL}/confirmar-email?token=<token>`; a tela e o consumo são da Issue #3.
  Limitar a tentativa a 10 segundos com cancelamento; resposta não bem sucedida,
  erro de conexão ou timeout geram a exceção específica de envio. Sem repetição
  automática. O teste substitui o provedor e controla relógio/rede.
- Frontend: rota `/criar-conta`, `RegisterPage.vue`, `useRegistration.ts` e
  `registration.service.ts`, em `apps/web/src/features/auth/`; cliente HTTP em
  `shared/http/client.ts`. O serviço expõe `register(input)` e traduz o contrato
  em resultado ou erro tipado. O composable fornece campos, erros por campo e
  estado `idle | submitting | success | email-unconfirmed | error`.
  Na primeira tarefa, mover o router do scaffold para `src/app/router/index.ts`
  e ajustar seu import, preservando as rotas de demonstração.
- Celular será enviado ao armazenamento como 11 dígitos nacionais, sem prefixo
  ou formatação; ausente/vazio será `null`. Nome e e-mail serão normalizados na
  API conforme CA3; senha preservada. As regras e mensagens de negócio continuam
  na spec; o plano não as redefine.
- Infraestrutura necessária à história ainda ausente no scaffold entra junto
  às tarefas: bootstrap compartilhado entre aplicação e testes HTTP, configuração
  de ambiente, CORS para `CORS_ORIGIN`, contrato de resposta e Swagger conforme
  as seções 2.1–2.2 da arquitetura. Instalar na Atividade 10 apenas os pacotes já
  previstos que esta história usa (`class-validator`, `class-transformer`,
  `@nestjs/swagger` e tipos de `pg` se exigidos). Conferir compatibilidade e
  registrar versões antes da instalação. Sem JWT nesta história.
- Testes HTTP usam PostgreSQL exclusivo de testes, migrations aplicadas nesse
  banco e limpeza isolada; o setup deve recusar uma URL que aponte ao banco de
  desenvolvimento. Testes de UI usam Vue Test Utils e Vitest; teste integrado
  do serviço web exercita o cliente HTTP com respostas controladas. Ao fechar
  cada tarefa, executar suas suítes afetadas; os comandos consolidados de
  verificação são `npm test`, `npm run lint`, `npm run typecheck` e `npm run build`.

## Tarefas

- [ ] **Tarefa 1 — Preparar a persistência do cadastro**
  - Cobre: CA1 e CA4 (passo técnico que destrava os fluxos completos das tarefas 2 e 5).
  - Teste primeiro: integração com o banco de testes prova criação atômica de usuário e emissão do token, unicidade do e-mail e rollback quando a emissão falha. Os testes falham inicialmente pela ausência dos modelos e do acesso ao banco. Provar que a configuração de testes rejeita o banco de desenvolvimento.
  - Arquivos previstos: `apps/api/test/registration-persistence.e2e-spec.ts`, `apps/api/test/setup-database.ts`, `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/<timestamp>_create_registration/migration.sql`, `apps/api/src/database/prisma.module.ts`, `apps/api/src/database/prisma.service.ts`, `apps/api/vitest.config.e2e.ts`, `apps/api/.env.example`.

- [ ] **Tarefa 2 — Concluir o cadastro com envio aceito**
  - Cobre: CA1.
  - Teste primeiro: HTTP com banco real de testes e provedor substituído prova o estado inicial completo, emissão com validade exata de 24 horas e envio do link com token cujo hash corresponde ao persistido. Provar ausência de senha/token na resposta, hashes diferentes para senhas iguais com salts distintos e rollback sem envio em falha de persistência. Na UI, submeter o formulário pela página real, passando por composable, serviço e cliente HTTP com rede controlada, deve mostrar a mensagem de CA1; impedir novo envio durante a espera e não criar sessão. Os testes falham antes de existirem rota, fluxo de cadastro e tela.
  - Arquivos previstos: `apps/api/test/registration.e2e-spec.ts`, `apps/api/src/modules/auth/{auth.module.ts,auth.controller.ts,auth.service.ts,dto/register.dto.ts,dto/registration-result.dto.ts}`, `apps/api/src/modules/auth/{password-hasher.ts,password-hasher.spec.ts,verification-token.ts,verification-token.spec.ts}`, `apps/api/src/integrations/resend/{resend.module.ts,resend-email.service.ts,resend-email.service.spec.ts}`, `apps/api/src/common/{configure-app.ts,data.interceptor.ts,api-exception.filter.ts}`, `apps/api/src/config/environment.ts`, `apps/api/src/{main.ts,app.module.ts}`, `apps/api/test/app.e2e-spec.ts`, `apps/api/.env.example`, `apps/api/package.json`, `package-lock.json`, `apps/web/src/features/auth/{RegisterPage.vue,RegisterPage.spec.ts,useRegistration.ts,registration.service.ts,registration.service.spec.ts}`, `apps/web/src/shared/http/{client.ts,client.spec.ts}`, `apps/web/src/shared/styles/tokens.css`, `apps/web/src/app/router/index.ts` (mover de `src/router/index.ts`), `apps/web/src/{main.ts,App.vue}`, `apps/web/env.d.ts`, `apps/web/.env.example`.
  - Integrações futuras: deixar `// TODO #3` junto à orientação de confirmação/reenvio e `// TODO #4` junto à orientação de entrada, sem rotas ou controles funcionais fictícios. Testar a ausência desses controles. Derivar o visual dos tokens e do protótipo documentados.

- [ ] **Tarefa 3 — Aceitar o celular opcional**
  - Cobre: CA2.
  - Teste primeiro: parametrizar cadastro sem `phone`, com string vazia, com número nacional e com número formatado contendo `+55`; verificar persistência nula ou normalizada e envio único. Na UI, completar cadastro sem celular, conferir os campos exibidos e a ausência de CPF. Os testes devem falhar enquanto a implementação não tratar as variantes.
  - Arquivos previstos: `apps/api/test/registration.e2e-spec.ts`, `apps/api/src/modules/auth/{dto/register.dto.ts,auth.service.ts}`, `apps/web/src/features/auth/{RegisterPage.vue,RegisterPage.spec.ts,registration.service.ts}`.

- [ ] **Tarefa 4 — Apresentar erros de validação por campo**
  - Cobre: CA3.
  - Teste primeiro: matriz HTTP cobre obrigatórios ausentes, tipos incompatíveis, limites imediatamente abaixo/no/acima dos intervalos de nome e senha, e-mail inválido e celulares inválidos. Conferir normalização de nome/e-mail, preservação de senha com espaços e nenhum registro/envio em entrada inválida. Testar UI com erro retornado pela API, mensagem junto ao campo e preservação dos demais valores. Os testes falham enquanto faltar cada validação ou associação de erro ao campo.
  - Arquivos previstos: `apps/api/test/registration.e2e-spec.ts`, `apps/api/src/modules/auth/{dto/register.dto.ts,auth.service.ts}`, `apps/api/src/common/api-exception.filter.ts`, `apps/web/src/features/auth/{RegisterPage.vue,RegisterPage.spec.ts,useRegistration.ts,registration.service.ts}`, `apps/web/src/shared/http/client.ts`.

- [ ] **Tarefa 5 — Impedir cadastro de e-mail repetido**
  - Cobre: CA4.
  - Teste primeiro: banco/HTTP prova HTTP 409 para e-mail existente com variações de caixa/espaços, preservando todos os dados da conta original e sem novo envio. Duas solicitações simultâneas devem resultar em uma criação e um conflito. Endereços distintos por pontos ou `+` permanecem distintos. A UI deve mostrar exatamente a mensagem de CA4. Os testes falham enquanto o conflito não for traduzido ou a orientação não aparecer.
  - Arquivos previstos: `apps/api/test/registration.e2e-spec.ts`, `apps/api/src/modules/auth/auth.service.ts`, `apps/api/src/common/api-exception.filter.ts`, `apps/web/src/features/auth/{RegisterPage.spec.ts,RegisterPage.vue,useRegistration.ts,registration.service.ts}`.

- [ ] **Tarefa 6 — Informar envio de confirmação não comprovado**
  - Cobre: CA5.
  - Teste primeiro: simular rejeição HTTP do provedor, falha de rede e ausência de resposta até 10 segundos, com relógio controlado. Conferir cancelamento da espera, uma tentativa, HTTP 502 específico e manutenção do usuário e token pendentes. Testar a UI com esse erro passando pelo cliente HTTP: mensagem exata de CA5, sem declarar conta inexistente ou entrega garantida. Os testes falham enquanto o erro provocar rollback, ficar sem limite de espera ou não for distinguido pela tela.
  - Arquivos previstos: `apps/api/src/integrations/resend/{resend-email.service.spec.ts,resend-email.service.ts}`, `apps/api/test/registration.e2e-spec.ts`, `apps/api/src/modules/auth/{auth.service.ts,verification-email-unconfirmed.exception.ts}`, `apps/api/src/common/api-exception.filter.ts`, `apps/web/src/features/auth/{RegisterPage.spec.ts,RegisterPage.vue,useRegistration.ts,registration.service.spec.ts,registration.service.ts}`.

- [ ] **Tarefa 7 — Tratar repetição após perda da resposta**
  - Cobre: CA6.
  - Teste primeiro: integração HTTP conclui a primeira criação e descarta sua resposta, repetindo a solicitação para provar uma única conta, um único envio e conflito sem alteração dos dados. No teste de UI, a camada de transporte perde a primeira resposta após o servidor simulado registrar a conta; a tela permite tentar novamente, sem afirmar o resultado desconhecido, e exibe CA4 ao receber o conflito na repetição. Os testes falham enquanto a falha de transporte impedir recuperação ou induzir outra criação.
  - Arquivos previstos: `apps/api/test/registration.e2e-spec.ts`, `apps/api/src/modules/auth/auth.service.ts`, `apps/web/src/features/auth/{RegisterPage.spec.ts,RegisterPage.vue,useRegistration.ts,registration.service.spec.ts,registration.service.ts}`, `apps/web/src/shared/http/{client.spec.ts,client.ts}`.

- [ ] **Tarefa 8 — Descartar formulário abandonado antes do envio**
  - Cobre: CA7.
  - Teste primeiro: preencher a página sem submeter, desmontar e criar uma nova instância com estado de aplicação novo, representando nova visita/recarregamento. Conferir campos iniciais vazios, nenhuma chamada HTTP e ausência de escrita em armazenamento persistente. O teste falha se o formulário disparar cadastro automaticamente ou restaurar estado persistido. Não simular preenchimento automático do navegador como comportamento da aplicação.
  - Arquivos previstos: `apps/web/src/features/auth/{RegisterPage.spec.ts,RegisterPage.vue,useRegistration.ts}`.

- [ ] **Tarefa 9 — Rejeitar privilégios enviados no cadastro público**
  - Cobre: CA8.
  - Teste primeiro: HTTP parametrizado envia `role`, `isActive`, `emailVerifiedAt`, `demoUsedAt` e `accessExpiresAt`, além de propriedade desconhecida, em cadastros de resto válidos. Exigir HTTP 400, nenhuma conta/token persistido e nenhum envio; a chamada pública legítima continua funcionando. Os testes falham se campos extras forem aceitos ou ignorados silenciosamente.
  - Arquivos previstos: `apps/api/test/registration.e2e-spec.ts`, `apps/api/src/modules/auth/{dto/register.dto.ts,auth.service.ts}`, `apps/api/src/common/configure-app.ts`.

## Critérios sem tarefa
