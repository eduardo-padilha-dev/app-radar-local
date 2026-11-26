---
issue: 3
status: aprovada
---

# US02 — Confirmar e-mail

## O problema

Depois de criar a conta, o desenvolvedor ainda precisa comprovar que tem acesso ao e-mail cadastrado para fazer buscas no Radar Local. Um link expirado ou um envio sem confirmação pode deixá-lo sem um caminho para concluir essa etapa.

## A história

**Como** desenvolvedor, **eu quero** confirmar meu e-mail **para que** eu possa liberar o acesso às buscas do Radar Local.

## Critérios de aceite

- [ ] **CA1 — Dado** um link válido, ainda não utilizado e emitido há menos de 24 horas, **quando** o desenvolvedor abrir o link, **então** o e-mail será confirmado, o link será marcado como usado e a página mostrará “E-mail confirmado”. A confirmação não cria sessão.
- [ ] **CA2 — Dado** um link que atingiu 24 horas sem uso ou um link inválido, ausente ou desconhecido, **quando** o desenvolvedor abrir a página de confirmação, **então** o e-mail permanecerá no estado anterior e a página informará se o link expirou ou é inválido. Para o link expirado, a página oferecerá reenvio.
- [ ] **CA3 — Dado** um desenvolvedor com e-mail pendente, **quando** a regra de acesso receber uma tentativa de busca para essa conta, **então** o backend recusará a tentativa por falta de confirmação antes de qualquer consumo da demonstração. O teste com a conta persistida deve comprovar que o estado da demonstração permanece intacto. Com o e-mail confirmado, essa regra permite avaliar as demais condições de acesso à busca.
- [ ] **CA4 — Dado** um link expirado ou um cadastro cujo envio não pôde ser confirmado, **quando** o desenvolvedor solicitar reenvio, **então** a tela apresentará uma resposta genérica que preserve a privacidade da conta. Para uma conta com confirmação pendente e envio aceito pelo provedor, o novo e-mail conterá outro link, válido por 24 horas a partir da emissão. Para endereço sem conta ou já confirmado, a resposta pública será a mesma e nenhum e-mail será emitido.
- [ ] **CA5 — Dado** que a resposta da confirmação se perdeu ou o desenvolvedor reabriu um link já usado, **quando** tentar novamente com o mesmo link, **então** a página mostrará “E-mail já confirmado” se a confirmação tiver sido gravada para aquele endereço. A data da confirmação permanecerá a mesma. Se a primeira tentativa não tiver sido gravada, a página permitirá tentar de novo enquanto o link estiver válido.
- [ ] **CA6 — Dado** que a rede falhou, o provedor rejeitou o envio ou a resposta do provedor excedeu o tempo de espera, **quando** o desenvolvedor pedir reenvio, **então** a tela evitará afirmar que o e-mail chegou e oferecerá nova tentativa após o intervalo exibido. O resultado público continuará genérico independentemente de existir conta para o endereço, e o pedido de reenvio manterá a confirmação pendente.

## Fora de escopo

- Entrada, saída e criação de sessão, tratadas pela US03.
- Rota e interface de busca, consulta de estabelecimentos e consumo da demonstração, tratados pelas US04 e US07.
- Alteração do e-mail cadastrado e gestão de contas pelo administrador, tratadas pela US09.

## Abandono no meio

Fechar a página ou perder a conexão antes de receber a resposta deixa o resultado da confirmação desconhecido para o desenvolvedor. Ao reabrir o link, o sistema mostra o estado persistido ou tenta confirmar novamente se o link ainda estiver válido (CA2 e CA5). Se uma solicitação de reenvio ficar sem resposta ou o provedor falhar, o desenvolvedor pode retomar após o intervalo exibido na página, sem precisar criar outra conta (CA4 e CA6).

## Assume que

| Premissa | Issue que fecha |
| --- | --- |
| A regra de bloqueio por e-mail pendente será demonstrada no backend com a conta persistida. A rota e a tela reais de busca passarão a usar essa regra quando a história de busca for implementada. | US04 — Buscar possíveis clientes, ainda sem número de issue no GitHub. O `TODO` de integração deve apontar para essa story e receber o número quando a issue for criada. |

## Depende de

- Issue #2 — Criar conta de desenvolvedor, já integrada à `main`. O cadastro fornece o estado de confirmação pendente, a emissão do primeiro link e a integração de e-mail.

## Dúvidas em aberto

| # | Dúvida | Quem responde |
| --- | --- | --- |
