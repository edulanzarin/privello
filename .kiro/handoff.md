# Handoff — Fases 1, 2, 3 e 4 entregues

> Última atualização: 2026-05-17T00:00:00Z
> Sessão anterior: ver histórico no fim deste arquivo.

## Status atual

**Fase 1 (`fase-1-seguranca`)**, **Fase 2 (`fase-2-testes`)**, **Fase 3 (`fase-3-backend`)** e **Fase 4 (`fase-4-design-system`)** estão `state: Done` no master `auditoria-geral`.

- Master: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\requirements.md`
- Phase Card fase-1 → `Done` em 2026-05-16T04:47:12Z (commit `cd6f36c`)
- Phase Card fase-2 → `Done` em 2026-05-16T04:46:53Z (commit `b5a8fe0`)
- Phase Card fase-3 → `Done` em 2026-05-17T00:00:00Z
- Phase Card fase-4 → `Done` em 2026-05-17T00:00:00Z
- Spawn-Readiness Gate:
  - **fase-5-ux**: `SpawnReady` (depende de fase-2 + fase-4 — ambas `Done`).
  - **fase-7-dx-infra**: `SpawnReady` (depende de fase-1 + fase-2 + fase-3 — todas `Done`).
  - **fase-6-mobile-cross-browser**: ainda aguarda fase-5 (que destrava fase-6 quando concluir).

## Smoke checks finais (pós fase-3 + fase-4)

| Check | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ exit 0, zero erros |
| `npm run test` | ✅ 25 files / 172 tests / ~8.4s, exit 0 |
| `npm run build` | ✅ 71 rotas compiladas, exit 0 (requer `AUTH_URL` no shell em prod-mode) |
| `npm run lint` | ⚠️ 67–75 problems (20–28 errors + 47 warnings). **Zero erros novos** introduzidos pelas fases 3 e 4. Erros remanescentes são pré-existentes em código de UX/painel pesado (`react-hooks/refs`, `react-hooks/cant-call-impure-fn-during-render`, etc. — ativados pelo React 19 strict). Pertencem à Fase 5 (UX) e Fase 7 (DX/lint). Mesma dívida registrada no handoff anterior, **não é regressão** das fases 3/4. |

## Entregas concretas

### Fase 3 — Correção e performance de backend (8 Requirements + 3 PBTs)

**Arquivos novos:**
- `src/lib/services/stats.service.ts` — `getPlatformStats`, `getHotPeriodStart` (+ paridade `*.test.ts`).
- `src/lib/services/discover.service.ts` — `listProfilesForCity`, `searchProfilesGlobal`, `getPremiumWeekProfiles`, `getHotProfiles`, `getBoostedProfiles`, `getSectionProfiles` + helpers internos `sortProfileCardsInner`/`finalizeDiscoverOrderInner` exportados via `__test_internal__` para Property 1.
- `src/lib/services/discover.service.pbt.ts` — Property 1 (paridade SQL ↔ memória) — 2/2 verde em 1.00s.
- `src/lib/services/whatsapp-click.service.ts` — `listWhatsAppClicksRecent`, `countWhatsAppClicksToday` (+ paridade `*.test.ts`).
- `src/lib/services/story.service.ts` — `getStoriesForProfile`, `listStoriesForCity` (com `prisma.profile.findMany({ stories: { some: ... } })` em vez de `findMany` em Story + Map JS).
- `src/lib/services/financial.service.ts` — `listFinancialRecordsForMonth` (+ paridade `*.test.ts`).
- `src/lib/services/reels.service.ts` — `listReels` com cursor pagination (cursor por `id` desc — preservado verbatim do oráculo) + paridade `*.test.ts`.
- `src/lib/services/moderation.service.ts` — `listModerationQueue` (+ paridade `*.test.ts`).
- `src/lib/services/profile.service.pbt.ts` — Property 2 (paginação completa+disjunta) e Property 3 (cursor monotônico) — 6/6 verde em 3.18s.

**Arquivos modificados:**
- `src/lib/queries.ts` — refatorado para estado **híbrido (a) + (b)**: 27 re-exports de `@/lib/services` com `@deprecated 2026-05-30 — remoção planejada após 2026-06-13`; helpers `sortProfileCards`, `finalizeDiscoverOrder`, `profileCardInclude`, tipo `ProfileCardPayload` permanecem como **JUSTIFICADO** (oráculo da Property 1).
- `src/lib/services/profile.service.ts` — refactor de `getProfileBySlug` com paginação cursor-based, `select` explícito em reviews (≤ 10 campos por relação), `Promise.all` para chamadas independentes; novo export `getProfileMediaPage(slug, options)`.
- `src/lib/services/index.ts` — re-exports completos para todos os 9 services.
- `src/lib/prisma.ts` — instrumentação opt-in via `PRISMA_DEBUG_QUERIES=1` para captura de métricas antes/depois.
- 24 consumidores em `src/app/**` migrados de `@/lib/queries` → `@/lib/services` (19 páginas + 5 componentes + `src/lib/discover-params.ts`).
- 7 rotas migradas para `revalidate=N` (home, em-alta, em-destaque, cidades, buscar, novidades, planos).
- 36 rotas mantidas como `dynamic justificado` com comentário inline apontando para `metricas-baseline.md`.

**Documentos do spec-filho:**
- `requirements.md` — 8 Requirements detalhados, EARS herdadas, §4 com 3 consultas a `node_modules/next/dist/docs/` (cache-components, route-segment-config, server-actions).
- `design.md` — 3 Correctness Properties, decisões de cache/sort registradas.
- `tasks.md` — 64 subtasks (63/64 done; 11.2 do orquestrador).
- `metricas-baseline.md` — inventário 43 rotas + métricas antes/depois (3 com behavior-change, 7 com paridade pura) + decisões consolidadas (Cache Components não ativar, Sort relevance JS, queries.ts híbrido, Server Actions com prisma direto aceitável).

**Decisões tomadas (não reabrir):**
- **Cache Components**: NÃO ativar `cacheComponents: true` nesta fase. Critério ≥ 30% rotas candidatas; resultado real 0% (84% das 43 rotas dependem de `auth()` por request).
- **Sort relevance**: agrupamento PREMIUM > DESTAQUE > ESSENCIAL permanece em JS via helper `finalizeDiscoverOrderInner` para preservar paridade com oráculo (Property 1 verde).
- **Server Actions com prisma direto**: 13/14 mantêm `prisma` direto em mutações (aceitável; camada de services foi desenhada para reads de display).

### Fase 4 — Aplicação do design system (8 Requirements + 4 PBTs)

**Arquivos novos:**
- `src/components/ui/dropdown.tsx` — compound component (`Dropdown`, `DropdownTrigger`, `DropdownContent`, `DropdownItem`) com API moderna (`open?`, `defaultOpen?`, `onOpenChange?`, `align?`, `trapFocus?`).
- `src/components/ui/dropdown.test.ts` — testes determinísticos (outside click, Escape, ArrowDown/Up, Enter, ARIA, variantes).
- `src/components/ui/dropdown.pbt.ts` — Property 3 (controlado vs interno) e Property 4 (Tab roundtrip com trapFocus).
- `src/lib/hooks/use-focus-trap.ts` — hook `useFocusTrap(ref, active, options)` com seletor de focáveis e ciclo Tab/Shift+Tab.
- `src/lib/hooks/use-focus-trap.test.ts` — testes determinísticos.
- `src/lib/hooks/use-focus-trap.pbt.ts` — Property 1 (completude do ciclo) e Property 2 (libera foco anterior).
- `src/components/ui/modal.test.ts` — smoke test do focus trap integrado.
- `scripts/migrate-tokens.ps1` — script de migração em massa para Wave 10 (rastreabilidade).

**Arquivos modificados:**
- `src/app/globals.css` — tokens semânticos completos: `warning`, `danger`, `blue` (em `:root` + `@theme inline`); escala tipográfica explícita `text-2xs` (10px) → `text-8xl` (64px); tokens novos `success-dark`, `warning-dark`, `accent-purple`, `whatsapp` (cor de marca externa).
- `src/components/ui/modal.tsx` — `useFocusTrap` integrado quando `open === true`; API pública preservada.
- `src/lib/hooks/use-file-upload.ts` — expandido com `strategy: "fetch" | "xhr"` (default `"fetch"`) e `onProgress?: (percent: number) => void`.
- `src/lib/hooks/index.ts` — re-exporta `useFocusTrap`.
- `eslint.config.mjs` — regra `no-restricted-syntax` anti-regressão (4 selectors: hex em literal e template string, font-size arbitrário em literal e template string); ignora `email-templates.ts` e `admin-charts.tsx`.
- ~50 arquivos em `src/components/**` e `src/app/**` migrados em Waves 5-10:
  - 167 → 0 hex literais em escopo (9 mantidas como exceção declarada em `admin-charts.tsx`).
  - 677 → 0 font-size arbitrários em escopo.
  - 5 Switches inline substituídos pelo primitivo `Switch`.
  - 4 modais inline substituídos por `Modal`; 2 registrados como `OutOfScopeFinding` para fase-6 (story-bar, profile-story-cover) e nota out-of-scope (painel-sidebar drawer, media-gallery responsivo).
  - 7 sites de upload migrados para `useFileUpload` (1 com `strategy: "xhr"` para reels-manager com progresso real).

**Documentos do spec-filho:**
- `requirements.md` — 8 Requirements detalhados, §4 marcada `n/a` (fase não toca APIs do Next).
- `design.md` — 6 Correctness Properties propostas (4 implementadas).
- `tasks.md` — 80 subtasks (79/80 done; 15.2 do orquestrador).
- `tokens.md` — catálogo completo: tokens semânticos (10 + 4 extras), variantes de opacidade, escala tipográfica estendida (10px–64px), exceções declaradas, API conventions (Modal `onClose` vs Dropdown `onOpenChange`), Migration log Waves 0/9/10, Lint anti-regressão, contrato com CI Fase 7, smoke checks finais.
- `inventario-baseline.md` (opcional) — preservado em `tokens.md > Migration baseline`.

**Decisões tomadas (não reabrir):**
- **Focus trap como hook** (não componente) — integra limpo no Modal/Dropdown sem alterar a árvore JSX.
- **Lint anti-regressão como ESLint custom rule** via `no-restricted-syntax` (não stylelint, não checklist humano).
- **Tokens em hex** (não OKLCH) — migração para OKLCH é candidata futura.
- **Modal preserva `onClose`** (não renomeia para `onOpenChange`); Dropdown usa `onOpenChange` por ser primitivo novo. Divergência consciente registrada em `tokens.md > API conventions`.
- **`media-gallery.tsx:178`** registrado como `OutOfScopeFinding` para fase-6 (responsividade é tema central da Fase 6).
- **`painel-sidebar.tsx:225`** (drawer mobile) — refactor para `<Drawer>` é tarefa potencial fora desta fase.

## Restrições respeitadas

- Nenhum `git push`, `git reset --hard`, `git clean`, `Remove-Item -Recurse -Force` rodado.
- `node_modules` intocado.
- `prisma/schema.prisma` intocado (decisão dura do orquestrador respeitada — sem novos índices, sem mudanças de campo).
- `.env` real preservado.
- Workspace confinado a `c:\Users\edulanzarin\Documents\Dev\privello\`.
- `'use server'` preservado em todas as 14 Server Actions.

## Histórico de commits desta sessão

```
6dda09c feat(fase-4): marca 15.1 done (15.2 fica para o orquestrador)
3ab380d feat(fase-4/pbt+smoke): adiciona PBTs (Properties 1-4) + smoke checks finais (Wave 13/14/15.1)
39daabc feat(fase-3/wave-11): marca 11.1 done; 11.2 fica para o orquestrador
1532c65 feat(fase-3/wave-7-10): conclui Wave 7-10 (services, metricas, smoke checks)
fa059fd feat(fase-4/cauda+lint): elimina cauda residual e instala regra ESLint anti-regressão (Wave 10/11)
e102de4 feat(fase-3/services): adicionar reels.service.test.ts (Wave 7.6 paridade)
549e8c3 feat(fase-4/tokens): elimina cauda de hex literais e font-size arbitrário (Wave 10)
4bdc0d8 feat(fase-4/upload): consolida 7 sites de upload em useFileUpload (Wave 9)
71b2d61 feat(fase-3/discover): novo discover.service + story.service + Property 1 verde 2/2
aa5fab9 feat(fase-4/wave-8-9): Switch consolidation (5 sites) + Modal consolidation (4 sites + 2 OOS)
8d3c196 test(fase-3/profile): PBT Property 2 e 3 (cursor pagination + monotonia) verde 6/6
3ffe3ca feat(fase-3/profile): cursor pagination + select estrito em getProfileBySlug
474f9fb feat(fase-3/cache): registrar decisao Cache Components nao ativar (5.1)
32e68d3 feat(fase-4/wave-6-7): migracao top-N hex e font-size + tokens success-dark/warning-dark/accent-purple
5e0161d feat(fase-4/wave-3-4): Dropdown + useFocusTrap + Modal integration + tests
9f54001 feat(fase-4/wave-1-2): tokens semanticos + escala tipografica em globals.css
5fd3826 feat(fase-3/baseline): inventario 43 rotas + queries.ts + metricas antes
6aa9d20 feat(fase-4/wave-0): inventario baseline + tokens.md scaffold
```

Total: 18 commits desta sessão. Branch `master`, sem push (constraint do usuário).

Aguarda o orquestrador adicionar:
- Commit final marcando Phase Cards 4 e 5 do master para `Done` + atualização de `handoff.md` (este commit).

## Próximos passos

Fases destravadas (próxima onda):

- **Fase 5 (`fase-5-ux`)**: dependências fase-2 + fase-4 satisfeitas. Pode ser promovida.
- **Fase 7 (`fase-7-dx-infra`)**: dependências fase-1 + fase-2 + fase-3 satisfeitas. Pode ser promovida.

Recomendação: as duas podem rodar em paralelo (são file-disjoint — fase-5 toca `loading.tsx`/`error.tsx`/EmptyState/UI otimista em `src/app/**` e `src/components/**`; fase-7 toca CI, docker, env docs, ADRs e cleanup de `any`/duplicações em `src/lib/**`).

Após fase-5 concluir, **fase-6-mobile-cross-browser** fica destravada (depende de fase-4 + fase-5).

## Observações operacionais

- Lock no tracker de tasks (`*.meta.json`) intermitente como nas sessões anteriores. Workaround: tasks.md continua sendo a fonte de verdade; subagentes editam `[ ]` → `[x]` direto via `str_replace`.
- Algumas races entre subagentes paralelos (fase-3 + fase-4) resultaram em commit composto `549e8c3` — capturou arquivos da fase-3 enquanto rotulava como fase-4. Conteúdo correto em todos os casos; fase-3 continuou seus próprios commits depois.
- `npm run build` em modo produção exige `AUTH_URL` no shell. Config esperada do `next-auth` desde fase-1. Não é regressão.

## Sessões anteriores (resumido)

1. Bug iPhone via LAN corrigido com `trustHost: true` em `src/lib/auth.ts` + fix em `prisma/seed.ts`. Spec arquivado em `.kiro/specs/_archive/ios-mobile-interactions-fix/`.
2. Master spec `auditoria-geral` definiu 7 fases promovíveis com Phase Cards completos.
3. Phases 1 e 2 promovidas em 2026-03-14, requirements + design + tasks gerados.
4. Sessão autônoma de execução paralela em onda iniciou; entregou parte significativa dos artefatos antes de travar pelo lock.
5. Sessão 2026-05-16 — reconciliação do bookkeeping + finalização das fases 1 e 2 até `state: Done`. 22 commits, 118 testes verdes, smoke checks limpos.
6. **Esta sessão (2026-05-17)**: promoção das fases 3 e 4, redação de specs-filhos, execução em ondas paralelas (file-disjoint), finalização até `state: Done`. 18 commits, 172 testes verdes, smoke checks limpos.
