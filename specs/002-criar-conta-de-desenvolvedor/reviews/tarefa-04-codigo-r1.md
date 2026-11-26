# Parecer de Código — Tarefa 4

**Veredito** — APONTAMENTOS

## Apontamentos (bloqueiam)

1. **O contrato HTTP 400 com erros por campo está ausente do OpenAPI.** O filtro passou a retornar `details` como um mapa de campos para listas de mensagens. A operação de cadastro documenta apenas HTTP 201. [api-exception.filter.ts](/home/dudupadilha/projects/app-radar-local/apps/api/src/common/api-exception.filter.ts:51) · [auth.controller.ts](/home/dudupadilha/projects/app-radar-local/apps/api/src/modules/auth/auth.controller.ts:14)

   **Regra violada** — A seção 2.2 da arquitetura estabelece `/docs-json` como fonte dos contratos do frontend. O plano também exige documentar as respostas na implementação. [architecture.md](/home/dudupadilha/projects/app-radar-local/docs/architecture.md) · [plan.md](/home/dudupadilha/projects/app-radar-local/specs/002-criar-conta-de-desenvolvedor/plan.md)

   **Prejuízo concreto** — Quem usa `/docs-json` para integrar o cadastro não encontra o código `VALIDATION_ERROR`, o formato de `details` ou a indicação de que esse campo pode estar ausente.

## Sugestões (não bloqueiam)

- Identificar erros de propriedades extras pelo tipo de violação, pois uma mudança no texto padrão do Nest faria o filtro voltar a expor essas propriedades em `details`. [api-exception.filter.ts](/home/dudupadilha/projects/app-radar-local/apps/api/src/common/api-exception.filter.ts:30)
- No teste de preservação dos espaços da senha, usar os parâmetros gravados no hash para calcular o resultado esperado. Hoje o teste depende dos valores padrão de `scrypt` e falharia se os parâmetros declarados mudassem. [registration.e2e-spec.ts](/home/dudupadilha/projects/app-radar-local/apps/api/test/registration.e2e-spec.ts:288)

## Observações fora do escopo deste diff

Nenhuma. `npm run lint` passou.
