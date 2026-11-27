# Parecer de Conformidade — Tarefa 5

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA4 — O login emite o JWT em cookie `HttpOnly`. O JWT e a sessão persistida têm prazo fixo de oito horas. O atributo `Expires` do cookie é arredondado para o segundo seguinte quando o prazo inclui milissegundos. | atendido | `apps/api/src/modules/auth/auth.controller.ts:96`, `apps/api/test/auth-session.e2e-spec.ts:254` |
| CA4 — A atividade intermediária preserva a expiração. O acesso com o mesmo cookie funciona um milissegundo antes do prazo e recebe `401` no limite. Os 14 testes HTTP passaram no banco isolado. | atendido | `apps/api/test/auth-session.e2e-spec.ts:281` |
| CA4 e abandono no meio — Ao retomar a área privada após a expiração, o Vue encaminha o usuário à tela de entrada. Se o carregamento da tela falhar ou a navegação for abortada, a área privada oculta o perfil e oferece nova tentativa. A recuperação chega à tela de entrada e permite um novo login. Passaram os cinco testes da área privada e os 37 da suíte web completa. | atendido | `apps/web/src/features/auth/usePrivateSession.ts:20`, `apps/web/src/features/auth/PrivateAreaPage.spec.ts:16`, `apps/web/src/features/auth/PrivateAreaPage.spec.ts:123` |
| CA1–CA3 e CA5–CA7 | fora desta tarefa | `specs/004-entrar-e-sair-da-conta/spec.md:18` |

## Apontamentos
