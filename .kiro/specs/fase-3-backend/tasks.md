# Implementation Plan: `fase-3-backend`

## Overview

Decomposição executável do `design.md` desta fase. As tarefas validam pré-condições (AGENTS_Rule preenchida, fase-1 e fase-2 `Done`), fazem inventário baseline das 43 rotas com `force-dynamic`, executam waves por superfície tocada (Cache Components, Route Segment Config, N+1, sorts SQL, migração `queries.ts` → services), capturam métricas antes/depois, entregam PBTs co-localizados, fazem smoke checks finais e atualizam o Phase Card no master.

Restrições importantes:

- **Sem alterações em `prisma/schema.prisma`.** Se um índice novo for necessário para uma otimização, vira `OutOfScopeFinding` para um Phase Card de schema-changes ou ampliação de fase-3, com commit no master ANTES de aplicar (regra dura E2 de `design.md > Error Handling`).
- **Sem CI nesta fase.** Smoke checks (lint, tsc, test, build) rodam local; CI fica para `fase-7-dx-infra`.
- **Sem `Promise.allSettled` resiliente, sem `<Suspense>`, sem virtual scroll.** Esses ficam para `fase-5-ux`.
- **Sem testes E2E novos no Playwright.** Cobertura via Vitest + fast-check (infra de fase-2).
- Tarefas marcadas com `*` produzem property tests (validam Properties em `design.md > Correctness Properties`).

## Tasks

- [x] 1. Validar pré-condições (Spawn-Readiness Gate)
  - [x] 1.1 Confirmar `requirements.md > §4` preenchida
    - Verificar que as 3 linhas (`cache-components`, `route-segment-config`, `server-actions`) têm `path_consultado`, `trecho_relevante` e `decisao` preenchidos sem ambiguidade
    - Confirmar que cada `path_consultado` aponta para arquivo realmente existente em `node_modules/next/dist/docs/`
    - Falha aqui = bloqueio duro (regra E5 de `design.md > Error Handling` do master)
    - _Requirements: 4.2, 4.3, 4.5_

  - [x] 1.2 Confirmar fase-1 e fase-2 em `Done` no master
    - Ler `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\requirements.md` e validar que `Phase Card fase-1-seguranca` e `Phase Card fase-2-testes` têm `state: Done` e `doneAt` ISO-8601 preenchidos
    - Confirmar `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\handoff.md` lista `fase-3-backend` como destravada
    - _Requirements: 4.1, 4.2_

  - [x] 1.3 Confirmar §3 inicialmente vazia
    - `requirements.md > §3 Achados fora de escopo` deve estar vazia ou conter linhas de placeholder claramente marcadas
    - Caso contrário, corrigir antes de prosseguir
    - _Requirements: 8.3_

- [x] 2. Inventário baseline das 43 rotas
  - [x] 2.1 Criar `metricas-baseline.md` com cabeçalho e metodologia
    - Em `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-3-backend\metricas-baseline.md`
    - Seção 1: cabeçalho (autoria, data inicial, master spec, phase id)
    - Seção 2: metodologia (5 medições com mediana, descartar p10/p90, OR 3 medições com desvio < 20%; ambiente local `npm run dev` + `PRISMA_DEBUG_QUERIES=1`; banco de seeds via `npm run db:seed`)
    - Seção 3: Inventário de cache (vazia, será preenchida em 2.2)
    - Seção 4: Métricas antes/depois (vazia)
    - Seção 5: Decisões (vazia)
    - _Requirements: 6.2, 6.4_

  - [x] 2.2 Listar as 43 rotas em `metricas-baseline.md > Inventário de cache`
    - Rodar `grep_search` por `^export\s+const\s+dynamic\s*=\s*"force-dynamic"` em `src/app/**/*.{ts,tsx}` e capturar caminho de cada arquivo
    - Para cada rota, criar linha com colunas: `caminho`, `classe atual` (sempre `force-dynamic`), `classe alvo` (preencher na Wave 3/4), `justificativa` (≤ 30 palavras), `doc consultada` (preencher se classe alvo for `revalidate=N` ou `cache-components`)
    - Confirmar count = 43; se diferente, registrar a discrepância na própria seção e seguir
    - _Requirements: 2.2_

  - [x] 2.3 Inventariar exports remanescentes em `queries.ts`
    - Em `metricas-baseline.md`, adicionar seção "Inventário queries.ts → services" listando todos os exports atuais
    - Para cada export, indicar: (a) já tem service correspondente? (b) wave de migração planejada (7a..7h ou "justificado")
    - Comparar com `src/lib/services/index.ts` para identificar duplicações em `@/lib/queries` ↔ `@/lib/services`
    - _Requirements: 5.2, 5.3_

  - [x] 2.4 Capturar métricas baseline em `getProfileBySlug` (antes)
    - Rodar `PRISMA_DEBUG_QUERIES=1 npm run dev` em terminal separado
    - Em outro terminal: `curl -s http://localhost:3000/p/<slug-com-muita-midia> > /dev/null` × 5
    - Contar linhas `[prisma]` no log e medir tempo total via `console.time` ad-hoc
    - Registrar em `metricas-baseline.md > Métricas antes/depois` na linha `getProfileBySlug` (coluna "antes")
    - _Requirements: 1.5, 6.3_

  - [x] 2.5 Capturar métricas baseline em `getSectionProfiles` e `listStoriesForCity` (antes)
    - Mesma metodologia de 2.4, requests para `/api/profiles/section?type=hot&offset=0` e para uma página que consome `listStoriesForCity` (ex.: `/descobrir/[citySlug]`)
    - Registrar em `metricas-baseline.md > Métricas antes/depois` na linha de cada função (coluna "antes")
    - _Requirements: 4.5, 6.3_

- [x] 3. Wave Cache Components (avaliação e decisão)
  - [x] 3.1 Classificar candidatas a `"use cache"` na tabela do inventário
    - Para cada uma das 43 rotas, decidir se é candidata a Cache Components (`"use cache"` + `cacheLife`) ou se vai para `revalidate=N` legado / `dynamic justificado`
    - Critério de candidata: rota pública, conteúdo razoavelmente estável, sem dependência forte de `cookies()`/`headers()` em tempo de request
    - Registrar decisão na coluna "classe alvo" do inventário e justificativa em ≤ 30 palavras
    - _Requirements: 2.2, 3.1_

  - [x] 3.2 Decidir adoção de `cacheComponents: true` em `next.config.ts`
    - Critério: se ≥ 30% das rotas (≥ 13/43) virarem candidatas a `"use cache"`, recomendar ativação
    - Documentar a decisão em `metricas-baseline.md > Decisões > Cache Components` com: critério aplicado, count efetivo, impactos colaterais (`<Activity>`, remoção dos route segment configs legados em v16.0.0)
    - _Requirements: 2.5, 3.1_

  - [x] 3.3 Aplicar `cacheComponents: true` se a decisão de 3.2 for "ativar"
    - Editar `next.config.ts` adicionando `cacheComponents: true` com comentário inline citando `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/cacheComponents.md` + data
    - Rodar `npm run build` e validar zero erros de tipo
    - Em janela de validação ≥ 7 dias em homologação antes de promover para produção (registrado em `metricas-baseline.md`)
    - Se a decisão for "não ativar", pular para 3.5 e seguir o caminho `revalidate=N`
    - **PULADA**: decisão 3.2 = "não ativar" (0% candidatas). Caminho legado `revalidate=N` aplicado em 4.1.
    - _Requirements: 2.5, 3.1_

  - [x] 3.4 Aplicar `"use cache"` + `cacheLife` + `cacheTag` nas rotas candidatas
    - Para cada rota classificada como `cache-components` no inventário, editar o componente/função:
      - Remover `export const dynamic = "force-dynamic"` (e demais route segment configs legados se `cacheComponents: true`)
      - Adicionar `"use cache"` no topo da função
      - Importar e chamar `cacheLife({ revalidate, expire })` com perfil definido em `metricas-baseline.md > Decisões > Perfis de cacheLife`
      - Adicionar `cacheTag(...)` quando a função for invalidável por evento
    - Rodar `npm run build` após cada wave de rotas correlatas
    - **PULADA**: 0 rotas classificadas como `cache-components` (decisão 3.2 = não ativar).
    - _Requirements: 3.1, 3.2_

  - [x] 3.5 Atualizar Server Actions para `revalidateTag`/`revalidatePath`
    - Para cada `cacheTag` adicionado em 3.4, identificar Server Actions que mutam o dado correspondente em `src/app/_actions/**` e `src/app/painel/_actions/**`
    - Adicionar chamada a `revalidateTag(...)` (ou `revalidatePath(...)`) ao final da Server Action
    - **Não tocar a diretiva `'use server'` do arquivo** (consulta AGENTS_Rule já registrada em `requirements.md > §4`)
    - **PULADA**: nenhum `cacheTag` adicionado em 3.4. Server Actions inalteradas. (Wave 7.11 confirma a preservação do `'use server'` durante a migração `queries.ts` → services.)
    - _Requirements: 3.3_

  - [x] 3.6 Capturar métricas depois para rotas com `"use cache"`
    - Mesma metodologia de 2.4: medir count de queries por request e tempo p50 em dev
    - Registrar coluna "depois" em `metricas-baseline.md > Métricas antes/depois` para cada rota afetada
    - Se métrica depois > antes em qualquer rota, **reverter** o commit dessa rota e investigar (regra E1 de `design.md > Error Handling`)
    - **PULADA**: 0 rotas com `"use cache"` (consequência de 3.3 e 3.4 puladas).
    - _Requirements: 3.4, 6.3_

- [x] 4. Wave Route Segment Config (rotas que ficam no modelo legado)
  - [x] 4.1 Aplicar `revalidate=N` nas rotas classificadas como `revalidate`
    - Para cada rota classificada como `revalidate=N` no inventário (e que **não** virou `cache-components`):
      - Substituir `export const dynamic = "force-dynamic"` por `export const revalidate = <N>` com `<N>` em segundos
      - Adicionar comentário inline com link para a linha do inventário em `metricas-baseline.md`
    - Rodar `npm run build` após cada wave correlata
    - _Requirements: 2.3_

  - [x] 4.2 Manter `dynamic` justificado nas rotas que precisam de SSR estrito
    - Para cada rota classificada como `dynamic justificado`:
      - Manter `export const dynamic = "force-dynamic"` no arquivo
      - Adicionar comentário inline apontando para a linha do inventário com a justificativa
    - _Requirements: 2.4_

  - [x] 4.3 Remover route segment configs legados das rotas migradas para `cache-components`
    - Apenas se `cacheComponents: true` foi ativado em 3.3
    - Para cada rota `cache-components`: remover `export const dynamic`, `export const revalidate`, `export const fetchCache`, `export const dynamicParams` (todos removidos em v16.0.0 com `cacheComponents`)
    - Rodar `npm run build` para garantir zero erros
    - **PULADA**: `cacheComponents: true` não foi ativado em 3.3.
    - _Requirements: 2.3, 3.1_

  - [x] 4.4 Capturar métricas depois para rotas com `revalidate=N`
    - Mesma metodologia de 2.4
    - Registrar coluna "depois" em `metricas-baseline.md > Métricas antes/depois`
    - **NOTA**: rotas com `revalidate=N` em modo dev sempre re-renderizam (Next só aplica revalidate no `next start` / produção). Métricas "depois" relevantes para essas rotas viriam de produção (fora do escopo desta fase). Em dev, comportamento permanece equivalente a `force-dynamic`. Documentado em `metricas-baseline.md`.
    - _Requirements: 6.3_

- [ ] 5. Wave N+1 em `getProfileBySlug` (Requirement 1)
  - [ ] 5.1 Refactor de `profile.service.ts > getProfileBySlug` com paginação cursor-based
    - Adicionar parâmetros `mediaCursor?: string`, `mediaPageSize?: number` (default 12, max 24), `userId?: string` ao tipo `GetProfileBySlugOptions`
    - Reescrever o corpo: profile → media (cursor) → reviews → availabilityRules → durationOptions, executados em `Promise.all` quando independentes
    - Aplicar `select` explícito em `reviews` limitando a ≤ 10 campos por relação (atende Property 4 do spec arquivado)
    - Se cursor inválido, fallback para primeira página (sem crash)
    - _Requirements: 1.2, 1.4, 1.3_

  - [ ] 5.2 Adicionar export `getProfileMediaPage(slug, options)`
    - Função separada que retorna `{ items, nextCursor, hasMore }` para paginação incremental do componente `MediaGallery`
    - Mesma cursor decodificação/codificação descrita em `design.md > Components and Interfaces > 6. Paginação cursor-based`
    - Usar `take: pageSize + 1` para detectar `hasMore`
    - _Requirements: 1.2, 1.4_

  - [ ] 5.3 Atualizar `src/lib/services/index.ts` com novo export
    - Adicionar `getProfileMediaPage` na linha de `profile.service`
    - _Requirements: 5.3_

  - [ ] 5.4 Atualizar consumidor `src/app/p/[slug]/page.tsx`
    - Trocar import de `@/lib/queries` por `@/lib/services` para `getProfileBySlug`
    - Confirmar que o componente consome a primeira página de mídia e expõe API para `getProfileMediaPage` em chamadas subsequentes (via fetch incremental no client)
    - Componente `MediaGallery` com fetch incremental fica para `fase-5-ux`; aqui apenas garantir que a estrutura aceita cursor
    - _Requirements: 1.2, 5.3_

  - [ ] 5.5 Capturar métricas depois para `getProfileBySlug`
    - Mesma metodologia de 2.4
    - Registrar coluna "depois" em `metricas-baseline.md > Métricas antes/depois`
    - Confirmar: count de queries pode aumentar (1 → 4-5) MAS tempo p50 deve diminuir; se ambos pioraram, reverter
    - _Requirements: 1.5, 6.3_

  - [ ] 5.6 * Implementar `src/lib/services/profile.service.pbt.ts` (Properties 2 e 3)
    - Property 2 (paginação completa+disjunta): gerador `fc.integer({ min: 0, max: 100 })` para `n`; mock do Prisma `media.findMany`
    - Property 3 (cursor monotônico): `fc.uniqueArray(fc.record({ sortOrder: fc.option(fc.integer()), id: fc.uuid() }))` com `pageSize` aleatório em [1, 12]
    - Documentar persistência de contraexemplo conforme `fase-2-testes/testing-conventions.md > §3`
    - _Requirements: 7.1, 7.3_
    - _Validates: Property 2, Property 3_

- [ ] 6. Wave sorts em SQL (Requirement 4)
  - [ ] 6.1 Decidir abordagem para `PLAN_ORDER` em `relevance` sort
    - Opção A: múltiplas queries paralelas por tier + concatenação na ordem PREMIUM/DESTAQUE/ESSENCIAL (sem mudança de schema)
    - Opção B: `$queryRaw` com `CASE WHEN planTier = 'PREMIUM' THEN 1 ...`
    - Opção C: adicionar `planTierWeight` ao schema (vira `OutOfScopeFinding` — exige commit no master ANTES)
    - Decisão registrada em `metricas-baseline.md > Decisões > Sort relevance` com critério (preferência por A; B só se A regredir; C bloqueado)
    - _Requirements: 4.1_

  - [ ] 6.2 Implementar `discover.service.ts > buildOrderBy(sort)`
    - Função interna que retorna `Prisma.ProfileOrderByWithRelationInput[]`
    - Casos `price_asc`, `price_desc`, `rating`: `ORDER BY` direto
    - Caso `relevance`: aplicar Opção A escolhida em 6.1, com função `applyPlanTierGrouping(profiles, sort)` que executa múltiplas queries paralelas e concatena
    - _Requirements: 4.1, 4.2_

  - [ ] 6.3 Migrar `listProfilesForCity` para `discover.service.ts`
    - Reescrever para usar `buildOrderBy` em vez de `sortProfileCards` + `finalizeDiscoverOrder`
    - Manter assinatura idêntica para preservar paridade com o oráculo legado em `queries.ts`
    - _Requirements: 4.1, 4.2, 5.2_

  - [ ] 6.4 Migrar `getSectionProfiles` para `discover.service.ts`
    - Aplicar `ORDER BY` no Prisma para `planTier` (via Opção A) e `viewsCurrentPeriod desc`
    - Limitar `take: offset + limit + 1` para detectar `hasMore` sem buscar registros extras
    - _Requirements: 4.1, 4.2_

  - [ ] 6.5 Migrar `listStoriesForCity` para `story.service.ts`
    - Usar `prisma.profile.findMany({ where: { stories: { some: { ... } } }, distinct: ["id"] })` em vez de `findMany` em `Story` + agrupamento com `Map` em JS
    - Preservar shape do retorno (`StoryGroup[]`)
    - _Requirements: 4.1, 4.3_

  - [ ] 6.6 * Implementar `src/lib/services/discover.service.pbt.ts` (Property 1)
    - Property 1 (paridade SQL ↔ memória): comparar `discover.service.listProfilesForCity(...)` (alvo) vs `queries.ts.listProfilesForCity(...)` (oráculo) com mesmos `cityId`, `filters`, `sort`
    - Geradores: `fc.constantFrom(...)` para `sort`; `fc.record(...)` para `filters`
    - Equivalência: `JSON.stringify(novoIds) === JSON.stringify(antigoIds)`
    - _Requirements: 4.2, 7.1, 7.3_
    - _Validates: Property 1_

  - [ ] 6.7 Capturar métricas depois para sorts SQL
    - Para cada função migrada (`listProfilesForCity`, `getSectionProfiles`, `listStoriesForCity`): medir count de queries e tempo p50
    - Registrar coluna "depois" em `metricas-baseline.md`
    - _Requirements: 4.5, 6.3_

- [ ] 7. Wave migração `queries.ts` → services
  - [ ] 7.1 Criar `src/lib/services/stats.service.ts`
    - Migrar `getPlatformStats` e `getHotPeriodStart` (sem mudança de comportamento — apenas reorganização)
    - Adicionar `*.test.ts` co-localizado validando paridade com a função antiga em `queries.ts`
    - Atualizar `src/lib/services/index.ts` re-exportando do novo service
    - Atualizar consumidores em `src/app/page.tsx` (e onde mais consumir) para importar de `@/lib/services`
    - Editar `queries.ts`: remover ou substituir por re-export temporário com comentário `@deprecated <data>`
    - _Requirements: 5.2, 5.3, 5.4_

  - [ ] 7.2 Concluir `src/lib/services/discover.service.ts` (já parcialmente em Wave 6)
    - Migrar `searchProfilesGlobal`, `getPremiumWeekProfiles`, `getHotProfiles`, `getBoostedProfiles` (se ainda não foram em 6.x)
    - Adicionar `*.test.ts` cobrindo paridade pre/post para cada
    - Atualizar consumidores em `src/app/em-alta/page.tsx`, `src/app/em-destaque/page.tsx`, `src/app/buscar/page.tsx`, `src/app/api/profiles/section/route.ts` etc.
    - Editar `queries.ts`: remover ou re-export temporário
    - _Requirements: 5.2, 5.3, 5.4_

  - [ ] 7.3 Criar `src/lib/services/whatsapp-click.service.ts`
    - Migrar `listWhatsAppClicksRecent` e `countWhatsAppClicksToday`
    - `*.test.ts` de paridade
    - Atualizar consumidores (provavelmente em `src/app/painel/**`)
    - Editar `queries.ts`: remover ou re-export temporário
    - _Requirements: 5.2, 5.3, 5.4_

  - [ ] 7.4 Concluir `src/lib/services/story.service.ts` (já parcialmente em Wave 6)
    - Migrar `getStoriesForProfile` (se ainda não foi em 6.x)
    - `*.test.ts` cobrindo `distinct` vs `Map JS` (paridade)
    - Atualizar consumidores em rotas de stories
    - Editar `queries.ts`: remover ou re-export temporário
    - _Requirements: 5.2, 5.3, 5.4_

  - [ ] 7.5 Criar `src/lib/services/financial.service.ts`
    - Migrar `listFinancialRecordsForMonth`
    - `*.test.ts` de paridade
    - Atualizar consumidores (provavelmente em `src/app/painel/financeiro/page.tsx`)
    - Editar `queries.ts`: remover ou re-export temporário
    - _Requirements: 5.2, 5.3, 5.4_

  - [ ] 7.6 Criar `src/lib/services/reels.service.ts` com cursor pagination
    - Migrar `listReels` adicionando paginação cursor-based sobre `(createdAt desc, id desc)`
    - Retornar `{ items, nextCursor, hasMore }` (formato consistente com `getProfileMediaPage`)
    - `*.test.ts` cobrindo cursor pagination + paridade
    - Atualizar consumidores em `src/app/reels/page.tsx`, `src/app/reels/[slug]/page.tsx` e API
    - Editar `queries.ts`: remover ou re-export temporário
    - _Requirements: 5.2, 5.3, 5.4_

  - [ ] 7.7 Criar `src/lib/services/moderation.service.ts`
    - Migrar `listModerationQueue`
    - `*.test.ts` de paridade
    - Atualizar consumidores em `src/app/admin/moderacao/page.tsx`
    - Editar `queries.ts`: remover ou re-export temporário
    - _Requirements: 5.2, 5.3, 5.4_

  - [ ] 7.8 Completar `src/lib/services/media.service.ts`
    - Migrar `listMediaWithCounts` e `listMediaComments` (se ainda não estão lá)
    - `*.test.ts` de paridade
    - Atualizar consumidores
    - Editar `queries.ts`: remover ou re-export temporário
    - _Requirements: 5.2, 5.3, 5.4_

  - [ ] 7.9 Auditar estado final de `queries.ts`
    - Após 7.1–7.8, `src/lib/queries.ts` deve estar em um destes dois estados:
      - (a) **Vazio** (apenas tipos `ProfileSort`, `ProfileCardPayload` se outros módulos consumirem) ou **apenas re-exports** de `@/lib/services` com comentário `@deprecated 2026-05-30 — remoção planejada após 2026-06-13`
      - (b) Contendo apenas funções com comentário-justificativa inline (`// JUSTIFICADO: <motivo + link/issue>`)
    - Documentar o estado escolhido em `metricas-baseline.md > Decisões > queries.ts final`
    - _Requirements: 5.4_

  - [ ] 7.10 Capturar métricas depois para services migrados
    - Para cada service novo que mude o número de queries por request (caso comum: `listReels` com cursor), registrar coluna "depois" em `metricas-baseline.md > Métricas antes/depois`
    - Services que apenas reorganizam código sem mudar comportamento dispensam métrica (anotar "paridade pura" na linha)
    - _Requirements: 5.6, 6.3_

  - [ ] 7.11 Garantir Server Actions inalteradas estruturalmente
    - Após 7.1–7.8, `grep_search` por `'use server'` em `src/app/_actions/**` e `src/app/painel/_actions/**` para confirmar que a diretiva está preservada em todos os arquivos
    - Confirmar que Server Actions delegam para services (não acessam `prisma` diretamente)
    - Se algum Server Action ainda usa `prisma` diretamente E não foi refatorado, registrar em `metricas-baseline.md > Decisões > Server Actions com prisma direto` (aceitável se for caso isolado e justificado; senão, refatorar)
    - _Requirements: 5.5_

- [ ] 8. Métricas antes/depois consolidadas
  - [ ] 8.1 Validar que `metricas-baseline.md > Métricas antes/depois` está completa
    - Para cada otimização aplicada em Waves 3-7 que muda comportamento de query: linha "antes" (Wave 2) E linha "depois" preenchidas
    - Cada linha referencia o commit que entregou a otimização
    - Linhas com regressão (depois > antes) devem ter o commit revertido — anotar reversão se houver
    - _Requirements: 6.1, 6.3_

  - [ ] 8.2 Consolidar `metricas-baseline.md > Decisões`
    - Validar que existem entradas para: (a) Cache Components ativada/não, (b) Perfis de `cacheLife` customizados (se houver), (c) Sort relevance (Opção A/B/C), (d) `queries.ts` final (vazio/re-exports/justificado)
    - Cada decisão com data, alternativas consideradas e trade-offs em ≤ 100 palavras
    - _Requirements: 6.2_

- [ ] 9. PBTs co-localizados
  - [ ] 9.1 * Validar `discover.service.pbt.ts` (Property 1) rodando verde
    - `npx vitest --run src/lib/services/discover.service.pbt.ts` termina com exit 0
    - Anexar log de saída em `metricas-baseline.md > Métricas antes/depois > Property 1`
    - Se falhar, persistir contraexemplo conforme `fase-2-testes/testing-conventions.md > §3` e investigar
    - _Requirements: 7.1, 7.3_
    - _Validates: Property 1_

  - [ ] 9.2 * Validar `profile.service.pbt.ts` (Properties 2 e 3) rodando verde
    - `npx vitest --run src/lib/services/profile.service.pbt.ts` termina com exit 0
    - Anexar log de saída em `metricas-baseline.md`
    - _Requirements: 7.1, 7.3_
    - _Validates: Property 2, Property 3_

  - [ ] 9.3 Validar suite completa de testes não regrediu
    - `npm run test` (que herda da Fase 2: Vitest com `--run`) termina com exit 0 e todos os testes passam
    - Numero de testes deve ser ≥ ao baseline da Fase 2 (118 testes em 2026-05-16)
    - _Requirements: 7.1_

- [ ] 10. Smoke checks finais
  - [ ] 10.1 `npm run lint` — registrar baseline
    - Se aparecerem novos erros/warnings em arquivos modificados pela Fase 3, corrigir antes de prosseguir
    - Se aparecerem warnings em arquivos pré-existentes (fase-1/2 já registrou 20 erros + 44 warnings em arquivos de UX/painel), apenas registrar — não bloqueia (são da fase-5/fase-7)
    - _Requirements: 7.1_

  - [ ] 10.2 `npx tsc --noEmit` — zero erros de tipo
    - Bloqueio duro: se houver erros, corrigir antes de prosseguir
    - _Requirements: 5.4, 7.1_

  - [ ] 10.3 `npm run test` — todos os testes verdes
    - Bloqueio duro
    - _Requirements: 7.1_

  - [ ] 10.4 `npm run build` — build limpo
    - Bloqueio duro: build precisa terminar com exit 0
    - Confirmar que count de rotas no output do build é igual ao count baseline da Fase 1 (71 rotas em 2026-05-16) ou aumenta apenas se intencionalmente novo arquivo foi adicionado
    - _Requirements: 2.3, 3.1, 7.1_

- [ ] 11. Saída desta fase
  - [ ] 11.1 Validar saída
    - Todos os 8 Requirements de `requirements.md` têm evidência (path:linha de código, log de teste, ou link de PR/commit) anexada
    - `metricas-baseline.md` cobre as 5 seções (cabeçalho, metodologia, inventário 43 rotas, métricas antes/depois, decisões)
    - `requirements.md > §3 OutOfScopeFinding` está vazia ou cada linha aponta commit no master spec
    - `requirements.md > §4 AGENTS_Rule` tem 3 linhas preenchidas (cache-components, route-segment-config, server-actions)
    - `src/lib/queries.ts` está em um dos dois estados aceitáveis (vazio/re-exports OU funções justificadas)
    - Properties 1, 2, 3 rodam verde
    - _Requirements: 1.5, 2.2, 3.4, 4.5, 5.4, 6.1, 7.1_

  - [ ] 11.2 [orquestrador] Atualizar Phase Card no master `requirements.md`
    - `state: InProgress` → `state: Done`
    - Adicionar `doneAt` ISO-8601
    - Adicionar `child_spec_path: c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-3-backend\` (se ainda não estiver)
    - Re-rodar Spawn-Readiness Gate em `fase-7-dx-infra` (dependente direta — depende de fase-1, fase-2 e fase-3)
    - Documentar no `handoff.md` que `fase-3-backend` está `Done` e listar fases destravadas a seguir
    - _Requirements: 7.1, 8.3_

## Notes

- Tarefas com `*` (5.6, 6.6, 9.1, 9.2) entregam testes baseados em propriedade conforme as Properties declaradas em `design.md > Correctness Properties`. Tarefas sem `*` entregam testes determinísticos (paridade pre/post) ou medições/documentação.
- Tarefas que tocam o mesmo arquivo (ex.: `next.config.ts` em 3.3 + 4.3; `src/lib/queries.ts` em 7.1–7.8 + 7.9) estão em ondas distintas para não criar conflito de edição.
- A tarefa 3.3 é condicional: pode terminar sem ativar `cacheComponents: true` se a decisão de 3.2 for "não ativar". Nesse caso, 4.3 também é pulada.
- A tarefa 6.1/6.6 é a coluna vertebral da Wave 6: a Property 1 valida que a migração de sorts em memória para SQL preservou paridade exata. Se Property 1 falhar, **toda a Wave 6 é revertida** — não se aceita "quase paridade".
- Todo achado relevante que extrapolar o escopo desta fase (ex.: índice ausente identificado durante medição) **NÃO** é absorvido — vira `OutOfScopeFinding` em `requirements.md > §3` com commit no master.
- Schema do Prisma (`prisma/schema.prisma`) é INTOCADO durante toda esta fase. Se necessário, vira `OutOfScopeFinding` antes de qualquer mudança.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3"] },
    { "id": 3, "tasks": ["2.4", "2.5"] },
    { "id": 4, "tasks": ["3.1"] },
    { "id": 5, "tasks": ["3.2"] },
    { "id": 6, "tasks": ["3.3"] },
    { "id": 7, "tasks": ["3.4"] },
    { "id": 8, "tasks": ["3.5"] },
    { "id": 9, "tasks": ["4.1", "4.2"] },
    { "id": 10, "tasks": ["4.3"] },
    { "id": 11, "tasks": ["3.6", "4.4"] },
    { "id": 12, "tasks": ["5.1"] },
    { "id": 13, "tasks": ["5.2", "5.3"] },
    { "id": 14, "tasks": ["5.4"] },
    { "id": 15, "tasks": ["5.5", "5.6"] },
    { "id": 16, "tasks": ["6.1"] },
    { "id": 17, "tasks": ["6.2"] },
    { "id": 18, "tasks": ["6.3", "6.4", "6.5"] },
    { "id": 19, "tasks": ["6.6", "6.7"] },
    { "id": 20, "tasks": ["7.1", "7.3", "7.5", "7.7", "7.8"] },
    { "id": 21, "tasks": ["7.2", "7.4", "7.6"] },
    { "id": 22, "tasks": ["7.9", "7.10", "7.11"] },
    { "id": 23, "tasks": ["8.1", "8.2"] },
    { "id": 24, "tasks": ["9.1", "9.2", "9.3"] },
    { "id": 25, "tasks": ["10.1", "10.2", "10.3", "10.4"] },
    { "id": 26, "tasks": ["11.1"] },
    { "id": 27, "tasks": ["11.2"] }
  ]
}
```
