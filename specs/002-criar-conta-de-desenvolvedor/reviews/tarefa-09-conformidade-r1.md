# Parecer de Conformidade — Tarefa 9

**Veredito:** APROVADO

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA8 — O cadastro público rejeita com HTTP 400 cada campo reservado ao sistema e uma propriedade desconhecida. | atendido | `apps/api/test/registration.e2e-spec.ts:245` |
| CA8 — Os pedidos rejeitados não criam conta, não gravam token de confirmação e não disparam envio de e-mail. | atendido | `apps/api/test/registration.e2e-spec.ts:264` |
| CA8 — O cadastro legítimo retorna HTTP 201, e o servidor define o perfil de desenvolvedor e o estado inicial da conta. | atendido | `apps/api/test/registration.e2e-spec.ts:149` |

`npm test` passou com 7 testes unitários da API, 65 testes de integração da API e 12 testes web.

## Apontamentos
