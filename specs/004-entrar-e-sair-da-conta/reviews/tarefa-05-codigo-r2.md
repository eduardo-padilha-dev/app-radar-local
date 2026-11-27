# Parecer de Código — Tarefa 5

**Veredito:** APONTAMENTOS

## Apontamentos (bloqueiam)

1. **Falha ao abrir a tela de login deixa a área privada presa em carregamento** — `apps/web/src/features/auth/usePrivateSession.ts:30`  
   Regra violada: `docs/architecture.md`, §4, prevê que o composable represente o estado de erro da interface.  
   Prejuízo concreto: se a revalidação recebe `401` e o import dinâmico da tela de login falha, `router.replace` rejeita e a área privada continua sendo a rota ativa. O composable mantém o estado `checking`, a tela fica em “Verificando sua sessão…” sem botão de nova tentativa e a guarda da linha 21 ignora os próximos eventos de foco. O comportamento da navegação foi confirmado em memória com o Vue Router instalado.

## Sugestões (não bloqueiam)

- Em `apps/api/test/auth-session.e2e-spec.ts:269`, a comparação exata do `exp` fracionário acopla o teste à representação interna do JWT. O prazo persistido e as respostas imediatamente antes e no vencimento já verificam a fronteira de expiração.

## Observações fora do escopo deste diff

- Nenhuma. As suítes passaram com 14 de 14 testes HTTP e 3 de 3 testes web. `git diff --check` passou.
