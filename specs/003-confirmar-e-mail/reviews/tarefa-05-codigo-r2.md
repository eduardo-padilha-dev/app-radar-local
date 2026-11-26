# Parecer de Código — Tarefa 5

**Veredito:** APROVADO

## Apontamentos (bloqueiam)

## Sugestões (não bloqueiam)

- Em `apps/api/src/modules/auth/auth.service.ts:33`, os 10 segundos do adaptador aparecem também no cálculo da janela pública. Uma constante compartilhada evitaria que uma mudança futura no prazo do adaptador deixasse esse cálculo desatualizado.

## Observações fora do escopo deste diff

- Nenhuma.

O serviço aguarda tanto a janela pública de 16 segundos quanto a conclusão da tentativa de envio. A transação tem limites explícitos, o provedor é chamado após a gravação e o resultado público continua uniforme. O teste de regressão mantém o provedor pendente ao avançar o temporizador e comprova que o serviço ainda aguarda. Os quatro casos funcionais substituem o temporizador público e mantêm o PostgreSQL real.

Passaram os 18 testes HTTP com PostgreSQL isolado e os 19 testes das duas páginas com Node 24.
