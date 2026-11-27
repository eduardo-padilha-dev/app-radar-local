# Parecer de Código — Tarefa 7

**Veredito:** APROVADO

## Apontamentos (bloqueiam)

Nenhum. O teste identifica cada conexão com `pg_backend_pid()` dentro da própria transação. Com o login pausado antes da inserção da sessão, `pg_blocking_pids()` confirma que o login bloqueia a desativação. A observação independe do texto das consultas da aplicação.

O `finally` libera o login, restaura o spy, aguarda as operações pendentes e reativa a conta de teste. A revogação permanece no `AuthSessionService`, na mesma transação que desativa a conta.

## Sugestões (não bloqueiam)

Nenhuma.

## Observações fora do escopo deste diff

Nenhuma.

A suíte de sessão passou duas vezes com 21 de 21 testes no PostgreSQL isolado. `git diff --check` passou.
