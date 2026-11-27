# Parecer de Conformidade — Tarefa 7

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA6 — As duas sessões abertas retornam `401` após desativação e continuam inválidas após reativação. Um novo login recupera o acesso. | atendido | `apps/api/test/auth-session.e2e-spec.ts:331` |
| CA6 — Um login concorrente com a desativação não deixa sessão válida. O teste identifica os PIDs dentro das transações, confirma a disputa com `pg_blocking_pids()` e verifica `401` com o cookie emitido, inclusive após a reativação. | atendido | `apps/api/test/auth-session.e2e-spec.ts:411`, `apps/api/test/auth-session.e2e-spec.ts:628` |
| CA1 a CA5 e CA7 | fora desta tarefa | `specs/004-entrar-e-sair-da-conta/plan.md` |

O comando `npm run test:e2e -w apps/api -- test/auth-session.e2e-spec.ts` passou com 21 de 21 testes no banco isolado da revisão.

## Apontamentos
