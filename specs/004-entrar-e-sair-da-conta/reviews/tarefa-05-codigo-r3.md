# Parecer de Código — Tarefa 5

**Veredito** APROVADO

## Apontamentos (bloqueiam)

Nenhum. Se o carregamento da tela de login falha após um `401`, ou se a navegação é abortada, o composable exibe o estado de erro e permite tentar novamente. A área privada mantém os dados ocultos. Os testes confirmam que, quando a navegação volta a funcionar, o usuário consegue entrar e recuperar o acesso.

## Sugestões (não bloqueiam)

- A comparação exata do `exp` fracionário acopla o teste HTTP à representação do JWT. O prazo persistido e as respostas imediatamente antes e no vencimento já verificam o limite de oito horas.

## Observações fora do escopo deste diff

Nenhuma. Passaram os 5 testes web, os 14 testes HTTP no PostgreSQL isolado e a verificação `git diff --check`. Revisão somente leitura.
