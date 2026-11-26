# Parecer de Conformidade — Manutenção visual do acesso, rodada 2

**Veredito:** APROVADO

Os 29 testes web passaram em 6 arquivos com Node 24.21.0.

## Critérios verificados

| Critério | Situação | Onde |
| --- | --- | --- |
| US01 CA1 e CA5 — exibição e reenvio para o endereço submetido, mesmo após edição durante a requisição | Atendido para 201 e 502 | `useRegistration.ts:32`, `RegisterPage.vue:26`, `RegisterPage.vue:42`, `RegisterPage.spec.ts:51`, `RegisterPage.spec.ts:451` |
| US01 CA2–CA4, CA6 e CA7 — celular opcional, validação, duplicidade e abandono | Atendido no escopo web | `RegisterPage.vue:54`, `RegisterPage.spec.ts` |
| US02 CA1, CA2 e CA4–CA6 — confirmação, distinção entre link inválido e expirado, reenvio e nova tentativa | Atendido no escopo web | `VerifyEmailPage.vue:31`, `VerifyEmailPage.spec.ts` |
| US03 CA1–CA4 e CA7 — entrada, mensagem de falha, aviso de confirmação e retorno ao login | Atendido no escopo web | `LoginPage.vue:17`, `LoginPage.spec.ts` |
| Decisão da rodada 1 — tipografia restrita às telas de acesso | Atendido | `access.css:1`, `tokens.css:20` |
| US01 CA8, US02 CA3, regras de backend e saída da US03 | Fora desta tarefa | Escopo da manutenção visual |

## Apontamentos
