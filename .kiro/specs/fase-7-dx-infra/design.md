# Design Document — `fase-7-dx-infra`

> Spec-filho promovido a partir do master `auditoria-geral`. Este documento detalha como **CI**, **documentação de ambiente e Docker**, **convenção de ADRs**, **changelog** e **cleanup estrutural** vão ser entregues. A execução das tarefas deste design vive em `tasks.md` (a ser produzido em paralelo).

## Overview

Hoje o projeto não tem CI configurada (`Test-Path .github` retornou `False` em 2026-05-17), o `docker-compose.yml` é um stub não-documentado para Postgres de dev, as variáveis de ambiente estão parcialmente cobertas em `.env.example` mas não em um documento único, decisões arquiteturais vivem em prosa nos `design.md` dos specs-filhos, não há `CHANGELOG.md`, e `src/lib/queries.ts` está em estado híbrido `@deprecated 2026-05-30 — remoção planejada após 2026-06-13`. O type-safety está saudável (0 ocorrências de `any` como anotação TS em `src/`), portanto o EAR 8.5 colapsa.

A Fase 7 entrega 7 artefatos concretos:

1. **CI Pipeline**: `.github/workflows/ci.yml` com 3 estágios (lint, typecheck, test) consumindo os contratos declarados pelas fases 2 e 4.
2. **Docker doc**: documentação de uso do `docker-compose.yml` (serviços, portas, volumes, variáveis, comandos).
3. **Env vars doc**: tabela canônica única em `docs/env.md` (ou seção `README.md`) cobrindo 16 variáveis de `.env.example` + 4 variáveis "fantasma" + `CI`.
4. **ADR convention**: `docs/adr/0001-template.md` + ADRs 0002–0005 registrando decisões já tomadas pelas fases 1–4 que merecem rastreabilidade canônica.
5. **Changelog**: `CHANGELOG.md` na raiz no formato Keep a Changelog v1.1.0 com seção `[Unreleased]` cobrindo as fases 1–4 + 7.
6. **Queries cleanup**: decisão pós-janela 2026-06-13 (opção A: remoção integral + Property 1 com snapshot estático; ou opção B: manter helpers JUSTIFICADO com nova justificativa via ADR).
7. **Type-safety baseline**: registro da contagem atual (`0`) com data e comando reproduzível.

A fase **não** entrega monitoramento em produção (APM/log shipping), **não** entrega feature flags, **não** entrega blue/green deploy, **não** modifica primitivos da fase-4, **não** corrige lint herdado em código de UX/painel pesado (~20–28 errors `react-hooks/*` pertencem a fase-5), **não** altera `prisma/schema.prisma`, **não** cria Dockerfile da aplicação, **não** transforma cobertura em hard gate, **não** introduz CI multi-versão de Node.

### Decisões de design importantes

- **GitHub Actions, não outro provedor.** O repositório está hospedado em GitHub (cf. comportamento de `git remote` herdado de sessões anteriores; mesmo sem inspecionar diretamente, é o único provedor com convenção `.github/workflows/`). Migrar para GitLab CI / CircleCI / Drone exigiria revisar o caminho do YAML — fora do escopo.
- **1 job + N steps, não N jobs paralelos.** Justificativa: com `npm ci` levando ~30–60 s e cada estágio (lint, tsc, test) levando 5–15 s no worst-case, paralelizar em 3 jobs adiciona 90–180 s de cold-start de cada `npm ci` separado. Com 1 job, `node_modules` é setado uma vez e reaproveitado pelos 3 steps.
- **`npm ci`, não `npm install`.** `npm ci` respeita `package-lock.json` literalmente, falha se `package-lock.json` desincronizar, é idempotente. `npm install` pode atualizar o lockfile em CI silenciosamente. Pinning estrito da fase-2 (vitest 4.1.6, fast-check 4.8.0) precisa de `npm ci`.
- **Cache de `~/.npm` via `actions/setup-node@vN > cache: 'npm'`**, não cache manual de `node_modules`. O cache nativo do `actions/setup-node` invalida pela hash do `package-lock.json` automaticamente; cache manual exigiria mais YAML.
- **MADR (Markdown ADR) simplificado, não Nygard original.** Justificativa: MADR é alinhado com a estrutura `Status / Context / Decision / Consequences` que o usuário já consome em prosa nos `design.md` das fases. Nygard original tem 5 campos (`Title`, `Status`, `Context`, `Decision`, `Consequences`) — nossa adaptação adiciona `Date` e `Referências` para cross-references aos specs.
- **Keep a Changelog v1.1.0**, não Conventional Commits + auto-gen. Auto-gen (release-please, semantic-release, changesets) é Non-Goal explícito (Requirement 7.7). Manutenção manual reduz superfície de configuração.
- **Cleanup `queries.ts` somente em ou após 2026-06-13.** Honra a janela declarada em `src/lib/queries.ts:1-7`. Se a fase rodar antes, a tarefa é marcada como `pendente até 2026-06-13` e o `Done` da fase pode ser atingido sem ela (com nota explícita no Phase Card do master). É o único item desta fase com prazo absoluto.
- **`npx tsc --noEmit` em vez de `npm run typecheck`.** Não vamos adicionar um script `typecheck` em `package.json` para não inflar a lista de scripts. `npx tsc` é universal, idempotente, e evita um redirect de script.
- **Docker doc e Env vars doc preferencialmente em `docs/`, não inflar `README.md`.** Trade-off: `README.md` reduz saltos para o dev novo; `docs/` mantém o README enxuto. Decisão registrada em ADR 0005 (Requirement 6.6).
- **Tolerância de lint herdado**: a CI vai **executar** `npm run lint` mas a decisão de **bloquear ou tolerar** os ~20–28 errors herdados é tomada na execução e registrada em ADR 0004. Esta fase NÃO corrige código de aplicação (Non-Goal item 5).

### O que está fora de escopo

Já listado em `requirements.md > §6 Non-Goals`. Resumo das categorias:

- Monitoramento em produção (APM, log shipping).
- Feature flags.
- Blue/green deploy.
- Mudanças em primitivos da fase-4 ou em código de aplicação além do cleanup `queries.ts`.
- CSP nonce, HSTS preload (decisões já fechadas pela fase-1).
- Mudanças em `prisma/schema.prisma`.
- Cobertura de componentes (Testing Library) e ampliação do Playwright (Non-Goal herdado da fase-2).
- Gates de cobertura como bloqueio.
- Migração de gerenciador de pacotes.
- Auditoria de dependências (SCA).
- Dockerfile da aplicação.
- CI multi-versão de Node.

---

## Architecture

```
+-- .github/                              (novo, criado por esta fase)
|   +-- workflows/
|       +-- ci.yml                        (novo)
|             on: push (master/main), pull_request (master/main)
|             jobs:
|               build-test:
|                 runs-on: ubuntu-latest
|                 steps:
|                   - checkout
|                   - setup-node (cache: npm)
|                   - npm ci
|                   - npm run lint
|                   - npx tsc --noEmit
|                   - npm run test
|
+-- docs/                                 (novo diretório)
|   +-- env.md                            (novo)
|   |     tabela: Variable | Description | Example | Environment
|   |     20 entradas: 16 do .env.example + 4 fantasmas + CI
|   +-- docker.md                         (novo)
|   |     serviços, portas, volumes, variáveis, comandos
|   |     (alternativamente, seção do README.md — decisão em ADR 0005)
|   +-- adr/                              (novo subdiretório)
|       +-- 0001-template.md              (novo, MADR canônico)
|       +-- 0002-vitest-fast-check.md     (novo, registra decisão da fase-2)
|       +-- 0003-queries-ts-deprecated.md (novo, registra decisão da fase-3)
|       +-- 0004-ci-pipeline.md           (novo, registra decisão desta fase)
|       +-- 0005-env-doc-localizacao.md   (novo, registra decisão de localização)
|
+-- CHANGELOG.md                          (novo, na raiz)
|     formato Keep a Changelog v1.1.0
|     seção [Unreleased] cobrindo fases 1, 2, 3, 4, 7
|
+-- .kiro/specs/fase-7-dx-infra/
|   +-- requirements.md                   (já existe)
|   +-- design.md                         (este documento)
|   +-- tasks.md                          (a produzir)
|   +-- dx-conventions.md                 (novo, doc canônico desta fase)
|         §1 CI Pipeline (estrutura, decisão de tolerância, evidência primeira run)
|         §2 Docker doc (localização, lista de tópicos)
|         §3 Env vars doc (localização, tabela canônica)
|         §4 Queries cleanup (status, smoke checks)
|         §5 ADRs (lista criada, regras de numeração)
|         §6 Type-safety baseline (contagem, comando reproduzível)
|         §7 Changelog (referência)
|         §8 Smoke checks finais (lint, tsc, test, build)
|
+-- src/lib/queries.ts                    (modificado em ou após 2026-06-13)
|     opção A: removido integralmente
|     opção B: helpers mantidos com nova justificativa (registrada em ADR 0003 atualizado)
|
+-- src/lib/services/discover.service.pbt.ts (modificado se opção A)
      Property 1 passa a usar snapshot estático em vez do oráculo de queries.ts
```

### Boundaries

- **CI vs build**: a CI roda exatamente o que `package.json > scripts` declara. Não há lógica de build customizada no YAML — apenas chamadas a `npm run *`.
- **Docs vs `.kiro/specs/`**: documentação operacional do projeto vive em `docs/` (env, docker, ADRs). Documentação de specs (planos, design, tasks) vive em `.kiro/specs/`. `dx-conventions.md` é exceção: fica em `.kiro/specs/fase-7-dx-infra/` por consistência com `testing-conventions.md` (fase-2) e `tokens.md` (fase-4) — é doc do **spec-filho**, não do projeto.
- **Changelog vs ADR**: changelog conta **o que mudou**; ADR conta **por que mudou**. Toda decisão arquitetural relevante vira ADR; toda mudança de código vira linha no changelog. ADRs podem ser referenciados pelo changelog (`Changed: queries.ts refatorado para híbrido (ver ADR 0003)`).
- **Cleanup `queries.ts` vs Property 1**: o cleanup é ortogonal ao Property 1 do PBT da fase-3. Opção A move a Property 1 para snapshot estático (sem dependência de `queries.ts`); opção B mantém `queries.ts` como oráculo. A escolha é registrada em ADR 0003 (atualizado).

---

## Components and Interfaces

### 1. CI Pipeline

Arquivo único: `.github/workflows/ci.yml`. Estrutura esboçada:

```yaml
# .github/workflows/ci.yml (esboço — versões finais decididas na execução)
name: CI

on:
  push:
    branches: [master, main]
  pull_request:
    branches: [master, main]

jobs:
  build-test:
    name: Lint, typecheck, test
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - name: Checkout
        uses: actions/checkout@vN

      - name: Setup Node.js
        uses: actions/setup-node@vN
        with:
          node-version: <versão alinhada com engines.node ou LTS atual>
          cache: 'npm'

      - name: Install dependencies (npm ci)
        run: npm ci

      - name: Lint (npm run lint)
        run: npm run lint
        # Decisão de tolerância em ADR 0004:
        # - Opção A: bloqueia se lint quebra (CI vermelha até fase-5 corrigir).
        # - Opção B: lint roda mas não bloqueia (continue-on-error: true).
        # - Opção C: lint roda apenas em arquivos novos/modificados do PR
        #            (eslint --max-warnings 0 + lint-staged ou eslint-changed).
        # Decisão final é tomada na execução, dado o estado real do lint herdado.

      - name: Typecheck (npx tsc --noEmit)
        run: npx tsc --noEmit

      - name: Test (npm run test)
        run: npm run test
        env:
          CI: true
          # Vitest detecta CI=true automaticamente (já é setado pelo Actions),
          # ativa allowOnly: false e passWithNoTests: false (cf. testing-conventions.md > §8.1).
```

Notas operacionais:

- **Versão do Node**: alinhada com o ambiente real de produção. Se `package.json > engines.node` for declarado nesta fase (Requirement 8.3), o YAML lê a partir desse campo (`actions/setup-node` aceita `node-version-file`). Se não declarar, fixa no YAML uma versão LTS atual (decisão registrada em ADR 0004).
- **Cache de npm**: `actions/setup-node > cache: 'npm'` invalida pelo hash do `package-lock.json`. Reduz `npm ci` de ~60 s para ~10–20 s após o primeiro warm-up.
- **Timeout**: `timeout-minutes: 15` é margem confortável. `npm ci` ~60 s + lint ~30 s + tsc ~30 s + test ~10 s = ~130 s base; 15 min cobre regressões temporárias.
- **`fail-fast` implícito**: por default, falha de qualquer step interrompe o job. Não vamos adicionar `continue-on-error` exceto se a decisão de tolerância (Requirement 1.5 / ADR 0004) exigir.
- **Não rodamos `npm run build`** na CI desta fase. Justificativa: `next build` exige `AUTH_URL` no shell em prod-mode (cf. `handoff.md > Observações operacionais`). Forçar build na CI obrigaria configurar segredo `AUTH_URL` no GitHub Actions; é trabalho que pertence à fase-1 ou a um spec de "deploy CI" futuro. Esta fase para em lint + tsc + test.

### 2. Docker Doc

Localização preferida: `docs/docker.md` (decisão registrada em ADR 0005). Estrutura:

```markdown
# Docker — Postgres de dev

## Visão geral

`docker-compose.yml` na raiz provê um Postgres 16 (alpine) para desenvolvimento local. NÃO contém Dockerfile da aplicação — a app roda nativamente via `npm run dev`.

## Serviços

### `db` (postgres:16-alpine)

| Configuração | Valor |
|---|---|
| Porta | 5432:5432 (host:container) |
| Volume persistente | `privello_pg:/var/lib/postgresql/data` |
| `POSTGRES_USER` | `postgres` |
| `POSTGRES_PASSWORD` | `masterkey` (rotacionar em ambientes não-locais) |
| `POSTGRES_DB` | `privello` |
| `restart` | `unless-stopped` |

## Como subir

    docker compose up -d db

A primeira execução cria o volume `privello_pg`. Próximas execuções reutilizam.

## Como conectar via Prisma

`DATABASE_URL` em `.env`:

    DATABASE_URL=postgresql://postgres:masterkey@localhost:5432/privello?schema=public

## Como desligar

- Sem perder dados: `docker compose stop db`
- Removendo o volume (destrutivo): `docker compose down -v`

## Notas

- O compose **NÃO** sobe a aplicação Next.js. Use `npm run dev` no host.
- Para usar este compose como base de testes E2E (Playwright), ajuste `DATABASE_URL` para um banco separado e rode `npx prisma db push` após `docker compose up -d db`.
- Senha `masterkey` é hard-coded no compose como conveniência de dev. Em ambientes além do laptop do dev, rotacionar para uma senha gerada por `openssl rand -base64 24` e mover para um arquivo `env_file` listado em `.gitignore`.
```

Alternativa (registrada como rejeitada em ADR 0005): seção `## Docker (Postgres de dev)` em `README.md`. Trade-off: README cresce; `docs/docker.md` mantém o README enxuto.

### 3. Env vars Doc

Localização preferida: `docs/env.md` (decisão registrada em ADR 0005). Estrutura:

```markdown
# Variáveis de ambiente — Privello

> Documento canônico produzido pela `fase-7-dx-infra`. Espelha o `.env.example` e cobre adicionalmente as variáveis lidas pelo código que NÃO constam em `.env.example`. Atualizar este documento sempre que uma nova `process.env.X` for adicionada ao código.

## Tabela canônica

| Variable | Description | Example | Environment |
|---|---|---|---|
| `AUTH_SECRET` | Segredo de assinatura JWT/CSRF do NextAuth v5. | `K7QkXyAo+1F2pJ6wQGZxRZ3tD8mNcVbHsLxF9eTpKuM=` (gerar com `openssl rand -base64 32`) | dev+prod |
| `AUTH_URL` | URL pública do app. Obrigatório em prod (boot falha sem). | `https://privello.com.br` | prod |
| `NEXT_PUBLIC_BASE_URL` | URL base usada nos links de email. | `http://localhost:3000` | dev+prod |
| `NEXT_DEV_ALLOWED_ORIGINS` | Origens adicionais aceitas em dev (CSV). | `192.168.1.93,ngrok-free.app` | dev |
| `DEV_ENDPOINT_TOKEN` | Token estático para `/api/dev/*` em dev/staging. | `<hex 64 chars>` (gerar com `openssl rand -hex 32`) | dev |
| `CRON_SECRET` | Segredo dos cron endpoints (`/api/cron/*`). | `<hex 64 chars>` | dev+prod |
| `PRODUCTION_HOSTNAME` | Hostname público para `images.remotePatterns`. | `privello.com.br` | prod |
| `DATABASE_URL` | Connection string do Postgres. | `postgresql://postgres:masterkey@localhost:5432/privello?schema=public` | dev+prod |
| `EMAIL_HOST` | SMTP host. | `smtp.gmail.com` | dev+prod |
| `EMAIL_PORT` | SMTP port. | `587` | dev+prod |
| `EMAIL_SECURE` | TLS direto. | `false` | dev+prod |
| `EMAIL_USER` | SMTP user. | `contato.privello@gmail.com` | dev+prod |
| `EMAIL_PASS` | SMTP password (App Password no Gmail). | `xxxx xxxx xxxx xxxx` | dev+prod |
| `EMAIL_FROM` | Endereço de remetente. | `Privello <contato.privello@gmail.com>` | dev+prod |
| `MERCADOPAGO_ACCESS_TOKEN` | Credencial privada (servidor) do Mercado Pago. | `APP_USR-...` | dev+prod |
| `NEXT_PUBLIC_MP_PUBLIC_KEY` | Credencial pública (cliente) do Mercado Pago. | `APP_USR-...` | dev+prod |
| `NODE_ENV` | Ambiente de execução. Setado pelo Next/Vitest. | `development` / `production` / `test` | dev+prod |
| `PRISMA_DEBUG_QUERIES` | Ativa instrumentação de queries do Prisma (opt-in). | `1` | dev |
| `NEXTAUTH_URL` | **Legado** — alias lido como fallback em 4 routes/actions; preferir `AUTH_URL` ou `NEXT_PUBLIC_BASE_URL`. | `https://privello.com.br` | dev+prod |
| `MP_WEBHOOK_SECRET` | Secret HMAC do webhook MercadoPago. Dev permite ausência (loga warn); prod exige. | `<hex 64 chars>` | prod |
| `CI` | Setado automaticamente pelo GitHub Actions. Ativa modo CI no Vitest. | `true` | (CI only) |

## Notas

- `.env.example` cobre as 16 primeiras. As 4 últimas (`PRISMA_DEBUG_QUERIES`, `NEXTAUTH_URL`, `MP_WEBHOOK_SECRET`, `CI`) NÃO estão em `.env.example` — decisão registrada em ADR 0005 sobre adicionar ou não. (Recomendação: adicionar `PRISMA_DEBUG_QUERIES` e `MP_WEBHOOK_SECRET` ao `.env.example`; deixar `NEXTAUTH_URL` fora — é alias legado, não deve ser introduzido em ambientes novos.)
- `AUTH_SECRET` em produção: nunca commitar, rotacionar após suspeita de vazamento, gerar com `openssl rand -base64 32`. Cf. `nextauth-prod.md > §3`.
- `CRON_SECRET` aceita `?secret=` em query string até 2026-06-15T00:00:00Z (janela de transição da fase-1). Após, apenas header. Cf. `.env.example:51-58`.
- `PRISMA_DEBUG_QUERIES` é opt-in e tem **overhead zero** quando desligado (cf. `metricas-baseline.md > §2.1`).

## Cross-references

- Auth (`AUTH_SECRET`, `AUTH_URL`, `NEXT_PUBLIC_BASE_URL`): `nextauth-prod.md > §2`.
- Prisma instrumentation (`PRISMA_DEBUG_QUERIES`): `metricas-baseline.md > §2.1`.
- Cron endpoints (`CRON_SECRET`): `.env.example:51-58`.
- Dev endpoints (`DEV_ENDPOINT_TOKEN`): `src/lib/security/dev-auth.ts`.
- Images config (`PRODUCTION_HOSTNAME`): `next.config.ts:80-110`.
```

Alternativa (registrada como rejeitada em ADR 0005): seção `## Variáveis de ambiente` em `README.md`. Trade-off: README cresce muito; `docs/env.md` mantém escopo claro.

### 4. ADR convention

`docs/adr/` é a localização canônica. Modelo `0001-template.md`:

```markdown
# ADR NNNN — <título curto em pt-BR>

- **Status**: Proposto | Aceito | Substituído por NNNN | Rejeitado
- **Data**: YYYY-MM-DD

## Contexto

<1–3 parágrafos descrevendo o problema e os fatores em jogo. Inclua:
- O que motivou a decisão (qual gap, qual dor).
- Quais alternativas foram consideradas (sem aprofundar — só listar).
- Restrições não-negociáveis (segurança, AGENTS_Rule, escopo de fase).>

## Decisão

<1 parágrafo declarativo da decisão tomada. Use voz ativa: "Adotamos X em vez de Y porque Z.">

## Consequências

### Positivas

- Item 1
- Item 2

### Negativas

- Item 1 (e como mitigar)
- Item 2

### Neutras

- Item 1 (esperado mas vale registrar)

## Referências

- `c:/.../path/para/spec/.md > §X` — relevância.
- `node_modules/next/dist/docs/<area>.md` — quando aplicável (AGENTS_Rule).
- ADRs anteriores que esta substitui ou complementa.
```

ADRs adicionais a serem criados nesta fase (Requirement 6.6):

- **ADR 0002 — Adoção de Vitest + fast-check como infraestrutura de testes.** Status: Aceito. Data: 2026-03-14 (data da decisão original na fase-2; ADR documenta retroativamente). Contexto: zero testes unitários antes; precisa de runner ESM-first com baixa configuração. Decisão: Vitest 4.1.6 + fast-check 4.8.0, pinados, `*.test.ts`/`*.pbt.ts` co-localizados. Referências: `fase-2-testes/design.md > Decisões de design importantes`, `testing-conventions.md`.
- **ADR 0003 — `queries.ts` em estado híbrido com `@deprecated 2026-05-30`.** Status: Aceito (com revisão em 2026-06-13). Data: 2026-05-17. Contexto: 27 funções migradas para `services/`; helpers `sortProfileCards`/`finalizeDiscoverOrder`/`profileCardInclude` permanecem como oráculo da Property 1. Decisão: estado híbrido (a) re-exports + (b) helpers JUSTIFICADO por janela de 14 dias; cleanup pós-2026-06-13 em opção A (remoção integral, Property 1 → snapshot) ou opção B (manter com nova justificativa). Referências: `fase-3-backend/metricas-baseline.md > §5`, `src/lib/queries.ts:1-22`, `src/lib/services/discover.service.pbt.ts`.
- **ADR 0004 — Pipeline de CI com 3 estágios e tolerância de lint herdado.** Status: Aceito. Data: <data da execução desta fase>. Contexto: `.github/workflows/` ausente; lint herdado tem 20–28 errors em código de UX/painel pesado pertencente à fase-5. Decisão: GitHub Actions, 1 job + 5 steps (checkout, setup-node, npm ci, lint, tsc, test), tolerância de lint herdado segundo opção <A/B/C> (decidir na execução). Referências: `requirements.md > Requirement 1.5`, `handoff.md > Smoke checks finais`.
- **ADR 0005 — Localização de `docs/env.md` e `docs/docker.md` separada do README.** Status: Aceito. Data: <data da execução desta fase>. Contexto: README atual é compacto; documentação extensa de env+docker o triplicaria. Decisão: `docs/env.md` e `docs/docker.md` separados; README ganha apenas links curtos para esses dois. Referências: `requirements.md > Requirement 2.3, 3.6`.

### 5. Changelog

Localização: `CHANGELOG.md` na raiz. Formato Keep a Changelog v1.1.0 (em pt-BR) — link canônico https://keepachangelog.com/pt-BR/1.1.0/ . Esboço da seção `[Unreleased]` que esta fase popula:

```markdown
# Changelog

Todas as mudanças notáveis a este projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Added

- **CI**: pipeline GitHub Actions com 3 estágios — lint, typecheck, test (fase-7).
- **Documentação**: `docs/env.md` (variáveis de ambiente), `docs/docker.md` (Postgres de dev), `docs/adr/` (ADRs), `CHANGELOG.md` (este arquivo) (fase-7).
- **Type-safety baseline**: contagem de `any` em `src/` registrada em `dx-conventions.md > §6` (fase-7).
- **Camada de services**: 9 services em `src/lib/services/` consolidados (fase-3).
- **Testes**: Vitest 4.1.6 + fast-check 4.8.0 + `@fast-check/vitest` 0.4.1 instalados; 172 testes passando incluindo PBTs (fase-2 + fase-3 + fase-4).
- **Tokens semânticos**: `--privello-warning`, `--privello-danger`, `--privello-blue` em `globals.css`; escala tipográfica explícita `text-2xs` (10px) → `text-8xl` (64px) (fase-4).
- **Primitivos**: `Dropdown` (compound) e `useFocusTrap` (hook reutilizável) em `src/components/ui/` e `src/lib/hooks/` (fase-4).
- **CSP** em Report-Only e **HSTS** (`max-age=15552000; includeSubDomains`) em `next.config.ts > headers` (fase-1).
- **Rate limiting** em login, upload, wa-click, comentários e visualização de stories (fase-1).
- **Validação Zod** em todas as Server Actions e API Routes que aceitam input do usuário (fase-1).
- **Endpoint `/api/dev/*` autenticado** via `DEV_ENDPOINT_TOKEN` ou sessão admin; **`/api/cron/*` por header** (`Authorization: Bearer` ou `X-Cron-Secret`), com janela de transição até 2026-06-15 (fase-1).
- **Whitelist de hosts** em `next.config.ts > images.remotePatterns` substituindo o curinga `**` (fase-1).
- **`.env.example`** versionado com 16 variáveis comentadas (fase-1).
- **Lint anti-regressão** `no-restricted-syntax` em `eslint.config.mjs` cobrindo `src/components/**` e `src/app/**` (fase-4).

### Changed

- **`src/lib/queries.ts`**: refatorado para estado híbrido `@deprecated 2026-05-30 — remoção planejada após 2026-06-13`. 27 re-exports de `@/lib/services` + helpers JUSTIFICADO (`sortProfileCards`, `finalizeDiscoverOrder`, `profileCardInclude`, `ProfileCardPayload`) como oráculo da Property 1 (fase-3, ver ADR 0003).
- **`src/lib/auth.ts`**: guard `AUTH_URL` em produção (boot falha se ausente); `trustHost` documentado para dev (fase-1).
- **`next.config.ts`**: headers de segurança expandidos (HSTS, CSP Report-Only); `images.remotePatterns` com whitelist explícita (fase-1).
- **24 consumidores** em `src/app/**` migrados de `@/lib/queries` → `@/lib/services` (fase-3).
- **7 rotas** migradas de `force-dynamic` para `revalidate=N` (home, em-alta, em-destaque, cidades, buscar, novidades, planos) (fase-3).
- **~50 arquivos** em `src/components/**` e `src/app/**` migrados para tokens semânticos: 167 → 0 hex literais e 677 → 0 font-size arbitrários (fase-4).

### Deprecated

- **`@/lib/queries` re-exports**: `@deprecated 2026-05-30 — remoção planejada após 2026-06-13`. Importar de `@/lib/services` em código novo (fase-3, ver ADR 0003).

### Removed

_Nenhum item formalmente removido nas fases 1–4. Cleanup pós-2026-06-13 (Requirement 4 desta fase) vai aparecer na próxima entrada deste changelog._

### Fixed

- **iOS Safari sobre LAN**: `trustHost: true` adicionado em `src/lib/auth.ts` (sessão pré-master spec, registrada em `_archive/ios-mobile-interactions-fix/`).

### Security

- **HSTS** adicionado a `next.config.ts > headers` (fase-1).
- **CSP** em Report-Only adicionado a `next.config.ts > headers` (fase-1).
- **`/api/dev/*`** autenticado via `DEV_ENDPOINT_TOKEN` ou sessão admin (fase-1).
- **`/api/cron/*`** por header (`Authorization: Bearer` ou `X-Cron-Secret`); query string `?secret=` aceita até 2026-06-15 (fase-1).
- **Rate limiting** em login, upload, wa-click, comentários e visualização de stories (fase-1).
- **Whitelist** de hosts em `images.remotePatterns` substituindo curinga `**` (fase-1).
- **Validação Zod** em todas as Server Actions e API Routes que aceitam input do usuário (fase-1).
```

Notas operacionais:

- Não há automação de geração (Non-Goal Requirement 7.7). Cada PR que mudar o changelog é responsabilidade do dev.
- Releases formais (tag git + seção `[X.Y.Z] - YYYY-MM-DD`) ficam para fase futura. Por ora, tudo vai em `[Unreleased]`.

### 6. Queries cleanup decision (pós-janela 2026-06-13)

Duas opções (decisão registrada em ADR 0003 atualizado):

#### Opção A — Remoção integral

1. Remover `src/lib/queries.ts` por completo.
2. Migrar Property 1 (`src/lib/services/discover.service.pbt.ts`) para usar **snapshot estático** como oráculo:
   - Substituir `import { sortProfileCards, finalizeDiscoverOrder } from "@/lib/queries"` por uma constante local com a sequência esperada para cada combinação `(filters, sort)`.
   - O snapshot vira o **oráculo congelado** — mudanças intencionais futuras na ordem dos slots exigem atualizar o snapshot, o que é diff explícito no PR.
3. Validar com `npx tsc --noEmit`, `npm run test`, `npm run build`.
4. Atualizar ADR 0003 com `Status: Substituído por <novo ADR ou nota de remoção>`.

#### Opção B — Manter helpers JUSTIFICADO

1. Manter `src/lib/queries.ts` apenas com os helpers (sem re-exports).
2. Atualizar header do arquivo:
   - Remover `@deprecated 2026-05-30 — remoção planejada após 2026-06-13`.
   - Adicionar nova justificativa apontando para ADR 0003 atualizado.
   - Definir nova janela de revisão (ex.: 2026-12-31).
3. Atualizar ADR 0003 com `Status: Aceito (revisão em <nova data>)` e seção `Consequências > Negativas` listando o débito técnico contínuo.

#### Critério de escolha

- Opção A é preferida quando a Property 1 puder ser expressa como snapshot determinístico sem perda de cobertura. Reduz superfície de código e elimina o débito técnico.
- Opção B é preferida se a investigação revelar que o snapshot duplica complexidade (ex.: gerador fast-check produz 100 sequências distintas e o snapshot ficaria enorme) ou se a Property 1 detectaria regressões reais em runtime que o snapshot não detectaria.

A decisão é tomada na execução com base em smoke da Opção A primeiro (mover Property 1 para snapshot e ver se cobertura se mantém). Se a Opção A for inviável, recua para B.

### 7. Type-safety baseline

Comando reproduzível:

```powershell
$total = 0; Get-ChildItem -Path src -Recurse -Include *.ts, *.tsx -File | ForEach-Object {
  $content = [System.IO.File]::ReadAllText($_.FullName)
  $regex = [regex]::new(':\s*any\b|\bas\s+any\b|<any>')
  $m = $regex.Matches($content)
  if ($m.Count -gt 0) { $total += $m.Count; Write-Host "$($_.FullName.Substring($PWD.Path.Length+1)): $($m.Count)" }
}
Write-Host "===TOTAL=== $total"
```

Resultado em 2026-05-17 sobre `src/**/*.{ts,tsx}` (257 arquivos):

```
===TOTAL=== 0
```

Como `0 < 5`, EAR 8.5 colapsa para "registrar a contagem atual sem plano formal de redução". Registro vai em `dx-conventions.md > §6 Type-safety baseline`.

Reproducibilidade futura: a regex é canônica e cobre os 3 padrões mais comuns (`: any`, `as any`, `<any>`). Não cobre `Array<any>`, `Record<K, any>`, `Promise<any>` etc. — se uma fase futura quiser inventário expandido, a regex pode ser estendida (e o histórico do `dx-conventions.md > §6` vai mostrar a evolução).

---

## Data Models

A fase **não cria nem altera modelos de dados da aplicação**. `prisma/schema.prisma` é congelado (Non-Goal item 7). Os "modelos" relevantes aqui são os artefatos textuais produzidos pelo spec-filho e os arquivos de configuração/documentação produzidos no repositório.

Em `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-7-dx-infra\`:

- `requirements.md` — já existe (proveniência, EARS herdados, 9 Requirements).
- `design.md` — este documento.
- `tasks.md` — produzido em paralelo.
- `dx-conventions.md` — produzido durante a execução das tarefas (entrega obrigatória cf. `requirements.md > Saída desta fase`).

Em `c:\Users\edulanzarin\Documents\Dev\privello\` (fora de `.kiro/`):

- `.github/workflows/ci.yml` — pipeline.
- `docs/env.md` — variáveis de ambiente (ou seção `README.md`, conforme ADR 0005).
- `docs/docker.md` — Docker doc (ou seção `README.md`, conforme ADR 0005).
- `docs/adr/0001-template.md` — modelo MADR.
- `docs/adr/0002-vitest-fast-check.md` — ADR retroativo da fase-2.
- `docs/adr/0003-queries-ts-deprecated.md` — ADR retroativo da fase-3.
- `docs/adr/0004-ci-pipeline.md` — ADR desta fase (pipeline + tolerância de lint).
- `docs/adr/0005-env-doc-localizacao.md` — ADR desta fase (localização de docs).
- `CHANGELOG.md` — changelog.
- `src/lib/queries.ts` — modificado em ou após 2026-06-13 (opção A: removido; opção B: helpers mantidos com nova justificativa).
- `src/lib/services/discover.service.pbt.ts` — modificado se opção A (Property 1 → snapshot).
- (Possível) `.env.example` — atualizado com `PRISMA_DEBUG_QUERIES`, `MP_WEBHOOK_SECRET` se decisão for adicionar (cf. Requirement 3.5).
- (Possível) `package.json` — atualizado com `engines.node` se decisão for declarar (cf. Requirement 8.3).

---

## Error Handling

Como o sistema sob design é uma combinação de pipeline de CI, documentação e cleanup de código TS, "erros" aqui são situações em que a entrega deixa de ser confiável. Tratamentos:

### E1. Pipeline de CI quebra na primeira run

**Sintoma**: `.github/workflows/ci.yml` deploy-ado, mas a primeira run termina com falha de lint (esperado, dado o lint herdado), de tsc (não esperado), ou de test (não esperado).

**Tratamento**:

- **Falha de lint herdada (esperada)**: a tolerância já é a decisão de Requirement 1.5 / ADR 0004. Se a opção escolhida foi "tolerar" (`continue-on-error: true` ou escopo restrito), a CI passa. Se a opção foi "bloquear", a CI fica vermelha até fase-5 corrigir — registrar em `dx-conventions.md > §1 > Estado da CI` que isso é esperado e tem ADR justificando.
- **Falha de tsc**: regressão real — investigar o arquivo apontado, fazer fix mínimo. Se o fix exige tocar código de aplicação fora do cleanup `queries.ts`, vira `OutOfScopeFinding`.
- **Falha de test**: regressão real — `npm run test` passou localmente em 2026-05-17 (172 testes verdes); falha na CI sugere ambiente ou flaky test. Investigar com run local + `npm ci` limpo. Se for flaky genuíno, o teste vira `OutOfScopeFinding` para a fase que o introduziu (fase-2/3/4) — não é absorvido aqui.

### E2. Variável de ambiente nova descoberta durante a execução

**Sintoma**: durante a redação de `docs/env.md`, descobre-se que algum `process.env.X` apareceu no código mas não foi listado no inventário de Requirement 3.4.

**Tratamento**: adicionar a entrada à tabela canônica e, se relevante, ao `.env.example`. Não vira `OutOfScopeFinding` — é justamente o que o documento canônico precisa cobrir. Atualizar `dx-conventions.md > §3 Env vars doc > Lista`.

### E3. `docker-compose.yml` divergente da documentação

**Sintoma**: ao escrever `docs/docker.md`, descobre-se que o compose não bate com o esperado (porta diferente, volume diferente, etc.).

**Tratamento**: registrar como `OutOfScopeFinding` (Requirement 2.5) e propor commit no master spec. Não absorver a correção do compose nesta fase, salvo correção trivial de comentário (ex.: trocar comentário `# tcp` por `# postgres protocol`).

### E4. Cleanup `queries.ts` rodada antes da janela 2026-06-13

**Sintoma**: a fase é executada antes de 2026-06-13 e o cleanup integral parece tentador.

**Tratamento**: **NÃO** rodar antes da janela. A janela existe para acomodar um eventual rollback dos consumidores migrados (24 arquivos em `src/app/**`). Marcar a tarefa como `pendente até 2026-06-13` em `dx-conventions.md > §4`. Marcar EAR 8.4 desta fase como pendente no Phase Card do master. O `Done` da fase pode ser atingido sem o cleanup, com nota explícita.

### E5. ADR para decisão já tomada está vago

**Sintoma**: ao escrever ADR 0002 (Vitest+fast-check), a justificativa em `fase-2-testes/design.md > Decisões de design importantes` é mais rica que o `Contexto` curto que cabe no template MADR.

**Tratamento**: o ADR pode ter `Contexto` mais longo (3 parágrafos é o máximo recomendado, mas não é hard limit). Se ainda assim ficar artificial, o ADR referencia o `design.md` original (`Referências: c:/.../fase-2-testes/design.md > Decisões de design importantes`) e não duplica todo o texto. ADR é resumo + decisão + consequências, não substitui o design completo.

### E6. Lint herdado mudou entre fase-4 e fase-7

**Sintoma**: `npm run lint` local hoje (2026-05-17) tem `~67–75 problems (20–28 errors + 47 warnings)` (cf. `handoff.md`). Se entre o handoff e a execução desta fase alguma fase paralela tiver tocado os arquivos, a contagem pode ter mudado.

**Tratamento**: re-rodar `npm run lint` no momento da execução e registrar a contagem atual em `dx-conventions.md > §1 CI Pipeline > Estado do lint herdado`. Se a contagem aumentou, pode indicar regressão de fase paralela — registrar como `OutOfScopeFinding` para a fase originária (provavelmente fase-5-ux se rodou em paralelo). Se a contagem diminuiu, ótimo, mas não muda a decisão de tolerância — Requirement 1.5 continua valendo.

### E7. Decisão de tolerância de lint depende de fase paralela

**Sintoma**: fase-7 e fase-5-ux rodam em paralelo (recomendação do `handoff.md > Próximos passos`). A decisão de tolerância (Requirement 1.5) depende do quanto fase-5 já corrigiu.

**Tratamento**: tomar a decisão **com base no estado real no momento da execução**, não no estado do handoff. Se fase-5 está em andamento e as ~20–28 errors estão diminuindo dia a dia, opção C (lint só em arquivos novos via diff) é mais sustentável. Se fase-5 ainda nem começou, opção B (`continue-on-error: true` no step de lint) é o mínimo que mantém a CI funcional. Registrar a decisão em ADR 0004.

### E8. Fase faz cleanup de `queries.ts` mas Property 1 não migra para snapshot

**Sintoma**: opção A escolhida; Property 1 movida para snapshot estático; mas o snapshot fica enorme (>500 linhas) ou não cobre todas as combinações que o gerador fast-check cobria.

**Tratamento**: voltar para opção B. O custo do snapshot maior que o débito técnico de manter `queries.ts` indica que a opção B é mais sustentável. Atualizar ADR 0003 e a decisão de Requirement 4.3 (de A → B) em `dx-conventions.md > §4`.

---

## Testing Strategy

A fase **não entrega testes novos** (cf. `requirements.md > §6 Non-Goal item 8`). A pipeline de CI **executa** os testes existentes (entregues pelas fases 2, 3, 4) — não adiciona testes.

### O que validar no spec-filho

Validação manual em revisão de PR contra os artefatos produzidos. Cada item abaixo é um check binário:

1. **`.github/workflows/ci.yml` existe e é válido**: o YAML parseia corretamente, dispara em `push` e `pull_request`, e a primeira run completa os 3 estágios (lint, typecheck, test) — mesmo que algum estágio termine vermelho conforme decisão de tolerância (Requirement 1.5).
2. **`docs/env.md` cobre 20 entradas**: 16 de `.env.example` + `NODE_ENV` + `PRISMA_DEBUG_QUERIES` + `NEXTAUTH_URL` + `MP_WEBHOOK_SECRET` + `CI`.
3. **`docs/docker.md` cobre todos os tópicos**: serviços, portas, volumes, variáveis, comandos de subida/teardown, conexão via Prisma.
4. **`docs/adr/`**: contém `0001-template.md` + ADRs 0002, 0003, 0004, 0005.
5. **`CHANGELOG.md` na raiz**: formato Keep a Changelog v1.1.0, seção `[Unreleased]` cobre mudanças das fases 1–4 + 7.
6. **Cleanup `queries.ts`**: opção A ou B implementada com smoke checks (lint, tsc, test, build) verdes — OU marcada como `pendente até 2026-06-13` se a fase rodou antes.
7. **Type-safety baseline**: `dx-conventions.md > §6` registra a contagem atual e o comando reproduzível.
8. **Smoke checks finais**: `npm run lint`, `npx tsc --noEmit`, `npm run test`, `npm run build` rodam localmente — saída registrada em `dx-conventions.md > §8`.

### Sem PBTs novos

A fase **não introduz** Properties novas (PBTs). Os artefatos da fase são pipeline YAML, documentação Markdown e cleanup de código TS sem mudança comportamental — não há espaço de entradas variáveis significativas, não há função sob teste, não há propriedade universal mais útil que uma checagem textual.

A Property 1 **existente** (em `src/lib/services/discover.service.pbt.ts`, fase-3) **pode** ser migrada para usar snapshot estático se opção A for escolhida no Requirement 4. Migrar não significa "novo PBT" — significa trocar o oráculo. A propriedade declarada (paridade SQL ↔ memória) continua a mesma.

### Ausência de Correctness Properties

Esta fase **omite** a seção `Correctness Properties` por inaplicabilidade — alinhado com o critério do master spec (`auditoria-geral/design.md > Testing Strategy`): "Property-based testing é apropriado quando há funções puras, parsers/serializers, transformações de dados, algoritmos ou lógica de negócio com espaço de entradas grande e propriedades universais. (...) Aplicar PBT aqui produziria, na melhor hipótese, validação de schema disfarçada, o que é melhor expresso como um lint declarativo".

A fase-2 (`fase-2-testes/design.md`) também omitiu a seção Correctness Properties pelas mesmas razões; a fase-7 segue o mesmo padrão.

---

## Saída deste design

Este `design.md` é considerado pronto quando:

- Cobre os 9 Requirements de `requirements.md` desta fase com decisões verificáveis.
- Lista os arquivos a criar (`.github/workflows/ci.yml`, `docs/env.md`, `docs/docker.md`, `docs/adr/0001-template.md`, ADRs 0002–0005, `CHANGELOG.md`, `dx-conventions.md`) e a opção pós-janela 2026-06-13 para `src/lib/queries.ts`.
- Declara a tolerância de lint herdado como decisão a ser tomada na execução (ADR 0004), com 3 opções listadas.
- Aponta o que vira `OutOfScopeFinding` (mudanças em primitivos, código de aplicação fora do cleanup, schema Prisma, monitoramento, feature flags, blue/green, gates de cobertura, troca de gerenciador de pacotes, SCA, Dockerfile da app, CI multi-versão).

A próxima etapa do workflow é o `tasks.md` deste mesmo spec-filho, que decompõe este design em sub-tarefas executáveis com dependências.
