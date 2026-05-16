# Tokens — `fase-4-design-system`

> Documento canônico de tokens semânticos, escala tipográfica, exceções declaradas, API conventions e migration log produzido pela execução do `tasks.md` desta fase.

---

## Migration baseline (Wave 0)

Inventário rodado em `c:\Users\edulanzarin\Documents\Dev\privello\` antes de qualquer onda. A contagem é sobre `git ls-files src/components src/app` filtrando `*.tsx`, `*.ts`, `*.css`. As regex usadas são `#[0-9a-fA-F]{3,8}\b` e `text-\[\d+(?:\.\d+)?(?:px|rem|em)\]`.

- **Hex literais (todos os arquivos do escopo, incluindo `globals.css`)**: 187 ocorrências em 56 arquivos. `globals.css` (20) é definição legítima de token; `src/app` + `src/components` em código de produto: ~167 ocorrências.
- **Hex literais "alvo"** (excluindo `globals.css` por conter definições válidas, e `src/lib/email-templates.ts` que é fora do escopo): ≈167 ocorrências em 55 arquivos.
- **Font-size arbitrários**: 677 ocorrências em 98 arquivos.

### Top arquivos com Hex literais (top-20, código de produto)

| count | path |
|---:|---|
| 15 | `src/app/cadastro/sucesso/page.tsx` |
| 15 | `src/app/p/[slug]/page.tsx` |
| 12 | `src/app/painel/page.tsx` |
| 9 | `src/components/admin/admin-charts.tsx` |
| 8 | `src/components/profile/profile-card.tsx` |
| 6 | `src/app/painel/suporte/page.tsx` |
| 5 | `src/app/buscar/page.tsx` |
| 5 | `src/app/painel/plano/page.tsx` |
| 4 | `src/app/admin/perfis/page.tsx` |
| 4 | `src/app/entrar/page.tsx` |
| 4 | `src/app/painel/plano/upgrade-button.tsx` |
| 4 | `src/app/painel/suporte/[id]/page.tsx` |
| 3 | `src/app/cadastro/acompanhante/page.tsx` |
| 3 | `src/app/cadastro/cliente/page.tsx` |
| 3 | `src/app/conta/onboarding/perfil/perfil-form.tsx` |
| 3 | `src/app/descobrir/[citySlug]/page.tsx` |
| 3 | `src/app/painel/perfil/perfil-editor.tsx` |
| 3 | `src/app/recuperar-senha/[token]/page.tsx` |
| 3 | `src/components/profile/media-gallery.tsx` |
| 3 | `src/components/ui/badge.tsx` |

### Top arquivos com Font-size arbitrários (top-20)

| count | path |
|---:|---|
| 40 | `src/app/p/[slug]/page.tsx` |
| 36 | `src/app/descobrir/[citySlug]/page.tsx` |
| 35 | `src/app/painel/page.tsx` |
| 30 | `src/app/conta/verificacao/page.tsx` |
| 30 | `src/app/solicitar/[slug]/page.tsx` |
| 20 | `src/app/painel/perfil/perfil-editor.tsx` |
| 19 | `src/app/painel/midias/midias-manager.tsx` |
| 19 | `src/components/reels/reels-feed.tsx` |
| 17 | `src/app/admin/midias/page.tsx` |
| 17 | `src/components/painel/reels-manager.tsx` |
| 15 | `src/app/buscar/page.tsx` |
| 15 | `src/app/cadastro/acompanhante/provider-register-form.tsx` |
| 15 | `src/app/page.tsx` |
| 13 | `src/app/painel/plano/page.tsx` |
| 13 | `src/components/profile/media-gallery.tsx` |
| 13 | `src/components/profile/profile-card.tsx` |
| 11 | `src/app/painel/financeiro/page.tsx` |
| 11 | `src/app/painel/suporte/page.tsx` |
| 10 | `src/app/painel/avaliacoes/page.tsx` |
| 10 | `src/app/planos/page.tsx` |

### Inventário de duplicações catalogadas

**5 implementações inline de Switch** (devem ser substituídas pelo primitivo `Switch`):

- `src/app/painel/valores/valores-form.tsx:96-99`
- `src/app/painel/midias/midias-manager.tsx:368-371` (estado invertido — `!uploadPublic`)
- `src/app/painel/disponibilidade/availability-form.tsx:81-85`
- `src/components/painel/reels-manager.tsx:248-252` (estado `isPrivate`)
- `src/app/cadastro/acompanhante/provider-register-form.tsx:455-459`
- `src/app/conta/onboarding/valores/valores-form.tsx:119-123` (cor coral — caso especial)

**6 modais inline** (devem ser substituídos pelo primitivo `Modal` ou abstração):

- `src/components/admin/warning-form.tsx:93` — modal admin simples
- `src/app/conta/perfil/client-profile-edit.tsx:60` — modal de edição
- `src/components/stories/story-bar.tsx:238` — story viewer
- `src/components/profile/profile-story-cover.tsx:205` — story viewer espelhado
- `src/components/profile/media-gallery.tsx:178` — galeria responsiva (registrar `OutOfScopeFinding` para fase-6)
- `src/app/painel/midias/midias-manager.tsx:397` — lightbox full-screen
- `src/components/painel/painel-sidebar.tsx:225` — drawer mobile (caso à parte, registrar como nota)

**6 sites de upload** (devem migrar para `useFileUpload`):

- `src/components/painel/media-manager.tsx:126`
- `src/components/painel/reels-manager.tsx:52` (XHR com progresso real — exige expansão da API)
- `src/app/painel/perfil/perfil-editor.tsx:128` + `:144` (este último em `/api/upload-audio`)
- `src/app/painel/midias/midias-manager.tsx:128`
- `src/app/painel/stories/stories-manager.tsx:63`
- `src/app/conta/onboarding/fotos/photo-uploader.tsx:33`
- `src/app/conta/verificacao/page.tsx:138` (`/api/upload/verification`)

### Hex literais únicos descobertos (paleta atual no código)

Lista de cores hex únicas detectadas no escopo (excluindo `email-templates.ts`):

- `#0a84ff`, `#007aff` — blue
- `#ff3b30` — danger
- `#ff9500`, `#ff9f0a` — warning
- `#30d158`, `#248a3d` — success
- `#ff375f`, `#e05c5c` — coral
- `#1d1d1f`, `#1a1a1a` — foreground/sidebar
- `#86868b`, `#8e8e93` — muted
- `#d2d2d7` — line
- `#f5f5f7`, `#f9f9f7`, `#f4f4f2`, `#e5e5e3` — backgrounds claros
- `#ffffff` — white
- `#5856d6`, `#7c6af7` — accent (chart/admin)
- `#25d366` — WhatsApp brand
- `#b25000`, `#b36200` — texto escuro sobre warning (não está na paleta)
- `#ff2200`, `#ff4500`, `#ff6600`, `#ff8c00`, `#ffd700` — animações de fogo/boost (em `globals.css` apenas)

---

## Tokens semânticos

> Preenchido após Wave 1 (atualização de `globals.css`).

### Lista canônica

| Token | Valor base (hex) | Variável CSS | Finalidade |
|---|---|---|---|
| `coral` | `#ff375f` | `--privello-coral` | Brand primária — destaques, CTAs primários, estado ativo. |
| `success` | `#30d158` | `--privello-green` | Confirmação positiva — switches ligados, badges de sucesso. |
| `warning` | `#ff9500` | `--privello-warning` (novo) | Advertência reversível — pendente, precisa atenção, prazo curto. |
| `danger` | `#ff3b30` | `--privello-danger` (novo) | Destrutivo / erro — botões `delete`, mensagens de erro. |
| `blue` | `#0a84ff` | `--privello-blue` (já existia em `:root`, novo em `@theme inline`) | Link / info — links, botões secundários, status info. |
| `foreground` | `#1d1d1f` | `--privello-ink` | Texto principal. |
| `background` | `#f5f5f7` | `--privello-cream` | Fundo da página. |
| `muted` | `#86868b` | `--privello-muted` | Texto secundário. |
| `line` | `#d2d2d7` | `--privello-line` | Bordas e separadores. |
| `sidebar` | `#1d1d1f` | `--privello-sidebar` | Fundo do sidebar (painel). |

### Variantes de opacidade

Tailwind v4 gera variantes via syntax `<token>/<percent>` ou `<token>/[<decimal>]`. **Não definimos variáveis explícitas para opacidades**.

| Variante | Uso típico | Caso de uso real (após migração) |
|---|---|---|
| `bg-<token>/[0.04]` | Fundo de seção destacada muito sutil | `src/app/painel/plano/upgrade-button.tsx` |
| `bg-<token>/[0.06]` | Hover state em superfícies neutras | _a preencher na cauda_ |
| `bg-<token>/10` | Status badge, callout informativo | `src/app/painel/suporte/page.tsx`, `src/app/painel/plano/page.tsx` |
| `bg-<token>/[0.12]` | Disabled de botão com cor | _a preencher na cauda_ |
| `bg-<token>/20` | Avatar background, focus ring | `globals.css > ::selection` |

### Escala tipográfica explícita

> A introdução desta escala redefine `text-sm`, `text-base` etc. em relação aos defaults do Tailwind. Mudança consciente e alinhada ao spec arquivado §2.1. A escala foi estendida em Wave 10 para cobrir tamanhos previamente arbitrários (`9px`, `17px`, `24px`, `34px`, `44px`, `56px`, `64px`).

| Classe | Valor | Uso típico |
|---|---|---|
| `text-2xs` | 10px | Badges minúsculos, captions, marcadores `9px` foram absorvidos aqui |
| `text-xs` | 11px | Texto auxiliar, timestamps |
| `text-sm` | 12px | Labels, meta-informação |
| `text-base` | 13px | Texto corrido em mobile |
| `text-md` | 14px | Texto corrido principal |
| `text-lg` | 15px | Subtítulos pequenos |
| `text-xl` | 16px | Subtítulos, logo (`17px` foi absorvido aqui) |
| `text-2xl` | 18px | Títulos de card |
| `text-3xl` | 22px | Títulos de seção, `24px` foi absorvido aqui |
| `text-4xl` | 28px | Títulos de página |
| `text-5xl` | 34px | Hero heading médio (novo em Wave 10) |
| `text-6xl` | 44px | Hero heading grande (novo em Wave 10) |
| `text-7xl` | 56px | Hero responsivo `sm:` (novo em Wave 10) |
| `text-8xl` | 64px | Hero responsivo `lg:` (novo em Wave 10) |

---

## Exceções declaradas

> Preenchido conforme as ondas avançam.

- **Cores de chart em `src/components/admin/admin-charts.tsx`**: cores de visualização de dados não pertencem à paleta semântica; permanecem como literais (`#1a1a1a`, `#e05c5c`, `#7c6af7`, `#e5e5e3`). Confirmado na Wave 10 — 9 ocorrências mantidas. Override no ESLint (`eslint.config.mjs`) isenta apenas este arquivo.
- **`#b36200`** (texto escuro sobre warning): mapeado para `--privello-warning-dark` em `globals.css` e exposto como `--color-warning-dark` em `@theme inline`. Usado como `text-warning-dark` em `src/app/painel/plano/page.tsx`, `src/app/painel/suporte/page.tsx` e `src/app/painel/suporte/[id]/page.tsx`.
- **`#248a3d`** (texto escuro sobre success): mapeado para `--privello-success-dark` e exposto como `--color-success-dark`. Usado como `text-success-dark` em `src/app/p/[slug]/page.tsx` e badge variants.
- **`#25d366`** (verde do WhatsApp — cor de marca externa): mapeado para `--privello-whatsapp` e exposto como `--color-whatsapp`. Usado como `bg-whatsapp` em `src/components/profile/whatsapp-button.tsx`. Cor de marca externa, não muda com o design system; mantida como token isolado.
- **Animação `fire-border` em `globals.css`**: cores específicas (`#ff4500`, `#ff8c00`, `#ffd700`, `#ff6600`, `#ff2200`) compõem um gradiente conic; substituir por tokens semânticos descaracterizaria o efeito. Permanecem em `globals.css` (fora do alcance da regra ESLint, que cobre `src/components/**` e `src/app/**`).
- **`globals.css > :root` e `@theme inline`**: definições legítimas de tokens; não são "literais" no sentido da regra anti-regressão.
- **`text-[9px]`** (label "Perfil" em mídia, badges minúsculas): foram migrados para `text-2xs` (10px) — diferença visual mínima, alinhamento com escala canônica.
- **`text-[17px]`** (logo `privello.` em `site-header.tsx`): foi migrado para `text-xl` (16px) — 1px de diferença, alinhamento com escala canônica.

---

## API conventions

> Divergências conscientes na API dos primitivos. Documentadas para que consumidores saibam o porquê.

### Modal vs Dropdown

| Primitivo | Estado externo | Callback |
|---|---|---|
| `Modal` | `open: boolean` | `onClose: () => void` |
| `Dropdown` | `open?: boolean` | `onOpenChange?: (open: boolean) => void` |

**Decisão**: preservar `Modal.onClose` em vez de renomear para `onOpenChange(false)`. Renomear quebraria todos os call sites existentes do Modal (alto custo, baixo ganho). O `Dropdown` adota o padrão moderno (`onOpenChange(boolean)`) por ser primitivo novo. Documentado em `design.md > Components and Interfaces > 7`.

### Switch

`Switch` segue o padrão `valor + callback`:

- `checked: boolean`
- `onChange: (checked: boolean) => void`

Mesmo padrão usado por `<input type="checkbox">` controlado em React.

---

## Out of scope desta fase

- **`src/components/painel/painel-sidebar.tsx:225`** — é um drawer mobile com transição lateral, não modal. Refactor para primitivo `<Drawer>` é tarefa potencial fora desta fase.
- **`src/components/profile/media-gallery.tsx:178`** — galeria com behavior responsivo (mobile fullscreen, desktop centered). Registrado como `OutOfScopeFinding` para `fase-6-mobile-cross-browser` em `requirements.md > §3` (responsividade é tema central da Fase 6).
- **Migração de paleta para OKLCH** — Tailwind v4 prefere OKLCH, mas a migração exige re-pintar matches em massa com cuidado de equivalência. Mantemos hex agora; OKLCH é candidato futuro fora desta fase.
- **Refactor de `src/lib/email-templates.ts`** — HTML para email não suporta CSS variables na maioria dos clientes (Outlook, Gmail). Fora desta fase.

---

## Migration log

> Antes/depois por arquivo, atualizado conforme as ondas avançam.

### Wave 0 — Inventário baseline registrado

- Hex literais em escopo: ~167 ocorrências (excluindo `globals.css` e `email-templates.ts`).
- Font-size arbitrários: 677 ocorrências.

### Wave 9 — Consolidação de upload

- `useFileUpload` expandido com `strategy: "fetch" | "xhr"` (default `"fetch"`) e `onProgress?: (percent: number) => void`. Implementação branched em XHR para reproduzir `xhr.upload.onprogress`.
- 7 sites migrados:
  - `src/components/painel/media-manager.tsx:126` (fetch)
  - `src/app/painel/perfil/perfil-editor.tsx:128` (fetch, `/api/upload`) e `:144` (fetch, `/api/upload-audio`)
  - `src/app/painel/midias/midias-manager.tsx:128` (fetch)
  - `src/app/painel/stories/stories-manager.tsx:63` (fetch)
  - `src/app/conta/onboarding/fotos/photo-uploader.tsx:33` (fetch)
  - `src/components/painel/reels-manager.tsx:52` (xhr + onProgress)
  - `src/app/conta/verificacao/page.tsx:138` (fetch, `/api/upload/verification`)

### Wave 10 — Cauda de hex literais e font-size

- Hex literais em escopo (antes desta wave): 48 ocorrências em 23 arquivos.
- Hex literais em escopo (após esta wave): **9 ocorrências em 1 arquivo** (`src/components/admin/admin-charts.tsx` — exceção declarada).
- Font-size arbitrários (antes desta wave): 174 ocorrências.
- Font-size arbitrários (após esta wave): **0 ocorrências**.

Arquivos migrados em massa via `scripts/migrate-tokens.ps1`:

| Arquivo | hex antes | hex depois | font antes | font depois |
|---|---:|---:|---:|---:|
| `src/components/ui/badge.tsx` | 2 | 0 | 1 | 0 |
| `src/components/ui/select.tsx` | 2 | 0 | 4 | 0 |
| `src/components/ui/input.tsx` | 2 | 0 | 5 | 0 |
| `src/components/ui/textarea.tsx` | 2 | 0 | 4 | 0 |
| `src/components/ui/button.tsx` | 2 | 0 | 3 | 0 |
| `src/components/ui/switch.tsx` | 1 | 0 | — | — |
| `src/app/painel/page.tsx` | 6 | 0 | — | — |
| `src/components/profile/media-gallery.tsx` | 3 | 0 | 13 | 0 |
| `src/components/painel/reels-manager.tsx` | 1 | 0 | 17 | 0 |
| `src/components/reels/reels-feed.tsx` | 1 | 0 | 19 | 0 |
| `src/components/painel/media-manager.tsx` | 2 | 0 | 9 | 0 (5 mapeados de `text-[9px]` → `text-2xs`) |
| `src/components/solicitar/solicitar-whatsapp-panel.tsx` | 2 | 0 | 8 | 0 |
| `src/app/planos/page.tsx` | — | — | 10 | 0 |
| `src/app/assinar/page.tsx` | 1 | 0 | 7 | 0 |
| `src/components/painel/painel-sidebar.tsx` | 2 | 0 | 7 | 0 (1 mapeado de `text-[9px]` → `text-2xs`) |
| `src/app/buscar/buscar-form.tsx` | — | — | 5 | 0 |
| `src/components/marketing/city-autocomplete.tsx` | — | — | 5 | 0 |
| `src/components/admin/warning-form.tsx` | — | — | 4 | 0 |
| `src/components/admin/media-actions.tsx` | — | — | 4 | 0 |
| `src/components/profile/profile-story-cover.tsx` | — | — | 4 | 0 (1 mapeado de `text-[9px]` → `text-2xs`) |
| `src/components/layout/site-header.tsx` | 1 | 0 | 4 | 0 (1 mapeado de `text-[17px]` → `text-xl`) |
| `src/app/painel/error.tsx` | — | — | 3 | 0 |
| `src/components/support/ticket-chat.tsx` | 1 | 0 | 3 | 0 |
| `src/components/stories/story-bar.tsx` | — | — | 3 | 0 |
| `src/components/profile/profile-list-row.tsx` | — | — | 3 | 0 (1 mapeado de `text-[9px]` → `text-2xs`) |
| `src/components/marketing/hero-search-form.tsx` | — | — | 3 | 0 |
| `src/app/recuperar-senha/page.tsx` | 2 | 0 | 3 | 0 |
| `src/components/profile/audio-player.tsx` | — | — | 2 | 0 |
| `src/components/ui/stat-card.tsx` | — | — | 2 | 0 |
| `src/components/discover/city-switcher.tsx` | — | — | 2 | 0 |
| `src/components/layout/bottom-nav.tsx` | 2 | 0 | 2 | 0 |
| `src/components/layout/site-footer.tsx` | — | — | 2 | 0 |
| `src/components/ui/card.tsx` | — | — | 2 | 0 |
| `src/components/ui/avatar.tsx` | — | — | 1 | 0 |
| `src/components/ui/toggle-chip.tsx` | — | — | 1 | 0 |
| `src/components/admin/admin-shell.tsx` | 1 | 0 | — | — |
| `src/components/admin/admin-city-filter.tsx` | 1 | 0 | — | — |
| `src/components/admin/quick-actions.tsx` | — | — | 1 | 0 |
| `src/components/profile/whatsapp-button.tsx` | 1 | 0 (mapeado para `bg-whatsapp` — token novo) | — | — |
| `src/components/profile/share-button.tsx` | 1 | 0 | — | — |
| `src/components/profile/audio-play-button.tsx` | — | — | 1 | 0 |
| `src/components/profile/favorite-button.tsx` | — | — | 1 | 0 |
| `src/components/profile/photo-carousel.tsx` | — | — | 1 | 0 (mapeado de `text-[9px]` → `text-2xs`) |
| `src/app/em-alta/page.tsx` | — | — | 1 | 0 |
| `src/app/em-destaque/page.tsx` | — | — | 1 | 0 |
| `src/app/assinar/subscribe-button.tsx` | — | — | 1 | 0 |

**Adições em `globals.css`** durante esta wave:

- `--privello-success-dark: #248a3d` + `--color-success-dark` (token escuro para texto sobre `bg-success/10`).
- `--privello-warning-dark: #b36200` + `--color-warning-dark` (token escuro para texto sobre `bg-warning/10`).
- `--privello-whatsapp: #25d366` + `--color-whatsapp` (cor de marca externa).
- `--privello-accent-purple: #5856d6` + `--color-accent-purple` (já mapeado em waves anteriores; usado por `admin-charts` quando aplicável).

---

## Lint anti-regressão

> Configurado em `eslint.config.mjs` durante Wave 11 (Tarefas 11.1–11.3).

### Regra

Override em `eslint.config.mjs` aplicado a `src/components/**/*.{ts,tsx}` e `src/app/**/*.{ts,tsx}`, ignorando `src/lib/email-templates.ts` e `src/components/admin/admin-charts.tsx`.

A regra `no-restricted-syntax` proíbe quatro padrões:

1. `Literal[value=/#[0-9a-fA-F]{3,8}\b/]` — hex literais em strings JSX/JS regulares.
2. `Literal[value=/text-\[\d+(\.\d+)?(px|rem|em)\]/]` — classe Tailwind de tamanho de fonte arbitrário em strings regulares.
3. `TemplateElement[value.cooked=/#[0-9a-fA-F]{3,8}\b/]` — hex literais em template strings.
4. `TemplateElement[value.cooked=/text-\[\d+(\.\d+)?(px|rem|em)\]/]` — font-size arbitrário em template strings.

Mensagens em pt-BR direcionam para `tokens.md` e listam tokens semânticos / classes da escala canônica como alternativa.

### Validação (Tarefa 11.3)

Smoke test executado durante Wave 11 com arquivo temporário `src/components/_lint-smoke.tsx` contendo:

- Hex literal em variável `const hex = "#0a84ff"` → **error** disparado pelo selector 1.
- `className="text-[14px]"` em string regular → **error** disparado pelo selector 2.
- Template string com `\`text-[12px] color-#ff3b30\`` → **error**s disparados pelos selectors 3 e 4.
- Hex inline em `className="text-[15px]"` → **error** disparado pelo selector 2.

Resultado: **5 erros** no arquivo de smoke; arquivo removido em seguida; `npm run lint` no repositório completo passa sem `no-restricted-syntax` errors.

---

## Contrato com a CI da Fase 7

A regra ESLint configurada nesta fase (`no-restricted-syntax` em `eslint.config.mjs`) é consumida pela CI da Fase 7. Esta fase **não toca** configuração de CI — entrega apenas a regra que `npm run lint` valida localmente.

---

## Smoke checks finais

> Preenchido após Wave 18 (Tarefas 14.x).
