# Parecer de Código — Tarefa 5

**Veredito:** APONTAMENTOS

## Apontamentos (bloqueiam)

1. **A página concentra a revalidação da sessão** — `apps/web/src/features/auth/PrivateAreaPage.vue:12`  
   Regra violada: `docs/architecture.md`, §4, define a dependência página → composable → serviço da feature → cliente HTTP compartilhado.  
   Prejuízo concreto: a página passa a chamar o serviço, interpretar erros HTTP e coordenar requisições concorrentes. Uma mudança no tratamento da sessão exige alterar o componente que apresenta o perfil, e o teste da revalidação precisa montar a página com o roteador.

2. **A revalidação descarta falhas de transporte e respostas `5xx`** — `apps/web/src/features/auth/PrivateAreaPage.vue:17`  
   Regra violada: `docs/architecture.md`, §4, prevê que o composable represente os estados de carregamento, erro e sucesso.  
   Prejuízo concreto: quando a API está indisponível ao voltar à área privada, a tela continua exibindo o perfil anterior como se a verificação tivesse funcionado. O usuário não recebe indicação da falha nem pode iniciar uma nova tentativa pela tela.

## Sugestões (não bloqueiam)

- Em `apps/api/test/auth-session.e2e-spec.ts:264`, prefira validar o prazo persistido e a fronteira HTTP pelo comportamento observável. A decodificação pelo provider do Nest e a igualdade exata do `exp` fracionário fazem o teste depender de uma representação do JWT que pode mudar sem alterar essa fronteira.

## Observações fora do escopo deste diff

- Nenhuma. Os 14 testes HTTP da API e o teste da área privada passaram. `git diff --check` passou.
