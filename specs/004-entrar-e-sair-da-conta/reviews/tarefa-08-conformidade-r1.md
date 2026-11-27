# Parecer de Conformidade — Tarefa 8

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA7 — A tela de entrada informa a falha de rede e permite concluir a entrada em nova tentativa. | atendido | `apps/web/src/features/auth/LoginPage.spec.ts:123` |
| CA7 — A área privada informa a falha de rede e permite concluir a saída em nova tentativa, inclusive após perda da resposta da revogação. | atendido | `apps/web/src/features/auth/PrivateAreaPage.spec.ts:53` |
| CA7 — A API expira o cookie na nova tentativa de saída e continua recusando o cookie anterior. | atendido | `apps/api/test/auth-session.e2e-spec.ts:331` |

## Apontamentos
