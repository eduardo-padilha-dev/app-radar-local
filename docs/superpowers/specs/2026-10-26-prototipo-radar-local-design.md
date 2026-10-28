# Protótipo Radar Local — Atividade 06

## Objetivo e decisões confirmadas

Criar um protótipo clicável no Figma, na equipe estudantil
`eduardo-padilha-dev` (`team::1683989209387367004`), para materializar o PRD.
O aluno aprovou cinco telas principais e suas variações nesta conversa.
Este documento registra essa proposta para leitura antes da criação no Figma.

## Abordagens

- Stitch: geração por descrição; sugerido inicialmente.
- Figma: escolhido pelo aluno, com criação pela integração disponível e
  ligações de protótipo entre telas editáveis.

## Cobertura aprovada

| Tela principal | Histórias | Conteúdo e variações |
| --- | --- | --- |
| Acesso | US01, US02, US03 | Cadastro, confirmação de e-mail, entrada e saída; validação, link expirado/inválido, reenvio e acesso negado. |
| Prospecção | US04, US05, US07 | Cidade, estado, ramo opcional, resultados e histórico; demonstração, filtros, sem interesse, vazio e falha de consulta. |
| Acompanhamentos | US06 | Salvar sem duplicação, cinco status do PRD e valor opcional em projeto aceito/finalizado; consulta sem edição após vencimento. |
| Meu plano | US08 | Contratação e renovação manual por 30 dias; pedido pendente, confirmado, recusado, cancelado/expirado e orientação de suporte quando não confirmado. |
| Administração | US09, US10 | Dados cadastrais, criação/edição, desativação/reativação e consulta de pedidos, pagamentos e validade; sem acesso à prospecção privada. |

Cinco telas principais não significam cinco frames no total: estados e etapas
podem precisar de frames auxiliares ou sobreposições para serem clicáveis.
As histórias Draft não serão promovidas nem implementadas por este trabalho.

## Navegação

- Cadastro → confirmação de e-mail → entrada → prospecção.
- Entrada como administrador → administração; saída → acesso.
- Prospecção ↔ acompanhamentos ↔ meu plano, com retorno e saída acessíveis.
- Meu plano → simulação do pagamento externo → consulta do pedido.
- Pedido pendente → nova consulta → situação atual; não liberar acesso pelo
  simples retorno da simulação. Permitir simular ausência e nova entrada.
- Administração → cadastro/edição do usuário ou consulta das contratações
  → retorno à lista, preservando a separação de perfis.

## Referência visual

Reutilizar os valores já aprovados em `docs/design-tokens.md`: primária
`#2563EB`, hover `#1D4ED8`, fundo `#F8FAFC`, superfície `#FFFFFF`, texto
`#0F172A`, texto suave `#475569`, perigo `#B91C1C`, sucesso `#15803D` e
desabilitado `#E2E8F0`; Inter e a escala existente de espaçamento.
Não acrescentar tokens sem confirmação do aluno.

Demonstrar os cinco estados do botão principal, incluindo foco visível e
carregamento que impede novos cliques. Em largura estreita, apresentar
conteúdos extensos em cartões e manter ações e informações essenciais legíveis.

## Limites e pendências reais

- Fonte de comportamento: `docs/prd.md`; pagamento segue `docs/user-flows.md`.
- Usar dados fictícios identificados; não realizar cadastro ou pagamento real.
- Não inventar preço, limites de uso, prazo de expiração ou canal de suporte.
  Identificar essas decisões como pendentes no protótipo.
- Não definir stack, arquitetura, banco ou contratos; não criar aplicação.
- Não declarar navegação por teclado funcional apenas por desenhar foco.
- Link público só será registrado como validado depois da verificação sem login.
- Falhas ou limitações da integração devem ser relatadas, sem tratar telas
  estáticas como protótipo navegável concluído.

## Critérios de conclusão

Todas as Must Have mapeadas, jornada principal e desvios navegáveis com volta,
legibilidade em larguras ampla e estreita, tokens conferidos com o aluno,
link real do protótipo e lista de telas em `docs/design-tokens.md`.
O aluno revisa e commita a documentação e escreve a explicação do PR, conforme
`CONTRIBUTING.md` e `/utf-design`. O PR de manutenção usa a etiqueta
`manutencao`, sem `Closes #`, e apontamentos “não se aplica”.
