---
issue: 4
status: aprovada
---

# US03 — Entrar e sair da conta

## O problema

Quem já tem uma conta no Radar Local precisa acessar as funções do próprio perfil e poder encerrar esse acesso ao terminar. Sem esse controle, dados privados podem ficar acessíveis em um dispositivo compartilhado ou por uma sessão aberta antes da desativação da conta.

## A história

**Como** usuário cadastrado, **eu quero** entrar e sair da minha conta **para que** eu possa acessar minhas funções com privacidade.

## Critérios de aceite

- [ ] **CA1 — Dado** um e-mail e uma senha corretos de uma conta ativa, **quando** o usuário entrar, **então** poderá acessar as funções privadas disponíveis para seu próprio perfil. A validação demonstrará o acesso de desenvolvedor e administrador e a recusa de uma função fora do respectivo perfil, inclusive o acesso administrativo a dados privados de prospecção.
- [ ] **CA2 — Dado** um e-mail inexistente, uma senha incorreta ou uma conta desativada, **quando** o usuário tentar entrar, **então** a tentativa será recusada sem criar sessão e a tela exibirá a mesma mensagem nos três casos.
- [ ] **CA3 — Dado** um desenvolvedor com conta ativa e e-mail pendente, **quando** entrar com as credenciais corretas, **então** terá acesso às funções permitidas do perfil e a regra de elegibilidade da US02 continuará bloqueando sua busca. A validação usará a conta autenticada e a regra existente. Com o e-mail confirmado, essa regra permite avaliar as demais condições de acesso à busca.
- [ ] **CA4 — Dado** um login bem-sucedido, **quando** o navegador receber a sessão, **então** o JWT será transportado em um cookie `HttpOnly`, com validade de oito horas a partir do login. O uso da sessão não estende esse prazo. Ao atingir oito horas, o servidor recusará o acesso privado com o cookie anterior e a tela pedirá novo login.
- [ ] **CA5 — Dado** que a mesma conta tem sessões em dois dispositivos, **quando** o usuário sair em um deles, **então** o servidor invalidará a sessão daquele dispositivo, o navegador removerá o cookie correspondente e o usuário precisará entrar novamente para usar funções privadas naquele dispositivo. A validação confirmará que o servidor recusa o cookie anterior mesmo se ele for reapresentado e que a sessão do outro dispositivo continua válida.
- [ ] **CA6 — Dado** que uma conta com sessões abertas é desativada, **quando** qualquer uma dessas sessões for usada para acessar uma função privada, **então** o servidor negará o acesso. A validação repetirá a tentativa após a reativação da conta e confirmará que todas as sessões anteriores continuam inválidas e que é necessário entrar novamente.
- [ ] **CA7 — Dado** que a rede falha durante a entrada ou a saída, **quando** a tela ficar sem confirmação da operação, **então** informará que a tentativa não pôde ser concluída e permitirá tentar novamente. Se o servidor já tiver encerrado a sessão na primeira saída, uma nova tentativa permitirá concluir a saída no navegador e o cookie anterior continuará inválido.

## Fora de escopo

- Cadastro e confirmação ou reenvio de e-mail, tratados pelas US01 e US02.
- Rota e tela de busca, consulta de estabelecimentos e consumo da demonstração, tratados pelas US04 e US07.
- Interface e operações administrativas de desativação ou reativação de contas, tratadas pela US09. A validação da US03 usa contas de teste nos estados necessários para demonstrar o efeito sobre as sessões.
- Recuperação de senha e alteração de dados de cadastro.

## Abandono no meio

Se a sessão expirar enquanto o usuário estiver com uma página privada aberta, a próxima tentativa de acesso privado pedirá novo login (CA4). Se a conexão cair antes de a tela receber a resposta de entrada ou saída, o usuário pode tentar novamente. Uma saída já processada pelo servidor mantém o cookie anterior inválido mesmo que o navegador não tenha recebido a resposta (CA5 e CA7).

## Assume que

| Premissa | Issue que fecha |
| --- | --- |

## Depende de

- Issue #2 — Criar conta de desenvolvedor, já integrada à `main`. Fornece o cadastro usado na entrada.
- Issue #3 — Confirmar e-mail, já integrada à `main`. Fornece o estado de confirmação e a regra de elegibilidade para buscas.

## Dúvidas em aberto

| # | Dúvida | Quem responde |
| --- | --- | --- |
