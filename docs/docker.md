# Docker — Postgres de dev

> Documento operacional do `docker-compose.yml` na raiz. Produzido pela `fase-7-dx-infra`.

## Visão geral

O `docker-compose.yml` provê **apenas o Postgres de desenvolvimento**. Não há Dockerfile
nem container da aplicação Next.js neste repositório — a app roda nativamente via
`npm run dev` no host.

O objetivo do compose é:

- Subir um Postgres 16 (alpine) com 1 comando.
- Persistir dados em um volume nomeado para sobreviver entre `up`/`down`.
- Manter as credenciais de dev hard-coded por conveniência (apenas para o laptop do dev — rotacionar em qualquer outro ambiente).

## Serviço `db` (postgres:16-alpine)

| Configuração | Valor |
|---|---|
| Imagem | `postgres:16-alpine` |
| Restart policy | `unless-stopped` |
| Porta (host:container) | `5432:5432` |
| Volume persistente | `privello_pg:/var/lib/postgresql/data` |
| `POSTGRES_USER` | `postgres` |
| `POSTGRES_PASSWORD` | `masterkey` |
| `POSTGRES_DB` | `privello` |

## Como subir

```bash
docker compose up -d db
```

A primeira execução cria o volume `privello_pg`. Próximas execuções reutilizam o volume
e mantêm os dados.

## Como conectar via Prisma

Em `.env`, defina `DATABASE_URL` apontando para o Postgres do compose:

```
DATABASE_URL=postgresql://postgres:masterkey@localhost:5432/privello?schema=public
```

Depois rode os comandos do Prisma normalmente:

```bash
npm run db:push      # ou db:migrate, conforme o fluxo da fase
npm run db:seed
```

## Como desligar

- **Parar sem perder dados**: `docker compose stop db`
- **Remover container e volume (destrutivo)**: `docker compose down -v`

  > `down -v` apaga o volume `privello_pg` — todos os dados do Postgres são perdidos.
  > Use apenas quando quiser começar do zero.

## Notas operacionais

- O compose **NÃO** sobe a aplicação Next.js. Use `npm run dev` no host.
- A senha `masterkey` é hard-coded como conveniência local. Em qualquer ambiente além
  do laptop do dev (CI, staging, prod), rotacionar para uma senha gerada por
  `openssl rand -base64 24` e mover as credenciais para um arquivo `env_file` listado
  em `.gitignore`.
- Para usar este compose como base de testes E2E (Playwright), use um banco separado
  ou prefixe `DATABASE_URL` para uma instância dedicada e rode `npx prisma db push`
  após `docker compose up -d db`.
- Em macOS/Windows com Docker Desktop, a porta `5432` precisa estar livre. Se o host
  já tiver um Postgres local rodando, mapeie para outra porta (ex.: `5433:5432`) e
  ajuste `DATABASE_URL`.

## Referências

- `docker-compose.yml` na raiz do repositório.
- `docs/env.md > DATABASE_URL` — string canônica de conexão.
- `.env.example > DATABASE_URL` — placeholder e formato.
