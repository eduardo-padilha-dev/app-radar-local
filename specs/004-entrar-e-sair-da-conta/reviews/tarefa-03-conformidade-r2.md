# Parecer de Conformidade — Tarefa 3

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA2 — E-mail inexistente, senha incorreta e conta desativada recebem o mesmo envelope `401`, sem emissão de cookie ou persistência de sessão. | atendido | `apps/api/test/auth-session.e2e-spec.ts:179`, `apps/api/test/auth-session.e2e-spec.ts:201` |
| CA2 — A tela exibe a mesma mensagem nos três casos. | atendido | `apps/web/src/features/auth/LoginPage.spec.ts:73`, `apps/web/src/features/auth/LoginPage.spec.ts:108` |
| CA2 — Conforme o plano, a ausência do e-mail executa uma derivação scrypt de custo equivalente. O hash substituto usa a mesma função de codificação e os mesmos parâmetros do cadastro. | atendido | `apps/api/src/modules/auth/password-hasher.ts:8`, `apps/api/src/modules/auth/password-hasher.spec.ts:54`, `apps/api/test/auth-session.e2e-spec.ts:211` |
| CA1 e CA3 a CA7 | fora desta tarefa | `specs/004-entrar-e-sair-da-conta/plan.md` |

Passaram os 10 testes do `PasswordHasher`, os 12 testes de sessão da API no banco isolado e os 7 testes da tela de entrada.

## Apontamentos
