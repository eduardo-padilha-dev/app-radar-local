# Parecer de Conformidade — Tarefa 3

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA2 — E-mail inexistente, senha incorreta e conta desativada recebem o mesmo envelope `401`, sem cookie ou sessão persistida. | atendido | `apps/api/test/auth-session.e2e-spec.ts:179` e `apps/api/test/auth-session.e2e-spec.ts:201` |
| CA2 — A tela exibe a mesma mensagem nas três recusas. | atendido | `apps/web/src/features/auth/LoginPage.spec.ts:73` e `apps/web/src/features/auth/LoginPage.spec.ts:108` |
| CA2 — A verificação para e-mail inexistente executa uma derivação scrypt equivalente, conforme o plano da tarefa. | atendido | `apps/api/src/modules/auth/auth-session.service.ts:34` e `apps/api/test/auth-session.e2e-spec.ts:211` |

Os 12 testes de sessão da API e os 7 testes da tela de entrada passaram.

## Apontamentos
