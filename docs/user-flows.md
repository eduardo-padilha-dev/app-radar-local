# 🗺️ Jornadas de Usuário

**Projeto:** Radar Local
**Versão:** 1.0.0 · jornada aprovada na entrevista, aguardando leitura integral e commit do aluno
**Última atualização:** 2026-10-21

> Este documento descreve o caminho vivido pelo usuário e os pontos em que ele
> espera ou abandona o processo. Regras de negócio permanecem no `prd.md`;
> a estrutura técnica será definida no `architecture.md`.

## Jornada 1 — Contratar ou renovar o plano de 30 dias

**Story:** US08 — Contratar e renovar o plano de acesso, no [PRD](prd.md).

**Critérios que ela marca:**

| Critério | Como aparece nesta jornada |
| --- | --- |
| Sai do site e volta | O desenvolvedor segue para o pagamento e depois retorna ao Radar Local. |
| Depende do tempo | A confirmação pode chegar depois do retorno ou enquanto o usuário está ausente. |
| Depende de outra pessoa agir | Depende da atuação do serviço de cobrança para confirmar o resultado do pagamento. |
| Pode ser abandonada no meio | O desenvolvedor pode fechar a aba ou perder a conexão antes de voltar. |

**Ponto de partida:** desenvolvedor conectado que escolhe contratar ou renovar
seu plano. Preço e limites continuam pendentes no PRD; esta jornada não os define.

```mermaid
flowchart TD
    A(["Desenvolvedor conectado"]) --> B["«pessoa» escolhe contratar ou renovar o plano"]
    B --> C["Pedido registrado; pagamento aguardando confirmação"]
    C --> D["«pessoa» segue para o pagamento fora do Radar Local"]

    D --> E{"A pessoa volta ao Radar Local?"}
    E -->|"Sim"| F{"A sessão continua válida?"}
    E -->|"Fecha a aba ou perde a conexão"| X1[["Pessoa ausente: pedido preservado e processamento continua"]]
    X1 -->|"Quando voltar"| F
    F -->|"Não"| G["«pessoa» entra novamente na conta"]
    F -->|"Sim"| H{"Situação atual do pedido"}
    G --> H

    H -->|"Pagamento confirmado"| I(["«pessoa» vê pagamento confirmado e validade do plano"])
    H -->|"Confirmação pendente"| J["«pessoa» vê 'Processando pagamento'"]
    H -->|"Recusa, cancelamento ou expiração confirmados"| K(["«pessoa» vê a situação; este pedido não concede acesso"])
    J --> L["«pessoa» acompanha a situação do pedido"]
    L -->|"Consulta novamente"| H
    J -->|"Confirmação não chega"| X2[["Pagamento ainda não confirmado; sem liberação por este pedido"]]
    X2 --> M["«pessoa» é orientada a procurar suporte antes de pagar novamente"]

    D -.-> N["Serviço de cobrança processa o pagamento mesmo com a pessoa ausente"]
    N --> O{"Confirmação recebida pelo Radar Local"}
    O -->|"Pagamento confirmado de forma válida"| P["Pedido pago; concede 30 dias conforme a regra de renovação do PRD, uma única vez"]
    O -->|"Recusa, cancelamento ou expiração confirmados"| Q["Atualiza situação; este pedido não concede acesso"]
    O -->|"Ainda sem confirmação"| R["Preserva pedido aguardando; sem liberação por este pedido"]
    P -.-> H
    Q -.-> H
    R -.-> H

    style X1 fill:#ffe0e0,stroke:#c62828
    style X2 fill:#ffe0e0,stroke:#c62828
```

As linhas pontilhadas indicam o processamento e a atualização que independem da
presença do desenvolvedor. Voltar ao site, inclusive por uma tela que indique
sucesso, não comprova o pagamento. A liberação depende da confirmação válida do
serviço de cobrança, conforme o PRD. Um pedido pendente não remove dias de um
plano anterior que ainda esteja válido; apenas não concede novos dias.

**O que decidimos sobre o nó vermelho:**

O processo de pagamento deve continuar mesmo que o desenvolvedor feche a aba.
Quando voltar e fizer login, ele poderá visualizar o status do pedido. O acesso
por 30 dias só será liberado após a confirmação do serviço de pagamento,
independentemente de ele estar conectado. Enquanto essa confirmação não chegar,
o pedido continuará aguardando, sem ser cancelado apenas porque ele saiu.

O parágrafo acima foi organizado a partir da resposta do aluno e aprovado por
ele na entrevista.

**Demais situações discutidas e aprovadas:**

- **Conexão cai:** preservar o pedido e mostrar sua situação atual quando o
  desenvolvedor voltar, para que consulte o pedido existente antes de tentar
  pagar novamente.
- **Sessão expira:** exigir novo login para consultar o pedido; o processamento
  e a concessão dos dias após a confirmação continuam independentes da sessão.
- **Retorno indica sucesso antes da confirmação:** mostrar “Processando
  pagamento” e aguardar a confirmação do serviço de cobrança para conceder os dias.
- **Confirmação não chega:** mostrar “Pagamento ainda não confirmado”, sem
  conceder acesso por esse pedido, e orientar a procurar suporte antes de pagar
  novamente. Não foi definido um prazo automático para concluir que ela não chegou.
- **Renovação:** aplicar as regras do PRD: somar 30 dias à validade ainda ativa ou
  começar na confirmação se o plano estiver vencido; uma confirmação repetida
  não concede dias novamente.

## Dúvidas em aberto

| # | Dúvida | Onde ela precisa ser resolvida |
| --- | --- | --- |
| 1 | Preço e limites do plano permanecem pendentes, sem impedir o desenho da jornada. | PRD §9, antes de promover US08 a Ready. |
| 2 | Qual prazo ou condição permitirá considerar um pedido expirado, e como tratar a ausência prolongada de confirmação? Não há cancelamento automático por fechar a aba. | Decisão do aluno ao detalhar US08 e os estados na arquitetura, considerando o serviço de cobrança escolhido. |
| 3 | Qual será o canal de suporte e como o administrador verificará um pagamento não confirmado antes de orientar nova tentativa? | Decisão do aluno antes da implementação da jornada. |
