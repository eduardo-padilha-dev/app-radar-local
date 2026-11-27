# Parecer de Conformidade — Tarefa 5

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA4 — O login emite o JWT em cookie `HttpOnly`. O JWT e a sessão persistida expiram oito horas após o login. O atributo `Expires` do cookie é arredondado para o segundo seguinte quando o prazo inclui milissegundos. | atendido | `apps/api/src/modules/auth/auth.controller.ts:95`, `apps/api/test/auth-session.e2e-spec.ts:254` |
| CA4 — A atividade intermediária preserva a expiração original. O mesmo cookie permite acesso um milissegundo antes do prazo e recebe `401` ao completar oito horas. Os 14 testes da API passaram. | atendido | `apps/api/test/auth-session.e2e-spec.ts:280` |
| CA4 e abandono no meio — Ao retomar a área privada aberta, o Vue consulta a sessão e pede novo login se a API responder `401`. Os três testes web passaram, incluindo nova tentativa após falha de rede ou resposta `503`. | atendido | `apps/web/src/features/auth/usePrivateSession.ts:20`, `apps/web/src/features/auth/PrivateAreaPage.spec.ts:16` |
| CA1–CA3 e CA5–CA7 | fora desta tarefa | `specs/004-entrar-e-sair-da-conta/spec.md:18` |

## Apontamentos
