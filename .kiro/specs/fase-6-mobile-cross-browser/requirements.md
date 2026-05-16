# Requirements Document

> Spec-filho `fase-6-mobile-cross-browser` promovido a partir do master spec da Auditoria Geral.
> Master: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\requirements.md`.

---

## Introduction

Este spec-filho executa a **Fase 6 — Mobile, cross-browser e fidelidade aos mockups** do roadmap mestre `auditoria-geral`. É a **última fase** da auditoria — depois dela, todas as 7 fases do master ficam `Done`. O objetivo é garantir paridade comportamental e visual em iPhone Safari, Android Chrome, desktop Safari/Firefox/Edge, alinhando a implementação aos 11 mockups em `design/` e tratando especificidades de toque, teclado virtual e gestos.

A fase tem **fase-4-design-system** (`Done` em 2026-05-17T00:00:00Z) e **fase-5-ux** (`Done` em 2026-05-17T00:00:00Z) como predecessoras no grafo (`PROMOCAO.md > §5`); ambas satisfeitas, gate plenamente atendido. Pode rodar isolada — não há outra fase pendente que dispute arquivos.

A fase **NÃO toca APIs do Next.js**. Mobile/cross-browser é puramente client-side: ajustes em `src/components/**` (controles), `src/app/**` (telas correspondentes aos mockups), CSS (`touch-action`, `overscroll-behavior`, viewport units), `playwright.config.ts` para a matriz de browsers. Por isso a §4 deste documento registra `n/a` para AGENTS_Rule. Se durante a execução algo exigir tocar API do Next, deve virar `OutOfScopeFinding` (§3), não absorver.

Os EARS herdados do `Requirement 7` do master spec definem o resultado esperado; novos requisitos abaixo destrincham as superfícies tocadas e adicionam EARS de detalhe verificáveis. Os dois specs arquivados herdados (`_archive/ux-premium-polish` e `_archive/final-polish-phase`) contêm apenas `.config.kiro` (sem requirements/design/tasks próprios produzidos) e por isso seus itens entram como `Resolvido` por ausência de conteúdo na §2.

---

## 1. Cabeçalho de proveniência

- **master_spec_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\requirements.md`
- **master_design_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\design.md`
- **phase_id**: `fase-6-mobile-cross-browser`
- **phase_title**: Mobile, cross-browser e fidelidade aos mockups
- **promoted_at**: 2026-05-17
- **child_spec_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-6-mobile-cross-browser\`
- **bridge_contract**: `design.md > Components and Interfaces > Child Spec Bridge`
- **agents_rule_areas**: nenhuma (a fase NÃO toca APIs do Next.js)
- **historical_refs**:
  - `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\_archive\ux-premium-polish`
  - `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\_archive\final-polish-phase`

### Critérios de aceite herdados (EARS)

Os EARS abaixo foram copiados literalmente do `Requirement 7` do master spec (`requirements.md`). Eles definem o resultado esperado desta fase; novos requisitos podem **detalhar** as superfícies tocadas, mas não podem contradizer ou ampliar o escopo declarado aqui — o que extrapolar volta ao master via `OutOfScopeFinding` (§3).

- **Requirement 7.1** — `THE Phase_6_Spec SHALL definir matriz de validação cobrindo iPhone Safari, Android Chrome, desktop Safari, Firefox e Edge, com versões mínimas alvo.`
- **Requirement 7.2** — `THE Phase_6_Spec SHALL exigir alvo mínimo de toque de 44x44 px em controles interativos críticos (botões de ação, ícones de navegação, fechar modal).`
- **Requirement 7.3** — `THE Phase_6_Spec SHALL cobrir tratamento de teclado virtual (resize de viewport, foco em inputs) nos fluxos de login, cadastro, comentário e suporte.`
- **Requirement 7.4** — `THE Phase_6_Spec SHALL definir padrão de bottom-sheet para ações secundárias em mobile, substituindo modais full-screen onde apropriado.`
- **Requirement 7.5** — `THE Phase_6_Spec SHALL produzir um diff visual entre cada mockup em design/ (11 PNGs) e a tela correspondente implementada, registrando divergências aceitas e divergências a corrigir.`
- **Requirement 7.6** — `WHEN forem identificadas divergências de gesto/scroll (overscroll, pinch, pull-to-refresh), THE Phase_6_Spec SHALL especificar o comportamento esperado por plataforma.`
- **Requirement 7.7** — `THE Phase_6_Spec SHALL declarar fora de escopo: app nativo (iOS/Android), PWA installable e push notifications.`

---

## 2. Revalidação

> Origem: dois specs arquivados (`ux-premium-polish`, `final-polish-phase`). Ambos os diretórios em `.kiro/specs/_archive/` contêm apenas `.config.kiro` (sem `requirements.md`/`design.md`/`tasks.md` próprios produzidos), conforme verificado por `list_directory` em 2026-05-17. Cada Requirement potencial cai em `Confirmado` / `Resolvido` / `Reescopado` segundo `design.md > Components and Interfaces > Child Spec Bridge` do master, com evidência verificável contra o estado atual do código. Itens já entregues por `fase-4-design-system` ou `fase-5-ux` entram como `Resolvido` com link.

### Inventário baseline (evidência usada na classificação)

Comandos rodados em `c:\Users\edulanzarin\Documents\Dev\privello\` antes da redação deste documento. Os números abaixo alimentam as classificações dos itens herdados e das §3 (out-of-scope) e dos Requirements detalhados.

- **Mockups em `design/`**: **11 PNGs** confirmados (`list_directory` em 2026-05-17):
  1. `Dashboard _ vis_o geral.png` — Dashboard / visão geral.
  2. `Fila de modera_o.png` — Fila de moderação.
  3. `Financeiro _Premium_.png` — Financeiro (Premium).
  4. `Home _ landing.png` — Home / landing.
  5. `Listagem com filtros.png` — Listagem com filtros.
  6. `Onboarding _ Passo 03 _ Fotos.png` — Onboarding / Passo 03 / Fotos.
  7. `Perfil p_blico.png` — Perfil público.
  8. `Planos _ pre_os.png` — Planos e preços.
  9. `Solicita_es pendentes.png` — Solicitações pendentes.
  10. `Solicitar encontro _cliente logado_.png` — Solicitar encontro (cliente logado).
  11. `Verifica_o de identidade.png` — Verificação de identidade.
- **Playwright** (`playwright.config.ts`): 2 projects atuais — `ios-safari` (WebKit + iPhone 14) e `desktop-chrome` (Chromium + Desktop Chrome). `tests/e2e/` tem 2 specs (`ios-bug-condition.spec.ts`, `preservation.spec.ts`) + `lib/` + `diagnostics/`. Cobertura escassa conforme handoff.
- **Touch target `min-h-[44px]` / `min-w-[44px]`**: **0 ocorrências** em `src/**/*.{tsx,ts,css}` (verificado por `grep_search` em 2026-05-17). Nenhum controle interativo crítico declara alvo de toque mínimo explícito hoje.
- **Modal `position`** (cf. fase-4 entregue): **0 ocorrências** de `position="bottom"`; **1 ocorrência** de `position="center"` (`src/app/conta/perfil/client-profile-edit.tsx:64`); **3 ocorrências** de `position="fullscreen"` (`src/app/painel/midias/midias-manager.tsx:397`, `src/components/stories/story-bar.tsx:287`, `src/components/profile/profile-story-cover.tsx:234`). Modais sem prop explícita aplicam o default do primitivo (que é `center`) — outros consumidores existem (cf. fase-4 `tokens.md`); o mapeamento exato será refeito na Tarefa 2 de inventário deste spec-filho.
- **Teclado virtual** (`useEffect.*window.visualViewport` ou `visualViewport` em `src/**/*.{tsx,ts}`): **0 ocorrências**. Nenhum tratamento atual de viewport quando o teclado virtual abre.
- **Gestos** (`touch-action`, `overscroll-behavior`, `pull-to-refresh` em `src/**/*.{tsx,ts,css}`): **0 ocorrências** em todos. `100dvh` aparece em `src/components/reels/reels-feed.tsx:172` e `:405` (uso de `dvh` é compatível com teclado virtual em iOS — único site no projeto). `100vh` não aparece em nenhum arquivo.

### 2.1 `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\_archive\ux-premium-polish`

- **archived_spec_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\_archive\ux-premium-polish`
- **scope**: `mobile`

#### Itens herdados

- **Item**: Polimento mobile/cross-browser que ficaria pendente do `ux-premium-phase4` (sem `requirements.md`/`design.md`/`tasks.md` próprios produzidos — diretório arquivado contém apenas `.config.kiro`).
- **Origem no spec arquivado**: estrutura ausente; spec arquivado não chegou a produzir requirements próprios.
- **Estado**: `Resolvido` (por ausência de conteúdo).
- **evidence**: `list_directory` em 2026-05-17 retornou apenas `.config.kiro` no diretório arquivado.
- **Observação**: nenhum item pendente próprio do spec arquivado. Os temas mobile/cross-browser do `ux-premium-phase4` que foram absorvidos pela fase-5 já estão classificados como `Reescopado` em `fase-5-ux/requirements.md > §2.1` (bottom nav mobile, UX mobile/desktop, alvo de toque) — esta fase os reabsorve via Requirements detalhados de §Requirements abaixo.

### 2.2 `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\_archive\final-polish-phase`

- **archived_spec_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\_archive\final-polish-phase`
- **scope**: `mobile`

#### Itens herdados

- **Item**: Itens finais de polimento (sem `requirements.md`/`design.md`/`tasks.md` próprios produzidos — diretório arquivado contém apenas `.config.kiro`).
- **Origem no spec arquivado**: estrutura ausente.
- **Estado**: `Resolvido` (por ausência de conteúdo).
- **evidence**: `list_directory` em 2026-05-17 retornou apenas `.config.kiro` no diretório arquivado.
- **Observação**: nenhum item pendente próprio. NÃO vira tarefa adicional.

### 2.3 Itens herdados de fases anteriores que reaparecem nesta fase

Itens já tratados por fases anteriores que se desdobram ou conectam à fase-6.

- **Item**: Modal primitivo com prop `position: "center" | "bottom" | "fullscreen"`.
- **Origem**: `fase-4-design-system` (Modal entregue com a prop).
- **Estado**: `Resolvido`.
- **evidence**: `src/components/ui/modal.tsx:14` declara `position?: "center" | "bottom" | "fullscreen"`. Tabela em `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-4-design-system\tokens.md` confirma a entrega.
- **Observação**: a fase-6 **não cria** nem altera a prop `position` do Modal. Apenas aplica `position="bottom"` em consumidores em mobile (Requirement 4 abaixo). Refactor da API do Modal é Non-Goal.

- **Item**: `useFocusTrap` reutilizável.
- **Origem**: `fase-4-design-system` (hook entregue, integrado no Modal).
- **Estado**: `Resolvido`.
- **evidence**: `src/lib/hooks/use-focus-trap.ts` (entregue na fase-4); Modal já consome.
- **Observação**: o Lightbox responsivo desta fase (Requirement 7) reutiliza o trap via Modal. Não há trap novo.

- **Item**: Regra global `@media (prefers-reduced-motion: reduce)` em `globals.css`.
- **Origem**: `fase-5-ux` (Property 3 entregue).
- **Estado**: `Resolvido`.
- **evidence**: `src/app/globals.css` contém o bloco com `*, *::before, *::after` e `::view-transition-*(*)` zerando animations; `src/__tests__/globals-css-reduced-motion.test.ts` valida.
- **Observação**: microinterações novas desta fase (transições de bottom-sheet, swipe, slide) são CSS-side e cobertas pela regra global.

- **Item**: View Transitions com 3 padrões aplicados (Suspense reveal em `/p/[slug]`, crossfade em `/descobrir/[citySlug]`, directional slide no onboarding).
- **Origem**: `fase-5-ux > Requirement 6`.
- **Estado**: `Resolvido`.
- **evidence**: `next.config.ts` com `experimental.viewTransition: true`; uso em `src/app/p/[slug]/page.tsx`, `src/app/descobrir/[citySlug]/page.tsx`, `src/app/conta/onboarding/{perfil,fotos,valores,publicar}/page.tsx`. Helper `src/app/conta/onboarding/onboarding-nav.tsx` (`OnboardingNext`/`OnboardingBack`).
- **Observação**: a fase-6 NÃO altera View Transitions. Apenas valida que continuam funcionando em todos os 5 browsers da matriz (Requirement 1).

- **Item**: Touch target 44×44 px em controles interativos críticos.
- **Origem**: `_archive/ux-premium-phase4 > Requirement 10` (reescopado por `fase-5-ux/requirements.md > §2.1`).
- **Estado**: `Confirmado`.
- **evidence**: 0 ocorrências de `min-h-[44px]` ou `min-w-[44px]` em `src/**` (medido). Botões críticos como o trigger de fechar Modal (`src/components/ui/modal.tsx`), bottom-nav (`src/components/layout/bottom-nav.tsx`), ícones de like/favorite/comments em `story-bar.tsx`/`reels-feed.tsx`/`media-gallery.tsx`/`profile-story-cover.tsx` não declaram alvo mínimo explícito.
- **Tarefa derivada**: Requirement 2 deste spec-filho.

- **Item**: Tratamento de teclado virtual em fluxos com input (login, cadastro, comentário, suporte).
- **Origem**: master `Requirement 7.3`.
- **Estado**: `Confirmado`.
- **evidence**: 0 ocorrências de `visualViewport` em `src/**`. Nenhum uso de `interactiveWidget=resizes-content` em `<head>` (a tag `<meta name="viewport">` não declara `interactive-widget`). Único uso de `100dvh` é em `reels-feed.tsx` (já compatível com viewport dinâmico). Fluxos `entrar` (`src/app/entrar/page.tsx`), `cadastro/{cliente,acompanhante}/page.tsx`, comentário (`src/components/profile/media-gallery.tsx` + `reels-feed.tsx` + `story-bar.tsx`) e suporte (`src/app/painel/suporte/page.tsx`, `src/app/painel/suporte/[id]/page.tsx`) usam `<input>`/`<textarea>` sem viewport-aware handling.
- **Tarefa derivada**: Requirement 3 deste spec-filho.

- **Item**: Bottom-sheet aplicado em Modais center mobile.
- **Origem**: master `Requirement 7.4` + `_archive/ux-premium-phase4 > Requirement 16` (reescopado por fase-4 `tokens.md`).
- **Estado**: `Confirmado`.
- **evidence**: `position="bottom"` em 0 sites; `position="center"` em 1 site (`src/app/conta/perfil/client-profile-edit.tsx:64`) — esse é candidato direto. Modais sem prop explícita (default center) também são candidatos: `src/components/admin/warning-form.tsx:93` (após migração da fase-4) e os modais consumidores de Modal sem prop em `src/components/painel/*` e `src/app/painel/**`.
- **Tarefa derivada**: Requirement 4 deste spec-filho.

- **Item**: Diff visual com 11 mockups em `design/`.
- **Origem**: master `Requirement 7.5`.
- **Estado**: `Confirmado`.
- **evidence**: 11 PNGs em `design/` listados acima (`list_directory` em 2026-05-17); nenhum diff visual produzido até hoje. Mapeamento provisório mockup → tela:
  | mockup | tela alvo provável |
  |---|---|
  | Dashboard \| visão geral | `src/app/painel/page.tsx` |
  | Fila de moderação | `src/app/admin/moderacao/page.tsx` |
  | Financeiro (Premium) | `src/app/painel/financeiro/page.tsx` |
  | Home \| landing | `src/app/page.tsx` |
  | Listagem com filtros | `src/app/buscar/page.tsx` (provável) ou `src/app/descobrir/[citySlug]/page.tsx` |
  | Onboarding \| Passo 03 \| Fotos | `src/app/conta/onboarding/fotos/page.tsx` |
  | Perfil público | `src/app/p/[slug]/page.tsx` |
  | Planos e preços | `src/app/planos/page.tsx` |
  | Solicitações pendentes | `src/app/painel/page.tsx` (cards de solicitação) — confirmar na execução |
  | Solicitar encontro (cliente logado) | `src/app/solicitar/[slug]/page.tsx` |
  | Verificação de identidade | `src/app/conta/verificacao/page.tsx` |
- **Tarefa derivada**: Requirement 5 deste spec-filho (produzir `mockups-diff.md` com 11 entradas).

- **Item**: Gestos por plataforma (overscroll, pinch, pull-to-refresh).
- **Origem**: master `Requirement 7.6`.
- **Estado**: `Confirmado`.
- **evidence**: 0 ocorrências de `touch-action`, `overscroll-behavior`, `pull-to-refresh` em `src/**`. `reels-feed.tsx` usa `snap-y snap-mandatory` para vertical paging (já intencional) mas não bloqueia pinch ou pull-to-refresh em iOS Safari. Lightboxes full-screen (`midias-manager.tsx:397`, `story-bar.tsx:287`, `profile-story-cover.tsx:234`) não declaram `touch-action: none` para impedir pinch acidental no overlay.
- **Tarefa derivada**: Requirement 6 deste spec-filho.

- **Item**: Lightbox responsivo (mobile fullscreen, desktop centered) — `<MediaLightbox>`.
- **Origem**: `OutOfScopeFinding` registrado em `fase-4-design-system/requirements.md > §3` apontando para `fase-6-mobile-cross-browser`.
- **Estado**: `Confirmado`.
- **evidence**: `src/components/profile/media-gallery.tsx:178` mantém overlay `fixed inset-0 z-50` inline; behavior responsivo (mobile fullscreen, desktop centered) ainda não foi extraído para primitivo derivado.
- **Tarefa derivada**: Requirement 7 deste spec-filho.

- **Item**: Bottom nav mobile redesign.
- **Origem**: `fase-5-ux/requirements.md > §2.1 > item Navegação` (reescopado para fase-6).
- **Estado**: `Confirmado`.
- **evidence**: `src/components/layout/bottom-nav.tsx` existe (entrega da fase-5/anterior), mas redesign com 4 ícones + labels alinhado aos mockups está pendente. Diferenças visuais serão registradas no diff visual da Tarefa 5.
- **Tarefa derivada**: Requirement 7 deste spec-filho (consolida com `<Drawer>`/`<MediaLightbox>` em "primitivos derivados de mobile").

- **Item**: Drawer mobile (`painel-sidebar.tsx:225`).
- **Origem**: `fase-4-design-system/tokens.md > Out of scope desta fase` (caso à parte registrado para fase-6).
- **Estado**: `Confirmado` (decisão pendente: criar primitivo `<Drawer>` ou manter inline).
- **evidence**: `src/components/painel/painel-sidebar.tsx:225` mantém drawer inline com transição lateral; não existe primitivo `<Drawer>` em `src/components/ui/`.
- **Tarefa derivada**: Requirement 7 deste spec-filho (decisão registrada em `mockups-diff.md > §Drawer mobile`).

### 2.4 Resumo de classificações

| Estado | Quantidade | Itens |
|---|---:|---|
| `Confirmado` | 7 | Touch target 44×44, Teclado virtual, Bottom-sheet aplicado, Diff visual com 11 mockups, Gestos por plataforma, Lightbox responsivo + bottom nav + drawer mobile (consolidado), Matriz de browsers (implícito em §Requirements) |
| `Resolvido` | 6 | `_archive/ux-premium-polish` (vazio), `_archive/final-polish-phase` (vazio), Modal `position` (fase-4), `useFocusTrap` (fase-4), `prefers-reduced-motion` (fase-5), View Transitions (fase-5) |
| `Reescopado` | 0 | — |

> Observação: o Requirement "Matriz de browsers" (master 7.1) não tem origem direta em spec arquivado por isso não aparece como linha de revalidação aqui. Entra como Requirement 1 deste spec-filho.

---

## 3. Achados fora de escopo

> Os achados abaixo extrapolam o escopo desta fase e foram registrados conforme regra E4 do master spec (`design.md > Error Handling`). Os dois primeiros são herdados das fases anteriores (registrados como `OutOfScopeFinding` apontando para fase-6) e são absorvidos por esta fase via Requirement 7. As demais linhas serão preenchidas durante a execução conforme novos achados aparecerem.

| discoveredIn | description | proposedTarget | evidence |
|---|---|---|---|
| `fase-4-design-system` | Modal lightbox responsivo (`<MediaLightbox>`): mobile fullscreen, desktop centered. Substituir por `Modal position="fullscreen"` direto descaracterizaria o desktop centered; abstrair em `<MediaLightbox>` exigiria `useMediaQuery` + lógica de breakpoint que é tema central da fase-6. | `fase-6-mobile-cross-browser` (absorvido aqui via Requirement 7) | `src/components/profile/media-gallery.tsx:178` (overlay `fixed inset-0 z-50` com behavior responsivo). **Absorção:** `<MediaLightbox>` criado em `src/components/profile/media-lightbox.tsx`; overlay inline substituído. Commits: `48f7f1a` (criação + substituição) → `75e5473` (entrega completa da fase). |
| `fase-5-ux` | Bottom nav mobile redesign — comportamento mobile, paddings, badges, transições alinhadas ao mockup. | `fase-6-mobile-cross-browser` (absorvido aqui via Requirement 7) | `src/components/layout/bottom-nav.tsx` (componente existente, redesign pendente conforme mockups em `design/`). **Absorção:** redesign pontual aplicado (Wave 11) — 44×44 em itens, tokens fase-4 confirmados, sem mudança de layout amplo. Commits: `5d61e4f` (44×44 categoria b) + `8cf2a57` (diff visual + bottom-nav redesign) → `75e5473` (entrega completa). |
| _(vazio até a primeira descoberta nova nesta fase)_ | | | |

> Cada novo achado relevante que extrapolar o escopo desta fase será registrado como linha desta tabela (schema `OutOfScopeFinding` de `design.md > Data Models` do master) e disparará commit no master spec, **nunca** absorção silenciosa pelo spec-filho (regra dura E4 de `design.md > Error Handling`).

---

## 4. Consultas a `node_modules/next/dist/docs/` (AGENTS_Rule)

> n/a — fase não toca APIs do Next.js.

A Fase 6 toca exclusivamente: `src/components/**` e `src/app/**` (controles, telas, primitivos derivados de mobile como `<Drawer>` e `<MediaLightbox>`), `src/lib/hooks/**` (`useVirtualKeyboard` opcional, `useMediaQuery` se necessário), `src/app/globals.css` (CSS de gestos: `touch-action`, `overscroll-behavior`, viewport units), `playwright.config.ts` (extender matriz de projects para 5 browsers), `tests/e2e/**` (smoke E2E por viewport — opcional), `mockups-diff.md` no diretório do spec-filho. Nenhuma dessas superfícies envolve routing, server actions, middleware, cache, transitions (já entregue por fase-5), image config nem headers. Se durante a execução algo exigir tocar API do Next, isso vira `OutOfScopeFinding` (§3), não absorção.

---

## Glossary

- **Phase_6_Spec**: este documento e os artefatos produzidos sob `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-6-mobile-cross-browser\`.
- **Browser_Matrix**: conjunto de combinações `(plataforma, browser, versão_minima)` cobertas pela validação. Esta fase declara 5 entradas: iPhone Safari (iOS 16+), Android Chrome (Android 10+), desktop Safari (16+), desktop Firefox (115 ESR+), desktop Edge (120+). Versões mínimas alinhadas ao baseline de Web Platform features usados (View Transitions API, `dvh`, `:has()`).
- **Touch_Target**: área mínima de hit-region de um controle interativo. Esta fase declara `min-h-[44px] min-w-[44px]` (alinhado ao Apple HIG e WCAG 2.5.5 AAA) para `Critical_Control`s. Quando o glifo visual do controle for menor (ex.: ícone 16×16), `padding`/`margin` invisíveis aumentam a hit-region sem alterar o visual.
- **Critical_Control**: controle interativo cujo alvo de toque mínimo é exigido. Lista canônica desta fase: botões de ação primários, ícones de navegação (bottom-nav, header), botão fechar Modal, botões de like/favorite/comments em mídia, switches, dropdown triggers, pagination/carousel chevrons. Lista exata é congelada na Tarefa 2 (inventário) deste spec-filho.
- **Bottom_Sheet**: variante de Modal exibida ancorada na borda inferior em viewport mobile (< sm). Implementada via prop existente `position="bottom"` do primitivo Modal (entregue por fase-4). Não há novo primitivo.
- **Virtual_Keyboard**: teclado virtual nativo de iOS Safari / Android Chrome que abre quando um `<input>`/`<textarea>` recebe foco. Tratamento desta fase: usar `100dvh`/`100svh` em vez de `100vh` onde aplicável; declarar `<meta name="viewport" content="..., interactive-widget=resizes-content">`; opcionalmente hook `useVirtualKeyboard` que escuta `window.visualViewport.resize` para casos onde CSS não basta (ex.: header sticky que precisa colapsar quando teclado abre).
- **Visual_Diff**: comparação manual entre PNG do `design/` e screenshot da tela implementada, registrada em `mockups-diff.md` com `divergencia_aceita` (paridade aceitável, ex.: dados reais vs mock) ou `divergencia_a_corrigir` (gap real a fechar nesta fase). Tolerância declarada por entrada — não há comparação automática por pixel.
- **Mockup_Reference**: um dos 11 PNGs em `c:\Users\edulanzarin\Documents\Dev\privello\design\`. Cada Mockup_Reference é mapeado a uma `tela_alvo` (path absoluto de `page.tsx`).
- **Gesture_Specification**: declaração por plataforma (iPhone Safari, Android Chrome, desktop) do comportamento esperado para `overscroll`, `pinch`, `pull-to-refresh`. Entregue em `mockups-diff.md > §Gestos`.
- **Drawer_Mobile**: caso à parte herdado de `painel-sidebar.tsx:225` (cf. fase-4 `tokens.md > Out of scope desta fase`). Decisão desta fase: criar primitivo `<Drawer>` em `src/components/ui/drawer.tsx` OU manter inline. Decisão registrada em `mockups-diff.md > §Drawer mobile` antes da implementação.
- **Lightbox_Responsive**: primitivo derivado `<MediaLightbox>` em `src/components/ui/lightbox.tsx` (ou `src/components/profile/media-lightbox.tsx`) que envolve Modal e aplica `position` responsivo (`fullscreen` em mobile, `center` em desktop ≥ md) usando `useMediaQuery` ou `position` resolvido em hook. Absorve `OutOfScopeFinding` herdado de fase-4.
- **Use_Media_Query**: hook utilitário `useMediaQuery(query: string): boolean` em `src/lib/hooks/use-media-query.ts` (criação **opcional**, só se a Wave Bottom-sheet ou Wave Lightbox exigir). Pode ser substituído por uso direto de `window.matchMedia` em primitivo específico.
- **NextApiArea**: vocabulário definido em `design.md > Data Models > NextApiArea` do master. Esta fase: **nenhuma** (cf. §4 acima).

---

## 6. Non-Goals / Out of Scope

Os itens abaixo NÃO fazem parte desta fase e não devem virar tarefa:

1. **App nativo (iOS/Android)** — sem React Native, sem Capacitor/Cordova, sem build Xcode/Android Studio. _(EAR 7.7 herdada.)_
2. **PWA installable** — sem `manifest.json` que ative install prompt, sem service worker que entregue offline-first. _(EAR 7.7 herdada.)_
3. **Push notifications** (web push, FCM, APNS). _(EAR 7.7 herdada.)_
4. **Mudanças em primitivos da fase-4** (Modal, Switch, Dropdown, Button, Input, Textarea, Select, Card, Badge, Avatar, Toast, ToggleChip, useFocusTrap, useFileUpload). Esta fase **apenas aplica** `position="bottom"` em consumidores via prop responsiva ou via `useMediaQuery`. Refactor de primitivos vira `OutOfScopeFinding` para ampliar fase-4 ou nova fase.
5. **Auditoria WCAG ampla** (contraste, navegação por teclado total, screen reader em todos os fluxos). Apenas a11y mínima exigida para os controles tocados nesta fase (alvo de toque, `aria-label`, `aria-haspopup` em Drawer). Auditoria ampla é fase futura.
6. **Mudanças em `prisma/schema.prisma`** — sem novos índices, sem novas colunas, sem novos modelos.
7. **Mudanças em segurança / Zod / rate-limit** (escopo de `fase-1-seguranca`, já `Done`).
8. **Mudanças em queries/services da fase-3** (`src/lib/services/*.service.ts`, `src/lib/queries.ts`). Esta fase apenas consome a API existente.
9. **CI / lint config / `eslint.config.mjs`** — vão para `fase-7-dx-infra` (já `Done`); novos lints anti-regressão de mobile (ex.: detectar Modal sem `position` em viewport mobile) viram `OutOfScopeFinding` se forem tentados aqui.
10. **Novos testes E2E amplos** — expansão grande do Playwright é Non-Goal herdado de fase-2 (cf. `fase-2-testes/requirements.md > §6 item 2`). Esta fase pode **estender a matriz de browsers** em `playwright.config.ts` e **adicionar smoke E2E por viewport** (1–3 specs); refactor amplo da suite Playwright fica fora.
11. **View Transitions novas** — fase-5 entregou 3 padrões (Suspense reveal em `/p/[slug]`, crossfade em `/descobrir/[citySlug]`, directional slide no onboarding). A fase-6 NÃO adiciona padrões novos; apenas valida que continuam funcionando em todos os 5 browsers da matriz.
12. **Refactor visual amplo** dos 11 mockups. O diff visual (Requirement 5) **identifica** divergências e classifica em `aceita` vs `a corrigir`; **corrigir todas** as divergências `a corrigir` é tarefa desta fase **apenas até onde caber** no escopo das demais Waves (toque, teclado, bottom-sheet, gestos, lightbox/drawer). Divergências cosméticas que exijam redesign amplo viram `OutOfScopeFinding`.
13. **Otimização de bundle / code splitting amplo** — Non-Goal herdado de fase-5.
14. **Mudanças em APIs do Next.js** (routing, server actions, middleware, cache, transitions, image config, headers). A fase é puramente client-side/CSS. Qualquer toque em API do Next vira `OutOfScopeFinding`.
15. **Snapshot/visual regression automatizado por pixel** — diff visual desta fase é manual (humano comparando PNG do `design/` com screenshot da tela). Comparação automática por hash de pixel ou ferramenta tipo Percy fica fora.
16. **Lint anti-regressão para `min-h-[44px]`/`min-w-[44px]` em controles críticos** — opcional. Se for implementado, é variante de regra ESLint custom (cf. fase-4); se não couber no escopo, registrar como `OutOfScopeFinding` para fase-7.

Qualquer item que apareça nesta lista mas se mostre necessário durante a execução vira `OutOfScopeFinding` (§3) e exige commit no master spec antes de ser absorvido.

---

## Requirements

> Os requisitos abaixo são os EARS herdados (Requirement 7.1–7.7 do master) **destrinchados** por superfície tocada. Cada bloco identifica os arquivos envolvidos, mantém o EARS herdado como referência e adiciona EARS de detalhe que serão validados pelo spec-filho.

### Requirement 1: Matriz de browsers e versões mínimas

**User Story:** Como mantenedor, quero saber, browser a browser, qual versão mínima validamos e como rodamos a validação, para que regressões cross-browser sejam detectadas cedo.

**Inputs:** `playwright.config.ts` (extender `projects`), `mockups-diff.md > §Browser Matrix` (novo).

#### Acceptance Criteria

1. THE Phase_6_Spec SHALL definir matriz de validação cobrindo iPhone Safari, Android Chrome, desktop Safari, Firefox e Edge, com versões mínimas alvo. _(EARS herdada — Requirement 7.1 do master.)_
2. THE Phase_6_Spec SHALL produzir, em `mockups-diff.md > §Browser Matrix`, uma tabela com **5 linhas** (uma por combinação plataforma/browser) onde cada linha contém: (a) plataforma (`iOS`, `Android`, `macOS`, `Windows`, `Linux` quando aplicável), (b) browser (`Safari`, `Chrome`, `Firefox`, `Edge`), (c) versão mínima alvo declarada (ex.: `iOS Safari 16+`, `Android Chrome em Android 10+`, `Safari 16+`, `Firefox 115 ESR+`, `Edge 120+`), (d) método de validação (`Playwright project`, `smoke browser manual`).
3. THE Phase_6_Spec SHALL estender `playwright.config.ts > projects` para cobrir, no mínimo, 3 dos 5 browsers da matriz como Playwright projects rodáveis: `ios-safari` (já existe), `desktop-chrome` (já existe), e adicionar `desktop-firefox` e `android-chrome` (Pixel 7 device descriptor). Os 2 browsers restantes (desktop Safari e desktop Edge) podem ficar como **smoke browser manual** declarado, com justificativa em `mockups-diff.md > §Browser Matrix > Cobertura Playwright vs manual`.
4. WHERE Playwright não suportar nativamente um browser da matriz como project rodável (ex.: `desktop-edge` exige Edge instalado localmente), THE Phase_6_Spec SHALL declarar a cobertura como **smoke browser manual**, com critério de validação documentado (smoke local em ambiente de dev) e responsabilidade no commit que entrega a fase.
5. THE Phase_6_Spec SHALL preservar os 2 projects existentes (`ios-safari`, `desktop-chrome`) com suas configurações atuais (incluindo `webServer.command` e `baseURL`); renomear ou remover qualquer um deles vira `OutOfScopeFinding`.
6. THE Phase_6_Spec SHALL declarar como precondição de Done: pelo menos os 4 projects Playwright (existentes + novos) devem rodar com `npm run test:e2e -- --list` listando suas specs sem erro. Execução completa dos specs nos 4 projects é **opcional** nesta fase (depende de o usuário ter os browsers instalados localmente); se o usuário tiver, o smoke é capturado em `mockups-diff.md > §Smoke checks finais`.

### Requirement 2: Touch target 44×44 px em controles críticos

**User Story:** Como usuário em iPhone Safari ou Android Chrome, quero acertar o botão na primeira tentativa, para não precisar zoom ou repetição.

**Inputs:** controles interativos em `src/components/**` e `src/app/**` classificados como `Critical_Control` (ver Glossary).

#### Acceptance Criteria

1. THE Phase_6_Spec SHALL exigir alvo mínimo de toque de 44x44 px em controles interativos críticos (botões de ação, ícones de navegação, fechar modal). _(EARS herdada — Requirement 7.2 do master.)_
2. THE Phase_6_Spec SHALL produzir, na Tarefa 2 do `tasks.md` (inventário), uma lista exaustiva dos `Critical_Control`s tocados nesta fase, com `path:linha` para cada um. Categorias canônicas: (a) botões de ação primários (`Button` consumido em formulários), (b) ícones de navegação (bottom-nav, header, breadcrumb, tabs), (c) botão fechar Modal, (d) botões de like/favorite/comments em mídia, (e) switches, (f) dropdown triggers, (g) pagination/carousel chevrons.
3. THE Phase_6_Spec SHALL aplicar `min-h-[44px] min-w-[44px]` (ou equivalente via padding interno) em **todos** os `Critical_Control`s identificados, preservando o glifo visual. Quando o glifo for menor que 44×44 (ex.: ícone 16×16), aumentar a hit-region via `padding`/`margin` invisíveis sem alterar tamanho aparente do glifo.
4. WHERE um controle estiver dentro de um `Modal`/`Dropdown`/contexto que já garanta hit-region suficiente por outro mecanismo (ex.: linha inteira clicável de `DropdownItem` com `min-h-[40px]` mais padding lateral), THE Phase_6_Spec SHALL aceitar o controle como conforme **se** o `getBoundingClientRect()` resultante for ≥ 44×44 px na renderização padrão; caso contrário, ajustar.
5. THE Phase_6_Spec SHALL validar a aplicação por um teste determinístico co-localizado (`*.test.tsx` em `src/components/**`) que renderiza cada `Critical_Control` representativo, lê `getBoundingClientRect()` via Testing Library + `jsdom` (já configurado em fase-2/4) e afirma `width >= 44 && height >= 44`. **Cobertura mínima**: 1 teste por categoria canônica (a–g acima); cobertura exaustiva é Non-Goal (lint anti-regressão é o caminho ampliável — opcional, ver §6 Non-Goals item 16).
6. THE Phase_6_Spec SHALL preservar visual atual dos controles. Mudanças visuais aceitáveis: aumentar padding interno; declarar `display: inline-flex` ou `flex` quando necessário; aumentar `min-height` do botão. Mudanças não aceitáveis (que viram `OutOfScopeFinding`): substituir glifo, mudar variant, mudar cor.

### Requirement 3: Tratamento de teclado virtual em login, cadastro, comentário e suporte

**User Story:** Como usuário em iPhone Safari ou Android Chrome, quero que o teclado virtual não cubra o input ativo nem corte conteúdo importante, para preencher formulários sem fricção.

**Inputs:** `src/app/entrar/page.tsx` (login), `src/app/cadastro/{cliente,acompanhante}/page.tsx` (cadastro), comentário em `src/components/profile/media-gallery.tsx`/`reels-feed.tsx`/`story-bar.tsx` (overlay), `src/app/painel/suporte/page.tsx` + `src/app/painel/suporte/[id]/page.tsx` (suporte). Opcional: `src/lib/hooks/use-virtual-keyboard.ts` (novo, se necessário).

#### Acceptance Criteria

1. THE Phase_6_Spec SHALL cobrir tratamento de teclado virtual (resize de viewport, foco em inputs) nos fluxos de login, cadastro, comentário e suporte. _(EARS herdada — Requirement 7.3 do master.)_
2. THE Phase_6_Spec SHALL atualizar a tag `<meta name="viewport">` no `<head>` raiz (`src/app/layout.tsx` ou via `metadata.viewport`) para incluir `interactive-widget=resizes-content` (recomendação do guia de View Transitions consultado pela fase-5 e padrão Web). Esta mudança aplica resize do viewport CSS quando o teclado abre, em vez de overlay.
3. WHERE o conteúdo principal usar unidades de viewport (`vh`/`100vh`), THE Phase_6_Spec SHALL substituir por `dvh`/`svh`/`100dvh` conforme apropriado, alinhado ao único site existente que já adota o padrão (`src/components/reels/reels-feed.tsx:172,405`). `dvh` (dynamic viewport height) responde ao teclado; `svh` (small viewport height) é fallback para casos onde sempre se quer o tamanho menor.
4. THE Phase_6_Spec SHALL revalidar manualmente, em smoke browser (iOS Safari + Android Chrome), os 4 fluxos listados: (a) login (`/entrar`), (b) cadastro (`/cadastro/cliente` e `/cadastro/acompanhante`), (c) comentário (overlay de comentários em mídia, ativo a partir de `/p/[slug]` e `/reels`), (d) suporte (criação de chamado em `/painel/suporte` e detalhe em `/painel/suporte/[id]`). Para cada fluxo, anexar nota em `mockups-diff.md > §Smoke teclado virtual` confirmando: input ativo permanece visível quando teclado abre; CTA primário (botão de submit) permanece acessível ou some sem corte.
5. WHERE CSS sozinho não bastar (caso identificado durante a execução: header sticky precisa colapsar quando teclado abre, OU CTA fixo deve ser empurrado para acima do teclado), THE Phase_6_Spec SHALL criar hook `useVirtualKeyboard` em `src/lib/hooks/use-virtual-keyboard.ts` que expõe `{ isOpen: boolean, height: number }` lendo `window.visualViewport.resize`. Hook é **opcional**: criar apenas se necessário. Se necessário, integrar no(s) site(s) específico(s).
6. THE Phase_6_Spec SHALL preservar comportamento atual em `reels-feed.tsx` (já usa `100dvh`) — não regredir.

### Requirement 4: Bottom-sheet em mobile

**User Story:** Como usuário em mobile, quero que ações secundárias apareçam ancoradas na parte inferior da tela (mais perto do polegar), para reduzir fricção em telas grandes.

**Inputs:** consumidores de Modal com `position="center"` (1 site identificado: `src/app/conta/perfil/client-profile-edit.tsx:64`); demais Modais consumidores sem `position` explícita (defaultam a `center`); primitivo Modal já entregue por fase-4 (sem alteração).

#### Acceptance Criteria

1. THE Phase_6_Spec SHALL definir padrão de bottom-sheet para ações secundárias em mobile, substituindo modais full-screen onde apropriado. _(EARS herdada — Requirement 7.4 do master.)_
2. THE Phase_6_Spec SHALL produzir, na Tarefa 2 do `tasks.md`, lista exaustiva de Modais consumidores classificados em uma de 4 categorias: (a) `bottom_sheet_em_mobile` — Modal `center` que vira `bottom` em viewport `<sm`, (b) `manter_center` — Modal pequeno (≤ 400×300) que cabe em viewport mobile sem regressão, (c) `manter_fullscreen` — lightbox/story viewer que já é `fullscreen` (3 sites: `midias-manager.tsx:397`, `story-bar.tsx:287`, `profile-story-cover.tsx:234`), (d) `decisao_caso_a_caso` — Modal com comportamento misto (registrar decisão em `mockups-diff.md`).
3. WHEN um Modal é classificado como `bottom_sheet_em_mobile`, THE Phase_6_Spec SHALL aplicar a substituição via uma destas estratégias (decisão registrada em `design.md` desta fase): (a) prop responsiva no consumidor — `position={isMobile ? "bottom" : "center"}` lendo `useMediaQuery("(max-width: 640px)")`, OU (b) prop `position="auto"` adicionada ao Modal primitivo que resolve internamente — **não recomendado** (mexe na fase-4, vira `OutOfScopeFinding`); a estratégia padrão desta fase é (a).
4. THE Phase_6_Spec SHALL aplicar a substituição em **todos** os Modais classificados como `bottom_sheet_em_mobile` na Tarefa 2. Mínimo identificado hoje: `src/app/conta/perfil/client-profile-edit.tsx:64`. Outros candidatos (Modais sem prop explícita) são identificados na Tarefa 2.
5. THE Phase_6_Spec SHALL validar comportamento responsivo por um teste determinístico co-localizado: para cada Modal classificado como `bottom_sheet_em_mobile`, o teste renderiza com `window.matchMedia("(max-width: 640px)")` mockado para `true` e `false` e verifica que o `Modal` recebe `position="bottom"` quando `true` e `position="center"` quando `false`. Cobertura mínima: 1 teste para o site representativo (`client-profile-edit.tsx` ou outro escolhido na Tarefa 2).
6. THE Phase_6_Spec SHALL preservar `Modal` primitivo (`src/components/ui/modal.tsx`) sem alteração de API pública. Apenas consumidores mudam.

### Requirement 5: Diff visual com 11 mockups em `design/`

**User Story:** Como mantenedor, quero saber, mockup a mockup, qual é o gap entre o design e a implementação, para que correções não escapem por falta de visibilidade.

**Inputs:** 11 PNGs em `c:\Users\edulanzarin\Documents\Dev\privello\design\`; telas correspondentes em `src/app/**`. Saída: `mockups-diff.md` em `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-6-mobile-cross-browser\`.

#### Acceptance Criteria

1. THE Phase_6_Spec SHALL produzir um diff visual entre cada mockup em `design/` (11 PNGs) e a tela correspondente implementada, registrando divergências aceitas e divergências a corrigir. _(EARS herdada — Requirement 7.5 do master.)_
2. THE Phase_6_Spec SHALL produzir, em `mockups-diff.md > §Mockups`, **11 entradas** (uma por PNG) onde cada entrada contém: (a) `mockup_path` (path absoluto do PNG), (b) `tela_alvo` (path absoluto da `page.tsx` correspondente), (c) `divergencias_aceitas` (lista de divergências consideradas paridade aceitável — ex.: dados reais vs mock, copy editorial, ordem de elementos não-críticos), (d) `divergencias_a_corrigir` (lista de divergências reais a fechar nesta fase, com referência cruzada a Requirement 2/3/4/6/7 quando aplicável), (e) `observacoes` (texto livre quando a divergência não couber em (c) nem (d), ex.: "feature não-implementada — fora desta fase, cf. Non-Goal item X").
3. THE Phase_6_Spec SHALL usar o mapeamento provisório mockup → tela_alvo declarado em §2.3 (Inventário baseline > Diff visual) como ponto de partida; durante a execução, confirmar caso a caso e ajustar se a tela alvo correta for diferente (ex.: "Solicitações pendentes" pode mapear para `/painel/page.tsx` ou para uma rota que ainda não existe).
4. WHERE uma divergência `a corrigir` exigir mudança fora do escopo das demais Waves desta fase (ex.: redesign visual amplo de uma seção, refactor de componente pesado), THE Phase_6_Spec SHALL registrá-la como `OutOfScopeFinding` em `requirements.md > §3` com commit no master ANTES de absorver. Em `mockups-diff.md`, a entrada referencia o `OutOfScopeFinding` em vez de virar tarefa.
5. THE Phase_6_Spec SHALL aceitar, como tolerância padrão para `divergencias_aceitas`: dados reais vs mock, copy editorial, ordem de cards quando funcionalmente equivalente, paleta levemente diferente desde que dentro dos tokens da fase-4. Tolerância maior é declarada por entrada com justificativa.
6. WHERE uma `tela_alvo` ainda não existir no projeto (ex.: o mockup descreve uma feature não-implementada), THE Phase_6_Spec SHALL marcar a entrada como `tela_alvo: nao_implementada` e mover toda a discussão para `divergencias_a_corrigir = []` + `observacoes = "feature não-implementada — fora do escopo da auditoria, cf. master spec Non-Goal 'Lançamento de novas funcionalidades de negócio'"`. NÃO virar tarefa.

### Requirement 6: Gestos por plataforma (overscroll, pinch, pull-to-refresh)

**User Story:** Como usuário em iPhone Safari ou Android Chrome, quero que gestos nativos da plataforma se comportem de forma previsível, para que pinch acidental no overlay ou pull-to-refresh dentro de um carousel não atrapalhe o uso.

**Inputs:** rotas e componentes onde gestos importam. Pasta-alvo: lightboxes (`midias-manager.tsx:397`, `story-bar.tsx:287`, `profile-story-cover.tsx:234`), feed de reels (`reels-feed.tsx`), carousels e media-gallery. CSS principal: `src/app/globals.css` ou classes utilitárias.

#### Acceptance Criteria

1. WHEN forem identificadas divergências de gesto/scroll (overscroll, pinch, pull-to-refresh), THE Phase_6_Spec SHALL especificar o comportamento esperado por plataforma. _(EARS herdada — Requirement 7.6 do master.)_
2. THE Phase_6_Spec SHALL produzir, em `mockups-diff.md > §Gestos`, uma tabela com colunas `superficie` (path:linha do componente), `gesto` (`overscroll`, `pinch`, `pull-to-refresh`, `swipe-back`, `vertical-snap`), `comportamento_esperado_iOS` (descrição), `comportamento_esperado_Android` (descrição), `comportamento_esperado_desktop` (descrição), `mecanismo` (`touch-action: <valor>`, `overscroll-behavior: <valor>`, `<meta name=apple-mobile-web-app-...>` ou hook).
3. THE Phase_6_Spec SHALL aplicar `touch-action: none` em **lightboxes/story viewers full-screen** (3 sites: `midias-manager.tsx:397`, `story-bar.tsx:287`, `profile-story-cover.tsx:234`) para impedir pinch acidental no overlay. Quando o lightbox tiver feature de zoom (não previsto nesta fase), revisar caso a caso.
4. THE Phase_6_Spec SHALL aplicar `overscroll-behavior: contain` em containers com scroll interno que não devem propagar para a página (ex.: feed de reels `reels-feed.tsx`, lista de comentários, drawer mobile). Uso de `overscroll-behavior-y: contain` quando só vertical é relevante.
5. THE Phase_6_Spec SHALL desativar `pull-to-refresh` nativo do iOS Safari / Android Chrome em rotas onde refresh acidental é destrutivo (ex.: `/painel/midias` durante upload, `/painel/reels` durante upload XHR), via `overscroll-behavior-y: none` no body OU em container raiz da rota. Decisão por rota é registrada em `mockups-diff.md > §Gestos`.
6. THE Phase_6_Spec SHALL preservar comportamento de `snap-y snap-mandatory` em `reels-feed.tsx` — não regredir.
7. THE Phase_6_Spec SHALL validar manualmente, em smoke browser (iOS Safari + Android Chrome), os comportamentos declarados em §6.2: pinch no overlay não acontece; overscroll em feed não propaga; pull-to-refresh nas rotas listadas não dispara.

### Requirement 7: Lightbox responsivo, Drawer mobile e bottom nav (absorção de OutOfScopeFindings)

**User Story:** Como usuário em mobile, quero que galerias de mídia, drawer lateral e bottom nav sigam padrão responsivo consistente, para que a experiência mobile seja coesa.

**Inputs:** `src/components/profile/media-gallery.tsx:178` (lightbox responsivo); `src/components/painel/painel-sidebar.tsx:225` (drawer mobile); `src/components/layout/bottom-nav.tsx` (bottom nav redesign). Decisão de criar primitivos novos vs manter inline registrada em `design.md` desta fase.

#### Acceptance Criteria

1. THE Phase_6_Spec SHALL absorver os dois `OutOfScopeFinding`s herdados de fases anteriores (cf. §3 deste documento): `media-gallery.tsx:178` (responsividade) e bottom nav mobile redesign.
2. THE Phase_6_Spec SHALL decidir, antes da primeira tarefa de implementação que toque cada um deles, entre criar primitivo novo ou manter inline; decisão registrada em `mockups-diff.md > §Lightbox responsivo`, `§Drawer mobile`, `§Bottom nav redesign` com justificativa. Decisão padrão: criar primitivo derivado para Lightbox (`<MediaLightbox>` em `src/components/ui/lightbox.tsx` ou `src/components/profile/media-lightbox.tsx`) reutilizando Modal; criar primitivo `<Drawer>` em `src/components/ui/drawer.tsx` se a Wave Bottom-sheet exigir reuso; manter inline caso contrário.
3. WHEN `<MediaLightbox>` é criado, THE Phase_6_Spec SHALL implementá-lo como wrapper sobre Modal aplicando `position="fullscreen"` em mobile (`<sm`) e `position="center"` em desktop (`>=md`), via `useMediaQuery` ou prop responsiva no consumidor. API mínima: `<MediaLightbox open onClose>{children}</MediaLightbox>`. Substituir o overlay inline em `media-gallery.tsx:178` por essa primitiva.
4. WHEN `<Drawer>` primitivo é criado, THE Phase_6_Spec SHALL implementá-lo como Modal-like com `position="left"` ou `position="right"` (extensão local da prop, NÃO mexe no Modal da fase-4 — `<Drawer>` é primitivo separado), backdrop, transição lateral via CSS (`translate-x`), fechamento por outside click + ESC + swipe (gesto opcional). Substituir o drawer inline em `painel-sidebar.tsx:225` por essa primitiva.
5. THE Phase_6_Spec SHALL aplicar redesign de `src/components/layout/bottom-nav.tsx` alinhado ao(s) mockup(s) de `design/` que mostram bottom nav (provavelmente Home / Listagem com filtros / Dashboard); divergências aceitas e a corrigir registradas em `mockups-diff.md > §Bottom nav redesign`. Mudanças cosméticas amplas viram `OutOfScopeFinding`.
6. THE Phase_6_Spec SHALL preservar comportamento dos 3 viewers fullscreen existentes (lightbox em `midias-manager.tsx`, story-bar viewer, profile-story-cover viewer) — não regredir; se forem migrados para `<MediaLightbox>`, validar que o behavior fullscreen permanece.

### Requirement 8: Itens fora de escopo declarados

**User Story:** Como mantenedor, quero que itens fora de escopo apareçam explicitamente, para que ninguém os absorva por engano.

#### Acceptance Criteria

1. THE Phase_6_Spec SHALL declarar fora de escopo: app nativo (iOS/Android), PWA installable e push notifications. _(EARS herdada — Requirement 7.7 do master.)_
2. WHEN um item da seção "Non-Goals" deste documento aparecer durante a execução, THE Phase_6_Spec SHALL registrá-lo como `OutOfScopeFinding` em §3 deste documento e abrir commit no master spec antes de qualquer absorção.

---

## Saída desta fase

A Fase 6 é considerada `Done` quando:

- Todos os 8 Requirements desta seção têm seus EARS verificáveis e há evidência (path:linha de código, log de teste, screenshot/nota de smoke browser, ou link de PR) anexada para cada um.
- `npm run test` passa com código 0 em ambiente local sem rede e sem banco; testes determinísticos novos (touch target, bottom-sheet responsivo) entram na contagem.
- `npm run test:e2e -- --list` lista specs em **pelo menos 4 projects** Playwright (`ios-safari`, `desktop-chrome`, `desktop-firefox`, `android-chrome`) sem erro.
- `mockups-diff.md` existe em `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-6-mobile-cross-browser\` e cobre as 7 áreas: Browser Matrix, Mockups (11 entradas), Smoke teclado virtual, Bottom-sheet decisões, Gestos, Lightbox responsivo, Drawer mobile, Bottom nav redesign, Smoke checks finais.
- §3 deste documento (`OutOfScopeFinding`) tem cada linha referenciando um commit no master spec, ou está marcada como vazia (apenas as 2 linhas iniciais herdadas continuam — agora com referência para commit deste spec-filho que as absorveu via Requirement 7).
- §4 deste documento (AGENTS_Rule) permanece com `n/a — fase não toca APIs do Next.js`. Caso alguma decisão técnica acabe tocando API do Next, **substituir** este conteúdo pela linha de consulta correspondente ANTES de aplicar (regra dura E5 do master).
- Phase Card desta fase no master `requirements.md` foi atualizado para `state: Done` com `doneAt` ISO-8601 e link para esta pasta. Como esta é a **última fase** da auditoria, a conclusão fecha o ciclo do master `auditoria-geral`.
