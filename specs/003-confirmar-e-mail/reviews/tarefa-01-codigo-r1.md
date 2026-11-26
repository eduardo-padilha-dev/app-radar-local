# Parecer de Código — Tarefa 1

**Veredito:** APONTAMENTOS

## Apontamentos (bloqueiam)

1. **A página gerencia a confirmação diretamente** — `apps/web/src/features/auth/VerifyEmailPage.vue:4`  
   Regra violada — `docs/architecture.md:254` e `docs/architecture.md:260` atribuem aos composables a chamada ao serviço e os estados da operação.  
   Prejuízo concreto — a requisição e as transições ficam presas ao `onMounted`. A retomada prevista na Tarefa 4 não poderá chamar a mesma operação sem extraí-la ou duplicá-la.

2. **A política de referenciador entra em vigor depois das primeiras requisições** — `apps/web/src/features/auth/VerifyEmailPage.vue:26`  
   Regra violada — `docs/architecture.md:249` prevê carregamento por rota, que ocorre antes da montagem, e `specs/003-confirmar-e-mail/plan.md:6` exige manter a URL original fora do referenciador das requisições da página.  
   Prejuízo concreto — ao abrir o link diretamente, o navegador carrega o script inicial e o código da rota antes de inserir o `<meta>`. Com a política padrão, essas requisições de mesma origem podem levar o token no cabeçalho `Referer`. O teste em `apps/web/src/features/auth/VerifyEmailPage.spec.ts:14` verifica a presença do `<meta>` quando o `fetch` simulado é chamado, depois dos carregamentos que expõem o token.

## Sugestões (não bloqueiam)

- Em `apps/api/test/email-verification.e2e-spec.ts:103`, o endereço fixo e a restrição de banco com nome fixo tornam a reexecução vulnerável a uma interrupção do processo antes da limpeza. Uma fixture única por execução reduziria esse risco.

## Observações fora do escopo deste diff

- Nenhuma.

Passaram os dois testes HTTP e o teste de interface com Node 24.
