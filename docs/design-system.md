# Design System — Privello

> Design language inspirado em macOS Sonoma. Light-mode primário, accent
> coral `#ff375f`, Inter exclusiva, glass discreto. Documento de referência
> obrigatório para qualquer trabalho de UI no Privello.

Este documento é a fonte canônica do design language. Páginas e features só
devem consumir os primitivos e tokens descritos aqui — qualquer divergência
(cor crua Tailwind, hex literal, fonte alternativa) é tratada como dívida e
detectada pelo lint guard descrito em [Anti-patterns](#anti-patterns).

Cross-refs:

- `src/app/globals.css` — declaração canônica dos tokens.
- `src/components/ui/*` — primitivos.
- `src/lib/ui/status.ts` — mapa status → variante de Badge.
- `src/lib/chart-tokens.ts` — paleta de chart.
- `.kiro/specs/redesign-macos-system/design.md` — narrativa e decisões.

---

## 1. Princípios

Cinco princípios travados orientam toda decisão de UI. Quando algo "parecer
fora", reverifique aqui antes de adicionar uma exceção.

1. **Calma sobre densidade.** Light mode cream (`#f5f5f7`) com tinta
   `#1d1d1f`. Sombras de 0.5–1px, bordas hairline (`0.5px`/`1px`), tipografia
   com `letter-spacing: -0.011em` (corpo) / `-0.022em` (display). Nunca
   empilhar bordas espessas.

2. **Coral é parcimonioso.** Coral `#ff375f` é accent de ação primária,
   marca (logo) e sinal de afeto/destaque (favoritos, boost). **Coral não é
   cor de status.** Status usa `success`, `warning`, `danger`, `blue`,
   `accent-purple`.

3. **Glass discreto, não cinematográfico.** `.glass` (sticky header) e
   `.glass-card` usam superfície branca quase opaca + 0.5px border + sombra
   dupla muito suave. Sem `backdrop-blur` agressivo, sem gradientes
   coloridos, sem reflexos visionOS.

4. **Movimento serve à hierarquia.** Easing único
   `cubic-bezier(0.16, 1, 0.3, 1)`, durações 150–300 ms. View Transitions
   API ativa em navegação. `prefers-reduced-motion: reduce` neutraliza
   tudo (regra global em `globals.css`).

5. **Inter é a única família.** `--font-sans` e `--font-serif` apontam para
   Inter. `font-feature-settings: "kern" 1, "liga" 1` ativos no `body`.
   Nunca trocar para serif "para variar".

---

## 2. Tokens canônicos

Todos os tokens vivem em `src/app/globals.css` (`:root` + `@theme inline`).
Tailwind expõe utilitários equivalentes (`bg-coral`, `text-success`,
`border-line`, `bg-warning-soft` etc.).

### 2.1 Cor — base

| Token CSS                    | Utilitário Tailwind  | Hex/valor   | Uso                                        |
| ---------------------------- | -------------------- | ----------- | ------------------------------------------ |
| `--privello-cream`           | `bg-background`      | `#f5f5f7`   | Fundo de página.                           |
| `--privello-ink`             | `text-foreground`    | `#1d1d1f`   | Texto primário, ícones em superfície clara.|
| `--privello-muted`           | `text-muted`         | `#86868b`   | Texto secundário (≥ 18 px — ver §7).       |
| `--privello-line`            | `border-line`        | `#d2d2d7`   | Borda hairline em tabelas e separadores.   |
| `--privello-coral`           | `bg-coral` / `text-coral` | `#ff375f` | Accent: ação primária, marca, afeto.    |
| `--privello-blue`            | `text-blue`          | `#0a84ff`   | Ação primária neutra, info, focus rings.   |
| `--privello-green`           | `text-success`       | `#30d158`   | Sucesso, status "aprovado".                |
| `--privello-warning`         | `text-warning`       | `#ff9500`   | Atenção, status "em revisão".              |
| `--privello-danger`          | `text-danger`        | `#ff3b30`   | Erro, status "banido"/"rejeitado".         |
| `--privello-accent-purple`   | `text-accent-purple` | `#5856d6`   | Premium, planos.                           |
| `--privello-sidebar`         | `bg-sidebar`         | `#1d1d1f`   | Fundo da sidebar dark (admin/painel).      |
| `--privello-success-dark`    | `text-success-dark`  | `#248a3d`   | Texto sobre `bg-success-soft` (contraste). |
| `--privello-warning-dark`    | `text-warning-dark`  | `#b36200`   | Texto sobre `bg-warning-soft` (contraste). |
| `--privello-whatsapp`        | `bg-whatsapp`        | `#25d366`   | CTA exclusivo de WhatsApp.                 |

### 2.2 Cor — superfícies soft (banners e badges de status)

| Token CSS                    | Utilitário Tailwind  | Valor                          | Uso                                       |
| ---------------------------- | -------------------- | ------------------------------ | ----------------------------------------- |
| `--privello-success-soft`    | `bg-success-soft`    | `rgba(48, 209, 88, 0.10)`      | Fundo de banner/badge sucesso.            |
| `--privello-warning-soft`    | `bg-warning-soft`    | `rgba(255, 149, 0, 0.10)`      | Fundo de banner/badge atenção.            |
| `--privello-danger-soft`     | `bg-danger-soft`     | `rgba(255, 59, 48, 0.10)`      | Fundo de banner/badge erro.               |
| `--privello-info-soft`       | `bg-info-soft`       | `rgba(10, 132, 255, 0.10)`     | Fundo de banner/badge info.               |
| `--privello-purple-soft`     | `bg-purple-soft`     | `rgba(88, 86, 214, 0.10)`      | Fundo de banner/badge premium.            |
| `--privello-chart-grid`      | `stroke-chart-grid`  | `rgba(0, 0, 0, 0.06)`          | Stroke de grid em recharts.               |

### 2.3 Type scale

Definida em `@theme inline`. Inter exclusiva.

| Token        | Valor   | Uso recomendado                              |
| ------------ | ------- | -------------------------------------------- |
| `text-2xs`   | 10 px   | Labels uppercase tracking-wider em KPI/Table.|
| `text-xs`    | 11 px   | Microcopy auxiliar.                          |
| `text-sm`    | 12 px   | Hint de input, copy secundário.              |
| `text-base`  | 13 px   | Texto de UI padrão.                          |
| `text-md`    | 14 px   | Botões `lg`, inputs.                         |
| `text-lg`    | 15 px   | Títulos de Card.                             |
| `text-xl`    | 16 px   | Títulos de seção.                            |
| `text-2xl`   | 18 px   | Valor de KPICard, headlines pequenos.        |
| `text-3xl`   | 22 px   | Headline de página.                          |
| `text-4xl`   | 28 px   | Display compacto.                            |
| `text-5xl`   | 34 px   | Display.                                     |
| `text-6xl`   | 44 px   | Hero pequeno.                                |
| `text-7xl`   | 56 px   | Hero.                                        |
| `text-8xl`   | 64 px   | Hero grande.                                 |

### 2.4 Espaçamento

Tailwind default (4 px = 1 unidade). Convenções fixadas:

| Contexto                          | Padding/Gap canônico        |
| --------------------------------- | --------------------------- |
| Card `padding="sm"`               | `p-4` (16 px)               |
| Card `padding="md"` (default)     | `p-5` (20 px)               |
| Card `padding="lg"`               | `p-6` (24 px)               |
| `<th>` (Table)                    | `px-3 py-2.5`               |
| `<td>` (Table)                    | `px-3 py-2`                 |
| Botão `sm`                        | `px-3 py-[5px]`             |
| Botão `md`                        | `px-4 py-[7px]`             |
| Botão `lg`                        | `px-6 py-[9px]`             |
| Input/Select/Textarea             | `px-3 py-[7px]`             |
| Tabs item                         | `px-3` ou `px-4` (sm/md)    |
| Min touch target (todos)          | `min-h-[44px] min-w-[44px]` |

### 2.5 Sombra

Tokens nomeados em `:root`. Use estes em vez de inline `0 0.5px 1px ...`.

| Token CSS           | Valor                                                                                  | Uso                                  |
| ------------------- | -------------------------------------------------------------------------------------- | ------------------------------------ |
| `--shadow-hairline` | `0 0.5px 1px rgba(0,0,0,0.04)`                                                         | Hairline isolada.                    |
| `--shadow-sm`       | `0 0.5px 1px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)`                            | Card solid, KPICard, Tooltip chart.  |
| `--shadow-md`       | `0 1px 2px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.06)`                              | Card em hover (elevação).            |

### 2.6 Raio (border-radius)

| Contexto                              | Raio                          |
| ------------------------------------- | ----------------------------- |
| Card, KPICard, Table wrapper          | `rounded-2xl` (16 px)         |
| Button `md`/`lg`, Input, Select       | `rounded-lg` (8 px)           |
| Button `sm`                           | `rounded-md` (6 px)           |
| Tabs item (pills)                     | `rounded-lg` (8 px)           |
| Badge, ToggleChip, Switch             | `rounded-full`                |
| Tooltip chart                         | `8 px` (em CSS-in-JS)         |

### 2.7 Easing e duração de movimento

| Token / valor                              | Uso                                              |
| ------------------------------------------ | ------------------------------------------------ |
| `cubic-bezier(0.16, 1, 0.3, 1)`            | Easing canônico para todas as transições/animações. |
| `150 ms`                                   | Microinteração rápida (botão `active`, hover).   |
| `200 ms`                                   | `Card`, `Switch`, transições de estado.          |
| `300 ms`                                   | `animate-fade-in`, entradas elaboradas.          |
| `--vt-duration-exit` (`150 ms`)            | Saída em View Transitions.                       |
| `--vt-duration-enter` (`210 ms`)           | Entrada em View Transitions.                     |
| `prefers-reduced-motion: reduce`           | Neutraliza animações para `0.01 ms` (regra global). |

---

## 3. Mapa status → Badge variant

Fonte de verdade: `src/lib/ui/status.ts` (função `statusToBadgeVariant`).
Páginas **nunca** devem reimplementar `STATUS_COLORS`/`PLAN_COLORS` inline.

| Status do domínio                          | `BadgeVariant` |
| ------------------------------------------ | -------------- |
| `NOVO`, `OPEN`                             | `info`         |
| `REVISAO`, `IN_PROGRESS`, `pending`        | `warning`      |
| `APROVADO`, `verificado`                   | `success`      |
| `REJEITADO`, `CLOSED`, `cancelled`         | `muted`        |
| `BANIDO`, `SUSPENSO`                       | `danger`       |
| `PREMIUM`                                  | `premium`      |
| `DESTAQUE` (Plus)                          | `coral`        |
| `ESSENCIAL` (Basic)                        | `info`         |
| _qualquer outra string_                    | `muted` (fallback determinístico) |

Uso:

```tsx
import { Badge } from "@/components/ui/badge";
import { statusToBadgeVariant } from "@/lib/ui/status";

<Badge variant={statusToBadgeVariant(row.status)}>{row.status}</Badge>;
```

---

## 4. Componentes

Cada primitivo lista props canônicas, variantes e um exemplo "do" + um
"don't" (Requirement 18.3). Tipos completos vivem nos arquivos `.tsx`.

### 4.1 `Button`

Arquivo: `src/components/ui/button.tsx`.

**Props:**

| Prop      | Tipo                                                  | Default     | Notas                                |
| --------- | ----------------------------------------------------- | ----------- | ------------------------------------ |
| `variant` | `"primary" \| "secondary" \| "ghost" \| "danger" \| "coral"` | `"primary"` | Acento da ação.                       |
| `size`    | `"sm" \| "md" \| "lg"`                                 | `"md"`      | Padding e font-size.                 |
| `loading` | `boolean`                                              | `false`     | Mostra spinner e desabilita o botão. |
| ...rest   | `ButtonHTMLAttributes`                                 | —           | Repassa para `<button>`.             |

Touch target ≥ 44×44 garantido por classes base (`min-h-[44px] min-w-[44px]`).
Focus ring `focus-visible:ring-2 focus-visible:ring-blue/40` em todas as variantes.

**Do:**

```tsx
import { Button } from "@/components/ui/button";

<Button variant="primary" size="md" onClick={handleSave}>
  Salvar alterações
</Button>;
```

**Don't:**

```tsx
{/* ❌ Botão reimplementado inline com cores cruas e sem touch target. */}
<button
  className="bg-zinc-900 px-3 py-1.5 text-xs font-bold text-white"
  onClick={handleSave}
>
  Salvar
</button>
```

### 4.2 `Badge`

Arquivo: `src/components/ui/badge.tsx`.

**Props:**

| Prop      | Tipo                                                                                                       | Default     |
| --------- | ---------------------------------------------------------------------------------------------------------- | ----------- |
| `variant` | `"default" \| "coral" \| "success" \| "warning" \| "muted" \| "dark" \| "info" \| "danger" \| "premium"`   | `"default"` |
| ...rest   | `HTMLAttributes<HTMLSpanElement>`                                                                          | —           |

Para status do domínio, **sempre** derive a variante via
`statusToBadgeVariant` (§3).

**Do:**

```tsx
import { Badge } from "@/components/ui/badge";
import { statusToBadgeVariant } from "@/lib/ui/status";

<Badge variant={statusToBadgeVariant("APROVADO")}>Aprovado</Badge>;
<Badge variant="premium">Premium</Badge>;
```

**Don't:**

```tsx
{/* ❌ Mapa de cor inline com paleta crua Tailwind. */}
const STATUS_COLORS = {
  APROVADO: "bg-emerald-100 text-emerald-700",
  REJEITADO: "bg-zinc-200 text-zinc-700",
};
<span className={`rounded-full px-2 py-[2px] text-xs ${STATUS_COLORS[status]}`}>
  {status}
</span>;
```

### 4.3 `Card`

Arquivo: `src/components/ui/card.tsx`. Exporta também `CardHeader`,
`CardTitle`, `CardDescription`.

**Props:**

| Prop      | Tipo                                                                                                                | Default     |
| --------- | ------------------------------------------------------------------------------------------------------------------- | ----------- |
| `variant` | `"default" \| "glass" \| "solid" \| "dark" \| "success-subtle" \| "warning-subtle" \| "danger-subtle"`              | `"default"` |
| `padding` | `"none" \| "sm" \| "md" \| "lg"`                                                                                    | `"md"`      |
| ...rest   | `HTMLAttributes<HTMLDivElement>`                                                                                    | —           |

Variantes `*-subtle` substituem `bg-emerald-50 border-emerald-200` e família.

**Do:**

```tsx
import { Card, CardTitle } from "@/components/ui/card";

<Card variant="success-subtle" padding="md">
  <CardTitle>Verificação aprovada</CardTitle>
  <p className="text-base text-foreground">Documentos validados.</p>
</Card>;
```

**Don't:**

```tsx
{/* ❌ Painel de aprovação com paleta emerald crua e borda dura. */}
<div className="rounded border border-emerald-200 bg-emerald-50 p-5">
  <h3 className="text-emerald-700">Verificação aprovada</h3>
</div>
```

### 4.4 `Tabs`

Arquivo: `src/components/ui/tabs.tsx`.

**Props:**

| Prop        | Tipo                                | Default   | Notas                                        |
| ----------- | ----------------------------------- | --------- | -------------------------------------------- |
| `items`     | `TabItem[]`                         | —         | `{ key, label, href?, badge? }`.             |
| `activeKey` | `string`                            | —         | Chave do tab ativo.                          |
| `variant`   | `"pills" \| "underline"`            | `"pills"` | Pílulas (default) ou linha coral 2 px.       |
| `size`      | `"sm" \| "md"`                       | `"md"`    | Padding interno.                             |
| `onChange`  | `(key: string) => void` (opcional)  | —         | Modo controlado. Tem precedência sobre `href`.|
| `className` | `string`                            | —         | —                                            |

Comportamento:

- Quando `item.href` setado e `onChange` ausente → renderiza `<Link>` com
  `aria-current="page"` no ativo.
- Roving tabindex; setas ←/→, Home/End movem foco.
- Touch target ≥ 44×44 por item.

**Do:**

```tsx
import { Tabs } from "@/components/ui/tabs";

<Tabs
  items={[
    { key: "queue", label: "Fila", href: "/admin/moderacao", badge: 12 },
    { key: "history", label: "Histórico", href: "/admin/moderacao/historico" },
  ]}
  activeKey="queue"
  variant="pills"
  size="sm"
/>;
```

**Don't:**

```tsx
{/* ❌ Tabs reimplementado com <Link> estilizado inline. */}
{TABS.map((t) => (
  <Link
    key={t.key}
    href={t.href}
    className={
      active === t.key
        ? "bg-zinc-900 text-white px-3 py-1.5 text-xs"
        : "text-zinc-500 px-3 py-1.5 text-xs"
    }
  >
    {t.label}
  </Link>
))}
```

### 4.5 `Table`

Arquivo: `src/components/ui/table.tsx`. Exporta `Table`, `THead`, `TR`, `TH`,
`TD`.

**Props relevantes:**

| Componente | Prop        | Tipo                              | Default | Notas                                       |
| ---------- | ----------- | --------------------------------- | ------- | ------------------------------------------- |
| `Table`    | `minWidth`  | `number`                          | `640`   | `min-width` em px antes de scroll.          |
| `Table`    | `className` | `string`                          | —       | —                                           |
| `TR`       | `hover`     | `boolean`                         | `true`  | Aplica `hover:bg-line/20 transition`.       |
| `TH`       | `align`     | `"left" \| "right" \| "center"`   | `"left"`| —                                           |
| `TD`       | `align`     | `"left" \| "right" \| "center"`   | `"left"`| —                                           |
| `TD`       | `numeric`   | `boolean`                         | `false` | Aplica `tabular-nums text-right`.           |

`TH` sempre renderiza `scope="col"`. Wrapper é `Card variant="solid" padding="none"` com `overflow-x-auto`.

**Do:**

```tsx
import { Table, THead, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { statusToBadgeVariant } from "@/lib/ui/status";

<Table minWidth={720}>
  <THead>
    <TR hover={false}>
      <TH>Perfil</TH>
      <TH>Status</TH>
      <TH align="right">MRR</TH>
    </TR>
  </THead>
  <tbody>
    {rows.map((r) => (
      <TR key={r.id}>
        <TD>{r.name}</TD>
        <TD><Badge variant={statusToBadgeVariant(r.status)}>{r.status}</Badge></TD>
        <TD numeric>R$ {r.mrr}</TD>
      </TR>
    ))}
  </tbody>
</Table>;
```

**Don't:**

```tsx
{/* ❌ Tabela bruta com bg-zinc cru e header sem semântica. */}
<table className="w-full text-left text-sm">
  <thead className="bg-zinc-50">
    <tr>
      <th className="px-3 py-2">Perfil</th>
      <th className="px-3 py-2 text-right">MRR</th>
    </tr>
  </thead>
  <tbody>{/* ... */}</tbody>
</table>
```

### 4.6 `KPICard`

Arquivo: `src/components/ui/kpi-card.tsx`.

**Props:**

| Prop        | Tipo                                                         | Default | Notas                                            |
| ----------- | ------------------------------------------------------------ | ------- | ------------------------------------------------ |
| `label`     | `string`                                                     | —       | Renderizado em `text-2xs uppercase tracking-wider`. |
| `value`     | `string \| number`                                            | —       | Renderizado em `text-2xl font-semibold tabular-nums`. |
| `icon`      | `LucideIcon` (opcional)                                       | —       | Cor `text-muted` (`text-warning` se `alert`).    |
| `subtitle`  | `string` (opcional)                                           | —       | Copy auxiliar `text-xs text-muted`.              |
| `alert`     | `boolean`                                                     | `false` | Aplica `border-warning/40 bg-warning-soft`.       |
| `delta`     | `{ value: string; direction: "up" \| "down" \| "flat" }`      | —       | Indicador visual com ícone Lucide.               |
| `href`      | `string` (opcional)                                           | —       | Envelopa em `<Link>` com `aria-label`.           |
| `className` | `string`                                                      | —       | —                                                |

**Do:**

```tsx
import { KPICard } from "@/components/ui/kpi-card";
import { Users } from "lucide-react";

<KPICard
  label="Fila de moderação"
  value={42}
  icon={Users}
  subtitle="aguardando revisão"
  alert={42 > 30}
  href="/admin/moderacao"
/>;
```

**Don't:**

```tsx
{/* ❌ Tile reimplementado com border-amber-300 e shadow-sm cru. */}
<div className="rounded border border-amber-300 bg-white p-5 shadow-sm">
  <p className="text-[10px] uppercase text-zinc-500">Fila</p>
  <p className="text-2xl font-bold">42</p>
</div>
```

### 4.7 `Input`

Arquivo: `src/components/ui/input.tsx`.

**Props:**

| Prop      | Tipo                                | Notas                              |
| --------- | ----------------------------------- | ---------------------------------- |
| `label`   | `string` (opcional)                 | Renderiza `<label>` associado.     |
| `hint`    | `string` (opcional)                 | Copy auxiliar `text-sm text-muted`.|
| `error`   | `string` (opcional)                 | Borda vermelha + mensagem.         |
| `prefix`  | `string` (opcional)                 | Prefixo inline (ex.: `R$`).        |
| ...rest   | `InputHTMLAttributes<HTMLInputElement>` | —                              |

**Do:**

```tsx
import { Input } from "@/components/ui/input";

<Input
  name="email"
  label="E-mail"
  hint="Usado para login e recuperação."
  type="email"
  required
/>;
```

**Don't:**

```tsx
{/* ❌ Input cru com paleta zinc e sem focus ring substituto. */}
<input
  className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs outline-none"
  placeholder="E-mail"
/>
```

### 4.8 `Select`

Arquivo: `src/components/ui/select.tsx`.

**Props:**

| Prop          | Tipo                                       | Notas                             |
| ------------- | ------------------------------------------ | --------------------------------- |
| `label`       | `string` (opcional)                        | —                                 |
| `hint`        | `string` (opcional)                        | —                                 |
| `error`       | `string` (opcional)                        | —                                 |
| `options`     | `{ value: string; label: string }[]`       | Itens do select.                  |
| `placeholder` | `string` (opcional)                        | Vira primeira `<option>` `disabled`.|
| ...rest       | `SelectHTMLAttributes<HTMLSelectElement>`   | —                                 |

**Do:**

```tsx
import { Select } from "@/components/ui/select";

<Select
  name="plano"
  label="Plano"
  options={[
    { value: "ESSENCIAL", label: "Essencial" },
    { value: "DESTAQUE", label: "Destaque" },
    { value: "PREMIUM", label: "Premium" },
  ]}
  placeholder="Selecione…"
/>;
```

**Don't:**

```tsx
{/* ❌ Select cru sem chevron customizado e sem focus ring. */}
<select className="border border-zinc-300 px-2 py-1 text-xs">
  <option>Essencial</option>
</select>
```

### 4.9 `Textarea`

Arquivo: `src/components/ui/textarea.tsx`. Mesma API de `Input` exceto
`prefix`. Aceita `label`, `hint`, `error`.

**Do:**

```tsx
import { Textarea } from "@/components/ui/textarea";

<Textarea
  name="bio"
  label="Bio"
  hint="Até 240 caracteres."
  rows={4}
  maxLength={240}
/>;
```

**Don't:**

```tsx
{/* ❌ Textarea com resize default e classes cruas. */}
<textarea className="rounded border border-zinc-300 p-2 text-sm" />
```

### 4.10 `Switch`

Arquivo: `src/components/ui/switch.tsx`.

**Props:**

| Prop       | Tipo                              | Default | Notas                                      |
| ---------- | --------------------------------- | ------- | ------------------------------------------ |
| `checked`  | `boolean`                         | —       | Estado controlado.                         |
| `onChange` | `(checked: boolean) => void`      | —       | Callback.                                  |
| `disabled` | `boolean`                         | `false` | —                                          |
| `size`     | `"sm" \| "md"`                     | `"md"`  | —                                          |
| `label`    | `string` (opcional)               | —       | Vira `aria-label` no botão.                |

ARIA: `role="switch"` + `aria-checked`.

**Do:**

```tsx
import { Switch } from "@/components/ui/switch";

<Switch
  checked={notificacoesAtivas}
  onChange={setNotificacoesAtivas}
  label="Notificações por e-mail"
/>;
```

**Don't:**

```tsx
{/* ❌ Checkbox cru sem semântica de switch. */}
<input type="checkbox" className="accent-emerald-500" />
```

### 4.11 `ToggleChip`

Arquivo: `src/components/ui/toggle-chip.tsx`.

**Props:**

| Prop        | Tipo            | Notas                                                |
| ----------- | --------------- | ---------------------------------------------------- |
| `active`    | `boolean`       | Estilo coral preenchido quando `true`.               |
| `onClick`   | `() => void`    | —                                                    |
| `children`  | `ReactNode`     | Conteúdo do chip.                                    |
| `className` | `string`        | —                                                    |

Use para filtros multi-valor (ex.: tags). Para sub-navegação, prefira `Tabs`.

**Do:**

```tsx
import { ToggleChip } from "@/components/ui/toggle-chip";

<ToggleChip active={tags.includes("verificado")} onClick={() => toggle("verificado")}>
  Verificado
</ToggleChip>;
```

**Don't:**

```tsx
{/* ❌ Chip ativo com bg-pink-500 cru. */}
<button className={active ? "bg-pink-500 text-white" : "bg-zinc-100"}>
  Verificado
</button>
```

### 4.12 `EmptyState`

Arquivo: `src/components/ui/empty-state.tsx`.

**Props:**

| Prop          | Tipo                                                        | Notas                                            |
| ------------- | ----------------------------------------------------------- | ------------------------------------------------ |
| `title`       | `string`                                                    | —                                                |
| `description` | `string` (opcional)                                         | —                                                |
| `icon`        | `ReactNode` (opcional)                                      | Ícone Lucide em `text-muted`.                    |
| `action`      | `{ label: string; href?: string; onClick?: () => void }`    | CTA principal (vira `<Link>` ou `<button>`).     |
| `className`   | `string`                                                    | —                                                |

Use como fallback de listas vazias e em `ChartCard` quando `data.length === 0`.

**Do:**

```tsx
import { EmptyState } from "@/components/ui/empty-state";
import { Inbox } from "lucide-react";

<EmptyState
  icon={<Inbox className="h-10 w-10" />}
  title="Nada por aqui ainda"
  description="Quando houver novas verificações, elas aparecem aqui."
  action={{ label: "Atualizar", onClick: refetch }}
/>;
```

**Don't:**

```tsx
{/* ❌ Mensagem vazia inline sem hierarquia. */}
<p className="text-zinc-500">Sem resultados.</p>
```

---

## 5. Charts

Fonte canônica: `src/lib/chart-tokens.ts`. **Nunca** usar hex literais em
recharts — declare o token em `globals.css` primeiro.

### 5.1 `CHART_PALETTE`

Cada chave aponta para `var(--privello-*)`. Ordem reflete hierarquia
recomendada (primary para a série dominante, coral só para destaques).

| Chave     | Token CSS                    | Uso                                      |
| --------- | ---------------------------- | ---------------------------------------- |
| `primary` | `var(--privello-ink)`        | Série principal (preto Privello).        |
| `coral`   | `var(--privello-coral)`      | Destaque pontual (não para status).      |
| `blue`    | `var(--privello-blue)`       | Série secundária neutra.                 |
| `purple`  | `var(--privello-accent-purple)` | Categoria premium.                    |
| `success` | `var(--privello-green)`      | Série semântica de sucesso.              |
| `warning` | `var(--privello-warning)`    | Série semântica de atenção.              |

### 5.2 Estilos auxiliares

| Constante                | Valor                                          | Uso                                |
| ------------------------ | ---------------------------------------------- | ---------------------------------- |
| `CHART_GRID_STROKE`      | `var(--privello-chart-grid)`                   | `<CartesianGrid stroke=...>`        |
| `CHART_TICK_FILL`        | `var(--privello-muted)`                        | `<XAxis tick={{ fill: ... }}>`      |
| `CHART_AREA_OPACITY`     | `0.08`                                         | `<Area fillOpacity={...}>`          |
| `CHART_TOOLTIP_STYLE`    | objeto CSS-in-JS (border hairline, shadow-sm)  | `<Tooltip contentStyle={...}>`      |

**Do:**

```tsx
import { CHART_PALETTE, CHART_GRID_STROKE, CHART_TOOLTIP_STYLE } from "@/lib/chart-tokens";

<LineChart data={data}>
  <CartesianGrid stroke={CHART_GRID_STROKE} />
  <Line dataKey="mrr" stroke={CHART_PALETTE.primary} strokeWidth={1.5} />
  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
</LineChart>;
```

**Don't:**

```tsx
{/* ❌ Hex literais e cinza fora dos tokens. */}
<Line dataKey="mrr" stroke="#1a1a1a" />
<CartesianGrid stroke="#e5e5e3" />
```

---

## 6. Anti-patterns

Cada item abaixo é detectado pelo lint guard
(`scripts/check-no-raw-palette.mjs` em CI) ou por revisão obrigatória.

1. **Cores cruas Tailwind fora de `src/components/ui/**` e
   `src/lib/chart-tokens.ts`.** Banidos: `bg-zinc-*`, `bg-amber-*`,
   `bg-sky-*`, `bg-emerald-*`, `bg-fuchsia-*`, `bg-indigo-*`, `bg-rose-*`,
   `bg-pink-*`, `bg-purple-*`, `bg-teal-*`, `bg-lime-*`, `bg-stone-*`,
   `bg-slate-*`, `bg-gray-*`, `bg-neutral-*` — e seus pares `text-*`,
   `border-*`, `ring-*`, `from-*`, `to-*`, `via-*`. Use tokens (`bg-success`,
   `text-coral`, `border-line`, `bg-success-soft`, etc.).

2. **Bordas duras (`border` 2px+) em superfícies de conteúdo.** Use hairline
   `border-black/[0.06]` (via `Card variant="solid"`) ou `border-line`.

3. **Glass agressivo.** Sem `backdrop-blur-xl`, sem `bg-white/40` translúcido
   genérico, sem gradientes coloridos. Use `Card variant="glass"` ou a
   classe `.glass-card` quando precisar de glass.

4. **Inter alternativo.** Nada de `font-mono` para corpo de UI, nada de
   carregar Geist/Roboto/serif "para variar". `--font-sans` e `--font-serif`
   apontam para Inter — herda do `<body>`.

5. **`outline: none` sem focus ring substituto.** Sempre que zerar a outline
   nativa, aplique
   `focus-visible:ring-2 focus-visible:ring-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background`.

6. **Hex literais em recharts.** Use `CHART_PALETTE.*` e
   `CHART_GRID_STROKE`. Adicionar nova cor de chart exige token novo em
   `globals.css` primeiro.

7. **Coral como cor de status.** Coral é marca/afeto/ação. Status usa
   `success`, `warning`, `danger`, `info`, `premium` — derivados via
   `statusToBadgeVariant`.

8. **Reimplementar `STATUS_COLORS` ou `PLAN_COLORS` em página.** Sempre
   importe `statusToBadgeVariant` de `@/lib/ui/status`.

9. **Tabela bruta `<table className="w-full text-left text-sm">`.** Use
   `Table`/`THead`/`TR`/`TH`/`TD`.

10. **KPI ad-hoc com `rounded border bg-white shadow-sm`.** Use `KPICard`.

---

## 7. Notas de acessibilidade

Decisões de a11y travadas pelo design language. Estas notas estão
documentadas para que futuros mantenedores não as flexibilizem
inadvertidamente.

### 7.1 `text-muted` apenas em texto large (≥ 18 px)

`text-muted` (`#86868b` sobre `#f5f5f7`) tem razão de contraste ≈ 3.5:1 —
abaixo de WCAG AA 4.5:1 para texto regular, mas acima de 3:1 (large text
AA, ≥ 18 px regular ou ≥ 14 px bold). **Restrinja `text-muted` a:**

- Labels uppercase em `text-2xs` apenas quando `font-semibold tracking-wider`
  (uso já validado em `KPICard`/`Table`).
- Copy `text-md` (14 px) em peso `font-medium` ou superior.
- Copy `text-2xl` (18 px) ou maior em qualquer peso.

Para texto crítico em corpo regular `text-base` (13 px), use `text-foreground`
ou aplique sobre `bg-success-soft`/`bg-warning-soft` com `text-success-dark`/
`text-warning-dark` (tokens já com contraste AA).

### 7.2 Focus rings

Todos os primitivos interativos (`Button`, `Input`, `Select`, `Textarea`,
`Switch`, `ToggleChip`, `Tabs`, links de sidebar) aplicam o ring canônico:

```css
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-blue/40
focus-visible:ring-offset-2
focus-visible:ring-offset-background
```

Nunca remover sem substituir. O lint guard pode ser estendido para detectar
`outline: none` sem ring adjacente.

### 7.3 Touch target ≥ 44×44 (WCAG 2.5.5)

Todos os controles interativos renderizam `min-h-[44px] min-w-[44px]`. Vale
para `Button` (todas as variantes/sizes), itens de `Tabs`, links de nav da
sidebar, drawer mobile e bottom-nav. `IconButton` herda o mesmo piso.

### 7.4 `prefers-reduced-motion: reduce`

Regra global em `globals.css` neutraliza:

- `animation-duration` e `animation-delay` para `0.01ms`.
- `transition-duration` e `transition-delay` para `0.01ms`.
- `::view-transition-old(*)`/`::view-transition-new(*)`/`::view-transition-group(*)`
  para `0s`.

Animações decorativas custom (ex.: `fire-border-wrap` no boost) **devem**
respeitar essa preferência — aplique `@media (prefers-reduced-motion: reduce)`
explícito quando criar animação nova fora dos tokens existentes.

### 7.5 Pares de contraste validados

Pares principais já testados em `src/lib/a11y/contrast.test.ts`:

| Par                                        | Razão     | AA    |
| ------------------------------------------ | --------- | ----- |
| `text-foreground` × `bg-background`        | ≥ 4.5:1   | ✅    |
| `text-white` × `bg-foreground`             | ≥ 4.5:1   | ✅    |
| `text-coral` × `bg-background` (large)     | ≥ 4.5:1   | ✅    |
| `text-muted` × `bg-background` (large)     | ≥ 3:1     | ✅    |

Para combinações novas, rode `contrastRatio(fg, bg)` antes de fixar.

---

## 8. Manutenção do design system

- **Adicionar token novo:** declare em `:root` (`src/app/globals.css`),
  mapeie em `@theme inline`, atualize as tabelas de §2 e adicione teste em
  `tokens.test.ts` se for cor.
- **Adicionar variante a primitivo:** atualize a `union type`, adicione
  estilo em `variantStyles`, escreva teste unit e atualize §4 com props +
  do/don't.
- **Adicionar primitivo novo:** crie `src/components/ui/<nome>.tsx`,
  documente aqui em §4 com mesma estrutura (props, variantes, do/don't),
  atualize `CHANGELOG.md`.
- **Mudar mapa de status:** edite `src/lib/ui/status.ts` (e o property
  test associado), atualize §3.

Qualquer mudança que não passe pelo design system deve ser tratada como
dívida de UI e levantada para revisão.
