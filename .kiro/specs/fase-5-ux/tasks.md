# Implementation Plan: `fase-5-ux`

## Overview

Decomposição executável do `design.md` desta fase. As tarefas validam pré-condições (AGENTS_Rule preenchida, fase-2 e fase-4 `Done`), produzem inventário baseline das 47 page.tsx + 25 route.ts, executam waves por superfície tocada (EmptyState primitive, Loading state primitive, Error boundary primitive, UI otimista, View Transitions, prefers-reduced-motion), entregam PBTs co-localizados, fazem smoke checks finais e atualizam o Phase Card no master.

Restrições importantes:

- **Sem alterações em `prisma/schema.prisma`.** Se mudança de schema for necessária (e.g. para "marcar visto" persistente), vira `OutOfScopeFinding` para Phase Card de schema-changes ou ampliação de fase-5, com commit no master ANTES de aplicar.
- **Sem alterações em primitivos da fase-4** (Modal, Switch, Dropdown, Button, Input, Textarea, Select, Card, Badge, Avatar, Toast, ToggleChip, useFocusTrap, useFileUpload).
- **Sem alterações em queries/services da fase-3** (`@/lib/services/*`, `@/lib/queries`).
- **Sem CI nesta fase.** Smoke checks (lint, tsc, test, build) rodam local; CI fica para `fase-7-dx-infra`.
- **Sem refactor de bundle / code splitting amplo.** Lazy load de componentes pesados via `next/dynamic` é Non-Goal.
- **Sem auditoria WCAG ampla** — apenas a11y mínima (`aria-busy`, `role="alert"`/`role="status"`, `aria-label` em pt-BR).
- Tarefas marcadas com `*` produzem property tests (validam Properties em `design.md > Correctness Properties`).

## Tasks

- [x] 1. Validar pré-condições (Spawn-Readiness Gate)
  - [x] 1.1 Confirmar `requirements.md > §4` preenchida
    - Verificar que a linha `view-transitions` tem `path_consultado`, `trecho_relevante` e `decisao` preenchidos sem ambiguidade
    - Confirmar que `path_consultado` aponta para `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md` e `viewTransition.md` realmente existentes
    - Falha aqui = bloqueio duro (regra E5 de `design.md > Error Handling` do master)
    - _Requirements: 6.1, 6.3_

  - [x] 1.2 Confirmar fase-2 e fase-4 em `Done` no master
    - Ler `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\requirements.md` e validar que `Phase Card fase-2-testes` e `Phase Card fase-4-design-system` têm `state: Done` e `doneAt` ISO-8601 preenchidos
    - Confirmar `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\handoff.md` lista `fase-5-ux` como destravada
    - _Requirements: 1.1, 1.2_

  - [x] 1.3 Confirmar §3 inicialmente vazia
    - `requirements.md > §3 Achados fora de escopo` deve estar vazia ou conter linhas de placeholder claramente marcadas
    - Caso contrário, corrigir antes de prosseguir
    - _Requirements: 8.3_

- [x] 2. Inventário baseline das rotas
  - [x] 2.1 Criar `inventario-rotas.md` com cabeçalho e metodologia
    - Em `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-5-ux\inventario-rotas.md`
    - Seção 1: cabeçalho (autoria, data, master spec, phase id, count baseline `47 page.tsx + 25 route.ts = 72 rotas`)
    - Seção 2: metodologia (heurísticas das 5 categorias `tela_autenticada`/`listagem_publica`/`formulario`/`pagina_informativa`/`route_handler`; critérios `criar` para `loading.tsx` e `error.tsx`)
    - Seção 3: Inventário de rotas (tabela vazia, será preenchida em 2.2 e 2.3)
    - Seção 4: Listas vazias não migradas (vazia, preenchida durante Wave 3 se houver)
    - _Requirements: 1.3_

  - [x] 2.2 Listar as 47 `page.tsx` em `inventario-rotas.md > Inventário de rotas`
    - Rodar `Get-ChildItem -Path src/app -Recurse -Filter page.tsx` e capturar caminho de cada arquivo
    - Para cada rota, criar linha com colunas: `caminho`, `categoria`, `loading` (decisão), `error` (decisão), `justificativa` (≤ 30 palavras quando `nao_aplicavel`)
    - Confirmar count = 47; se diferente, registrar discrepância na própria seção e seguir
    - _Requirements: 1.1, 1.3, 1.4, 1.5_

  - [x] 2.3 Listar as 25 `route.ts` em `inventario-rotas.md > Inventário de rotas`
    - Mesma estrutura, com `categoria: route_handler`, `loading: nao_aplicavel`, `error: nao_aplicavel`
    - Justificativa única: "Route Handler — fallback via JSON com status apropriado"
    - Confirmar count = 25
    - _Requirements: 1.3, 1.6_

  - [x] 2.4 Validar contagem agregada
    - Soma de `loading: criar` + `loading: existente` + `loading: nao_aplicavel` deve igualar 72
    - Mesma soma para `error`
    - Identificar o subconjunto `loading: criar` que precisa de novo arquivo (estimativa: ≥ 25 rotas, dado que apenas 4 existem hoje)
    - _Requirements: 1.4, 1.5_

- [ ] 3. Wave EmptyState primitive
  - [ ] 3.1 Criar `src/components/ui/empty-state.tsx`
    - Implementar `<EmptyState>` com props `title`, `description?`, `icon?`, `action?`, `className?` conforme assinatura em `design.md > Components and Interfaces > 4`
    - Suportar `action.href` (renderiza `<Link>`), `action.onClick` (renderiza `<button>`), e ambos (prefere `href`, `onClick` como handler complementar)
    - Estilo via tokens da fase-4: `bg-white border border-black/[0.06] rounded-2xl px-6 py-14 text-center shadow-sm`, `text-xl font-semibold` no título, `text-md text-muted` na descrição
    - **Zero hex literal** e **zero `text-[Npx]`** no arquivo
    - _Requirements: 4.1, 4.2, 4.3, 4.6_

  - [ ] 3.2 Criar `src/components/ui/empty-state.test.ts`
    - Renderiza com props mínimas (`title`)
    - Renderiza com `description`, `icon`, `action.href` (renderiza `<a>`)
    - Renderiza com `action.onClick` (renderiza `<button>` que dispara handler)
    - `action.href` + `action.onClick`: `<Link>` é preferido, `onClick` é handler complementar
    - _Requirements: 4.2, 4.3_

  - [ ] 3.3 Aplicar `<EmptyState>` em `src/app/buscar/page.tsx:55-60` (busca vazia)
    - Substituir markup inline por `<EmptyState title="Nenhum perfil encontrado" description="..." action={{ label: "Limpar filtros", onClick: ... }} />`
    - Validar visualmente
    - _Requirements: 4.4_

  - [ ] 3.4 Aplicar `<EmptyState>` em `src/app/conta/perfil/favorites-list.tsx:36-42` (favoritos)
    - Substituir markup inline por `<EmptyState title="Nenhum perfil curtido ainda" description="Explore acompanhantes e curta os perfis que te interessam." icon={Heart} action={{ label: "Explorar", href: "/buscar" }} />`
    - _Requirements: 4.4_

  - [ ] 3.5 Aplicar `<EmptyState>` em `src/app/painel/financeiro/page.tsx:171-175` (histórico/financeiro)
    - Substituir markup inline por `<EmptyState title="Nenhum registro este mês" description="Use o formulário acima para registrar um encontro." />` (sem CTA — formulário já está acima)
    - _Requirements: 4.4_

  - [ ] 3.6 Aplicar `<EmptyState>` em `src/app/painel/avaliacoes/page.tsx:115-122` (avaliações)
    - Substituir markup inline por `<EmptyState title="Nenhuma avaliação ainda" description="As avaliações aparecem aqui depois que clientes assinantes visitarem seu perfil." icon={MessageSquare} />`
    - _Requirements: 4.4_

  - [ ] 3.7 Aplicar `<EmptyState>` em `src/app/painel/midias/midias-manager.tsx:235-240` (mídias do provider)
    - Substituir markup inline por `<EmptyState title="Nenhum item aqui ainda" description="..." icon={ImagePlus} action={{ label: "Adicionar mídia", onClick: ... }} />`
    - _Requirements: 4.4_

  - [ ] 3.8 Aplicar `<EmptyState>` em `src/app/admin/suporte/page.tsx:78-81` (suporte admin)
    - Substituir markup inline por `<EmptyState title="Nenhum chamado pendente" />`
    - _Requirements: 4.4_

  - [ ] 3.9 Migrar listas vazias adicionais quando trivial
    - Para cada um destes sites, decidir se migra para `<EmptyState>` ou registra em `inventario-rotas.md > Listas vazias não migradas`:
      - `src/app/em-alta/page.tsx:49-55`
      - `src/app/em-destaque/page.tsx:40-46`
      - `src/app/cidades/page.tsx:34-37`
      - `src/app/admin/midias/page.tsx:163-165`
      - `src/app/admin/moderacao/page.tsx:292-298` (provavelmente fica fora — tabela complexa)
      - `src/app/painel/stories/stories-manager.tsx:112-118`
      - `src/app/p/[slug]/page.tsx:469-471` (avaliações no perfil público)
    - Nota: sites com lógica embutida não-trivial podem permanecer como inline e ficam fora do escopo
    - _Requirements: 4.5_

- [ ] 4. Wave Loading state primitive
  - [ ] 4.1 Criar `src/components/ui/loading-skeleton.tsx`
    - Exportar `<LoadingSkeleton>` com prop `variant: "card" | "list" | "detail" | "form" | "gallery" | "text-block"`, `count?: number`, `className?: string`, `ariaLabel?: string` (default "Carregando...")
    - Cada variante implementa estrutura específica (cf. `design.md > Components and Interfaces > 2`)
    - Aplicar `aria-busy="true"` e `aria-label` no container raiz
    - **Zero hex literal** e **zero `text-[Npx]`** — usar tokens (`bg-black/[0.04]`, `bg-line`, classes da escala tipográfica para dimensionar)
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 4.2 Criar `src/components/ui/loading-skeleton.test.ts`
    - Cada variant renderiza container com `aria-busy="true"` e `aria-label` esperado
    - `count` controla número de itens repetidos (default por variant)
    - `className` é mesclado no container raiz (via `cn`)
    - _Requirements: 2.1, 2.2_

  - [ ] 4.3 Refatorar `src/app/painel/loading.tsx`
    - Substituir spinner genérico (`<div className="...animate-spin..." />`) por `<LoadingSkeleton variant="form" ariaLabel="Carregando painel" />`
    - Validar visualmente que a tela não regrediu
    - _Requirements: 2.4_

  - [ ] 4.4 Wave A — criar `loading.tsx` em rotas autenticadas do painel (Requirement 1.4)
    - Para cada rota classificada como `tela_autenticada` + `loading: criar` no inventário:
      - `src/app/painel/midias/loading.tsx` → `variant="gallery"`
      - `src/app/painel/perfil/loading.tsx` → `variant="form"`
      - `src/app/painel/plano/loading.tsx` → `variant="card"` (cards de plano)
      - `src/app/painel/reels/loading.tsx` → `variant="gallery"`
      - `src/app/painel/stories/loading.tsx` → `variant="gallery"`
      - `src/app/painel/suporte/loading.tsx` → `variant="list"`
      - `src/app/painel/suporte/[id]/loading.tsx` → `variant="detail"`
      - `src/app/painel/valores/loading.tsx` → `variant="form"`
      - `src/app/painel/disponibilidade/loading.tsx` → `variant="form"`
      - `src/app/painel/avaliacoes/loading.tsx` → `variant="list"`
    - Cada arquivo mínimo: `export default function PainelXxxLoading() { return <LoadingSkeleton variant="..." ariaLabel="Carregando ..." />; }`
    - _Requirements: 2.5, 1.4_

  - [ ] 4.5 Wave B — criar `loading.tsx` em rotas autenticadas de `/conta`
    - Para cada rota classificada como `tela_autenticada` + `loading: criar`:
      - `src/app/conta/perfil/loading.tsx` → `variant="form"`
      - `src/app/conta/verificacao/loading.tsx` → `variant="form"`
      - `src/app/conta/onboarding/perfil/loading.tsx` → `variant="form"`
      - `src/app/conta/onboarding/fotos/loading.tsx` → `variant="gallery"`
      - `src/app/conta/onboarding/valores/loading.tsx` → `variant="form"`
      - `src/app/conta/onboarding/publicar/loading.tsx` → `variant="card"`
    - _Requirements: 2.5, 1.4_

  - [ ] 4.6 Wave C — criar `loading.tsx` em listagens públicas / formulários
    - Para cada rota classificada como `listagem_publica` ou `formulario` + `loading: criar`:
      - `src/app/em-alta/loading.tsx` → `variant="card"`
      - `src/app/em-destaque/loading.tsx` → `variant="card"`
      - `src/app/cidades/loading.tsx` → `variant="list"`
      - `src/app/buscar/loading.tsx` → `variant="card"`
      - `src/app/reels/loading.tsx` → `variant="gallery"`
      - `src/app/reels/[slug]/loading.tsx` → `variant="gallery"`
      - `src/app/entrar/loading.tsx` → `variant="form"`
      - `src/app/recuperar-senha/loading.tsx` → `variant="form"`
      - `src/app/cadastro/loading.tsx` → `variant="form"`
      - `src/app/cadastro/{cliente,acompanhante}/loading.tsx` → `variant="form"`
      - `src/app/avaliar/[slug]/loading.tsx` → `variant="form"`
      - `src/app/solicitar/[slug]/loading.tsx` → `variant="form"`
    - _Requirements: 2.5, 1.4_

  - [ ] 4.7 Wave D — criar `loading.tsx` em rotas de admin
    - Para cada rota classificada como `tela_autenticada` (admin) + `loading: criar`:
      - `src/app/admin/loading.tsx` → `variant="list"`
      - `src/app/admin/perfis/loading.tsx` → `variant="list"`
      - `src/app/admin/midias/loading.tsx` → `variant="gallery"`
      - `src/app/admin/moderacao/loading.tsx` → `variant="list"`
      - `src/app/admin/suporte/loading.tsx` → `variant="list"`
      - `src/app/admin/suporte/[id]/loading.tsx` → `variant="detail"`
      - `src/app/admin/verificacoes/loading.tsx` → `variant="list"`
      - `src/app/admin/verificacoes/[id]/loading.tsx` → `variant="detail"`
      - `src/app/admin/cidades/loading.tsx` → `variant="list"`
    - _Requirements: 2.5, 1.4_

  - [ ] 4.8 Validar Property 2 (cobertura de loading)
    - Após Waves 4.4–4.7, rodar parser que valida cobertura conforme `design.md > Correctness Properties > Property 2`
    - Implementação: `*.test.ts` em `.kiro/specs/fase-5-ux/` ou em `src/app/` que parsa `inventario-rotas.md`, filtra linhas com `loading: criar`, e valida `existsSync` + `readFileSync().includes("LoadingSkeleton")`
    - _Requirements: 2.5, 1.4_
    - _Validates: Property 2 (parcial — `loading.tsx`)_

- [ ] 5. Wave Error boundary primitive
  - [ ] 5.1 Criar `src/components/ui/error-state.tsx`
    - Exportar `<ErrorState>` com props `title`, `description?`, `onRetry`, `homeHref?`, `variant?: "inline" | "page"`, `digest?`, `className?`
    - `role="alert"` quando `variant === "page"`, `role="status"` quando `variant === "inline"`
    - Botão "Tentar novamente" como `<button onClick={onRetry}>` (não `<a>`)
    - `homeHref` renderiza `<Link>` secundário
    - **Zero hex literal** e **zero `text-[Npx]`**
    - **Não expor** `error.message` nem `error.stack` — apenas `digest` opcional em texto pequeno (variant `page`)
    - _Requirements: 3.1, 3.2, 3.5, 3.6_

  - [ ] 5.2 Criar `src/components/ui/error-state.test.ts`
    - Renderiza com `variant="page"` aplica `role="alert"`
    - Renderiza com `variant="inline"` aplica `role="status"`
    - Botão "Tentar novamente" dispara `onRetry` ao clicar
    - `homeHref` renderiza link com `href` correto
    - `digest` aparece apenas quando `variant === "page"`
    - _Requirements: 3.2, 3.6_

  - [ ] 5.3 Refatorar os 4 `error.tsx` existentes
    - `src/app/error.tsx` → `<ErrorState variant="page" title="Algo deu errado" description="Ocorreu um erro inesperado. Tente novamente." onRetry={reset} digest={error.digest} />`
    - `src/app/painel/error.tsx` → `<ErrorState variant="page" title="Erro no painel" description="Não foi possível carregar esta página. Tente novamente." onRetry={reset} />`
    - `src/app/descobrir/[citySlug]/error.tsx` → `<ErrorState variant="page" title="Erro ao carregar" description="Não foi possível carregar os perfis desta cidade." onRetry={reset} />`
    - `src/app/p/[slug]/error.tsx` → `<ErrorState variant="page" title="Perfil indisponível" description="Não foi possível carregar este perfil." onRetry={reset} homeHref="/" />`
    - _Requirements: 3.3, 3.4_

  - [ ] 5.4 Wave A — criar `error.tsx` em rotas com `loading.tsx` recém-criado (Wave 4)
    - Para cada rota classificada como `error: criar` no inventário (espelha as rotas com `loading: criar` da Wave 4):
      - `src/app/painel/{midias,perfil,plano,reels,stories,suporte,valores,disponibilidade,avaliacoes}/error.tsx`
      - `src/app/painel/suporte/[id]/error.tsx`
      - `src/app/conta/{perfil,verificacao}/error.tsx`
      - `src/app/conta/onboarding/{perfil,fotos,valores,publicar}/error.tsx`
      - `src/app/em-alta/error.tsx`, `src/app/em-destaque/error.tsx`, `src/app/cidades/error.tsx`, `src/app/buscar/error.tsx`
      - `src/app/reels/error.tsx`, `src/app/reels/[slug]/error.tsx`
      - `src/app/admin/{perfis,midias,moderacao,suporte,verificacoes,cidades}/error.tsx`
      - `src/app/admin/suporte/[id]/error.tsx`, `src/app/admin/verificacoes/[id]/error.tsx`
    - Cada arquivo mínimo: `"use client"; export default function XxxError({ error, reset }) { return <ErrorState variant="page" title="Erro ao carregar" onRetry={reset} digest={error.digest} />; }`
    - _Requirements: 3.3, 1.5_

  - [ ] 5.5 Validar Property 2 (cobertura de error)
    - Estender o parser de 4.8 para validar `error.tsx`
    - Filtrar linhas com `error: criar`, validar `existsSync` + `readFileSync().includes("ErrorState")`
    - _Requirements: 3.3, 1.5_
    - _Validates: Property 2 (completa — `error.tsx`)_

- [ ] 6. Wave UI otimista com rollback
  - [ ] 6.1 Criar `src/lib/hooks/use-optimistic-toggle.ts`
    - Implementar `useOptimisticToggle<T>` com `useOptimistic` + `useState` + `useTransition` conforme `design.md > Components and Interfaces > 5`
    - Export retorna `{ value, committed, toggle, pending }`
    - Em erro: `onError?(err)` é chamado e `committed` permanece inalterado (rollback automático via `useOptimistic`)
    - Re-exportar em `src/lib/hooks/index.ts`
    - _Requirements: 5.1, 5.2, 5.5_

  - [ ] 6.2 Criar `src/lib/hooks/use-optimistic-toggle.test.ts`
    - Toggle → action sucesso → `committed` atualiza para valor do servidor
    - Toggle → action falha (Promise.reject) → `committed` permanece, `onError` é chamado
    - Pending fica `true` durante a transition, `false` ao final
    - Múltiplos toggles em sequência convergem corretamente
    - _Requirements: 5.2, 5.5_

  - [ ] 6.3 * Criar `src/lib/hooks/use-optimistic-toggle.pbt.ts` (Property 1)
    - Property 1 (rollback idempotente): para todo `s0` e sequência `[(t_i, success_i)]`, `committed_final` = última `t_i` com sucesso (ou `s0`); `value_final === committed_final`
    - Geradores: `fc.boolean()` para `T`; `fc.array(fc.tuple(fc.boolean(), fc.boolean()), { minLength: 1, maxLength: 10 })` para sequências
    - Mock `action` que resolve/rejeita conforme bit
    - `numRuns: 100` (default herdado de `fase-2-testes`)
    - _Requirements: 5.7_
    - _Validates: Property 1_

  - [ ] 6.4 Refatorar `src/components/profile/favorite-button.tsx`
    - Substituir `useState(initialFavorited)` + `useTransition` + `setFavorited` manual por `useOptimisticToggle({ initialValue: initialFavorited, action: async (next) => { const res = await toggleFavorite(profileId); if ('error' in res) throw new Error(res.error); return res.favorited; }, onError: (err) => toast(err.message, "error") })`
    - `disabled={pending}` no botão para evitar dupla submissão
    - _Requirements: 5.3, 5.5, 5.6_

  - [ ] 6.5 Refatorar `src/lib/hooks/use-media-actions.ts`
    - Substituir fetch direto por wrapper que usa `useOptimisticToggle` para `toggleLike`
    - Preservar API pública do hook (mesmas funções exportadas) para não quebrar consumidores
    - _Requirements: 5.4_

  - [ ] 6.6 Refatorar `src/components/stories/story-bar.tsx:170-180` (`toggleLike`)
    - Migrar `toggleLike` para `useOptimisticToggle`
    - Lint herdado em `story-bar.tsx`: corrigir o que sair barato como efeito colateral; deixar o resto para fase-7
    - _Requirements: 5.4, 5.5, 5.6_

  - [ ] 6.7 Refatorar `src/components/reels/reels-feed.tsx:115-130` (`toggleLike`)
    - Migrar `toggleLike` para `useOptimisticToggle`
    - _Requirements: 5.4, 5.5, 5.6_

  - [ ] 6.8 Refatorar `src/components/profile/media-gallery.tsx:130-150` (`toggleLike`)
    - Migrar `toggleLike` para `useOptimisticToggle`
    - Lint herdado em `media-gallery.tsx`: corrigir o que sair barato; resto para fase-7
    - _Requirements: 5.4, 5.5, 5.6_

  - [ ] 6.9 Refatorar `src/components/profile/profile-story-cover.tsx:141-160` (`toggleLike`)
    - Migrar `toggleLike` para `useOptimisticToggle`
    - Lint herdado em `profile-story-cover.tsx`: idem
    - _Requirements: 5.4, 5.5, 5.6_

- [ ] 7. Wave View Transitions (com AGENTS_Rule)
  - [ ] 7.1 Re-validar consulta AGENTS_Rule antes da primeira decisão técnica
    - Confirmar que `requirements.md > §4` ainda está preenchida (regra dura E5)
    - Caso houver minor do Next entre a redação e esta wave, **adicionar nova linha** na §4 (não sobrescrever)
    - _Requirements: 6.1_

  - [ ] 7.2 Ativar `experimental.viewTransition: true` em `next.config.ts`
    - Adicionar `experimental: { viewTransition: true }` (e demais flags se já houver `experimental` block)
    - Comentário inline citando `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/viewTransition.md` + data
    - Rodar `npm run build` e validar exit 0
    - Se build falhar com warning relacionada a `viewTransition`, registrar em `OutOfScopeFinding` e desativar a flag
    - _Requirements: 6.2, 6.6_

  - [ ] 7.3 Adicionar keyframes CSS auxiliares em `src/app/globals.css`
    - `@keyframes fade`, `@keyframes slide-y`, `@keyframes slide` (com `--slide-offset` variable)
    - `::view-transition-old/new(.slide-down)`, `::view-transition-old/new(.slide-up)` (Suspense reveal)
    - `::view-transition-old/new(.nav-forward)`, `::view-transition-old/new(.nav-back)` (directional slide)
    - Variáveis `--vt-duration-exit: 150ms`, `--vt-duration-enter: 210ms` em `:root`
    - **Zero hex literal** novo no arquivo (cores via tokens existentes)
    - _Requirements: 6.4_

  - [ ] 7.4 Aplicar Suspense reveal em `src/app/p/[slug]/page.tsx`
    - Refatorar para envolver o conteúdo em `<Suspense fallback={<ViewTransition exit="slide-down"><ProfileDetailSkeleton /></ViewTransition>}>` + `<ViewTransition enter="slide-up" default="none">{conteúdo}</ViewTransition>`
    - Importar `ViewTransition` de `react`
    - Validar manualmente: navegar para um perfil deve mostrar slide-down do skeleton + slide-up do conteúdo
    - _Requirements: 6.3_

  - [ ] 7.5 Aplicar same-route crossfade em `src/app/descobrir/[citySlug]/page.tsx`
    - Envolver o grid em `<ViewTransition key={citySlug} name="discover-grid" share="auto" enter="auto" default="none">{grid}</ViewTransition>`
    - Header e filtros permanecem fora do `<ViewTransition>`
    - Validar manualmente: trocar de cidade deve fazer crossfade no grid
    - _Requirements: 6.3_

  - [ ] 7.6 Criar helper `src/app/conta/onboarding/onboarding-nav.tsx`
    - Exportar `OnboardingNext({ href, children })` (renderiza `<Link transitionTypes={['nav-forward']}>`) e `OnboardingBack({ href, children })` (`'nav-back'`)
    - Helper consumido pelos 4 page.tsx do onboarding
    - _Requirements: 6.3_

  - [ ] 7.7 Aplicar directional slide nos 4 page.tsx do onboarding
    - Para cada `src/app/conta/onboarding/{perfil,fotos,valores,publicar}/page.tsx`, envolver o conteúdo em `<ViewTransition enter={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }} exit={{ ... }} default="none">{conteúdo}</ViewTransition>`
    - Substituir `<Link>` de "Próximo" por `<OnboardingNext>` e "Voltar" por `<OnboardingBack>` onde aplicável
    - Validar manualmente: avançar entre passos deve fazer slide left, voltar deve fazer slide right
    - _Requirements: 6.3_

  - [ ] 7.8 Confirmar que shared element morph NÃO foi adotado
    - Validar via `grep_search` que nenhum `<ViewTransition name="photo-...`>` foi introduzido
    - Registrar em `inventario-rotas.md > Decisões` que shared element morph fica como candidata futura
    - _Requirements: 6.5_

- [ ] 8. Wave prefers-reduced-motion
  - [ ] 8.1 Adicionar regra global em `src/app/globals.css`
    - Adicionar `@media (prefers-reduced-motion: reduce) { ... }` cobrindo:
      - `*, *::before, *::after { animation-duration: 0.01ms !important; animation-delay: 0.01ms !important; transition-duration: 0.01ms !important; transition-delay: 0.01ms !important; }`
      - `::view-transition-old(*), ::view-transition-new(*), ::view-transition-group(*) { animation-duration: 0s !important; animation-delay: 0s !important; }`
    - Validar visualmente em `Chrome DevTools > Rendering > Emulate CSS media feature prefers-reduced-motion: reduce`
    - _Requirements: 7.1, 7.2_

  - [ ] 8.2 Confirmar que microinterações novas (Wave 3-7) são cobertas pela regra global
    - Listar microinterações introduzidas: `<EmptyState>` (sem animação própria — só hover de CTA), `<LoadingSkeleton>` (animate-pulse), `<ErrorState>` (sem animação), `<ViewTransition>` (Wave 7)
    - Confirmar que todas são CSS-side e cobertas pela regra global
    - Não criar regras paralelas isoladas
    - _Requirements: 7.3, 7.5_

  - [ ] 8.3 * Criar teste de Property 3 (`globals-css-reduced-motion.test.ts`)
    - Parser textual lê `src/app/globals.css` e valida:
      - `@media (prefers-reduced-motion: reduce)` está presente
      - Bloco contém `*, *::before, *::after` com `animation-duration` e `transition-duration`
      - Bloco contém `::view-transition-old(*)`, `::view-transition-new(*)`, `::view-transition-group(*)`
    - Pode rodar como `*.test.ts` simples (não fast-check — é assertion paramétrica)
    - _Requirements: 7.4_
    - _Validates: Property 3_

  - [ ] 8.4 Documentar protocolo em `design.md` (já feito) e validar em revisão
    - Confirmar que `design.md > Components and Interfaces > 7. Microinteraction com prefers-reduced-motion` documenta:
      - Onde mora a regra global (`src/app/globals.css`)
      - Critério para adicionar nova microinteração (CSS-only > JS-side; usar `useReducedMotion` apenas se necessário)
      - Como validar em ambiente local
    - _Requirements: 7.5_

- [ ] 9. PBTs co-localizados (gate de testes)
  - [ ] 9.1 * Validar `use-optimistic-toggle.pbt.ts` (Property 1) rodando verde
    - `npx vitest --run src/lib/hooks/use-optimistic-toggle.pbt.ts` termina com exit 0
    - Anexar log de saída em `inventario-rotas.md > Smoke checks`
    - Se falhar, persistir contraexemplo conforme `fase-2-testes/testing-conventions.md > §3`
    - _Requirements: 5.7_
    - _Validates: Property 1_

  - [ ] 9.2 Validar Property 2 (cobertura de loading + error) rodando verde
    - `npx vitest --run` no arquivo do parser (4.8 + 5.5)
    - Cada linha do inventário com `loading: criar` ou `error: criar` deve ter arquivo correspondente
    - Anexar log em `inventario-rotas.md > Smoke checks`
    - _Requirements: 1.4, 1.5, 2.5, 3.3_
    - _Validates: Property 2_

  - [ ] 9.3 * Validar Property 3 (`globals-css-reduced-motion.test.ts`) rodando verde
    - `npx vitest --run` no arquivo do parser (8.3)
    - Anexar log em `inventario-rotas.md > Smoke checks`
    - _Requirements: 7.4_
    - _Validates: Property 3_

  - [ ] 9.4 Validar suite completa de testes não regrediu
    - `npm run test` termina com exit 0 e todos os testes passam
    - Numero de testes deve ser ≥ ao baseline da fase-4 (172 testes em 2026-05-17)
    - _Requirements: 7.4_

- [ ] 10. Smoke checks finais
  - [ ] 10.1 `npm run lint` — registrar baseline
    - Esperado: 0 errors **novos** introduzidos pela fase-5 em arquivos do escopo
    - Erros pré-existentes em `age-gate.tsx`, `profile-story-cover`, `story-bar`, `media-gallery`, `painel/midias/midias-manager`, `painel/perfil/page.tsx`, `painel/plano/upgrade-button.tsx`, etc. podem permanecer (pertencem à fase-7); refactor da Wave 6 pode resolver alguns como efeito colateral
    - Anexar log em `inventario-rotas.md > Smoke checks finais`
    - _Requirements: 6.6_

  - [ ] 10.2 `npx tsc --noEmit` — zero erros de tipo
    - Bloqueio duro: se houver erros, corrigir antes de prosseguir
    - _Requirements: 6.6_

  - [ ] 10.3 `npm run test` — todos os testes verdes
    - Bloqueio duro
    - Anexar log
    - _Requirements: 5.7, 7.4_

  - [ ] 10.4 `npm run build` — build limpo com `experimental.viewTransition: true`
    - Bloqueio duro: build precisa terminar com exit 0
    - Confirmar que `experimental.viewTransition` é registrado nos warnings do Next como flag experimental aceita (não como deprecated/erro)
    - Confirmar que count de rotas no output do build permanece estável (estimativa: 71 rotas, conforme baseline herdado da fase-4)
    - _Requirements: 6.2, 6.6_

  - [ ] 10.5 Smoke browser manual em desenvolvimento (`npm run dev`)
    - Validar visualmente os 3 padrões de View Transition:
      - Suspense reveal em `/p/[slug]` (skeleton → conteúdo com slide-up)
      - Same-route crossfade em `/descobrir/[citySlug]` (trocar cidade)
      - Directional slide no onboarding (avançar e voltar)
    - Validar `prefers-reduced-motion: reduce` via DevTools — animações devem ser instantâneas
    - Anexar nota em `inventario-rotas.md > Smoke browser manual` com browser usado e resultado
    - _Requirements: 6.3, 7.2_

- [ ] 11. Saída desta fase
  - [ ] 11.1 Validar saída
    - Todos os 8 Requirements de `requirements.md` têm evidência (path:linha de código, log de teste, ou link de PR/commit) anexada
    - `inventario-rotas.md` cobre as 4 seções (cabeçalho, metodologia, 72 linhas de inventário, listas vazias não migradas, smoke checks)
    - `requirements.md > §3 OutOfScopeFinding` está vazia ou cada linha aponta commit no master spec
    - `requirements.md > §4 AGENTS_Rule` tem 1 linha preenchida (`view-transitions`)
    - `<LoadingSkeleton>`, `<ErrorState>`, `<EmptyState>` existem em `src/components/ui/` com testes determinísticos
    - `useOptimisticToggle` existe em `src/lib/hooks/` com PBT verde
    - `experimental.viewTransition: true` em `next.config.ts`, com 3 padrões aplicados
    - Regra global `@media (prefers-reduced-motion: reduce)` em `globals.css`
    - Properties 1, 2, 3 rodam verde
    - _Requirements: 1.3, 2.5, 3.3, 4.4, 5.7, 6.2, 7.4, 8.1_

  - [ ] 11.2 [orquestrador] Atualizar Phase Card no master `requirements.md`
    - **Esta tarefa é executada pelo orquestrador, não pelo executor da fase**
    - `state: SpawnReady` ou `InProgress` → `state: Done`
    - Adicionar `doneAt` ISO-8601 no formato `YYYY-MM-DDTHH:MM:SSZ`
    - Manter `child_spec_path` apontando para esta pasta
    - Re-rodar Spawn-Readiness Gate em `fase-6-mobile-cross-browser` (dependente direta — depende de fase-4 + fase-5)
    - Documentar no `handoff.md` que `fase-5-ux` está `Done` e listar fases destravadas a seguir
    - _Requirements: 8.3_

## Notes

- Tarefas com `*` (6.3, 8.3, 9.1, 9.3) entregam testes baseados em propriedade conforme as Properties declaradas em `design.md > Correctness Properties`. Tarefa 9.2 entrega teste paramétrico determinístico (Property 2 — cobertura). Tarefas sem `*` entregam código de produto, testes determinísticos ou documentação.
- Wave 4 (Loading) e Wave 5 (Error) são as ondas de maior densidade — terminar primeiro elas reduz o número de rotas sem fallback em ≈80% e libera as waves posteriores para serem rápidas.
- Wave 6 (UI otimista) toca arquivos com lint herdado pesado. O refactor pode resolver vários errors como efeito colateral, mas não é objetivo declarado — é trade-off aceitável.
- Wave 7 (View Transitions) depende da consulta AGENTS_Rule re-validada em 7.1. Se uma minor do Next mudar comportamento entre a redação e esta wave, **adicionar nova linha** em §4 (não sobrescrever).
- Tarefas que tocam o mesmo arquivo (ex.: `globals.css` em 7.3 + 8.1; `next.config.ts` em 7.2; `requirements.md > §4` em 1.1 + 7.1) ficam em ondas distintas no grafo abaixo para evitar conflito de edição.
- Toda alteração que extrapole o escopo desta fase **NÃO** é absorvida — vira `OutOfScopeFinding` em `requirements.md > §3` com commit no master.
- Schema do Prisma (`prisma/schema.prisma`) é INTOCADO durante toda esta fase. Se necessário, vira `OutOfScopeFinding` antes de qualquer mudança.
- Lazy load de componentes pesados via `next/dynamic` é Non-Goal — apenas skeletons locais.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3"] },
    { "id": 3, "tasks": ["2.4"] },
    { "id": 4, "tasks": ["3.1", "4.1", "5.1", "6.1"] },
    { "id": 5, "tasks": ["3.2", "4.2", "5.2", "6.2"] },
    { "id": 6, "tasks": ["6.3"] },
    { "id": 7, "tasks": ["3.3", "3.4", "3.5", "3.6", "3.7", "3.8", "3.9"] },
    { "id": 8, "tasks": ["4.3"] },
    { "id": 9, "tasks": ["4.4", "4.5", "4.6", "4.7"] },
    { "id": 10, "tasks": ["4.8"] },
    { "id": 11, "tasks": ["5.3"] },
    { "id": 12, "tasks": ["5.4"] },
    { "id": 13, "tasks": ["5.5"] },
    { "id": 14, "tasks": ["6.4", "6.5"] },
    { "id": 15, "tasks": ["6.6", "6.7", "6.8", "6.9"] },
    { "id": 16, "tasks": ["7.1"] },
    { "id": 17, "tasks": ["7.2"] },
    { "id": 18, "tasks": ["7.3"] },
    { "id": 19, "tasks": ["7.4", "7.5", "7.6"] },
    { "id": 20, "tasks": ["7.7"] },
    { "id": 21, "tasks": ["7.8"] },
    { "id": 22, "tasks": ["8.1"] },
    { "id": 23, "tasks": ["8.2", "8.3", "8.4"] },
    { "id": 24, "tasks": ["9.1", "9.2", "9.3", "9.4"] },
    { "id": 25, "tasks": ["10.1", "10.2", "10.3", "10.4", "10.5"] },
    { "id": 26, "tasks": ["11.1"] },
    { "id": 27, "tasks": ["11.2"] }
  ]
}
```
