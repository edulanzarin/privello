# Implementation Plan: `fase-6-mobile-cross-browser`

## Overview

Decomposição executável do `design.md` desta fase. As tarefas validam pré-condições (AGENTS_Rule registrada como `n/a` e fase-4 + fase-5 `Done`), produzem inventário baseline (11 mockups, browsers configurados em Playwright, controles críticos sem 44×44, Modais classificados em 4 categorias), executam Waves por superfície tocada (Browser Matrix, Touch Target, Teclado Virtual, Bottom-sheet, Diff Visual, Gestos, MediaLightbox, Drawer mobile, Bottom nav), entregam PBTs co-localizados validando Properties 1 e 2, fazem smoke checks finais e atualizam o Phase Card no master.

Restrições importantes:

- **Sem alterações em primitivos da fase-4** (Modal, Switch, Dropdown, Button, Input, Textarea, Select, Card, Badge, Avatar, Toast, ToggleChip, useFocusTrap, useFileUpload). Apenas aplicação de `position="bottom"` em consumidores via prop responsiva.
- **Sem alterações em queries/services da fase-3** (`@/lib/services/*`, `@/lib/queries`).
- **Sem alterações em `prisma/schema.prisma`**.
- **Sem alterações em segurança / Zod / rate-limit** (escopo de fase-1, já `Done`).
- **Sem alterações em CI / lint config** (escopo de fase-7, já `Done`).
- **Sem alterações em APIs do Next.js**. A fase declarou `agents_rule_areas: nenhuma`. Se aparecer necessidade, vira `OutOfScopeFinding` ANTES de absorver.
- **Sem novos testes E2E amplos**. Permitido: extender `playwright.config.ts > projects` e adicionar 1–3 specs de smoke (opcional). Refactor amplo da suite Playwright é Non-Goal.
- **Sem snapshot/visual regression automatizado por pixel** — diff visual é manual.
- Tarefas marcadas com `*` produzem property tests (validam Properties em `design.md > Correctness Properties`).

## Tasks

- [x] 1. Validar pré-condições (Spawn-Readiness Gate)
  - [x] 1.1 Confirmar `requirements.md > §4` registrada como `n/a — fase não toca APIs do Next.js`
    - Verificar texto literal da §4 do `requirements.md` deste spec-filho
    - Caso durante a execução alguma decisão acabe tocando uma `NextApiArea`, **substituir** este conteúdo pela linha de consulta correspondente ANTES de aplicar (regra dura E5 do master)
    - _Requirements: 8.2_

  - [x] 1.2 Confirmar fase-4 e fase-5 em `Done` no master
    - Ler `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\requirements.md` e validar que `Phase Card fase-4-design-system` e `Phase Card fase-5-ux` têm `state: Done` e `doneAt` ISO-8601 preenchidos
    - Confirmar `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\handoff.md` lista `fase-6-mobile-cross-browser` como destravada (Spawn-Readiness Gate satisfeito)
    - _Requirements: 1.1_

  - [x] 1.3 Confirmar §3 (`OutOfScopeFinding`) com as 2 linhas herdadas e demais inicialmente vazias
    - Verificar que as 2 linhas iniciais (lightbox responsivo herdado de fase-4; bottom nav redesign herdado de fase-5) estão registradas
    - Confirmar que outras linhas estão vazias ou contêm placeholder claramente marcado
    - _Requirements: 7.1, 8.2_

- [x] 2. Inventário baseline
  - [x] 2.1 Confirmar 11 mockups em `design/`
    - Rodar `Get-ChildItem -Path design -Filter *.png` e capturar a lista
    - Validar count = 11; nomes esperados (cf. `requirements.md > §2 Inventário baseline`):
      - `Dashboard _ vis_o geral.png`
      - `Fila de modera_o.png`
      - `Financeiro _Premium_.png`
      - `Home _ landing.png`
      - `Listagem com filtros.png`
      - `Onboarding _ Passo 03 _ Fotos.png`
      - `Perfil p_blico.png`
      - `Planos _ pre_os.png`
      - `Solicita_es pendentes.png`
      - `Solicitar encontro _cliente logado_.png`
      - `Verifica_o de identidade.png`
    - Anexar lista em `mockups-diff.md > §Mockups baseline`
    - _Requirements: 5.2_

  - [x] 2.2 Capturar projects atuais em `playwright.config.ts`
    - Confirmar 2 projects (`ios-safari`, `desktop-chrome`) e seus device descriptors
    - Anexar em `mockups-diff.md > §Browser Matrix > Projects baseline`
    - _Requirements: 1.5_

  - [x] 2.3 Inventariar `Critical_Control`s sem 44×44 px declarados
    - Rodar `grep_search` por `min-h-\[44px\]`/`min-w-\[44px\]` em `src/**/*.{tsx,ts,css}` — confirmar 0 ocorrências (baseline)
    - Listar exaustivamente `Critical_Control`s em uma das 7 categorias canônicas (a–g em `requirements.md > Glossary > Critical_Control`):
      - (a) Botões de ação primários — varrer `src/app/entrar/login-form.tsx`, `src/app/cadastro/{cliente,acompanhante}/page.tsx`, `src/app/painel/suporte/**/page.tsx`, `src/app/conta/onboarding/**/page.tsx`, `src/app/solicitar/[slug]/page.tsx`, `src/app/avaliar/[slug]/page.tsx`, `src/app/recuperar-senha/**/page.tsx`
      - (b) Ícones de navegação — `src/components/layout/bottom-nav.tsx`, `src/components/painel/painel-sidebar.tsx`, `src/components/profile/profile-card.tsx` (header de card)
      - (c) Botão fechar Modal — `src/components/ui/modal.tsx` se renderiza botão "X"; consumidores que renderizam fechar custom (`src/app/painel/midias/midias-manager.tsx:397+`, `src/components/stories/story-bar.tsx:287+`, `src/components/profile/profile-story-cover.tsx:234+`)
      - (d) Like/favorite/comments em mídia — `src/components/profile/favorite-button.tsx`, `src/components/profile/media-gallery.tsx` (ícones de like/comments), `src/components/stories/story-bar.tsx`, `src/components/reels/reels-feed.tsx`, `src/components/profile/profile-story-cover.tsx`
      - (e) Switches — `src/components/ui/switch.tsx` (primitivo) + 5 consumidores (já migrados na fase-4) — validar via `getBoundingClientRect`
      - (f) Dropdown triggers — `src/components/ui/dropdown.tsx` (primitivo) + consumidores
      - (g) Pagination/carousel chevrons — varrer `src/components/profile/media-gallery.tsx`, `src/components/profile/profile-card.tsx`, listagens (`src/app/buscar/page.tsx`, `src/app/em-alta/page.tsx`)
    - Produzir lista exaustiva em `mockups-diff.md > §Critical Controls inventário` com `path:linha` por entrada e `categoria_canonica`
    - _Requirements: 2.2_

  - [x] 2.4 Inventariar Modais consumidores e classificar em 4 categorias
    - Rodar `grep_search` por `<Modal\b` em `src/**/*.{tsx,ts}` para listar consumidores
    - Para cada consumidor, classificar em: `bottom_sheet_em_mobile` / `manter_center` / `manter_fullscreen` / `decisao_caso_a_caso`
    - Modais já fullscreen (3 sites): `src/app/painel/midias/midias-manager.tsx:397`, `src/components/stories/story-bar.tsx:287`, `src/components/profile/profile-story-cover.tsx:234` — todos `manter_fullscreen`
    - Modal `position="center"` explícito (1 site): `src/app/conta/perfil/client-profile-edit.tsx:64` — candidato a `bottom_sheet_em_mobile`
    - Demais Modais sem prop explícita — analisar tamanho e contexto
    - Produzir tabela em `mockups-diff.md > §Bottom-sheet decisões`
    - _Requirements: 4.2_

  - [x] 2.5 Confirmar gestos atuais (baseline)
    - Rodar `grep_search` por `touch-action`, `overscroll-behavior`, `pull-to-refresh` em `src/**/*.{tsx,ts,css}` — confirmar 0 ocorrências (baseline)
    - Rodar `grep_search` por `100dvh` em `src/**/*.{tsx,ts,css}` — confirmar única ocorrência em `src/components/reels/reels-feed.tsx:172` e `:405`
    - Rodar `grep_search` por `100vh` em `src/**/*.{tsx,ts,css}` — confirmar 0 ocorrências
    - Rodar `grep_search` por `visualViewport` em `src/**/*.{tsx,ts}` — confirmar 0 ocorrências
    - Anexar baseline em `mockups-diff.md > §Gestos baseline`
    - _Requirements: 3.6, 6.6_

- [x] 3. Wave Browser Matrix
  - [x] 3.1 Documentar a matriz canônica em `mockups-diff.md > §Browser Matrix`
    - 5 linhas conforme `design.md > Components and Interfaces > 1`:
      - iOS Safari 16+ — Playwright `ios-safari`
      - Android Chrome em Android 10+ — Playwright `android-chrome` (novo)
      - macOS Safari 16+ — smoke browser manual
      - Firefox 115 ESR+ — Playwright `desktop-firefox` (novo)
      - Edge 120+ — smoke browser manual
    - Justificar versão mínima por linha (cobertura instalada, baseline de features usadas)
    - Coluna `método_de_validação` deixa explícito Playwright project vs smoke manual
    - _Requirements: 1.1, 1.2_

  - [x] 3.2 Estender `playwright.config.ts > projects` para 4 projects rodáveis
    - Adicionar `desktop-firefox` com `...devices["Desktop Firefox"]` + `browserName: "firefox"`
    - Adicionar `android-chrome` com `...devices["Pixel 7"]` + `browserName: "chromium"`
    - **Preservar** `ios-safari` e `desktop-chrome` exatamente como estão (incluindo `webServer.command` e `baseURL`)
    - **Preservar** `webServer`, `use`, `reporter` e demais configurações globais
    - _Requirements: 1.3, 1.5_

  - [x] 3.3 Validar `npm run test:e2e -- --list` lista specs em 4 projects
    - Comando deve listar specs em `ios-safari`, `desktop-chrome`, `desktop-firefox`, `android-chrome` sem erro
    - Anexar log em `mockups-diff.md > §Browser Matrix > Smoke --list`
    - Execução completa dos specs em todos os projects é **opcional** (depende de browsers instalados localmente)
    - _Requirements: 1.6_

  - [x] 3.4 Documentar smoke browser manual para desktop Safari + desktop Edge
    - Critério de validação: smoke local visualizando 3 telas-âncora (`/`, `/p/[slug]`, `/painel`) em cada um
    - Lista de itens a confirmar: layout não quebra, fontes carregam, View Transitions executam (Suspense reveal em `/p/[slug]`)
    - Responsabilidade no commit que entrega a fase
    - _Requirements: 1.4_

- [x] 4. Wave Touch Target 44×44
  - [x] 4.1 Aplicar `min-h-[44px] min-w-[44px]` em controles da categoria (a) — botões de ação primários
    - Sites alvo: cada `<Button>` consumido em formulários listados em 2.3 (login, cadastro, suporte, onboarding, solicitar, avaliar, recuperar-senha)
    - Estratégia: aumentar padding interno + `min-h-[44px]` no `<button>` raiz quando o glifo é menor; adicionar classe utilitária `min-w-[44px]` quando o controle é apenas ícone
    - Preservar visual atual (sem mudar variant, glifo, cor)
    - _Requirements: 2.3, 2.6_

  - [x] 4.2 Aplicar 44×44 em controles da categoria (b) — ícones de navegação
    - Sites alvo: `src/components/layout/bottom-nav.tsx` (cada item), `src/components/painel/painel-sidebar.tsx` (toggle de drawer mobile), header dos cards
    - _Requirements: 2.3_

  - [x] 4.3 Aplicar 44×44 em controles da categoria (c) — botão fechar Modal
    - Modal primitivo: validar se renderiza botão "X" e aplicar 44×44 nesse botão; caso o primitivo não renderize, confirmar que cada consumidor que renderiza fechar custom aplica 44×44 (sites listados em 2.3-c)
    - **NÃO mudar API** do Modal (Non-Goal); apenas o estilo do botão fechar interno do primitivo (se existir) OU dos botões custom dos consumidores
    - _Requirements: 2.3, 2.6_

  - [x] 4.4 Aplicar 44×44 em controles da categoria (d) — like/favorite/comments em mídia
    - Sites alvo: `src/components/profile/favorite-button.tsx`, ícones em `media-gallery.tsx`, `story-bar.tsx`, `reels-feed.tsx`, `profile-story-cover.tsx`
    - Atenção a controles que estão dentro de overlays escuros (lightbox, story viewer) — preservar contraste
    - _Requirements: 2.3, 2.6_

  - [x] 4.5 Validar 44×44 em controles das categorias (e), (f), (g) — switches, dropdown triggers, chevrons
    - `<Switch>` primitivo: medir altura atual (entregue por fase-4); se < 44px, aumentar via padding sem mudar visual aparente do thumb/track
    - `<Dropdown>` triggers (entregue por fase-4): medir e ajustar
    - Chevrons de paginação/carousel em listagens: aumentar hit-region via padding
    - _Requirements: 2.3, 2.4_

  - [x] 4.6 Re-rodar inventário e confirmar count
    - Rodar `grep_search` por `min-h-\[44px\]` em `src/**/*.{tsx,ts}` — confirmar count > 0 (baseline era 0)
    - Anexar antes/depois em `mockups-diff.md > §Critical Controls inventário > Aplicação`
    - _Requirements: 2.2_

- [x] 5. Wave Teclado Virtual
  - [x] 5.1 Adicionar `interactiveWidget: "resizes-content"` em `<meta name="viewport">`
    - Atualizar `src/app/layout.tsx` adicionando `interactiveWidget: "resizes-content"` em `metadata.viewport` ou em `export const viewport`
    - Comportamento esperado: em iOS Safari 16+ e Android Chrome moderno, abrir teclado virtual reduz o viewport CSS
    - _Requirements: 3.2_

  - [x] 5.2 Confirmar `100dvh` em `reels-feed.tsx` preservado
    - Verificar `src/components/reels/reels-feed.tsx:172,405` continua usando `100dvh` (não regredir)
    - Não há outras migrações `100vh` → `100dvh` necessárias (medido: 0 ocorrências de `100vh`)
    - _Requirements: 3.3, 3.6_

  - [x] 5.3 Smoke browser manual no fluxo de login
    - Acessar `/entrar` em iOS Safari + Android Chrome
    - Focar input de email; confirmar input visível, CTA "Entrar" acessível
    - Anexar nota em `mockups-diff.md > §Smoke teclado virtual > Login`
    - _Requirements: 3.4_

  - [x] 5.4 Smoke browser manual no fluxo de cadastro
    - Acessar `/cadastro/cliente` e `/cadastro/acompanhante` em iOS Safari + Android Chrome
    - Focar inputs principais (nome, email, telefone); confirmar sem corte e CTA acessível
    - Anexar nota em `mockups-diff.md > §Smoke teclado virtual > Cadastro`
    - _Requirements: 3.4_

  - [x] 5.5 Smoke browser manual no fluxo de comentário
    - Acessar `/p/<slug>` ou `/reels` em iOS Safari + Android Chrome
    - Abrir overlay de comentários; focar `<input>` ou `<textarea>` de comentário; confirmar input visível e botão "Enviar" acessível
    - Anexar nota em `mockups-diff.md > §Smoke teclado virtual > Comentário`
    - _Requirements: 3.4_

  - [x] 5.6 Smoke browser manual no fluxo de suporte
    - Acessar `/painel/suporte` em iOS Safari + Android Chrome (autenticado)
    - Criar chamado; focar `<textarea>` de mensagem; confirmar input visível e botão de envio acessível
    - Acessar `/painel/suporte/[id]` e responder; confirmar mesmo behavior
    - Anexar nota em `mockups-diff.md > §Smoke teclado virtual > Suporte`
    - _Requirements: 3.4_

  - [x] 5.7 Decidir criação opcional de `useVirtualKeyboard`
    - Se algum dos smokes (5.3–5.6) revelar caso onde CSS sozinho não basta (header sticky precisa colapsar, CTA fixo precisa ser empurrado), criar `src/lib/hooks/use-virtual-keyboard.ts` com signature `(): { isOpen: boolean, height: number }` lendo `window.visualViewport.resize`
    - Re-exportar em `src/lib/hooks/index.ts`
    - Aplicar no(s) site(s) específico(s)
    - Documentar decisão (criado vs não-criado) em `mockups-diff.md > §Smoke teclado virtual > Hook`
    - _Requirements: 3.5_

- [x] 6. Wave Bottom-sheet
  - [x] 6.1 Decidir criação opcional de `useMediaQuery`
    - Se ≥ 2 consumidores precisarem (cf. classificação em 2.4 — `bottom_sheet_em_mobile` count), criar `src/lib/hooks/use-media-query.ts` com signature `(query: string): boolean` usando `useSyncExternalStore` + `window.matchMedia`
    - SSR-safe: snapshot server-side `false` (default desktop)
    - Re-exportar em `src/lib/hooks/index.ts`
    - Caso o count seja 1, uso direto de `window.matchMedia` no site único é aceitável (decisão registrada em `mockups-diff.md > §Bottom-sheet decisões > useMediaQuery`)
    - _Requirements: 4.3_

  - [x] 6.2 Aplicar bottom-sheet em `src/app/conta/perfil/client-profile-edit.tsx`
    - Substituir `position="center"` por `position={isMobile ? "bottom" : "center"}` lendo `useMediaQuery("(max-width: 640px)")` (ou `window.matchMedia` direto se 6.1 decidir não criar hook)
    - Validar visualmente em mobile e desktop (Chrome DevTools)
    - _Requirements: 4.4_

  - [x] 6.3 Aplicar bottom-sheet nos demais sites classificados como `bottom_sheet_em_mobile`
    - Para cada site da Tarefa 2.4 marcado como `bottom_sheet_em_mobile`, aplicar a mesma transformação
    - Lista exata depende do inventário; espera-se 0–5 sites adicionais
    - _Requirements: 4.4_

  - [x] 6.4 Preservar Modal primitivo intocado
    - Confirmar via `git diff src/components/ui/modal.tsx` — zero alterações
    - Se houver alteração, é regressão: reverter
    - _Requirements: 4.6_

- [x] 7. Wave Diff Visual com 11 mockups
  - [x] 7.1 Criar `mockups-diff.md` em `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-6-mobile-cross-browser\`
    - Cabeçalho (autoria, data, master spec, phase id, master_design)
    - Seções esqueleto: §Mockups baseline, §Browser Matrix, §Critical Controls inventário, §Bottom-sheet decisões, §Smoke teclado virtual, §Gestos baseline, §Gestos, §Mockups, §Lightbox responsivo, §Drawer mobile, §Bottom nav redesign, §Smoke checks finais
    - As seções podem ser preenchidas em paralelo pelas demais Waves
    - _Requirements: 5.2_

  - [x] 7.2 Diff visual: Mockup 1 — `Dashboard _ vis_o geral.png` × `src/app/painel/page.tsx`
    - Comparar lado a lado (smoke browser manual ou pelo menos visual estático)
    - Listar `divergencias_aceitas` e `divergencias_a_corrigir` (cross-reference a Requirements 2/3/4/6/7 quando aplicável)
    - Anexar entrada em `mockups-diff.md > §Mockups`
    - _Requirements: 5.2, 5.3_

  - [x] 7.3 Diff visual: Mockup 2 — `Fila de modera_o.png` × `src/app/admin/moderacao/page.tsx`
    - Mesma estrutura
    - _Requirements: 5.2, 5.3_

  - [x] 7.4 Diff visual: Mockup 3 — `Financeiro _Premium_.png` × `src/app/painel/financeiro/page.tsx`
    - Mesma estrutura
    - _Requirements: 5.2, 5.3_

  - [x] 7.5 Diff visual: Mockup 4 — `Home _ landing.png` × `src/app/page.tsx`
    - Mesma estrutura
    - _Requirements: 5.2, 5.3_

  - [x] 7.6 Diff visual: Mockup 5 — `Listagem com filtros.png` × `src/app/buscar/page.tsx` ou `src/app/descobrir/[citySlug]/page.tsx`
    - Decidir tela alvo correta caso a caso (provável: `/buscar`)
    - _Requirements: 5.2, 5.3_

  - [x] 7.7 Diff visual: Mockup 6 — `Onboarding _ Passo 03 _ Fotos.png` × `src/app/conta/onboarding/fotos/page.tsx`
    - Mesma estrutura
    - _Requirements: 5.2, 5.3_

  - [x] 7.8 Diff visual: Mockup 7 — `Perfil p_blico.png` × `src/app/p/[slug]/page.tsx`
    - Mesma estrutura
    - _Requirements: 5.2, 5.3_

  - [x] 7.9 Diff visual: Mockup 8 — `Planos _ pre_os.png` × `src/app/planos/page.tsx`
    - Mesma estrutura
    - _Requirements: 5.2, 5.3_

  - [x] 7.10 Diff visual: Mockup 9 — `Solicita_es pendentes.png` × `src/app/painel/page.tsx` (cards de solicitação)
    - Confirmar se é `/painel` ou rota dedicada existente; se for feature não-implementada, marcar `tela_alvo: nao_implementada`
    - _Requirements: 5.2, 5.3, 5.6_

  - [x] 7.11 Diff visual: Mockup 10 — `Solicitar encontro _cliente logado_.png` × `src/app/solicitar/[slug]/page.tsx`
    - Mesma estrutura
    - _Requirements: 5.2, 5.3_

  - [x] 7.12 Diff visual: Mockup 11 — `Verifica_o de identidade.png` × `src/app/conta/verificacao/page.tsx`
    - Mesma estrutura
    - _Requirements: 5.2, 5.3_

  - [x] 7.13 Aplicar correções de divergências `a corrigir` que caibam no escopo das demais Waves
    - Cada `divergencias_a_corrigir` listada nas 11 entradas deve ser cross-referenced a Requirement 2/3/4/6/7
    - Quando NÃO couber, registrar como `OutOfScopeFinding` em `requirements.md > §3` com commit no master ANTES de absorver
    - Atualizar a entrada do mockup correspondente substituindo a linha por referência ao OutOfScopeFinding
    - _Requirements: 5.4_

- [x] 8. Wave Gestos
  - [x] 8.1 Aplicar `touch-action: none` (Tailwind: `touch-none`) em lightboxes/story viewers fullscreen
    - Sites alvo:
      - `src/app/painel/midias/midias-manager.tsx:397` (Modal `position="fullscreen"`)
      - `src/components/stories/story-bar.tsx:287` (Modal `position="fullscreen"`)
      - `src/components/profile/profile-story-cover.tsx:234` (Modal `position="fullscreen"`)
      - `src/components/profile/media-gallery.tsx:178` (overlay inline — também tratado pelo Wave 9 quando `<MediaLightbox>` aplicado)
    - Aplicar `className="touch-none ..."` no container raiz do overlay
    - _Requirements: 6.3_

  - [x] 8.2 Aplicar `overscroll-behavior: contain` (Tailwind: `overscroll-contain`/`overscroll-y-contain`) em containers com scroll interno
    - Sites alvo:
      - `src/components/reels/reels-feed.tsx` (container vertical com `snap-y snap-mandatory`) — `overscroll-y-contain` para preservar snap-y mas evitar propagação
      - Lista de comentários em modal (paths identificados durante 5.5)
      - Drawer mobile (`src/components/painel/painel-sidebar.tsx:225` — também tratado pelo Wave 9 quando `<Drawer>` aplicado)
    - _Requirements: 6.4, 6.6_

  - [x] 8.3 Aplicar `overscroll-behavior-y: none` em rotas onde pull-to-refresh é destrutivo
    - Sites alvo: `/painel/midias` durante upload, `/painel/reels` durante upload
    - Estratégia: aplicar via `<body className={...}>` em layout específico OU via classe utilitária no container raiz da rota durante a ação de upload
    - Decisão exata por rota é registrada em `mockups-diff.md > §Gestos > Pull-to-refresh`
    - _Requirements: 6.5_

  - [x] 8.4 Documentar a tabela de gestos em `mockups-diff.md > §Gestos`
    - Tabela com colunas: `superficie`, `gesto`, `comportamento_esperado_iOS`, `comportamento_esperado_Android`, `comportamento_esperado_desktop`, `mecanismo`
    - Mínimo de linhas: lightboxes (pinch), reels-feed (overscroll), drawer (overscroll), upload routes (pull-to-refresh)
    - _Requirements: 6.2_

  - [x] 8.5 Smoke browser manual em iOS Safari + Android Chrome
    - Validar que: pinch no overlay não acontece; overscroll em feed não propaga para body; pull-to-refresh nas rotas listadas não dispara durante upload
    - Anexar notas em `mockups-diff.md > §Smoke gestos`
    - _Requirements: 6.7_

- [x] 9. Wave `<MediaLightbox>` responsivo
  - [x] 9.1 Decidir local do primitivo
    - Opção A: `src/components/profile/media-lightbox.tsx` (próximo do consumidor original `media-gallery.tsx`)
    - Opção B: `src/components/ui/lightbox.tsx` (se reuso por outras superfícies for esperado)
    - Decisão registrada em `mockups-diff.md > §Lightbox responsivo`
    - Default: Opção A (escopo limitado)
    - _Requirements: 7.2_

  - [x] 9.2 Criar `<MediaLightbox>` como wrapper sobre Modal
    - API: `<MediaLightbox open onClose className?>{children}</MediaLightbox>`
    - Implementação consome `useMediaQuery("(max-width: 640px)")` (criado em 6.1) ou `window.matchMedia` direto
    - Aplica `position={isMobile ? "fullscreen" : "center"}` ao Modal interno
    - Aplica `touch-action: none` no overlay raiz (cf. Wave 8 — alinhar com Tarefa 8.1)
    - **Zero hex literal** e **zero `text-[Npx]`** no arquivo
    - _Requirements: 7.3_

  - [x] 9.3 Substituir overlay inline em `src/components/profile/media-gallery.tsx:178` por `<MediaLightbox>`
    - Preservar comportamento atual (gestos, navegação entre mídias, fechamento)
    - Validar visualmente que mobile permanece fullscreen e desktop vira centered
    - Atualizar `OutOfScopeFinding` herdado em `requirements.md > §3` referenciando o commit que entrega esta tarefa
    - _Requirements: 7.1, 7.3_

  - [x] 9.4 Smoke test determinístico para `<MediaLightbox>`
    - Renderizar com `useMediaQuery` mockado para `true` e `false`; afirmar que `Modal` recebe `position="fullscreen"` ou `position="center"`
    - ARIA preservado (Modal já fornece `role="dialog"`)
    - _Requirements: 7.3_

- [x] 10. Wave `<Drawer>` mobile
  - [x] 10.1 Decidir criação do primitivo `<Drawer>`
    - Avaliar complexidade: `<Drawer>` reusa Modal-like patterns (`useScrollLock`, `useEscapeKey`, `useFocusTrap`) mas tem comportamento de transição lateral próprio
    - Se decidir criar: prosseguir com 10.2–10.4
    - Se decidir manter inline: aplicar apenas `overscroll-behavior: contain` em `painel-sidebar.tsx:225` (cf. 8.2) e registrar a decisão
    - Registrar decisão em `mockups-diff.md > §Drawer mobile` com justificativa
    - **Decisão fase-6**: manter inline (cf. `mockups-diff.md > §Drawer mobile`). Tasks 10.2–10.4 não executadas.
    - _Requirements: 7.2_

  - [x] 10.2 Criar `src/components/ui/drawer.tsx` (se decidido em 10.1) — **N/A: cancelado por 10.1**
    - API: `<Drawer open onClose side?: "left"|"right" className?>{children}</Drawer>`
    - Implementação: backdrop fixo + painel com `translate-x` baseado em `open` e `side`
    - Reusa hooks da fase-4: `useScrollLock`, `useEscapeKey`, `useFocusTrap`
    - Aplica `overscroll-behavior: contain` no painel
    - **Zero hex literal** e **zero `text-[Npx]`** no arquivo
    - **N/A — manter inline** (cf. 10.1).
    - _Requirements: 7.4_

  - [x] 10.3 Substituir drawer inline em `src/components/painel/painel-sidebar.tsx:225` por `<Drawer>` (se 10.2 executado) — **N/A: cancelado por 10.1**
    - Preservar comportamento atual (toggle, links, transição)
    - Validar visualmente em mobile (Chrome DevTools mobile emulation)
    - **N/A — manter inline** (cf. 10.1). `overscroll-behavior: contain` aplicado direto na aside inline (cf. Wave 8.2).
    - _Requirements: 7.4_

  - [x] 10.4 Smoke test determinístico para `<Drawer>` (se 10.2 executado) — **N/A: cancelado por 10.1**
    - Renderizar com `open=true`, `side="left"`/`right"`
    - Afirmar backdrop renderizado, painel com transform correto, click no backdrop dispara `onClose`, ESC dispara `onClose`
    - Focus trap delegado a `useFocusTrap` (já testado por fase-4 — não retesta)
    - **N/A — manter inline** (cf. 10.1).
    - _Requirements: 7.4_

- [x] 11. Wave Bottom nav redesign
  - [x] 11.1 Aplicar redesign pontual em `src/components/layout/bottom-nav.tsx`
    - Aplicar `min-h-[44px] min-w-[44px]` em cada item (alinha com 4.2 — Critical_Control categoria b)
    - Ajustar labels e badges conforme mockup(s) que mostram bottom nav (provavelmente Home / Listagem com filtros / Dashboard)
    - Aplicar tokens da fase-4 onde houver hex literal residual (deve estar zero — confirmar)
    - **Não fazer redesign visual amplo** (mais ícones, layout radicalmente diferente, troca de componente) — vira `OutOfScopeFinding`
    - _Requirements: 7.5_

  - [x] 11.2 Documentar divergências aceitas / a corrigir em `mockups-diff.md > §Bottom nav redesign`
    - Cross-reference às entradas dos mockups no §Mockups quando aplicável
    - _Requirements: 7.5_

- [x] 12. PBTs co-localizados (gate de testes)
  - [x] 12.1 * Implementar Property 1 — bottom-sheet responsivo determinístico
    - Local: arquivo `*.pbt.ts` ou `*.test.tsx` co-localizado com o consumidor representativo (ex.: `src/app/conta/perfil/client-profile-edit.test.tsx` ou `client-profile-edit.pbt.tsx`)
    - Para todo `width ∈ [320, 1920]`, mockar `window.matchMedia("(max-width: 640px)")` para `matches: width <= 640`, renderizar via Testing Library e verificar que `Modal` recebe `position="bottom"` quando `width <= 640` e `position="center"` caso contrário
    - Geradores: `fc.integer({ min: 320, max: 1920 })` (alternativa: loop `it.each` se PBT não couber bem)
    - _Requirements: 4.5_
    - _Validates: Property 1_

  - [x] 12.2 * Implementar Property 2 — Critical_Control bounding rect / className
    - Local: `src/components/_tests/touch-target.pbt.tsx` ou `touch-target.test.tsx`
    - Para cada `Critical_Control` representativo (lista finita congelada na Tarefa 2.3), renderizar via Testing Library e afirmar:
      - Forma A (preferida se jsdom calcular layout): `getBoundingClientRect()` retorna `width >= 44 && height >= 44`
      - Forma B (fallback): className contém `min-h-[44px] min-w-[44px]` ou tokens equivalentes
    - Gerador: `fc.constantFrom(...lista)` ou `it.each(lista)`
    - Documentar em comentário no teste qual forma foi usada e por quê
    - _Requirements: 2.5_
    - _Validates: Property 2_

  - [x] 12.3 Validar suite completa de testes não regrediu
    - `npm run test` termina com exit 0 e todos os testes passam
    - Numero de testes deve ser ≥ baseline da fase-5 (293 testes em 2026-05-17) + novos (touch target + bottom-sheet responsivo + lightbox + drawer + properties)
    - Anexar log em `mockups-diff.md > §Smoke checks finais`
    - _Requirements: 2.5, 4.5, 7.3, 7.4_

- [x] 13. Smoke checks finais
  - [x] 13.1 `npm run lint` — registrar baseline
    - Esperado: 0 erros **novos** introduzidos pela fase-6 em arquivos do escopo
    - Erros pré-existentes (cf. handoff: 71 problems = 29 errors + 42 warnings com tolerância em CI da fase-7) podem permanecer
    - Refactor das Waves 4 (touch target) e 9/10 (Lightbox/Drawer) pode resolver alguns como efeito colateral; quando restarem, ficam para fase-7 (já `Done`)
    - Anexar log em `mockups-diff.md > §Smoke checks finais`
    - _Requirements: 7.5_

  - [x] 13.2 `npx tsc --noEmit` — zero erros de tipo
    - Bloqueio duro: se houver erros, corrigir antes de prosseguir
    - Anexar log
    - _Requirements: 7.3, 7.4_

  - [x] 13.3 `npm run test` — todos os testes verdes
    - Bloqueio duro
    - Numero ≥ baseline da fase-5 (293) + novos
    - Anexar log
    - _Requirements: 2.5, 4.5, 12.3_

  - [x] 13.4 `npm run build` — build limpo
    - Bloqueio mole: se falhar com erro pré-existente em prerender de `/api/cities` quando DB local não roda, **não é regressão** (cf. handoff)
    - Em ambiente com DB acessível ou em CI, deve concluir
    - Anexar log
    - _Requirements: 1.6_

  - [x] 13.5 `npm run test:e2e -- --list` — 4 projects listados
    - Bloqueio duro: lista deve incluir `ios-safari`, `desktop-chrome`, `desktop-firefox`, `android-chrome`
    - Execução completa dos specs nos 4 projects é opcional
    - Anexar log
    - _Requirements: 1.6_

  - [x] 13.6 Smoke browser manual final
    - Cobrir desktop Safari + desktop Edge (cf. 3.4) — visualizar 3 telas-âncora (`/`, `/p/[slug]`, `/painel`) em cada
    - Anexar nota com browser/versão usada e resultado em `mockups-diff.md > §Smoke checks finais > Cross-browser manual`
    - _Requirements: 1.4_

- [x] 14. Saída desta fase
  - [x] 14.1 Validar saída
    - Todos os 8 Requirements de `requirements.md` têm evidência (path:linha de código, log de teste, screenshot/nota de smoke browser, ou link de PR/commit) anexada
    - `mockups-diff.md` cobre todas as seções: Browser Matrix, Mockups (11 entradas), Critical Controls inventário, Bottom-sheet decisões, Smoke teclado virtual, Gestos baseline, Gestos, Lightbox responsivo, Drawer mobile, Bottom nav redesign, Smoke checks finais
    - `requirements.md > §3 OutOfScopeFinding`: as 2 linhas iniciais agora referenciam commit que as absorveu via Requirement 7; novas linhas (se houver) referenciam commit no master spec
    - `requirements.md > §4 AGENTS_Rule`: permanece `n/a` OU foi substituída por linha de consulta + a fase passou a tocar `NextApiArea` (registrar exceção)
    - `<MediaLightbox>` existe em `src/components/profile/media-lightbox.tsx` (ou alternativa Opção B), com teste determinístico
    - `<Drawer>` existe em `src/components/ui/drawer.tsx` OU decisão `manter inline` registrada
    - `useMediaQuery` existe em `src/lib/hooks/use-media-query.ts` OU decisão `uso direto` registrada
    - `useVirtualKeyboard` existe em `src/lib/hooks/use-virtual-keyboard.ts` OU decisão `não criado` registrada
    - `playwright.config.ts` tem 4 projects (`ios-safari`, `desktop-chrome`, `desktop-firefox`, `android-chrome`)
    - `<meta name="viewport">` em `src/app/layout.tsx` declara `interactiveWidget: "resizes-content"`
    - Properties 1 e 2 rodam verde
    - _Requirements: 1.6, 2.5, 3.4, 4.5, 5.2, 6.7, 7.3, 7.4, 8.2_

  - [x] 14.2 [orquestrador] Atualizar Phase Card no master `requirements.md`
    - **Esta tarefa é executada pelo orquestrador, não pelo executor da fase**
    - `state: SpawnReady` ou `InProgress` → `state: Done`
    - Adicionar `doneAt` ISO-8601 no formato `YYYY-MM-DDTHH:MM:SSZ`
    - Manter `child_spec_path` apontando para esta pasta
    - Esta é a **última fase** da auditoria — após `Done`, **todas as 7 fases do master `auditoria-geral` ficam `Done`** e o master fecha
    - Atualizar `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\handoff.md` registrando a entrega final
    - _Requirements: 1.1_

## Notes

- Tarefas com `*` (12.1, 12.2) entregam testes baseados em propriedade conforme as Properties declaradas em `design.md > Correctness Properties`. Tarefas sem `*` entregam testes determinísticos, código de produto ou documentação.
- A Wave 7 (Diff Visual) tem 11 sub-tarefas (uma por mockup) que podem rodar em paralelo, mas cada uma pode disparar `OutOfScopeFinding` (commit no master ANTES de absorver). A Tarefa 7.13 só fecha depois de todas as 7.2–7.12.
- A Wave 8 (Gestos) toca arquivos que também aparecem na Wave 9 (Lightbox); coordenar para não criar conflito de edição. Estratégia: aplicar `touch-action: none` na Wave 8 ANTES de migrar para `<MediaLightbox>` na Wave 9 (mais simples) OU aplicar dentro do próprio `<MediaLightbox>` (uma vez só).
- A Wave 10 (Drawer) é toda **opcional** — depende da decisão na 10.1. Se `manter inline`, apenas a Tarefa 8.2 toca o drawer.
- A Wave 5 (Teclado Virtual) tem smokes manuais que dependem de iOS Safari + Android Chrome reais — se o executor não tiver acesso, marcar como pendente para o usuário e seguir.
- Toda alteração que extrapole o escopo desta fase **NÃO** é absorvida — vira `OutOfScopeFinding` em `requirements.md > §3` com commit no master.
- Como esta é a **última fase** da auditoria, a 14.2 é a tarefa de fechamento do master `auditoria-geral`.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "2.4", "2.5"] },
    { "id": 2, "tasks": ["3.1"] },
    { "id": 3, "tasks": ["3.2"] },
    { "id": 4, "tasks": ["3.3", "3.4"] },
    { "id": 5, "tasks": ["4.1", "4.2", "4.3", "4.4", "4.5"] },
    { "id": 6, "tasks": ["4.6"] },
    { "id": 7, "tasks": ["5.1", "5.2"] },
    { "id": 8, "tasks": ["5.3", "5.4", "5.5", "5.6"] },
    { "id": 9, "tasks": ["5.7"] },
    { "id": 10, "tasks": ["6.1"] },
    { "id": 11, "tasks": ["6.2", "6.3"] },
    { "id": 12, "tasks": ["6.4"] },
    { "id": 13, "tasks": ["7.1"] },
    { "id": 14, "tasks": ["7.2", "7.3", "7.4", "7.5", "7.6", "7.7", "7.8", "7.9", "7.10", "7.11", "7.12"] },
    { "id": 15, "tasks": ["7.13"] },
    { "id": 16, "tasks": ["8.1", "8.2", "8.3"] },
    { "id": 17, "tasks": ["8.4", "8.5"] },
    { "id": 18, "tasks": ["9.1"] },
    { "id": 19, "tasks": ["9.2"] },
    { "id": 20, "tasks": ["9.3", "9.4"] },
    { "id": 21, "tasks": ["10.1"] },
    { "id": 22, "tasks": ["10.2"] },
    { "id": 23, "tasks": ["10.3", "10.4"] },
    { "id": 24, "tasks": ["11.1", "11.2"] },
    { "id": 25, "tasks": ["12.1", "12.2"] },
    { "id": 26, "tasks": ["12.3"] },
    { "id": 27, "tasks": ["13.1", "13.2", "13.3", "13.4", "13.5", "13.6"] },
    { "id": 28, "tasks": ["14.1"] },
    { "id": 29, "tasks": ["14.2"] }
  ]
}
```

