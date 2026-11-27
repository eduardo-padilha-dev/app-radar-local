# Parecer de Conformidade — Tarefa 7

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA6 — As duas sessões perdem acesso na desativação, continuam inválidas após a reativação e um novo login funciona. | atendido | `apps/api/test/auth-session.e2e-spec.ts:330` |
| CA6 — A validação de concorrência prevista na Tarefa 7 comprova que um login em andamento não deixa sessão válida após a desativação. | não atendido | `apps/api/test/auth-session.e2e-spec.ts:360` |

## Apontamentos

1. **O teste de concorrência deixa sem cobertura a disputa entre as duas transações** — `apps/api/test/auth-session.e2e-spec.ts:392`  
   Critério violado: `specs/004-entrar-e-sair-da-conta/spec.md:23` exige que todas as sessões anteriores continuem inválidas após a reativação. O `plan.md:46` exige validar esse efeito para um login iniciado antes da desativação.  
   Evidência: o teste conclui a desativação antes de liberar o login para consultar novamente o estado da conta. Mesmo sem o `FOR UPDATE`, essa consulta retornaria a conta como desativada e o teste passaria. Fica sem cobertura a regressão em que o login lê a conta como ativa, a desativação conclui a revogação e só então o login grava a sessão. A suíte `auth-session.e2e-spec.ts` passou com 20 testes no banco isolado.
