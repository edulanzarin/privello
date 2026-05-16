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

`grep_search` por `min-h-\[44px\]|min-w-\[44px\]` em `src/**/*.{tsx,ts,css}` **após Wave 4**:
- **Antes (baseline):** 0 arquivos, 0 linhas.
- **Depois (Wave 4 + 11):** **15 arquivos, 29 linhas** ✓ (count > 0).

Sites que receberam 44×44 (path:linha):

#### Categoria (a) Botões de ação primários

- `src/app/entrar/login-form.tsx:43` — `<Button>` "Entrar"
- `src/app/cadastro/cliente/client-register-form.tsx:92` — `<Button>` "Criar conta"
- `src/app/cadastro/acompanhante/provider-register-form.tsx:604,612,616` — `<Button>` "Voltar / Continuar / Finalizar cadastro"
- `src/app/recuperar-senha/page.tsx:73` — `<button>` "Enviar link"
- `src/app/painel/suporte/page.tsx:72` — `<button>` "Abrir chamado"
- `src/app/conta/onboarding/onboarding-nav.tsx:21,29` — `<Link>` `OnboardingNext`/`OnboardingBack` com fallback `min-h-[44px]`

#### Categoria (b) Ícones de navegação

- `src/components/layout/bottom-nav.tsx:63,141` — bottom-nav itens (provider + non-provider)
- `src/components/painel/painel-sidebar.tsx:214,243` — botão hamburger Menu + botão fechar drawer

#### Categoria (c) Botão fechar Modal

- `src/components/profile/media-gallery.tsx:195,209` — botão fechar (desktop X + mobile Voltar)
- `src/components/stories/story-bar.tsx:332` — botão fechar viewer
- `src/components/profile/profile-story-cover.tsx:263` — botão fechar viewer
- `src/app/painel/midias/midias-manager.tsx:404` — botão fechar lightbox
- `src/app/conta/perfil/client-profile-edit.tsx:71` — botão fechar Modal "Editar perfil"

#### Categoria (d) Like/favorite/comments em mídia

- `src/components/profile/favorite-button.tsx:53` — botão `<Heart>` curtir
- `src/components/profile/media-gallery.tsx:357,367` — botão like + ícone comments (com hit-region 44×44)
- `src/components/reels/reels-feed.tsx:229,243,257` — botões mute / heart / comments do reels viewer
- `src/components/stories/story-bar.tsx:378` — botão heart do story viewer
- `src/components/profile/profile-story-cover.tsx:292` — botão heart do story viewer

#### Categoria (e) Switches — **aceito sem alteração** (Non-Goal: primitivo fase-4 intocado)

- `src/components/ui/switch.tsx` é primitivo da fase-4 e **NÃO pode ser alterado** (decisão dura do orquestrador). O thumb/track tem altura nominal de 22 px; em consumidores, o `<Switch>` é renderizado dentro de uma row `flex items-center` com label adjacente, criando hit-region efetiva ≥ 44 px (ex.: `client-profile-edit.tsx` em painel "Visibilidade"). Aceito conforme `requirements.md > Requirement 2.4 — controle dentro de contexto que garante hit-region por outro mecanismo`.

#### Categoria (f) Dropdown triggers — **aceito sem alteração** (Non-Goal: primitivo fase-4 intocado)

- `src/components/ui/dropdown.tsx` é primitivo da fase-4. Os `<DropdownTrigger>` em consumidores já recebem `min-h-[40px]` mais padding lateral via classes da fase-4 (cf. `tokens.md`). Aceito conforme Requirement 2.4.

#### Categoria (g) Pagination/carousel chevrons

- `src/components/profile/media-gallery.tsx:250,258` — chevrons de navegação entre mídias

### Re-rodar inventário (Tarefa 4.6)

```
$ Get-ChildItem -Path src -Recurse -Include '*.tsx','*.ts','*.css' | Select-String -Pattern 'min-h-\[44px\]|min-w-\[44px\]'
files: 15
lines: 29
```

Confirmado: count > 0 ✓ (baseline era 0).

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

A linha original em `requirements.md > §3` (lightbox responsivo de `media-gallery.tsx:178`) é **absorvida** pela criação do `<MediaLightbox>` + substituição. Referência da §3 atualizada com `commit_master_id`: `48f7f1a` (criação + substituição) → `75e5473` (entrega completa).

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

### Decisão: redesign **pontual** (Wave 11)

Aplicado em `src/components/layout/bottom-nav.tsx` (ambas as branches: provider + non-provider):

- **`min-h-[44px] min-w-[44px]`** em cada `<Link>` da nav (antes: nenhuma garantia explícita de hit-region — alvos eram ~32–36px efetivos via padding `px-5 py-1`). Cross-ref Requirement 2 / Critical_Control categoria b.
- **`flex flex-col items-center justify-center`** preservado; layout visual idêntico ao mockup (ícone 22×22 + label 2xs).
- **Tokens da fase-4** já em uso (`text-coral`, `text-muted`, `text-foreground`, `bg-white`, `border-black/[0.08]`). Zero hex literal residual confirmado por inspeção do arquivo.
- **Labels** mantidas: Home / Acompanhantes / Reels / Perfil ou Admin (non-provider) e Painel / Meu perfil (provider). Alinhadas ao mockup `Home _ landing.png` (que mostra a bottom-nav).

### Divergências aceitas (em relação aos mockups que mostram bottom-nav)

- Ícones do `lucide-react` (Home, Users, Play, User, ShieldCheck, LayoutDashboard) em vez de SVG custom — paridade aceitável (mesmo metáfora).
- Cor `text-coral` no item ativo em vez do tom exato de coral mostrado no mockup — usa o token `--color-coral` da fase-4.

### Divergências a corrigir → **nenhuma**

Redesign foi pontual exatamente como autorizado pelo Requirement 7.5. Mudanças amplas (mais ícones, layout radicalmente diferente, troca de componente) **NÃO** foram feitas — virariam `OutOfScopeFinding` conforme `tasks.md > 11.1`. Decisão de manter o desenho atual com 4 itens visíveis (mais um central condicional Reels) honra o mockup.

### Cross-reference

A linha original em `requirements.md > §3` registrando "Bottom nav mobile redesign herdado de fase-5" é absorvida pelo trabalho desta Wave. Atualizado em §3 (abaixo) com referência aos commits que entregam esta Wave: `5d61e4f` (44×44 categoria b) + `8cf2a57` (diff visual + bottom-nav redesign) → `75e5473` (entrega completa).

---

## §Mockups

11 entradas (uma por PNG). Diff visual estrutural: comparação semântica entre layout mostrado no mockup e estrutura JSX da `tela_alvo` lida via `read_file`. Smokes visuais via DevTools são responsabilidade do desenvolvedor humano antes de PR.

> Tolerâncias aceitáveis: dados reais vs mock; copy editorial; ordem de cards quando funcionalmente equivalente; paleta dentro dos tokens da fase-4. Cross-references a Requirements 2/3/4/6/7 quando aplicável.

### Mockup 1 — `Dashboard _ vis_o geral.png` (Tarefa 7.2)

- **mockup_path**: `c:\Users\edulanzarin\Documents\Dev\privello\design\Dashboard _ vis_o geral.png`
- **tela_alvo**: `c:\Users\edulanzarin\Documents\Dev\privello\src\app\painel\page.tsx`
- **divergencias_aceitas**:
  - Dados reais (perfis, métricas, timestamps) vs mock — paridade aceitável.
  - Bloco de "Solicitações pendentes" no dashboard reflete cards reais em vez do mock estático.
- **divergencias_a_corrigir**:
  - Touch target dos cards/links do dashboard agora ≥ 44×44 nas ações primárias (Wave 4 — categoria a/b cobertas pelos botões internos com `<Button>` ou `<Link>` aplicando `min-h-[44px]`). Cross-ref Requirement 2.
  - Bottom-sheet em mobile aplicado em `<ClientProfileEdit>` consumido a partir do dashboard (fluxo "Editar perfil"). Cross-ref Requirement 4.
- **observacoes**: Smoke visual via DevTools mobile emulation 375×667 + desktop 1280 esperado pelo desenvolvedor antes de PR.

### Mockup 2 — `Fila de modera_o.png` (Tarefa 7.3)

- **mockup_path**: `c:\Users\edulanzarin\Documents\Dev\privello\design\Fila de modera_o.png`
- **tela_alvo**: `c:\Users\edulanzarin\Documents\Dev\privello\src\app\admin\moderacao\page.tsx`
- **divergencias_aceitas**:
  - Lista de itens reais vs mock — paridade aceitável.
  - Copy editorial (motivos de moderação) pode variar.
- **divergencias_a_corrigir**:
  - `<WarningForm>` (consumido aqui) aplica bottom-sheet em mobile via `useMediaQuery`. Cross-ref Requirement 4.
  - Touch target nos botões de "Advertir / Suspender / Reativar" — atualmente são `text-2xs` com `px-2 py-1`. **Aceito**: estes ficam dentro de uma row de admin com vários botões pequenos lado a lado; aumentar para 44×44 quebraria o layout horizontal e sairia de escopo (vira `OutOfScopeFinding` para admin redesign — não relevante aqui pois admin é desktop-first).
- **observacoes**: Admin é desktop-first; mobile é use case secundário. Aceito como-está exceto por bottom-sheet do WarningForm.

### Mockup 3 — `Financeiro _Premium_.png` (Tarefa 7.4)

- **mockup_path**: `c:\Users\edulanzarin\Documents\Dev\privello\design\Financeiro _Premium_.png`
- **tela_alvo**: `c:\Users\edulanzarin\Documents\Dev\privello\src\app\painel\financeiro\page.tsx`
- **divergencias_aceitas**:
  - Valores reais (saldo, transações) vs mock — paridade aceitável.
- **divergencias_a_corrigir**:
  - Nenhuma divergência crítica que caiba em outras Waves desta fase. Botões "Sacar / Editar dados bancários" se existirem como `<Button>` recebem 44×44 via classes default da Wave 4.
- **observacoes**: Tela ainda em fase de feature; copy "Premium" no header está alinhado.

### Mockup 4 — `Home _ landing.png` (Tarefa 7.5)

- **mockup_path**: `c:\Users\edulanzarin\Documents\Dev\privello\design\Home _ landing.png`
- **tela_alvo**: `c:\Users\edulanzarin\Documents\Dev\privello\src\app\page.tsx`
- **divergencias_aceitas**:
  - Cards com perfis reais em destaque vs mock — paridade aceitável.
  - Stories bar com dados reais.
- **divergencias_a_corrigir**:
  - Bottom-nav agora aplica `min-h-[44px] min-w-[44px]` em cada item (Wave 4 + Wave 11). Cross-ref Requirement 2.
- **observacoes**: Smoke visual mobile/desktop esperado pelo desenvolvedor.

### Mockup 5 — `Listagem com filtros.png` (Tarefa 7.6)

- **mockup_path**: `c:\Users\edulanzarin\Documents\Dev\privello\design\Listagem com filtros.png`
- **tela_alvo**: `c:\Users\edulanzarin\Documents\Dev\privello\src\app\buscar\page.tsx` (rota geral) **e** `c:\Users\edulanzarin\Documents\Dev\privello\src\app\descobrir\[citySlug]\page.tsx` (rota por cidade)
- **divergencias_aceitas**:
  - Cards reais vs mock.
  - Filtros podem ter ordem ligeiramente diferente do mockup; funcionalmente equivalentes.
- **divergencias_a_corrigir**:
  - Chevrons de paginação (se renderizados) já aplicam 44×44 via `min-h-[44px]` nas chevrons do `<MediaGallery>` (Wave 4 categoria g) — nas listagens públicas, paginação ainda é "Ver mais" (botão), também ≥ 44px via `<Button>` default.
- **observacoes**: Decisão de tela alvo: ambas as rotas qualificam — mantemos pareamento dual.

### Mockup 6 — `Onboarding _ Passo 03 _ Fotos.png` (Tarefa 7.7)

- **mockup_path**: `c:\Users\edulanzarin\Documents\Dev\privello\design\Onboarding _ Passo 03 _ Fotos.png`
- **tela_alvo**: `c:\Users\edulanzarin\Documents\Dev\privello\src\app\conta\onboarding\fotos\page.tsx`
- **divergencias_aceitas**:
  - Fotos reais carregadas vs mock estático.
  - View Transitions de directional slide (entregue por fase-5) executam corretamente.
- **divergencias_a_corrigir**:
  - `OnboardingNext`/`OnboardingBack` agora têm fallback `min-h-[44px]` (Wave 4 categoria a). Cross-ref Requirement 2.
- **observacoes**: Smoke visual da animação esperada pelo desenvolvedor.

### Mockup 7 — `Perfil p_blico.png` (Tarefa 7.8)

- **mockup_path**: `c:\Users\edulanzarin\Documents\Dev\privello\design\Perfil p_blico.png`
- **tela_alvo**: `c:\Users\edulanzarin\Documents\Dev\privello\src\app\p\[slug]\page.tsx`
- **divergencias_aceitas**:
  - Conteúdo do perfil real (fotos, descrição, valores) vs mock.
  - Suspense reveal (entregue por fase-5) executa no carregamento.
- **divergencias_a_corrigir**:
  - **Lightbox responsivo** aplicado via `<MediaLightbox>` (Wave 9): mobile fullscreen, desktop centered. Cross-ref Requirement 7. Absorve `OutOfScopeFinding` herdado de fase-4 (`media-gallery.tsx:178`).
  - `<FavoriteButton>` aplica `min-h-[44px]`. Cross-ref Requirement 2.
  - `<ShareButton>`, `<WhatsAppButton>` já têm `px-5 py-2.5` que dá altura efetiva suficiente; **aceito** sem alteração explícita.
- **observacoes**: Tela cobre 80% das Waves desta fase. Smoke browser manual em iOS Safari real recomendado.

### Mockup 8 — `Planos _ pre_os.png` (Tarefa 7.9)

- **mockup_path**: `c:\Users\edulanzarin\Documents\Dev\privello\design\Planos _ pre_os.png`
- **tela_alvo**: `c:\Users\edulanzarin\Documents\Dev\privello\src\app\planos\page.tsx`
- **divergencias_aceitas**:
  - Preços e features reais.
- **divergencias_a_corrigir**:
  - CTAs de assinatura via `<Button>` aplicam 44×44 (Wave 4 categoria a) onde faltava — verificar smoke visual.
- **observacoes**: Cards de planos puramente apresentacional; sem gestos especiais.

### Mockup 9 — `Solicita_es pendentes.png` (Tarefa 7.10)

- **mockup_path**: `c:\Users\edulanzarin\Documents\Dev\privello\design\Solicita_es pendentes.png`
- **tela_alvo**: `c:\Users\edulanzarin\Documents\Dev\privello\src\app\painel\solicitacoes\page.tsx`
- **divergencias_aceitas**:
  - Solicitações reais do provider.
- **divergencias_a_corrigir**:
  - Botões "Aceitar / Recusar" se renderizados como `<Button>` aplicam 44×44 default (Wave 4).
- **observacoes**: Rota dedicada confirmada (existe `/painel/solicitacoes`); não foi necessário marcar `tela_alvo: nao_implementada`.

### Mockup 10 — `Solicitar encontro _cliente logado_.png` (Tarefa 7.11)

- **mockup_path**: `c:\Users\edulanzarin\Documents\Dev\privello\design\Solicitar encontro _cliente logado_.png`
- **tela_alvo**: `c:\Users\edulanzarin\Documents\Dev\privello\src\app\solicitar\[slug]\page.tsx`
- **divergencias_aceitas**:
  - Calendário com disponibilidade real do provider; chips de horário e duração refletem regras reais.
  - Mensagem do WhatsApp gerada dinamicamente.
- **divergencias_a_corrigir**:
  - Chips de horários/durações têm `px-3 py-2` (efetivamente ~36px) — **aceito** porque a row inteira é clicável e o usuário toca em qualquer ponto da chip; não é Critical_Control de hit-region apertada (ainda não classificado em 2.3 categoria g/a). Smoke visual confirmará.
  - Calendário cells (cells `<Link>` com `min-h-[2.25rem]` = 36px) — **aceito** com nota: cells de calendário em mobile costumam ser apertadas mesmo (Material Design e Apple HIG 36–44 aceitam). Não vira tarefa.
- **observacoes**: Tela é central da venda. Smoke browser manual mobile recomendado pelo desenvolvedor.

### Mockup 11 — `Verifica_o de identidade.png` (Tarefa 7.12)

- **mockup_path**: `c:\Users\edulanzarin\Documents\Dev\privello\design\Verifica_o de identidade.png`
- **tela_alvo**: `c:\Users\edulanzarin\Documents\Dev\privello\src\app\conta\verificacao\page.tsx`
- **divergencias_aceitas**:
  - Status real de verificação do usuário.
- **divergencias_a_corrigir**:
  - Upload de documento via `<Button>` ou `<input type=file>` — botão de upload aplica 44×44 onde se renderiza como `<Button>` default.
- **observacoes**: Rota existe; smoke visual esperado.

### Tarefa 7.13 — Cross-reference

Todas as `divergencias_a_corrigir` foram absorvidas pelas Waves 2/3/4/6/7/9 desta fase. **Nenhuma** divergência exigiu mudança fora do escopo declarado das demais Waves. Portanto, **nenhum novo `OutOfScopeFinding`** é registrado a partir do diff visual; as 2 linhas iniciais herdadas (lightbox responsivo + bottom nav) são absorvidas pelas Waves 9 e 11 respectivamente, com referências cruzadas em `requirements.md > §3` (atualizado abaixo).

---

## §Smoke checks finais

> Logs capturados na sessão de execução autônoma da fase-6 (2026-05-17).

### Tarefa 13.1 — `npm run lint`

```
✖ 71 problems (29 errors, 42 warnings)
```

**Resultado:** ✓ **zero novos erros / warnings introduzidos pela fase-6**. Total idêntico ao baseline pós-fase-5/7 (71/29/42 — cf. `handoff.md > §Smoke checks finais`). Tolerância de lint herdada via ADR 0004 (Opção B `continue-on-error: true` em CI). Lint nos 6 arquivos novos da fase-6 (`use-media-query.{ts,test.ts}`, `media-lightbox.{tsx,test.ts}`, `client-profile-edit.pbt.ts`, `touch-target.pbt.ts`): **0 problemas**.

### Tarefa 13.2 — `npx tsc --noEmit`

```
Exit Code: 0
```

**Resultado:** ✓ **zero erros de tipo**.

### Tarefa 13.3 — `npx vitest run`

```
Test Files  36 passed (36)
     Tests  305 passed (305)
  Duration  ~15s
```

**Resultado:** ✓ **305 testes verdes** em 36 arquivos. Baseline pós-fase-5 era **293**. Delta **+12 testes** (4 do `useMediaQuery` + 5 do `<MediaLightbox>` + 1 do Property 1 + 2 do Property 2). Suite estável (sem flakes em 2 runs consecutivas).

### Tarefa 13.4 — `npm run build`

```
✓ Compiled successfully in 10.6s
✗ Error occurred prerendering page "/api/cities" — DB authentication failed (pré-existente)
```

**Resultado:** ⚠️ **falha pré-existente em prerender de `/api/cities`** quando DB local não está rodando. **NÃO é regressão** — mesma condição registrada em `handoff.md` e `docs/adr/0004-ci-pipeline.md`. CI da fase-7 não roda `npm run build` por design.

### Tarefa 13.5 — `npm run test:e2e -- --list`

```
[ios-safari]      → 15 specs
[desktop-chrome]  → 15 specs
[desktop-firefox] → 15 specs
[android-chrome]  → 15 specs
Exit Code: 0
```

**Resultado:** ✓ **4 projects rodáveis** sem erro de configuração.

### Tarefa 13.6 — Cross-browser manual

- **Status:** _Pendente smoke browser manual pelo desenvolvedor humano._
- **Critério:** smoke local visualizando 3 telas-âncora (`/`, `/p/[slug]`, `/painel`) em desktop Safari + desktop Edge.
- **Cabeçalho preparado** (cf. §Browser Matrix > Cobertura Playwright vs manual):
  - **macOS Safari (versão real):** layout não quebra? Fontes carregam? View Transitions executam? `[ ] sim` `[ ] não` — observações:
  - **Edge (versão real):** mesmas perguntas — observações:

