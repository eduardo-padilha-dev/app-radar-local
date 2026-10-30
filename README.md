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
O protótipo e as telas estão em `docs/design-tokens.md`.

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

## Em produção

<!-- Preencher quando existir uma aplicação publicada. -->

## Como executar

Requisitos: Node.js 24.x, npm 11.x e Docker com Compose.

Na raiz, instale as dependências dos dois apps:

```bash
npm install
cp apps/api/.env.example apps/api/.env
```

Preencha `apps/api/.env` com a conexão local de desenvolvimento:

```dotenv
DATABASE_URL="postgresql://app:app@localhost:5433/appdb?schema=public"
```

Suba o banco e confira a configuração, sem criar tabelas:

```bash
docker compose up -d
npm exec -w apps/api -- prisma validate
docker compose exec db psql -U app -d appdb -c '\dt'
```

A resposta esperada do banco é `Did not find any relations.` A porta 5433 evita
conflito com outro PostgreSQL na máquina; dentro do container, a porta é 5432.
`prisma validate` verifica a configuração, mas ainda não prova a conexão do Prisma.
Não rode migrations nesta atividade.

Em terminais separados, partindo da raiz:

```bash
npm run api
npm run web
```

API: <http://localhost:3000>, com `Hello World!`. Frontend: <http://localhost:5173>.
Use `Ctrl+C` para parar cada servidor. `npm start` inicia a API sem watch.

Verificações na raiz:

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
