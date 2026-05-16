# Requirements Document

> Spec-filho `fase-3-backend` promovido a partir do master spec da Auditoria Geral.
> Master: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\requirements.md`.

---

## Introduction

Este spec-filho executa a **Fase 3 — Correção e performance de backend** do roadmap mestre `auditoria-geral`. O objetivo é corrigir gargalos conhecidos (N+1 em `getProfileBySlug`, sorts em memória), classificar as 43 rotas com `export const dynamic = "force-dynamic"` quanto à estratégia de cache adequada e concluir a migração de `src/lib/queries.ts` para a camada de services em `src/lib/services/*.service.ts` com paridade comportamental garantida.

A fase tem **fase-1-seguranca** (`Done` em 2026-05-16T04:47:12Z, commit `cd6f36c`) e **fase-2-testes** (`Done` em 2026-05-16T04:46:53Z, commit `b5a8fe0`) como predecessoras no grafo (`PROMOCAO.md > §5`). Pode rodar em paralelo com `fase-4-design-system` (independente). Toca três `NextApiArea` (`cache-components`, `route-segment-config`, `server-actions`) e por isso a §4 deste documento (consultas a `node_modules/next/dist/docs/`) é obrigatória antes da primeira decisão técnica nessas áreas — regra dura E5 de `design.md > Error Handling` do master.

Os EARS herdados do `Requirement 4` do master spec definem o resultado esperado; novos requisitos abaixo destrincham as superfícies tocadas e adicionam EARS de detalhe verificáveis. Achados que extrapolarem o escopo voltam ao master via `OutOfScopeFinding` (§3).

---

## 1. Cabeçalho de proveniência

- **master_spec_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\requirements.md`
- **master_design_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\design.md`
- **phase_id**: `fase-3-backend`
- **phase_title**: Correção e performance de backend
- **promoted_at**: 2026-05-16
- **child_spec_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-3-backend\`
- **bridge_contract**: `design.md > Components and Interfaces > Child Spec Bridge`
- **agents_rule_areas**: `cache-components`, `route-segment-config`, `server-actions`
- **historical_refs**:
  - `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\_archive\backend-performance-phase5`

### Critérios de aceite herdados (EARS)

Os EARS abaixo foram copiados literalmente do `Requirement 4` do master spec. Eles definem o resultado esperado desta fase; novos requisitos podem **detalhar** as superfícies tocadas, mas não podem contradizer ou ampliar o escopo declarado aqui — o que extrapolar volta ao master via `OutOfScopeFinding` (§3).

- **Requirement 4.1** — `THE Phase_3_Spec SHALL identificar e corrigir N+1 em getProfileBySlug (paginação de mídia, batching de reviews/usuários).`
- **Requirement 4.2** — `THE Phase_3_Spec SHALL revisar as 43 rotas com force-dynamic e classificar cada uma como static, revalidate=N, dynamic justificado, ou candidata a Cache Components, exigindo consulta prévia a node_modules/next/dist/docs/ (AGENTS_Rule, área route-segment-config) antes de alterar a configuração de cada rota.`
- **Requirement 4.3** — `WHERE Cache Components forem aplicáveis, THE Phase_3_Spec SHALL exigir consulta prévia a node_modules/next/dist/docs/ (AGENTS_Rule, área cache-components) antes de adotar "use cache", cacheLife, cacheTag.`
- **Requirement 4.4** — `THE Phase_3_Spec SHALL mover ordenações em memória (ex.: getSectionProfiles) para ORDER BY no SQL/Prisma, mantendo a paridade de resultado validada por teste.`
- **Requirement 4.5** — `THE Phase_3_Spec SHALL considerar a migração de src/lib/queries.ts para src/lib/services/*.service.ts concluída somente quando todo conteúdo restante em queries.ts estiver migrado ou tiver justificativa explícita registrada (ambas condições obrigatórias); WHERE a migração tocar Server Actions, exigir consulta prévia a node_modules/next/dist/docs/ (AGENTS_Rule, área server-actions).`
- **Requirement 4.6** — `THE Phase_3_Spec SHALL incluir métricas de antes/depois para cada otimização aplicada — ao menos uma entre tempo de resposta médio (em desenvolvimento) ou número de queries por requisição é suficiente por otimização.`
- **Requirement 4.7** — `THE Phase_3_Spec SHALL declarar fora de escopo: troca de ORM, troca de banco, sharding e leitura de réplica.`

---

## 2. Revalidação

> Origem: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\_archive\backend-performance-phase5` (escopo `backend`, motiva também `fase-2-testes`). Cada Requirement do spec arquivado é classificado em `Confirmado` / `Resolvido` / `Reescopado` segundo `design.md > Components and Interfaces > Child Spec Bridge` do master, com evidência (path:linha ou commit) verificável contra o estado atual do código.

### 2.1 Requirement 1 — Otimização de Queries do Banco de Dados

- **Estado**: `Confirmado` (parcial: subitem 1.5 sobre índices é `Resolvido`).
- **Origem no spec arquivado**: `requirements.md > Requisito 1` (`_archive/backend-performance-phase5`).
- **evidence**: `src/lib/queries.ts:203-228` (`getProfileBySlug` puxa `media` sem paginação e `reviews` com `include user`); `src/lib/queries.ts:97-111` (`sortProfileCards` em memória); `src/lib/queries.ts:114-135` (`finalizeDiscoverOrder` em memória); `src/lib/queries.ts:304-348` (`getSectionProfiles` ordena array em JS); `src/lib/queries.ts:459-528` (`listStoriesForCity` agrupa em JS, sem `distinct`).
- **Subitens já resolvidos**: critério 1.5 (índices `[cityId, …]` em Profile e Subscription) — confirmado em `prisma/schema.prisma` conforme `design.md > Estado de partida` do master; **NÃO vira tarefa**.
- **Tarefa derivada**: cobrir EARs 4.1, 4.4 e itens 1.1, 1.2, 1.3, 1.4, 1.6 nas Waves 5 (N+1), 6 (sorts SQL) e 7 (migração `queries.ts` → services).

### 2.2 Requirement 2 — Estratégia de Cache e Revalidação

- **Estado**: `Reescopado`.
- **Origem no spec arquivado**: `requirements.md > Requisito 2`.
- **EARS original (mantido)**: `WHEN a página inicial (/) é renderizada, THE Sistema SHALL utilizar revalidate = 60 em vez de force-dynamic` e correlatos para `/descobrir/[citySlug]` (`revalidate = 300`), `/p/[slug]` (`revalidate = 120`), revalidação por tag em Server Actions, e header `Cache-Control` em `/api/profiles` e `/api/discover`.
- **Alvo atual**: o **modelo de cache mudou no Next 16**. `node_modules/next/dist/docs/01-app/02-guides/migrating-to-cache-components.md` declara que `dynamic`, `revalidate` e `fetchCache` (route segment config) **são removidos quando `cacheComponents: true`** e substituídos por `"use cache"` + `cacheLife` + `cacheTag`. As 43 rotas com `force-dynamic` permanecem como inventário; a classificação por estratégia segue, mas o vocabulário de saída passa a ser `static` / `revalidate=N` (modelo legado, ainda suportado sem Cache Components) **ou** `"use cache"` com `cacheLife` (Cache Components). Decisão por rota fica registrada em `metricas-baseline.md`.
- **evidence**: `src/app/page.tsx:11`, `src/app/descobrir/[citySlug]/page.tsx:16`, `src/app/p/[slug]/page.tsx:24`, `src/app/api/profiles/section/route.ts:5` (Route Handler) e demais 39 ocorrências (count total = 43, inventariado por `grep_search` em 2026-05-16).
- **Tarefa derivada**: cobrir EARs 4.2, 4.3 nas Waves 3 (Cache Components) e 4 (Route Segment Config), com decisão registrada em `metricas-baseline.md > Inventário de cache`.
- **Impacto no master spec**: nenhum. O master já reconhece em `requirements.md > Requirement 4 > Phase Card` que a classificação aceita `candidata a Cache Components`, sem fixar `revalidate=N`.

### 2.3 Requirement 3 — Validação de Entrada com Schemas Tipados

- **Estado**: `Resolvido`.
- **Origem no spec arquivado**: `requirements.md > Requisito 3`.
- **evidence**: entregue por **fase-1-seguranca > Requirement 4** (commit `a0ef4b5` aplicando Zod em 51 Server Actions + 19 Route Handlers); inventário canônico em `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-1-seguranca\endpoints-zod.md`; PBT idempotência em `src/lib/validation/validation.pbt.ts` (commit `cd923fe`).
- **Observação**: NÃO entra como tarefa nesta fase. Se algum endpoint surgir durante a migração `queries.ts` → services e ainda não estiver coberto por Zod, vira `OutOfScopeFinding` retornando para `fase-1-seguranca` (não absorção silenciosa).

### 2.4 Requirement 4 — Segurança e Autenticação

- **Estado**: `Resolvido`.
- **Origem no spec arquivado**: `requirements.md > Requisito 4`.
- **evidence**: rate limit em `src/lib/rate-limit.ts` + `src/lib/rate-limit-config.ts` aplicado a login/upload/wa-click/comentários/story-view; auth guards em Server Actions admin/moderator; `src/lib/security/dev-auth.ts` e `src/lib/security/cron-auth.ts`. Tudo coberto em `fase-1-seguranca > Requirements 1, 2, 5` (commits `a0ef4b5`, `54a4858`, `8504c1f`).
- **Observação**: NÃO entra como tarefa nesta fase.

### 2.5 Requirement 5 — Separação de Responsabilidades e Camada de Serviços

- **Estado**: `Confirmado`.
- **Origem no spec arquivado**: `requirements.md > Requisito 5`.
- **evidence**: `src/lib/services/` contém apenas 4 services (`subscription`, `profile`, `city`, `media` — listagem em `src/lib/services/index.ts:10-13`); `src/lib/queries.ts` ainda exporta 25+ funções (15 ainda não migradas: `getPlatformStats`, `sortProfileCards`, `finalizeDiscoverOrder`, `listProfilesForCity`, `searchProfilesGlobal`, `getPremiumWeekProfiles`, `getHotProfiles`, `getBoostedProfiles`, `getSectionProfiles`, `getHotPeriodStart`, `listWhatsAppClicksRecent`, `countWhatsAppClicksToday`, `getStoriesForProfile`, `listStoriesForCity`, `listFinancialRecordsForMonth`, `listReels`, `listMediaWithCounts`, `listMediaComments`, `listModerationQueue`, e tipos `ProfileCardPayload`/`ProfileSort`).
- **Subitens já parcialmente resolvidos**: a estrutura inicial dos 4 services já existe (`design.md > Estado de partida` do master) — a **criação da estrutura** NÃO vira tarefa; o trabalho desta fase é **concluir** a migração (EAR 4.5).
- **Tarefa derivada**: cobrir EAR 4.5 na Wave 7, com subtask por service alvo (`stats`, `discover`, `whatsapp-click`, `story`, `financial`, `reels`, `moderation`).

### 2.6 Requirement 6 — Tipagem TypeScript Estrita

- **Estado**: `Reescopado`.
- **Origem no spec arquivado**: `requirements.md > Requisito 6`.
- **EARS original (mantido)**: `THE Sistema SHALL configurar strict: true … noImplicitAny … eliminar todos os usos de any explícito em src/`.
- **Alvo atual**: contagem de `any` em `src/` e plano numérico de redução cabem em `fase-7-dx-infra > Requirement 8.5` (`WHERE houver mais de 5 ocorrências de any em src/, THE Phase_7_Spec SHALL planejar redução com meta numérica medida antes/depois`). Nesta fase, apenas as assinaturas dos services migrados (Wave 7) terão tipos explícitos sem `any`.
- **evidence**: `src/lib/queries.ts` tem retornos inferidos via Prisma (sem `any` explícito declarado); `tsconfig.json:strict=true` já está ativo. Plano de redução de `any` no app inteiro é da fase-7.
- **Impacto no master spec**: nenhum.

### 2.7 Requirement 7 — Performance do Frontend (Lazy Loading e Code Splitting)

- **Estado**: `Reescopado`.
- **Origem no spec arquivado**: `requirements.md > Requisito 7`.
- **EARS original (mantido)**: `next/dynamic` com `ssr: false` em `MediaGallery`, `ReelsFeed`, `StoryBar`; First Load JS < 150KB; etc.
- **Alvo atual**: lazy loading e code splitting em componentes pesados (`media-gallery.tsx` ~23KB, `reels-feed.tsx` ~15KB, `story-bar.tsx` ~14KB, `media-manager.tsx` ~13KB) é tarefa de **fase-5-ux** (UX premium / loading states) ou **fase-4-design-system** (consolidação de componentes duplicados — `media-gallery` vs `midias-manager`). Não é backend.
- **evidence**: tamanhos listados em `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\requirements.md > Observações da varrida inicial > DX / Infra` (componentes grandes pendentes).
- **Impacto no master spec**: nenhum (já mapeado para fase-5/fase-4).

### 2.8 Requirement 8 — Performance do Frontend (Memoização e Re-renders)

- **Estado**: `Reescopado`.
- **Origem no spec arquivado**: `requirements.md > Requisito 8`.
- **EARS original (mantido)**: `React.memo` em cards, `useCallback`, `useMemo`, virtual scroll em reels, `loading="lazy"`, evitar prop drilling > 3 níveis.
- **Alvo atual**: otimizações de re-render e virtual scroll cabem em **fase-5-ux > Requirement 6** (UI otimista, microinterações, `prefers-reduced-motion`). Não é backend.
- **Impacto no master spec**: nenhum.

### 2.9 Requirement 9 — Suspense e Streaming

- **Estado**: `Reescopado`.
- **Origem no spec arquivado**: `requirements.md > Requisito 9`.
- **EARS original (mantido)**: `<Suspense>` em seções da home, hero da página de perfil, stories vs perfis em `/descobrir`, skeletons específicos.
- **Alvo atual**: `<Suspense>` boundaries e skeletons cabem em **fase-5-ux > Requirements 1, 2** (inventário de `loading.tsx`/`error.tsx` em ~78 rotas e EmptyState reutilizável). Não é backend.
- **Impacto no master spec**: nenhum.

### 2.10 Requirement 10 — Otimização de Data Fetching

- **Estado**: `Confirmado` (parcial).
- **Origem no spec arquivado**: `requirements.md > Requisito 10`.
- **evidence**: `src/lib/queries.ts:203-228` (`getProfileBySlug` busca `media` e `reviews` em uma única query via `include`, sem `Promise.all`); `src/app/api/profiles/section/route.ts:8-19` (cursor pagination ausente — usa offset via `getSectionProfiles`); ausência de `React.cache()` em qualquer função de `src/lib/queries.ts`.
- **Subitens nesta fase**: 10.1 (`React.cache()` para deduplicar), 10.2 (`Promise.all` em queries paralelas em `/p/[slug]`), 10.4 (cursor-based pagination para mídia em `getProfileBySlug`), 10.6 (N+1 — `select` explícito), 10.7 (limite máximo de 60 registros por página).
- **Subitens fora de escopo desta fase**: 10.3 (`Promise.allSettled` resiliente a falha parcial — mais ligado a UX/Suspense, vai para fase-5).
- **Tarefa derivada**: cobrir EARs 4.1 e 4.6 nas Waves 5 (N+1 + paginação cursor-based em mídia) e 7 (limites máximos por service).

### 2.11 Requirement 11 — Otimização de Bundle e Assets

- **Estado**: `Reescopado`.
- **Origem no spec arquivado**: `requirements.md > Requisito 11`.
- **EARS original (mantido)**: `next/image` com WebP/AVIF e `sizes`; blur placeholders; ícones lucide-react importados individualmente; `optimizePackageImports`; `next/font` com `display: swap`.
- **Alvo atual**: otimização de assets cabe em **fase-5-ux** (UX premium) e **fase-4-design-system** (lucide-react / tokens / fontes); LCP ≤ 4s em 3G é critério de fase-5. Não é backend.
- **Impacto no master spec**: nenhum.

### 2.12 Requirement 12 — SEO e Core Web Vitals

- **Estado**: `Reescopado`.
- **Origem no spec arquivado**: `requirements.md > Requisito 12`.
- **EARS original (mantido)**: metadata dinâmica, sitemap, LCP < 2.5s, CLS < 0.1, INP < 200ms, JSON-LD.
- **Alvo atual**: cabe em **fase-5-ux** (Core Web Vitals em rotas tocadas) e potencialmente em fase-7 (sitemap como deliverable de DX). Não é backend puro.
- **Impacto no master spec**: nenhum.

### 2.13 Requirement 13 — Eliminação de Código Redundante e Memory Leaks

- **Estado**: `Confirmado` (apenas o subitem 13.1 — eliminação da duplicação `queries.ts` ↔ `services/*`).
- **Origem no spec arquivado**: `requirements.md > Requisito 13`.
- **evidence**: `src/lib/services/index.ts:10-13` re-exporta 4 services, mas `src/lib/queries.ts` ainda contém as 4 funções equivalentes (ex.: `getProfileBySlug` aparece em `src/lib/queries.ts:203` E em `src/lib/services/profile.service.ts:7`); consumidores em `src/app/em-destaque/page.tsx:7`, `src/app/em-alta/page.tsx:7`, `src/app/cidades/page.tsx:5`, `src/app/api/profiles/section/route.ts:2` ainda importam de `@/lib/queries`.
- **Subitens fora de escopo desta fase**: 13.2 a 13.7 (cleanup de `setInterval`/`useEffect`, `AbortController`, `no-unused-imports`, `ProviderHeartbeat` cleanup, consolidação de `fmtDate`) — esses cabem em **fase-5-ux** (UX/microinterações) e **fase-7-dx-infra** (lint, ESLint rules). Vai para fase-7 via `EAR 8.4` (`eliminar duplicação queries.ts ↔ services/*`) que coordena com esta.
- **Tarefa derivada**: cobrir EAR 4.5 (subitem 13.1) na Wave 7, garantindo que os consumidores migrem para `@/lib/services` e `queries.ts` fique vazio ou apenas com re-exports.

### 2.14 Requirement 14 — Performance Mobile

- **Estado**: `Reescopado`.
- **Origem no spec arquivado**: `requirements.md > Requisito 14`.
- **EARS original (mantido)**: `touch-action: manipulation`, prefetch, TTI < 3.5s em 4G simulada, `will-change` + `transform`.
- **Alvo atual**: cabe em **fase-6-mobile-cross-browser > Requirements 1-3, 6** (matriz de browsers, alvo de toque, gestos). Não é backend.
- **Impacto no master spec**: nenhum.

### 2.15 Requirement 15 — Documentação de Melhorias e Métricas

- **Estado**: `Confirmado` (parcial: subitem 15.2 — métricas antes/depois entram nesta fase via EAR 4.6; subitens 15.3, 15.5 — bundle report e ADRs — ficam em fase-7).
- **Origem no spec arquivado**: `requirements.md > Requisito 15`.
- **evidence**: nenhuma medição antes/depois existe hoje. Métricas serão capturadas via `prisma.$on('query')` + `console.time()` em desenvolvimento por otimização aplicada.
- **Subitens fora de escopo desta fase**: 15.3 (`next build` com análise de bundle), 15.5 (ADR como artefato), 15.6 (thresholds de Core Web Vitals) — vão para **fase-7-dx-infra** (`Requirements 6, 7`) e **fase-5-ux**.
- **Tarefa derivada**: cobrir EAR 4.6 nas Waves 8 (métricas antes/depois consolidadas em `metricas-baseline.md`).

---

## 3. Achados fora de escopo

> Nenhum achado fora de escopo registrado nesta fase.

Cada novo achado relevante que extrapolar o escopo desta fase será registrado como uma linha desta tabela (schema `OutOfScopeFinding` de `design.md > Data Models` do master) e disparará commit no master spec, **nunca** absorção silenciosa pelo spec-filho (regra dura E4 de `design.md > Error Handling`).

| discoveredIn | description | proposedTarget | evidence |
|---|---|---|---|
| _(vazio até a primeira descoberta)_ | | | |

---

## 4. Consultas a `node_modules/next/dist/docs/` (AGENTS_Rule)

Esta seção é OBRIGATÓRIA antes da primeira decisão técnica que toque uma `NextApiArea` deste Phase Card (`cache-components`, `route-segment-config`, `server-actions`). Cada linha registra a evidência da consulta, conforme exigido pela regra dura E5 de `design.md > Error Handling` do master e por `AGENTS.md`. Esta versão do Next.js (16.x) tem breaking changes em relação a conhecimento prévio — sem evidência registrada, qualquer decisão sobre essas áreas é bloqueada pelo revisor.

| area | path_consultado | trecho_relevante | decisao |
|---|---|---|---|
| `cache-components` | `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-cache.md` + `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/cacheComponents.md` + `node_modules/next/dist/docs/01-app/02-guides/migrating-to-cache-components.md` | `"use cache"` é Cache Components feature: requer `cacheComponents: true` em `next.config.ts`. Cache key inclui Build ID, Function ID, args serializáveis e closure vars. `cacheLife` e `cacheTag` complementam. Habilitar `cacheComponents` ativa também `<Activity>` que preserva estado entre navegações. | **Avaliar adoção rota a rota** durante a Wave 3 com decisão registrada em `metricas-baseline.md`. Ativação de `cacheComponents: true` exige análise prévia de impacto em `<Activity>` e remoção dos route segment configs `dynamic`/`revalidate`/`fetchCache` em todas as rotas. _(consulta em 2026-05-16)_ |
| `route-segment-config` | `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/index.md` + `.../dynamicParams.md` + `.../runtime.md` | Apenas 4 opções restam em v16.0.0: `dynamicParams`, `runtime`, `preferredRegion`, `maxDuration`. **`dynamic`, `dynamicParams`, `revalidate` e `fetchCache` são removidos quando `cacheComponents` está habilitado** (v16.0.0). `runtime: 'edge'` é incompatível com Cache Components. `experimental_ppr` removido (codemod disponível). | **Classificar caso a caso** as 43 rotas com `force-dynamic`. Se `cacheComponents` não for adotado nesta fase, `revalidate=N` em segundos continua válido. Se for adotado, migrar para `"use cache"` + `cacheLife`. Decisão por rota fica em `metricas-baseline.md > Inventário de cache`. _(consulta em 2026-05-16)_ |
| `server-actions` | `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-server.md` | `'use server'` no topo do arquivo marca **todas as funções exportadas** como server-side. Server Actions importadas em Client Components ficam em arquivo dedicado com `'use server'` no topo. Funções com `'use server'` precisam ser async. | **Manter padrão atual** (`src/app/_actions/**` e `src/app/painel/_actions/**` já com `'use server'`). Migrações para services não devem mover Server Actions; elas continuam delegando para services em `src/lib/services/`. Imports em Client Components seguem inalterados. _(consulta em 2026-05-16)_ |

> Atualizações posteriores (mudança de versão menor, contradição encontrada na prática) viram linhas adicionais. Não se sobrescreve linha existente.

---

## Glossary

- **Phase_3_Spec**: este documento e os artefatos produzidos sob `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-3-backend\`.
- **Force_Dynamic_Routes**: as **43 rotas** atualmente declaradas com `export const dynamic = "force-dynamic"` em `src/app/**/*.{ts,tsx}` (count confirmado por `grep_search` em 2026-05-16). A lista canônica fica em `metricas-baseline.md > Inventário de cache`.
- **Service_Layer_Migration**: processo de mover lógica de `src/lib/queries.ts` para `src/lib/services/*.service.ts`, com cada export migrado **ou** justificado. Considera-se concluído quando `queries.ts` ficar vazio, com apenas re-exports temporários, ou com itens explicitamente justificados em comentário.
- **Cache_Strategy_Class**: classificação de cada rota em `static`, `revalidate=N`, `dynamic justificado`, ou `cache-components` (com `"use cache"` + `cacheLife` + opcionalmente `cacheTag`). Vocabulário definido pelo Next 16 conforme docs consultadas em §4.
- **N_Plus_One_Targets**: queries Prisma que sofrem N+1, atualmente identificadas em `getProfileBySlug` (`src/lib/queries.ts:203`) — paginação de mídia ausente, batching de reviews/usuários inexistente. A lista é estendida durante a Wave 5 conforme novas ocorrências forem descobertas.
- **Sort_In_Memory_Targets**: funções com ordenação em arrays JS, atualmente: `sortProfileCards` (`queries.ts:97`), `finalizeDiscoverOrder` (`queries.ts:114`), `getSectionProfiles` (`queries.ts:304`), `listStoriesForCity` (`queries.ts:459`).
- **Metrics_Baseline**: documento canônico `metricas-baseline.md` no diretório do spec-filho, com: (a) inventário das 43 rotas com classificação inicial (`Cache_Strategy_Class`), (b) métricas antes/depois de cada otimização aplicada (tempo médio em dev OU número de queries por requisição). Fonte de verdade para EARs 4.2 e 4.6.
- **NextApiArea**: vocabulário definido em `design.md > Data Models > NextApiArea` do master. Para esta fase: `cache-components`, `route-segment-config`, `server-actions`.

---

## 6. Non-Goals / Out of Scope

Os itens abaixo NÃO fazem parte desta fase e não devem virar tarefa:

1. Troca de ORM (Prisma → outro). _(EAR 4.7 herdado)_
2. Troca de banco de dados (PostgreSQL → outro). _(EAR 4.7 herdado)_
3. Sharding ou particionamento horizontal. _(EAR 4.7 herdado)_
4. Leitura de réplica (read replicas). _(EAR 4.7 herdado)_
5. **Mudanças no schema Prisma** (`prisma/schema.prisma`) sem justificativa explícita registrada como `OutOfScopeFinding` (§3) e commit no master. Novos índices, novas colunas e novas tabelas estão fora salvo se forem **consequência direta** de uma otimização desta fase (ver `auditoria-geral/requirements.md > Non-Goals item 3`).
6. Lazy loading e code splitting de componentes pesados (`media-gallery`, `reels-feed`, `story-bar`, `media-manager`) — vão para `fase-5-ux` ou `fase-4-design-system`.
7. Memoização (`React.memo`/`useCallback`/`useMemo`) e virtual scroll — vão para `fase-5-ux`.
8. `<Suspense>` boundaries, skeletons específicos e streaming — vão para `fase-5-ux`.
9. Otimização de imagens (`next/image` sizes, blur placeholders, AVIF/WebP) — vão para `fase-5-ux` ou `fase-4-design-system`.
10. SEO, sitemap, JSON-LD e Core Web Vitals (LCP/CLS/INP) — vão para `fase-5-ux`.
11. Cleanup de `useEffect`, `AbortController`, `setInterval`/`setTimeout` (memory leaks) — vão para `fase-5-ux` (componentes) e `fase-7-dx-infra` (lint).
12. Performance mobile (touch-action, prefetch, virtual keyboard) — vai para `fase-6-mobile-cross-browser`.
13. CI / pipeline / lint anti-regressão — vai para `fase-7-dx-infra`.
14. Plano de redução de `any` no `src/` inteiro — vai para `fase-7-dx-infra > EAR 8.5`.
15. Implementação dos testes correspondentes às mudanças desta fase **além** das Properties listadas no design — testes amplos consomem a infraestrutura de `fase-2-testes` (já `Done`); apenas paridade pre/post migration entra como gate aqui.

Qualquer item que apareça nesta lista mas se mostre necessário durante a execução vira `OutOfScopeFinding` (§3) e exige commit no master spec antes de ser absorvido.

---

## Requirements

> Os requisitos abaixo são os EARS herdados (Requirement 4.1–4.7 do master) **destrinchados** por superfície tocada. Cada bloco identifica os arquivos envolvidos, mantém o EARS herdado como referência e adiciona EARS de detalhe que serão validados pelo spec-filho.

### Requirement 1: Correção de N+1 em `getProfileBySlug`

**User Story:** Como visitante de `/p/[slug]`, quero a página carregar com tempo previsível mesmo em perfis com muita mídia, para não esperar segundos para ver o conteúdo.

**Inputs:** `src/lib/queries.ts:203-228` (atual `getProfileBySlug`); `src/lib/services/profile.service.ts:7-34` (já migrado parcialmente, sem paginação); `src/app/p/[slug]/page.tsx:24-…` (consumidor); componentes `MediaGallery` e `ReviewList` que consomem o retorno.

#### Acceptance Criteria

1. THE Phase_3_Spec SHALL identificar e corrigir N+1 em `getProfileBySlug` (paginação de mídia, batching de reviews/usuários). _(EARS herdada — Requirement 4.1 do master.)_
2. WHEN `getProfileBySlug` é chamada, THE Phase_3_Spec SHALL retornar **no máximo 12 itens de mídia pública** ordenados por `sortOrder` ascendente (na fase-1 estava `createdAt desc` — ajuste registrado), e SHALL aceitar parâmetro `mediaCursor` (opcional) para paginação **cursor-based** sobre o `id` ou `(sortOrder, id)` do último item retornado.
3. WHEN `getProfileBySlug` é chamada, THE Phase_3_Spec SHALL evitar N+1 em `reviews` usando `select` explícito limitando a no máximo **10 campos por relação aninhada** (city, district, media, user). Reviews continuam com `take: 12`.
4. IF o parâmetro `mediaCursor` fornecido for inválido (formato incorreto ou aponta para item inexistente), THEN THE Phase_3_Spec SHALL tratar como ausência de cursor e retornar a primeira página.
5. THE Phase_3_Spec SHALL anexar métricas antes/depois desta otimização em `metricas-baseline.md`, contendo ao menos uma entre: (a) número de queries Prisma por request medido via `prisma.$on('query')`, OU (b) tempo médio em desenvolvimento medido via `console.time()` em 5 chamadas com perfis distintos.

### Requirement 2: Classificação das 43 rotas com `force-dynamic`

**User Story:** Como mantenedor, quero saber, rota a rota, qual estratégia de cache aplicar, para não pagar custo de execução dinâmica em conteúdo que não muda a cada request.

**Inputs:** as **43 rotas** confirmadas em `src/app/**/*.{ts,tsx}` (count via `grep_search` em 2026-05-16); `next.config.ts` quando aplicável a `cacheComponents`; `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/`.

#### Acceptance Criteria

1. THE Phase_3_Spec SHALL revisar as 43 rotas com `force-dynamic` e classificar cada uma como `static`, `revalidate=N`, `dynamic justificado`, ou candidata a Cache Components, exigindo consulta prévia a `node_modules/next/dist/docs/` (AGENTS_Rule, área `route-segment-config`) antes de alterar a configuração de cada rota. _(EARS herdada — Requirement 4.2 do master.)_
2. THE Phase_3_Spec SHALL produzir, em `metricas-baseline.md > Inventário de cache`, uma tabela com 43 linhas onde cada linha contém: (a) caminho da rota (ex.: `src/app/p/[slug]/page.tsx`), (b) `Cache_Strategy_Class` decidida, (c) justificativa em ≤ 30 palavras, (d) referência ao trecho consultado em `node_modules/next/dist/docs/...` quando a decisão for `cache-components` ou `revalidate=N`.
3. WHERE a classificação de uma rota mudar do estado atual (`force-dynamic`) para `static`, `revalidate=N` ou `cache-components`, THE Phase_3_Spec SHALL aplicar a mudança em commit dedicado (uma rota ou wave de rotas correlatas por commit) com link para a linha correspondente em `metricas-baseline.md`.
4. WHERE uma rota permanecer como `dynamic justificado`, THE Phase_3_Spec SHALL adicionar comentário em código apontando para a linha da `metricas-baseline.md` que registra a justificativa.
5. IF a decisão técnica de adotar `cacheComponents: true` em `next.config.ts` for tomada, THEN THE Phase_3_Spec SHALL registrá-la como decisão arquitetural em `metricas-baseline.md > Decisões` com lista de impactos colaterais (`<Activity>` durante navegação, remoção dos 4 route segment configs removidos em v16.0.0) e SHALL marcar a janela de validação prévia (mínimo 7 dias em homologação) antes de promover para produção.

### Requirement 3: Adoção condicional de Cache Components

**User Story:** Como mantenedor, quero que `"use cache"` seja adotado apenas onde traz ganho mensurável, para não pagar custo de manutenção sem retorno.

**Inputs:** `next.config.ts` (potencial `cacheComponents: true`); rotas e funções identificadas como candidatas no Requirement 2; `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-cache.md` + `cacheComponents.md` + `migrating-to-cache-components.md`.

#### Acceptance Criteria

1. WHERE Cache Components forem aplicáveis, THE Phase_3_Spec SHALL exigir consulta prévia a `node_modules/next/dist/docs/` (AGENTS_Rule, área `cache-components`) antes de adotar `"use cache"`, `cacheLife`, `cacheTag`. _(EARS herdada — Requirement 4.3 do master.)_
2. WHEN `"use cache"` é adicionado a uma função/componente, THE Phase_3_Spec SHALL declarar `cacheLife` explicitamente (default ou perfil customizado) E `cacheTag` quando a função for invalidável por evento (ex.: edição de perfil dispara `revalidateTag('profile:<slug>')`).
3. WHERE `cacheTag` for usado, THE Phase_3_Spec SHALL atualizar a Server Action correspondente para chamar `revalidateTag` (ou `revalidatePath` quando o cache for por rota), com a área `server-actions` da AGENTS_Rule já consultada.
4. THE Phase_3_Spec SHALL anexar métricas antes/depois para cada função/componente coberto por `"use cache"`, conforme o critério 1.5 do Requirement 1 (queries por request OU tempo médio em dev).

### Requirement 4: Sorts em memória movidos para SQL/Prisma

**User Story:** Como engenheiro de plataforma, quero que ordenações ocorram no banco, para que o trabalho não escale com o tamanho do array trazido para a aplicação.

**Inputs:** `src/lib/queries.ts:97-111` (`sortProfileCards`); `src/lib/queries.ts:114-135` (`finalizeDiscoverOrder`); `src/lib/queries.ts:304-348` (`getSectionProfiles`); `src/lib/queries.ts:459-528` (`listStoriesForCity` — agrupa em JS); consumidores em `src/app/em-destaque/page.tsx:7`, `src/app/em-alta/page.tsx:7`, `src/app/api/profiles/section/route.ts:2`.

#### Acceptance Criteria

1. THE Phase_3_Spec SHALL mover ordenações em memória (ex.: `getSectionProfiles`) para `ORDER BY` no SQL/Prisma, mantendo a paridade de resultado validada por teste. _(EARS herdada — Requirement 4.4 do master.)_
2. WHEN `getSectionProfiles` ou `listProfilesForCity` é chamada, THE Phase_3_Spec SHALL retornar resultado **idêntico em ordem** ao retorno atual (com `sortProfileCards` + `finalizeDiscoverOrder` em memória), validado por teste de paridade pre/post migration consumido da infraestrutura de `fase-2-testes`.
3. WHEN `listStoriesForCity` é chamada, THE Phase_3_Spec SHALL usar `distinct` ou subquery no Prisma para obter perfis com stories ativas, em vez de buscar todas as stories e agrupar com `Map` em JavaScript.
4. THE Phase_3_Spec SHALL adicionar **comentário** em cada função migrada apontando para o teste de paridade que valida a invariante (`*.test.ts` ou `*.pbt.ts` co-localizado em `src/lib/services/`).
5. THE Phase_3_Spec SHALL anexar métricas antes/depois em `metricas-baseline.md` para cada função migrada (mínimo: queries por request OU tempo médio em dev).

### Requirement 5: Migração de `queries.ts` para a camada de services

**User Story:** Como mantenedor, quero a lógica de domínio em `src/lib/services/`, para que `queries.ts` deixe de ser um "saco de funções" e cada domínio tenha seu próprio módulo testável.

**Inputs:** `src/lib/queries.ts` (29 exports atuais, dos quais 11 já têm equivalentes em services e 18 precisam de decisão); `src/lib/services/{subscription,profile,city,media}.service.ts` (já existem); consumidores que ainda importam `@/lib/queries` (4+ arquivos confirmados via `grep_search`).

#### Acceptance Criteria

1. THE Phase_3_Spec SHALL considerar a migração de `src/lib/queries.ts` para `src/lib/services/*.service.ts` concluída somente quando todo conteúdo restante em `queries.ts` estiver migrado ou tiver justificativa explícita registrada (ambas condições obrigatórias); WHERE a migração tocar Server Actions, exigir consulta prévia a `node_modules/next/dist/docs/` (AGENTS_Rule, área `server-actions`). _(EARS herdada — Requirement 4.5 do master.)_
2. THE Phase_3_Spec SHALL produzir os seguintes services novos durante a Wave 7, cada um com tipos exportados e API mínima:
   - `stats.service.ts` (encapsula `getPlatformStats`, `getHotPeriodStart`).
   - `discover.service.ts` (encapsula `listProfilesForCity`, `searchProfilesGlobal`, `getPremiumWeekProfiles`, `getHotProfiles`, `getBoostedProfiles`, `getSectionProfiles`, e a lógica de `sortProfileCards` + `finalizeDiscoverOrder` como funções internas, agora delegando para `ORDER BY`).
   - `whatsapp-click.service.ts` (encapsula `listWhatsAppClicksRecent`, `countWhatsAppClicksToday`).
   - `story.service.ts` (encapsula `getStoriesForProfile`, `listStoriesForCity`).
   - `financial.service.ts` (encapsula `listFinancialRecordsForMonth`).
   - `reels.service.ts` (encapsula `listReels`).
   - `moderation.service.ts` (encapsula `listModerationQueue`).
   - `media.service.ts` (recebe `listMediaWithCounts`, `listMediaComments` se ainda não estão lá).
3. WHEN um export é migrado de `queries.ts` para um service, THE Phase_3_Spec SHALL atualizar **todos** os consumidores em `src/app/**` e `src/components/**` para importar de `@/lib/services` em vez de `@/lib/queries`, em commit por wave; consumidores que continuarem importando de `@/lib/queries` para uma função já migrada **falham na revisão**.
4. WHEN a migração estiver concluída, THE Phase_3_Spec SHALL deixar `src/lib/queries.ts` em um dos dois estados aceitáveis: (a) **vazio** ou contendo apenas re-exports de `@/lib/services` (compatibilidade temporária com janela declarada de no mínimo 14 dias após o commit que conclui a migração), OU (b) contendo apenas funções **explicitamente justificadas** em comentário inline com motivo + link para issue/PR.
5. WHERE a migração tocar Server Actions (qualquer arquivo em `src/app/_actions/**` ou `src/app/painel/_actions/**`), THE Phase_3_Spec SHALL preservar a diretiva `'use server'` e SHALL garantir que as Server Actions delegam para services em vez de acessar `prisma` diretamente.
6. THE Phase_3_Spec SHALL anexar métricas antes/depois para cada service novo que mude o número de queries por request (regression check: paridade ou melhora). Service que apenas reorganiza código sem mudar comportamento dispensa métrica.

### Requirement 6: Métricas antes/depois por otimização

**User Story:** Como mantenedor, quero saber se cada mudança realmente melhorou ou só moveu lixo de canto, para que a fase entregue valor mensurável.

**Inputs:** `metricas-baseline.md` (documento canônico desta fase); `prisma.$on('query')` para contagem de queries; `console.time()` para tempo em desenvolvimento.

#### Acceptance Criteria

1. THE Phase_3_Spec SHALL incluir métricas de antes/depois para cada otimização aplicada — ao menos uma entre tempo de resposta médio (em desenvolvimento) ou número de queries por requisição é suficiente por otimização. _(EARS herdada — Requirement 4.6 do master.)_
2. THE Phase_3_Spec SHALL produzir e manter `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-3-backend\metricas-baseline.md` com pelo menos as seguintes seções: (a) Inventário de cache (43 linhas), (b) Métricas antes/depois (uma linha por otimização aplicada), (c) Decisões (ex.: `cacheComponents: true`, perfis de `cacheLife`).
3. WHEN uma otimização é aplicada, THE Phase_3_Spec SHALL registrar em `metricas-baseline.md > Métricas antes/depois`: (a) caminho do arquivo modificado, (b) métrica `antes` (valor + método de medição), (c) métrica `depois` (valor + método), (d) link para o commit que entregou a otimização.
4. THE Phase_3_Spec SHALL definir, em comentário no topo de `metricas-baseline.md`, a metodologia mínima aceita para medição: (a) ambiente local em modo `npm run dev` com banco de seeds; (b) 5 medições com mediana descartando p10/p90, OU 3 medições consecutivas com desvio menor que 20% do valor mediano; (c) Prisma logging via `prisma.$on('query')` para count de queries.

### Requirement 7: Paridade comportamental garantida

**User Story:** Como usuário, quero que mudanças de performance não mudem o que vejo na tela, para que ranking, paginação e ordem permaneçam estáveis.

**Inputs:** Properties 1, 2, 3 declaradas em `design.md > Correctness Properties` desta fase; infraestrutura de testes vinda de `fase-2-testes`.

#### Acceptance Criteria

1. THE Phase_3_Spec SHALL entregar testes co-localizados (`*.test.ts` e `*.pbt.ts` quando aplicável) para cada service novo da Wave 7, validando paridade pre/post migration via fixture compartilhada (snapshot do retorno do export antigo em `queries.ts` vs retorno do export novo em `services/`).
2. WHEN um teste de paridade falha localmente, THE Phase_3_Spec SHALL NÃO promover o commit que migra a função; em vez disso, registrar o contraexemplo (`fc.sample` ou snapshot textual) como `OutOfScopeFinding` apontando para `fase-3-backend` e abrir investigação.
3. THE Phase_3_Spec SHALL implementar pelo menos as Properties 1, 2 e 3 de `design.md > Correctness Properties` desta fase como `*.pbt.ts` rodando com a configuração padrão de `fase-2-testes` (`numRuns: 100`, `verbose: 2`).

### Requirement 8: Itens fora de escopo declarados

**User Story:** Como mantenedor, quero que itens fora de escopo apareçam explicitamente, para que ninguém os absorva por engano.

#### Acceptance Criteria

1. THE Phase_3_Spec SHALL declarar fora de escopo: troca de ORM, troca de banco, sharding e leitura de réplica. _(EARS herdada — Requirement 4.7 do master.)_
2. THE Phase_3_Spec SHALL declarar fora de escopo: mudanças no `prisma/schema.prisma` que não sejam consequência direta de uma otimização desta fase, conforme `auditoria-geral/requirements.md > Non-Goals item 3`.
3. WHEN um item da seção "Non-Goals" deste documento aparecer durante a execução, THE Phase_3_Spec SHALL registrá-lo como `OutOfScopeFinding` na §3 deste documento e abrir commit no master spec antes de qualquer absorção.

---

## Saída desta fase

A Fase 3 é considerada `Done` quando:

- Todos os 8 Requirements desta seção têm seus EARS verificáveis e há evidência (path:linha de código, log de teste, ou link de PR) anexada para cada um.
- A §4 deste documento (AGENTS_Rule) tem linha preenchida para cada `NextApiArea` declarada (`cache-components`, `route-segment-config`, `server-actions`) **antes** da primeira decisão técnica que toque essa área.
- A §3 deste documento (`OutOfScopeFinding`) tem cada linha referenciando um commit no master spec, ou está marcada como vazia.
- `metricas-baseline.md` existe com (a) inventário das 43 rotas classificadas, (b) métricas antes/depois para cada otimização aplicada, (c) decisões registradas (ex.: `cacheComponents: true` ou não).
- `src/lib/queries.ts` está em um dos dois estados aceitáveis (vazio/re-exports OU funções justificadas inline).
- Properties 1, 2, 3 de `design.md > Correctness Properties` rodam verde via `npm run test`.
- O Phase Card desta fase no master `requirements.md` foi atualizado para `state: Done` com `doneAt` ISO-8601 e link para esta pasta.
