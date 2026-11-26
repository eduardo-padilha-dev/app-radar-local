# Parecer de código — Alinhamento visual do acesso

**Veredito** — APONTAMENTOS

## Apontamentos que bloqueiam

1. **O cadastro pode confirmar e reenviar para o endereço errado.** A seção 4 da arquitetura separa o estado da interface dos dados enviados ao servidor. Se a pessoa editar o e-mail enquanto a requisição está pendente, a API recebe o primeiro endereço e a tela de sucesso exibe o segundo. O novo botão também usa o segundo endereço para reenviar. A tela deve usar o endereço capturado no envio para ambos os casos. [RegisterPage.vue](//wsl.localhost/Ubuntu/home/dudupadilha/projects/app-radar-local/apps/web/src/features/auth/RegisterPage.vue:25) · [useRegistration.ts](//wsl.localhost/Ubuntu/home/dudupadilha/projects/app-radar-local/apps/web/src/features/auth/useRegistration.ts:25)
2. **A fonte global passa a depender do histórico de navegação.** O CSS das rotas de acesso registra globalmente a fonte Inter, que os tokens já aplicam à aplicação toda. Assim, com uma sessão válida, abrir `/area-privada` diretamente usa a fonte do sistema, enquanto chegar pela tela de login usa Inter. Uma família com nome próprio aplicada apenas ao cabeçalho e ao conteúdo de acesso preserva a tipografia das demais telas. [access.css](//wsl.localhost/Ubuntu/home/dudupadilha/projects/app-radar-local/apps/web/src/features/auth/access.css:1) · [tokens.css](//wsl.localhost/Ubuntu/home/dudupadilha/projects/app-radar-local/apps/web/src/shared/styles/tokens.css:20)

## Sugestão

- A borda dos campos de login passou de 7,58:1 para 1,23:1 contra o fundo branco. Reforçar o contraste facilita identificar os campos vazios antes de receberem foco. [access.css](//wsl.localhost/Ubuntu/home/dudupadilha/projects/app-radar-local/apps/web/src/features/auth/access.css:124)

Os 29 testes web, ambos os linters, o typecheck e o `git diff --check` passaram. As rotas existentes e os contratos HTTP foram preservados. Revisei em modo somente leitura.
