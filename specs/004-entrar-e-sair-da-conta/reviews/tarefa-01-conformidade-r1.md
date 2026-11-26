# Parecer de Conformidade — Tarefa 1

**Veredito:** APROVADO

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1 — Pré-requisito técnico: o hash já emitido pelo cadastro aceita a senha original | atendido | `apps/api/src/modules/auth/password-hasher.spec.ts:40` |
| CA2 — Pré-requisito técnico: o verificador recusa senha incorreta | atendido | `apps/api/src/modules/auth/password-hasher.spec.ts:46` |
| CA2 — Pré-requisito técnico: o verificador recusa hash inválido | atendido | `apps/api/src/modules/auth/password-hasher.spec.ts:52` |
| CA3 — Entrada com e-mail pendente e elegibilidade da busca | fora desta tarefa | — |
| CA4 — Cookie e expiração da sessão | fora desta tarefa | — |
| CA5 — Saída em um dispositivo | fora desta tarefa | — |
| CA6 — Invalidação de sessões após desativação | fora desta tarefa | — |
| CA7 — Nova tentativa após falha de rede | fora desta tarefa | — |

O Vitest aprovou os 9 testes do arquivo com Node.js 24.21.0.

## Apontamentos
