# Parecer de Conformidade — Manutenção visual do acesso

**Veredito:** APONTAMENTOS

A suíte web passou com 29 testes em 6 arquivos.

## Critérios verificados

| Critério | Situação | Onde |
| --- | --- | --- |
| US01 CA1 e CA5 — resultado do cadastro e orientação de confirmação | Não atendido se o endereço for editado durante o envio | `RegisterPage.vue:25`, `RegisterPage.vue:42`, `useRegistration.ts:32` |
| US01 CA2–CA4, CA6 e CA7 — celular opcional, validação por campo, duplicidade e abandono | Atendidos no escopo web | `RegisterPage.vue:51`, `RegisterPage.vue:109`, `RegisterPage.spec.ts:267`, `RegisterPage.spec.ts:362` |
| US02 CA1, CA2, CA4–CA6 — confirmação, link inválido ou expirado, reenvio e nova tentativa | Atendidos no escopo web | `VerifyEmailPage.vue:31`, `VerifyEmailPage.vue:47`, `VerifyEmailPage.vue:59`, `VerifyEmailPage.vue:85` |
| US03 CA1–CA4 e CA7 — entrada, mensagem de falha, aviso sobre confirmação e redirecionamento para login | Comportamento web preservado | `LoginPage.vue:17`, `LoginPage.vue:42`, `LoginPage.vue:47`, `LoginPage.spec.ts:73` |
| US01 CA8, US02 CA3 e regras de backend da US03 | Fora da manutenção visual | A revisão abrangeu `apps/web` |

## Apontamentos

1. **O resultado do cadastro pode exibir e reenviar para o endereço errado** — `RegisterPage.vue:25` e `RegisterPage.vue:42`. O cadastro envia o endereço A, mas o campo continua editável enquanto aguarda a resposta. Se a pessoa digitar B nesse intervalo, o resultado pode dizer que o link foi enviado para B e solicitar reenvio para B, embora a conta tenha sido criada para A. Isso afeta a orientação exigida por US01 CA1 e o reenvio previsto por US01 CA5. O teste de resposta pendente em `RegisterPage.spec.ts:411` permite cobrir a regressão.

Sugestão sem bloqueio de aceite. Uniformizar a grafia “e-mail” no título da página de confirmação. As mensagens de estado exigidas pela especificação preservam a grafia e a distinção entre as duas respostas.
