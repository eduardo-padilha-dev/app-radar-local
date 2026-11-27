# Parecer de Conformidade — Tarefa 7

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA6 — A desativação invalida as duas sessões abertas. Após a reativação, os dois cookies anteriores recebem `401` e uma sessão obtida por novo login tem acesso. | atendido | `apps/api/src/modules/auth/auth-session.service.ts:64`, `apps/api/test/auth-session.e2e-spec.ts:331` |
| CA6 — Na validação de concorrência prevista pelo plano, o login em andamento recebe `401` sem emitir cookie ou criar sessão quando a desativação é confirmada primeiro. | atendido | `apps/api/test/auth-session.e2e-spec.ts:361` |
| CA6 — Quando o login obtém primeiro o bloqueio da conta, o teste observa pelo PostgreSQL que a desativação espera pela transação de login. Depois das duas transações, o cookie emitido recebe `401` antes e depois da reativação. | atendido | `apps/api/test/auth-session.e2e-spec.ts:411`, `apps/api/test/auth-session.e2e-spec.ts:464` |

A execução de `npm run test:e2e -w apps/api -- test/auth-session.e2e-spec.ts` passou com 21 de 21 testes no banco isolado.

## Apontamentos
