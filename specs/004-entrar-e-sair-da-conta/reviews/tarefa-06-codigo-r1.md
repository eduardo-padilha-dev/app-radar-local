# Parecer de Código — Tarefa 6

**Veredito:** APONTAMENTOS

## Apontamentos (bloqueiam)

1. **O logout perde efeito sobre a tela se a área privada for remontada durante a operação** — `apps/web/src/features/auth/usePrivateSession.ts:45–59`  
   Regra violada — `docs/architecture.md:261–263` atribui ao composable o estado da operação e a prevenção de reenvios pendentes.  
   Prejuízo concreto — Com o POST de logout pendente, o usuário pode voltar à entrada e avançar para a área privada enquanto o cookie ainda é aceito. O roteador valida a sessão e monta uma nova instância. Quando chega o `204`, apenas a instância desmontada recebe `signed-out`. A nova mantém o perfil visível até outra revalidação e pode enviar um segundo logout enquanto o primeiro está pendente.

## Sugestões (não bloqueiam)

- Em `apps/api/test/auth-session.e2e-spec.ts:318`, verificar que `Expires` está no passado. A data exata escolhida pelo Express é um detalhe de implementação.

## Observações fora do escopo deste diff

- Nenhuma.

## Verificação

Os 18 testes da API passaram no banco isolado `radar_auth_task6_code_test`. Os 7 testes da área privada passaram. `git diff --check` passou. O cliente trata o `204` no caminho próprio e reaproveita o transporte e o tratamento de erros. A API reaproveita as opções do cookie, a checagem de origem e a validação do JWT.
