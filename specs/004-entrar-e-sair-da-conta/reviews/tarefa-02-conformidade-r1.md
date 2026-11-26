# Parecer de Conformidade — Tarefa 2

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1 — Desenvolvedor e administrador entram com contas ativas persistidas e acessam recursos protegidos do próprio perfil. | atendido | `apps/api/test/auth-session.e2e-spec.ts:148`, `apps/api/test/auth-session.e2e-spec.ts:172` |
| CA1 — A API recusa o perfil incorreto e restringe os dados privados de prospecção ao desenvolvedor titular. | atendido | `apps/api/test/auth-session.e2e-spec.ts:172`, `apps/api/test/auth-session.e2e-spec.ts:182` |
| CA1 — O Vue abre a área correspondente ao perfil após o login e direciona ao login ao tentar navegar sem sessão. | atendido | `apps/web/src/features/auth/LoginPage.spec.ts:10`, `apps/web/src/features/auth/LoginPage.spec.ts:49` |
| CA2 a CA7 | fora desta tarefa | `specs/004-entrar-e-sair-da-conta/plan.md:24` |

As duas suítes passaram, com 9 testes na API e 3 no Vue.

## Apontamentos
