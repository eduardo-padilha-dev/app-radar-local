# Parecer de Conformidade — Tarefa 5

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA4 — O JWT é entregue em cookie `HttpOnly`, com validade de oito horas a partir do login. | atendido | `apps/api/src/modules/auth/auth.controller.ts:95`, `apps/api/test/auth-session.e2e-spec.ts:254` |
| CA4 — A atividade intermediária preserva o prazo original. O cookie permite acesso até um milissegundo antes do limite e recebe `401` ao completar oito horas. Os 14 testes e2e da API passaram. | atendido | `apps/api/test/auth-session.e2e-spec.ts:280` |
| CA4 e abandono no meio — O Vue pede novo login quando a próxima tentativa de acesso privado recebe `401`, inclusive ao retomar a área privada aberta. O teste web passou. | atendido | `apps/web/src/app/router/index.ts:37`, `apps/web/src/features/auth/PrivateAreaPage.vue:12`, `apps/web/src/features/auth/PrivateAreaPage.spec.ts:16` |
| CA1–CA3 e CA5–CA7 | fora desta tarefa | `specs/004-entrar-e-sair-da-conta/spec.md:18` |

## Apontamentos
