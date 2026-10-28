# 🎨 Tokens de Design

**Projeto:** Radar Local
**Versão:** 1.2.0 · protótipo ajustado; revisão do aluno e acesso público pendentes
**Última atualização:** 2026-10-27

> Referência visual definida com o aluno no `/utf-design`. O objetivo é manter
> consistência entre as telas, sem construir um design system completo.
> Tecnologia e ferramentas de implementação ficam para a arquitetura.

## Direção visual

Aparência clean, com fundo claro, poucos destaques de cor, textos legíveis e
espaço entre os elementos. Azul destaca as ações principais. Sucesso e erro
usam cor apenas quando necessário, sempre acompanhada de texto.

## Paleta

Os nomes expressam o papel de cada cor.

| Token | Valor | Onde se usa |
| --- | --- | --- |
| `primaria` | `#2563EB` | Ações principais, como “Buscar” e “Contratar plano” |
| `primaria-hover` | `#1D4ED8` | Botão principal ao passar o cursor |
| `fundo` | `#F8FAFC` | Fundo das páginas |
| `superficie` | `#FFFFFF` | Cards e painéis; texto do botão principal |
| `texto` | `#0F172A` | Títulos e conteúdo |
| `texto-suave` | `#475569` | Legendas, informações de apoio e texto do botão desabilitado |
| `perigo` | `#B91C1C` | Erros e ações destrutivas |
| `sucesso` | `#15803D` | Pagamento confirmado e outras confirmações |
| `desabilitado` | `#E2E8F0` | Fundo de controles indisponíveis |

## Escala de espaçamento

Uma progressão única, em rem, conforme escolha do aluno. As equivalências em
pixels são apenas uma referência considerando tamanho padrão de fonte de 16 px;
não representam um tamanho fixo obrigatório para o navegador.

| Token | Valor | Referência | Uso típico |
| --- | --- | --- | --- |
| `xs` | `0.25 rem` | 4 px | Entre ícone e texto |
| `sm` | `0.5 rem` | 8 px | Entre elementos próximos |
| `md` | `1 rem` | 16 px | Entre campos e no interior de elementos |
| `lg` | `1.5 rem` | 24 px | Entre blocos e no interior de painéis |
| `xl` | `2 rem` | 32 px | Entre seções da página |

## Tipografia

**Família:** Inter, com fonte sem serifa do sistema como alternativa.

| Token | Família · tamanho · peso | Papel |
| --- | --- | --- |
| `titulo-pagina` | Inter · `2 rem` · 600 (seminegrito) | Título da página |
| `titulo-secao` | Inter · `1.25 rem` · 600 (seminegrito) | Título de seção ou card |
| `corpo` | Inter · `1 rem` · 400 (regular) | Textos e campos |
| `botao` | Inter · `1 rem` · 600 (seminegrito) | Texto dos botões |
| `legenda` | Inter · `0.875 rem` · 400 (regular) | Legendas e informações de apoio |

## Estados de botão

Referência para o botão principal:

| Estado | Aparência e comportamento |
| --- | --- |
| Normal | Fundo `primaria` (`#2563EB`) e texto branco (`#FFFFFF`) |
| Hover | Fundo `primaria-hover` (`#1D4ED8`), mantendo texto branco |
| Foco (teclado) | Contorno azul visível, usando `primaria`, separado do botão por um espaço |
| Desabilitado | Fundo `desabilitado` (`#E2E8F0`), texto `texto-suave` (`#475569`), sem permitir a ação |
| Carregando | Indicador de progresso e texto como “Processando…”, impedindo novos cliques durante o envio |

O foco permite identificar a posição da navegação pelo teclado. O carregamento
informa que a ação está em andamento e impede envios repetidos durante a espera;
a confirmação efetiva do pagamento continua seguindo a jornada e o PRD.

## Protótipo

**Ferramenta:** Figma Design. O aluno gerou este arquivo a partir do prompt
baseado no PRD e nos tokens existentes. Depois de uma análise somente leitura,
autorizou os ajustes de navegação, consistência e escopo em 27/10/2026.

**Arquivo editável:** [Radar Local](https://www.figma.com/design/1CkMDJeQzb7jj7eLUlTgII/Radar-Local).

**Apresentação — desktop:** [Percorrer o protótipo](https://www.figma.com/proto/1CkMDJeQzb7jj7eLUlTgII/Radar-Local?node-id=3-21788&starting-point-node-id=3%3A21788).

**Apresentação — celular:** [Percorrer a versão móvel](https://www.figma.com/proto/1CkMDJeQzb7jj7eLUlTgII/Radar-Local?node-id=3-21822&starting-point-node-id=3%3A21822).

**Cenários auxiliares:** [Erros, permissões e resultados simulados](https://www.figma.com/proto/1CkMDJeQzb7jj7eLUlTgII/Radar-Local?node-id=12-553&starting-point-node-id=12%3A553).

**Acesso público:** ainda não confirmado. Configurar o compartilhamento para
“Anyone with the link — can view” e testar a apresentação em janela anônima.
O acesso autenticado pela integração não comprova acesso público.

### Telas e cobertura das cinco áreas principais

| Área | Telas | Histórias do PRD |
| --- | --- | --- |
| Acesso | Entrar, criar conta e confirmar e-mail | US01, US02, US03 |
| Prospecção | Busca/resultados e histórico privado | US04, US05, US07 |
| Acompanhamentos | Lista, edição contextual e seleção de status | US06 |
| Meu plano | Contratação/renovação, pagamento externo fictício e consulta do pedido | US08 |
| Administração | Usuários, dados cadastrais e consulta dos pedidos | US09, US10 |

A área Conta apresenta dados somente para consulta e permite sair. O campo
Anotações foi retirado dos acompanhamentos por não estar previsto no PRD.
Nenhuma história foi promovida de Draft nem implementada por este trabalho.

Menu lateral, busca horizontal e tabelas compactas organizam o desktop.
No celular, os resultados usam cartões e o menu recolhido tem destinos
clicáveis próprios para essa largura. Os frames auxiliares representam estados
ou etapas dessas áreas, sem acrescentar funcionalidades ao escopo.

### Jornadas e estados

- Cadastro → carregamento → confirmação de e-mail → abertura simulada do link
  recebido → entrada → demonstração. Há estados de validação, e-mail duplicado,
  credenciais inválidas, conta desativada e link expirado/inválido.
- Busca → resultados → acompanhar → escolher status → salvar. Os cinco status
  do PRD têm representações de edição; projeto aceito/finalizado permite alternar
  o campo entre valor fictício e não informado.
- Busca inicial não marca Somente inéditos nem exibe os estabelecimentos sem
  interesse. Filtros têm variações próprias, incluindo a combinação de inéditos
  e não contatados. A marcação de desinteresse tem retorno e opção de desfazer.
- Demonstração disponível/consumida, busca vazia, falha de consulta, campos de
  busca obrigatórios, lista de acompanhamentos vazia e plano vencido possuem
  estados acessíveis pela central de cenários.
- Plano → preparação do pedido → pagamento externo fictício → retorno pendente.
  Os controles de simulação de confirmação, recusa e ausência de confirmação
  ficam separados das ações normais. Retornar não confirma o pagamento.
- Saída/expiração da sessão → nova entrada → consulta do pedido preservado.
  Contratação inicial e renovação têm contextos de retorno próprios.
- Administração → criar/consultar/editar usuário ou confirmar desativação e
  reativação; pedidos têm consultas por situação. Não há ação de liberação
  manual de acesso pago nem acesso à prospecção privada.

### Tokens e componentes

As cores adicionais geradas pelo Figma foram substituídas pelas cores aprovadas.
Textos de 14 px com peso 600 foram normalizados para a legenda de peso 400,
sem criar outro papel tipográfico. A escala em rem desta referência permanece
válida; o canvas do Figma exibe as equivalências em px considerando 1rem = 16px.

Os cinco estados do botão continuam representados. Há etapas de carregamento
que bloqueiam o reenvio da ação principal e avançam automaticamente na simulação.
Foco por teclado é uma referência visual; navegação real por teclado ainda
precisa de verificação na implementação.

### Limites e validação

O protótipo usa dados e entradas predeterminados, sem cadastro ou cobrança real.
As transições representam comportamentos, não uma aplicação com persistência
ou controle de acesso de produção. Os cenários permitem simular os desvios sem
misturá-los às decisões de negócio.

A verificação pela integração confere destinos, pontos iniciais, caminhos entre
estados e capturas visuais. Ela não substitui percorrer a apresentação em janela
anônima, conferir o comportamento da ferramenta de apresentação e revisar o
resultado com o aluno.

Preço, limites de uso, canal de suporte e condição de expiração permanecem
pendentes no [PRD](prd.md) e na [jornada](user-flows.md). Não foram inventados
valores, prazos ou promessas para preencher essas decisões.

## Pendências

| Pendência | Próximo passo |
| --- | --- |
| Acesso público e navegação na apresentação | Aluno configura compartilhamento e percorre as jornadas em janela anônima |
| Revisão final do protótipo | Aluno confere o resultado dos ajustes, inclusive estados auxiliares |
| Achado da prototipagem | Aluno identifica o que descobriu ao percorrer a jornada para escrever a própria explicação do PR |
| Commit e Pull Request | Aluno lê, commita e abre PR de manutenção; mesclar após o check e as validações da atividade |
