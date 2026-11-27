---
issue: 4
status: aprovada
---

# US03 — Complemento de autorização

## O problema

A proteção atual precisa ser aplicada individualmente a cada rota. Uma rota nova pode ficar acessível por engano. A verificação de acesso por papel e de propriedade existe em testes, mas falta demonstrá-la nas rotas da aplicação.

## A história

**Como** usuário cadastrado, **eu quero** entrar e sair da minha conta **para que** eu possa acessar minhas funções com privacidade.

## Critérios de aceite

- [ ] **CA8 — Guard global. Dada** uma rota NestJS sem marcação pública, **quando** a requisição chegar sem cookie de sessão válido, inclusive se o JWT tiver expirado, estiver adulterado ou a sessão tiver sido revogada, **então** a API responde HTTP 401 antes de executar a rota. O teste deve demonstrar que uma rota nova, sem guard ou marcação local, já nasce protegida.
- [ ] **CA9 — Rotas públicas. Dada** uma requisição sem sessão válida, **quando** chamar `GET /`, `POST /auth/login`, `POST /auth/register`, `POST /auth/verify-email`, `POST /auth/resend-verification` ou `POST /auth/logout`, **então** cada rota explicitamente pública mantém seu contrato atual. Credenciais inválidas continuam recebendo 401 no login. O logout continua validando a origem e, com a origem permitida, retorna 204 e limpa o cookie mesmo se ele estiver ausente, inválido ou expirado. A documentação permanece navegável em `/docs` e `/docs-json`.
- [ ] **CA10 — Regra de dono. Dada** uma conta autenticada, **quando** chamar `GET /auth/sessions/:id` com o UUID de uma sessão ativa da própria conta, **então** a API retorna HTTP 200 com `{ data: { id, expiresAt } }`. A consulta deve combinar o UUID recebido com o ID da conta autenticada. Sessão inexistente, expirada, revogada ou de outra conta retorna o mesmo HTTP 404, inclusive quando a conta autenticada tem papel de administrador. UUID malformado retorna 400. Sem sessão válida, retorna 401. A resposta nunca inclui JWT, hash de senha ou dados de outra conta.
- [ ] **CA11 — Acesso administrativo. Dada** uma chamada a `GET /admin/access`, **quando** a sessão for válida e o papel atual no servidor for administrador, **então** a API retorna HTTP 204 sem corpo. Com sessão válida de desenvolvedor, retorna HTTP 403. Sem sessão válida, retorna HTTP 401. A rota aparece no Swagger com autenticação por cookie e os três status documentados. O 403 deve ser reproduzível no Swagger após entrar com uma conta de desenvolvedor no mesmo navegador, sem copiar o JWT do cookie.

## Fora de escopo

- A gestão de usuários da US09, incluindo consulta, edição, desativação e reativação de contas.
- Históricos de prospecção e outras operações das histórias de busca e acompanhamento.
- Tela de administração, lista de sessões e revogação de sessões por ID.

## Abandono no meio

Se a sessão expirar entre o login e a chamada protegida, o servidor retorna 401 e a pessoa precisa entrar novamente. O logout continua disponível para remover o cookie antigo. Se a sessão consultada for revogada antes da consulta, ela retorna o mesmo 404 de uma sessão inexistente.

## Assume que

| Premissa | Issue que fecha |
| --- | --- |

## Depende de

- US03, Issue #4. O modelo de sessão, o cookie HttpOnly e o guard de papéis já estão na main.

## Dúvidas em aberto

| # | Dúvida | Quem responde |
| --- | --- |
