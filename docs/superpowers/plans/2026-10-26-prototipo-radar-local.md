# Plano do protótipo Radar Local

**Objetivo:** produzir e validar o protótipo da Atividade 06 no Figma.
**Referência:** [proposta de design](../specs/2026-10-26-prototipo-radar-local-design.md).
**Execução:** pelo agente nesta sessão, usando a integração do Figma.
**Ferramenta:** Figma Design na equipe estudantil escolhida. Sem decisão de stack.

## Restrições

Seguir PRD, jornada e tokens existentes. Não promover histórias Draft, inventar
decisões pendentes ou executar pagamentos reais. Commits desta fase e explicação
do PR pertencem ao aluno. O trabalho fica em `chore/design`.

## Etapas

- [x] Aluno lê e confirma a proposta registrada e este plano.
- [x] Ler as instruções Figma de criação de telas e da API de prototipagem.
- [x] Criar o arquivo na equipe `team::1683989209387367004` e abrir sessão.
- [x] Consultar bibliotecas/componentes disponíveis e conferir sua compatibilidade
  com os tokens aprovados; não substituir a referência visual por outra biblioteca.
- [x] Criar as cinco telas principais e as variações listadas na proposta,
  com dados fictícios e os cinco estados de botão.
- [x] Ligar ações principais, desvios e retornos; configurar início da apresentação.
- [x] Conferir destinos das ligações e capturas visuais; corrigir problemas encontrados.
- [x] Conferir apresentação ampla e estreita nas capturas de resultados e pagamento,
  corrigindo a sobreposição encontrada. A revisão interativa do aluno permanece pendente.
- [ ] Apresentar o protótipo ao aluno e colher a revisão dos tokens por bloco,
  começando pela paleta, conforme `/utf-design`.
- [ ] Verificar o compartilhamento público e percorrer a jornada sem login;
  se exigir ação manual no Figma, informar exatamente essa pendência.
- [ ] Atualizar `docs/design-tokens.md` com valores confirmados, link real e telas;
  ajustar a referência de etapa no `README.md` se a entrega estiver pronta.
- [ ] Conferir diff, cobertura das histórias e ausência de configurações/segredos.
- [ ] Entregar ao aluno os documentos para leitura e commit; orientar o PR com
  título `docs: design tokens e protótipo`, etiqueta `manutencao` e check `explicacao`.

## Verificações essenciais

- Separação de administrador e desenvolvedor, sem expor acompanhamento privado.
- Demonstração preservada em busca vazia e bloqueio por e-mail não confirmado.
- Plano vencido permite consulta, mas impede novas buscas e alterações.
- Retorno do pagamento e clique repetido não concedem dias nem duplicam pedidos.
- Pedido preservado na ausência do usuário e consultável depois de nova entrada.
- Toda decisão não definida continua explícita, sem preço ou suporte inventados.

Verificação por inspeção visual e ligações do protótipo; não há código de produto
ou suíte de testes a criar nesta atividade.

## Registro de execução — 26/10/2026

- Arquivo Figma: `cmWelzkMAf6rrXboXtuRxU`; sessão de integração:
  `d283c880-6e11-440a-89bd-c4ed6b66218d`.
- O aluno aprovou os documentos após receber o resumo do plano.
- Não havia biblioteca própria do Radar Local. Foi utilizado o componente
  Button do Simple Design System, adaptado aos tokens existentes, com ícones
  opcionais ocultos e tipografia Inter; cores e estilos locais reproduzem o documento.
- A resolução de um componente importado por ID entre chamadas retornou nulo;
  a importação na mesma operação corrigiu o problema, sem telas parciais persistidas.
- A API de navegação exigiu carregar os destinos na mesma operação antes de
  atribuir as ligações. Após isso, a auditoria encontrou 365 destinos válidos.
- A mudança geral de altura automática afetou rótulos de botão; foram separados
  os tratamentos de texto de conteúdo e de rótulos. As capturas posteriores
  confirmaram o ajuste em resultados estreitos e pagamento pendente.
- Inspeção: 60 frames, 883 textos em Inter, nenhuma imagem achatada e nenhum
  frame sem caminho de saída. Esses números não substituem o teste interativo.
- Limitação: seis referências estreitas; seus desvios podem abrir telas amplas.
- Compartilhamento público não foi confirmado. A ferramenta web não conseguiu
  abrir a apresentação e a integração não expõe o ajuste de permissões.
- Os valores dos tokens foram preservados. A revisão pelo aluno, o teste em
  janela anônima, commit e PR permanecem pendentes.

## Revisão visual — 27/10/2026

O aluno rejeitou a composição inicial. Após consultar uma referência enviada
por ele, pediu liberdade para buscar inspiração em sistemas semelhantes.
Foi escolhida a organização de prospecção do Apollo como referência e criada
uma única proposta de busca/resultados, no frame `8:1181`, para avaliação antes
de alterar as demais telas. Paleta, Inter e escala de espaçamento foram mantidas.
A captura final mostra conteúdo dentro do frame de 1440 × 1000, com área
principal de 998 de altura. A proposta usa menu lateral, busca horizontal e
tabela de cinco estabelecimentos fictícios. Sua aprovação visual está pendente;
os destinos das ações ainda incluem telas da versão anterior.

## Ajustes no arquivo gerado pelo aluno — 27/10/2026

O aluno forneceu o arquivo `1CkMDJeQzb7jj7eLUlTgII` e autorizou os ajustes
apontados na análise. A referência atual está em `docs/design-tokens.md`.
Foram conectados cadastro, confirmação, busca, acompanhamento, pagamento,
retomada do pedido e administração em desktop e celular, com cenários auxiliares.
Foram removidos os campos extras e normalizados cores e tipografia.
A verificação estrutural final passou em 22 sequências, sem destinos inválidos,
cores adicionais ou espaçamentos fora da escala. A apresentação em janela
anônima, a revisão do aluno, o commit e o PR continuam pendentes.
O protótipo usa casos predeterminados, sem persistência ou operações reais.
