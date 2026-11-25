# Parecer de Conformidade — Tarefa 4

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA3 — Validar nome, e-mail e senha obrigatórios e indicar a regra junto de cada campo inválido. Normalizar nome e e-mail, preservar pontos e o trecho iniciado por `+` no e-mail e manter os espaços da senha. | atendido | `apps/api/src/modules/auth/dto/register.dto.ts:6`, `apps/api/test/registration.e2e-spec.ts:273`, `apps/web/src/features/auth/RegisterPage.vue:26` |
| CA3 — Aceitar o celular opcional e, quando preenchido, exigir 11 dígitos nacionais, incluindo o DDD, com `9` depois do DDD. Informar essa regra junto ao campo. | atendido | `apps/api/src/modules/auth/dto/register.dto.ts:29`, `apps/api/test/registration.e2e-spec.ts:166`, `apps/web/src/features/auth/RegisterPage.vue:79` |
| CA3 — Rejeitar entradas inválidas sem criar conta ou enviar e-mail. | atendido | `apps/api/test/registration.e2e-spec.ts:250` |
| CA3 — Permitir corrigir e reenviar o formulário preservando os demais valores. | atendido | `apps/web/src/features/auth/RegisterPage.spec.ts:13` |
| CA1, CA2 e CA4–CA8 | fora desta tarefa | `specs/002-criar-conta-de-desenvolvedor/plan.md:90` |

A execução de `npm test` com acesso ao PostgreSQL exclusivo de testes passou com 4 testes unitários da API, 46 testes de integração e 5 testes web.

## Apontamentos
