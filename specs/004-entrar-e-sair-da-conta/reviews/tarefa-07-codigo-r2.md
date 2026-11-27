# Parecer de Código — Tarefa 7

**Veredito:** APONTAMENTOS

## Apontamentos (bloqueiam)

1. **O teste identifica as transações pelo texto exato das consultas** — `apps/api/test/auth-session.e2e-spec.ts:466–467`  
   Regra violada: a seção 2.1 de `docs/architecture.md` estabelece testes de integração como verificação de qualidade. `.agents/agents/revisor-codigo.md` reprova testes acoplados a detalhes de implementação que quebram em refatorações.  
   Prejuízo concreto: dividir o `SELECT` em duas linhas ou qualificar o nome da tabela mantém o mesmo bloqueio no PostgreSQL, mas impede que o filtro encontre a transação. A espera expira e o teste falha mesmo com a revogação correta. Identificar as conexões pelo PID ou por um marcador de transação preservaria a checagem de bloqueio real via `pg_blocking_pids`.

## Sugestões (não bloqueiam)

Nenhuma.

## Observações fora do escopo deste diff

Nenhuma.

A suíte passou com 21 de 21 testes no banco PostgreSQL isolado.
