# Radar Local

O Radar Local ajuda desenvolvedores freelancers a encontrar estabelecimentos
sem site próprio identificado e a organizar o acompanhamento dos contatos com
possíveis clientes.

## Sobre o projeto

O desenvolvedor pesquisa por cidade e estado, com ramo de atividade opcional,
e pode salvar estabelecimentos de interesse para acompanhar o status do contato
e registrar, opcionalmente, o valor de um projeto aceito ou finalizado.
A negociação acontece fora da plataforma.

O produto prevê uma demonstração limitada e um plano de acesso por 30 dias,
com renovação manual. Preço e limites do plano ainda estão em definição.

**Etapa atual:** fundação do monorepo — Atividade 08.
API e frontend de demonstração, sem funcionalidades de negócio. O banco de
desenvolvimento nasce vazio, sem modelos Prisma nem migrations.

## Autores

- [Eduardo Padilha do Nascimento](https://github.com/eduardo-padilha-dev)

## Documentação

- [PRD — problema, escopo, histórias e regras de negócio](docs/prd.md)
- [Jornada de contratação e renovação do plano](docs/user-flows.md)
- [Tokens de design, telas e link do protótipo](docs/design-tokens.md)
- [Ficha da disciplina — indicadores e entregas](docs/checklist.md)
- [Arquitetura — stack, estrutura e modelo de dados](docs/architecture.md)

## Stack

- NestJS
- Prisma
- PostgreSQL
- Vue

## Protótipo

[Abra a apresentação desktop do Radar Local](https://www.figma.com/proto/1CkMDJeQzb7jj7eLUlTgII/Radar-Local?node-id=3-21788&starting-point-node-id=3%3A21788).

## Em produção

A partir da Entrega 3.

## Quick Start

Requisitos: Node.js 24.x, npm 11.x e Docker com Compose.

Em um checkout novo, execute na raiz:

```bash
npm ci
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Configure `apps/api/.env`:

```dotenv
DATABASE_URL="postgresql://app:app@127.0.0.1:5433/appdb?schema=public"
TEST_DATABASE_URL="postgresql://app:app@127.0.0.1:5433/appdb_test?schema=public"
RESEND_API_KEY="sua-chave-do-resend"
EMAIL_FROM="cadastro@seu-dominio.example"
WEB_URL="http://localhost:5173"
CORS_ORIGIN="http://localhost:5173"
```

Para enviar o e-mail de confirmação em um cadastro manual, substitua os exemplos
de `RESEND_API_KEY` e `EMAIL_FROM` por uma chave do Resend e um remetente
autorizado. Guarde a chave apenas no `.env` da API.

Configure `apps/web/.env`:

```dotenv
VITE_API_URL="http://localhost:3000"
```

Suba o PostgreSQL e aguarde o banco aceitar conexões. A porta 5433 é a porta
local. Dentro do contêiner, o PostgreSQL usa a porta 5432.

```bash
docker compose up -d
docker compose exec db pg_isready -U app -d appdb
npm exec -w apps/api -- prisma migrate deploy
npm exec -w apps/api -- prisma generate
```

Em terminais separados, partindo da raiz, execute `npm run api` e `npm run web`.
Abra o [cadastro](http://localhost:5173/criar-conta). A API atende em
<http://localhost:3000>. Use `Ctrl+C` para parar cada servidor.
`npm start` inicia a API sem watch.

Para verificar a confirmação manualmente, cadastre um e-mail que você possa
acessar e abra o link recebido. A página indica se o e-mail foi confirmado e,
quando o link expirou, oferece o reenvio. Se o cadastro informar que o envio
inicial ficou sem confirmação, solicite outro link nessa tela. A resposta ao
pedido orienta a conferir a caixa de entrada sem garantir a entrega.

### Testes locais

Com o PostgreSQL ativo, crie o banco separado uma vez por volume do Docker:

```bash
docker compose exec db createdb -U app appdb_test
```

A suíte de integração usa `TEST_DATABASE_URL` e aplica as migrations ao banco de
teste. O nome desse banco deve terminar em `_test`. Os testes de cadastro e confirmação
simulam o envio de e-mail.

Execute na raiz:

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

O npm usa workspaces (`apps/*`) e um único `package-lock.json` na raiz.
Não use yarn ou pnpm. `.env`, `node_modules/`, builds e o cliente Prisma gerado
não são versionados. O `.env.example` documenta as variáveis sem credenciais.

Para parar o banco, use `docker compose stop`; para retomar, `docker compose start`.
`docker compose down` remove o container, preservando os dados no volume.
