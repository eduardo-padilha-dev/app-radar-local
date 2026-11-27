# Parecer de Código — Tarefa 3

**Veredito:** APONTAMENTOS

## Apontamentos (bloqueiam)

1. **O hash usado quando a conta não existe duplica o formato do `PasswordHasher`** — `apps/api/src/modules/auth/auth-session.service.ts:12`  
   **Regra violada:** `docs/architecture.md` §2.1, “Senhas e tokens”, aplicada com a regra do guia de revisão contra duplicação de lógica. O serviço de sessão incorpora a versão e os parâmetros de derivação que `PasswordHasher` define e valida.  
   **Prejuízo concreto:** ao alterar esses parâmetros no `PasswordHasher`, `verify` pode rejeitar o hash substituto antes de rodar `scrypt`. Se o formato antigo continuar aceito, a derivação pode usar um custo diferente do aplicado às contas novas. Nos dois casos, o caminho sem conta perde a equivalência exigida pela tarefa. Manter o hash substituto junto da política de derivação evita esse descompasso.

## Sugestões (não bloqueiam)

- Em `apps/api/test/auth-session.e2e-spec.ts:211`, comparar o tamanho da chave e as opções observadas nas chamadas reais a `scrypt` entre os três cenários. Isso verifica a equivalência sem repetir os valores da configuração do hasher no teste.

## Observações fora do escopo deste diff

- Nenhuma.

A suíte de sessão passou com 12 testes no banco isolado `radar_auth_task3_code_test`. A suíte da tela de entrada passou com 7 testes.
