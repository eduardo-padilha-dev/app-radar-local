# Parecer de Conformidade — Tarefa 2

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA2 — Informar que o link é inválido quando o token está ausente, malformado, é desconhecido ou foi emitido para outro endereço, preservando o estado persistido | atendido | `apps/api/test/email-verification.e2e-spec.ts:106`, `apps/api/test/email-verification.e2e-spec.ts:121` |
| CA2 — Informar a expiração no instante exato em que o link completa 24 horas, preservando a conta e o link | atendido | `apps/api/test/email-verification.e2e-spec.ts:144` |
| CA2 — Distinguir link inválido de expirado na página e exibir a opção de reenvio apenas no estado expirado, com emissão prevista na tarefa 5 | atendido | `apps/web/src/features/auth/VerifyEmailPage.spec.ts:55`, `apps/web/src/features/auth/VerifyEmailPage.spec.ts:68`, `apps/web/src/features/auth/VerifyEmailPage.spec.ts:84` |

## Apontamentos
