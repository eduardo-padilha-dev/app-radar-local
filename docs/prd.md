# 📄 Product Requirements Document (PRD)

**Projeto:** Radar Local
**Versão:** 1.0.0 · entrevista concluída, aguardando leitura integral e commit do aluno
**Última atualização:** 2026-10-21

> Fonte da verdade sobre o que o produto faz. As decisões foram tomadas pelo
> aluno durante o `/utf-prd`; tecnologia será definida no `architecture.md`.
> O aluno confirmou o aceite do professor e a exclusividade do tema na turma.
> Todas as histórias permanecem `⚪ Draft`: só o aluno as promove a `🟡 Ready`.

## 🎯 1. Visão Geral e Objetivo

**O problema:** desenvolvedores freelancers precisam procurar possíveis clientes
manualmente, por exemplo no Google Maps, e organizar o acompanhamento dos
contatos por conta própria. Essa é a hipótese inicial do aluno sobre como
trabalham hoje; ainda não foi validada com usuários.

**A solução:** permitir que o desenvolvedor escolha uma cidade e um estado,
encontre estabelecimentos que aparentemente não possuem site próprio e
acompanhe seus contatos em um só lugar, registrando o status e, opcionalmente,
o valor combinado dos projetos aceitos ou finalizados. A negociação acontece
fora do Radar Local. O estabelecimento não precisa conhecer nem acessar o sistema.

O desenvolvedor é o cliente pagante: recebe uma demonstração limitada e pode
comprar um plano de acesso por 30 dias, com renovação manual. Preço e limites
dependem da avaliação dos custos (§9).

**Como saberemos que deu certo:** o desenvolvedor consegue encontrar um possível
cliente na região escolhida, registrar o contato e acompanhar seu resultado até
o encerramento.

## 📖 2. Glossário Ubíquo

| Termo | Significa | Não confundir com |
| :---- | :-------- | :---------------- |
| Desenvolvedor | Freelancer que usa e paga pelo Radar Local. | Administrador ou estabelecimento prospectado. |
| Administrador | Responsável pela plataforma, inicialmente o aluno. | Pessoa autorizada a consultar a prospecção privada dos desenvolvedores. |
| Estabelecimento | Negócio listado no Google Maps e encontrado na região pesquisada. | Usuário ou cliente pagante do Radar Local. |
| Possível cliente | Estabelecimento sem site próprio identificado nos dados consultados; pode ter redes sociais ou WhatsApp. | Garantia de inexistência de um site ou de contratação do freelancer. |
| Busca | Consulta por cidade e estado, com ramo de atividade opcional. | Contato com o estabelecimento. |
| Histórico de resultados | Registro privado dos estabelecimentos já apresentados nas buscas do desenvolvedor. | Lista escolhida para acompanhamento. |
| Acompanhamento do estabelecimento | Registro escolhido pelo desenvolvedor para controlar status de contato e resultado, com valor opcional do projeto. | Negociação dentro da plataforma: conversas e propostas acontecem fora dela. |
| Sem interesse | Marcação reversível que oculta o estabelecimento das buscas por padrão. | Exclusão do histórico ou do acompanhamento. |
| Demonstração | Uma busca gratuita por conta, com até cinco estabelecimentos; busca sem resultados não a consome. | Plano gratuito permanente ou acesso gratuito ao acompanhamento. |
| Plano de acesso | Acesso pago por 30 dias, com renovação manual. | Assinatura com cobrança automática. |
| Pedido | Registro de contratação ou renovação do plano pelo desenvolvedor. | Projeto vendido pelo freelancer ao estabelecimento. |
| Pagamento | Cobrança do plano do Radar Local e sua confirmação pelo serviço de cobrança. | Pagamento pelo serviço do freelancer, feito fora da plataforma. |

## 👤 3. Atores e Permissões

| Ator | Quem é | Pode | Não pode |
| :--- | :----- | :--- | :------- |
| Desenvolvedor | Freelancer cadastrado pelo próprio interessado ou pelo administrador. | Entrar e sair; confirmar e-mail; usar a demonstração após confirmação; contratar e renovar o plano; com plano válido, buscar, marcar interesse e acompanhar estabelecimentos; consultar seu histórico e acompanhamentos após o vencimento. | Acessar dados de outro desenvolvedor; administrar usuários; escolher perfil de administrador no cadastro; atribuir a si mesmo acesso pago; buscar antes de confirmar e-mail; alterar registros sem plano válido; acessar a conta enquanto desativada. |
| Administrador | Responsável pela plataforma, inicialmente o aluno. | Criar, consultar e editar usuários; desativar e reativar contas; consultar pedidos, pagamentos e validade dos planos. | Consultar histórico de buscas, acompanhamentos, status ou valores de projetos dos desenvolvedores; liberar acesso pago pela consulta administrativa; excluir contas definitivamente. |

O estabelecimento não possui perfil nem acessa o Radar Local.

## 📝 4. Escopo Funcional (User Stories)

`Must Have` define o escopo comprometido. Tamanho é outro eixo: `S` indica
história pequena e `M`, algumas tarefas. São estimativas iniciais a revisar
antes da implementação. O aluno promove a `🟡 Ready`; `🟢 Live` somente após
PR mesclado. Os critérios descrevem comportamento esperado, ainda não entregue.

### US01 — Criar conta de desenvolvedor · `Must Have` · `S` · Status: `🟡 Ready`

**Como** desenvolvedor freelancer, **eu quero** criar minha conta **para que**
eu possa experimentar o Radar Local e contratar seu acesso.

**Critérios de aceite:**

- [ ] **Dado** nome, e-mail ainda não cadastrado e senha válidos, **quando** concluir o cadastro, **então** minha conta será criada com perfil de desenvolvedor, e-mail pendente de confirmação e envio de link válido por 24 horas.
- [ ] **Dado** que não informei celular, **quando** concluir o cadastro com os campos obrigatórios válidos, **então** a conta será criada.
- [ ] **Dado** um e-mail já cadastrado, **quando** tentar usá-lo em outro cadastro, **então** a criação será impedida e o sistema informará o motivo.
- [ ] **Dado** campo obrigatório ausente ou e-mail em formato inválido, **quando** enviar o cadastro, **então** o sistema indicará o que corrigir e não criará a conta.

O cadastro não solicitará CPF.

**Regras relacionadas:** RN01, RN02, RN03.

### US02 — Confirmar e-mail · `Must Have` · `M` · Status: `🟡 Ready`

**Como** desenvolvedor, **eu quero** confirmar meu e-mail **para que** eu possa
liberar o acesso às buscas do Radar Local.

**Critérios de aceite:**

- [ ] **Dado** link válido, ainda não utilizado e enviado há menos de 24 horas, **quando** acessá-lo, **então** meu e-mail será confirmado.
- [ ] **Dado** link expirado ou inválido, **quando** tentar confirmar, **então** o sistema não confirmará o e-mail e informará o motivo.
- [ ] **Dado** e-mail pendente de confirmação, **quando** tentar buscar, **então** a busca será bloqueada sem consumir a demonstração.
- [ ] **Dado** link expirado, **quando** solicitar novo envio, **então** receberei outro link com validade de 24 horas.

**Regras relacionadas:** RN02, RN03, RN06.

### US03 — Entrar e sair da conta · `Must Have` · `S` · Status: `🟡 Ready`

**Como** usuário cadastrado, **eu quero** entrar e sair da minha conta **para que**
eu possa acessar minhas funções com privacidade.

**Critérios de aceite:**

- [ ] **Dado** e-mail e senha corretos e conta ativa, **quando** entrar, **então** terei acesso às funções do meu perfil.
- [ ] **Dado** credenciais incorretas, **quando** tentar entrar, **então** o acesso será negado com mensagem que não revele se o e-mail está cadastrado.
- [ ] **Dado** conta desativada, **quando** tentar entrar, **então** o acesso será negado.
- [ ] **Dado** que entrei, **quando** sair, **então** precisarei entrar novamente para acessar funções privadas.

E-mail ainda não confirmado permite entrar, mas mantém buscas bloqueadas.

**Regras relacionadas:** RN02, RN03, RN15, RN16.

### US04 — Buscar possíveis clientes · `Must Have` · `M` · Status: `⚪ Draft`

**Como** desenvolvedor com e-mail confirmado, **eu quero** buscar estabelecimentos
por cidade e estado, com ramo opcional, **para que** eu possa encontrar possíveis
clientes sem site próprio identificado.

**Critérios de aceite:**

- [ ] **Dado** cidade e estado válidos e permissão de busca, **quando** buscar, **então** verei estabelecimentos sem site próprio identificado nos dados consultados, incluindo aqueles com apenas redes sociais ou WhatsApp.
- [ ] **Dado** um ramo selecionado, **quando** buscar, **então** os resultados serão restritos a esse ramo; sem seleção, a busca será geral.
- [ ] **Dado** um estabelecimento retornado, **quando** consultar o resultado, **então** verei nome, endereço, telefone/WhatsApp quando disponível, link para o Google Maps e meu status de acompanhamento, se houver.
- [ ] **Dado** que nenhum estabelecimento foi encontrado, **quando** a consulta terminar, **então** o sistema informará que a busca não teve resultados.
- [ ] **Dado** falha na consulta, **quando** receber a resposta, **então** o sistema informará que não conseguiu concluir a busca, sem apresentar a falha como ausência de estabelecimentos.

Telefone só será identificado como WhatsApp quando essa informação estiver
disponível. Permissão de busca depende da demonstração ou de plano válido.
Limites e regras de consumo pendentes estão no §9.

**Regras relacionadas:** RN02, RN04, RN05, RN06, RN12, RN14.

### US05 — Consultar e organizar resultados já apresentados · `Must Have` · `M` · Status: `⚪ Draft`

**Como** desenvolvedor, **eu quero** consultar estabelecimentos que já apareceram
nas minhas buscas e indicar desinteresse **para que** eu evite avaliar
repetidamente os mesmos possíveis clientes.

**Critérios de aceite:**

- [ ] **Dado** que um estabelecimento apareceu em uma busca, **quando** consultar meu histórico, **então** ele estará registrado, sem duplicação quando aparecer novamente.
- [ ] **Dado** meu histórico, **quando** consultá-lo, **então** verei apenas os resultados apresentados para minha conta.
- [ ] **Dado** estabelecimento marcado como “Sem interesse”, **quando** buscar, **então** ele ficará oculto por padrão, com opção de exibi-lo novamente.
- [ ] **Dado** essa marcação e plano válido, **quando** desfazê-la, **então** o estabelecimento voltará a aparecer normalmente.
- [ ] **Dado** o filtro “Somente inéditos” ativo, **quando** buscar, **então** verei apenas estabelecimentos que ainda não apareceram para mim.
- [ ] **Dado** plano vencido, **quando** acessar o histórico, **então** poderei consultá-lo, mas não alterar as marcações.

**Regras relacionadas:** RN07, RN08, RN12, RN14, RN16.

### US06 — Acompanhar estabelecimentos de interesse · `Must Have` · `M` · Status: `🟡 Ready`

**Como** desenvolvedor, **eu quero** salvar estabelecimentos e registrar o andamento
dos contatos **para que** eu possa organizar minha prospecção e evitar abordagens
repetidas por engano.

**Critérios de aceite:**

- [ ] **Dado** estabelecimento encontrado e plano válido, **quando** salvá-lo para acompanhar, **então** ele entrará na minha lista com status “Não contatado”.
- [ ] **Dado** estabelecimento já salvo, **quando** tentar salvá-lo novamente, **então** será mantido um único acompanhamento, preservando os dados registrados.
- [ ] **Dado** acompanhamento e plano válido, **quando** atualizar o status, **então** poderei escolher “Não contatado”, “Contato realizado”, “Proposta recusada”, “Projeto aceito” ou “Projeto finalizado”.
- [ ] **Dado** status “Projeto aceito” ou “Projeto finalizado” e plano válido, **quando** registrar o projeto, **então** poderei informar o valor combinado, sem obrigação de preenchê-lo.
- [ ] **Dado** o filtro “Somente não contatados” ativo, **quando** buscar, **então** verei apenas estabelecimentos sem acompanhamento ou com status “Não contatado”, respeitando os demais filtros ativos.
- [ ] **Dado** plano vencido, **quando** acessar os acompanhamentos, **então** poderei consultá-los, mas não salvar novos nem alterar os existentes.

Negociação e pagamento pelo serviço do freelancer acontecem fora do Radar Local.
“Sem interesse” não apaga o acompanhamento, seu status ou valor.

**Regras relacionadas:** RN08, RN09, RN10, RN11, RN12, RN14, RN16.

### US07 — Experimentar a busca gratuitamente · `Must Have` · `S` · Status: `⚪ Draft`

**Como** desenvolvedor com e-mail confirmado, **eu quero** experimentar uma busca
gratuita **para que** eu possa avaliar o Radar Local antes de pagar.

**Critérios de aceite:**

- [ ] **Dado** que ainda não usei a demonstração, **quando** fizer uma busca com resultados, **então** receberei até cinco estabelecimentos e a demonstração será consumida.
- [ ] **Dado** busca sem resultados, **quando** ela terminar, **então** a demonstração continuará disponível.
- [ ] **Dado** demonstração consumida e ausência de plano válido, **quando** tentar outra busca, **então** o sistema solicitará a contratação do plano.
- [ ] **Dado** vencimento de um plano, **quando** acessar a conta, **então** nenhuma nova demonstração será concedida.

A demonstração permite buscar e consultar resultados; salvar para acompanhar e
alterar marcações exige plano válido.

**Regras relacionadas:** RN02, RN06, RN07, RN12, RN14.

### US08 — Contratar e renovar o plano de acesso · `Must Have` · `M` · Status: `⚪ Draft`

**Como** desenvolvedor, **eu quero** pagar pelo plano de 30 dias **para que** eu
possa utilizar as buscas e o acompanhamento do Radar Local.

**Critérios de aceite:**

- [ ] **Dado** que escolhi contratar o plano, **quando** iniciar o pagamento, **então** o sistema registrará um pedido com o preço definido pela plataforma.
- [ ] **Dado** pagamento pendente, recusado ou abandonado, **quando** consultar o acesso contratado, **então** esse pedido não terá liberado acesso pago.
- [ ] **Dado** confirmação válida do pagamento pelo serviço de cobrança, **quando** recebê-la, **então** o pedido será marcado como pago e o acesso será liberado por 30 dias.
- [ ] **Dado** renovação confirmada antes do vencimento, **quando** atualizar a validade, **então** os 30 dias serão acrescentados à validade atual.
- [ ] **Dado** plano vencido, **quando** um novo pagamento for confirmado, **então** os 30 dias começarão nessa confirmação.
- [ ] **Dado** confirmação repetida do mesmo pagamento, **quando** recebê-la novamente, **então** o período será concedido apenas uma vez.
- [ ] **Dado** vencimento, **quando** tentar novas buscas ou alterações, **então** essas ações serão bloqueadas, mantendo a consulta ao histórico e acompanhamentos.

Não haverá cobrança automática. O fluxo será demonstrado em ambiente de testes.
Preço e limites de uso permanecem pendentes no §9.

**Regras relacionadas:** RN12, RN13, RN14, RN15.

### US09 — Gerenciar usuários · `Must Have` · `M` · Status: `⚪ Draft`

**Como** administrador, **eu quero** criar, consultar, editar, desativar e reativar
usuários **para que** eu possa administrar o acesso ao Radar Local.

**Critérios de aceite:**

- [ ] **Dado** que sou administrador, **quando** consultar usuários, **então** verei seus dados cadastrais e se a conta está ativa.
- [ ] **Dado** dados cadastrais válidos e e-mail não utilizado, **quando** criar uma conta, **então** ela terá perfil de desenvolvedor e seguirá a confirmação de e-mail.
- [ ] **Dado** usuário existente, **quando** editar seus dados cadastrais, **então** as alterações respeitarão as mesmas validações do cadastro; mudar o e-mail exigirá confirmar o novo endereço antes de novas buscas.
- [ ] **Dado** conta ativa, **quando** desativá-la, **então** seu acesso será impedido e seus registros serão preservados.
- [ ] **Dado** conta desativada, **quando** reativá-la, **então** seu acesso voltará a respeitar a confirmação de e-mail e a validade original do plano, sem ganhar novos dias.
- [ ] **Dado** que sou desenvolvedor, **quando** tentar acessar a gestão de usuários, **então** o acesso será negado.
- [ ] **Dado** a gestão administrativa, **quando** consultar um usuário, **então** não terei acesso a seu histórico de buscas, acompanhamentos, status ou valores de projetos.

A desativação é lógica, sem exclusão definitiva, e substitui a função de bloqueio.

**Regras relacionadas:** RN01, RN02, RN03, RN15, RN16.

### US10 — Consultar pagamentos e validade dos planos · `Must Have` · `S` · Status: `🟡 Ready`

**Como** administrador, **eu quero** consultar pagamentos e validade dos planos
**para que** eu possa acompanhar as contratações do Radar Local.

**Critérios de aceite:**

- [ ] **Dado** um usuário, **quando** consultar suas contratações, **então** verei pedidos, valores, datas e situação dos pagamentos.
- [ ] **Dado** usuário com acesso contratado, **quando** consultar seu plano, **então** verei sua data de vencimento.
- [ ] **Dado** pagamento pendente ou recusado, **quando** consultá-lo, **então** ele não será apresentado como pago.
- [ ] **Dado** que sou desenvolvedor, **quando** tentar acessar essa consulta administrativa, **então** o acesso será negado.

A função é apenas de consulta; liberação do plano depende de confirmação do pagamento.

**Regras relacionadas:** RN12, RN13, RN15, RN16.

## 🛡️ 5. Regras de Negócio (Constraints)

| ID | Regra |
| :-- | :---- |
| RN01 | Cada conta tem e-mail único; nome, e-mail e senha são obrigatórios, celular é opcional e CPF não é solicitado no cadastro. |
| RN02 | O cadastro público cria apenas desenvolvedores; buscas exigem e-mail confirmado, inclusive na demonstração. |
| RN03 | A confirmação usa link de uso único, válido por 24 horas, com possibilidade de reenvio se expirar; alterar o e-mail exige confirmar o novo endereço antes de novas buscas. |
| RN04 | A busca exige cidade e estado; ramo de atividade é opcional. Sem ramo, a busca é geral. |
| RN05 | É possível cliente o estabelecimento sem site próprio identificado nos dados consultados; redes sociais e WhatsApp não o excluem. Não há garantia de inexistência de site. |
| RN06 | Cada conta recebe uma demonstração de até cinco resultados; busca sem resultados não a consome e o vencimento do plano não a renova. |
| RN07 | Resultados apresentados ficam no histórico privado do desenvolvedor, sem duplicação do estabelecimento. O filtro “Somente inéditos” inclui somente os que ainda não apareceram para ele. |
| RN08 | “Sem interesse” é reversível e oculta o estabelecimento das buscas por padrão, com opção de exibi-lo; preserva acompanhamento, status e valor. Alterar a marcação exige plano válido. |
| RN09 | Salvar para acompanhar é uma escolha; cada desenvolvedor tem no máximo um acompanhamento por estabelecimento, inicialmente “Não contatado”. Repetir o salvamento preserva os dados existentes. |
| RN10 | Os status são “Não contatado”, “Contato realizado”, “Proposta recusada”, “Projeto aceito” e “Projeto finalizado”; valor combinado é opcional nos dois últimos. “Somente não contatados” inclui estabelecimentos sem acompanhamento ou com status “Não contatado”. |
| RN11 | Negociação e pagamento do serviço do freelancer acontecem fora do Radar Local. O estabelecimento não precisa conhecer nem acessar o sistema. |
| RN12 | O plano libera buscas e alterações por 30 dias após confirmação do pagamento, sem renovação automática; renovação antecipada soma 30 dias à validade atual e renovação após vencimento começa na confirmação. O uso pago será limitado, com limites a definir após avaliação de custos. |
| RN13 | O sistema registra o pedido de contratação; pagamento não confirmado não libera acesso e confirmações repetidas não concedem dias adicionais. |
| RN14 | Após o vencimento, permanece a consulta ao histórico e acompanhamentos; novas buscas e alterações exigem renovação. Sem plano válido, a demonstração permite somente sua busca e consulta aos resultados, sem salvar acompanhamentos nem alterar marcações. |
| RN15 | Desativar uma conta impede seu acesso, preserva registros e mantém o vencimento original do plano, sem pausa ou extensão. Reativar não concede dias adicionais. |
| RN16 | O administrador gerencia usuários e consulta pedidos, pagamentos e validade, sem acessar históricos de busca, acompanhamentos, status ou valores de projetos dos desenvolvedores. Esses dados são privados de cada desenvolvedor. |

Um desenvolvedor pode possuir vários acompanhamentos e pedidos de contratação,
comportando relações de um para muitos (1:N) exigidas pela disciplina. O modelo
de dados e seu diagrama serão definidos na arquitetura.

## 🚫 6. Fora de Escopo (Non-goals)

| Item | Motivo do corte nesta versão |
| :--- | :-------------------------- |
| Recuperação automática de senha por e-mail | Validar o produto primeiro; o administrador atenderá manualmente, com procedimento a esclarecer (§9). |
| Cobrança recorrente automática, múltiplos planos e compra de créditos | Manter um único plano de 30 dias e menos regras de cobrança. |
| Conversas, propostas e recebimento do pagamento dos serviços do freelancer | A plataforma encontra possíveis clientes e acompanha status; negociação e serviço acontecem fora dela. |
| Garantia de que um estabelecimento realmente não possui site | A classificação usa somente as informações disponíveis na fonte consultada. |
| Verificação de identidade por CPF e garantia de uma conta por pessoa | Evitar complexidade de verificação de identidade; e-mail único não impede contas com endereços diferentes. |
| Busca por endereço e raio de distância | Começar com cidade e estado. |
| Exclusão definitiva de contas pela administração | Preservar registros; a administração apenas desativa ou reativa. |
| Acesso administrativo ao histórico de busca e acompanhamento dos desenvolvedores | Preservar a privacidade da prospecção de cada usuário. |

## ⚙️ 7. Requisitos Não Funcionais (Qualidade)

| ID | Requisito verificável |
| :-- | :-------------------- |
| RNF01 | Privacidade: cada desenvolvedor acessa apenas seus próprios históricos e acompanhamentos; o administrador também não pode consultar esses dados. |
| RNF02 | Controle de acesso: permissões e restrições do plano são verificadas pelo sistema, mesmo em tentativas de contornar a interface. |
| RNF03 | Segurança: senhas não são armazenadas em texto legível; credenciais dos serviços ficam fora do repositório. |
| RNF04 | Confiabilidade do pagamento: somente confirmação autêntica libera acesso; repetir a mesma confirmação não duplica dias. A disciplina exige confirmação assíncrona via webhook com verificação de assinatura, sem expor chaves. |
| RNF05 | Clareza nas falhas: distinguir busca sem resultados de falha na consulta e permitir nova tentativa. |
| RNF06 | Uso: interface em português, utilizável em computador e celular. |
| RNF07 | Verificação e entrega: testes automatizados cobrem caminhos principais de sucesso e erro; o projeto terá pagamento em ambiente de testes e aplicação publicada, conforme a ficha da disciplina. |

Não há promessa de tempo máximo de resposta antes de conhecer a fonte dos dados.
As decisões técnicas e os demais indicadores da disciplina serão tratados na
arquitetura e nos fluxos seguintes. Nenhum item do checklist é marcado como
entregue por este PRD.

## 🛠️ 8. Histórico

| Data | Versão | O que mudou |
| :--- | :----- | :---------- |
| 2026-10-21 | 1.0.0 | Entrevista via `/utf-prd`: visão, glossário, atores, dez histórias Draft, regras, cortes e requisitos de qualidade aprovados na conversa; aguardando leitura integral e commit do aluno. |

## ❓ 9. Dúvidas em aberto

Pendências não autorizam inventar regras. Devem ser resolvidas com o aluno antes
de promover as histórias afetadas a `🟡 Ready`.

| # | Dúvida | Onde resolver / histórias afetadas |
| :-- | :----- | :-------------------------------- |
| 1 | Qual fonte ou serviço permitirá encontrar estabelecimentos e identificar seus links? Qual o custo e quais as condições de consulta e armazenamento do histórico? | Avaliação de viabilidade e custos antes de fechar a arquitetura; US04, US05 e US07. |
| 2 | Qual será o preço do único plano de 30 dias? | Decisão do aluno após avaliar custos; US08 e US10. |
| 3 | Quais serão os limites do plano pago, a unidade de consumo, o período de contagem e o comportamento ao atingir a cota? O uso será limitado. | Decisão de negócio após avaliar custos; US04 e US08. |
| 4 | Uma busca sem resultados inéditos consumirá cota? Como filtros e falhas afetam o consumo? A regra fechada da demonstração permanece: busca sem resultados não a consome. | Decisão de negócio após avaliar custos; US04, US05, US07 e US08. |
| 5 | Como será feita a redefinição manual de senha pelo administrador, sem recuperação automática por e-mail? | Esclarecer o procedimento antes de implementar a gestão de usuários; US03 e US09. |
