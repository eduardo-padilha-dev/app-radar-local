# Parecer de Conformidade — Tarefa 2

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1 — Desenvolvedor e administrador entram com contas ativas persistidas e acessam recursos protegidos do próprio perfil. | atendido | `apps/api/test/auth-session.e2e-spec.ts:148`, `apps/api/test/auth-session.e2e-spec.ts:172` |
| CA1 — A API recusa o perfil incorreto e restringe os dados privados de prospecção ao desenvolvedor titular. | atendido | `apps/api/test/auth-session.e2e-spec.ts:172`, `apps/api/test/auth-session.e2e-spec.ts:182` |
| CA1 — O Vue abre a área do perfil autenticado, envia integralmente a senha Unicode e redireciona ao login quando falta sessão. | atendido | `apps/web/src/features/auth/LoginPage.spec.ts:24`, `apps/web/src/features/auth/LoginPage.spec.ts:43`, `apps/web/src/features/auth/LoginPage.spec.ts:70` |
| CA2 a CA7 | fora desta tarefa | `specs/004-entrar-e-sair-da-conta/plan.md:19` |

Passaram os 9 testes da API e os 4 do Vue no Node 24.21.0. A suíte da API usou um banco de teste exclusivo e uma chave JWT efêmera.

As três correções aceitas na rodada anterior foram verificadas. A arquitetura descreve o modelo, o relacionamento e o ciclo de vida da sessão em `docs/architecture.md:282`, `docs/architecture.md:310` e `docs/architecture.md:390`. O Quick Start inclui a geração e a configuração de `JWT_SECRET` em `README.md:65` e `README.md:72`. O formulário permite a senha Unicode integral, coberta pelo teste do Vue.

## Apontamentos
