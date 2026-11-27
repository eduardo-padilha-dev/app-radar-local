# Plano — Issue #4

## Decisões técnicas

- Manter login, sessão e logout no `AuthModule`. Reutilizar a normalização de e-mail do cadastro e estender `PasswordHasher` para verificar os hashes scrypt já persistidos, com comparação em tempo constante. O caminho de e-mail inexistente também executará uma verificação de custo equivalente.
- Adicionar `AuthSession` ao Prisma, com identificador aleatório, vínculo ao usuário, expiração e data de revogação. O JWT assinado via `@nestjs/jwt` transportará o ID da conta e o ID da sessão. A chave vem de `JWT_SECRET` na API. O Guard valida a assinatura e consulta a sessão e a conta no banco a cada acesso privado. As permissões usam o perfil atual da conta e o dono dos dados consultados. [Autenticação no NestJS](https://docs.nestjs.com/security/authentication)
- `POST /auth/login` aceita e-mail e senha, define o cookie e responde com os dados mínimos para iniciar a área privada. Os três casos de credenciais recusadas devolvem o mesmo `401` e envelope. `GET /auth/session` devolve os dados mínimos do perfil autenticado ou `401`. `POST /auth/logout` revoga a sessão identificada, expira o cookie e devolve `204`, inclusive se a sessão já estiver encerrada. Respostas de sessão seguem o envelope existente quando há corpo e usam `Cache-Control: no-store`.
- Usar cookie restrito ao host da API, com `HttpOnly`, `SameSite=Lax`, caminho `/`, `Secure` em HTTPS e expiração de oito horas alinhada ao JWT e ao banco. Usar web e API no mesmo site, com proxy de mesma origem quando necessário. Habilitar credenciais na origem web configurada e validar a origem dos POSTs de sessão. O cliente HTTP envia cookies somente nas chamadas de sessão e nas chamadas privadas. [Cookies no NestJS](https://docs.nestjs.com/techniques/cookies)
- A operação interna de desativação atualiza `User.isActive` e revoga as sessões da conta na mesma transação. A criação de sessão verifica o estado ativo sob a mesma serialização por usuário, de forma que um login concorrente não deixe sessão válida após a desativação. A reativação permite criar nova sessão. A integração com a interface administrativa pertence à US09.
- No Vue, incluir `/entrar` e uma área privada mínima ajustada ao perfil. O roteador consulta a sessão pelo cliente HTTP existente antes de exibir a área privada. Os testes de autorização demonstram o acesso por perfil e a restrição aos próprios dados com recursos de teste. A elegibilidade da busca usa o ID já autenticado e o serviço entregue pela US02.

## Tarefas

- [x] **Tarefa 1 — Verificar senhas cadastradas**
  - Cobre CA1 e CA2 como pré-requisito técnico.
  - Teste primeiro — um hash já emitido pelo cadastro aceita a senha original e recusa senha errada ou hash inválido. Hoje o hasher oferece apenas geração.
  - Arquivos previstos — `apps/api/src/modules/auth/password-hasher.ts` e `password-hasher.spec.ts`.

- [x] **Tarefa 2 — Entrar na área privada**
  - Cobre CA1.
  - Teste primeiro — login HTTP dos dois perfis com contas persistidas e acesso a recurso protegido compatível. Os testes de autorização recusam o perfil incorreto e o acesso a dados de prospecção por administrador ou por outro desenvolvedor. No Vue, credenciais válidas levam à área do perfil e navegação sem sessão volta à tela de entrada. A rota de login e o Guard ainda não existem.
  - Arquivos previstos — módulo, controlador, DTOs, serviços e Guard de `apps/api/src/modules/auth/`, schema e migração Prisma, configuração da API, `apps/api/test/auth-session.e2e-spec.ts`, roteador, cliente HTTP e `apps/web/src/features/auth/` com testes.

- [x] **Tarefa 3 — Recusar credenciais com mensagem única**
  - Cobre CA2.
  - Teste primeiro — e-mail inexistente, senha incorreta e conta desativada produzem o mesmo envelope `401`, sem cookie emitido ou sessão persistida. A tela mostra a mesma mensagem para as três respostas. O teste da verificação confirma que a ausência do e-mail ainda passa por uma derivação equivalente.
  - Arquivos previstos — serviço de login e testes em `apps/api/src/modules/auth/`, `apps/api/test/auth-session.e2e-spec.ts`, tela de entrada e seu teste em `apps/web/src/features/auth/`.

- [x] **Tarefa 4 — Aplicar a elegibilidade de busca**
  - Cobre CA3.
  - Teste primeiro — uma conta persistida com e-mail pendente entra e alcança a área privada. A regra de elegibilidade recusa a busca para a identidade autenticada e deixa a demonstração intacta. Com e-mail confirmado, a regra permite verificar as demais condições. O teste exige a ligação do contexto autenticado ao serviço da US02.
  - Arquivos previstos — `apps/api/src/modules/auth/search-email-eligibility.service.ts` se a adaptação for necessária e `apps/api/test/auth-session.e2e-spec.ts`.

- [x] **Tarefa 5 — Expirar a sessão**
  - Cobre CA4.
  - Teste primeiro — com relógio controlado, verificar os atributos do cookie e aceitar a sessão antes de oito horas. Atividade intermediária mantém a expiração original. No limite, o acesso privado com o cookie anterior retorna `401` e o Vue solicita novo login. O cenário falha enquanto faltar a política completa de expiração no fluxo.
  - Arquivos previstos — configuração de cookie e serviço de sessão da API, `apps/api/test/auth-session.e2e-spec.ts`, roteador, área privada e respectivos testes web.

- [x] **Tarefa 6 — Sair do dispositivo atual**
  - Cobre CA5.
  - Teste primeiro — duas sessões da mesma conta acessam a área privada. Sair pela primeira expira seu cookie, invalida seu JWT reapresentado e mantém a segunda sessão válida. A tela volta à entrada e exige login ao tentar reabrir a área privada. Hoje não há encerramento por sessão.
  - Arquivos previstos — controlador, serviço de sessão e configuração HTTP da API, `apps/api/test/auth-session.e2e-spec.ts`, cliente e área privada com teste em `apps/web/src/features/auth/`.

- [ ] **Tarefa 7 — Revogar sessões da conta desativada**
  - Cobre CA6.
  - Teste primeiro — ao desativar uma conta com duas sessões, ambas perdem acesso. Depois da reativação, ambas continuam inválidas e um novo login funciona. Um teste de concorrência confirma que um login iniciado antes da desativação não deixa sessão válida após a transação. O cenário falha enquanto a transição de estado não revogar as sessões.
  - Arquivos previstos — operação interna de desativação, serviço de sessão e `apps/api/test/auth-session.e2e-spec.ts`.

- [ ] **Tarefa 8 — Retomar após falha de rede**
  - Cobre CA7.
  - Teste primeiro — simular falha de transporte durante login e logout. Em cada tela, o usuário vê a mensagem e consegue tentar novamente. No logout, simular a perda da resposta após a revogação e confirmar que a saída pode ser concluída na nova tentativa e que a API continua recusando o cookie antigo.
  - Arquivos previstos — tela de entrada, área privada, cliente de sessão e testes web, mais `apps/api/test/auth-session.e2e-spec.ts` para a repetição do logout.

## Critérios sem tarefa
