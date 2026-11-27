# Plano do fix — US03, Issue #4

Complemento para revisão. [Spec de autorização](complemento-autorizacao.md).

## Decisões técnicas

- Registrar o `AuthSessionGuard` existente como `APP_GUARD` e usar metadados de acesso público em cada método autorizado pela spec. Migrar os registros locais redundantes e ativar a proteção no mesmo passo em que as exceções forem declaradas.
- Reusar o cookie `HttpOnly` e a autenticação da US03. O papel é avaliado pelo guard com base no perfil carregado do servidor. O Swagger continua acessível e documenta a autenticação por cookie nas novas operações protegidas.
- Consultar `AuthSession` pelo UUID solicitado e pelo ID da conta autenticada, filtrando validade e revogação no servidor. Usar os modelos já existentes e selecionar somente `id` e `expiresAt`.
- Implementar `GET /admin/access` com a restrição de papel existente. A resposta de sucesso tem status 204 sem corpo.
- Usar testes HTTP com PostgreSQL isolado e contas de teste. Para a conferência no navegador, servir web, API e Swagger sob o mesmo hostname, com a origem web configurada para o login. A sessão deve chegar ao Swagger pelo cookie do navegador.

## Tarefas

- [x] **Tarefa 1 — Proteger rotas por padrão**
  - Cobre CA8 e CA9. Os dois critérios entram juntos para que o login continue acessível ao ativar o guard global.
  - Teste primeiro. Montar um controller de teste com uma rota sem guard local e verificar 401 sem sessão, com cookie adulterado, expirado ou revogado. Usar um espião no handler para comprovar que o guard interrompe a chamada. Com cookie válido, esperar 200. A rota de teste hoje aceita uma chamada sem autenticação, então o primeiro cenário deve falhar antes do registro global. Reexecutar as verificações de cadastro, login, confirmação e reenvio sem cookie e cobrir explicitamente o logout com cookie ausente, inválido ou expirado e a recusa de origem indevida. Verificar também `GET /`, `/docs/` e `/docs-json`.
  - Arquivos previstos: `apps/api/src/app.module.ts`, `apps/api/src/app.controller.ts`, `apps/api/src/modules/auth/auth-session.guard.ts`, `apps/api/src/modules/auth/auth.controller.ts`, `apps/api/test/auth-session.e2e-spec.ts` e, se necessário, `apps/api/test/app.e2e-spec.ts`.

- [x] **Tarefa 2 — Restringir consulta ao dono da sessão**
  - Cobre CA10.
  - Teste primeiro. Criar sessões em duas contas no PostgreSQL e chamar `GET /auth/sessions/:id` com um cookie de sessão válido. Esperar 200 com exatamente `id` e `expiresAt` no envelope `data` para a sessão própria ativa. Comparar as respostas 404 para ID inexistente, sessão expirada, revogada ou de outra conta. Repetir a tentativa de acesso a outra conta com um administrador. Cobrir 400 para UUID inválido e 401 sem sessão. A rota ainda não existe, então o caso de sucesso deve falhar primeiro.
  - Arquivos previstos: `apps/api/src/modules/auth/auth.controller.ts`, `apps/api/src/modules/auth/auth-session.service.ts` e `apps/api/test/auth-session.e2e-spec.ts`.

- [ ] **Tarefa 3 — Demonstrar acesso administrativo**
  - Cobre CA11.
  - Teste primeiro. Fazer login com contas de teste dos dois papéis e usar os cookies emitidos em `GET /admin/access`. Esperar 204 sem corpo para administrador, 403 para desenvolvedor e 401 sem cookie válido. Verificar em `/docs-json` a autenticação por cookie e os três status documentados. A rota ainda não existe, então o caso administrativo deve falhar primeiro.
  - Arquivos previstos: `apps/api/src/modules/auth/admin-access.controller.ts`, `apps/api/src/modules/auth/auth.module.ts`, `apps/api/test/auth-session.e2e-spec.ts` e `apps/api/test/app.e2e-spec.ts`.

- [ ] **Tarefa 4 — Verificar o fluxo pelo Swagger**
  - Cobre a demonstração de CA11 e a navegação de CA9.
  - Validação. Com a API e o frontend locais, entrar como desenvolvedor e executar `GET /admin/access` pela página `/docs/` no mesmo navegador. Conferir o 403 para a captura. Confirmar que `npm test`, `npm run build` e `npm run lint` passam. Atualizar em `docs/architecture.md` o registro do guard global e a divisão entre acesso público, sessão própria e acesso administrativo.
  - Arquivo previsto: `docs/architecture.md`. A captura é evidência da atividade.

## Critérios sem tarefa
