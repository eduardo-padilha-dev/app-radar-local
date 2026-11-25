# Parecer de Código — Tarefa 6

**Veredito:** APONTAMENTOS

O apontamento aceito na rodada 1 foi corrigido. O filtro global recebe os dados públicos por meio de uma exceção genérica, e o contrato específico do cadastro permanece no módulo `auth`.

## Apontamentos (bloqueiam)

1. **O adaptador pode deixar a conexão com o Resend ocupada após o prazo de cancelamento** — [resend-email.service.ts](/home/dudupadilha/projects/app-radar-local/apps/api/src/integrations/resend/resend-email.service.ts:26)  
   Regra violada — `docs/architecture.md`, §§ 2 e 2.1, atribui ao adaptador de e-mail o acesso ao provedor por `fetch` nativo. O plano da tarefa limita a tentativa a 10 segundos com cancelamento.  
   Prejuízo concreto — `fetch` resolve assim que recebe os cabeçalhos. Nesse momento, o adaptador usa o status e desativa o timer sem consumir ou cancelar o corpo da resposta. Se o provedor enviar os cabeçalhos e atrasar ou interromper o corpo, a conexão pode ficar ocupada além dos 10 segundos. A repetição desse cenário pode degradar ou travar novos envios. O `AbortSignal.timeout` anterior continuava ativo após os cabeçalhos. [Documentação do Undici sobre liberação de conexões](https://github.com/nodejs/undici/blob/main/README.md#garbage-collection)

## Sugestões (não bloqueiam)

- Nenhuma.

## Observações fora do escopo deste diff

- O lint passou com um aviso preexistente sobre `.sort()` em [registration.e2e-spec.ts](/home/dudupadilha/projects/app-radar-local/apps/api/test/registration.e2e-spec.ts:286).
- O `git diff --check` passou em `apps/`. No diff integral, sinalizou dois espaços finais usados como quebras de linha no parecer da rodada 1, preservado conforme o fluxo.

Passaram a checagem de tipos, os 5 testes unitários da API e os 10 testes web. A suíte HTTP com PostgreSQL ficou a cargo da revisão de conformidade.
