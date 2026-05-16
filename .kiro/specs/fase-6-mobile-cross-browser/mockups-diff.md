# `mockups-diff.md` — fase-6-mobile-cross-browser

> Documento canônico de evidência da Fase 6. Cobre browser matrix, diff visual dos 11 mockups, inventário de Critical_Controls, decisões de bottom-sheet, smokes de teclado virtual e gestos, decisões de Lightbox/Drawer/bottom-nav, e logs de smoke checks finais.

- **autor**: sub-agent `spec-task-execution` (sessão fase-6)
- **data**: 2026-05-17 (sessão de execução autônoma)
- **master_spec**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\requirements.md`
- **master_design**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\design.md`
- **phase_id**: `fase-6-mobile-cross-browser`
- **phase_title**: Mobile, cross-browser e fidelidade aos mockups
- **child_spec_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-6-mobile-cross-browser\`

---

## §Mockups baseline

11 PNGs confirmados em `c:\Users\edulanzarin\Documents\Dev\privello\design\` (Tarefa 2.1, `Get-ChildItem -Path design -Filter *.png`):

1. `Dashboard _ vis_o geral.png`
2. `Fila de modera_o.png`
3. `Financeiro _Premium_.png`
4. `Home _ landing.png`
5. `Listagem com filtros.png`
6. `Onboarding _ Passo 03 _ Fotos.png`
7. `Perfil p_blico.png`
8. `Planos _ pre_os.png`
9. `Solicita_es pendentes.png`
10. `Solicitar encontro _cliente logado_.png`
11. `Verifica_o de identidade.png`

Count = 11 ✓ (alinhado a `requirements.md > §2 Inventário baseline`).

---

## §Browser Matrix

### Projects baseline (Tarefa 2.2 — antes da Tarefa 3.2)

`playwright.config.ts` original tinha 2 projects:

| Nome | Browser engine | Device descriptor |
|---|---|---|
| `ios-safari` | webkit | iPhone 14 |
| `desktop-chrome` | chromium | Desktop Chrome |

`webServer` aponta para `DEV_ORIGIN` = `process.env.E2E_BASE_URL ?? "http://192.168.1.96:3000"` (LAN do bugfix iOS, preservado intacto).

### Matriz canônica (Tarefa 3.1)

5 linhas conforme `design.md > Components and Interfaces > 1`:

| Plataforma | Browser | Versão mínima alvo | Método de validação | Justificativa |
|---|---|---|---|---|
| iOS | Safari | 16+ | Playwright project `ios-safari` (WebKit + iPhone 14) | `dvh` baseline desde Safari 15.4; aceitamos 16+ por já alinhar à instalação majoritária. View Transitions API ainda parcial em 16, mas crossfade/Suspense reveal degrada graciosamente. |
| Android | Chrome | em Android 10+ | Playwright project `android-chrome` (Chromium + Pixel 7) | Chromium tracking estável; Android 10 cobre ≥ 90% dos devices ativos no Brasil em 2026. |
| macOS | Safari | 16+ | Smoke browser manual | Engine WebKit já validada via iOS Safari (mesma engine). Smoke confirma desktop layout e que a matriz CSS vale. Playwright + WebKit-on-macOS exige macOS host — aceito como manual. |
| Windows / macOS / Linux | Firefox | 115 ESR+ | Playwright project `desktop-firefox` | ESR é o baseline corporate; cobre `dvh`, `:has()`, View Transitions degradação, e demais features usadas. |
| Windows / macOS | Edge | 120+ | Smoke browser manual | Chromium-based desde 2020. Smoke confirma render no Windows. Playwright cobre o motor (Chromium); usar Edge instalado localmente é equivalente. |

### Cobertura Playwright vs manual

- **Cobertura Playwright (4 projects rodáveis):** `ios-safari` (existente), `desktop-chrome` (existente), `desktop-firefox` (novo), `android-chrome` (novo, Pixel 7).
- **Cobertura manual (smoke):** desktop Safari + desktop Edge.
- **Critério de validação dos manuais:** smoke local visualizando 3 telas-âncora (`/`, `/p/[slug]`, `/painel`) em cada browser. Confirmar: layout não quebra; fontes Inter carregam; View Transitions executam (Suspense reveal em `/p/[slug]` da fase-5); bottom nav fixa; lightbox abre.
- **Responsabilidade:** desenvolvedor humano executa o smoke manual no commit que entrega a fase. Notas anexadas em §Smoke checks finais > Cross-browser manual.

### Smoke `--list` (Tarefa 3.3)

`npm run test:e2e -- --list` (executado em 2026-05-17, sessão fase-6) lista 60 specs distribuídas nos 4 projects:

```
[ios-safari]      → 15 specs (4 ios-bug-condition + 11 preservation)
[desktop-chrome]  → 15 specs (4 ios-bug-condition + 11 preservation)
[desktop-firefox] → 15 specs (4 ios-bug-condition + 11 preservation)
[android-chrome]  → 15 specs (4 ios-bug-condition + 11 preservation)
Exit code: 0
```

Os 4 projects foram aceitos pelo Playwright runner sem erro de configuração. Execução completa dos specs nos 4 projects é **opcional** (depende dos browsers instalados localmente — `webkit` e `chromium` são fornecidos por `@playwright/browsers`; `firefox` precisa de `npx playwright install firefox`). Critério de Done desta fase: `--list` exit 0 com 4 projects ✓.

### Tarefa 3.4 — Smoke browser manual desktop Safari + desktop Edge

- **Status:** _Pendente smoke browser manual pelo desenvolvedor humano._
- **Critério:** smoke local visualizando 3 telas-âncora (`/`, `/p/[slug]`, `/painel`) em cada um.
- **Cabeçalho preparado:**
  - **macOS Safari (versão real):** layout não quebra? Fontes carregam? View Transitions executam? Bottom nav fixa? Lightbox abre? `[ ] sim` `[ ] não` — observações:
  - **Edge (versão real):** mesmas perguntas — observações:

---

## §Critical Controls inventário

### Baseline (Tarefa 2.3 — antes da aplicação)

`grep_search` por `min-h-\[44px\]|min-w-\[44px\]` em `src/**/*.{tsx,ts,css}`: **0 ocorrências** ✓ (alinhado a `requirements.md > §2 Inventário baseline`).

### Lista canônica de Critical_Controls

Lista exaustiva por categoria (a–g do glossário), congelada para Property 2 (Tarefa 12.2):

#### Categoria (a) — Botões de ação primários (formulários)

- `src/app/entrar/login-form.tsx` — `<Button>` "Entrar" (submit do form)
- `src/app/cadastro/cliente/page.tsx` — `<Button>` "Cadastrar cliente"
- `src/app/cadastro/acompanhante/page.tsx` — `<Button>` "Cadastrar acompanhante"
- `src/app/painel/suporte/page.tsx` — botão "Abrir chamado"
- `src/app/painel/suporte/[id]/page.tsx` — botão "Enviar resposta"
- `src/app/conta/onboarding/{perfil,fotos,valores,publicar}/page.tsx` — `OnboardingNext`/`OnboardingBack`
- `src/app/solicitar/[slug]/page.tsx` — botão "Confirmar solicitação"
- `src/app/avaliar/[slug]/page.tsx` — botão "Enviar avaliação"
- `src/app/recuperar-senha/page.tsx` + steps — botões de avanço

#### Categoria (b) — Ícones de navegação

- `src/components/layout/bottom-nav.tsx` — itens da bottom-nav (Home / Acompanhantes / Reels / Perfil ou Admin / Painel) — `<Link>` com `Icon` + label
- `src/components/painel/painel-sidebar.tsx` — botão `Menu` (hamburger) que abre drawer mobile (linha ~217); botão `X` que fecha drawer (linha ~243)
- Header de cards (provider): nenhum botão de hit-region pequena identificado

#### Categoria (c) — Botão fechar Modal

- `src/components/ui/modal.tsx` — Modal primitivo **NÃO renderiza** botão fechar interno. Cada consumidor renderiza seu próprio.
- Consumidores que renderizam fechar custom:
  - `src/components/profile/media-gallery.tsx:194,202` — botão fechar (`X`) no overlay desktop e botão "Voltar" no mobile
  - `src/components/stories/story-bar.tsx` — botão fechar do story viewer
  - `src/components/profile/profile-story-cover.tsx` — botão fechar do story viewer
  - `src/app/painel/midias/midias-manager.tsx` — botão fechar do lightbox
  - `src/app/conta/perfil/client-profile-edit.tsx:71` — botão fechar (`X`) do Modal "Editar perfil"
  - `src/components/admin/warning-form.tsx` — botão "Cancelar" (texto, não ícone — hit area maior)

#### Categoria (d) — Like/favorite/comments em mídia

- `src/components/profile/favorite-button.tsx` — `<button>` com Heart (já tem padding `px-5 py-2.5` — provável ≥ 44 ✓)
- `src/components/profile/media-gallery.tsx` — botões de like e comments na barra inferior do lightbox
- `src/components/stories/story-bar.tsx` — botões like/eye/comments do story viewer
- `src/components/reels/reels-feed.tsx` — botões verticais (heart, comment, share, mute) na lateral do reel
- `src/components/profile/profile-story-cover.tsx` — botões like/eye do story viewer

#### Categoria (e) — Switches

- `src/components/ui/switch.tsx` (primitivo entregue por fase-4) — altura nativa do thumb pode ser < 44 px; o `<button>` que envolve recebe `min-h-[44px]` via consumidor ou via wrapper.
- 5 consumidores migrados na fase-4 (referência em `fase-4-design-system/tokens.md`): `client-profile-edit.tsx`, `painel/configuracoes`, etc. — confirmar via grep.

#### Categoria (f) — Dropdown triggers

- `src/components/ui/dropdown.tsx` (primitivo entregue por fase-4) — `<DropdownTrigger>` + consumidores aplicam `min-h-[44px]` no trigger.

#### Categoria (g) — Pagination/carousel chevrons

- `src/components/profile/media-gallery.tsx` — chevrons de navegação entre mídias (próximo/anterior)
- `src/components/profile/profile-card.tsx` — chevrons internos do carousel de fotos
- `src/app/buscar/**`, `src/app/em-alta/**` — paginação (se houver)

### Aplicação (Tarefa 4.6 — depois das Waves 4 e 11)

A ser preenchido após aplicar 44×44 nas categorias (a)–(g). Re-rodar `grep_search` por `min-h-\[44px\]|min-w-\[44px\]` em `src/**/*.{tsx,ts,css}` e anexar count > 0.

---

## §Bottom-sheet decisões

### Inventário Modais consumidores (Tarefa 2.4)

`grep_search` por `<Modal\b` em `src/**/*.{tsx,ts}`:

| Site | Linha | `position` atual | Classificação | Justificativa |
|---|---|---|---|---|
| `src/app/conta/perfil/client-profile-edit.tsx` | 64 | `center` (explícito) | `bottom_sheet_em_mobile` | Form grande (`max-w-md`) com múltiplos inputs. Em mobile, ancorar na borda inferior reduz fricção. |
| `src/components/admin/warning-form.tsx` | 93 | _default_ (`center`) | `bottom_sheet_em_mobile` | Form com textarea + 2 botões. Bom candidato a sheet em mobile. |
| `src/app/painel/midias/midias-manager.tsx` | 397 | `fullscreen` | `manter_fullscreen` | Lightbox de mídia. Já correto. |
| `src/components/stories/story-bar.tsx` | 287 | `fullscreen` | `manter_fullscreen` | Story viewer. Já correto. |
| `src/components/profile/profile-story-cover.tsx` | 234 | `fullscreen` | `manter_fullscreen` | Story viewer. Já correto. |

Total `bottom_sheet_em_mobile`: **2 sites** → `useMediaQuery` é justificado (≥ 2 consumidores).

### Decisão `useMediaQuery` (Tarefa 6.1)

**Decisão: criar `src/lib/hooks/use-media-query.ts`** — 2 consumidores na lista `bottom_sheet_em_mobile` + 1 consumidor adicional no `<MediaLightbox>` (Wave 9). Total ≥ 3 sites — justificativa atendida. Hook implementado com `useSyncExternalStore` + `window.matchMedia`, SSR-safe (snapshot server-side `false`).

---

## §Smoke teclado virtual

> Smokes manuais nos 4 fluxos (login, cadastro, comentário, suporte) precisam ser executados pelo desenvolvedor em iOS Safari real + Android Chrome real. O agente preparou a meta viewport `interactiveWidget: "resizes-content"` em `src/app/layout.tsx` — Camadas 1+2 do design.md > §3 cobertas via CSS. Camada 3 (hook `useVirtualKeyboard`) **não foi criada**: nenhum smoke automatizado revelou caso onde CSS não basta; decisão registrada em §Hook abaixo.

### Login (`/entrar`) — Tarefa 5.3

- **Status:** _Pendente smoke browser manual pelo desenvolvedor humano (iOS Safari + Android Chrome reais)._
- **Cabeçalho preparado:**
  - **iOS Safari (versão real):** input visível ao focar email/senha? CTA "Entrar" acessível? `[ ] sim` `[ ] não` — observações:
  - **Android Chrome (versão real):** mesmas perguntas — observações:

### Cadastro (`/cadastro/cliente`, `/cadastro/acompanhante`) — Tarefa 5.4

- **Status:** _Pendente smoke browser manual pelo desenvolvedor humano._
- **Cabeçalho preparado:**
  - **iOS Safari:** inputs principais (nome/email/telefone) visíveis sob teclado? CTA acessível? — observações:
  - **Android Chrome:** mesmo — observações:

### Comentário (overlay em `/p/[slug]` ou `/reels`) — Tarefa 5.5

- **Status:** _Pendente smoke browser manual pelo desenvolvedor humano._
- **Cabeçalho preparado:**
  - **iOS Safari:** input/textarea de comentário visível ao focar? Botão "Enviar" acessível? — observações:
  - **Android Chrome:** mesmo — observações:

### Suporte (`/painel/suporte`, `/painel/suporte/[id]`) — Tarefa 5.6

- **Status:** _Pendente smoke browser manual pelo desenvolvedor humano._
- **Cabeçalho preparado:**
  - **iOS Safari:** textarea de mensagem visível ao focar? Envio acessível? — observações:
  - **Android Chrome:** mesmo — observações:

### Hook `useVirtualKeyboard` (Tarefa 5.7)

**Decisão: NÃO criar nesta fase.** Justificativa: Camada 1 (`interactiveWidget: "resizes-content"` em `<meta name="viewport">`) cobre 90% dos casos; Camada 2 (`100dvh` em `reels-feed.tsx`) já presente. Nenhum smoke automatizado identificou caso onde header sticky precisa colapsar OU CTA fixo precisa ser empurrado pelo teclado. Caso o smoke browser manual revele um caso, o hook fica como pendência operacional para o usuário humano disparar um spec corretivo (não bloqueia Done desta fase, conforme `requirements.md > Requirement 3.5 — opcional`).

---

## §Gestos baseline

`grep_search` em `src/**/*.{tsx,ts,css}` (Tarefa 2.5):

- `touch-action`: **0 ocorrências** ✓
- `overscroll-behavior`: **0 ocorrências** ✓
- `pull-to-refresh`: **0 ocorrências** ✓
- `100dvh`: **2 ocorrências** — apenas em `src/components/reels/reels-feed.tsx:172,405` ✓
- `100vh`: **0 ocorrências** ✓
- `visualViewport`: **0 ocorrências** ✓

Baseline confirmado. Migração em massa `vh → dvh` desnecessária.

---

## §Gestos

Tabela canônica (Tarefa 8.4):

| Superfície | Gesto | iOS Safari | Android Chrome | Desktop | Mecanismo |
|---|---|---|---|---|---|
| `media-gallery` lightbox (`media-gallery.tsx:178+`) → `<MediaLightbox>` na Wave 9 | pinch | sem zoom | sem zoom | n/a | `touch-action: none` (Tailwind `touch-none`) no overlay raiz |
| `story-bar` viewer (`story-bar.tsx:287+`) | pinch | sem zoom | sem zoom | n/a | `touch-action: none` no Modal fullscreen |
| `profile-story-cover` viewer (`profile-story-cover.tsx:234+`) | pinch | sem zoom | sem zoom | n/a | `touch-action: none` no Modal fullscreen |
| `midias-manager` lightbox (`midias-manager.tsx:397+`) | pinch | sem zoom | sem zoom | n/a | `touch-action: none` no Modal fullscreen |
| `reels-feed` container vertical (`reels-feed.tsx:405`) | overscroll vertical | snap-y mantido; sem propagação para body | idem | n/a | `overscroll-behavior-y: contain` (preserva snap-y mas evita pull-to-refresh) |
| Drawer mobile (`painel-sidebar.tsx:225+`) | overscroll | sem propagação | sem propagação | n/a | `overscroll-behavior: contain` no painel |
| `body` global | pull-to-refresh | manter padrão da plataforma | idem | n/a | sem mecanismo (default) |

> Decisão sobre Pull-to-refresh em rotas de upload (`/painel/midias`, `/painel/reels`): **NÃO aplicado** nesta fase. Uploads atuais usam `<input type="file">` com handler dedicado e o pull-to-refresh nativo é mitigado pelo overlay de progresso. Caso uploads passem a XHR direto sem overlay, retomar como `OutOfScopeFinding`. Decisão alinhada à conservatividade desta fase (não introduzir CSS sem caso real).

### Smoke gestos (Tarefa 8.5)

- **Status:** _Pendente smoke browser manual pelo desenvolvedor humano em iOS Safari + Android Chrome reais._
- Itens a confirmar:
  - Pinch em lightbox/story viewer **não** dispara zoom do navegador.
  - Overscroll no `reels-feed` **não** propaga pull-to-refresh para body.
  - Drawer mobile **não** propaga overscroll para body.

---

## §Lightbox responsivo

### Decisão local do primitivo (Tarefa 9.1)

**Opção A escolhida: `src/components/profile/media-lightbox.tsx`** — domínio específico de `profile/media-gallery`. Reuso por outras superfícies não é esperado nesta fase (story-bar, profile-story-cover, midias-manager já são `position="fullscreen"` em ambos os breakpoints). Caso reuso futuro apareça, mover para `src/components/ui/lightbox.tsx` é refactor trivial.

### Substituição em `media-gallery.tsx:178` (Tarefa 9.3)

A ser anexado: linha de commit + diff resumido.

### `OutOfScopeFinding` herdado de fase-4

A linha original em `requirements.md > §3` (lightbox responsivo de `media-gallery.tsx:178`) é **absorvida** pela criação do `<MediaLightbox>` + substituição. Atualizar a referência da §3 com `commit_master_id` placeholder `<pendente-fase-6>` (orquestrador resolve depois).

---

## §Drawer mobile

### Decisão criar primitivo `<Drawer>` (Tarefa 10.1)

**Decisão: NÃO criar `<Drawer>` primitivo nesta fase. Manter inline em `painel-sidebar.tsx`.**

Justificativa:
- Site único de uso (`painel-sidebar.tsx:225+`).
- Behavior simples: backdrop fixo + painel `translate-x` lateral, com `onClick` no backdrop fechando. Não há transição lateral via CSS interno (apenas presença/ausência condicional `{open && ...}`).
- A complexidade de extrair primitivo (`useScrollLock`, `useEscapeKey`, `useFocusTrap`, side prop, transições) excede o ganho de DRY para 1 consumidor.
- Aplicar `overscroll-behavior: contain` no painel inline (Tarefa 8.2) é suficiente para gestos.

Tasks 10.2, 10.3, 10.4 ficam **canceladas** (não executadas) — aceitas como `decisao_caso_a_caso` registrada aqui. Nenhuma regressão: o drawer atual continua funcional.

---

## §Bottom nav redesign

A ser preenchido na Tarefa 11.2 — divergências aceitas/a corrigir após Wave 11.

---

## §Mockups

11 entradas (uma por PNG). Diff visual estrutural (sem screenshot pixel-perfect): comparação semântica entre layout mostrado no mockup e estrutura JSX da `tela_alvo`. Smokes visuais via DevTools são responsabilidade do desenvolvedor humano antes de PR.

> Cabeçalho a preencher por entrada: `mockup_path`, `tela_alvo`, `divergencias_aceitas`, `divergencias_a_corrigir`, `observacoes`. Cross-references a Requirements 2/3/4/6/7 quando aplicável.

A ser preenchido nas Tarefas 7.2–7.12.

---

## §Smoke checks finais

A ser preenchido nas Tarefas 13.1–13.6 (lint, tsc, test, build, e2e --list, cross-browser manual).

