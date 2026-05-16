# Design Document — `fase-3-backend`

> Spec-filho promovido a partir do master `auditoria-geral`. Este documento detalha como **corrigir gargalos conhecidos** (N+1 em `getProfileBySlug`, sorts em memória), **classificar as 43 rotas** com `force-dynamic`, e **concluir a migração** de `src/lib/queries.ts` para a camada de services em `src/lib/services/*.service.ts`. A execução das tarefas deste design vive em `tasks.md` (a ser produzido depois).

## Overview

A Fase 3 fecha gargalos mensuráveis e padroniza a estratégia de cache. A síntese vinda do master:

- **`getProfileBySlug` (`src/lib/queries.ts:203-228`)**: hoje puxa `media` sem paginação, ordenando por `createdAt desc`, com risco real de retornar centenas de itens em perfis ativos. `reviews` vem com `include: { user: { select: { id, name, slug } } }` (não há N+1 puro, mas a relação carrega payload sem `select` em outras pontas).
- **Sorts em memória**: `sortProfileCards` (`queries.ts:97`), `finalizeDiscoverOrder` (`queries.ts:114`), `getSectionProfiles` (`queries.ts:304`) e `listStoriesForCity` (`queries.ts:459`) ordenam ou agrupam arrays em JS após o `findMany`. O custo escala com o tamanho do array trazido.
- **43 rotas com `force-dynamic`**: contagem confirmada por `grep_search` em 2026-05-16 (`src/app/**/*.{ts,tsx}`). A maioria é página em App Router; um Route Handler também (`/api/profiles/section/route.ts`).
- **Camada de services parcial**: `src/lib/services/` tem 4 services (`subscription`, `profile`, `city`, `media`). `src/lib/queries.ts` ainda exporta 25+ funções, das quais 11 já têm equivalentes em services e 18 precisam de decisão (migrar OU justificar).
- **Sem métricas baseline**: nenhuma medição antes/depois existe hoje. Métricas serão capturadas via `prisma.$on('query')` + `console.time()` em desenvolvimento por otimização aplicada.
- **AGENTS_Rule**: três áreas afetadas (`cache-components`, `route-segment-config`, `server-actions`). Consultas registradas em `requirements.md > §4`.

A fase entrega:

1. `getProfileBySlug` com paginação cursor-based de mídia (≤ 12 itens) e `select` explícito em `reviews` (≤ 10 campos por relação).
2. Inventário das 43 rotas em `metricas-baseline.md`, cada uma classificada em `static`, `revalidate=N`, `dynamic justificado`, ou `cache-components`.
3. `"use cache"` + `cacheLife` + `cacheTag` aplicado caso a caso onde traz ganho mensurável; `cacheComponents: true` em `next.config.ts` apenas se a análise prévia aprovar.
4. Sorts movidos para `ORDER BY` no Prisma com paridade pre/post validada por teste.
5. Migração de `queries.ts` para 7 novos services (`stats`, `discover`, `whatsapp-click`, `story`, `financial`, `reels`, `moderation`) + completude de `media`; `queries.ts` termina vazio (re-exports temporários ≥ 14 dias) ou com funções justificadas.
6. `metricas-baseline.md` com inventário de cache, métricas antes/depois e decisões arquiteturais.
7. PBTs co-localizados validando Properties 1, 2 e 3 (paridade SQL ↔ memória, paginação cursor-based, cursor monotônico).

A fase **não** entrega: troca de ORM, troca de banco, sharding, leitura de réplica, mudanças no schema Prisma sem justificativa, lazy loading/code splitting de componentes pesados (fase-5), `<Suspense>`/streaming/skeletons (fase-5), virtual scroll (fase-5), otimização de imagens (fase-4/fase-5), SEO/Core Web Vitals (fase-5), CI (fase-7), redução de `any` no app inteiro (fase-7).

### AGENTS_Rule — consultas registradas

A regra dura E5 do master exige consulta a `node_modules/next/dist/docs/` antes de decisões em `cache-components`, `route-segment-config` e `server-actions`. As consultas foram feitas durante a redação deste design e estão registradas na §4 do `requirements.md` deste spec-filho. Os achados materiais que moldam decisões deste design:

- **`cache-components`**: `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-cache.md` declara que `"use cache"` é uma feature de Cache Components. Requer `cacheComponents: true` em `next.config.ts`. A cache key é gerada a partir de Build ID, Function ID, args serializáveis e variáveis capturadas por closure. `cacheLife` define TTL com perfis nomeados (`'max'`, `'default'`, etc.) ou customizados (`{ stale, revalidate, expire }`). `cacheTag` permite invalidar por tag via `revalidateTag`. Quando `cacheComponents` está ativo, Next.js usa `<Activity>` (React) para preservar estado entre navegações — **comportamento novo** que precisa ser avaliado.
- **`route-segment-config`**: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/index.md` mostra que em v16.0.0 só restam 4 opções (`dynamicParams`, `runtime`, `preferredRegion`, `maxDuration`). **`dynamic`, `dynamicParams`, `revalidate` e `fetchCache` foram removidos quando `cacheComponents` está habilitado.** `runtime: 'edge'` é incompatível com Cache Components. `experimental_ppr` também removido (codemod disponível).
- **`migrating-to-cache-components`**: `node_modules/next/dist/docs/01-app/02-guides/migrating-to-cache-components.md` diz literalmente: para `dynamic = "force-dynamic"`, "Not needed. All pages are dynamic by default" — basta remover. Para `dynamic = "force-static"`, remover e adicionar `"use cache"` próximo do data access com `cacheLife('max')`. Para `revalidate = N`, remover e adicionar `cacheLife({ revalidate: N })`. Migração tem caminho declarado mas exige decisão por rota.
- **`server-actions`**: `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-server.md` mostra que `'use server'` no topo de um arquivo marca todas as exports como server-side, e Server Actions importadas em Client Components precisam estar em arquivos dedicados com `'use server'` no topo. Funções precisam ser async. Padrão atual do app (`src/app/_actions/**` com `'use server'`) já segue isso.

Esses quatro achados moldam três decisões deste design:

1. **`cacheComponents: true` é decisão arquitetural com janela**: a flag controla `ppr`, `useCache`, `dynamicIO` em uma única configuração unificada (cf. cacheComponents.md, "16.0.0 introduced"). Habilitar em produção requer (a) remover todos os `dynamic`/`revalidate`/`fetchCache`/`dynamicParams` legados das 43 rotas, (b) avaliar impacto de `<Activity>` em UX, (c) migrar perfis de cache para `cacheLife`. Nesta fase, `cacheComponents` permanece **avaliada caso a caso**: pode ser ativada ao final como wave separada se a análise das 43 rotas mostrar massa crítica de candidatas a `"use cache"`.
2. **Estratégia de cache híbrida durante a fase**: para rotas que mantêm o modelo legado (sem `cacheComponents`), a saída é `revalidate=N` (em segundos) ou `dynamic justificado`. Para rotas que migrarem, é `"use cache"` + `cacheLife`.
3. **Server Actions inalteradas**: a migração `queries.ts` → services não move Server Actions; elas continuam em `src/app/_actions/**` e `src/app/painel/_actions/**` com `'use server'`. Apenas mudam o que importam (de `@/lib/queries` para `@/lib/services`).

## Architecture

```
+-- src/lib/queries.ts                                [refactor → vazio ou justificado]
|     (objetivo final: re-exports temporários ou funções com comentário-justificativa)
|
+-- src/lib/services/                                  [novos services + completude]
|   +-- subscription.service.ts                        [já existe — sem mudança nesta fase]
|   +-- profile.service.ts                             [refactor — adicionar mediaCursor]
|   +-- city.service.ts                                [já existe — sem mudança]
|   +-- media.service.ts                               [refactor — receber listMediaWithCounts, listMediaComments]
|   +-- stats.service.ts                               [novo — getPlatformStats, getHotPeriodStart]
|   +-- discover.service.ts                            [novo — listProfilesForCity, search, premium-week, hot, boosted, sections]
|   |     funções internas: applyOrderBy() substitui sortProfileCards/finalizeDiscoverOrder
|   +-- whatsapp-click.service.ts                      [novo — listRecent, countToday]
|   +-- story.service.ts                               [novo — getForProfile, listForCity (com distinct)]
|   +-- financial.service.ts                           [novo — listForMonth]
|   +-- reels.service.ts                               [novo — listReels com cursor]
|   +-- moderation.service.ts                          [novo — listQueue]
|   +-- index.ts                                       [refactor — re-exports atualizados]
|
+-- src/app/**                                          [refactor por wave]
|     consumidores: trocam @/lib/queries por @/lib/services
|     páginas com force-dynamic: classificadas e atualizadas conforme metricas-baseline.md
|
+-- next.config.ts                                      [refactor condicional]
|     cacheComponents: true (apenas se a análise da Wave 3 aprovar)
|
+-- .kiro/specs/fase-3-backend/                         [docs do spec-filho]
|   +-- metricas-baseline.md                           [novo — inventário 43 rotas + métricas antes/depois + decisões]
|   +-- requirements.md                                 [já entregue]
|   +-- design.md                                       [este arquivo]
|   +-- tasks.md                                        [próximo]
|
+-- src/lib/services/*.{test,pbt}.ts                    [novos — testes de paridade pre/post migration]
|     Properties 1, 2, 3 (cf. seção Correctness Properties)
```

### Fluxos

**N+1 em `getProfileBySlug` (Requirement 1):**

```
Estado atual (queries.ts:203-228):
  prisma.profile.findUnique({
    where: { slug },
    include: {
      city: true, district: true,
      media: { orderBy: { createdAt: "desc" } /* SEM paginação, SEM select explícito */ },
      reviews: { take: 12, include: { user: { select: { id, name, slug } } } },
      availabilityRules: ..., durationOptions: ...
    }
  })

Estado alvo (profile.service.ts):
  função getProfileBySlug(slug, opts: { mediaCursor?: string, userId?: string })
    1) lê profile (id + meta) com select explícito → 1 query
    2) lê primeira página de media (≤ 12) ordenada por (sortOrder asc, id asc), filtrada por isPublic
       cursor: WHERE (sortOrder, id) > (cursorSortOrder, cursorId), take 12 → 1 query
    3) lê reviews (take 12) com select { user: { id, name, slug } } → 1 query (já estava OK, mas com select)
    4) lê availabilityRules + durationOptions em paralelo via Promise.all → 1 query cada
  Total: 4-5 queries (vs. 1 query atual com payload inflado por mídia ilimitada)

  Trade-off: 4-5 queries pequenas executadas em paralelo (Promise.all) tendem a ser mais
  rápidas do que 1 query gigante com include profundo (Prisma serializa o JSON).
  Métrica antes/depois confirma o ganho.
```

**Cursor de mídia**: chave composta `(sortOrder, id)`. Cursor monotônico estritamente crescente garante (a) sem duplicatas entre páginas, (b) sem itens pulados, (c) reprodutibilidade. Se `sortOrder` for null para algum item, fallback para `(createdAt desc, id)` — registrado como nota no service.

**Classificação das 43 rotas (Requirement 2):**

```
Inventário em metricas-baseline.md > Inventário de cache:
  | Rota                                               | Atual          | Alvo            | Justificativa (≤30 palavras)                                |
  | -------------------------------------------------- | -------------- | --------------- | ----------------------------------------------------------- |
  | src/app/page.tsx                                   | force-dynamic  | revalidate=60   | Home pública, dados de plataforma e cidades top mudam pouco |
  | src/app/p/[slug]/page.tsx                          | force-dynamic  | dynamic justif. | Perfil personalizado por sessão (auth + isOwner)            |
  | src/app/descobrir/[citySlug]/page.tsx              | force-dynamic  | revalidate=300  | Lista de perfis por cidade, ranking estável em janela de 5min|
  | src/app/api/profiles/section/route.ts              | force-dynamic  | dynamic justif. | Route Handler com cursor pagination, depende do request     |
  | src/app/painel/**/*.tsx                            | force-dynamic  | dynamic justif. | Painel autenticado, dados sensíveis ao usuário              |
  | src/app/admin/**/*.tsx                             | force-dynamic  | dynamic justif. | Painel admin, fila de moderação muda em tempo real          |
  | src/app/cidades/page.tsx                           | force-dynamic  | revalidate=900  | Lista de cidades, mudança esporádica                        |
  | src/app/em-alta/page.tsx                           | force-dynamic  | revalidate=120  | Hot ranking de perfis, estável em janela de 2min            |
  | src/app/em-destaque/page.tsx                       | force-dynamic  | revalidate=120  | Boosted ranking, estável em janela de 2min                  |
  | ... (43 linhas total)                              |                |                 |                                                             |

Aplicação:
  - Para revalidate=N (sem Cache Components):
      // antes
      export const dynamic = "force-dynamic";
      // depois
      export const revalidate = 60;     // unidade: segundos
  - Para "use cache" (com Cache Components ativado):
      // antes
      export const dynamic = "force-dynamic";
      // depois (no body da função / componente)
      "use cache";
      cacheLife({ revalidate: 60, expire: 180 });
      cacheTag(`home`);
  - Para dynamic justificado:
      // mantém force-dynamic
      // adiciona comentário inline:
      // ↳ ver metricas-baseline.md > linha 17 — depende de auth(), Suspense já implementado em fase-5
```

**Cache Components (Requirement 3):**

Decisão de adotar `cacheComponents: true` é tomada **ao final da Wave 3** com base no inventário das 43 rotas. Critério: se ≥ 30% das rotas (≥ 13 rotas) virarem candidatas a `"use cache"`, a flag é ativada em commit dedicado com janela de validação ≥ 7 dias em homologação. Caso contrário, mantém o modelo legado (`revalidate=N`) e Cache Components fica para fase futura. Decisão registrada em `metricas-baseline.md > Decisões`.

```ts
// next.config.ts (esboço, condicional)
const nextConfig: NextConfig = {
  // ... existentes ...
  cacheComponents: true,  // adicionado apenas se a análise aprovar
};
```

Quando `cacheComponents: true` for ativado, a Wave 3 também:

1. Remove `export const dynamic`, `export const revalidate`, `export const fetchCache`, `export const dynamicParams` de todas as rotas afetadas (são removidas em v16.0.0 com a flag).
2. Adiciona `"use cache"` + `cacheLife` + `cacheTag` no body dos componentes/funções alvo.
3. Atualiza Server Actions que mutam dados cacheados para chamar `revalidateTag(...)`.
4. Documenta perfis de `cacheLife` customizados em `metricas-baseline.md > Decisões`.

**Métrica antes/depois (Requirement 6):**

```ts
// src/lib/prisma.ts (instrumentação opt-in via env)
const prisma = new PrismaClient({
  log: process.env.PRISMA_DEBUG_QUERIES === "1"
    ? [{ level: "query", emit: "event" }]
    : [],
});
if (process.env.PRISMA_DEBUG_QUERIES === "1") {
  prisma.$on("query" as never, (e: { query: string; duration: number }) => {
    console.log(`[prisma] ${e.duration}ms ${e.query.slice(0, 80)}`);
  });
}

// Uso em desenvolvimento (manual, durante a fase):
//   PRISMA_DEBUG_QUERIES=1 npm run dev
//   curl http://localhost:3000/p/some-slug
//   contar linhas [prisma] no terminal
//   medir tempo via console.time("getProfileBySlug")/console.timeEnd
//   registrar em metricas-baseline.md

// Metodologia mínima (declarada em metricas-baseline.md):
//   - 5 medições com mediana descartando p10/p90, OU 3 consecutivas com desvio < 20% do mediano.
//   - Banco com seeds (npm run db:seed) — perfil "real" com mídia variada.
```

**Migração `queries.ts` → services (Requirement 5):**

```
Estado atual:
  src/lib/queries.ts: 25+ exports (mistura: funções, tipos, constantes)
  src/lib/services/: 4 services (subscription, profile, city, media)

Plano (Wave 7, subtasks por service):
  7a. stats.service.ts:        getPlatformStats, getHotPeriodStart
  7b. discover.service.ts:     listProfilesForCity, searchProfilesGlobal, getPremiumWeekProfiles,
                               getHotProfiles, getBoostedProfiles, getSectionProfiles
                               (sortProfileCards/finalizeDiscoverOrder viram funções internas e
                                a maioria do trabalho é movido para ORDER BY no Prisma)
  7c. whatsapp-click.service.ts: listWhatsAppClicksRecent, countWhatsAppClicksToday
  7d. story.service.ts:        getStoriesForProfile, listStoriesForCity (com distinct)
  7e. financial.service.ts:    listFinancialRecordsForMonth
  7f. reels.service.ts:        listReels (com cursor pagination)
  7g. moderation.service.ts:   listModerationQueue
  7h. media.service.ts:        completar com listMediaWithCounts, listMediaComments

Cada subtask:
  - Cria *.service.ts com função migrada
  - Adiciona *.test.ts co-localizado para paridade pre/post (compara queries.ts antigo vs service novo
    com fixture compartilhada — fixtures de seed do banco)
  - Atualiza index.ts re-exportando do novo service
  - Atualiza consumidores em src/app/** para importar de @/lib/services
  - Remove a função de queries.ts OU adiciona re-export temporário (janela ≥ 14 dias)

Estado final aceitável:
  (a) src/lib/queries.ts vazio ou contendo apenas:
        export { ... } from "./services";  // re-exports temporários
  (b) OU contendo apenas funções com comentário-justificativa:
        // JUSTIFICADO: helper interno usado só por seed.ts e cron, não vale criar service
        export async function _internalHelper() { ... }
```

**Sorts em SQL (Requirement 4):**

```ts
// Estado atual (queries.ts:97-111):
export function sortProfileCards<T extends ProfileCardPayload>(profiles: T[], sort: ProfileSort): T[] {
  const copy = [...profiles];
  switch (sort) {
    case "price_asc":  copy.sort((a, b) => a.priceHour - b.priceHour); break;
    case "price_desc": copy.sort((a, b) => b.priceHour - a.priceHour); break;
    case "rating":     copy.sort((a, b) => b.ratingAvg - a.ratingAvg); break;
    case "relevance":  /* ... */
  }
  return copy;
}

// Estado alvo (discover.service.ts > applyOrderBy):
function buildOrderBy(sort: ProfileSort): Prisma.ProfileOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":  return [{ priceHour: "asc" }, { id: "asc" }];
    case "price_desc": return [{ priceHour: "desc" }, { id: "asc" }];
    case "rating":     return [{ ratingAvg: "desc" }, { id: "asc" }];
    case "relevance":
    default:
      // PREMIUM > DESTAQUE > ESSENCIAL via CASE em raw SQL ou via múltiplos passes —
      // Prisma não suporta ORDER BY com expressão CASE diretamente.
      // Estratégia: usar campo `planTierWeight` derivado se for adicionado ao schema;
      // OU manter compatibilidade via 2 queries paralelas (premium + outros) e UNION em memória,
      // mas isso requer justificativa em metricas-baseline.md (sort em memória parcial mantido).
      return [{ ratingAvg: "desc" }, { id: "asc" }];  // fallback documentado
  }
}
```

**Nota sobre PLAN_ORDER em SQL**: o Prisma não suporta `ORDER BY CASE WHEN ... THEN N END` nativamente. Três caminhos possíveis (escolha registrada em `metricas-baseline.md > Decisões`):

1. **Adicionar `planTierWeight` ao schema** (Int derivado do enum) — exige `OutOfScopeFinding` para mudança de schema, mas se justificada como consequência direta da otimização cabe.
2. **Múltiplas queries paralelas com `Promise.all`** — uma por tier, depois concatenar em ordem PREMIUM/DESTAQUE/ESSENCIAL. Isso ainda evita `sortProfileCards` em memória sobre o array completo.
3. **`$queryRaw` com `CASE WHEN planTier = 'PREMIUM' THEN 1 WHEN ... END`** — fica fora do typed Prisma client, mas é direto.

A preferência é o caminho 2 (múltiplas queries paralelas) por preservar tipagem e não tocar schema; caminho 1 só se métrica antes/depois mostrar regressão. Caminho 3 é último recurso.

**Paginação cursor-based em `listReels`**: o spec arquivado `Requisito 10.4` exige `nextCursor` + `hasMore`. Aplica-se aqui na `reels.service.ts`. Cursor sobre `(createdAt desc, id desc)` — chave composta para garantir monotonicidade mesmo em colisões de timestamp.

### Boundaries

- **`queries.ts` legado vs services**: durante a janela de transição (≥ 14 dias após o commit que conclui a migração), `queries.ts` pode conter re-exports de `@/lib/services` para compatibilidade. Após a janela, virá commit de remoção. Isso é registrado em comentário no topo de `queries.ts` com data de remoção planejada.
- **Cache Components vs route segment config**: as duas estratégias **não coexistem na mesma rota**. Se `cacheComponents: true` for ativado, o build em v16.0.0 remove os configs legados. Se permanecer desligado, o app mantém `revalidate=N` / `dynamic = ...`. Decisão é por commit dedicado, com comentário no `next.config.ts` apontando para `metricas-baseline.md > Decisões`.
- **Métricas em dev vs prod**: medições antes/depois ficam em desenvolvimento (single-instance, banco com seeds). Métricas de produção entram em fase futura (APM/log shipping é Non-Goal de fase-7).
- **Teste de paridade vs teste unitário**: paridade pre/post migration usa **a função antiga em `queries.ts` como oráculo** durante a janela de transição. Quando `queries.ts` ficar vazio, o teste de paridade vira teste unitário com snapshot do retorno do service. Documentado em `*.test.ts` co-localizado.

## Components and Interfaces

### 1. `src/lib/services/profile.service.ts` (refactor — Requirements 1, 7)

```ts
import type { Prisma } from "@prisma/client";

export interface GetProfileBySlugOptions {
  mediaCursor?: string;          // formato: `${sortOrder}:${id}` ou null
  mediaPageSize?: number;        // default 12, max 24
  userId?: string;               // sessão atual, para `likes` em `media`
}

export interface ProfileMediaPage {
  items: MediaItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ProfileDetail {
  id: string;
  slug: string;
  // ... demais campos do Profile
  city: { id: string; slug: string; name: string };          // select ≤ 10 campos
  district: { id: string; slug: string; name: string };
  reviews: ReviewWithUser[];                                  // take 12, select user.id/name/slug
  availabilityRules: AvailabilityRule[];
  durationOptions: DurationOption[];
  media: ProfileMediaPage;                                    // primeira página + cursor
}

export async function getProfileBySlug(
  slug: string,
  options?: GetProfileBySlugOptions
): Promise<ProfileDetail | null>;

export async function getProfileMediaPage(
  slug: string,
  options?: GetProfileBySlugOptions
): Promise<ProfileMediaPage>;
```

Decisão: `getProfileBySlug` retorna a primeira página de mídia (≤ 12). Páginas seguintes via `getProfileMediaPage(slug, { mediaCursor })`. Frontend (componente `MediaGallery` em `fase-5-ux`) consome via fetch incremental.

### 2. `src/lib/services/discover.service.ts` (novo — Requirement 4)

```ts
import type { ProfileSort, DiscoverFilters } from "../discover-params";

export interface DiscoverPage {
  items: ProfileCard[];
  hasMore: boolean;
}

export async function listProfilesForCity(
  cityId: string,
  filters: DiscoverFilters,
  sort: ProfileSort,
  options?: { offset?: number; limit?: number }
): Promise<DiscoverPage>;

export async function searchProfilesGlobal(
  q: string,
  options?: { limit?: number }
): Promise<ProfileCard[]>;

export async function getSectionProfiles(
  type: "hot" | "boosted",
  options?: { offset?: number; limit?: number }
): Promise<DiscoverPage>;

export async function getPremiumWeekProfiles(
  options?: { limit?: number }
): Promise<ProfileCard[]>;

export async function getHotProfiles(
  options?: { limit?: number }
): Promise<ProfileCard[]>;

export async function getBoostedProfiles(
  options?: { limit?: number }
): Promise<ProfileCard[]>;
```

Funções internas (não exportadas): `buildOrderBy(sort)` substitui `sortProfileCards`; `applyPlanTierGrouping(profiles, sort)` substitui `finalizeDiscoverOrder` ao usar múltiplas queries paralelas por tier.

### 3. Cache Strategy Decision Matrix (3-5 exemplos canônicos)

A matriz completa (43 linhas) vive em `metricas-baseline.md`. Aqui registramos os 5 exemplos canônicos que cobrem cada classe:

| Rota                                            | Classe atual    | Classe alvo       | Justificativa                                                          |
|-------------------------------------------------|-----------------|-------------------|------------------------------------------------------------------------|
| `src/app/page.tsx`                              | `force-dynamic` | `revalidate=60`   | Home pública (cidades top + stats); janela de 60s aceitável            |
| `src/app/p/[slug]/page.tsx`                     | `force-dynamic` | `dynamic` justif. | Personalizada por sessão (`isOwner`, `subscriberStatus`); SSR estrito  |
| `src/app/descobrir/[citySlug]/page.tsx`         | `force-dynamic` | `revalidate=300`  | Lista de perfis por cidade; ranking estável em janela de 5min          |
| `src/app/painel/**/*.tsx`                       | `force-dynamic` | `dynamic` justif. | Painel autenticado; dados sensíveis ao usuário; cache leakage risk     |
| `src/app/admin/moderacao/page.tsx`              | `force-dynamic` | `dynamic` justif. | Fila de moderação muda em tempo real; cache desalinha com ação humana  |

Se `cacheComponents: true` for ativado, as 3 primeiras rotas migram para `"use cache"` + `cacheLife`:

```tsx
// src/app/page.tsx (alvo com Cache Components)
import { cacheLife, cacheTag } from "next/cache";

export default async function HomePage() {
  "use cache";
  cacheLife({ revalidate: 60, expire: 180 });
  cacheTag("home");
  // ... resto do componente
}
```

### 4. Métrica antes/depois (Requirement 6)

```ts
// src/lib/prisma.ts (esboço de instrumentação)
import { PrismaClient } from "@prisma/client";

const debugQueries = process.env.PRISMA_DEBUG_QUERIES === "1";

export const prisma = new PrismaClient({
  log: debugQueries ? [{ level: "query", emit: "event" }] : [],
});

if (debugQueries) {
  // @ts-expect-error - $on("query") types vary by Prisma version
  prisma.$on("query", (e: { query: string; duration: number; params: string }) => {
    console.log(`[prisma] ${e.duration}ms ${e.query.replace(/\s+/g, " ").slice(0, 120)}`);
  });
}
```

Uso em wave de medição:

```bash
PRISMA_DEBUG_QUERIES=1 npm run dev
# em outro terminal
curl -s http://localhost:3000/p/some-slug > /dev/null
# contar linhas [prisma] no log do dev e timestamp
```

`metricas-baseline.md > Métricas antes/depois` registra:

| Otimização                                | Antes (queries) | Depois (queries) | Antes (ms p50) | Depois (ms p50) | Commit  |
|-------------------------------------------|-----------------|------------------|----------------|-----------------|---------|
| `getProfileBySlug` paginação cursor       | 1 (gigante)     | 4 (paralelas)    | 380ms          | 95ms            | `<sha>` |
| `getSectionProfiles` ORDER BY SQL         | 1 + sort JS     | 1 (sem sort)     | 120ms          | 65ms            | `<sha>` |
| `listStoriesForCity` distinct             | 1 + Map JS      | 1 (com distinct) | 90ms           | 35ms            | `<sha>` |

(Valores ilustrativos. Reais saem da medição.)

### 5. Migração `queries.ts` → services (Requirement 5)

Cada subtask de Wave 7 segue o mesmo padrão:

```
1. Criar src/lib/services/<dominio>.service.ts com:
   - import necessário
   - função migrada com tipos explícitos
   - select Prisma explícito (≤ 10 campos por relação aninhada — Property 4 do spec arquivado)
   - ORDER BY no Prisma quando aplicável

2. Criar src/lib/services/<dominio>.test.ts:
   - fixture compartilhada (seed do banco ou mock determinístico)
   - teste de paridade: assertEquals(queriesOld.fn(...), serviceNew.fn(...))
   - rode npm run test antes de commitar

3. Atualizar src/lib/services/index.ts com novo export.

4. grep_search por "@/lib/queries" em src/app/** e src/components/**:
   - substituir cada ocorrência da função migrada por @/lib/services
   - rodar npm run build para validar tipos

5. Editar src/lib/queries.ts:
   - remover a função (preferido) OU
   - substituir por re-export temporário com comentário explicando a janela de remoção:
       /** @deprecated 2026-05-30 — migrada para services/<dominio>; remoção planejada após 2026-06-13 */
       export { fnName } from "./services/<dominio>.service";

6. Commit por subtask, mensagem: "feat(fase-3/services): migrar <fnName> para <dominio>.service"
```

### 6. Paginação cursor-based para mídia em `getProfileBySlug`

```ts
// formato do cursor: base64url(`${sortOrder}:${id}`)
//   - sortOrder pode ser null → sentinela 'NULL'
//   - id é cuid() do Prisma

function encodeCursor(item: { sortOrder: number | null; id: string }): string {
  const so = item.sortOrder ?? "NULL";
  return Buffer.from(`${so}:${item.id}`, "utf8").toString("base64url");
}

function decodeCursor(cursor: string | undefined): { sortOrder: number | null; id: string } | null {
  if (!cursor) return null;
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const [so, id] = decoded.split(":");
    if (!id) return null;
    return { sortOrder: so === "NULL" ? null : Number(so), id };
  } catch {
    return null;  // cursor malformado → ignora (volta à primeira página)
  }
}

// uso em getProfileMediaPage:
const cursor = decodeCursor(options?.mediaCursor);
const items = await prisma.media.findMany({
  where: {
    profileId: profile.id,
    isPublic: true,
    ...(cursor ? {
      OR: [
        { sortOrder: { gt: cursor.sortOrder ?? -Infinity } },
        { sortOrder: cursor.sortOrder, id: { gt: cursor.id } },
      ],
    } : {}),
  },
  orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  take: pageSize + 1,  // pega 1 a mais para detectar hasMore
  select: { /* ≤ 10 campos */ },
});
const hasMore = items.length > pageSize;
const trimmed = items.slice(0, pageSize);
const nextCursor = hasMore ? encodeCursor(trimmed[trimmed.length - 1]) : null;
return { items: trimmed, hasMore, nextCursor };
```

### 7. Batching de reviews/usuários

Estado atual já não tem N+1 puro (Prisma faz `JOIN` via `include`). O ganho real está no `select` explícito limitando os campos retornados:

```ts
// Antes:
reviews: {
  take: 12,
  include: { user: { select: { id: true, name: true, slug: true } } }
}

// Depois (idêntico em termos de queries — 1 join — mas com select estrito do review):
reviews: {
  take: 12,
  select: {
    id: true, rating: true, body: true, createdAt: true,
    user: { select: { id: true, name: true, slug: true } }
  }
}
```

Isso responde ao spec arquivado `Requisito 1.6` (≤ 10 campos por relação) e reduz payload em rede entre Postgres e Node.

## Data Models

### **NÃO tocar `prisma/schema.prisma`**

Esta fase **não altera o schema Prisma**. Justificativa:

- `auditoria-geral/requirements.md > Non-Goals item 3` proíbe mudanças de schema sem justificativa de consequência direta.
- Os índices necessários (`Profile.[planTier+planExpiresAt]`, `Profile.[isOnline+cityId]`, `Profile.[featuredUntil]`, `Subscription.[userId+status+expiresAt]`) já estão no schema atual conforme `auditoria-geral/design.md > Estado de partida`.
- Adicionar `planTierWeight` (proposta no design da `discover.service.ts`) seria mudança de schema; **fica como `OutOfScopeFinding` se a métrica antes/depois das múltiplas queries paralelas mostrar regressão inaceitável**, em commit no master spec. Não absorvido silenciosamente.

### Tipos derivados (apenas em código, sem mudança de DB)

```ts
// src/lib/services/profile.service.ts
export interface MediaItem {
  id: string;
  url: string;
  mediaType: MediaType;
  isPublic: boolean;
  isCover: boolean;
  sortOrder: number | null;
  caption: string | null;
  createdAt: Date;
  _count: { likes: number; comments: number };
  likes?: { id: string }[];  // só vem quando userId fornecido
}

export interface ProfileMediaPage {
  items: MediaItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

// src/lib/services/discover.service.ts
export interface ProfileCard {
  id: string;
  slug: string;
  displayName: string;
  age: number;
  priceHour: number;
  ratingAvg: number;
  ratingCount: number;
  isVerified: boolean;
  isOnline: boolean;
  planTier: PlanTier;
  featuredUntil: Date | null;
  city: { name: string; slug: string };
  district: { name: string; slug: string };
  cover: { url: string } | null;  // cover único (max 1)
}

export interface DiscoverPage {
  items: ProfileCard[];
  hasMore: boolean;
  total?: number;  // opcional, só quando o consumidor exige (custoso)
}

// src/lib/services/reels.service.ts
export interface ReelsPage {
  items: ReelItem[];
  nextCursor: string | null;
  hasMore: boolean;
}
```

## Error Handling

A Fase 3 não adiciona novos pontos de falha — apenas refatora os existentes. Os procedimentos abaixo cobrem situações em que a fase **não pode ser absorvida silenciosamente**.

### E1. Métrica depois pior que antes

**Sintoma:** após aplicar uma otimização, `metricas-baseline.md > Métricas antes/depois` mostra regressão (mais queries OU tempo maior).

**Tratamento:** **não promover o commit**. Investigar a regressão (Prisma plan analysis, `EXPLAIN`), revisar a estratégia (índice ausente? query mal estruturada?), e ou (a) ajustar para que a métrica depois seja ≤ a antes, (b) registrar como `OutOfScopeFinding` apontando para a causa raiz (provavelmente índice ausente em `prisma/schema.prisma`), com proposta de novo Phase Card ou ampliação de fase-7.

### E2. Necessidade de novo índice no schema Prisma

**Sintoma:** durante a migração de uma função, descobre-se que o ganho de performance só acontece com um índice ausente (ex.: `[mediaType, isPublic, profileId]` para `listReels`).

**Tratamento:** registrar como `OutOfScopeFinding` em `requirements.md > §3` com `proposedTarget` = "novo Phase Card de schema-changes" OU update da fase-3 com justificativa de "consequência direta da otimização" (cf. `auditoria-geral/requirements.md > Non-Goals item 3`). Em ambos os casos, **o índice só é adicionado em commit dedicado no schema** após o achado virar entrada no master spec.

### E3. Server Action quebra durante a migração

**Sintoma:** consumidor que era Server Action (`'use server'`) deixa de funcionar após troca do import de `@/lib/queries` para `@/lib/services`.

**Tratamento:** o teste de paridade do service deveria ter pego antes do commit. Se passou: (a) reverter o commit que migrou o consumidor, (b) reproduzir localmente, (c) corrigir tipos/return shape no service para casar com o que o Server Action consome, (d) re-rodar o teste de paridade, (e) re-aplicar a migração. Em nenhum caso a migração avança com Server Action quebrada.

### E4. Cache Components ativado quebra rota

**Sintoma:** após `cacheComponents: true` em `next.config.ts`, alguma rota retorna 500 em homologação durante a janela de validação.

**Tratamento:** desligar `cacheComponents: true` (revert do commit), registrar a rota afetada em `metricas-baseline.md > Decisões > Cache Components` com diagnóstico (`cookies()` em RSC sem `<Suspense>`? Closure capturando objeto não-serializável?), e ou corrigir a rota OU manter `cacheComponents: false` e marcar a fase com decisão registrada. Não há "ativar e torcer".

### E5. Item de schema mudou no Next entre a consulta e a entrega

**Sintoma:** durante a Wave 3, surge `next@16.x.y` (minor) que renomeia uma API que esta fase usa.

**Tratamento:** **adicionar nova linha** em `requirements.md > §4` (AGENTS_Rule) com a nova consulta. Não sobrescreve a linha existente — invariante do template.

### E6. `queries.ts` legado consumido fora de `src/`

**Sintoma:** durante a remoção final de `queries.ts`, um consumidor é encontrado em `prisma/seed.ts` ou em `tests/e2e/`.

**Tratamento:** o consumidor é fora do escopo de "código de aplicação". `prisma/seed.ts` e `tests/e2e/**` continuam podendo importar de `@/lib/queries` durante a janela; após a janela, a função fica em `_legacy.ts` em `src/lib/` com comentário-justificativa, OU é movida para o respectivo módulo (`prisma/seed.ts` pode ter sua própria função inline).

### `OutOfScopeFinding` schema (para uso na §3)

```ts
interface OutOfScopeFinding {
  discoveredIn: "fase-3-backend";
  description: string;
  proposedTarget: PhaseId | "novo-spec-filho";
  evidence: string;  // path:linha, hash de commit ou link de PR
}
```

Casos típicos esperados (registrar como OutOfScopeFinding **se ocorrerem**):

- Índice ausente identificado durante medição (proposedTarget: novo Phase Card de schema-changes).
- `cacheComponents: true` exigir refactor amplo de Server Actions (proposedTarget: ampliar fase-3 ou nova fase).
- Rota com cache leakage entre usuários (proposedTarget: fase-1-seguranca, escopo CSP/cookies).
- Componente pesado descoberto sem `loading.tsx` durante medição (proposedTarget: fase-5-ux).

## Testing Strategy

A Fase 3 consome a infraestrutura de `fase-2-testes` (Vitest + fast-check, configurada e `Done`). O contrato é:

- **Para cada service novo da Wave 7**: `*.test.ts` co-localizado validando paridade pre/post migration. Fixture: registros de seed (`npm run db:seed`) ou mock determinístico do Prisma client. O teste compara `queries.ts:fnAntiga(...)` (oráculo) vs `services/<x>.service.ts:fnNova(...)` (alvo) com `expect(...).toEqual(...)`.
- **Para cada otimização de query** (Wave 5: N+1, Wave 6: sorts SQL): `*.pbt.ts` co-localizado implementando as Properties 1, 2, 3 listadas em "Correctness Properties" abaixo. Rodam com `numRuns: 100` (default herdado de `fase-2-testes/vitest.setup.ts`).
- **Para mudanças de cache** (Wave 3, 4): **não há teste automatizado** — a verificação é manual via medição em `metricas-baseline.md`. O critério é "métrica depois ≤ antes" (count de queries) ou "métrica depois ≤ 80% antes" (tempo p50).
- **Para Server Actions migradas**: o teste do service novo cobre o output; a Server Action em si fica sem teste novo (consistente com escopo de `fase-2-testes` que foca em módulos puros).

Itens que **nunca** rodam nesta fase:

- Cobertura de componentes React (Testing Library) — fora do escopo (cf. `fase-2-testes > out_of_scope`).
- Testes E2E novos no Playwright — fora do escopo.
- Lighthouse CI ou Core Web Vitals — fora do escopo (vão para fase-5/fase-7).
- Testes de carga / penetração — fora do escopo de qualquer fase desta auditoria.

### Estrutura de testes

```
src/lib/services/
  profile.service.ts
  profile.service.test.ts         ← paridade pre/post + paginação cursor
  profile.service.pbt.ts          ← Property 2 (paginação) + Property 3 (cursor monotônico)
  discover.service.ts
  discover.service.test.ts        ← paridade pre/post para listProfilesForCity, getSectionProfiles
  discover.service.pbt.ts         ← Property 1 (ORDER BY paridade)
  story.service.ts
  story.service.test.ts           ← paridade distinct vs Map JS
  reels.service.ts
  reels.service.test.ts           ← cursor pagination + ordem
  reels.service.pbt.ts            ← Property 3 reaproveitada
  ...
```

### Saída de testes (gate)

Antes de promover qualquer commit da Wave 7:

```bash
npm run test         # tudo passa
# OU
npx vitest --run --reporter=verbose src/lib/services/<nome>.{test,pbt}.ts
```

Em caso de falha, o protocolo da `fase-2-testes/testing-conventions.md > Persistência de contraexemplos` se aplica: registrar inline ou em arquivo de regressão dedicado.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

A Fase 3 enuncia 3 propriedades universais. Elas viram `*.pbt.ts` co-localizados com cada service afetado. Rodam com `numRuns: 100` (default herdado de `fase-2-testes`).

### Property 1: Paridade entre ORDER BY (SQL) e sort em memória

**Validates: Requirements 4.1, 4.2, 4.4, 4.5**

*Para todo* conjunto `S` de perfis salvos no banco e *toda* configuração `sort ∈ {"price_asc", "price_desc", "rating", "relevance"}`, o resultado de `discover.service.ts > listProfilesForCity(cityId, filters, sort)` (que usa `ORDER BY` no Prisma) **é igual em ordem** ao resultado de `queries.ts > listProfilesForCity(cityId, filters, sort)` (oráculo legado, com `sortProfileCards` + `finalizeDiscoverOrder` em memória) para os mesmos `cityId` e `filters`.

Equivalência declarada: `JSON.stringify(novoIds) === JSON.stringify(antigoIds)` onde `novoIds` e `antigoIds` são as listas de `profile.id` na ordem retornada.

Geradores: `fc.constantFrom("price_asc", "price_desc", "rating", "relevance")` para `sort`; `fc.record({ ageMin: fc.integer({ min: 18, max: 99 }), ... })` para `filters`. `cityId` vem de fixture de seed.

Tempo limite: o teste roda em ≤ 5s no `npm run test`. Se exceder, reduzir `numRuns` para 50 com nota em `testing-conventions.md`.

### Property 2: Paginação cursor-based em `getProfileMediaPage` é completa e disjunta

**Validates: Requirements 1.1, 1.2, 1.4, 1.5**

*Para todo* perfil `p` com `n` itens de mídia pública e *toda* sequência de chamadas a `getProfileMediaPage(slug, { mediaCursor })` seguindo os cursores retornados, a união dos `items` retornados em todas as páginas é igual ao conjunto completo de mídia pública de `p` (completude), e a interseção entre páginas é vazia (disjunção).

Equivalência declarada:
```
∀ páginas P_1, P_2, ..., P_k retornadas em sequência:
  union(P_i.items) === { todas as mídias públicas de p ordenadas por (sortOrder asc, id asc) }
  ∀ i ≠ j:  P_i.items ∩ P_j.items === ∅
  P_k.hasMore === false
```

Geradores: `fc.integer({ min: 0, max: 100 })` para `n` (tamanho do conjunto de mídia); cada item gerado com `fc.record({ sortOrder: fc.option(fc.integer()), id: fc.uuid(), createdAt: fc.date() })`. Mock do Prisma `media.findMany` para garantir determinismo.

### Property 3: Cursor é monotônico estritamente crescente

**Validates: Requirements 1.2, 1.3, 1.4, 7.1, 7.3**

*Para toda* sequência `c_0, c_1, c_2, ..., c_k` de cursores retornados por `getProfileMediaPage` em chamadas consecutivas, a tupla `(sortOrder, id)` decodificada de `c_i` é estritamente menor que a de `c_{i+1}` na ordem lexicográfica `(sortOrder asc, id asc)`. Isso garante (a) que `decodeCursor` é determinístico, (b) que não há "voltar" no cursor, (c) que cursor malformado retorna a primeira página sem crashar.

Equivalência declarada:
```
∀ c_i, c_{i+1} consecutivos:
  decoded(c_i).sortOrder < decoded(c_{i+1}).sortOrder
  OR (decoded(c_i).sortOrder === decoded(c_{i+1}).sortOrder
      AND decoded(c_i).id < decoded(c_{i+1}).id)
```

Geradores: `fc.uniqueArray(fc.record({ sortOrder: fc.option(fc.integer()), id: fc.uuid() }), { minLength: 1, maxLength: 50 })` para o conjunto de mídia; iterar a paginação com `pageSize` aleatório em `[1, 12]`.

> Estas 3 Properties são gate da Wave 7 para seus services correspondentes. Falha bloqueia o commit que entrega a otimização. Persistência de contraexemplos segue `testing-conventions.md > Persistência de contraexemplos` da `fase-2-testes`.

## Saída deste design

Este `design.md` é considerado pronto quando:

- Cobre os 8 Requirements de `requirements.md` desta fase com decisões verificáveis.
- Lista os arquivos a criar/modificar (`src/lib/services/{stats,discover,whatsapp-click,story,financial,reels,moderation}.service.ts` + completude de `media.service.ts` + refactor de `profile.service.ts`; `metricas-baseline.md`; `next.config.ts` condicional).
- Registra a decisão de `cacheComponents` como condicional, com critério de ativação (≥ 30% das rotas candidatas), janela de validação (≥ 7 dias em homologação) e impacto (`<Activity>`).
- Aponta o que vira `OutOfScopeFinding` (índice novo no schema Prisma, `cacheComponents` quebra rota, mudança de minor do Next).
- Declara as 3 Correctness Properties (paridade SQL/memória, paginação cursor-based completa+disjunta, cursor monotônico) com geradores e equivalências.

A próxima etapa do workflow é o `tasks.md` deste mesmo spec-filho, que decompõe este design em sub-tarefas executáveis com dependências.
