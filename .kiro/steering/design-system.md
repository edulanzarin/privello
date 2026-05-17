# Design System — Privello (macOS Tahoe Sensual)

Steering doc auto-incluído em todo prompt. **Fonte de verdade da identidade visual.**
Qualquer trabalho de UI consulta este arquivo antes de escrever uma linha.

Versão: v2 (redesign Tahoe). Substitui inteiramente o design language anterior
("Sonoma cream + coral").

---

## 1. Conceito

**macOS Tahoe sensual.** Light mode com ambient gradient pastel quente (pêssego,
rosa-empoeirado, dourado claro) sobre cream off-white. Liquid Glass de verdade
nas superfícies — não cosmético. **Inter em tudo** (display + UI), com
contraste resolvido por peso/tracking, não por troca de família. Acento rose
`#e85a7a` (substitui coral), peach e plum como secundárias quentes, champagne
como selo.

**Propósito do produto:** plataforma de acompanhantes verificadas. Sensual sem
ser tabloide, sofisticado sem ser frio. Foto é protagonista; chrome desaparece.

---

## 2. Princípios (não-negociáveis)

1. **Foto > tudo.** Em qualquer tela com perfil, a foto domina. Texto se acomoda.
2. **Glass é estrutural.** Cards, sidebars, headers, modais — tudo flutua sobre
   o ambient gradient. Não é decoração, é a forma do produto.
3. **Rose é assinatura, não decoração.** Aparece em ação primária, badge online,
   hover de link, selo premium. Nunca em corpo de texto.
4. **Hairlines invisíveis.** Bordas em `rgba(26,21,23,0.08)` (1px). Sem caixas
   duras. Profundidade vem de elevation discreta (1–4px), não de blur agressivo.
5. **Inter em tudo.** Família única (Variable). Hierarquia vem de **peso**
   (300 → 700) e **tracking** (-0.025em em display, -0.011em em corpo, -0.005em
   em microcopy). Display em `text-7xl/8xl` com `font-weight: 300` e
   `letter-spacing: -0.04em` — Inter Light em tamanho grande lê elegante,
   sensual, sem precisar de serif. Nunca usar `font-style: italic` em display.

---

## 3. Tokens canônicos

Todos vivem em `src/app/globals.css` (`:root` + `@theme inline`).
Tailwind expõe utilitários (`bg-rose`, `text-ink`, `border-line`, `bg-peach-soft` etc.).

### 3.1 Cor — base

| Token CSS | Utility | Valor | Uso |
|-----------|---------|-------|-----|
| `--ink` | `text-ink` | `#1a1517` | Texto primário, ícones em superfície clara |
| `--ink-dim` | `text-ink-dim` | `#6b5d63` | Texto secundário (≥ 14px) |
| `--ink-faint` | `text-ink-faint` | `#a89ba2` | Captions, hint, terciário |
| `--line` | `border-line` | `rgba(26,21,23,0.08)` | Hairline canônica |
| `--surface-solid` | `bg-surface` | `#fdfcfb` | Áreas que precisam de opacidade total (modais full-screen) |

### 3.2 Cor — accent

| Token CSS | Utility | Valor | Uso |
|-----------|---------|-------|-----|
| `--rose` | `bg-rose`, `text-rose` | `#e85a7a` | Ação primária, marca, badge online, hover, "destaque" |
| `--peach` | `bg-peach`, `text-peach` | `#f4a275` | Boost ativo, secundárias quentes |
| `--plum` | `bg-plum`, `text-plum` | `#9c4474` | Estado active, gradiente CTA, premium ativo |
| `--cream` | `bg-cream`, `text-cream` | `#f1d9c0` | Selo de verificação (champagne sutil) |

### 3.3 Cor — semântica

| Token CSS | Utility | Valor | Uso |
|-----------|---------|-------|-----|
| `--success` | `text-success` | `#4d9b6e` | Online, verificado, aprovado |
| `--warning` | `text-warning` | `#d4905c` | Pending, em revisão |
| `--danger` | `text-danger` | `#c94545` | Erro, banido, suspenso |
| `--info` | `text-info` | `#5b8db8` | Novo, OPEN |
| `--whatsapp` | `bg-whatsapp` | `#25d366` | CTA exclusivo de WhatsApp (mantido) |

### 3.4 Cor — surfaces soft (banners discretos)

| Token CSS | Utility | Valor |
|-----------|---------|-------|
| `--rose-soft` | `bg-rose-soft` | `rgba(232,90,122,0.10)` |
| `--peach-soft` | `bg-peach-soft` | `rgba(244,162,117,0.12)` |
| `--plum-soft` | `bg-plum-soft` | `rgba(156,68,116,0.10)` |
| `--success-soft` | `bg-success-soft` | `rgba(77,155,110,0.10)` |
| `--warning-soft` | `bg-warning-soft` | `rgba(212,144,92,0.12)` |
| `--danger-soft` | `bg-danger-soft` | `rgba(201,69,69,0.10)` |
| `--info-soft` | `bg-info-soft` | `rgba(91,141,184,0.10)` |

### 3.5 Background ambient (global)

Aplicado no `<body>`. **Não anima.** Estático.

```css
body {
  background:
    radial-gradient(1200px 800px at 20% 0%,   oklch(96% 0.04  25  / 0.55), transparent 60%),
    radial-gradient(900px  700px at 90% 30%,  oklch(95% 0.03  340 / 0.45), transparent 65%),
    radial-gradient(1000px 600px at 50% 100%, oklch(96% 0.025 50  / 0.40), transparent 70%),
    oklch(98% 0.005 60);
  background-attachment: fixed;
}
```

Tradução: pêssego canto sup-esquerdo, rosa-empoeirado sup-direito, dourado
claro inferior, cream off-white base.

### 3.6 Glass — surface canônica (calibrado v2.3)

```css
.glass-panel {
  background: #ffffff;
  border: 0.5px solid rgba(26, 21, 23, 0.06);
  box-shadow: var(--shadow-sm);
}
```

Variantes:
- `.glass-pill` — mesma fórmula, `border-radius: 9999px` (chips, search bar pequena).
- `.glass-strip` — para overlays sobre foto (rodapé de ProfileCard). Background
  `rgba(20,15,17,0.82)` + blur 20px — translucência parcial porque está sobre
  foto e precisa do blur pra texto ficar legível.
- `.glass-elevated` — hover state, sombra md.
- `.glass` — header sticky. Mantém translucência (`rgba(253,252,251,0.96)`) +
  blur 16px porque o header passa sobre conteúdo que rola por baixo.

**Histórico de calibração** (cuidado pra não regredir):
- v2.0 (initial): `0.55` opacity + `40px` blur — quase invisível em fundos claros.
- v2.1: `0.82` opacity + `24px` blur — ainda transparente demais.
- v2.2: `0.96` opacity + `20px` blur — quase sólido mas user pediu mais.
- v2.3 (atual, 2026-05-17): cards/pills/cards são **`#ffffff` sólidos** sem blur.
  Glass aparece só onde faz sentido funcional: `.glass-strip` (overlay sobre foto)
  e `.glass` (header sticky cobrindo conteúdo). **Não voltar pra valores < 0.98.**

**Inputs/Selects/Textarea**: NÃO usam glass — fundo sólido `bg-white` com border
hairline. Glass é só para superfícies estruturais que cobrem outras (header, strip).

**Fallback:** N/A (cards sólidos não dependem mais de backdrop-filter).

**Mobile:** `.glass` reduz blur pra 12px (perf).

---

## 4. Tipografia

### 4.1 Família única — Inter Variable

| Família | Origem | Pesos | Uso |
|---------|--------|-------|-----|
| **Inter** | Google Fonts (`next/font`, variable) | 300, 400, 500, 600, 700 | Tudo. Display, UI, body, números, formulários. |

CSS:
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
             system-ui, sans-serif;
```

`--font-display` é alias de `--font-sans` (mantido por consistência semântica
com componentes legados que possam consumir o token, mas resolve para Inter).

### 4.2 Type scale

| Token | Valor | Tracking | Peso recomendado | Uso |
|-------|-------|----------|------------------|-----|
| `text-2xs` | 10 px | `0.08em` (uppercase) | 600 | Labels uppercase tracking-wider em KPI/Table |
| `text-xs` | 11 px | `-0.005em` | 400 | Microcopy auxiliar |
| `text-sm` | 12 px | `-0.005em` | 400 | Hint de input, copy secundário |
| `text-base` | 13 px | `-0.011em` | 400 | Texto de UI padrão |
| `text-md` | 14 px | `-0.011em` | 500 | Botões `lg`, inputs |
| `text-lg` | 15 px | `-0.011em` | 600 | Títulos de Card |
| `text-xl` | 16 px | `-0.015em` | 600 | Títulos de seção |
| `text-2xl` | 18 px | `-0.015em` | 600 | Valor de KPICard, headlines pequenos |
| `text-3xl` | 22 px | `-0.022em` | 600 | Título de página |
| `text-4xl` | 28 px | `-0.025em` | 600 | Título de seção em listings |
| `text-5xl` | 34 px | `-0.03em` | 500 | Display compacto |
| `text-6xl` | 44 px | `-0.035em` | 400 | Hero pequeno |
| `text-7xl` | 56 px | `-0.04em` | 300 | Hero |
| `text-8xl` | 72 px | `-0.045em` | 300 | Hero grande |

**Regra inversa de peso/tamanho:** quanto maior o tipo, mais leve o peso.
Display em 56–72px usa Inter 300 com tracking apertado — fica elegante e
respira. Corpo em 13–14px usa 400/500 — fica legível em densidade alta.

### 4.3 Aplicação

**Hero / display (`text-6xl`+):** `font-weight: 700` (font-bold), `letter-spacing: -0.025em`,
`line-height: 1.05`. Inter Bold em tamanho grande tem presença e contraste
forte — combina com a marca sensual + sofisticada.

**Calibração v2.1**: a especificação inicial pedia Inter Light (300) em
display pra parecer editorial. User pediu mais negrito em 2026-05-17 —
display mudou pra `font-bold` (700). Não voltar para light.

**Títulos de seção (`text-3xl`/`text-4xl`):** `font-weight: 700` (font-bold),
`letter-spacing: -0.02em`, `line-height: 1.1`. Aplicado em "Em destaque",
"Em alta", "Verificação séria" etc.

**Body (`text-base`/`text-md`):** `font-weight: 400`, `letter-spacing:
-0.011em`, `line-height: 1.55`.

**Números (preço, KPI, contadores):** sempre `font-feature-settings: "tnum"
1` (tabular-nums), `font-weight: 700` (font-bold) em destaque.

**Nunca:** italic em display ou em UI. Italic Inter fica genérico — só usar
em ênfase pontual de citação no body, e ainda assim com critério.

---

## 5. Spacing, radius, shadow, motion

### 5.1 Spacing & containers

Tailwind default (4px = 1 unidade). Padrões fixos:
- Card padding: `p-5` (md, default), `p-6` (lg), `p-4` (sm), `p-0` (none).
- Section vertical: `py-16` (desktop), `py-10` (mobile).
- **Container max-width por arquétipo:**
  - **Listing / home / feed** (descobrir, em-alta, em-destaque, novidades, home): `max-w-7xl` (1280px) com `px-4 sm:px-6 lg:px-8`.
  - **Reading / perfil público / legal** (perfil `/p/[slug]`, termos, política): `max-w-4xl` (896px) com `px-4 sm:px-6`. Densidade vertical, foco em conteúdo.
  - **Form** (cadastro, login, recuperar senha, onboarding step, painel form): `max-w-2xl` (672px) com `px-4`.
  - **Dashboard** (painel home, admin tabela, financeiro): `max-w-screen-xl` (1280px) com `px-4 sm:px-6`.
- Grid gap em listings: `gap-5` (desktop, masonry/grid), `gap-3` (admin densidade), `gap-4` (mobile).

### 5.2 Grid de listagem (ProfileCard e derivados)

| Breakpoint | Colunas | Notas |
|------------|---------|-------|
| `< 768px` (mobile) | **1** | Foto fullbleed, espaço para foto valorizar |
| `768–1024px` (tablet) | **2** | `md:grid-cols-2` |
| `≥ 1024px` (desktop) | **3** | `lg:grid-cols-3`. Cap em 3 mesmo em telas grandes pra foto não diminuir |

Aspect ratio fixo `3/4` em todos os breakpoints. Sem masonry (alturas iguais
pra grid limpo).

### 5.3 Radius (macOS Tahoe — moderado, não exagerado)

| Contexto | Raio |
|----------|------|
| ProfileCard, Hero block, Modal grande, Card padrão | `rounded-2xl` (16px) |
| Glass panel grande, KPICard, dropdown elevado, Search bar pill | `rounded-2xl` (16px) |
| Button md/lg, Input, Select, Textarea | `rounded-xl` (12px) |
| Button sm, ToggleChip simples | `rounded-lg` (8px) |
| Badge, FilterChip, Avatar, Bottom nav pill, Tabs item (pills), Glass pill | `rounded-full` |
| Hairline divider em tabela | sem radius |

**Calibração v2.1**: `rounded-3xl` (24px) ficou exagerado em cards de
listagem (feedback user 2026-05-17). Padrão agora é `rounded-2xl` (16px)
para cards em geral. `rounded-3xl` reservado para hero blocks e modais
grandes onde os cantos generosos contam visualmente.

### 5.4 Shadow

| Token | Valor | Uso |
|-------|-------|-----|
| `--shadow-hairline` | `0 0.5px 1px rgba(0,0,0,0.04)` | Sob card flutuante mínimo |
| `--shadow-sm` | `0 0.5px 1px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)` | Card padrão |
| `--shadow-md` | `0 1px 2px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.06)` | Card hover, modal |
| `--shadow-lg` | `0 2px 4px rgba(0,0,0,0.06), 0 24px 48px rgba(0,0,0,0.08)` | Modal, dropdown elevado |
| `--shadow-glass` | `inset 0 0.5px 0 rgba(255,255,255,0.9), 0 1px 2px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.06)` | Glass panel canônico |

Sombras devem ser **quase invisíveis** — profundidade vem do glass + radius
generoso, não de drop shadows pesadas. Se você está prestes a usar
`box-shadow: 0 8px 24px rgba(0,0,0,0.15)` ou similar — pare. Use um dos
tokens acima.

### 5.5 Motion

- Easing canônico: `cubic-bezier(0.32, 0.72, 0, 1)` (Tahoe-ish, levemente lento na entrada).
- Easing alternativo (microinterações rápidas): `cubic-bezier(0.16, 1, 0.3, 1)`.
- Durações:
  - 150 ms: hover de botão, active scale.
  - 200 ms: hover de card, transição de cor.
  - 320 ms: modal/drawer enter.
  - 480 ms: page transition (View Transitions API).
- `prefers-reduced-motion: reduce` neutraliza tudo (regra global em `globals.css`).

---

## 6. Componentes — princípios de API

### 6.1 Reaproveitamento ANTES de criação

Antes de criar componente novo, **leia esta tabela**:

| Tem `Card` em volta de uma área de conteúdo? | Use `<Card>` (variant adequada) |
| Tem botão/CTA? | Use `<Button>` (variant adequada) |
| Tem rótulo de status (online, verificada, premium)? | Use `<Badge>` mapeado por `statusToBadgeVariant` |
| Tem input de texto? | Use `<Input>` |
| Tem seleção dropdown? | Use `<Select>` |
| Tem alternância on/off? | Use `<Switch>` |
| Tem chip de filtro on/off? | Use `<ToggleChip>` ou `<FilterChip>` |
| Tem aba de navegação? | Use `<Tabs>` |
| Tem listagem tabular? | Use `<Table>/<THead>/<TR>/<TH>/<TD>` |
| Tem tile de KPI? | Use `<KPICard>` |
| Tem fallback de lista vazia? | Use `<EmptyState>` |
| Tem foto de perfil em listagem? | Use `<ProfileCard>` (pra criar) |
| Tem story circle? | Use `<StoryCircle>` |
| Tem chip de filtro horizontal sticky? | Use `<FilterChip>` (pra criar) |
| Tem search bar pública? | Use `<SearchBar>` + `<SearchField>` + `<SearchSubmit>` |
| Tem bottom-sheet mobile? | Use `<BottomSheet>` (pra criar) |

### 6.2 API contract universal

Todo componente segue:
- **Variants** explícitas em union type (`"primary" | "secondary" | ...`).
- **Sizes** explícitas (`"sm" | "md" | "lg"`).
- **className** repassado e mergeado com `cn()`.
- **Refs** repassados via `forwardRef` quando relevante.
- **ARIA** correto por padrão (focus ring, role, aria-current quando ativo).
- **Touch target ≥ 44×44** garantido em primitivos interativos (Button, Tabs, IconButton, links de nav).

### 6.3 Variantes essenciais por componente

**Button:** `primary` (rose), `secondary` (glass outline), `ghost` (sem fundo), `danger`, `whatsapp`. Sizes `sm`/`md`/`lg`.
**Card:** `glass` (default agora), `solid` (off-white opaco), `success-subtle`, `warning-subtle`, `danger-subtle`. Padding `none`/`sm`/`md`/`lg`.
**Badge:** `default`, `rose` (primário), `success`, `warning`, `muted`, `info`, `danger`, `premium` (plum), `boost` (peach), `verified` (cream).

### 6.4 Toggles vs checkboxes — convenção

**Sempre prefira `<Switch>` (toggle macOS, bolinha) em vez de
`<input type="checkbox">`** para opções binárias on/off em formulários e
drawers de filtro. Dois motivos:

1. Visual: Switch é a linguagem nativa de iOS/macOS — combina com Tahoe.
2. Semântico: switch comunica "ligar/desligar uma preferência" melhor que
   checkbox (que sugere "marcar/desmarcar item de uma lista").

**Use `<input type="checkbox">` apenas quando:**
- O contexto é claramente uma lista de itens marcáveis (ex.: seleção
  múltipla em tabela admin).
- O HTML nativo é exigido (ex.: form sem JS submit).

**Para construir filtros densos (drawer/modal):** use o pattern
`SwitchRow` que agrupa label + Switch numa linha clicável. Ver
`src/components/discover/filter-drawer.tsx > SwitchRow` como referência.

---

## 7. Fotografia & mídia

- Aspect ratios fixos: `3/4` (perfis em card), `1/1` (avatar, story), `16/9` (banners hero).
- Sempre `object-cover`.
- Sobre foto: gradiente `linear-gradient(180deg, transparent 50%, rgba(20,15,17,0.85))` pra texto legível.
- Hover desktop: zoom `scale(1.03)` em 200ms easing canônico. Não ultrapassar.
- Loading: skeleton em `bg-line` com `animate-pulse` discreto.
- Vídeo: `<video>` com `playsInline preload="metadata"` por padrão.

---

## 8. Anti-patterns (detectados pelo lint guard)

`scripts/check-no-raw-palette.mjs` em CI bane:

1. **Cores cruas Tailwind** fora de `src/components/ui/**` e `src/lib/chart-tokens.ts`:
   `bg-zinc-*`, `bg-amber-*`, `bg-sky-*`, `bg-emerald-*`, `bg-fuchsia-*`,
   `bg-indigo-*`, `bg-rose-*`, `bg-pink-*`, `bg-purple-*`, `bg-teal-*`,
   `bg-lime-*`, `bg-stone-*`, `bg-slate-*`, `bg-gray-*`, `bg-neutral-*`,
   `bg-red-*`, `bg-orange-*`, `bg-yellow-*` — e seus pares
   `text-*`, `border-*`, `ring-*`, `from-*`, `to-*`, `via-*`.
2. **`outline: none` sem ring substituto.** Sempre que zerar outline, aplique
   `focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background`.

Outras práticas vetadas (revisão obrigatória):

3. **Hex literais em código.** Use tokens (`bg-rose`, `text-coral` se ainda existir,
   `border-line`). Exceção única: `src/lib/chart-tokens.ts` e
   `src/app/globals.css`. Detectado por `eslint.config.mjs > no-restricted-syntax`.
4. **Glass agressivo** (blur > 60px, opacity < 0.4). Glass tem que respirar.
5. **Coral como cor de status.** Coral/rose são marca/afeto/ação. Status usa
   `success`/`warning`/`danger`/`info`/`premium`.
6. **STATUS_COLORS inline** em página. Use `statusToBadgeVariant`.
7. **Tabela bruta** `<table className="...">`. Use `<Table>`/`<THead>`/`<TR>`/`<TH>`/`<TD>`.
8. **Tile KPI ad-hoc** com `rounded border bg-white shadow-sm`. Use `KPICard`.
9. **Inter alternativo.** Família é única — Inter Variable. Hierarquia vem
   de peso/tracking, não de troca de família. Sem serif, sem mono em UI
   (mono permitido só em código snippets se houver).
10. **Animações sem `prefers-reduced-motion: reduce` respeitado.** Regra global existe; animações custom precisam usar tokens de duração.

---

## 9. Acessibilidade

- **Contraste WCAG AA:**
  - `text-ink × bg-cream` = 14.8:1 ✅
  - `text-ink-dim × bg-cream` = 5.2:1 ✅
  - `text-rose × bg-cream` = 4.6:1 ✅ (large text apenas; texto regular usa `text-ink`)
  - `text-ink-faint × bg-cream` = 3.1:1 — restrita a texto ≥ 18 px (large AA).
  - Validar pares novos via `src/lib/a11y/contrast.ts`.

- **Focus rings canônicos:**
  ```
  focus-visible:outline-none
  focus-visible:ring-2
  focus-visible:ring-rose/40
  focus-visible:ring-offset-2
  focus-visible:ring-offset-background
  ```

- **Touch target ≥ 44×44** (WCAG 2.5.5). Garantido em `Button`, `Tabs item`, `IconButton`, links de nav.

- **`prefers-reduced-motion: reduce`** neutraliza animações globalmente.

---

## 10. Como aplicar este sistema em uma página nova

Antes de escrever código:

1. Identifique o **arquétipo** da página (landing, listagem, perfil, formulário multi-step, dashboard, tabela admin, legal, sucesso/empty/error).
2. Reuse o **layout shell** correspondente (`PublicLayout`, `PainelLayout`, `AdminLayout`, `OnboardingLayout`).
3. Reuse os **componentes compostos** já existentes (`Hero`, `ProfileCard`, `SearchBar`, `FilterChip`, `Seal`, `PriceTag`, `KPICard`, etc.).
4. Caia em **primitivos** (`Button`, `Card`, `Badge`, `Input`, etc.) só pra preencher.
5. **Nunca escreva CSS de cor/font/spacing fora dos tokens.** Se algum
   visual demanda algo novo, primeiro ESTENDA os tokens (PR no design system),
   depois consuma.

Se você está prestes a criar um componente "exclusivo dessa página":
- **Pare.** Pergunte: vai aparecer em mais alguma página? (Quase sempre sim.)
- Se sim, é candidato a componente compartilhado → `src/components/{compose,ui}/`.
- Se realmente não, mantém local mas **consome só primitivos**.

---

## 11. Estado atual (rastreabilidade)

> **Mapa vivo de migração**: [`docs/component-map.md`](../../docs/component-map.md)
> contém status v2 por componente E por página (80+ rotas). Atualize-o
> a cada PR de migração.

- **Spec ativa**: `redesign-tahoe-sensual` (próxima a criar — substitui
  `redesign-macos-system` cuja v1 já foi commitada como base).
- **Última paleta commitada**: cream + coral + Inter exclusiva (commit `e6672e7`).
  Esta v2 substitui inteiramente.
- **Componentes UI já existentes (refeitos parcialmente)**: `Button`, `Card`,
  `Badge`, `Input`, `Select`, `Textarea`, `Switch`, `ToggleChip`, `Tabs`,
  `Table`, `KPICard`, `EmptyState`, `Modal`, `Dropdown`, `Toast`, `Avatar`,
  `LoadingSkeleton`, `ErrorState`. A v2 mantém APIs públicas e troca internals.
- **Componentes compostos a criar nesta v2**: `ProfileCard`, `StoryCircle`,
  `FilterChip`, `FilterDrawer`, `SearchBar`, `Hero`, `Seal`, `PriceTag`,
  `BottomSheet`.
- **Lint guard ativo**: `scripts/check-no-raw-palette.mjs` em strict mode no CI.
  Atualizar regex se paleta mudou (substituir `coral` em alvos válidos por `rose`).

---

## 12. Manutenção deste documento

- **Adicionar token novo:** declare em `:root` (`globals.css`), mapeie em
  `@theme inline`, atualize §3 deste arquivo.
- **Adicionar variante a primitivo:** atualize §6.3 + crie teste unit.
- **Adicionar primitivo novo:** documente em §6.1 (tabela de "quando usar") +
  crie em `src/components/ui/<nome>.tsx`.
- **Mudar paleta principal** (rose → outra cor): isso é decisão de marca,
  exige novo concept lock com o owner.

Qualquer mudança que não passe por este documento é tratada como dívida e
levantada para revisão.

---

## 13. Layout shells & padrões mobile-first

### 13.1 Bottom navigation (visível em todos breakpoints, glass-pill flutuante)

- Visível em **todos breakpoints** (decisão user 2026-05-17 — substitui também
  a nav inline que ficava no header desktop). Antes era `md:hidden` mobile-only.
- **Pill flutuante**, não cola no bottom: posicionada
  `fixed bottom-4 left-1/2 -translate-x-1/2`.
- `.glass-pill` com 4 ícones (Home / Acompanhantes / Reels / Entrar-Conta).
- Item ativo: ícone + label em `text-rose`, com pill background `bg-rose-soft`.
- Item inativo: ícone + label em `text-ink-dim`.
- Touch target ≥ 44×44 por item. Drop shadow `--shadow-md`.
- Safe-area aware: `padding-bottom: env(safe-area-inset-bottom)`.
- Body precisa de `pb-24` no RootLayout pra reservar espaço.
- **Auto-hide quando há modal aberto**: o wrapper externo recebe atributo
  `data-bottom-nav`. Toda vez que `useScrollLock` (consumido por `<Modal>`,
  `<StoryViewer>`, lightboxes) sobe a flag `body[data-modal-open]`, a CSS rule
  em `globals.css` aplica `opacity: 0; pointer-events: none` na nav. Garante
  que a pill nunca cubra story viewer ou lightbox de mídia.

### 13.2 Site header

- **Mobile (`< 768px`):** `h-14`, `glass`, sticky-top. **Apenas logo
  centralizado** — sem hambúrguer, sem nav, sem ações. Decisão user
  2026-05-17: o BottomNav já cobre todas as ações (Home / Acompanhantes /
  Reels / Entrar), e o item "Entrar" do bottom-nav leva para `/entrar` que
  tem login + cadastro. Drawer mobile foi removido por redundância.
- **Desktop (`≥ 768px`):** `h-16`, `glass`, sticky-top. **Apenas logo +
  ações** (Entrar / Criar conta) — nav inline também REMOVIDA (decisão user
  2026-05-17 — BottomNav cobre Acompanhantes/Reels em todos breakpoints).

### 13.3 Header sticky em Descobrir

Decisão D do briefing. Estrutura:

```
┌─────────────────────────────────────────────────────────┐
│ glass header sticky-top                                 │
│  ┌────────────────────────────┐  [Filtros ⏷] [Sort ⏷]  │
│  │ 🔍 São Paulo  ·  Garotas  │                          │  ← search bar pill
│  └────────────────────────────┘                          │
│  [Online] [Verificadas] [Local próprio] [Com áudio] →   │  ← chips horizontal
│  [São Paulo ×] [R$ 200-500/h ×]                         │  ← active filters
└─────────────────────────────────────────────────────────┘
```

- Search bar pill ocupa esquerda, dropdown filtros + sort à direita.
- Chips horizontais (scroll-x em mobile) mostram filtros rápidos toggleáveis.
- Drawer "Filtros" abre de baixo em mobile (BottomSheet) e da direita em
  desktop, com filtros avançados (preço, idade, atendimento).
- Active filter pills (chip removível com `×`) abaixo dos toggleáveis.
- Sem sidebar lateral (decisão D — substitui a sidebar atual).

### 13.4 ProfileCard (foto fullbleed + glass strip)

Decisão F1.

- Foto 3:4 ocupa 100% do card. **Sem chrome em volta da foto.**
- Card tem `rounded-3xl overflow-hidden`; foto `object-cover absolute inset-0`.
- Badges flutuam `top-3 left-3` em `.glass-pill` (Verificada / Online / Boost).
- Glass strip rodapé: `.glass-strip` em `position: absolute; bottom-0;
  inset-x-0`. Texto branco. Linhas: nome+idade em `text-md font-semibold`,
  cidade em `text-sm opacity-80`, preço em `text-md font-semibold tabular-nums`
  à direita.
- Audio inline: ícone `▶` + duração + waveform thin. Toca direto sem expandir.
- Hover desktop: foto `scale(1.03)` em 200ms easing tahoe; `.glass-strip`
  ganha leve elevation (blur sobe pra 30px).
- Click navega pra `/p/[slug]` com View Transition.
- Mobile: card inteiro clicável; audio button `stopPropagation`.

### 13.5 Sidebar shells (admin, painel)

- `DarkSidebarShell` será restilizado pra `GlassSidebarShell` — usa
  `.glass-panel` com a paleta v2 em vez do `bg-sidebar` escuro antigo.
- Largura desktop: `w-60` (240px).
- Mobile: drawer slide-in da esquerda com overlay
  `backdrop-blur-md bg-black/30`.
- Item ativo: `bg-rose-soft text-rose`. Inativo:
  `text-ink-dim hover:bg-line/40 hover:text-ink`.

### 13.6 Hero (Home)

- Largura `max-w-7xl` (decisão A4 — listing).
- Layout 2-col em desktop (`lg:grid-cols-[1.1fr_0.9fr]`), 1-col em mobile.
- Headline em Inter 300 com `text-5xl md:text-6xl lg:text-7xl`, tracking
  `-0.04em`, line-height 1.05. Cor `text-ink`. Acento em frase final
  ("perto de você.") em `text-rose`.
- Sublinha em Inter 400, `text-md md:text-lg`, `text-ink-dim`.
- Stats card lateral: `.glass-panel` com 4 stats `border-b border-line`,
  números em `tabular-nums font-semibold`.
- Search bar full-width abaixo do hero block: `.glass-pill` h-14 em mobile,
  h-16 em desktop. Cidade autocomplete + procuro select + botão "Descobrir"
  rose.
- Pílulas top-cidades: `.glass-pill` size sm,
  `bg-line/40 hover:bg-rose-soft`.

---

## 14. Patterns reusáveis para forms densos (drawers, modais)

Forms longos (filtros, configurações, edição de perfil) ficam mais
escaneáveis quando seguem 3 helpers padrão. Implementação canônica em
`src/components/discover/filter-drawer.tsx` — copie a estrutura para
outros forms.

### 14.1 `Section` — agrupador rotulado

Label uppercase pequeno (`text-2xs font-semibold uppercase tracking-wider
text-ink-dim`) + conteúdo abaixo com `gap-2`. Cria hierarquia visual sem
borda nem fundo.

```tsx
<Section label="Preço por hora">
  <div className="flex gap-2">
    <Input prefix="R$" placeholder="mín" ... />
    <Input prefix="R$" placeholder="máx" ... />
  </div>
</Section>
```

### 14.2 `SegmentedButton` — seleção single-choice

Para opções mutuamente exclusivas (Procuro: Garotas/Garotos/Casais; Sort:
Relevância/Menor preço/Maior preço/Avaliação; View: Grade/Lista). Botões
em grid `grid-cols-N gap-1.5`, ativo em `border-rose bg-rose-soft
text-rose`, inativo em `border-line bg-white text-ink-dim`. Touch target
`min-h-[40px]`.

```tsx
<div className="grid grid-cols-3 gap-1.5">
  {OPTIONS.map((opt) => (
    <SegmentedButton active={value === opt.value} onClick={...}>
      {opt.label}
    </SegmentedButton>
  ))}
</div>
```

### 14.3 `SwitchRow` — toggle on/off com label

Para opções binárias (Apenas verificadas, Local próprio, A domicílio,
Notificações por e-mail, etc.). Label à esquerda, `<Switch>` à direita,
linha clicável inteira. Dois modos:

- `inline=false` (default): linha standalone com `border-line` + `px-4` +
  `min-h-[44px]`. Usar quando é um toggle isolado sem grupo.
- `inline=true`: sem border, `min-h-[40px]`. Usar dentro de uma `Section`
  pra agrupar múltiplos toggles relacionados (ex.: "Atendimento: Local
  próprio + A domicílio").

```tsx
{/* Standalone */}
<SwitchRow label="Apenas verificadas" checked={x} onChange={setX} />

{/* Agrupado dentro de Section */}
<Section label="Atendimento">
  <SwitchRow label="Local próprio" checked={a} onChange={setA} inline />
  <SwitchRow label="A domicílio" checked={b} onChange={setB} inline />
</Section>
```

### 14.4 Quando promover esses helpers

Os 3 helpers vivem hoje **inline em `filter-drawer.tsx`** (escopo local).
Se aparecerem em ≥ 3 forms diferentes (ex.: configurações de perfil,
disponibilidade, filtros de admin), promover para
`src/components/ui/form-helpers.tsx` (novo primitivo). Até lá, copy-paste
com cross-ref no JSDoc do consumidor.

### 14.5 Filtros aplicados — badge contador

Quando o form é abertura de drawer (não inline), o botão de abertura
deve mostrar badge com contagem de filtros ativos:

```tsx
<button>
  <SlidersHorizontal />
  Filtros
  {activeCount > 0 && (
    <span className="bg-rose text-white text-2xs font-bold tabular-nums rounded-full px-1.5 h-5 min-w-[20px]">
      {activeCount}
    </span>
  )}
</button>
```


---

## 15. Stories — `StoryCircle` + `StoryViewer` (componentes compartilhados)

A v1 tinha **duas implementações** quase idênticas de viewer fullscreen
(uma em `story-bar.tsx`, outra em `profile-story-cover.tsx`), cada uma com
350+ linhas duplicando: progress bar, autoavanço 5s, view tracking,
like otimista com rollback, navegação por teclado, tap zones,
sessionStorage `prv_seen`. A v2 extrai isso em **um único `StoryViewer`**
+ um primitivo de círculo `StoryCircle`.

### 15.1 `<StoryCircle>` — primitivo do círculo

`src/components/ui/story-circle.tsx`. Bolinha redonda Tahoe Sensual usada
em qualquer lugar que mostre stories de um perfil.

**Visual:**
- Não-visto: ring com gradiente diagonal `linear-gradient(135deg, rose
  → peach → plum)` — substitui o `from-coral via-coral to-warning` da v1.
- Visto: ring sólido `bg-line` (hairline) + foto com `opacity-90`.
- Hover desktop: scale 1.04 com easing `var(--ease-tahoe)`, 200ms.
- Press: scale 0.98.

**Sizes:**

| Size | Diâmetro | Uso |
|------|----------|-----|
| `sm` | 48 px | Headers compactos, popovers, drawers (futuro) |
| `md` | **62 px** | StoryBar default — **NÃO ALTERAR** (selector e2e em `tests/e2e/lib/instrumentation.ts` depende de `h-[62px] w-[62px]` no DOM) |
| `lg` | 96 px | Listagens densas, cards de destaque |
| `xl` | 160 / 192 px responsivo | Capa do perfil público |

**API:**

```tsx
<StoryCircle
  imageUrl={group.coverUrl}
  displayName={group.displayName}
  seen={group.allSeen}
  size="md"          // sm | md | lg | xl
  withLabel          // mostra primeiro nome abaixo (default true)
  onClick={() => openViewer(idx)}
/>
```

Sem `onClick` → renderiza estático (avatar grande sem afford de click).

### 15.2 `<StoryViewer>` — modal fullscreen compartilhado

`src/components/stories/story-viewer.tsx`. **Toda lógica de viewer** vive
aqui (progress, autoavanço, view, like, teclado, tap zones, sessionStorage).

**API:**

```tsx
<StoryViewer
  groups={groups}             // 1+ grupos
  initialGroupIdx={openIdx}   // qual grupo abrir
  initialStoryIdx={0}         // story dentro do grupo (default 0)
  onClose={() => setOpen(false)}
  onChange={(updated) => setGroups(updated)}  // sync de likes/views pro consumer
  isClient={isLoggedIn}       // libera curtir + view tracking server-side
/>
```

**Modos automáticos:**
- **Multi-group** (StoryBar): ≥ 2 grupos → mostra chevrons L/R pra
  navegar entre perfis.
- **Single-group** (ProfileStoryCover): 1 grupo → esconde chevrons.

**Side effects (mantidos da v1, sem mudança comportamental):**
- `POST /api/stories/view` ao abrir cada story (se `isClient`).
- `POST /api/stories/like` toggle otimista com rollback em erro.
- `sessionStorage.prv_seen` persiste vistos entre páginas.
- `requestAnimationFrame` + `setTimeout(5000)` pra progress.
- `keydown` (Esc, ←, →) global enquanto aberto.
- `body.style.overflow = "hidden"` enquanto aberto.

### 15.3 Consumidores e composição

| Consumer | Circle size | Viewer mode | Notas |
|----------|-------------|-------------|-------|
| `StoryBar` (Descobrir) | `md` | multi-group | Wrapper de 80 linhas — só orquestra abertura |
| `ProfileStoryCover` (perfil público) | XL custom (mantém ring + pílula contadora condicional) | single-group | Não usa `StoryCircle` direto porque a foto é também a capa do perfil sem stories |

**Não duplique a lógica de viewer.** Se uma página nova precisar mostrar
stories (em-alta, novidades, dashboard), o caminho é:
1. Renderize `<StoryCircle>` (ou capa custom) na lista.
2. Ao clicar, abra `<StoryViewer>` com o grupo correto.

### 15.4 Touch-target (PBT)

O close do modal e o botão de like vivem em `story-viewer.tsx` e o teste
PBT em `src/components/_tests/touch-target.pbt.ts` referencia esse path.
**Não recriar handlers de close/like fora do viewer** — quebraria o
`min-h-[44px] min-w-[44px]` declarado e o teste.


---

## 16. SearchBar — primitivo compartilhado para barras de busca

A v1 tinha 2 search bars com visual diferente (`HeroSearchForm` na Home como
glass-pill e `BuscarForm` em /buscar como card sólido). A consolidação
levou as duas a aparecer lado a lado em `/descobrir` e a divergência ficou
gritante. v2.6 extrai o shell em `<SearchBar>` + 2 partes (`SearchField`,
`SearchSubmit`).

### 16.1 Anatomia

```tsx
<SearchBar onSubmit={...} maxWidth="3xl">
  <SearchField icon={MapPin}>
    <input ... />
  </SearchField>
  <SearchField icon={Users} label="Procuro" divider={false} className="md:max-w-[220px]">
    <select ... />
  </SearchField>
  <SearchSubmit>
    <Search className="h-4 w-4" />
    Descobrir
  </SearchSubmit>
</SearchBar>
```

- **`<SearchBar>`** — shell glass-panel rounded-2xl, padding 2 mobile / 1.5
  desktop, layout column → row em `md:`. Recebe `onSubmit` e `maxWidth?`
  (default `"3xl"` ~ 768px — inputs de busca raramente precisam mais).
  **Centralizado por padrão** (`mx-auto w-full`) para que o cap de largura
  resulte numa pílula no centro do container pai. Use `maxWidth="none"`
  pra herdar a largura do container pai.
- **`<SearchField>`** — slot tipado com `icon` (lucide), `label?` opcional
  (`text-xs ink-dim`), `divider?` (default true — esconde com `divider={false}`
  no último campo), `className?` (ex.: `md:max-w-[220px]` em campos auxiliares).
  O conteúdo (input/select/Autocomplete) é "naked" — sem chrome próprio,
  apenas `border-0 bg-transparent`.
- **`<SearchSubmit>`** — botão rose primary com `min-w-[150px]` em desktop pra
  peso visual estável independente do label.

### 16.2 Consumidores

| Componente | Fields | Submit | Usado em |
|------------|--------|--------|----------|
| `HeroSearchForm` | Cidade + Procuro | "Descobrir" | Home + Descobrir hub |
| `HandleSearchForm` | Nome ou @perfil | "Buscar" | Descobrir hub |

**Regra**: nunca crie outra search bar com chrome próprio. Use os 3
building-blocks. Se um caso não couber neles, estenda o primitivo
(propor variante nova) em vez de partir pra inline custom.

### 16.3 Convenções de copy

- **Não use "@handle"** — usuários não entendem. Use **"@perfil"** ou
  apenas **"nome do perfil"**.
- Placeholders curtos sempre (ex.: `Cidade...`, `Nome ou @perfil em qualquer cidade...`).
