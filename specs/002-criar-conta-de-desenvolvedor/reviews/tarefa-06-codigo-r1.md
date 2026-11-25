# Parecer de Código — Tarefa 6

**Veredito:** APONTAMENTOS

## Apontamentos (bloqueiam)

1. **O filtro global depende de uma exceção do domínio de cadastro** — [api-exception.filter.ts](/home/dudupadilha/projects/app-radar-local/apps/api/src/common/api-exception.filter.ts:8)  
   Regra violada — `docs/architecture.md`, §§ 2.1 e 3, atribui ao filtro global a normalização das respostas HTTP e organiza a lógica de cada domínio em seu módulo.  
   Prejuízo concreto — O filtro importa a classe concreta de `auth` e define o código e os detalhes específicos do cadastro. Alterar essa classe ou os campos desse contrato exige editar a infraestrutura compartilhada. A exceção pode carregar os dados públicos do erro, com o filtro responsável por normalizar o envelope e preservar a sanitização das demais respostas.

## Sugestões (não bloqueiam)

- Compartilhar no backend as definições públicas do 502 entre a exceção e o OpenAPI para reduzir a chance de divergência entre a resposta e a documentação.

## Observações fora do escopo deste diff

- O lint aponta um aviso preexistente sobre `.sort()` em [registration.e2e-spec.ts](/home/dudupadilha/projects/app-radar-local/apps/api/test/registration.e2e-spec.ts:254).

`npm run typecheck` e `git diff --check` passaram. Passaram também 5 testes unitários da API e 10 do frontend. A suíte HTTP com banco ficou a cargo da revisão de conformidade.
