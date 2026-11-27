# Parecer de Conformidade — Tarefa 6

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA5 — A saída expira o cookie do dispositivo atual. O servidor recusa o cookie anterior reapresentado e mantém a outra sessão válida. | atendido | `apps/api/test/auth-session.e2e-spec.ts:300` (suíte E2E, 18 testes aprovados) |
| CA5 — Após sair, a tela volta à entrada e exige novo login ao reabrir a área privada. A reentrada durante a saída aguarda a resposta, e um novo login só é enviado após o `204` no fluxo de sucesso. | atendido | `apps/web/src/features/auth/PrivateAreaPage.spec.ts:16`, `apps/web/src/features/auth/PrivateAreaPage.spec.ts:50`, `apps/web/src/features/auth/PrivateAreaPage.spec.ts:97` (9 testes aprovados) |
| CA1–CA4, CA6 e CA7 | fora desta tarefa | `specs/004-entrar-e-sair-da-conta/plan.md` |

## Apontamentos
