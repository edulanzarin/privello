# Requirements Document

> Spec-filho `fase-5-ux` promovido a partir do master spec da Auditoria Geral.
> Master: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\requirements.md`.

---

## Introduction

Este spec-filho executa a **Fase 5 — Polimento de UX premium** do roadmap mestre `auditoria-geral`. O objetivo é padronizar feedback de carregamento, erro e transição em todas as rotas relevantes do App Router, introduzindo `<ViewTransition>` (React 19 + flag `experimental.viewTransition`) e UI otimista (`useOptimistic` + `useTransition`) onde fizer sentido, sem comprometer `prefers-reduced-motion`.

A fase tem **fase-2-testes** (`Done` em 2026-05-16T04:46:53Z, commit `b5a8fe0`) e **fase-4-design-system** (`Done` em 2026-05-17T00:00:00Z) como predecessoras no grafo (`PROMOCAO.md > §5`). Pode rodar em paralelo com `fase-7-dx-infra` (são file-disjoint — fase-5 toca `loading.tsx`/`error.tsx`/EmptyState/UI otimista em `src/app/**` e `src/components/**`; fase-7 toca CI/docker/env/`src/lib/**`). Toca exatamente **uma** `NextApiArea` (`view-transitions`) e por isso a §4 deste documento é obrigatória antes da primeira decisão técnica nessa área — regra dura E5 de `design.md > Error Handling` do master.

Os EARS herdados do `Requirement 6` do master spec definem o resultado esperado; novos requisitos abaixo destrincham as superfícies tocadas e adicionam EARS de detalhe verificáveis. Achados que extrapolarem o escopo voltam ao master via `OutOfScopeFinding` (§3).

---

## 1. Cabeçalho de proveniência

- **master_spec_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\requirements.md`
- **master_design_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\design.md`
- **phase_id**: `fase-5-ux`
- **phase_title**: Polimento de UX premium
- **promoted_at**: 2026-05-17
- **child_spec_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-5-ux\`
- **bridge_contract**: `design.md > Components and Interfaces > Child Spec Bridge`
- **agents_rule_areas**: `view-transitions`
- **historical_refs**:
  - `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\_archive\ux-premium-phase4`
  - `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\_archive\ux-premium-polish`
  - `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\_archive\final-polish-phase`

### Critérios de aceite herdados (EARS)

Os EARS abaixo foram copiados literalmente do `Requirement 6` do master spec. Eles definem o resultado esperado desta fase; novos requisitos podem **detalhar** as superfícies tocadas, mas não podem contradizer ou ampliar o escopo declarado aqui — o que extrapolar volta ao master via `OutOfScopeFinding` (§3).

- **Requirement 6.1** — `THE Phase_5_Spec SHALL inventariar as ~78 rotas e classificar quais precisam de loading.tsx próprio, partindo da meta de cobrir 100% das rotas com tela autenticada e/ou listagem dinâmica.`
- **Requirement 6.2** — `THE Phase_5_Spec SHALL inventariar as rotas que precisam de error.tsx (no mínimo todas as loading.tsx correspondentes), com fallback acessível e botão "Tentar novamente".`
- **Requirement 6.3** — `WHERE for aplicável, THE Phase_5_Spec SHALL avaliar uso de View Transitions do Next 16, respeitando AGENTS_Rule (consultar node_modules/next/dist/docs/, área view-transitions).`
- **Requirement 6.4** — `THE Phase_5_Spec SHALL definir padrão de UI otimista para ações frequentes (curtir, favoritar, marcar visto), com rollback em caso de erro.`
- **Requirement 6.5** — `THE Phase_5_Spec SHALL exigir conformidade com prefers-reduced-motion em todas as microinterações introduzidas.`
- **Requirement 6.6** — `THE Phase_5_Spec SHALL definir EmptyState reutilizável e sua aplicação em listas vazias (busca, favoritos, histórico, financeiro).`
- **Requirement 6.7** — `THE Phase_5_Spec SHALL declarar fora de escopo: acessibilidade ampla (auditoria WCAG completa entra em fase futura ou Fase 6 quando ligada a mobile/screen reader).`

---

## 2. Revalidação

> Origem: três specs arquivados (`ux-premium-phase4`, `ux-premium-polish`, `final-polish-phase`). Cada Requirement do(s) spec(s) arquivado(s) é classificado em `Confirmado` / `Resolvido` / `Reescopado` segundo `design.md > Components and Interfaces > Child Spec Bridge` do master, com evidência (path:linha real ou commit) verificável contra o estado atual do código. Inventário medido em 2026-05-17: **47 `page.tsx` + 25 `route.ts` em `src/app/**`** (total = **72 rotas**, incluindo Route Handlers; o número "~78" do master é uma aproximação que abrange `layout.tsx`/`route.ts`/segmentos auxiliares); **4 `loading.tsx`** existentes (`src/app/painel/loading.tsx`, `src/app/painel/financeiro/loading.tsx`, `src/app/descobrir/[citySlug]/loading.tsx`, `src/app/p/[slug]/loading.tsx`); **4 `error.tsx`** existentes (`src/app/error.tsx`, `src/app/painel/error.tsx`, `src/app/descobrir/[citySlug]/error.tsx`, `src/app/p/[slug]/error.tsx`); **1 `not-found.tsx`** (`src/app/not-found.tsx`); **0 ocorrências** de `useOptimistic` em `src/`; **0 ocorrências** de `prefers-reduced-motion` em `src/` ou `globals.css`; primitivo `EmptyState` **inexistente** em `src/components/ui/`.

### 2.1 `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\_archive\ux-premium-phase4`

- **archived_spec_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\_archive\ux-premium-phase4`
- **scope**: `ux`

#### Itens herdados

- **Item**: Skeleton loaders contextuais (Requirement 1 do arquivado — variantes para card grid, profile detail, dashboard stats, tabela, media gallery, form sections, sidebar; `aria-busy`).
- **Origem no spec arquivado**: `requirements.md > Requirement 1`.
- **Estado**: `Confirmado`.
- **evidence**: `src/app/descobrir/[citySlug]/loading.tsx:1-23` (skeleton de grid 2/3 col já existe e serve de template); `src/app/p/[slug]/loading.tsx:1-28`; `src/app/painel/loading.tsx:1-9` (spinner genérico — precisa virar skeleton estruturado); `src/components/profile/media-gallery.tsx`, `src/components/reels/reels-feed.tsx`, `src/components/stories/story-bar.tsx`, `src/components/painel/media-manager.tsx`, `src/app/painel/perfil/perfil-editor.tsx` (componentes pesados sem skeleton local).
- **Tarefa derivada**: cobrir EARs 6.1, 6.5 nas Waves 4 (Loading state primitive + aplicação em rotas) e 7 (componentes pesados). Skeletons exóticos (e.g. timing 1.5s shimmer, 50ms aparição) não são copiados literal — vira o que o design system permite com `animate-pulse` + tokens.

- **Item**: Page transitions (fade + translateY 8px, `cubic-bezier(0.16, 1, 0.3, 1)`, restauração de scroll) — Requirement 2 do arquivado.
- **Origem no spec arquivado**: `requirements.md > Requirement 2`.
- **Estado**: `Reescopado`.
- **EARS original (mantido)**: `THE UX_Engine SHALL apply a Page_Transition animation with fade and subtle vertical slide (opacity 0→1, translateY 8px→0) using 250ms duration and cubic-bezier(0.16, 1, 0.3, 1) easing`.
- **Alvo atual**: o **modelo mudou no Next 16**. Em vez de animações JS imperativas, a fase usa `<ViewTransition>` do React 19 + flag `experimental.viewTransition` documentada em `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md` (consulta em §4). Restauração de scroll nativa do App Router já cuida do scroll-restore do back; o que era "scroll-restore manual" do spec arquivado entra como `Resolvido`. Animações específicas (slide, fade, easing) ficam parametrizadas por classes CSS auxiliares descritas no design.
- **evidence**: ausência de qualquer ocorrência de `view-transition-name` ou `<ViewTransition>` em `src/` (verificado por `grep_search` em 2026-05-17); flag `experimental.viewTransition` ausente em `next.config.ts`.
- **Tarefa derivada**: cobrir EAR 6.3 na Wave 6 (View Transitions com AGENTS_Rule).
- **Impacto no master spec**: nenhum — o master já reconhece em `requirements.md > Requirement 6 > Phase Card > agents_rule_areas` que View Transitions é avaliada com consulta obrigatória a `node_modules/next/dist/docs/`.

- **Item**: Microinterações (scale 0.97 ao press, hover translateY -1px, color pulse em toggle, focus ring) e respeito a `prefers-reduced-motion` — Requirements 3 e 12 do arquivado.
- **Origem no spec arquivado**: `requirements.md > Requirements 3, 12`.
- **Estado**: `Confirmado`.
- **evidence**: já há `active:scale-[0.97]` em alguns botões (`src/app/not-found.tsx:18,25`), mas **0 ocorrências** de `prefers-reduced-motion` em `src/` ou `globals.css` (verificado por `grep_search` em 2026-05-17). Microinterações vivem dispersas sem padrão; sem media query de motion-reduce.
- **Tarefa derivada**: cobrir EAR 6.5 na Wave 8 (utility CSS `prefers-reduced-motion` em `globals.css` + hook opcional `useReducedMotion` se necessário). Aplicar globalmente via `@media (prefers-reduced-motion: reduce)` neutralizando `transition` e `animation-duration`.

- **Item**: Feedback visual (toast com checkmark, shake em erro, progress bar de upload, ARIA live region) — Requirement 4 do arquivado.
- **Origem no spec arquivado**: `requirements.md > Requirement 4`.
- **Estado**: `Resolvido` (parcial — toast já existe; checkmark/shake/progress são extras visuais que não viram tarefa nesta fase).
- **evidence**: `src/components/ui/toast.tsx` (primitivo `useToast` + `Toast` provider já existem desde fase-1/2); `src/lib/hooks/use-file-upload.ts` (já entregue por fase-4 com `strategy: "xhr"` + `onProgress`).
- **Observação**: animações cosméticas extras (overshoot scale, shake horizontal de 3px, progress determinístico com numeração textual) ficam **fora** desta fase. UI otimista substitui o "salvar com checkmark" para ações triviais (curtir/favoritar/marcar visto) — não há valor em duplicar com toast para essas ações.

- **Item**: EmptyState reutilizável com variantes (favoritos, solicitações, mídias, avaliações, busca, transações, suporte, genérica) — Requirement 5 do arquivado.
- **Origem no spec arquivado**: `requirements.md > Requirement 5`.
- **Estado**: `Confirmado`.
- **evidence**: `EmptyState` **inexistente** em `src/components/ui/` (verificado por `file_search` em 2026-05-17 — diretório atual: `avatar.tsx`, `badge.tsx`, `button.tsx`, `card.tsx`, `dropdown.{tsx,test,pbt}`, `input.tsx`, `modal.{tsx,test}`, `select.tsx`, `stat-card.tsx`, `switch.tsx`, `textarea.tsx`, `toast.tsx`, `toggle-chip.tsx`); pelo menos 14 sites com lista vazia ad-hoc identificados (`src/app/p/[slug]/page.tsx:469-471`, `src/app/painel/midias/midias-manager.tsx:235-240`, `src/app/painel/avaliacoes/page.tsx:115-122`, `src/app/conta/perfil/favorites-list.tsx:36-42`, `src/app/em-alta/page.tsx:49-55`, `src/app/em-destaque/page.tsx:40-46`, `src/app/cidades/page.tsx:34-37`, `src/app/buscar/page.tsx:55-60`, `src/app/admin/midias/page.tsx:163-165`, `src/app/admin/suporte/page.tsx:78-81`, `src/app/admin/moderacao/page.tsx:292-298`, `src/app/painel/financeiro/page.tsx:171-175`, `src/app/painel/stories/stories-manager.tsx:112-118`, `src/app/conta/onboarding/perfil/perfil-form.tsx:205-208`).
- **Tarefa derivada**: cobrir EAR 6.6 na Wave 3 (criar `src/components/ui/empty-state.tsx` + aplicar em listas vazias).

- **Item**: Navegação e discoverability (active highlight 6%, breadcrumb, tooltip de feature nova, bottom nav mobile) — Requirement 6 do arquivado.
- **Origem no spec arquivado**: `requirements.md > Requirement 6`.
- **Estado**: `Reescopado`.
- **EARS original (mantido)**: `WHILE the viewport width is <768px, THE UX_Engine SHALL display a fixed bottom navigation bar with 4 section icons and labels`.
- **Alvo atual**: bottom nav mobile e breakpoints de toque cabem em **fase-6-mobile-cross-browser > Requirements 1-4** (matriz de browsers, alvo de toque, bottom-sheets). Nesta fase, apenas microinterações como `prefers-reduced-motion` viram entregáveis.
- **evidence**: `src/components/layout/bottom-nav.tsx` já existe; redesign não é tema desta fase.
- **Impacto no master spec**: nenhum (já mapeado para fase-6).

- **Item**: Onboarding flow premium (progress bar, slide horizontal, celebration animation) — Requirement 7 do arquivado.
- **Origem no spec arquivado**: `requirements.md > Requirement 7`.
- **Estado**: `Reescopado`.
- **EARS original (mantido)**: `WHEN the user completes a step in the Onboarding_Flow, THE UX_Engine SHALL animate the progress bar advancement with a 400ms ease transition`.
- **Alvo atual**: animações específicas do onboarding são caso particular de `<ViewTransition>` ou microinteração com `prefers-reduced-motion`. Celebração ("confetti") não vira entregável; entra como nota de fora de escopo. As 4 rotas do onboarding (`src/app/conta/onboarding/{perfil,fotos,valores,publicar}/page.tsx`) recebem `loading.tsx`/`error.tsx` na Wave 4 como qualquer outra rota autenticada.
- **Impacto no master spec**: nenhum.

- **Item**: Loading states para ações assíncronas (button disabled + spinner, descritivo após 3s, timeout em 15s, "Tentar novamente") — Requirement 8 do arquivado.
- **Origem no spec arquivado**: `requirements.md > Requirement 8`.
- **Estado**: `Resolvido` (parcial — disabled + spinner já é padrão via `useTransition` em 14 sites; descritivo após 3s e timeout em 15s ficam fora do escopo).
- **evidence**: `useTransition` aplicado em 14 sites (verificado por `grep_search` em 2026-05-17 — ex.: `src/components/profile/favorite-button.tsx:17`, `src/components/painel/save-form.tsx:19`, `src/app/entrar/login-form.tsx:9`, `src/components/painel/reels-manager.tsx:22`, `src/components/painel/logout-button.tsx:8`, etc.).
- **Observação**: a UI otimista da Wave 5 cobre o caso de "ação trivial" (curtir/favoritar/marcar visto). Para ações pesadas (upload, save de form), o padrão `useTransition + disabled` permanece — não vira tarefa.

- **Item**: Hierarquia visual e clareza (spacing rhythm, primary CTA "Mais opções" para >5 botões, escala tipográfica) — Requirement 9 do arquivado.
- **Origem no spec arquivado**: `requirements.md > Requirement 9`.
- **Estado**: `Resolvido`.
- **evidence**: entregue por `fase-4-design-system > Requirements 1, 2, 3` (escala tipográfica `text-2xs` a `text-8xl`, spacing rhythm via tokens, Dropdown primitivo para "Mais opções"). Ver `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-4-design-system\tokens.md > Escala tipográfica explícita`.
- **Observação**: NÃO entra como tarefa.

- **Item**: UX mobile e desktop (44×44 toque, bottom sheet, pull-to-refresh, hover hint, atalhos de teclado, multi-coluna ≥1024px) — Requirements 10, 11 do arquivado.
- **Origem no spec arquivado**: `requirements.md > Requirements 10, 11`.
- **Estado**: `Reescopado`.
- **EARS original (mantido)**: `WHILE the viewport width is 768px or less, THE UX_Engine SHALL ensure all touch targets have a minimum size of 44x44px`.
- **Alvo atual**: cabe em **fase-6-mobile-cross-browser > Requirement 7.2** (alvo mínimo de toque) e Requirements 7.4–7.5 (bottom-sheet, teclado virtual). Não é desta fase.
- **Impacto no master spec**: nenhum.

- **Item**: Coerência visual entre páginas (page-padding, card-padding, form pattern, ícone sizing) — Requirement 13 do arquivado.
- **Origem no spec arquivado**: `requirements.md > Requirement 13`.
- **Estado**: `Resolvido`.
- **evidence**: entregue por `fase-4-design-system > Requirements 1, 2, 3` (tokens semânticos, escala tipográfica, primitivos consolidados). NÃO entra como tarefa.

- **Item**: Velocidade percebida com UI otimista (toggle dentro de 100ms, rollback em 5000ms, prefetch ao hover, blur placeholder em imagens) — Requirement 14 do arquivado.
- **Origem no spec arquivado**: `requirements.md > Requirement 14`.
- **Estado**: `Confirmado`.
- **evidence**: 0 ocorrências de `useOptimistic` em `src/` (verificado por `grep_search` em 2026-05-17). `src/components/profile/favorite-button.tsx:17` usa `setFavorited(...)` síncrono **antes** de `await toggleFavorite(profileId)` — é otimismo manual sem rollback estruturado em erro: o estado fica dessincronizado se o servidor responder com erro depois do `setState`. `src/lib/hooks/use-media-actions.ts:17-46` faz fetch síncrono sem otimismo. `src/components/stories/story-bar.tsx:170-180`, `src/components/reels/reels-feed.tsx:115-130`, `src/components/profile/media-gallery.tsx:130-150`, `src/components/profile/profile-story-cover.tsx:141-160` — todos com padrão similar de "toggle local + fetch sem rollback".
- **Tarefa derivada**: cobrir EAR 6.4 na Wave 5 (padrão UI otimista com `useOptimistic` + `useTransition` + rollback formal em erro). Substitui o "otimismo manual sem rollback" por padrão correto.

### 2.2 `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\_archive\ux-premium-polish`

- **archived_spec_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\_archive\ux-premium-polish`
- **scope**: `ux`

#### Itens herdados

- **Item**: Polimento dos itens da `ux-premium-phase4` que ficaram pendentes (sem `requirements.md`/`design.md`/`tasks.md` próprios — diretório arquivado contém apenas `.config.kiro`).
- **Origem no spec arquivado**: estrutura ausente; spec arquivado não chegou a produzir requirements.
- **Estado**: `Resolvido` (em parte, dado que o spec não chegou a definir EARs próprios; a lacuna é coberta por esta fase via revalidação de `ux-premium-phase4`).
- **evidence**: `Get-ChildItem .kiro/specs/_archive/ux-premium-polish` retorna apenas `.config.kiro` (verificado por `list_directory` em 2026-05-17).
- **Observação**: nenhum item pendente próprio. NÃO vira tarefa adicional.

### 2.3 `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\_archive\final-polish-phase`

- **archived_spec_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\_archive\final-polish-phase`
- **scope**: `ux`

#### Itens herdados

- **Item**: Itens finais de polimento (sem `requirements.md`/`design.md`/`tasks.md` próprios — diretório arquivado contém apenas `.config.kiro`).
- **Origem no spec arquivado**: estrutura ausente.
- **Estado**: `Resolvido`.
- **evidence**: `Get-ChildItem .kiro/specs/_archive/final-polish-phase` retorna apenas `.config.kiro` (verificado por `list_directory` em 2026-05-17).
- **Observação**: nenhum item pendente próprio. NÃO vira tarefa adicional.

### 2.4 Cobertura WCAG ampla (Non-Goal explícito do master)

- **Item**: Auditoria WCAG completa (contraste, navegação por teclado total, screen reader em todos os fluxos).
- **Origem no spec arquivado**: derivado de `ux-premium-phase4 > Requirement 4.8` (ARIA live regions) e Requirements 6, 10 (acessibilidade básica).
- **Estado**: `Resolvido` (Non-Goal explícito).
- **evidence**: `auditoria-geral/requirements.md > Requirement 6 > Phase Card > out_of_scope`: `acessibilidade ampla (auditoria WCAG completa entra em fase futura ou Fase 6 quando ligada a mobile/screen reader)`.
- **Observação**: a fase mantém apenas a11y mínima (ARIA `aria-busy` em loading, `role="alert"` em erro com botão "Tentar novamente", `aria-live="polite"` para toast de rollback). Auditoria ampla NÃO vira tarefa.

### 2.5 Resumo de classificações

| Estado | Quantidade | Itens |
|---|---:|---|
| `Confirmado` | 4 | Skeleton loaders contextuais, Microinterações + `prefers-reduced-motion`, EmptyState reutilizável, UI otimista com rollback |
| `Resolvido` | 7 | Toasts/feedback (já entregue por fase-1/2/4), Loading states de ação (`useTransition` aplicado), Hierarquia visual (fase-4), Coerência visual (fase-4), `ux-premium-polish` (vazio), `final-polish-phase` (vazio), WCAG ampla (Non-Goal master) |
| `Reescopado` | 4 | Page transitions → View Transitions, Bottom nav mobile → fase-6, Onboarding flow → microinteração genérica, UX mobile/desktop → fase-6 |

---

## 3. Achados fora de escopo

> Nenhum achado fora de escopo registrado nesta fase no momento da promoção.

Cada novo achado relevante que extrapolar o escopo desta fase será registrado como uma linha desta tabela (schema `OutOfScopeFinding` de `design.md > Data Models` do master) e disparará commit no master spec, **nunca** absorção silenciosa pelo spec-filho (regra dura E4 de `design.md > Error Handling`).

| discoveredIn | description | proposedTarget | evidence |
|---|---|---|---|
| _(vazio até a primeira descoberta)_ | | | |

---

## 4. Consultas a `node_modules/next/dist/docs/` (AGENTS_Rule)

Esta seção é OBRIGATÓRIA antes da primeira decisão técnica que toque a `NextApiArea` deste Phase Card (`view-transitions`). Cada linha registra a evidência da consulta, conforme exigido pela regra dura E5 de `design.md > Error Handling` do master e por `AGENTS.md`. Esta versão do Next.js (16.x) tem breaking changes em relação a conhecimento prévio — sem evidência registrada, qualquer decisão sobre essa área é bloqueada pelo revisor.

| area | path_consultado | trecho_relevante | decisao |
|---|---|---|---|
| `view-transitions` | `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md` + `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/viewTransition.md` | "experimental: { viewTransition: true } enables React's `<ViewTransition>` integration; activated by Transitions, Suspense, useDeferredValue; route navigations are transitions" — `<ViewTransition>` é componente React 19 com props `name`, `share`, `enter`, `exit`, `default`; `<Link transitionTypes>` tagueia direção. Animações via `::view-transition-old/new(<class>)` e keyframes CSS. `prefers-reduced-motion: reduce` deve neutralizar `animation-duration`. | **Adotar com adoção condicional rota a rota** durante a Wave 6: ativar `experimental.viewTransition: true` em `next.config.ts`, aplicar `<ViewTransition>` apenas em casos com ganho real (Suspense reveal em `/p/[slug]`, crossfade em troca de tab `/descobrir`, slide direcional em onboarding). Registrar `@media (prefers-reduced-motion: reduce)` neutralizando `::view-transition-old/new(*)` (Wave 8). Sem morfismo de mídia (shared element entre grid e detalhe) nesta fase — fica para fase futura. _(consulta em 2026-05-17)_ |

> Atualizações posteriores (mudança de versão menor, contradição encontrada na prática) viram linhas adicionais. Não se sobrescreve linha existente.

---

## Glossary

- **Phase_5_Spec**: este documento e os artefatos produzidos sob `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-5-ux\`.
- **Loading_State**: arquivo `loading.tsx` em segmento de App Router OU `<Suspense fallback={...}>` no JSX, exibindo skeleton estruturado (não spinner genérico) enquanto dados são carregados.
- **Error_State**: arquivo `error.tsx` em segmento de App Router, com fallback acessível (`role="alert"` ou texto semântico equivalente) e botão "Tentar novamente" que chama `reset()`.
- **Empty_State**: primitivo `<EmptyState>` em `src/components/ui/empty-state.tsx`, exibido quando uma lista/grid retorna zero itens, com `title`, `description`, `icon?`, `action?`.
- **Optimistic_Action**: ação cliente→servidor (curtir, favoritar, marcar visto) onde o estado local é atualizado **antes** da resposta do servidor, com rollback automático em erro via `useOptimistic` + `useTransition` + `try/catch`.
- **View_Transition**: animação visual entre estados/rotas via `<ViewTransition>` do React 19 + flag `experimental.viewTransition` em `next.config.ts`. Inclui shared element morph, Suspense reveal, directional slide, same-route crossfade.
- **Reduced_Motion**: media query CSS `@media (prefers-reduced-motion: reduce)` que neutraliza `animation-duration` e `transition-duration` para usuários com sensibilidade a movimento.
- **Microinteraction**: animação curta de feedback (button press scale, hover translateY, focus ring) que **DEVE** respeitar `Reduced_Motion`.
- **Heavy_Component**: componente cliente pesado (`media-gallery.tsx` ~23KB, `reels-feed.tsx` ~15KB, `story-bar.tsx` ~14KB, `media-manager.tsx` ~13KB, `perfil-editor.tsx` ~23KB) que precisa de skeleton local de rota.
- **NextApiArea**: vocabulário definido em `design.md > Data Models > NextApiArea` do master. Para esta fase: `view-transitions`.
- **Route_Inventory**: documento canônico `inventario-rotas.md` no diretório do spec-filho, com 47 `page.tsx` + 25 `route.ts` classificados quanto à necessidade de `loading.tsx`/`error.tsx`/`<Suspense>`.

---

## 5. Itens fora de escopo (Non-Goals)

Os itens abaixo NÃO fazem parte desta fase e não devem virar tarefa:

1. **Auditoria WCAG completa** (contraste, navegação por teclado total, screen reader em todos os fluxos). _(EAR 6.7 herdado.)_
2. **Mudanças em primitivos de `fase-4-design-system`** (Modal, Switch, Dropdown, Button, Input, Textarea, Select, Card, Badge, Avatar, Toast, ToggleChip, useFocusTrap, useFileUpload). Refactor desses primitivos vira `OutOfScopeFinding` para ampliar fase-4 ou nova fase.
3. **Mudanças em queries/services de `fase-3-backend`** (`src/lib/services/*.service.ts`, `src/lib/queries.ts`, paginação cursor-based). Esta fase apenas consome a API existente.
4. **Mudanças em `prisma/schema.prisma`** (sem novos índices, sem novas colunas, sem novos modelos).
5. **Mudanças em segurança / Zod / rate-limit** (escopo de `fase-1-seguranca`, já `Done`).
6. **CI / lint config / `eslint.config.mjs`** — vão para `fase-7-dx-infra`.
7. **UX mobile específica**: alvo mínimo de toque 44×44, bottom-sheet, pull-to-refresh, teclado virtual, gestos (overscroll, pinch, swipe entre fotos com snap). Vão para `fase-6-mobile-cross-browser`.
8. **Cross-browser fidelity**: Safari iOS, Firefox, Edge, diff visual com mockups em `design/`. Vão para `fase-6-mobile-cross-browser`.
9. **Otimização de bundle / code splitting**: lazy loading de `media-gallery`/`reels-feed`/`story-bar` via `next/dynamic` é **opcional** nesta fase (apenas se for prerequisito direto de skeleton); refactor amplo de bundle vira `OutOfScopeFinding`.
10. **SEO, Core Web Vitals, sitemap, JSON-LD, blur placeholders em `next/image`** — vão para fase futura ou parcialmente fase-7.
11. **Onboarding redesign** (progress bar visual, celebração, slide horizontal entre passos como animação JS imperativa). Apenas microinterações genéricas com `prefers-reduced-motion` viram entregável; redesign completo do onboarding fica fora.
12. **Toast/feedback visual avançado** (overshoot scale em checkmark, shake horizontal de 3px, ARIA live region adicional). O primitivo `Toast` atual basta; melhorias cosméticas viram `OutOfScopeFinding`.
13. **Componentes pesados consolidados** (refactor de `media-gallery` + `media-manager`, `reels-feed` + `reels-manager`). A fase pode adicionar skeleton local mas NÃO refactora a estrutura desses componentes.
14. **`<ViewTransition>` shared element morph entre grid e detalhe** (Step 1 do guia consultado em §4). Adoção fica para fase futura — nesta fase, apenas Suspense reveal, directional slide e same-route crossfade.

Qualquer item que apareça nesta lista mas se mostre necessário durante a execução vira `OutOfScopeFinding` (§3) e exige commit no master spec antes de ser absorvido.

---

## Requirements

> Os requisitos abaixo são os EARS herdados (Requirement 6.1–6.7 do master) **destrinchados** por superfície tocada. Cada bloco identifica os arquivos envolvidos, mantém o EARS herdado como referência e adiciona EARS de detalhe que serão validados pelo spec-filho.

### Requirement 1: Inventário e classificação das rotas do App Router

**User Story:** Como mantenedor, quero saber, rota a rota, qual estratégia de feedback de carregamento e erro aplicar, para não criar `loading.tsx`/`error.tsx` redundantes nem deixar rotas autenticadas sem fallback.

**Inputs:** as 47 `page.tsx` + 25 `route.ts` em `src/app/**` (count via `Get-ChildItem -Recurse` em 2026-05-17); 4 `loading.tsx` + 4 `error.tsx` + 1 `not-found.tsx` existentes; `src/app/layout.tsx` e dois `layout.tsx` aninhados (3 layouts).

#### Acceptance Criteria

1. THE Phase_5_Spec SHALL inventariar as ~78 rotas e classificar quais precisam de `loading.tsx` próprio, partindo da meta de cobrir 100% das rotas com tela autenticada e/ou listagem dinâmica. _(EARS herdada — Requirement 6.1 do master.)_
2. THE Phase_5_Spec SHALL inventariar as rotas que precisam de `error.tsx` (no mínimo todas as `loading.tsx` correspondentes), com fallback acessível e botão "Tentar novamente". _(EARS herdada — Requirement 6.2 do master.)_
3. THE Phase_5_Spec SHALL produzir, em `inventario-rotas.md`, uma tabela com **uma linha por `page.tsx` + uma linha por `route.ts`** (mínimo 72 linhas) onde cada linha contém: (a) caminho da rota (ex.: `src/app/painel/avaliacoes/page.tsx`), (b) categoria (`tela_autenticada` | `listagem_publica` | `formulario` | `pagina_informativa` | `route_handler`), (c) decisão sobre `loading.tsx` (`existente` | `criar` | `nao_aplicavel`), (d) decisão sobre `error.tsx` (mesmas opções), (e) justificativa em ≤ 30 palavras quando a decisão for `nao_aplicavel`.
4. THE Phase_5_Spec SHALL classificar como `criar` para `loading.tsx` **toda** rota que satisfaça pelo menos uma destas condições: (a) é tela autenticada (`auth()` em RSC), (b) faz `await` em service que toca DB, (c) renderiza listagem dinâmica de mais de 10 itens. Rotas estáticas (informativas) ficam como `nao_aplicavel`.
5. THE Phase_5_Spec SHALL classificar como `criar` para `error.tsx` **no mínimo** todas as rotas com `loading.tsx` decidido como `existente` ou `criar` na mesma rota ou em ancestor segment. Route Handlers (`route.ts`) ficam como `nao_aplicavel` para `error.tsx` (fallback é via response JSON).
6. WHERE Route Handlers retornarem 5xx, THE Phase_5_Spec SHALL exigir que o handler retorne JSON com `{ error: string }` e status apropriado, sem absorver o erro silenciosamente. Esta verificação é por amostragem (não exaustiva — exaustiva é Non-Goal).

### Requirement 2: Loading state primitive padronizado

**User Story:** Como usuário, quero ver placeholders consistentes em todas as telas que carregam, para que a interface pareça rápida e previsível.

**Inputs:** primitivos de `fase-4-design-system` (`Card`, `Avatar`, tokens de espaçamento e cor); `src/app/descobrir/[citySlug]/loading.tsx` e `src/app/p/[slug]/loading.tsx` como referência de padrão; `src/app/painel/loading.tsx` (atualmente spinner genérico — **substituir** por skeleton estruturado).

#### Acceptance Criteria

1. THE Phase_5_Spec SHALL criar um primitivo `<LoadingSkeleton>` em `src/components/ui/loading-skeleton.tsx` com variantes `card`, `list`, `detail`, `form`, `gallery`, `text-block` que possam ser compostas para cobrir os layouts típicos das rotas inventariadas no Requirement 1.
2. WHEN um `<LoadingSkeleton>` é renderizado, THE Phase_5_Spec SHALL aplicar `aria-busy="true"` e `aria-label` (em pt-BR, ex.: `"Carregando perfis"`) ao container principal para que tecnologias assistivas anunciem o estado de carregamento.
3. THE Phase_5_Spec SHALL utilizar exclusivamente tokens de `fase-4-design-system` (`bg-black/[0.04]`, `bg-line`, `text-muted`, classes de escala tipográfica `text-xs` a `text-3xl`, etc.) na implementação do `<LoadingSkeleton>` — zero hex literal e zero `text-[Npx]`.
4. THE Phase_5_Spec SHALL reescrever `src/app/painel/loading.tsx` para consumir o primitivo `<LoadingSkeleton>` em vez do spinner genérico atual, mantendo paridade visual mínima ou superior com a página painel.
5. THE Phase_5_Spec SHALL aplicar `loading.tsx` com `<LoadingSkeleton>` em **toda** rota classificada como `criar` no Requirement 1.4.
6. WHERE animação de shimmer (`animate-pulse`) for utilizada, THE Phase_5_Spec SHALL respeitar `prefers-reduced-motion: reduce` neutralizando a animação (cobertura via Requirement 7).

### Requirement 3: Error boundary padronizado

**User Story:** Como usuário, quero saber que algo deu errado e ter um caminho para recuperar, em vez de ver tela em branco ou mensagem técnica.

**Inputs:** `src/app/error.tsx`, `src/app/painel/error.tsx`, `src/app/descobrir/[citySlug]/error.tsx`, `src/app/p/[slug]/error.tsx` como referência; primitivos `Button` e tokens de `fase-4-design-system`.

#### Acceptance Criteria

1. THE Phase_5_Spec SHALL criar um primitivo `<ErrorState>` em `src/components/ui/error-state.tsx` com props `title: string`, `description?: string`, `onRetry: () => void`, `homeHref?: string`, e `variant?: "inline" | "page"`.
2. WHEN um `<ErrorState>` é renderizado, THE Phase_5_Spec SHALL aplicar `role="alert"` (ou `role="status"` quando `variant === "inline"`) ao container e renderizar o botão "Tentar novamente" como `<button onClick={onRetry}>` (não `<a>`).
3. THE Phase_5_Spec SHALL aplicar `error.tsx` consumindo `<ErrorState>` em **toda** rota classificada como `criar` no Requirement 1.5, preservando a assinatura `(error: Error & { digest?: string }, reset: () => void) => JSX.Element` exigida pelo App Router.
4. THE Phase_5_Spec SHALL preservar o conteúdo dos 4 `error.tsx` existentes (root, painel, descobrir, p) ao migrá-los para `<ErrorState>` — texto principal e ação de "Tentar novamente" continuam disponíveis.
5. THE Phase_5_Spec SHALL utilizar exclusivamente tokens de `fase-4-design-system` na implementação do `<ErrorState>` — zero hex literal e zero `text-[Npx]`.
6. THE Phase_5_Spec SHALL NÃO expor `error.message` nem `error.stack` no UI público; apenas o `digest` opcional pode aparecer em texto pequeno se a `variant === "page"` (útil para suporte). Mensagens humanas em pt-BR são definidas pelo consumidor.

### Requirement 4: EmptyState primitivo

**User Story:** Como usuário, quero ver mensagens úteis e uma ação sugerida quando uma lista está vazia, para saber o que fazer e não me sentir perdido.

**Inputs:** as 14 listas vazias ad-hoc identificadas em §2.1 (item EmptyState); primitivos `Button` e tokens de `fase-4-design-system`.

#### Acceptance Criteria

1. THE Phase_5_Spec SHALL definir EmptyState reutilizável e sua aplicação em listas vazias (busca, favoritos, histórico, financeiro). _(EARS herdada — Requirement 6.6 do master.)_
2. THE Phase_5_Spec SHALL criar `src/components/ui/empty-state.tsx` exportando `<EmptyState>` com a assinatura TS:
   ```ts
   export interface EmptyStateProps {
     title: string;                 // ≤ 60 caracteres
     description?: string;          // ≤ 160 caracteres
     icon?: LucideIcon | ReactNode; // ícone opcional do design system
     action?: { label: string; href?: string; onClick?: () => void };
     className?: string;
   }
   export function EmptyState(props: EmptyStateProps): JSX.Element;
   ```
3. WHEN `<EmptyState>` é renderizado com `action`, THE Phase_5_Spec SHALL renderizar o CTA como `<a>` (quando `href` informado) OU `<button>` (quando `onClick` informado), nunca ambos. IF ambos forem informados, THEN a Phase_5_Spec SHALL preferir `href` e tratar `onClick` como handler complementar (não-bloqueante).
4. THE Phase_5_Spec SHALL aplicar `<EmptyState>` em **no mínimo** as seguintes 6 listas vazias (cobertura mandatória dos contextos do EAR 6.6 — busca, favoritos, histórico/financeiro, mais 3 críticas):
   - **busca**: `src/app/buscar/page.tsx:55-60` (lista global vazia).
   - **favoritos**: `src/app/conta/perfil/favorites-list.tsx:36-42`.
   - **histórico/financeiro**: `src/app/painel/financeiro/page.tsx:171-175`.
   - **avaliações recebidas**: `src/app/painel/avaliacoes/page.tsx:115-122`.
   - **mídias do provider**: `src/app/painel/midias/midias-manager.tsx:235-240`.
   - **suporte (admin)**: `src/app/admin/suporte/page.tsx:78-81`.
5. WHERE outros sites com lista vazia ad-hoc forem encontrados durante a execução (ex.: `em-alta`, `em-destaque`, `cidades`, `admin/midias`, `admin/moderacao`, `painel/stories/stories-manager`), THE Phase_5_Spec SHALL migrá-los para `<EmptyState>` se a estrutura permitir (RSC ou Client Component que recebe `items: T[]`); sites com lógica embutida não-trivial (ex.: `admin/moderacao` que renderiza tabela) podem permanecer com texto inline e ficar fora do escopo desta fase, registrado como nota.
6. THE Phase_5_Spec SHALL utilizar exclusivamente tokens de `fase-4-design-system` na implementação do `<EmptyState>` — zero hex literal e zero `text-[Npx]`.

### Requirement 5: UI otimista com rollback

**User Story:** Como usuário, quero que ações triviais (curtir, favoritar, marcar visto) reflitam instantaneamente no UI, com rollback automático se o servidor falhar, para que a interface pareça rápida sem mentir.

**Inputs:** Server Actions existentes — `src/app/_actions/favorites.ts > toggleFavorite`, `src/app/_actions/track-view.ts > trackProfileView`; Route Handler `src/app/api/media/like/route.ts` (POST `{ mediaId, liked }`); consumidores atuais com otimismo manual sem rollback estruturado: `src/components/profile/favorite-button.tsx:17`, `src/components/stories/story-bar.tsx:170-180`, `src/components/reels/reels-feed.tsx:115-130`, `src/components/profile/media-gallery.tsx:130-150`, `src/components/profile/profile-story-cover.tsx:141-160`, `src/lib/hooks/use-media-actions.ts:17-46`.

#### Acceptance Criteria

1. THE Phase_5_Spec SHALL definir padrão de UI otimista para ações frequentes (curtir, favoritar, marcar visto), com rollback em caso de erro. _(EARS herdada — Requirement 6.4 do master.)_
2. THE Phase_5_Spec SHALL adotar o padrão React 19 `useOptimistic` + `useTransition` + `try/catch` para essas ações, registrando o padrão como referência em `design.md > Components and Interfaces > 5. UI otimista`.
3. THE Phase_5_Spec SHALL refatorar `src/components/profile/favorite-button.tsx` para usar o padrão definido em 5.2, eliminando o estado dessincronizado em erro (hoje `setFavorited(...)` é chamado antes do `await toggleFavorite(...)` sem rollback explícito).
4. THE Phase_5_Spec SHALL refatorar os 5 sites de "toggle de like / view" listados em Inputs (`story-bar`, `reels-feed`, `media-gallery`, `profile-story-cover`, `use-media-actions`) para usar o padrão definido em 5.2 com rollback formal.
5. WHEN uma `Optimistic_Action` falha (servidor retorna erro ou exceção é lançada), THE Phase_5_Spec SHALL reverter o estado otimista para o valor original e exibir feedback de erro via primitivo `useToast` existente (`src/components/ui/toast.tsx`), com texto curto em pt-BR (ex.: `"Não foi possível curtir este perfil. Tente novamente."`).
6. WHILE uma `Optimistic_Action` está pendente, THE Phase_5_Spec SHALL desabilitar o trigger (botão) via `disabled={isPending}` para evitar dupla submissão; o estado visual otimista (UI já mostrando o "depois") permanece visível até a confirmação ou rollback.
7. THE Phase_5_Spec SHALL co-localizar pelo menos uma propriedade (`*.pbt.ts`) validando a invariante de **idempotência do rollback** — para qualquer estado `s0`, executar `optimistic(s0, action)` seguido de rollback retorna a `s0` (Property 1 declarada em `design.md > Correctness Properties`).

### Requirement 6: View Transitions com AGENTS_Rule

**User Story:** Como usuário, quero que transições entre rotas e estados Suspense pareçam contínuas, para que o produto pareça um app moderno em vez de um conjunto de páginas independentes.

**Inputs:** consulta a `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md` e `viewTransition.md` registrada em §4; `next.config.ts` (atualmente sem `experimental.viewTransition`); rotas candidatas — `/p/[slug]` (Suspense reveal entre skeleton e detalhe), `/descobrir/[citySlug]` (crossfade de same-route quando troca filtro/sort), `/conta/onboarding/{perfil,fotos,valores,publicar}` (slide direcional entre passos).

#### Acceptance Criteria

1. WHERE for aplicável, THE Phase_5_Spec SHALL avaliar uso de View Transitions do Next 16, respeitando AGENTS_Rule (consultar `node_modules/next/dist/docs/`, área `view-transitions`). _(EARS herdada — Requirement 6.3 do master.)_
2. THE Phase_5_Spec SHALL ativar `experimental.viewTransition: true` em `next.config.ts` em commit dedicado, com comentário inline citando o `path_consultado` registrado em §4 e a data da decisão.
3. THE Phase_5_Spec SHALL aplicar `<ViewTransition>` em **no mínimo** os 3 padrões abaixo, conforme o guia consultado:
   - **Suspense reveal** em `src/app/p/[slug]/page.tsx` (skeleton → detalhe), com `enter="slide-up"` e `exit="slide-down"`, `default="none"`.
   - **Same-route crossfade** em `src/app/descobrir/[citySlug]/page.tsx` quando o slug ou os filtros mudam, com `key={citySlug}`, `share="auto"`, `enter="auto"`.
   - **Directional slide** entre os 4 passos do onboarding (`/conta/onboarding/{perfil,fotos,valores,publicar}`), via `<Link transitionTypes={['nav-forward']}>` (avançar) e `<Link transitionTypes={['nav-back']}>` (voltar) + `<ViewTransition>` mapeando `enter`/`exit` por tipo.
4. THE Phase_5_Spec SHALL adicionar keyframes CSS auxiliares em `src/app/globals.css` (`@keyframes fade`, `@keyframes slide-y`, `@keyframes slide` + classes `::view-transition-old/new(.slide-up | .slide-down | .nav-forward | .nav-back)`) seguindo a estrutura do guia consultado, e SHALL **respeitar `prefers-reduced-motion: reduce`** neutralizando `animation-duration` e `animation-delay` para `::view-transition-old/new(*)` e `::view-transition-group(*)`.
5. THE Phase_5_Spec SHALL **não adotar** shared element morph entre grid e detalhe (Step 1 do guia consultado) nesta fase. Adoção fica registrada em `design.md > Out of scope` como candidata futura, com justificativa de que o ganho exige refactor amplo de `MediaGallery` (consolidação de mídia entre listagem e detalhe).
6. WHEN `experimental.viewTransition: true` for ativado, THE Phase_5_Spec SHALL rodar `npm run build` e validar que o build termina com exit 0 e não introduz nova warning relacionada a `viewTransition`. IF aparecer warning específica desconhecida, THEN registrar como `OutOfScopeFinding` com proposta de upgrade para versão minor do Next ou desligar a flag.

### Requirement 7: Conformidade com `prefers-reduced-motion`

**User Story:** Como usuário com sensibilidade a movimento (vestibular, enxaqueca, autismo), quero que o sistema desligue animações quando eu sinalizo isso no SO, para que a interface não cause mal-estar.

**Inputs:** `src/app/globals.css` (sem ocorrências atuais de `prefers-reduced-motion` — confirmado via `grep_search` em 2026-05-17); microinterações dispersas (`active:scale-[0.97]`, `transition-opacity`, `animate-pulse`, etc.) que precisam ser cobertas globalmente.

#### Acceptance Criteria

1. THE Phase_5_Spec SHALL exigir conformidade com `prefers-reduced-motion` em todas as microinterações introduzidas. _(EARS herdada — Requirement 6.5 do master.)_
2. THE Phase_5_Spec SHALL adicionar em `src/app/globals.css` uma regra global `@media (prefers-reduced-motion: reduce)` que neutralize `animation-duration` e `transition-duration` para todos os elementos (`*, *::before, *::after`) e para `::view-transition-old(*), ::view-transition-new(*), ::view-transition-group(*)`, e SHALL preservar transições de `opacity` (crossfade) quando trivialmente possível, conforme orientação do guia consultado em §4.
3. WHERE qualquer microinteração for introduzida nesta fase (e.g. nova animação no `<EmptyState>`, no `<LoadingSkeleton>` ou no `<ErrorState>`), THE Phase_5_Spec SHALL validar que ela é coberta pela regra global de 7.2 — não cria regra paralela isolada.
4. THE Phase_5_Spec SHALL co-localizar pelo menos uma propriedade (`*.pbt.ts`) validando a invariante de **conformidade reduced-motion** — para toda animação introduzida, presença simulada de `prefers-reduced-motion: reduce` resulta em `animation-duration === 0s` (Property 3 declarada em `design.md > Correctness Properties`). Implementação aceita: o teste valida a regra CSS via parsing do arquivo `globals.css` ou stub de `window.matchMedia` em ambiente jsdom.
5. THE Phase_5_Spec SHALL documentar em `design.md > Components and Interfaces > 7. Microinteraction com prefers-reduced-motion` o utility CSS adotado e o protocolo para introduzir novas microinterações sem quebrar a conformidade.

### Requirement 8: Itens fora de escopo declarados

**User Story:** Como mantenedor, quero que itens fora de escopo apareçam explicitamente, para que ninguém os absorva por engano.

#### Acceptance Criteria

1. THE Phase_5_Spec SHALL declarar fora de escopo: acessibilidade ampla (auditoria WCAG completa entra em fase futura ou Fase 6 quando ligada a mobile/screen reader). _(EARS herdada — Requirement 6.7 do master.)_
2. THE Phase_5_Spec SHALL declarar fora de escopo os 14 itens listados em §5 (Non-Goals) deste documento, com referência cruzada explícita.
3. WHEN um item da seção §5 deste documento aparecer durante a execução, THE Phase_5_Spec SHALL registrá-lo como `OutOfScopeFinding` na §3 deste documento e abrir commit no master spec antes de qualquer absorção.

---

## Saída desta fase

A Fase 5 é considerada `Done` quando:

- Todos os 8 Requirements desta seção têm seus EARS verificáveis e há evidência (path:linha de código, log de teste, ou link de PR) anexada para cada um.
- A §4 deste documento (AGENTS_Rule) tem linha preenchida para `view-transitions` **antes** da primeira decisão técnica que toque essa área.
- A §3 deste documento (`OutOfScopeFinding`) tem cada linha referenciando um commit no master spec, ou está marcada como vazia.
- `inventario-rotas.md` existe com no mínimo 72 linhas (47 page + 25 route) classificadas conforme Requirement 1.3.
- `<LoadingSkeleton>`, `<ErrorState>` e `<EmptyState>` existem em `src/components/ui/` com testes determinísticos co-localizados.
- Padrão de UI otimista aplicado a `favorite-button` e aos 5 sites de like/view listados em Requirement 5.4, com rollback validado por property test.
- `experimental.viewTransition: true` ativado em `next.config.ts` com pelo menos 3 padrões aplicados (Suspense reveal, same-route crossfade, directional slide no onboarding).
- Regra global `@media (prefers-reduced-motion: reduce)` em `globals.css` com cobertura validada por property test (Property 3).
- Properties 1, 2, 3 de `design.md > Correctness Properties` rodam verde via `npm run test`.
- `npm run lint`, `npx tsc --noEmit`, `npm run test`, `npm run build` terminam com exit 0 (lint pode ter erros pré-existentes herdados — sem regressões novas).
- O Phase Card desta fase no master `requirements.md` foi atualizado para `state: Done` com `doneAt` ISO-8601 e link para esta pasta.
