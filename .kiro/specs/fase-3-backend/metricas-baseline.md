# Métricas Baseline — `fase-3-backend`

> Documento canônico desta fase. Inventário das 43 rotas com `force-dynamic`,
> métricas antes/depois para cada otimização aplicada e decisões arquiteturais
> relevantes.

---

## 1. Cabeçalho

- **autoria**: Spec-Task-Execution Subagent (Kiro)
- **data inicial**: 2026-05-16
- **master_spec_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\requirements.md`
- **child_spec_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-3-backend\`
- **phase_id**: `fase-3-backend`
- **phase_title**: Correção e performance de backend

## 2. Metodologia de medição

Esta fase produz métricas **antes/depois** de cada otimização aplicada. As
medições rodam em ambiente local (`npm run dev`) com banco populado por
`npm run db:seed`. O critério mínimo é registrar **pelo menos uma** das
métricas por otimização: (a) número de queries Prisma por request OU
(b) tempo médio em desenvolvimento.

### 2.1 Instrumentação opt-in

`src/lib/prisma.ts` ganha um log de queries plugado em `prisma.$on("query")`
controlado pela variável de ambiente `PRISMA_DEBUG_QUERIES=1`. Quando ativa, a
linha `[prisma] <ms>ms <sql truncado>` é emitida para `stdout` por query
executada. **Em produção** a flag fica desligada (default) e o `$on` não é
registrado, evitando overhead.

```bash
# Terminal A
PRISMA_DEBUG_QUERIES=1 npm run dev

# Terminal B (substitua slug por seed real)
curl -s http://localhost:3000/p/<slug-com-mídia> > /dev/null
```

Conta-se as linhas `[prisma]` para a métrica de queries por request, e o
tempo total via `console.time`/`console.timeEnd` ad-hoc envolto na função
medida — ou via timestamp inicial/final do `curl --output /dev/null -w "%{time_total}"`.

### 2.2 Critério estatístico

Por linha de "Métricas antes/depois", registrar **uma** das duas opções:

1. **5 medições com mediana** descartando p10/p90 (exclui outlier alto e
   baixo). Reportar a mediana das 3 medições centrais.
2. **3 medições consecutivas** com desvio < 20% do valor mediano. Reportar o
   mediano das 3.

Se ambas as opções produzirem variação > 20%, **anotar a variação** na
linha (em vez de "p50") e considerar a medição como "indicativa" e não
gate-blocking. Casos assim documentam-se com nota explícita.

### 2.3 Regras de regressão (E1)

Se métrica `depois` > métrica `antes` (mais queries OU tempo maior em pelo
menos 20%), **o commit que entregou a otimização não pode ser promovido**.
Se a regressão for inevitável (ex.: troca de 1 query gigante por 4 queries
paralelas mais rápidas), o critério passa a ser **tempo p50** (não count de
queries). Caso a regressão seja real em ambos os critérios, reverter o
commit e investigar (geralmente é índice ausente em `prisma/schema.prisma`,
que vira `OutOfScopeFinding` em `requirements.md > §3`).

## 3. Inventário de cache (43 rotas)

> Count confirmado por `grep_search` em 2026-05-16 (`^export const dynamic = "force-dynamic"$` em `src/app/**/*.{ts,tsx}`): **43 arquivos**. Coluna "classe alvo" e "doc consultada" preenchidas após decisão da Wave 3.2 (Cache Components ativada/não).

### 3.1 Convenções de classes

- `revalidate=N`: rota pública (sem `auth()` ou só com check soft de sessão), conteúdo razoavelmente estável; modelo legado de Route Segment Config sem `cacheComponents`.
- `cache-components`: candidata a `"use cache"` + `cacheLife` + opcionalmente `cacheTag`. **Só usável se `cacheComponents: true` for ativado em `next.config.ts`.**
- `dynamic justificado`: rota mantém `force-dynamic`; depende de sessão por request, dado real-time, ou superfície administrativa onde cache desalinha com ação humana.
- `static`: gerada em build-time; sem dependência de DB ou sessão.

### 3.2 Tabela completa (43 rotas)

| #  | caminho                                                | classe atual    | classe alvo       | justificativa (≤30 palavras)                                                                 | doc consultada |
|----|--------------------------------------------------------|-----------------|-------------------|----------------------------------------------------------------------------------------------|----------------|
| 1  | `src/app/page.tsx`                                     | force-dynamic   | revalidate=60     | Home pública (cidades top + stats + hot/boosted sections); janela de 60s aceitável           | route-segment-config |
| 2  | `src/app/p/[slug]/page.tsx`                            | force-dynamic   | dynamic justif.   | Personalizada por sessão (`auth()` lê `session.user.id` para `likes`); SSR estrito           | — |
| 3  | `src/app/descobrir/[citySlug]/page.tsx`                | force-dynamic   | dynamic justif.   | Lê `auth()` para `isLoggedIn`; gera ações por usuário; cache leakage risk                    | — |
| 4  | `src/app/buscar/page.tsx`                              | force-dynamic   | revalidate=120    | Busca global por nome/handle; resultado público; janela de 2min aceitável                    | route-segment-config |
| 5  | `src/app/cidades/page.tsx`                             | force-dynamic   | revalidate=900    | Lista de cidades; mudança esporádica; janela de 15min                                        | route-segment-config |
| 6  | `src/app/em-alta/page.tsx`                             | force-dynamic   | revalidate=120    | Hot ranking semanal; estável em janela de 2min                                               | route-segment-config |
| 7  | `src/app/em-destaque/page.tsx`                         | force-dynamic   | revalidate=120    | Boosted ranking; estável em janela de 2min                                                   | route-segment-config |
| 8  | `src/app/novidades/page.tsx`                           | force-dynamic   | static            | Página estática sem DB; pode ser pré-renderizada                                             | route-segment-config |
| 9  | `src/app/planos/page.tsx`                              | force-dynamic   | static            | Página estática sem DB; pode ser pré-renderizada                                             | route-segment-config |
| 10 | `src/app/reels/page.tsx`                               | force-dynamic   | dynamic justif.   | Lê `auth()` para `userId`; conteúdo por usuário (likes); marca privadas como locked          | — |
| 11 | `src/app/reels/[slug]/page.tsx`                        | force-dynamic   | dynamic justif.   | Lê `auth()` para `userId`; mesma justificativa do `/reels`                                   | — |
| 12 | `src/app/solicitar/[slug]/page.tsx`                    | force-dynamic   | dynamic justif.   | Lê `auth()` + `searchParams` dinâmicos; redirect provider→perfil; SSR estrito                | — |
| 13 | `src/app/entrar/page.tsx`                              | force-dynamic   | dynamic justif.   | Lê `auth()`; redirect se logado; depende de sessão por request                               | — |
| 14 | `src/app/cadastro/page.tsx`                            | force-dynamic   | dynamic justif.   | Lê `auth()`; redirect se logado; depende de sessão por request                               | — |
| 15 | `src/app/cadastro/cliente/page.tsx`                    | force-dynamic   | dynamic justif.   | Lê `auth()`; redirect se logado                                                              | — |
| 16 | `src/app/cadastro/acompanhante/page.tsx`               | force-dynamic   | dynamic justif.   | Lê `auth()`; redirect se logado                                                              | — |
| 17 | `src/app/conta/onboarding/perfil/page.tsx`             | force-dynamic   | dynamic justif.   | Onboarding autenticado; estado por usuário                                                   | — |
| 18 | `src/app/conta/onboarding/valores/page.tsx`            | force-dynamic   | dynamic justif.   | Onboarding autenticado; estado por usuário                                                   | — |
| 19 | `src/app/conta/onboarding/fotos/page.tsx`              | force-dynamic   | dynamic justif.   | Onboarding autenticado; uploads por usuário                                                  | — |
| 20 | `src/app/conta/onboarding/publicar/page.tsx`           | force-dynamic   | dynamic justif.   | Onboarding autenticado; estado final por usuário                                             | — |
| 21 | `src/app/conta/perfil/page.tsx`                        | force-dynamic   | dynamic justif.   | Perfil do cliente logado; dados sensíveis ao usuário                                         | — |
| 22 | `src/app/assinar/page.tsx`                             | force-dynamic   | dynamic justif.   | Lê `auth()` + verifica subscription; redireciona se já assinante                             | — |
| 23 | `src/app/painel/layout.tsx`                            | force-dynamic   | dynamic justif.   | Layout autenticado; redirect se sem sessão; dados sensíveis                                  | — |
| 24 | `src/app/painel/page.tsx`                              | force-dynamic   | dynamic justif.   | Painel home autenticado; stats por provider                                                  | — |
| 25 | `src/app/painel/perfil/page.tsx`                       | force-dynamic   | dynamic justif.   | Editor de perfil do provider                                                                 | — |
| 26 | `src/app/painel/midias/page.tsx`                       | force-dynamic   | dynamic justif.   | Mídias do provider; uploads por sessão                                                       | — |
| 27 | `src/app/painel/reels/page.tsx`                        | force-dynamic   | dynamic justif.   | Reels do provider; gestão por sessão                                                         | — |
| 28 | `src/app/painel/stories/page.tsx`                      | force-dynamic   | dynamic justif.   | Stories do provider; expira a cada 24h                                                       | — |
| 29 | `src/app/painel/disponibilidade/page.tsx`              | force-dynamic   | dynamic justif.   | Regras de disponibilidade do provider                                                        | — |
| 30 | `src/app/painel/valores/page.tsx`                      | force-dynamic   | dynamic justif.   | Editor de valores e durações                                                                 | — |
| 31 | `src/app/painel/avaliacoes/page.tsx`                   | force-dynamic   | dynamic justif.   | Reviews recebidos pelo provider                                                              | — |
| 32 | `src/app/painel/financeiro/page.tsx`                   | force-dynamic   | dynamic justif.   | Financeiro do provider; dados sensíveis                                                      | — |
| 33 | `src/app/painel/plano/page.tsx`                        | force-dynamic   | dynamic justif.   | Gestão de plano e boost; pagamento ativo                                                     | — |
| 34 | `src/app/painel/suporte/page.tsx`                      | force-dynamic   | dynamic justif.   | Lista de tickets do provider                                                                 | — |
| 35 | `src/app/painel/suporte/[id]/page.tsx`                 | force-dynamic   | dynamic justif.   | Chat de ticket; mensagens em tempo real                                                      | — |
| 36 | `src/app/admin/moderacao/page.tsx`                     | force-dynamic   | dynamic justif.   | Fila de moderação; cache desalinha com ação humana                                           | — |
| 37 | `src/app/admin/perfis/page.tsx`                        | force-dynamic   | dynamic justif.   | Painel admin; ações por sessão                                                               | — |
| 38 | `src/app/admin/midias/page.tsx`                        | force-dynamic   | dynamic justif.   | Painel admin; moderação de mídias                                                            | — |
| 39 | `src/app/admin/financeiro/page.tsx`                    | force-dynamic   | dynamic justif.   | Painel admin; receita por plano                                                              | — |
| 40 | `src/app/admin/verificacoes/[id]/page.tsx`             | force-dynamic   | dynamic justif.   | Aprovação/rejeição de verificação; ação humana                                               | — |
| 41 | `src/app/admin/suporte/page.tsx`                       | force-dynamic   | dynamic justif.   | Lista de tickets admin                                                                       | — |
| 42 | `src/app/admin/suporte/[id]/page.tsx`                  | force-dynamic   | dynamic justif.   | Chat de ticket admin                                                                         | — |
| 43 | `src/app/api/profiles/section/route.ts`                | force-dynamic   | dynamic justif.   | Route Handler com paginação por offset; depende do request                                   | — |

### 3.3 Sumário por classe alvo

| classe alvo          | count | %      |
|----------------------|------:|-------:|
| revalidate=N         |     6 |  14.0% |
| static               |     2 |   4.7% |
| dynamic justificado  |    35 |  81.4% |
| cache-components     |     0 |   0.0% |
| **Total**            |    43 | 100.0% |

**Critério de adoção de `cacheComponents: true`** (cf. design.md > Architecture > Cache Components, Wave 3.2): se ≥ 30% das rotas (≥ 13/43) virarem candidatas a `"use cache"`. Resultado: **0 candidatas (0%)** — abaixo do limiar. **Decisão**: não ativar `cacheComponents` nesta fase. Rotas migradas para `revalidate=N` (6 rotas) e `static` (2 rotas) seguem o modelo legado de Route Segment Config.

## 3.5 Inventário queries.ts → services

> Mapeamento atual de exports em `src/lib/queries.ts` (29 entradas) versus
> services existentes em `src/lib/services/`. Wave de migração planejada à
> direita.

| export                          | já em service?                    | wave de migração   |
|---------------------------------|-----------------------------------|--------------------|
| `profileCardInclude` (constante)| —                                 | 7b (interno discover) |
| `ProfileCardPayload` (tipo)     | —                                 | 7b (re-export)     |
| `getPlatformStats`              | não                               | 7a (`stats.service.ts`) |
| `getCityBySlug`                 | sim — `city.service.ts`           | 7 (queries.ts remove) |
| `getOrCreateCityBySlug`         | sim — `city.service.ts`           | 7 (queries.ts remove) |
| `GenderFilter` (tipo)           | —                                 | 7b (em discover)   |
| `DiscoverFilters` (tipo)        | —                                 | 7b (em discover)   |
| `ProfileSort` (tipo)            | —                                 | 7b (em discover)   |
| `sortProfileCards`              | não                               | 7b (interno discover) |
| `finalizeDiscoverOrder`         | não                               | 7b (interno discover) |
| `listProfilesForCity`           | não                               | 6.3 + 7b           |
| `searchProfilesGlobal`          | não                               | 7b                 |
| `getProfileBySlug`              | sim — `profile.service.ts`        | 5.1 refactor + 7 (queries.ts remove) |
| `isSubscriber`                  | sim — `subscription.service.ts`   | 7 (queries.ts remove) |
| `getUserReviewForProfile`       | sim — `profile.service.ts`        | 7 (queries.ts remove) |
| `getPremiumWeekProfiles`        | não                               | 7b                 |
| `getHotProfiles`                | não                               | 7b                 |
| `getBoostedProfiles`            | não                               | 7b                 |
| `getSectionProfiles`            | não                               | 6.4 + 7b           |
| `getHotPeriodStart`             | não                               | 7a                 |
| `getAllCities`                  | sim — `city.service.ts`           | 7 (queries.ts remove) |
| `getCitiesWithReels`            | sim — `city.service.ts`           | 7 (queries.ts remove) |
| `getProfileBySlugForPainel`     | sim — `profile.service.ts`        | 7 (queries.ts remove) |
| `listWhatsAppClicksRecent`      | não                               | 7c (`whatsapp-click.service.ts`) |
| `countWhatsAppClicksToday`      | não                               | 7c                 |
| `StoryGroup` (tipo)             | —                                 | 7d (em story)      |
| `getStoriesForProfile`          | não                               | 7d                 |
| `listStoriesForCity`            | não                               | 6.5 + 7d           |
| `listFinancialRecordsForMonth`  | não                               | 7e (`financial.service.ts`) |
| `listReels`                     | não                               | 7f (`reels.service.ts`) |
| `listMediaWithCounts`           | duplicada — `media.service.ts:getMediaWithCounts` | 7h (queries.ts remove) |
| `listMediaComments`             | sim — `media.service.ts`          | 7h (queries.ts remove) |
| `listModerationQueue`           | não                               | 7g (`moderation.service.ts`) |

**Duplicações detectadas em `@/lib/queries` ↔ `@/lib/services`** (mesmo comportamento, dois caminhos):
- `getProfileBySlug` (idêntico).
- `getProfileBySlugForPainel` (idêntico).
- `getUserReviewForProfile` (idêntico).
- `getCityBySlug`, `getOrCreateCityBySlug`, `getAllCities`, `getCitiesWithReels` (idênticos).
- `listMediaComments` (idêntico).
- `isSubscriber` (idêntico).
- `listMediaWithCounts` (queries.ts) vs `getMediaWithCounts` (services) — **nome diferente, comportamento idêntico**; mantém-se o nome do service (`getMediaWithCounts`).

A migração tem dois sub-objetivos: (1) remover as duplicações listadas acima, (2) mover os 18 exports restantes de `queries.ts` para os 7 services novos.

## 4. Métricas antes/depois

> Linhas preenchidas conforme cada otimização é aplicada. Cada linha
> referencia o commit de entrega.

| # | otimização | arquivo | antes (queries) | depois (queries) | antes (ms p50) | depois (ms p50) | método | commit |
|---|------------|---------|-----------------|------------------|----------------|-----------------|--------|--------|
| _(linhas preenchidas em 2.4-2.5 e Waves 3-7)_ | | | | | | | | |

## 5. Decisões

> Linhas preenchidas a partir da Wave 3 (Cache Components decision) em
> diante. Cada decisão com data, alternativas consideradas e trade-offs em
> ≤ 100 palavras.

| # | decisão | data | alternativas | trade-offs |
|---|---------|------|--------------|-----------|
| _(linhas preenchidas em 3.2, 6.1, 7.9)_ | | | | |
