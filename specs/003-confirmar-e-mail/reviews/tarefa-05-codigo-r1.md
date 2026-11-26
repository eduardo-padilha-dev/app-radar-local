# Parecer de Código — Tarefa 5

**Veredito:** APONTAMENTOS

## Apontamentos (bloqueiam)

1. **A resposta pode encerrar a solicitação com o envio ainda pendente** — `apps/api/src/modules/auth/auth.service.ts:154`  
   Regra violada — `docs/architecture.md:143` atribui o envio ao adaptador, e `specs/003-confirmar-e-mail/plan.md:8` exige uma janela pública que inclua o tempo limite do adaptador.  
   Prejuízo concreto — o serviço aguarda apenas o temporizador de 11 segundos. O prazo de 10 segundos do adaptador começa depois da consulta, da trava e do commit. Se essa etapa exceder 1 segundo, o HTTP 202 pode sair antes do fim do prazo do adaptador, com o trabalho ainda pendente na memória do processo. Se o processo encerrar nesse intervalo, o envio pode se perder enquanto o link já persistido impede nova emissão durante o intervalo de reenvio.

## Sugestões (não bloqueiam)

- Em `apps/api/test/email-verification.e2e-spec.ts:330`, os quatro novos casos aguardam a janela real e acrescentam cerca de 44 segundos à suíte. Controlar o relógio da janela nos testes funcionais permitiria manter a cobertura sem essa espera.

## Observações fora do escopo deste diff

- Nenhuma.

Passaram os 17 testes HTTP com PostgreSQL isolado e os 19 testes das duas páginas com Node 24.
