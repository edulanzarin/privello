# Requirements Document

> Spec-filho `fase-7-dx-infra` promovido a partir do master spec da Auditoria Geral.
> Master: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\requirements.md`.

---

## Introduction

Este spec-filho executa a **Fase 7 — DX e infraestrutura** do roadmap mestre `auditoria-geral`. O objetivo é tornar o projeto sustentável após a auditoria com **CI** cobrindo lint/typecheck/testes, **documentação única de variáveis de ambiente e Docker**, **convenção de ADRs e changelog**, e a **finalização da limpeza estrutural** iniciada nas fases anteriores (cleanup `queries.ts ↔ services/` pós-janela `@deprecated 2026-05-30`).

Dependências satisfeitas (cf. `PROMOCAO.md > §5` e `handoff.md`):

- **fase-1-seguranca** (Done em 2026-05-16T04:47:12Z) — `.env.example` já documenta `AUTH_URL`, `AUTH_SECRET`, `DEV_ENDPOINT_TOKEN`, `CRON_SECRET`, `PRODUCTION_HOSTNAME`. CSP em Report-Only e HSTS já em `next.config.ts`. Janela de transição CSP em `nextauth-prod.md > §5`.
- **fase-2-testes** (Done em 2026-05-16T04:46:53Z) — Vitest + fast-check pinados (4.1.6/4.8.0/0.4.1). Scripts `test`/`test:watch`/`test:run`. **Contrato com a CI declarado em `testing-conventions.md > §8`**: `npm run test` é executável em CI sem banco e sem rede em ≤ 60 s (medido em 4.92 s).
- **fase-3-backend** (Done em 2026-05-17T00:00:00Z) — 9 services consolidados. `queries.ts` em estado **híbrido (a) + (b)**: 27 re-exports com `@deprecated 2026-05-30 — remoção planejada após 2026-06-13` + helpers JUSTIFICADO (`sortProfileCards`, `finalizeDiscoverOrder`, `profileCardInclude`, `ProfileCardPayload`) como oráculo da Property 1 (`discover.service.pbt.ts`). EAR 8.4 desta fase exige cleanup pós-janela.
- **fase-4-design-system** (Done em 2026-05-17T00:00:00Z) — Lint anti-regressão `no-restricted-syntax` em `eslint.config.mjs` cobrindo `src/components/**` e `src/app/**`. **Contrato com a CI declarado em `tokens.md > Contrato com a CI da Fase 7`**: `npm run lint` é a interface consumida pela CI futura.

Esta fase **NÃO toca APIs do Next.js**. Configuração de CI (GitHub Actions YAML), documentos de ambiente, ADRs, changelog, redução de `any` e cleanup de `queries.ts` são puramente DX/infra. A seção 4 deste documento registra `n/a` para AGENTS_Rule. Se algo durante a execução exigir tocar API do Next.js (ex.: Cache Components), vira `OutOfScopeFinding` (seção 3), nunca é absorvido aqui.

Os EARS herdados do `Requirement 8` do master spec definem o resultado esperado; os 9 Requirements detalhados abaixo destrincham as superfícies tocadas e adicionam EARS de detalhe verificáveis. O spec arquivado `final-polish-phase` é a única referência histórica desta fase (ver §2).

---

## 1. Cabeçalho de proveniência

- **master_spec_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\requirements.md`
- **master_design_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\design.md`
- **phase_id**: `fase-7-dx-infra`
- **phase_title**: DX e infraestrutura
- **promoted_at**: 2026-05-17
- **child_spec_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-7-dx-infra\`
- **bridge_contract**: `design.md > Components and Interfaces > Child Spec Bridge`
- **agents_rule_areas**: nenhuma (fase não toca APIs do Next.js)
- **historical_refs**:
  - `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\_archive\final-polish-phase`

### Critérios de aceite herdados (EARS)

Os EARS abaixo foram copiados literalmente do `Requirement 8` do master spec. Eles definem o resultado esperado desta fase; novos requisitos podem **detalhar** as superfícies tocadas, mas não podem contradizer ou ampliar o escopo declarado aqui — o que extrapolar volta ao master via `OutOfScopeFinding` (seção 3).

- **Requirement 8.1** — `THE Phase_7_Spec SHALL definir pipeline de CI com pelo menos 3 estágios: lint (eslint), typecheck (tsc --noEmit) e testes (Vitest, conforme Fase 2).`
- **Requirement 8.2** — `THE Phase_7_Spec SHALL revisar docker-compose.yml e produzir documentação de uso (variáveis necessárias, portas, volumes) em README ou doc dedicado.`
- **Requirement 8.3** — `THE Phase_7_Spec SHALL produzir documento único listando todas as variáveis de ambiente requeridas, com descrição, exemplo e ambiente alvo (dev/prod).`
- **Requirement 8.4** — `THE Phase_7_Spec SHALL eliminar duplicação entre src/lib/queries.ts e src/lib/services/* (ou justificar e isolar o legado), em coordenação com a Fase 3.`
- **Requirement 8.5** — `WHERE houver mais de 5 ocorrências de any em src/, THE Phase_7_Spec SHALL planejar redução com meta numérica medida antes/depois; abaixo desse limite, basta registrar a contagem atual sem plano formal de redução.`
- **Requirement 8.6** — `THE Phase_7_Spec SHALL definir convenção de ADRs (Architecture Decision Records) e changelog do projeto, com modelo e local de armazenamento.`
- **Requirement 8.7** — `WHEN uma fase anterior introduzir scripts ou ferramentas (Vitest, lint extra), THE Phase_7_Spec SHALL garantir que estejam refletidos na CI.`
- **Requirement 8.8** — `THE Phase_7_Spec SHALL declarar fora de escopo: monitoramento em produção (APM/log shipping), feature flags e blue/green deploy.`

---

## 2. Revalidação

### 2.1 `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\_archive\final-polish-phase`

- **archived_spec_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\_archive\final-polish-phase`
- **scope**: `dx` (subset de `final-polish-phase` que motiva esta fase — itens de UX/mobile motivam fase-5/fase-6 e não entram aqui)

#### Itens herdados

O spec arquivado `final-polish-phase` ficou apenas com `.config.kiro` (stub) na pasta `_archive/`. A única evidência do conteúdo histórico aplicável a fase-7 são as **observações iniciais do master spec** (`requirements.md > Observações da varrida inicial > DX / Infra`) e a tabela `ArchivedSpecRef` em `design.md > Data Models`, que mapeia `final-polish-phase` → `fase-5-ux`, `fase-6-mobile-cross-browser`, `fase-7-dx-infra`. Apenas a fatia DX vem para esta fase. Cada item abaixo foi verificado contra o estado atual do código em 2026-05-17.

##### Item 1 — Pipeline de CI ausente

- **Item**: Sem CI configurada para lint/typecheck/testes.
- **Origem no spec arquivado**: motivação herdada do master `requirements.md > Observações da varrida inicial > DX / Infra` ("Sem CI configurada para lint/typecheck/testes").
- **Estado**: `Confirmado`
- **evidence**: `file_search` em 2026-05-17 confirmou ausência de `.github/workflows/**` no repositório. Nenhum YAML de pipeline em `.github/`, `.gitlab-ci/`, `.circleci/`, `azure-pipelines.yml` ou similar. Confirmado por `Test-Path .github` retornando `False`.
- **Tarefa derivada**: Definir pipeline de CI com 3 estágios (lint, typecheck, test) em `.github/workflows/ci.yml`, consumindo os contratos `npm run lint` (fase-4), `npx tsc --noEmit` e `npm run test` (fase-2). _(EAR 8.1, 8.7)._

##### Item 2 — `docker-compose.yml` não auditado

- **Item**: `docker-compose.yml` presente mas sem documentação de uso (variáveis, portas, volumes).
- **Origem no spec arquivado**: master `requirements.md > Observações da varrida inicial > DX / Infra` ("`docker-compose.yml` presente mas não auditado").
- **Estado**: `Confirmado`
- **evidence**: `docker-compose.yml:1-15` define um service `db` (postgres:16-alpine, porta 5432:5432, volume `privello_pg:/var/lib/postgresql/data`, env `POSTGRES_USER=postgres`/`POSTGRES_PASSWORD=masterkey`/`POSTGRES_DB=privello`). Não há README ou doc dedicada explicando como subir esse compose, integrar com `DATABASE_URL` em `.env`, ou rotacionar a senha de dev.
- **Tarefa derivada**: Produzir doc de uso do `docker-compose.yml` (estrutura, variáveis necessárias, portas expostas, volume persistente) — formato preferido: seção dedicada em `README.md` ou doc `docs/docker.md`. _(EAR 8.2)._

##### Item 3 — Variáveis de ambiente sem doc única

- **Item**: Variáveis de ambiente não documentadas em um único arquivo.
- **Origem no spec arquivado**: master `requirements.md > Observações da varrida inicial > DX / Infra` ("Variáveis de ambiente não documentadas em um único arquivo").
- **Estado**: `Reescopado`
- **EARS original (mantido)**: `THE Phase_7_Spec SHALL produzir documento único listando todas as variáveis de ambiente requeridas, com descrição, exemplo e ambiente alvo (dev/prod).`
- **Alvo atual**: Após a fase-1, **`.env.example` já existe** com 16 variáveis comentadas (`AUTH_SECRET`, `AUTH_URL`, `NEXT_PUBLIC_BASE_URL`, `NEXT_DEV_ALLOWED_ORIGINS`, `DEV_ENDPOINT_TOKEN`, `CRON_SECRET`, `PRODUCTION_HOSTNAME`, `DATABASE_URL`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`, `MERCADOPAGO_ACCESS_TOKEN`, `NEXT_PUBLIC_MP_PUBLIC_KEY`). O **gap atual** é a existência de variáveis lidas pelo código que **não constam** em `.env.example`: `NODE_ENV` (sistema), `PRISMA_DEBUG_QUERIES` (instrumentação opt-in da fase-3, cf. `metricas-baseline.md > §2.1`), `NEXTAUTH_URL` (alias legado em `src/app/_actions/password-reset.ts:16`, `src/app/_actions/admin-moderation.ts:18`, `src/app/api/mp/checkout/route.ts:9`, `src/app/api/cadastro/iniciar/route.ts:9`), `MP_WEBHOOK_SECRET` (`src/app/api/mp/webhook/route.ts:12`), `CI` (sistema). O documento único desta fase **consolida** o que `.env.example` já tem + as variáveis "fantasma" + ambiente alvo (dev/prod) + tabela com colunas `Variable | Description | Example | Environment`.
- **evidence**: `.env.example:1-105` (existente, parcialmente completo); `grep_search` em `process.env.[A-Z_]+` em `src/**/*.{ts,tsx}` retornou as variáveis adicionais listadas acima.
- **Tarefa derivada**: Produzir `docs/env.md` (ou seção do `README.md`) consolidando as 16 + 4 variáveis (20 no total) com tabela canônica. Atualizar `.env.example` se descobrir gap relevante. _(EAR 8.3)._

##### Item 4 — Duplicação `queries.ts ↔ services/*`

- **Item**: `src/lib/queries.ts` em uso paralelo com `src/lib/services/*`.
- **Origem no spec arquivado**: motivação derivada do master `design.md > Estado de partida` ("Camada `src/lib/services/` iniciada (`subscription`, `profile`, `city`, `media`)" + persistência de `queries.ts` em paralelo).
- **Estado**: `Reescopado`
- **EARS original (mantido)**: `THE Phase_7_Spec SHALL eliminar duplicação entre src/lib/queries.ts e src/lib/services/* (ou justificar e isolar o legado), em coordenação com a Fase 3.`
- **Alvo atual**: Após a fase-3, `src/lib/queries.ts` foi **refatorado para estado híbrido (a) + (b)**: 27 re-exports de `@/lib/services` com `@deprecated 2026-05-30 — remoção planejada após 2026-06-13` (cf. `src/lib/queries.ts:1-19`) + helpers `sortProfileCards`, `finalizeDiscoverOrder`, `profileCardInclude`, tipo `ProfileCardPayload` permanecem como **JUSTIFICADO** (oráculo da Property 1 em `src/lib/services/discover.service.pbt.ts`). A janela de remoção planejada termina em **2026-06-13**. EAR 8.4 desta fase agora se traduz em: **decisão pós-janela** — opção A (remover `queries.ts` integralmente, migrar Property 1 para snapshot estático conforme `metricas-baseline.md > §5 Decisões > queries.ts final`) ou opção B (manter helpers com nova justificativa registrada em ADR). NÃO há mais "duplicação" — há `queries.ts` legado isolado com uma data de expiração.
- **evidence**: `src/lib/queries.ts:1-22` (header `@deprecated`), `src/lib/queries.ts:22-72` (re-exports), `src/lib/queries.ts:74-145` (helpers JUSTIFICADO). `src/lib/services/discover.service.pbt.ts` referencia os helpers como oráculo da Property 1 (cf. `metricas-baseline.md` e `handoff.md > Fase 3 > Decisões`).
- **Tarefa derivada**: Em ou após 2026-06-13, decidir entre opção A (cleanup integral) e opção B (manter com ADR justificando). Caso a fase rode antes da janela, registrar como `OutOfScopeFinding` candidato a fase-7-followup ou postergar a tarefa até a data de expiração. _(EAR 8.4)._

##### Item 5 — Ocorrências de `any` em `src/`

- **Item**: Plano de redução de `any` em `src/`.
- **Origem no spec arquivado**: motivação derivada do master `requirements.md > Observações da varrida inicial > DX / Infra` (referência a "ocorrências de `any` em `src/`" como área tocada).
- **Estado**: `Reescopado`
- **EARS original (mantido)**: `WHERE houver mais de 5 ocorrências de any em src/, THE Phase_7_Spec SHALL planejar redução com meta numérica medida antes/depois; abaixo desse limite, basta registrar a contagem atual sem plano formal de redução.`
- **Alvo atual**: Inventário rodado em 2026-05-17 com regex `:\s*any\b|\bas\s+any\b|<any>` sobre `src/**/*.{ts,tsx}` (257 arquivos): **0 ocorrências** de `any` como anotação de tipo TypeScript. As 3 únicas ocorrências da palavra "any" (`src/app/_actions/subscription.ts:15`, `support.ts:61`, `verification.ts:30`) são **palavras em inglês em comentários** ("any existing", "any", "if any"), NÃO anotações TypeScript. Como `0 < 5`, EAR 8.5 colapsa para "registrar a contagem atual sem plano formal de redução".
- **evidence**: `[regex]::Matches` sobre `src/**/*.{ts,tsx}` em 2026-05-17 = 0 matches para padrão TS; 3 matches para palavra "any" em comentários (todos em código legado pré-fase-1).
- **Tarefa derivada**: Registrar contagem atual (`0` de `any` como anotação TS, `3` ocorrências da palavra "any" em comentários — irrelevantes) em `dx-conventions.md > §6 Type-safety baseline`. **Nenhum plano de redução formal é necessário** nesta fase. Caso a contagem suba acima de 5 em fase futura, a regra é replanejar em novo spec. _(EAR 8.5)._

##### Item 6 — ADRs e changelog ausentes

- **Item**: Convenção de ADRs (Architecture Decision Records) e changelog do projeto.
- **Origem no spec arquivado**: master `Requirement 8.6` (sem origem direta no `_archive/`; é Non-Goal histórico que só agora vira escopo).
- **Estado**: `Confirmado`
- **evidence**: `Test-Path docs/adr` retornou `False`; `Test-Path docs` retornou `False`; `Test-Path CHANGELOG.md` retornou `False`. Nenhum precedente de ADR ou changelog versionado no repositório (apenas `CHANGELOG.md` em `node_modules/**`, irrelevante). Decisões arquiteturais existentes hoje vivem em prosa nos `design.md` dos specs-filhos (ex.: fase-3 decidiu não ativar `cacheComponents`; fase-4 decidiu `Modal.onClose` vs `Dropdown.onOpenChange`); nenhuma dessas tem ADR canônico.
- **Tarefa derivada**: Definir convenção `docs/adr/` com modelo `0001-template.md` (formato MADR ou Nygard, pt-BR), criar `CHANGELOG.md` na raiz no formato Keep a Changelog 1.1.0, e registrar em ADRs as decisões já tomadas pelas fases 1–4 que merecem rastreabilidade canônica. _(EAR 8.6)._

##### Item 7 — Refletir scripts/ferramentas das fases anteriores na CI

- **Item**: Scripts e ferramentas introduzidos pelas fases anteriores (Vitest, lint anti-regressão) refletidos na CI.
- **Origem no spec arquivado**: master `Requirement 8.7` (corolário das fases 1–4 estarem `Done`).
- **Estado**: `Confirmado`
- **evidence**: `package.json > scripts` lista hoje: `dev`, `build`, `start`, `lint`, `test`, `test:watch`, `test:run`, `test:e2e`, `test:e2e:ios`, `test:e2e:desktop`, `postinstall`, `db:generate`, `db:push`, `db:migrate`, `db:seed`, `db:studio` (16 scripts). Os scripts `test*` foram introduzidos pela fase-2 (cf. `testing-conventions.md > §8.2`); `lint` ganhou regra anti-regressão `no-restricted-syntax` da fase-4 (`eslint.config.mjs`). A pipeline de CI desta fase precisa rodar pelo menos `npm run lint`, `npx tsc --noEmit` e `npm run test`. `test:e2e*` são fora do escopo (Playwright, "ampliação dos testes Playwright" é Non-Goal explícito da fase-2).
- **Tarefa derivada**: Garantir que o YAML da CI (Item 1) referencie explicitamente `npm run lint` (consumindo regra anti-regressão da fase-4), `npx tsc --noEmit` e `npm run test` (consumindo Vitest da fase-2). _(EAR 8.7)._

##### Item 8 — Componentes grandes pendentes

- **Item**: Componentes grandes pendentes (`media-gallery.tsx` ~23KB, `perfil-editor.tsx` ~23KB, `reels-feed.tsx` ~15KB, `story-bar.tsx` ~14KB, `media-manager.tsx` ~13KB).
- **Origem no spec arquivado**: master `requirements.md > Observações da varrida inicial > DX / Infra` ("Componentes grandes pendentes").
- **Estado**: `Resolvido` _(via Non-Goal explícito desta fase — ver §6 Non-Goals item 5)_
- **evidence**: master `Requirement 8` (Phase Card desta fase) **não inclui** quebra de componentes grandes em `acceptance` nem em `outputs`. Quebra de componentes grandes pertence à fase-5-ux (mediante padrão UI otimista, EmptyState, View Transitions) e fase-6-mobile-cross-browser (responsividade). Esta fase é DX/infra; mexer em código de aplicação além do cleanup de `queries.ts` (Item 4) viola §6 Non-Goals.
- **Observação**: NÃO vira tarefa desta fase. Achados eventuais sobre componentes grandes durante a execução viram `OutOfScopeFinding` (seção 3) com `proposedTarget: fase-5-ux` ou `fase-6-mobile-cross-browser`.

##### Item 9 — Lint herdado (~20–28 erros)

- **Item**: Lint herdado com ~20–28 errors (`react-hooks/refs`, `react-hooks/cant-call-impure-fn-during-render`, `setState-in-effect`) em código de UX/painel pesado.
- **Origem no spec arquivado**: derivado do estado de saída da fase-4 (`handoff.md > Smoke checks finais > npm run lint`).
- **Estado**: `Resolvido` _(fora do escopo desta fase; pertence a fase-5-ux)_
- **evidence**: `handoff.md > Smoke checks finais (pós fase-3 + fase-4)` registra "67–75 problems (20–28 errors + 47 warnings). Zero erros novos introduzidos pelas fases 3 e 4. Erros remanescentes são pré-existentes em código de UX/painel pesado." Esta fase **NÃO corrige código de aplicação** — apenas configura a pipeline de CI para reportar o lint atual. A redução desses erros pertence à fase-5-ux (que vai re-escrever os componentes envolvidos).
- **Observação**: NÃO vira tarefa desta fase. A pipeline de CI precisa decidir como tratar esse lint herdado: bloquear o merge (e quebrar) ou tolerar (decisão registrada em ADR). Ver `design.md > Components and Interfaces > 1. CI Pipeline > tolerância de lint herdado`.

---

## 3. Achados fora de escopo

> Nenhum achado fora de escopo registrado nesta fase.

Cada novo achado relevante que extrapolar o escopo desta fase será registrado como uma linha desta tabela (schema `OutOfScopeFinding` de `auditoria-geral/design.md > Data Models`) e disparará commit no master spec, **nunca** absorção silenciosa pelo spec-filho (regra dura E4 de `auditoria-geral/design.md > Error Handling`).

| discoveredIn | description | proposedTarget | evidence |
|---|---|---|---|
| _(vazio até a primeira descoberta)_ | | | |

---

## 4. Consultas a `node_modules/next/dist/docs/` (AGENTS_Rule)

> n/a — fase não toca APIs do Next.js.

A Fase 7 entrega CI (`.github/workflows/ci.yml`), documentação (`docs/env.md`, `docs/docker.md` ou seções do `README.md`), convenção de ADRs (`docs/adr/`), changelog (`CHANGELOG.md`) e cleanup de código TS legado (`src/lib/queries.ts` pós-janela). Nenhum desses artefatos toca rotas, server actions, middleware, cache, transitions, images config nem headers do Next.js. Se durante a execução surgir necessidade de tocar API do Next.js (ex.: avaliar Cache Components que ficaram fora da fase-3, ou alterar headers no `next.config.ts`), isso vira `OutOfScopeFinding` para a fase responsável (fase-3-followup ou fase-1-followup), NÃO é absorvido aqui.

---

## Glossary

- **Phase_7_Spec**: este documento e os artefatos produzidos sob `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-7-dx-infra\` e os arquivos de configuração/documentação criados por esta fase no repositório (`.github/workflows/ci.yml`, `docs/env.md`, `docs/docker.md` ou seções do `README.md`, `docs/adr/`, `CHANGELOG.md`).
- **CI_Pipeline**: pipeline de Integração Contínua entregue por esta fase em `.github/workflows/ci.yml`. Cobre 3 estágios obrigatórios (Lint_Pipeline_Stage, Typecheck_Pipeline_Stage, Test_Pipeline_Stage).
- **Lint_Pipeline_Stage**: estágio da CI que executa `npm run lint` (resolve para `eslint`). Consome a regra anti-regressão `no-restricted-syntax` instalada pela fase-4 (cf. `tokens.md > Contrato com a CI da Fase 7`).
- **Typecheck_Pipeline_Stage**: estágio da CI que executa `npx tsc --noEmit`. Tipo-checa todos os arquivos em `tsconfig.json > include` (que cobre `**/*.ts`, `**/*.tsx`) com `strict: true`.
- **Test_Pipeline_Stage**: estágio da CI que executa `npm run test` (resolve para `vitest --run`). Consome o runner instalado pela fase-2 (cf. `testing-conventions.md > §8 Contrato com a CI da Fase 7`).
- **Env_Variables_Doc**: documento único produzido por esta fase listando todas as variáveis de ambiente do projeto. Localização preferida: `docs/env.md`. Tabela canônica com colunas `Variable | Description | Example | Environment`.
- **Docker_Doc**: documento de uso do `docker-compose.yml` produzido por esta fase. Cobre serviços, portas, volumes e variáveis necessárias. Pode ficar em `README.md > seção Docker` ou `docs/docker.md` separado.
- **ADR** (Architecture Decision Record): documento Markdown numerado (`0001-titulo-curto.md`) registrando uma decisão arquitetural com campos `status` / `context` / `decision` / `consequences`. Localização: `docs/adr/`.
- **ADR_Convention**: convenção de formato e armazenamento de ADRs. Inclui modelo `0001-template.md`, regras de numeração (sequencial, sem reuso) e regras de status (`Proposto` / `Aceito` / `Substituído por NNNN` / `Rejeitado`).
- **Changelog**: arquivo `CHANGELOG.md` na raiz do repositório no formato Keep a Changelog v1.1.0 com seções `Added` / `Changed` / `Deprecated` / `Removed` / `Fixed` / `Security` por release. Versões em SemVer.
- **Any_Reduction_Plan**: plano numérico de redução de `any` exigido por EAR 8.5 quando count > 5. **Nesta fase, count = 0**, portanto Any_Reduction_Plan colapsa para registro da contagem atual em `dx-conventions.md > §6`.
- **Queries_Cleanup**: cleanup de `src/lib/queries.ts` exigido por EAR 8.4 após a janela `@deprecated 2026-05-30 — remoção planejada após 2026-06-13`. Duas opções: A (remover integralmente, migrar Property 1 para snapshot estático) ou B (manter helpers com nova justificativa via ADR).
- **Pipeline_Tolerance_Decision**: decisão registrada em ADR sobre como o Lint_Pipeline_Stage trata o lint herdado (~20–28 errors em código de UX/painel pesado, cf. `handoff.md`). Opções: bloquear o merge (e quebrar até fase-5-ux corrigir) ou usar `--max-warnings 0` apenas em arquivos novos (decisão a ser tomada na execução).
- **CI_Cache**: cache de `node_modules/` e `~/.npm` no GitHub Actions usando `actions/setup-node@vN > cache: 'npm'`. Reduz tempo de cada job em ≈30–60 s após o primeiro warm-up.
- **CI_Matrix**: matriz de versões de Node.js a testar na CI. Default desta fase: 1 versão (alinhada com `engines.node` do `package.json` se houver, ou versão LTS atual). Matrix multi-versão é Non-Goal nesta fase.

---

## 6. Non-Goals / Out of Scope

Os itens abaixo NÃO fazem parte desta fase e não devem virar tarefa:

1. **Monitoramento em produção (APM/log shipping)** — Datadog, Sentry, New Relic, OpenTelemetry, log shipping para ELK/Loki/etc. ficam fora. _(EAR 8.8 declarada explicitamente.)_
2. **Feature flags** — LaunchDarkly, Unleash, flags caseiras. Ficam fora. _(EAR 8.8 declarada explicitamente.)_
3. **Blue/green deploy** — estratégias de release sem downtime, canary, rolling update sofisticado. Ficam fora. _(EAR 8.8 declarada explicitamente.)_
4. **Mudanças em primitivos da fase-4** (Modal, Switch, Dropdown, focus trap) — entregues como `Done` em 2026-05-17. Ficam congelados.
5. **Mudanças em código de aplicação além do cleanup `queries.ts`** — não vamos reescrever componentes grandes (`media-gallery.tsx`, `perfil-editor.tsx` etc.), corrigir lint herdado de `react-hooks/refs`/`cant-call-impure-fn-during-render` em `src/components/**` e `src/app/**`, nem refatorar Server Actions. Esses pertencem à fase-5-ux e/ou fase-6-mobile-cross-browser.
6. **CSP nonce e HSTS preload** — fase-1 já decidiu CSP estático Report-Only sem nonce e HSTS sem preload (cf. `next.config.ts:67-77` e `nextauth-prod.md > §5`). Esta fase NÃO altera essas decisões.
7. **Mudanças em `prisma/schema.prisma`** — schema é congelado (decisão dura do orquestrador, cf. `handoff.md > Restrições respeitadas`). Esta fase não adiciona/remove índices, colunas ou modelos.
8. **Cobertura de componentes React (Testing Library) e ampliação dos testes Playwright** — Non-Goal herdado da fase-2 (cf. `requirements.md > Requirement 3.7` do master) que continua valendo. Esta fase **roda** os testes existentes na CI; não adiciona novos.
9. **Configuração de gates de cobertura** (`coverage` do Vitest como bloqueio) — fase-2 declarou meta de 80% em módulos puros como **meta**, não gate (`testing-conventions.md > §6 > Não é gate nesta fase`). Esta fase pode rodar `npx vitest --coverage --run` na CI mas NÃO transforma a meta em hard gate; transformação fica para fase futura.
10. **Migração de gerenciador de pacotes** (npm → pnpm/yarn/bun) — fora desta fase. Mantemos npm.
11. **Auditoria de dependências (SCA/Snyk/Dependabot)** — Non-Goal herdado da fase-1 (`auditoria-geral/requirements.md > Requirement 2.8`). Não entra aqui.
12. **Dockerfile da aplicação** — `docker-compose.yml` atual provê apenas o **Postgres de dev**, não a app. Esta fase **documenta** o compose existente; criar Dockerfile da app é fora do escopo.
13. **CI multi-versão de Node.js** — matriz com 18, 20, 22 etc. fica fora. CI_Matrix desta fase usa 1 versão (alinhada com runtime de produção).
14. **Remoção de `'use server'` ou refactor de Server Actions** — preservadas como `Done` na fase-3.

Qualquer item que apareça nesta lista mas se mostre necessário durante a execução vira `OutOfScopeFinding` (seção 3) e exige commit no master spec antes de ser absorvido.

---

## Requirements

> Os requisitos abaixo são os EARS herdados (Requirement 8.1–8.8 do master) **destrinchados** por superfície tocada. Cada bloco identifica os arquivos envolvidos, mantém o EARS herdado como referência e adiciona EARS de detalhe que serão validados pelo spec-filho.

### Requirement 1: Pipeline de CI com lint, typecheck e testes

**User Story:** Como mantenedor, quero uma pipeline de CI que rode lint, typecheck e testes em cada PR, para que regressões sejam detectadas antes do merge.

**Inputs:** novo arquivo `.github/workflows/ci.yml`; consumo de `package.json > scripts` (`lint`, `test`).

#### Acceptance Criteria

1. THE Phase_7_Spec SHALL definir pipeline de CI com pelo menos 3 estágios: lint (`eslint`), typecheck (`tsc --noEmit`) e testes (Vitest, conforme Fase 2). _(EARS herdada — Requirement 8.1 do master.)_
2. THE Phase_7_Spec SHALL criar `.github/workflows/ci.yml` na raiz do repositório como o único arquivo de pipeline da fase.
3. THE Phase_7_Spec SHALL fazer a CI disparar em pelo menos dois eventos: `push` na branch `master` (e/ou `main`) e `pull_request` direcionado a `master`.
4. THE Phase_7_Spec SHALL declarar a estrutura do job principal com 1 job ou 1 job + N steps, cobrindo:
   - Step `checkout` via `actions/checkout@vN`.
   - Step `setup-node` via `actions/setup-node@vN` com cache `npm` ativo, lendo `package.json > engines.node` se presente ou alinhando com a versão LTS atual (decisão registrada em ADR).
   - Step `install` executando `npm ci` (preserva pinning de `package-lock.json`).
   - Step `lint` executando `npm run lint` (consome regra anti-regressão `no-restricted-syntax` da fase-4; comportamento idêntico ao `npm run lint` local).
   - Step `typecheck` executando `npx tsc --noEmit` (cobre todos os arquivos em `tsconfig.json > include` com `strict: true`).
   - Step `test` executando `npm run test` (resolve para `vitest --run`; consome runner da fase-2).
5. THE Phase_7_Spec SHALL tomar uma decisão explícita (registrada em ADR — ver Requirement 6) sobre **tolerância ao lint herdado**: aceitar a CI quebrar enquanto fase-5-ux não corrigir os ~20–28 errors em código de UX/painel, OU configurar `npm run lint` na CI com escopo restrito (apenas arquivos novos/modificados no PR, via `eslint --max-warnings 0` em diff).
6. WHEN a CI rodar com `process.env.CI === "true"` (definido automaticamente pelo GitHub Actions), THE Phase_7_Spec SHALL garantir que `npm run test` herda o comportamento descrito em `testing-conventions.md > §8.1` (sair com exit ≠ 0 em `.only`/`.skip` sem comentário justificativo).
7. THE Phase_7_Spec SHALL anexar evidência da primeira run da CI (link de actions ou screenshot) em `dx-conventions.md > §1 CI Pipeline > Primeira run` antes de marcar a fase como Done.

### Requirement 2: Documentação de uso do `docker-compose.yml`

**User Story:** Como dev novo no projeto, quero saber como subir o Postgres local com Docker, para começar a desenvolver sem investigar o `docker-compose.yml` por conta própria.

**Inputs:** `docker-compose.yml` (somente leitura); `README.md` (existente, a ser estendido) ou `docs/docker.md` (novo).

#### Acceptance Criteria

1. THE Phase_7_Spec SHALL revisar `docker-compose.yml` e produzir documentação de uso (variáveis necessárias, portas, volumes) em README ou doc dedicado. _(EARS herdada — Requirement 8.2 do master.)_
2. THE Phase_7_Spec SHALL produzir documentação cobrindo, no mínimo:
   - **Serviços**: `db` (postgres:16-alpine).
   - **Variáveis de ambiente do compose**: `POSTGRES_USER` (default `postgres`), `POSTGRES_PASSWORD` (default `masterkey`), `POSTGRES_DB` (default `privello`).
   - **Porta exposta**: `5432:5432` (padrão Postgres).
   - **Volume persistente**: `privello_pg` montado em `/var/lib/postgresql/data`.
   - **Comando de subida**: `docker compose up -d db`.
   - **Comando de teardown sem perder dados**: `docker compose stop db`.
   - **Comando de teardown destrutivo**: `docker compose down -v` (remove o volume).
   - **Como conectar via `DATABASE_URL`**: string canônica `postgresql://postgres:masterkey@localhost:5432/privello?schema=public`.
3. THE Phase_7_Spec SHALL declarar a localização escolhida (README seção Docker OU `docs/docker.md` separado) e justificar em ≤ 30 palavras (favor a `docs/docker.md` por evitar inflar o README; favor a README por reduzir saltos para o dev novo).
4. THE Phase_7_Spec SHALL declarar como **fora de escopo** a criação de Dockerfile da aplicação (`docker-compose.yml` atual provê apenas o Postgres de dev; ver §6 Non-Goals item 12).
5. WHERE houver discrepância entre o `docker-compose.yml` atual e a documentação produzida, THE Phase_7_Spec SHALL registrar a discrepância como `OutOfScopeFinding` (seção 3) e propor commit no master spec — não absorver a correção do compose nesta fase, salvo correção trivial de comentário.

### Requirement 3: Documento único de variáveis de ambiente

**User Story:** Como dev novo no projeto, quero saber em um único lugar todas as variáveis de ambiente que o app lê, para configurar dev e prod sem caçar `process.env` no código.

**Inputs:** `.env.example` (existente, a ser comparado); `src/**/*.{ts,tsx}` (somente leitura, para grep `process.env.X`); novo arquivo `docs/env.md` (ou seção do `README.md`).

#### Acceptance Criteria

1. THE Phase_7_Spec SHALL produzir documento único listando todas as variáveis de ambiente requeridas, com descrição, exemplo e ambiente alvo (dev/prod). _(EARS herdada — Requirement 8.3 do master.)_
2. THE Phase_7_Spec SHALL produzir o documento como tabela canônica com 4 colunas obrigatórias: `Variable`, `Description`, `Example`, `Environment` (`dev` / `prod` / `dev+prod`).
3. THE Phase_7_Spec SHALL incluir, no mínimo, as 16 variáveis declaradas em `.env.example`:
   - `AUTH_SECRET`, `AUTH_URL`, `NEXT_PUBLIC_BASE_URL`, `NEXT_DEV_ALLOWED_ORIGINS` (auth)
   - `DEV_ENDPOINT_TOKEN` (dev endpoints)
   - `CRON_SECRET` (cron)
   - `PRODUCTION_HOSTNAME` (images config)
   - `DATABASE_URL` (Prisma)
   - `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` (SMTP)
   - `MERCADOPAGO_ACCESS_TOKEN`, `NEXT_PUBLIC_MP_PUBLIC_KEY` (pagamentos)
4. THE Phase_7_Spec SHALL incluir, adicionalmente, as variáveis lidas pelo código que não constam em `.env.example`, identificadas por inventário com `grep_search` por `process.env.[A-Z_]+` em `src/**/*.{ts,tsx}`:
   - `NODE_ENV` (sistema; valores aceitos `development` / `production` / `test`).
   - `PRISMA_DEBUG_QUERIES` (instrumentação opt-in da fase-3, valor `1` para ativar; cf. `metricas-baseline.md > §2.1`).
   - `NEXTAUTH_URL` (alias legado lido como fallback em 4 routes/actions: `src/app/_actions/password-reset.ts`, `_actions/admin-moderation.ts`, `app/api/mp/checkout/route.ts`, `app/api/cadastro/iniciar/route.ts`; documentar como **legado** e recomendar `AUTH_URL` ou `NEXT_PUBLIC_BASE_URL`).
   - `MP_WEBHOOK_SECRET` (`src/app/api/mp/webhook/route.ts:12`; documentar como **dev permite ausência**, prod exige).
   - `CI` (sistema; setado pelo GitHub Actions; documentar como `dev+prod`).
5. THE Phase_7_Spec SHALL recomendar atualizar `.env.example` com as variáveis "fantasma" identificadas em 3.4 (`PRISMA_DEBUG_QUERIES`, `NEXTAUTH_URL`, `MP_WEBHOOK_SECRET`) ou registrar a decisão de NÃO atualizar (com justificativa) em `docs/env.md > Notas`.
6. THE Phase_7_Spec SHALL declarar localização única do documento como `docs/env.md` (preferência) ou seção `## Variáveis de ambiente` em `README.md`. A escolha é registrada em ADR — ver Requirement 6.
7. WHERE uma variável tiver formato esperado (ex.: `AUTH_SECRET` é base64 de 32 bytes via `openssl rand -base64 32`), THE Phase_7_Spec SHALL registrar o formato no campo `Example` da tabela. Onde não houver formato estrito, registrar valor representativo.
8. THE Phase_7_Spec SHALL incluir cross-references para os documentos das fases anteriores que detalham subconjuntos das variáveis: `nextauth-prod.md > §2` (auth), `metricas-baseline.md > §2.1` (Prisma debug), `tokens.md` (não toca env).

### Requirement 4: Cleanup `queries.ts ↔ services/*` pós-janela

**User Story:** Como mantenedor, quero o código legado `src/lib/queries.ts` removido ou explicitamente justificado e isolado após a janela de transição, para que o repositório fique sem duplicação estrutural.

**Inputs:** `src/lib/queries.ts` (estado híbrido `@deprecated 2026-05-30`); `src/lib/services/discover.service.pbt.ts` (consumidor do oráculo); ADR a ser criado.

#### Acceptance Criteria

1. THE Phase_7_Spec SHALL eliminar duplicação entre `src/lib/queries.ts` e `src/lib/services/*` (ou justificar e isolar o legado), em coordenação com a Fase 3. _(EARS herdada — Requirement 8.4 do master.)_
2. THE Phase_7_Spec SHALL operar a cleanup **somente em ou após 2026-06-13** (data declarada em `src/lib/queries.ts:1-7` como `@deprecated 2026-05-30 — remoção planejada após 2026-06-13`).
3. WHEN a cleanup rodar dentro da janela (em ou após 2026-06-13), THE Phase_7_Spec SHALL escolher entre duas opções e registrar a escolha em ADR (ver Requirement 6):
   - **Opção A (cleanup integral)**: remover `src/lib/queries.ts` por completo. Migrar Property 1 (`discover.service.pbt.ts`) para usar **snapshot estático** como oráculo (conforme já planejado em `metricas-baseline.md > §5 Decisões > queries.ts final`). Atualizar consumidores remanescentes (devem ser zero — fase-3 migrou os 24).
   - **Opção B (manter helpers JUSTIFICADO com nova justificativa)**: manter `sortProfileCards`, `finalizeDiscoverOrder`, `profileCardInclude`, `ProfileCardPayload` em `queries.ts` apenas como oráculo do PBT, registrar nova janela de revisão (ex.: 2026-12-31) em comentário, e atualizar o ADR justificando a manutenção.
4. WHEN a cleanup rodar **antes** de 2026-06-13 (caso a fase seja executada cedo), THE Phase_7_Spec SHALL registrar a tarefa de cleanup como **postergada** em `dx-conventions.md > §4 Queries cleanup > Status` e marcar EAR 8.4 desta fase como `pendente até 2026-06-13` (não bloqueia o `Done` da fase, mas exige nota explícita no Phase Card do master).
5. THE Phase_7_Spec SHALL validar a cleanup com:
   - `npx tsc --noEmit` retorna exit 0.
   - `npm run test` continua verde (172+ testes; Property 1 do `discover.service.pbt.ts` continua passando).
   - `npm run build` retorna exit 0 (com `AUTH_URL` no shell em prod-mode, conforme `handoff.md`).
6. THE Phase_7_Spec SHALL anexar log dos 3 comandos do EAR 4.5 em `dx-conventions.md > §4 Queries cleanup > Smoke checks` antes de marcar a tarefa como Done.

### Requirement 5: Type-safety baseline (redução de `any`)

**User Story:** Como mantenedor, quero saber a contagem atual de `any` em `src/`, para confirmar que o type-safety está saudável e decidir se um plano formal de redução é necessário.

**Inputs:** `src/**/*.{ts,tsx}` (somente leitura para grep); novo bloco em `dx-conventions.md > §6 Type-safety baseline`.

#### Acceptance Criteria

1. WHERE houver mais de 5 ocorrências de `any` em `src/`, THE Phase_7_Spec SHALL planejar redução com meta numérica medida antes/depois; abaixo desse limite, basta registrar a contagem atual sem plano formal de redução. _(EARS herdada — Requirement 8.5 do master.)_
2. THE Phase_7_Spec SHALL registrar a contagem atual em `dx-conventions.md > §6 Type-safety baseline` usando regex canônica `:\s*any\b|\bas\s+any\b|<any>` aplicada a `src/**/*.{ts,tsx}`.
3. THE Phase_7_Spec SHALL ancorar a contagem com data e comando reproduzível (PowerShell `[regex]::Matches` ou ripgrep equivalente). A medição inicial registrada nesta fase (2026-05-17) é **0 ocorrências** em 257 arquivos.
4. WHERE a contagem inicial for ≤ 5, THE Phase_7_Spec SHALL apenas registrar o número e a data, **sem plano formal de redução**. EAR 8.5 colapsa nesse caso.
5. WHERE a contagem inicial for > 5, THE Phase_7_Spec SHALL produzir plano numérico de redução com:
   - Tabela `path:linha` de cada ocorrência.
   - Meta de redução (ex.: 50% até X data, 100% até Y data).
   - Critério de aceite por arquivo (substituição por tipo concreto, `unknown` + narrowing, ou `@ts-expect-error` justificado).
6. THE Phase_7_Spec SHALL declarar `tsconfig.json > compilerOptions.strict` como `true` (estado atual) como pré-condição. NÃO altera `tsconfig.json` nesta fase; apenas lê.

### Requirement 6: Convenção de ADRs

**User Story:** Como mantenedor, quero um padrão de ADRs com modelo e local de armazenamento, para que decisões arquiteturais futuras tenham rastreabilidade canônica em vez de ficarem espalhadas em prosa nos `design.md`.

**Inputs:** novo diretório `docs/adr/`; novo arquivo `docs/adr/0001-template.md`; ADRs adicionais para registrar decisões já tomadas pelas fases 1–4.

#### Acceptance Criteria

1. THE Phase_7_Spec SHALL definir convenção de ADRs (Architecture Decision Records) e changelog do projeto, com modelo e local de armazenamento. _(EARS herdada — Requirement 8.6 do master, parte ADR.)_
2. THE Phase_7_Spec SHALL criar `docs/adr/` como diretório raiz dos ADRs. Não criar em outras localizações (`adr/`, `adrs/`, `decisions/`, etc.).
3. THE Phase_7_Spec SHALL criar `docs/adr/0001-template.md` como modelo canônico, em pt-BR, com os campos:
   - **Título**: `# ADR NNNN — <título curto>`.
   - **Status**: `Proposto` / `Aceito` / `Substituído por NNNN` / `Rejeitado`.
   - **Data**: ISO-8601 (`YYYY-MM-DD`).
   - **Contexto**: 1–3 parágrafos descrevendo o problema e os fatores em jogo.
   - **Decisão**: 1 parágrafo declarativo da decisão tomada.
   - **Consequências**: lista positiva, lista negativa, lista neutra.
   - **Referências**: links para specs, ADRs anteriores, ou documentação externa relevante.
4. THE Phase_7_Spec SHALL adotar formato **MADR** (Markdown ADR) — variante simplificada da convenção Nygard original, alinhada com a estrutura listada em 6.3.
5. THE Phase_7_Spec SHALL declarar regra de numeração: sequencial, sem reuso (`0001`, `0002`, …, `NNNN`), com 4 dígitos. Quando um ADR é substituído, o status do antigo muda para `Substituído por NNNN` (não é deletado).
6. THE Phase_7_Spec SHALL criar pelo menos os ADRs abaixo durante esta fase, registrando decisões já tomadas pelas fases 1–4 que merecem rastreabilidade canônica:
   - **ADR 0002** — Adoção de Vitest + fast-check como infraestrutura de testes (decisão da fase-2; substitui prosa em `fase-2-testes/design.md > Decisões de design importantes`).
   - **ADR 0003** — `queries.ts` em estado híbrido com `@deprecated 2026-05-30` e helpers JUSTIFICADO (decisão da fase-3; substitui prosa em `metricas-baseline.md > §5 Decisões`). Status atualizado conforme Requirement 4 (cleanup pós-janela).
   - **ADR 0004** — Pipeline de CI com 3 estágios (decisão desta fase; documenta a estrutura escolhida para `.github/workflows/ci.yml` e a tolerância de lint herdado declarada em Requirement 1.5).
   - **ADR 0005** — Localização do documento único de variáveis de ambiente (`docs/env.md` vs seção do `README.md`; decisão tomada para EAR 3.6).
   - ADRs adicionais ficam à discrição do executor (ex.: localização da Docker doc EAR 2.3, formato do changelog EAR 7.x), desde que sigam a numeração e o template.
7. THE Phase_7_Spec SHALL declarar que ADRs novos a partir desta fase obrigam a substituir prosa em `design.md` futuros — `design.md` referencia o ADR, não duplica a decisão.

### Requirement 7: Changelog do projeto

**User Story:** Como mantenedor, quero um changelog versionado, para que clientes/contributors saibam o que mudou entre releases sem ler git log.

**Inputs:** novo arquivo `CHANGELOG.md` na raiz do repositório.

#### Acceptance Criteria

1. THE Phase_7_Spec SHALL definir convenção de changelog do projeto, com modelo e local de armazenamento. _(EARS herdada — Requirement 8.6 do master, parte changelog.)_
2. THE Phase_7_Spec SHALL criar `CHANGELOG.md` na raiz do repositório (não em `docs/`, não em `.kiro/`).
3. THE Phase_7_Spec SHALL adotar formato **Keep a Changelog v1.1.0** (https://keepachangelog.com/pt-BR/1.1.0/) com seções por release: `Added` / `Changed` / `Deprecated` / `Removed` / `Fixed` / `Security`.
4. THE Phase_7_Spec SHALL adotar versionamento **SemVer 2.0** (MAJOR.MINOR.PATCH) para os releases. Como o projeto está em `package.json > version: "0.1.0"` e `private: true`, releases são tags git ou seções `[Unreleased]` quando não houver release formal.
5. THE Phase_7_Spec SHALL incluir uma seção `[Unreleased]` no topo do changelog com as mudanças entregues pelas fases 1, 2, 3, 4 e 7 que devem aparecer no próximo release. Estrutura mínima esperada:
   - `Added`: CI pipeline (fase-7), camada de services (fase-3), Vitest + fast-check (fase-2), tokens semânticos completos (fase-4), CSP Report-Only e HSTS (fase-1), rate limiting (fase-1), Zod em endpoints (fase-1), primitivos Dropdown e focus trap (fase-4), `.env.example` (fase-1), `docs/env.md` (fase-7), `docs/adr/` (fase-7), `docs/docker.md` ou seção (fase-7).
   - `Changed`: `next.config.ts` (whitelist em `images.remotePatterns`, headers de segurança, CSP), `src/lib/auth.ts` (guard `AUTH_URL` em prod, `trustHost` documentado), `src/lib/queries.ts` (refatorado para híbrido `@deprecated`).
   - `Deprecated`: re-exports de `@/lib/queries` (`@deprecated 2026-05-30`).
   - `Removed`: nenhum item formalmente removido nas fases 1–4 (cleanup pós-janela vai aparecer na próxima entrada do changelog).
   - `Fixed`: bug iPhone via LAN (sessão antes do master spec, registrado em `_archive/ios-mobile-interactions-fix/`).
   - `Security`: HSTS adicionado, CSP Report-Only adicionado, `/api/dev/*` autenticado, `/api/cron/*` por header, rate limiting em login/upload/wa-click/comments/stories.
6. THE Phase_7_Spec SHALL declarar que entradas futuras no changelog **acompanham o commit que entrega a mudança** — não há tarefa de "atualizar changelog" separada.
7. THE Phase_7_Spec SHALL declarar como **fora de escopo** automação de geração do changelog (ex.: `release-please`, `semantic-release`, `changesets`). Manutenção manual é o default desta fase.

### Requirement 8: CI reflete scripts/ferramentas das fases anteriores

**User Story:** Como mantenedor, quero que a CI rode exatamente os scripts e ferramentas que as fases 1–4 introduziram, para que os contratos declarados (`testing-conventions.md > §8`, `tokens.md > Contrato com a CI`) sejam efetivamente honrados.

**Inputs:** `package.json > scripts` (estado atual com 16 scripts); `eslint.config.mjs` (com regra anti-regressão da fase-4); `vitest.config.ts` (da fase-2); `.github/workflows/ci.yml` (a ser criado em Requirement 1).

#### Acceptance Criteria

1. WHEN uma fase anterior introduzir scripts ou ferramentas (Vitest, lint extra), THE Phase_7_Spec SHALL garantir que estejam refletidos na CI. _(EARS herdada — Requirement 8.7 do master.)_
2. THE Phase_7_Spec SHALL referenciar explicitamente em `.github/workflows/ci.yml` (Requirement 1):
   - `npm run lint` — consome `eslint` + regra `no-restricted-syntax` da fase-4 (cf. `tokens.md > Contrato com a CI da Fase 7`).
   - `npx tsc --noEmit` — consome `tsconfig.json > strict: true` (estado atual).
   - `npm run test` — consome Vitest 4.1.6 + fast-check 4.8.0 + `@fast-check/vitest` 0.4.1 da fase-2 (cf. `testing-conventions.md > §8 Contrato com a CI da Fase 7`).
3. THE Phase_7_Spec SHALL declarar o `engines.node` apropriado em `package.json` OU registrar a decisão de NÃO declarar (com justificativa em ADR). Se declarar, alinhar com a versão usada em `actions/setup-node` na CI.
4. THE Phase_7_Spec SHALL **NÃO incluir** `npm run test:e2e` na CI desta fase. Ampliação dos testes Playwright é Non-Goal herdado da fase-2 (`auditoria-geral/Requirement 3.7`); rodar Playwright na CI exige browsers + servidor up + banco semeado, fora do contrato da fase-2.
5. WHERE o EAR 8.7 do master pedir reflexão de ferramentas adicionais introduzidas em fases futuras, THE Phase_7_Spec SHALL deixar a estrutura do `.github/workflows/ci.yml` extensível (steps adicionais por nome, sem dependências cruzadas), permitindo que fase-5/fase-6 acrescentem steps sem reescrever a pipeline.
6. THE Phase_7_Spec SHALL declarar que mudanças em `package.json > scripts` introduzidas em fases futuras (ex.: `test:visual` em fase-6) precisam ser explicitamente adicionadas ao YAML — não há descoberta automática.

### Requirement 9: Itens fora de escopo declarados

**User Story:** Como mantenedor, quero que itens fora de escopo apareçam explicitamente, para que ninguém os absorva por engano.

#### Acceptance Criteria

1. THE Phase_7_Spec SHALL declarar fora de escopo: monitoramento em produção (APM/log shipping), feature flags e blue/green deploy. _(EARS herdada — Requirement 8.8 do master.)_
2. WHEN um item da seção "Non-Goals" deste documento aparecer durante a execução, THE Phase_7_Spec SHALL registrá-lo como `OutOfScopeFinding` na seção 3 deste documento e abrir commit no master spec antes de qualquer absorção.
3. THE Phase_7_Spec SHALL declarar adicionalmente como Non-Goals (cf. §6) os itens 4–14 daquela seção, para evitar absorção silenciosa de mudanças em primitivos da fase-4, código de aplicação fora do cleanup, CSP nonce/HSTS preload, schema Prisma, cobertura de componentes/Playwright ampliado, gates de cobertura, troca de gerenciador de pacotes, SCA, Dockerfile da app, CI multi-versão e Server Actions.

---

## Saída desta fase

A Fase 7 é considerada `Done` quando:

- Todos os 9 Requirements desta seção têm seus EARS verificáveis e há evidência (path:linha de arquivo, log de CI, link do PR, ou registro em `dx-conventions.md`) anexada para cada um.
- `.github/workflows/ci.yml` existe e a primeira run da CI completou com os 3 estágios (lint, typecheck, test) executados — o resultado dos estágios pode incluir o lint herdado quebrando, conforme decisão registrada em ADR 0004 (Requirement 1.5).
- `docs/env.md` (ou seção `README.md`) cobre as 16 variáveis de `.env.example` + as 4 variáveis "fantasma" (`NODE_ENV`, `PRISMA_DEBUG_QUERIES`, `NEXTAUTH_URL`, `MP_WEBHOOK_SECRET`) + `CI`.
- `docs/docker.md` (ou seção `README.md`) cobre o `docker-compose.yml` (serviço, porta, volume, variáveis, comandos de subida/teardown).
- `docs/adr/0001-template.md` existe; ADRs 0002, 0003, 0004 e 0005 registram decisões já tomadas (cf. Requirement 6.6).
- `CHANGELOG.md` existe na raiz no formato Keep a Changelog v1.1.0 com seção `[Unreleased]` cobrindo as fases 1–4 + 7.
- `dx-conventions.md` existe em `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-7-dx-infra\` cobrindo: §1 CI Pipeline (estrutura, decisão de tolerância, evidência da primeira run), §2 Docker doc (localização escolhida), §3 Env vars doc (localização escolhida, lista de variáveis), §4 Queries cleanup (status conforme janela 2026-06-13, smoke checks), §5 ADRs (lista dos ADRs criados), §6 Type-safety baseline (contagem `0` em 2026-05-17), §7 Changelog (referência), §8 Smoke checks finais (lint, tsc, test, build).
- `src/lib/queries.ts` está cleanup-ed conforme opção A ou B do Requirement 4 (se a fase rodar dentro da janela 2026-06-13) ou marcado como pendente (se rodar antes).
- A seção 3 deste documento (`OutOfScopeFinding`) tem cada linha referenciando um commit no master spec, ou está marcada como vazia.
- O Phase Card desta fase no master `requirements.md` foi atualizado para `state: Done` com `doneAt` ISO-8601 e link para esta pasta.
- Smoke checks finais rodam com sucesso localmente (cf. `dx-conventions.md > §8`):
  - `npm run lint` — comportamento idêntico ao registrado em `handoff.md > Smoke checks finais (pós fase-3 + fase-4)` (~67–75 problems; 20–28 errors herdados; **zero erros novos** introduzidos por esta fase).
  - `npx tsc --noEmit` — exit 0.
  - `npm run test` — 172+ testes passando (a contagem pode crescer se Requirement 4 cleanup adicionar testes de paridade contra snapshot).
  - `npm run build` — exit 0 (com `AUTH_URL` no shell em prod-mode).
