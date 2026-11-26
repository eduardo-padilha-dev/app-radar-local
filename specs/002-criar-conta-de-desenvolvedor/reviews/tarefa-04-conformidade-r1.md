# Parecer de Conformidade — Tarefa 4

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA3 — Validar nome, e-mail e senha obrigatórios e indicar a regra junto de cada campo inválido. Normalizar nome e e-mail, preservar pontos e o trecho iniciado por `+` no e-mail e manter os espaços da senha. | atendido | `apps/api/src/modules/auth/dto/register.dto.ts:6`, `apps/api/test/registration.e2e-spec.ts:269`, `apps/web/src/features/auth/RegisterPage.vue:26` |
| CA3 — Aceitar celular opcional e validar 11 dígitos nacionais com `9` depois do DDD, após remover formatação e prefixo opcional. Informar a regra a corrigir junto ao campo. | não atendido | `apps/api/src/modules/auth/dto/register.dto.ts:29`, `apps/web/src/features/auth/RegisterPage.vue:79` |
| CA3 — Rejeitar entradas inválidas sem criar conta ou enviar e-mail. | atendido | `apps/api/test/registration.e2e-spec.ts:249` |
| CA3 — Permitir corrigir e reenviar o formulário preservando os demais valores. | atendido | `apps/web/src/features/auth/RegisterPage.spec.ts:13` |
| CA1, CA2 e CA4–CA8 | fora desta tarefa | `specs/002-criar-conta-de-desenvolvedor/plan.md:90` |

A execução de `npm test` com o PostgreSQL exclusivo de testes passou com 4 testes unitários da API, 45 testes de integração e 5 testes web.

## Apontamentos

1. **A mensagem do celular omite o comprimento exigido** — `apps/api/src/modules/auth/dto/register.dto.ts:39`  
   Critério violado: CA3 exige indicar junto ao campo “a regra a corrigir” e determina “exigir 11 dígitos nacionais” (`specs/002-criar-conta-de-desenvolvedor/spec.md:23` e `:27`).  
   Evidência: a matriz HTTP rejeita `4291234567` e `429123456789`, que já incluem DDD e `9` depois do DDD. Para ambos, a API devolve “Informe um celular brasileiro com DDD e 9 depois do DDD.” e a página exibe esse texto. A mensagem não orienta a corrigir a quantidade de dígitos.
