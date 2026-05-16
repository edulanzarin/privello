# Design Document — `fase-4-design-system`

> Spec-filho promovido a partir do master `auditoria-geral`. Este documento detalha como **completar o design system** do Privello: tokens semânticos `warning`/`danger`/`blue` com variantes de opacidade, eliminação sistemática de `Hex_Literal` e `Font_Size_Arbitrary` em `src/components/**` e `src/app/**`, primitivos faltantes (`Dropdown` e focus trap), consolidação de implementações duplicadas, e lint anti-regressão. A execução das tarefas deste design vive em `tasks.md` (a seguir).

## Overview

Hoje o projeto tem:

- **216 hex literais** em `src/**/*.{tsx,ts,css}` — destes, **≈173 em código de produto** (componentes/páginas), excluindo `src/lib/email-templates.ts` (23, fora de escopo) e `src/app/globals.css > :root` (20, definições legítimas de token).
- **677 ocorrências** de `text-[Npx]` arbitrário em `src/**/*.{tsx,ts}`. Top files com 38, 34, 34, 30, 29 ocorrências.
- **Tokens semânticos parciais**: `coral`, `success`, `background`, `foreground`, `muted`, `line`, `sidebar` existem; **falta** `warning`, `danger` (variável-base) e expor `blue` em `@theme inline` (a variável `--privello-blue` existe em `:root` mas não está mapeada).
- **Primitivos UI**: existem `avatar`, `badge`, `button`, `card`, `input`, `modal`, `select`, `stat-card`, `switch`, `textarea`, `toast`, `toggle-chip`. **Faltam**: `dropdown` e focus trap reutilizável.
- **Duplicações catalogadas**: 5 switches inline; 6 modais/overlays inline; 6 sites de upload sem usar `useFileUpload` (hook canônico já existe e tem zero consumidores).

A Fase 4 entrega quatro grupos de mudança:

1. **Tokens completos** em `globals.css` + doc `tokens.md` no diretório do spec-filho.
2. **Eliminação sistemática** de `Hex_Literal` e `Font_Size_Arbitrary` em código de produto, em ondas ordenadas por densidade.
3. **Primitivos novos**: `Dropdown` (compound) e focus trap (decisão única hook vs. componente, registrada aqui).
4. **Lint anti-regressão**: regra ESLint custom OU checklist humano em PR template.

A fase **não toca** APIs do Next.js (sem `agents_rule_areas`), **não introduz** bibliotecas externas (Radix, shadcn etc.), **não faz** redesign visual nem auditoria WCAG ampla — esses são Non-Goals declarados em `requirements.md > §6`.

### Decisões de design importantes

- **Tailwind v4 sem variáveis explícitas para opacity variants.** O Tailwind v4 gera as opacidades a partir do token base via syntax `<token>/<percent>` (`bg-warning/12`, `text-danger/20`). Não vamos definir `--color-warning-12` separado. Isso reduz superfície de manutenção e mantém o diff em `globals.css` mínimo.
- **Valores dos tokens base**: vamos adotar **valores hex** consistentes com a paleta atual macOS (`#ff9500` para warning, `#ff3b30` para danger, `#0a84ff` para blue — já existe). Migrar para OKLCH é tentador (Tailwind v4 prefere OKLCH) mas exige re-pintar os matches por todo o código com cuidado de equivalência. Mantemos hex agora, com nota em `tokens.md` que a migração para OKLCH é candidata futura.
- **`Dropdown` como compound component.** Mesmo padrão que `Card` + `CardHeader` + `CardTitle` no projeto. API mais expressiva que prop-based, e alinhada com práticas modernas (Radix, Headless UI). Não usamos Radix — escrevemos do zero. **Justificativa**: Radix adicionaria ~50KB e uma dependência transitória; o compound do projeto cobre os casos previstos sem isso.
- **Focus trap como hook**, não componente. Decisão final: `useFocusTrap(ref, active)`. **Justificativa**: o hook integra mais limpo no Modal existente (que já consome `useScrollLock`/`useEscapeKey`) e permite ativação condicional sem JSX adicional. O hook não exige container especial — recebe um `ref` qualquer.
- **Lint anti-regressão como ESLint custom rule** (opção (a) de `requirements.md > Requirement 6.2`). **Justificativa**: stylelint não cobre TSX/JSX nativamente, e o checklist humano é falível. ESLint custom rule via `no-restricted-syntax` casa diretamente com as regex do inventário e roda em `npm run lint` que a Fase 7 vai integrar à CI.
- **Tokens de opacidade documentados, não definidos**. `tokens.md` lista as variantes de opacidade (4%, 6%, 10%, 12%, 20%) com exemplos de uso real (`bg-warning/12` em badge de status, `bg-blue/[0.04]` em background de seção destacada, etc.). A tabela é a documentação; o Tailwind v4 gera as classes.
- **Não tocamos Modal/Switch além de:**
  - Modal: integrar `useFocusTrap` quando `open === true` (sem mudar API pública).
  - Switch: nada — apenas substituir consumidores inline pelo primitivo.
- **Migração de upload pode requerer expansão da API do hook** porque `src/components/painel/reels-manager.tsx` usa XHR para progresso real, e o hook atual usa `fetch` que não expõe progresso. Decisão registrada em `Components and Interfaces > 5.4`.
- **CSP integration**: a fase **não toca** `next.config.ts > headers()`. Se o Dropdown precisar de `Content-Security-Policy: script-src` específico (ex.: `'unsafe-inline'`), isso vira `OutOfScopeFinding` para fase-7-dx-infra ou para reabrir fase-1-seguranca via E6.

### O que está fora de escopo

- Refactor visual de Button/Input/Textarea/Select/Card/Badge/Avatar/Toast/ToggleChip além do que a consolidação 5.5 exigir.
- Bottom-sheet responsivo no Modal (Fase 6).
- Auditoria WCAG ampla (Fase 6 ou spec próprio).
- Snapshot/visual regression (Fase 6).
- Documentação ampla de cada componente (Fase 7 ou spec próprio).
- Refactor de `src/lib/email-templates.ts` (compatibilidade de email clients).
- Mudanças em APIs do Next.js — vira `OutOfScopeFinding`.

## Architecture

```
+-- src/app/globals.css                       [refactor]
|     :root                                    - adicionar --privello-warning, --privello-danger
|     @theme inline                            - mapear --color-warning, --color-danger, --color-blue
|
+-- src/components/ui/
|   +-- dropdown.tsx                           [novo]
|   |     export Dropdown, DropdownTrigger, DropdownContent, DropdownItem
|   |     consome useEscapeKey + useFocusTrap (opcional via prop)
|   +-- modal.tsx                              [refactor]
|         integrar useFocusTrap quando open===true
|         API pública preservada
|
+-- src/lib/hooks/
|   +-- use-focus-trap.ts                      [novo]
|   |     export useFocusTrap(ref, active)
|   +-- index.ts                               [refactor]
|         re-exportar useFocusTrap
|
+-- src/lib/hooks/use-file-upload.ts          [refactor]
|     opcional: adicionar onProgress callback
|     opcional: aceitar estratégia "fetch" ou "xhr"
|
+-- eslint.config.mjs                          [refactor]
|     adicionar regra no-restricted-syntax para hex literais e text-[Npx]
|     overrides para src/lib/email-templates.ts e src/app/globals.css
|
+-- src/components/** e src/app/**             [refactor em ondas]
|   wave 1: top-N de Font_Size_Arbitrary       (38+34+34+30+29 = 165 ocorrências)
|   wave 2: top-N de Hex_Literal               (15+11+11+9+5+5 = 56 ocorrências)
|   wave 3: arquivos com switches inline       (5 arquivos)
|   wave 4: arquivos com modais inline         (6 arquivos)
|   wave 5: arquivos com upload                (6 arquivos)
|   wave 6: cauda de hex/font-size restantes
|
+-- src/components/ui/dropdown.test.ts         [novo]
+-- src/components/ui/dropdown.pbt.ts          [novo]
+-- src/lib/hooks/use-focus-trap.test.ts       [novo]
+-- src/lib/hooks/use-focus-trap.pbt.ts        [novo]
|
+-- .kiro/specs/fase-4-design-system/
      +-- tokens.md                            [novo]
      +-- inventario-baseline.md               [novo - opcional]
```

### Boundaries

- **Tokens vs componentes**: tokens vivem em `globals.css`. Componentes consomem via classes Tailwind (`bg-warning`, `text-blue`). Nenhum componente importa nada de `globals.css` diretamente.
- **Hooks vs componentes**: `useFocusTrap` é um hook puro (sem JSX). Modal e Dropdown consomem via call.
- **Lint vs runtime**: o lint anti-regressão roda em build/CI; não há checagem em runtime. Falsos positivos previstos (cor hex em comentário) são tratados via overrides por arquivo, não por exceção inline.
- **Migration log vs commit message**: o `tokens.md > Migration log` é o registro humano dos antes/depois. Commit messages são curtas; `tokens.md` é onde se conta a história.

### Estratégia de migração de hex literais e font-size

A migração roda em **ondas** (waves) ordenadas por densidade decrescente do inventário. Cada onda toca um conjunto de arquivos disjuntos para minimizar conflito de edição e permitir review incremental.

**Wave 1 — Font_Size_Arbitrary top-N (≥29 ocorrências por arquivo)**

| Arquivo | text-[…] count |
|---|---|
| `src/app/p/[slug]/page.tsx` | 38 |
| `src/app/painel/page.tsx` | 34 |
| `src/app/descobrir/[citySlug]/page.tsx` | 34 |
| `src/app/conta/verificacao/page.tsx` | 30 |
| `src/app/solicitar/[slug]/page.tsx` | 29 |

Mapeamento canônico (a aplicar em todos):

| `text-[Npx]` | classe alvo |
|---|---|
| `text-[11px]` | `text-xs` (mas escala atual não tem 11px exato; precisa adicionar `--text-2xs: 11px` em `@theme inline`) |
| `text-[12px]` | `text-sm` (corresponde a 12px na escala definida no spec arquivado §2.1) |
| `text-[13px]` | `text-base` |
| `text-[14px]` | `text-md` |
| `text-[15px]` | `text-lg` |
| `text-[16px]` | `text-xl` |
| `text-[18px]` | `text-2xl` |
| `text-[22px]` | `text-3xl` |
| `text-[28px]` | `text-4xl` |

**Importante**: a escala em `globals.css` atual NÃO tem `xs`/`sm`/`base`/`md`/`lg`/`xl`/`2xl`/`3xl`/`4xl` declarados; está implícita pelo Tailwind default. Precisamos ou (a) declarar a escala explícita em `@theme inline` para casar com o spec arquivado §2.1, ou (b) usar Tailwind defaults (que diferem do spec — `text-sm` é 14px no Tailwind default, não 12px).

**Decisão**: declarar a escala explícita em `@theme inline` durante a Wave 1, seguindo o spec arquivado §2.1. Isso evita ambiguidade e permite que `text-[14px]` → `text-md` seja idempotente. Ver §Components and Interfaces > 1.

**Wave 2 — Hex_Literal top-N (≥5 ocorrências por arquivo, excluindo email-templates e globals.css)**

| Arquivo | hex count | hex predominante |
|---|---|---|
| `src/app/cadastro/sucesso/page.tsx` | 15 | (a inspecionar na execução) |
| `src/app/p/[slug]/page.tsx` | 11 | (idem) |
| `src/app/painel/page.tsx` | 11 | (idem) |
| `src/components/admin/admin-charts.tsx` | 9 | cores de gráfico (possível exceção declarada) |
| `src/app/buscar/page.tsx` | 5 | (idem) |
| `src/components/profile/profile-card.tsx` | 5 | (idem) |

Mapeamento canônico:

| Hex literal | token Tailwind |
|---|---|
| `#0a84ff` | `bg-blue` / `text-blue` / `border-blue` |
| `#ff3b30` | `bg-danger` / `text-danger` / `border-danger` |
| `#ff9500` | `bg-warning` / `text-warning` / `border-warning` |
| `#30d158` | `bg-success` / `text-success` / `border-success` |
| `#ff375f` | `bg-coral` / `text-coral` / `border-coral` |
| `#1d1d1f` | `bg-foreground` / `text-foreground` |
| `#86868b` | `bg-muted` / `text-muted` |
| `#d2d2d7` | `bg-line` / `border-line` |
| `#f5f5f7` | `bg-background` |
| `#0a84ff/[0.04]`, `#0a84ff/10`, `#0a84ff/[0.08]` | `bg-blue/[0.04]`, `bg-blue/10`, `bg-blue/[0.08]` |
| `#ff9500/10`, `#ff9500/[0.05]` | `bg-warning/10`, `bg-warning/[0.05]` |
| `#b36200` (texto sobre warning) | precisa decisão: ou usar `text-warning-700` (não existe) ou manter como exceção textual em `tokens.md` |

**`#b36200`** é uma cor escura para texto sobre fundo warning (visível em `src/app/painel/plano/page.tsx:78`, `src/app/painel/suporte/**`). Não existe na paleta. Decisão: registrar como exceção declarada em `tokens.md > Exceções declaradas` com justificativa "tom escuro de warning para legibilidade WCAG sobre fundo warning/10; a tonalidade escura não está na paleta atual e adicionar como token novo é mudança de paleta (out-of-scope)". Alternativa: usar `text-warning` direto (deve dar contraste suficiente sobre `bg-warning/10` em ambiente claro — a verificar caso a caso).

**Wave 3 — Switches inline (5 arquivos)** — substituição direta pelo primitivo `Switch`. Detalhe em §Components and Interfaces > 5.

**Wave 4 — Modais/overlays inline (6 arquivos)** — substituição por `Modal` ou abstração derivada. Detalhe em §Components and Interfaces > 5.

**Wave 5 — Upload sites (6 arquivos)** — migração para `useFileUpload`. Detalhe em §Components and Interfaces > 5.

**Wave 6 — Cauda** — varrer arquivos restantes com 1–4 hex literais ou 1–10 `text-[Npx]`. Aplicar mapeamento canônico em massa.

## Components and Interfaces

### 1. Tokens semânticos completos (`globals.css`)

```css
:root {
  /* existentes (preservar) */
  --privello-cream: #f5f5f7;
  --privello-ink: #1d1d1f;
  --privello-muted: #86868b;
  --privello-line: #d2d2d7;
  --privello-coral: #ff375f;
  --privello-green: #30d158;
  --privello-sidebar: #1d1d1f;
  --privello-blue: #0a84ff;

  /* novos */
  --privello-warning: #ff9500;
  --privello-danger: #ff3b30;
}

@theme inline {
  /* existentes (preservar) */
  --color-background: var(--privello-cream);
  --color-foreground: var(--privello-ink);
  --color-muted: var(--privello-muted);
  --color-line: var(--privello-line);
  --color-coral: var(--privello-coral);
  --color-success: var(--privello-green);
  --color-sidebar: var(--privello-sidebar);

  /* novos */
  --color-warning: var(--privello-warning);
  --color-danger: var(--privello-danger);
  --color-blue: var(--privello-blue);

  /* escala tipográfica explícita (alinhada ao spec arquivado §2.1) */
  --text-2xs: 10px;       /* novo - cobre text-[10px] residual em badges */
  --text-xs: 11px;
  --text-sm: 12px;
  --text-base: 13px;
  --text-md: 14px;
  --text-lg: 15px;
  --text-xl: 16px;
  --text-2xl: 18px;
  --text-3xl: 22px;
  --text-4xl: 28px;
}
```

A introdução da escala tipográfica explícita pode mexer com utilitárias Tailwind default (`text-sm` no default Tailwind = 14px, no nosso = 12px). Por isso a Wave 1 do mapeamento valida classe-a-classe: depois do refactor, `text-md` deve render `font-size: 14px`, conforme o spec arquivado §2.1.

### 2. Primitivo `Dropdown` (`src/components/ui/dropdown.tsx`)

API:

```ts
type DropdownProps = {
  children: React.ReactNode;
  /** Controlado: estado externo. */
  open?: boolean;
  /** Não-controlado: estado inicial. Ignorado se `open` é definido. */
  defaultOpen?: boolean;
  /** Disparado em mudanças de estado (controlado ou não). */
  onOpenChange?: (open: boolean) => void;
};

type DropdownTriggerProps = {
  children: React.ReactNode;
  /** Renderiza o filho como trigger (sem wrapper) — pattern Radix-like. */
  asChild?: boolean;
};

type DropdownContentProps = {
  children: React.ReactNode;
  className?: string;
  /** Alinhamento horizontal relativo ao trigger. */
  align?: "start" | "center" | "end";
  /** Ativar focus trap. Default: true se houver múltiplos DropdownItem. */
  trapFocus?: boolean;
};

type DropdownItemProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "danger" | "disabled";
};
```

Comportamento:

- Estado: controlado (`open` + `onOpenChange`) ou interno (`defaultOpen` + `onOpenChange`).
- `DropdownTrigger`: clona child quando `asChild`; senão envolve em `<button>`. Renderiza com `aria-haspopup="menu"` e `aria-expanded`.
- `DropdownContent`: portal opcional (decisão: NÃO usar portal no MVP — fica como nota de upgrade futuro). Renderiza com `role="menu"`, posicionamento relativo ao trigger via container `relative`. Aplica `useEscapeKey` para fechar; outside click via listener no document.
- `DropdownItem`: renderiza como `<button role="menuitem">`; navegação por arrow keys delegada ao `DropdownContent` (que mantém um `activeIndex` interno).
- Estilos: `bg-background border border-line shadow-lg rounded-xl py-1 min-w-[160px]` no content; `px-3 py-2 text-sm hover:bg-black/[0.04] focus:bg-black/[0.04]` nos items; `text-danger` para variant `danger`; `opacity-40 pointer-events-none` para variant `disabled`. **Zero hex literal**.

### 3. Focus trap (`src/lib/hooks/use-focus-trap.ts`)

API:

```ts
/**
 * Trapeia foco dentro do container `ref` enquanto `active === true`.
 * Devolve foco ao elemento anterior quando desativado.
 *
 * @param ref Container que deve conter os elementos focáveis.
 * @param active Quando true, o trap está ativo.
 * @param options.autoFocus Se "first" (default), foca o primeiro elemento focável ao ativar.
 *                          Se "data-autofocus", procura `[data-autofocus]` no container.
 *                          Se false, não move foco automaticamente.
 */
export function useFocusTrap(
  ref: React.RefObject<HTMLElement | null>,
  active: boolean,
  options?: { autoFocus?: "first" | "data-autofocus" | false },
): void;
```

Comportamento:

- Ativação: `addEventListener("keydown", handleTab)` no document; armazena `previousActive = document.activeElement`.
- Desativação: `removeEventListener` + `previousActive.focus()`.
- `handleTab`: se `key === "Tab"`, descobre lista de focáveis dentro de `ref.current`; se `Shift+Tab` no primeiro, foca último; se `Tab` no último, foca primeiro.
- Seletor de focáveis: `'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'` filtrado por `:not(:disabled)`.

Decisão (registrada): hook, não componente — para integrar limpo no Modal/Dropdown sem alterar a árvore JSX deles.

### 4. Integração no `Modal`

Mudança mínima em `src/components/ui/modal.tsx`:

```tsx
// adições
const contentRef = useRef<HTMLDivElement>(null);
useFocusTrap(contentRef, open);

// no JSX, anexar ref ao container interno
<div ref={contentRef} className={cn("relative z-10", className)}>
  {children}
</div>
```

API pública preservada (`open`, `onClose`, `children`, `className`, `persistent`, `position`). Sem breaking change.

### 5. Consolidação de duplicações

#### 5.1 Switches inline → `Switch` primitivo

5 sites a substituir, com pattern uniforme:

```tsx
// antes
<button onClick={() => setX(!x)} className={cn("flex h-[22px] w-[40px] ... rounded-full transition-colors duration-200", x ? "bg-[#30d158]" : "bg-black/[0.09]")}>
  <span className={cn("ml-[2px] ... rounded-full bg-white shadow-sm transition-transform duration-200", x && "translate-x-[18px]")} />
</button>

// depois
<Switch checked={x} onChange={setX} size="md" />
```

Casos especiais:

- `src/app/painel/midias/midias-manager.tsx:368-371` invertido (`!uploadPublic ? bg-success`) — semântica de "privado quando ligado". Manter callback equivalente (`onChange={(checked) => setUploadPublic(!checked)}`) ou renomear estado para `isPrivate` (refactor pequeno, fora desta fase salvo se a clareza exigir).
- `src/app/cadastro/acompanhante/provider-register-form.tsx:455-459` usa `bg-success`/`bg-line` (já em token). Substituir mesmo assim para consolidar API; visual idêntico.
- `src/app/conta/onboarding/valores/valores-form.tsx:119-123` usa `bg-coral` quando ligado — semântica diferente. **Manter** ou trocar para `bg-success`? Decisão: o primitivo `Switch` atual usa cor verde (`bg-[#30d158]`). Se algum site exigir cor diferente (coral), a substituição mantém o `Switch` mas requer parametrizar a cor — isso seria refactor de API do Switch (out-of-scope). Solução: declarar caso como `OutOfScopeFinding` se o stakeholder quiser preservar coral, ou aceitar visual unificado verde se não houver objeção.

#### 5.2 Modais/overlays inline → `Modal` primitivo ou abstração derivada

| Arquivo | Caso | Decisão proposta |
|---|---|---|
| `src/components/admin/warning-form.tsx:93` | Modal admin simples | Substituir por `Modal` direto. |
| `src/app/conta/perfil/client-profile-edit.tsx:60` | Modal de edição | Substituir por `Modal` direto. |
| `src/components/stories/story-bar.tsx:238` | Story viewer com gestos/autoplay | Abstrair em `<StoryViewer>` que internamente usa `Modal position="fullscreen"`. Comportamentos próprios (swipe, autoplay) ficam no wrapper. |
| `src/components/profile/profile-story-cover.tsx:205` | Story viewer espelhado | Mesmo wrapper `<StoryViewer>`. |
| `src/components/profile/media-gallery.tsx:178` | Galeria com behavior responsivo (mobile fullscreen, desktop centered) | Abstrair em `<MediaLightbox>` ou registrar como `OutOfScopeFinding` se a complexidade exceder esta fase. **Decisão preliminar**: registrar como `OutOfScopeFinding` para fase-6-mobile-cross-browser, pois o behavior responsivo é o tema central da Fase 6. |
| `src/app/painel/midias/midias-manager.tsx:397` | Lightbox full-screen | Mesmo `<MediaLightbox>` ou `Modal position="fullscreen"`. Decisão preliminar: `Modal position="fullscreen"`. |
| `src/components/painel/painel-sidebar.tsx:225` | Drawer de navegação mobile | Decisão: **manter como caso à parte** (não é modal — é drawer com transição lateral). Refactor para primitivo `<Drawer>` é tarefa potencial mas fica fora da Fase 4. Registrar nota em `design.md > Out of scope desta fase`. |

#### 5.3 Uploads → `useFileUpload`

| Arquivo | Pattern atual | Migração |
|---|---|---|
| `src/components/painel/media-manager.tsx:126` | `fetch("/api/upload", ...)` simples | `useFileUpload({ endpoint: "/api/upload" })`. |
| `src/app/painel/perfil/perfil-editor.tsx:128` | idem | idem. |
| `src/app/painel/midias/midias-manager.tsx:128` | idem | idem. |
| `src/app/painel/stories/stories-manager.tsx:63` | idem | idem. |
| `src/app/conta/onboarding/fotos/photo-uploader.tsx:33` | idem | idem. |
| `src/components/painel/reels-manager.tsx:52` | XHR com progresso real (`xhr.upload.onprogress`) | **Expandir API do hook** para suportar progresso real via XHR, OU manter como exceção registrada. Decisão preliminar: **expandir** o hook adicionando `strategy: "fetch" | "xhr"` (default `"fetch"`) e callback `onProgress(percent)`. |
| `src/app/conta/verificacao/page.tsx:138` | `fetch("/api/upload/verification", ...)` (endpoint distinto) | `useFileUpload({ endpoint: "/api/upload/verification" })` — o hook já é parametrizável. |

#### 5.4 Expansão da API do `useFileUpload` (proposta)

```ts
type UseFileUploadOptions = {
  endpoint: string;
  maxSize?: number;
  /** "fetch" (default) ou "xhr" para suportar progresso real. */
  strategy?: "fetch" | "xhr";
  /** Disparado durante upload XHR com porcentagem 0-100. */
  onProgress?: (percent: number) => void;
  onSuccess?: (data: UploadResult) => void;
  onError?: (error: string) => void;
};
```

Compatibilidade: `strategy` é opcional com default `"fetch"`. Consumidores existentes (zero hoje) não precisam mudar. `onProgress` é opcional.

### 6. Lint anti-regressão (`eslint.config.mjs`)

Decisão: **opção (a) — ESLint custom rule via `no-restricted-syntax`**.

Adicionar override no `eslint.config.mjs` cobrindo `src/components/**/*.{ts,tsx}` e `src/app/**/*.{ts,tsx}` (excluindo `src/lib/email-templates.ts` e `src/app/globals.css` que não casam de qualquer forma):

```js
{
  files: ["src/components/**/*.{ts,tsx}", "src/app/**/*.{ts,tsx}"],
  ignores: ["src/lib/email-templates.ts"],
  rules: {
    "no-restricted-syntax": [
      "error",
      {
        selector: "Literal[value=/#[0-9a-fA-F]{3,8}\\b/]",
        message: "Cores hex literais são proibidas. Use tokens semânticos do design system (bg-warning, text-blue, border-coral).",
      },
      {
        selector: "Literal[value=/text-\\[\\d+(\\.\\d+)?(px|rem|em)\\]/]",
        message: "Tamanhos de fonte arbitrários são proibidos. Use a escala tipográfica (text-xs, text-sm, text-base, text-md, text-lg, text-xl, text-2xl, text-3xl, text-4xl).",
      },
    ],
  },
},
```

`TemplateLiteral` e expressões dinâmicas não são cobertas por este selector — falsos negativos limitados. Tradeoff aceitável: o objetivo é detectar a regressão imediata, não toda variante criativa.

A regra falha em `npm run lint`. Quando a Fase 7 ligar a CI, o lint passa a ser gate; aqui só garantimos que `npm run lint` falha no exemplo de teste.

### 7. Consolidações estruturais opcionais

- Renomear o nome de prop `onClose` em Modal para `onOpenChange` (com `(open: boolean) => void`) para casar com `Dropdown`. **Decisão**: NÃO renomear — preservar API atual do Modal evita mexer em todos os call sites. Documentar a divergência em `tokens.md > API conventions`.

## Data Models

A fase não cria nem altera modelos de dados da aplicação (nada novo no Prisma). Os "modelos" aqui são tipos TypeScript dos primitivos novos:

- **Dropdown**: `DropdownProps`, `DropdownTriggerProps`, `DropdownContentProps`, `DropdownItemProps` (declarados em §Components and Interfaces > 2).
- **FocusTrap**: signature do hook `useFocusTrap(ref, active, options?)` (§3).
- **UseFileUploadOptions** (expandido): adições `strategy`, `onProgress` (§5.4).

Os artefatos textuais produzidos pelo spec-filho:

- `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-4-design-system\requirements.md` — já existe.
- `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-4-design-system\design.md` — este documento.
- `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-4-design-system\tasks.md` — produzido a seguir.
- `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-4-design-system\tokens.md` — produzido durante a execução (entrega obrigatória do Requirement 1.5).

## Error Handling

- **Token escolhido não bate exatamente com hex original** (ex.: `#0a84ff` é igual ao `--privello-blue` mas algum hex próximo como `#0066cc` não). Se a divergência for ≤ 1 nível de luminosidade (subjetivo), aceitar. Se maior, registrar em `tokens.md > Migration log` e validar visualmente. Se o stakeholder rejeitar, vira `OutOfScopeFinding` ("paleta atual não cobre tom específico").
- **Modal precisa de breaking change** (ex.: focus trap quebra algum consumer não previsto): escalar como `OutOfScopeFinding` ou criar prop opt-out (`disableFocusTrap?: boolean`). Decisão padrão: prop opt-out, default `false` (trap ativo); registrar em `tokens.md`.
- **Hex literal em código de outra fase** (ex.: `src/lib/security/dev-auth.ts` tem string contendo `#1234ab` por coincidência): registrar como exceção em `tokens.md > Exceções declaradas` ou ajustar regra ESLint para reconhecer contexto (`url(...)` em CSS, regex em JS) — solução padrão: override por arquivo no eslint config.
- **`text-[Npx]` necessário fora da escala** (ex.: `text-[10px]` em badge minúsculo): adicionar entrada `--text-2xs: 10px` em `globals.css` E aplicar `text-2xs`. Documentar em `tokens.md`.
- **XHR upload precisa de mais que progresso** (ex.: pause/resume): expandir hook ou registrar como `OutOfScopeFinding` para fase-7-dx-infra ou spec próprio.
- **Switch com cor diferente** (caso de `provider-register-form` ou `onboarding/valores/valores-form` que usa `bg-coral`): se stakeholder quiser preservar coral, declarar como `OutOfScopeFinding` (refactor de API do Switch para parametrizar cor é mudança fora desta fase). Se aceitar unificação visual no verde, substituir.
- **Lint regra ESLint produz muitos falsos positivos** (ex.: hex em comentário): override por arquivo OU restringir selector a contextos específicos. Decisão: override por arquivo é mais simples; a regra inicial pode ser conservadora e relaxar com base nos falsos positivos reais.

Em qualquer caso, a regra de ouro: **não absorver fora-de-escopo silenciosamente**. Tudo vira `OutOfScopeFinding` (`requirements.md > §3`) com commit no master spec antes de continuar.

## Testing Strategy

A Fase 4 consome a infraestrutura da Fase 2 (`fase-2-testes` em `state: Done`): Vitest + fast-check, scripts npm `test`/`test:watch`/`test:run`, convenções `*.test.ts` co-localizado e `*.pbt.ts` para property-based.

### Determinísticos (`*.test.ts`)

- **`src/components/ui/dropdown.test.ts`**:
  - Outside click fecha o Dropdown via `onOpenChange(false)`.
  - `Escape` fecha o Dropdown.
  - `ArrowDown`/`ArrowUp` move foco entre `DropdownItem`s.
  - `Enter` em item ativo dispara `onClick`.
  - `Tab` navega normalmente quando `trapFocus={false}`; cicla quando `trapFocus={true}`.
  - ARIA: `aria-haspopup="menu"` + `aria-expanded` no trigger; `role="menu"` no content; `role="menuitem"` em items.
  - Variantes: `default`/`danger`/`disabled` aplicam classes corretas; `disabled` não dispara `onClick`.

- **`src/lib/hooks/use-focus-trap.test.ts`** (renderiza componente helper que consome o hook):
  - Ao ativar, foco vai para o primeiro elemento focável do container.
  - `Tab` no último elemento focável volta para o primeiro.
  - `Shift+Tab` no primeiro elemento focável vai para o último.
  - Ao desativar, foco volta ao elemento que tinha foco antes.
  - `data-autofocus` é respeitado quando presente.

- **Smoke do Modal com focus trap integrado** (`src/components/ui/modal.test.ts`, novo se necessário): abrir Modal, dar Tab múltiplas vezes, verificar que foco não escapa do container do Modal.

### Property-based (`*.pbt.ts`)

Cobrem as Correctness Properties enunciadas adiante. Mínimo 100 iterações por property (`numRuns: 100`, default).

### Snapshot/visual regression

**Fora desta fase.** Pertencem à Fase 6 (cross-browser).

### Smoke checks finais (não-tests, mas critério de saída)

- `npm run lint` — zero novos erros nos arquivos do escopo (a regra anti-regressão pode disparar nos arquivos antigos não-migrados ainda; nesse caso, o lint falha _até_ todas as ondas terminarem; documentar como esperado durante a execução).
- `npx tsc --noEmit` — zero erros.
- `npm run test` — zero falhas.
- `npm run build` — sucesso, build compila com 71 rotas (estado atual herdado da Fase 1/2).

## Correctness Properties

As propriedades a seguir nascem como artefatos desta fase e validam invariantes universais dos primitivos novos. Cada uma é candidata a virar arquivo `*.pbt.ts` co-localizado com `fc.assert(fc.property(...))`.

### Property 1: Focus trap completude do ciclo

**Validates: Requirements 4.6, 4.7**

Para todo container `c` com pelo menos 2 elementos focáveis e todo índice de partida `i ∈ [0, n)`, aplicar `n` operações `Tab` retorna o foco ao mesmo elemento (`element[i]`). Aplicar `n` operações `Shift+Tab` da mesma posição também retorna a `element[i]`.

Geradores: `fc.integer({ min: 2, max: 10 })` para `n` (número de focáveis), `fc.integer({ min: 0, max: n - 1 })` para `i`. Container montado com `n` `<button>`s.

### Property 2: Focus trap libera foco anterior

**Validates: Requirements 4.5**

Para todo elemento externo `e` com foco antes da ativação do trap, desativar o trap leva `document.activeElement === e` (igualdade referencial).

Gerador: `fc.string({ minLength: 1, maxLength: 20 })` para `id` do botão externo; assertiva via `el === document.activeElement`.

### Property 3: Dropdown estado controlado vs interno

**Validates: Requirements 3.3**

Para todo par `(controlled, defaultOpen, sequenceOfClicks)`:
- Se `controlled === true` e `open === true`, o Dropdown mantém estado aberto regardless de `sequenceOfClicks` que tentem fechar internamente — o `onOpenChange` dispara mas o estado externo é a fonte de verdade.
- Se `controlled === false` (apenas `defaultOpen`), o Dropdown alterna estado conforme `sequenceOfClicks`.

Geradores: `fc.boolean()` para `controlled`, `fc.boolean()` para `defaultOpen`, `fc.array(fc.constantFrom("trigger", "outside", "escape"), { maxLength: 5 })` para sequência.

### Property 4: Dropdown roundtrip Tab/Shift+Tab quando trapFocus=true

**Validates: Requirements 3.6, 4.8**

Para todo Dropdown aberto com `trapFocus={true}` e `n ≥ 2` `DropdownItem`s, aplicar `n` Tabs partindo do primeiro item retorna o foco ao primeiro item. (Consequência da Property 1 aplicada ao Dropdown.)

### Property 5: Token migration idempotência

**Validates: Requirements 2.3**

Para toda string de classe Tailwind contendo `text-[Npx]` onde `N ∈ {10, 11, 12, 13, 14, 15, 16, 18, 22, 28}`, aplicar a função de mapeamento `mapFontSizeArbitraryToToken(s)` retorna a string com `text-[Npx]` substituído pelo token correspondente; aplicar a função uma segunda vez é no-op (idempotência).

Geradores: `fc.constantFrom(10, 11, 12, 13, 14, 15, 16, 18, 22, 28)` para `N`, `fc.string()` para classes ao redor.

> Esta property cobre a função de migração se ela for implementada como utilitário (ex.: codemod). Se a migração for manual, a property é descartada — registrar em `tokens.md`.

### Property 6: useFileUpload preserva contrato em estratégias diferentes

**Validates: Requirements 5.4**

Para todo par `(strategy, file)` onde `strategy ∈ {"fetch", "xhr"}` e `file` é mock válido (`new File([content], name)`), o hook `useFileUpload({ endpoint, strategy })` retorna a mesma forma de result `{ url?: string, ...data }` em sucesso, e a mesma mensagem de erro em falha. Os call sites devem ser intercambiáveis.

Esta propriedade é opcional — se a expansão XHR não acontecer (registrada como `OutOfScopeFinding`), descartar.

> Estas Properties não são todas exigidas para considerar a fase concluída. O mínimo é 2 propriedades cobertas (Requirement 8.3 do `requirements.md` deste spec-filho). As propriedades 1, 2 e 3 são as candidatas mais robustas. As propriedades 4, 5 e 6 são opcionais e dependem de decisões finais (trapFocus default, codemod vs manual, expansão do hook).

## Saída deste design

Este `design.md` é considerado pronto quando:

- Cobre as 8 EARS de `requirements.md` desta fase com decisões verificáveis.
- Lista os arquivos a criar (`src/components/ui/dropdown.tsx`, `src/lib/hooks/use-focus-trap.ts`, `tokens.md`) e os arquivos a refatorar (em ondas).
- Declara a decisão hook vs componente para focus trap (hook), o método de migração de literais (em ondas), e o mecanismo anti-regressão (ESLint custom rule via `no-restricted-syntax`).
- Aponta o que vira `OutOfScopeFinding` (Modal precisar de breaking change; refactor de cor do Switch para coral; complexidade do `<MediaLightbox>` responsivo; migração de paleta para OKLCH).
- Tem pelo menos 2 Correctness Properties enunciadas (entrega: 6 propostas).

A próxima etapa do workflow é o `tasks.md` deste mesmo spec-filho, que decompõe este design em sub-tarefas executáveis com dependências.
