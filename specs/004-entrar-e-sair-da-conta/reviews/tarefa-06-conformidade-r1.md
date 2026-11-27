# Parecer de Conformidade — Tarefa 6

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1, CA2, CA3, CA4, CA6 e CA7 | fora desta tarefa | `specs/004-entrar-e-sair-da-conta/plan.md` |
| CA5 — O cookie de saída expira e o servidor recusa o JWT reapresentado da primeira sessão, enquanto a segunda sessão da mesma conta mantém acesso. | atendido | `apps/api/test/auth-session.e2e-spec.ts:300` — 18 testes passaram na suíte da API. |
| CA5 — A saída leva à tela de entrada e uma tentativa de reabrir a área privada exige novo login. | atendido | `apps/web/src/features/auth/PrivateAreaPage.spec.ts:16` — 7 testes passaram na suíte web. |

## Apontamentos
