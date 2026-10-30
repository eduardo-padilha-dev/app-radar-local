---
issue: 2
status: aprovada
---

# US01 — Criar conta de desenvolvedor

## O problema

O desenvolvedor freelancer interessado em experimentar o Radar Local ainda não
possui uma conta própria para iniciar sua experiência e, posteriormente,
contratar o acesso ao produto.

## A história

**Como** desenvolvedor freelancer, **eu quero** criar minha conta **para que**
eu possa experimentar o Radar Local e contratar seu acesso.

## Critérios de aceite

- [ ] **CA1 — Dado** nome, e-mail ainda não cadastrado e senha válidos, **quando** concluir o cadastro e o serviço de e-mail aceitar o envio, **então** será criada uma conta ativa com perfil de desenvolvedor e e-mail pendente de confirmação, será enviado um link de uso único válido por 24 horas a partir de sua emissão e a tela informará “Conta criada. Confira seu e-mail para confirmar o cadastro.” O cadastro não iniciará uma sessão nem concederá acesso pago.
- [ ] **CA2 — Dado** que os campos obrigatórios são válidos, **quando** concluir o cadastro sem celular ou com celular vazio, **então** a conta será criada sem celular informado; com celular válido, o número será associado à conta. O formulário não solicitará CPF.
- [ ] **CA3 — Dado** um campo obrigatório ausente ou um valor fora das regras abaixo, **quando** enviar o cadastro, **então** o sistema indicará junto a cada campo inválido a regra a corrigir, não criará a conta nem enviará e-mail e permitirá corrigir o formulário sem apagar os demais campos:
  - Nome obrigatório, com 2 a 100 caracteres após remover espaços nas extremidades, sem exigir sobrenome.
  - E-mail obrigatório e em formato válido; remover espaços nas extremidades e ignorar diferenças entre maiúsculas e minúsculas ao armazenar e comparar. Preservar pontos e o trecho iniciado por `+`.
  - Senha obrigatória, de 8 a 128 caracteres, permitindo espaços, sem exigir maiúscula, número ou símbolo. Espaços da senha não serão removidos.
  - Celular opcional; quando preenchido, aceitar número brasileiro com DDD, espaços, parênteses, hífen e prefixo `+55` opcional. Após retirar a formatação e o prefixo, exigir 11 dígitos nacionais, com o primeiro dígito depois do DDD igual a `9`.
- [ ] **CA4 — Dado** um e-mail já cadastrado, inclusive com diferenças apenas de maiúsculas ou espaços nas extremidades, **quando** tentar outro cadastro com esse endereço, **então** o sistema não criará outra conta nem alterará a existente e mostrará “Este e-mail já está cadastrado. Entre na sua conta ou solicite o reenvio da confirmação.” Endereços diferentes por pontos ou pelo trecho `+` não serão agrupados por essa normalização.
- [ ] **CA5 — Dado** que a conta foi criada e o serviço de e-mail informou falha ou não respondeu dentro do prazo de espera, **quando** terminar a tentativa de envio, **então** a conta permanecerá ativa com e-mail pendente, sem duplicação e sem confirmação automática; a tela mostrará “Sua conta foi criada, mas não conseguimos confirmar o envio do e-mail de confirmação. Tente reenviar o link.” A ausência de resposta não será apresentada como prova de que o e-mail não foi enviado. O reenvio da confirmação será atendido pela US02, sem exigir novo cadastro.
- [ ] **CA6 — Dado** que a conta foi criada, mas a conexão caiu antes de a pessoa receber a resposta, **quando** repetir o cadastro com o mesmo e-mail, **então** a conta existente será preservada, sem duplicação, e será exibida a orientação de CA4 para entrar ou solicitar reenvio da confirmação.
- [ ] **CA7 — Dado** que a pessoa está preenchendo o cadastro e ainda não o enviou, **quando** fechar a aba ou recarregar a página, **então** nenhuma conta será criada nem e-mail enviado; ao abrir novamente o cadastro, a aplicação não restaurará os valores preenchidos anteriormente. Esse comportamento não depende do preenchimento automático do navegador.
- [ ] **CA8 — Dado** que alguém envia no cadastro público um perfil de administrador ou campos de confirmação de e-mail, ativação de demonstração ou concessão de plano, **quando** o sistema receber a solicitação, **então** o cadastro será rejeitado, sem criar conta nem conceder privilégios; o perfil de desenvolvedor e o estado inicial serão determinados pelo sistema.

## Fora de escopo

- Confirmar o e-mail ao abrir o link e executar o reenvio: US02, Issue #3.
- Login, logout, recuperação de sessão e autenticação automática: US03, Issue #4.
- Buscas, consumo da demonstração, contratação de plano e gestão administrativa.
- Persistir rascunho do formulário entre visitas ou oferecer cadastro social.
- Garantir entrega na caixa de entrada: o aceite do envio pelo provedor não comprova recebimento ou leitura.
- Fila de envio, retentativas automáticas e painel de acompanhamento de entregas.

## Abandono no meio

Não há jornada de cadastro desenhada em `docs/user-flows.md`: a jornada existente
trata da US08, de pagamento. Os casos desta história foram discutidos na
entrevista ou explicitados neste rascunho para leitura e aprovação.

Se a pessoa abandonar o formulário antes do envio, não há cadastro iniciado no
servidor nem rascunho persistido pela aplicação (CA7). Depois de a conta ter sido
criada, perder a resposta não apaga o cadastro: uma repetição encontra a mesma
conta e orienta a recuperação do acesso, sem criar outra (CA6 e CA4).

A falha de envio não desfaz a conta. O e-mail continua pendente e a pessoa recebe
uma orientação de reenvio (CA5). Quando não houver resposta do serviço de e-mail,
não será possível afirmar que ele deixou de enviar a mensagem; a orientação
precisa refletir essa incerteza (CA5). A confirmação e o reenvio pertencem à
US02. Como o cadastro é público e não inicia sessão, expiração de sessão não é
pré-condição desse fluxo (CA1).

## Assume que

| Premissa | Issue que fecha |
| --- | --- |
| A confirmação pelo link e o reenvio ainda não existem. Nesta história, enviar o link real e apresentar a orientação; não simular confirmação nem oferecer um botão de reenvio funcional. Na Atividade 10, marcar a orientação da página de resultado do cadastro, em `apps/web/src/features/auth/`, com `// TODO #3`: conectar à confirmação e ao reenvio, incluindo falha do envio inicial. | #3 — US02: Confirmar e-mail. O reenvio após falha inicial foi aprovado nesta entrevista e deve ser incorporado à especificação da US02. |
| O login ainda não existe. Nesta história, apresentar a orientação para entrar sem criar autenticação provisória ou destino funcional fictício. Na Atividade 10, marcar essa orientação, em `apps/web/src/features/auth/`, com `// TODO #4`: conectar ao fluxo real de entrada. | #4 — US03: Entrar e sair da conta. |

## Dúvidas em aberto

| # | Dúvida | Quem responde |
| --- | --- | --- |
