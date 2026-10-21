# 🎨 Tokens de Design

**Projeto:** Radar Local
**Versão:** 1.0.0 · tokens aprovados na entrevista, aguardando leitura integral e commit do aluno
**Última atualização:** 2026-10-21

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

**Link:** pendente — o aluno informou que ainda não possui protótipo.

**Telas:** pendentes. O protótipo deverá reunir de 3 a 5 telas relacionadas à
[jornada de contratação e renovação do plano](user-flows.md), conforme a atividade.

Sugestão para a criação futura, ainda sem telas produzidas ou aprovadas:

1. Contratação ou renovação do plano.
2. Retorno do pagamento com situação “Processando pagamento”.
3. Consulta do pedido com pagamento confirmado e validade do plano.
4. Pedido ainda não confirmado, com orientação para procurar suporte.

Preço e limites do plano permanecem pendentes no [PRD](prd.md); o protótipo não
deve apresentar valores ou promessas de uso ainda não decididos.

## Pendências

| Pendência | Próximo passo |
| --- | --- |
| Criar e revisar o protótipo com 3 a 5 telas da jornada | Aluno escolhe a ferramenta e aprova as telas; registrar o link real quando existir |
| Validar os tokens nas telas | Conferir legibilidade, organização e estados dos botões ao revisar o protótipo |
