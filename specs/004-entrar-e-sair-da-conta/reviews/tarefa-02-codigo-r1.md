# Parecer de Código — Tarefa 2

**Veredito:** APONTAMENTOS

Os 9 testes HTTP da API e os 3 testes do Vue passaram. A suíte da API usou um banco de teste exclusivo e um segredo JWT efêmero.

## Apontamentos (bloqueiam)

1. **O modelo persistido de sessão ficou fora da arquitetura** — `apps/api/prisma/schema.prisma:49`  
   Regra violada: `docs/architecture.md` §5.4 exige atualização explícita quando há mudança de entidades. As seções §5.1 e §5.2 documentam o modelo de dados e seus relacionamentos.  
   Prejuízo concreto: o schema e a migração criam `auth_sessions`, com vínculo ao usuário, expiração, revogação e exclusão em cascata. O mapa de dados que orienta a revisão das próximas tarefas omite esse relacionamento e seu ciclo de vida.

2. **O Quick Start deixa a API sem uma variável obrigatória** — `apps/api/src/config/environment.ts:4`  
   Regra violada: `docs/architecture.md` §2.1, ID17, exige validação das variáveis obrigatórias na inicialização e exemplos sem segredos versionados.  
   Prejuízo concreto: em um checkout novo, seguir o Quick Start do `README.md:60` deixa `JWT_SECRET` vazio, conforme o `.env.example`. O comando `npm run api` falha com `JWT_SECRET is required`. A suíte HTTP injeta o próprio segredo e passa mesmo com essa lacuna.

3. **O formulário de entrada impede digitar algumas senhas válidas** — `apps/web/src/features/auth/LoginPage.vue:31`  
   Regra violada: `docs/architecture.md` §4 estabelece que o frontend adapta o contrato da API.  
   Prejuízo concreto: o `maxlength` do formulário conta unidades UTF-16. Confirmei com a dependência local que uma senha de 65 caracteres Unicode suplementares ocupa 130 unidades UTF-16 e passa nas validações do cadastro e do login HTTP. O usuário com essa senha persistida fica impedido de digitá-la integralmente na tela de entrada.

## Sugestões (não bloqueiam)

- Centralizar a leitura e a normalização de `CORS_ORIGIN`, hoje repetidas em `configure-app.ts` e `auth.controller.ts`, antes de reutilizar a validação de origem no logout.
- Comparar o JSON decodificado no teste do Vue. A ordem das propriedades serializadas pode mudar sem alterar o contrato HTTP.

## Observações fora do escopo deste diff

- Nenhuma.
