# Auditoria — páginas públicas alinhadas ao redesign macOS

> **Task:** `21.1 Auditar páginas públicas alinhadas`
> **Spec:** `redesign-macos-system`
> **Requirements:** `2.2, 3.1, 4.3` (mapeia a Requirements 11.3 + 11.4 em `requirements.md`)
> **Pré-requisito de:** `21.2 Aplicar correções pontuais identificadas na auditoria`

---

## Escopo auditado

Páginas públicas listadas em 21.1:

| Surface | Path(s) |
|---------|---------|
| Home | `src/app/page.tsx` |
| Perfil público | `src/app/p/[slug]/{page,error,loading}.tsx` |
| Descobrir | `src/app/descobrir/[citySlug]/{page,error,loading}.tsx` |
| Planos | `src/app/planos/page.tsx` |
| Em alta | `src/app/em-alta/{page,error,loading}.tsx` |
| Em destaque | `src/app/em-destaque/{page,error,loading}.tsx` |
| Novidades | `src/app/novidades/page.tsx` |
| Onboarding | `src/app/conta/onboarding/{fotos,perfil,publicar,valores}/**/*.tsx` + `onboarding-nav.tsx` |
| Cadastro | `src/app/cadastro/{page,error,loading}.tsx`, `src/app/cadastro/cliente/**/*.tsx`, `src/app/cadastro/acompanhante/**/*.tsx`, `src/app/cadastro/sucesso/page.tsx` |
| Termos de uso | `src/app/termos-de-uso/page.tsx` |
| Política de privacidade | `src/app/politica-de-privacidade/page.tsx` |

Total de arquivos `.tsx` varridos: **~37**.

---

## Regex auditado (alinhada a 20.1 e 23.1)

```regex
\b(bg|text|border|ring|from|to|via)-(zinc|amber|sky|emerald|fuchsia|indigo|rose|pink|purple|teal|lime|stone|slate|gray|neutral)-\d+\b
```

### Expansão de escopo (orquestrador)

A regex oficial não captura `red`, `yellow`, `orange`. Como a task pediu para "garantir uso consistente de `Card`, `Badge`, `Button`, hairlines `border-black/[0.06]`", também foi rodada a regex estendida abaixo, **flagada separadamente** para que 21.2 e 23.1 decidam o escopo do gate de CI:

```regex
\b(bg|text|border|ring|from|to|via)-(red|yellow|orange|violet|cyan|blue|green)-\d+\b
```

Decisão de incluir/excluir essas paletas no gate fica para o usuário (não alterar AC sem input).

---

## Sumário

| Categoria | Matches (tokens) | Linhas | Arquivos afetados |
|-----------|------------------|--------|-------------------|
| **In-scope (regex 20.1/23.1)** — `amber` | **2** | **2** | **1** |
| Adjacente: `red-*` (hardcoded) | 5 | 2 | 2 |
| Adjacente: `orange-*` (hardcoded) | 1 | 1 | 1 |
| **Total geral** | **8** | **5** | **3** |

> ✅ **Conclusão imediata:** apenas **1 arquivo público** viola a regex oficial de paleta crua, e apenas com `amber-*`. Os outros 5 tokens (`red-*`, `orange-*`) ficam fora da regex 20.1/23.1 e dependem de decisão do usuário sobre o escopo do gate de CI (task 23.1).

### Matches in-scope (regex oficial 20.1/23.1)

| # | Arquivo | Linhas | Tokens distintos |
|---|---------|--------|------------------|
| 1 | `src/app/cadastro/sucesso/page.tsx` | 85, 86 | `bg-amber-50`, `text-amber-500` |

### Arquivos limpos in-scope

Todas as demais páginas listadas em 21.1 retornaram **0 matches** da regex oficial:

```
src/app/page.tsx
src/app/p/[slug]/{page,error,loading}.tsx
src/app/descobrir/[citySlug]/{page,error,loading}.tsx
src/app/planos/page.tsx
src/app/em-alta/{page,error,loading}.tsx
src/app/em-destaque/{page,error,loading}.tsx
src/app/novidades/page.tsx
src/app/conta/onboarding/{fotos,perfil,publicar,valores}/**/*.tsx
src/app/conta/onboarding/onboarding-nav.tsx
src/app/cadastro/{page,error,loading}.tsx
src/app/cadastro/cliente/**/*.tsx
src/app/cadastro/acompanhante/**/*.tsx
src/app/termos-de-uso/page.tsx
src/app/politica-de-privacidade/page.tsx
```

---

## Detalhamento por arquivo

### 1. `src/app/cadastro/sucesso/page.tsx` (in-scope)

Branch `status === "timeout"` (lines 84–89). Painel circular indicando "Pagamento em processamento".

| Linha | Tokens crus | Trecho |
|-------|-------------|--------|
| 85 | `bg-amber-50` | `<div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">` |
| 86 | `text-amber-500` | `<Clock className="h-8 w-8 text-amber-500" />` |

**Sugestão de migração para 21.2** (informativa, não aplicar agora):
- Substituir por `<Card variant="warning-subtle" padding="md" className="rounded-full ...">` ou stylesheet de status `warning` (`bg-warning-soft`/`text-warning`) — alinhado às variantes adicionadas na task 3.3.
- Branch `waiting` (line 64–66) e branch `ready` (line 113–115) já usam tokens canônicos (`bg-blue/10` + `text-blue`, `bg-success/10` + `text-success`); o `timeout` deve seguir o mesmo padrão com `warning`.

**Observação adicional (consistência de Card):** a página fecha a estrutura em `<div className="... rounded-2xl border border-black/[0.06] bg-white p-10 shadow-[...]">` (line 132). Hairline correta, mas seria candidato natural para `<Card variant="solid" padding="md">` em 21.2.

---

### Adjacentes — `red-*` (fora da regex 20.1/23.1)

#### 2. `src/app/cadastro/cliente/client-register-form.tsx`

| Linha | Tokens | Trecho |
|-------|--------|--------|
| 38 | `bg-red-50`, `border-red-200` | `<div className="rounded-xl bg-red-50 border border-red-200/50 px-4 py-3 text-base text-danger">` |

**Nota:** texto já usa `text-danger` (token canônico). Apenas o fundo/borda do banner de erro estão crus. Sugestão para 21.2: `<Card variant="danger-subtle" padding="sm">` (variante criada em 3.3).

#### 3. `src/app/cadastro/acompanhante/provider-register-form.tsx`

| Linha | Tokens | Trecho |
|-------|--------|--------|
| 253 | `bg-red-50`, `border-red-200`, `text-red-600` | `<div className="mb-6 rounded-xl bg-red-50 border border-red-200/50 px-4 py-3 text-sm text-red-600 animate-fade-in">` |

**Nota:** mesmo padrão do cliente, mas aqui o texto também está cru (`text-red-600` em vez de `text-danger`). Sugestão para 21.2: `<Card variant="danger-subtle" padding="sm" className="animate-fade-in">` + `text-danger`.

> 🎬 `animate-fade-in` é neutralizado globalmente por `globals.css` linhas 368–387 (`@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; ... } }`), validado pelo teste P4 em `src/app/globals.reduced-motion.test.ts`. Nenhuma ação extra necessária aqui.

---

### Adjacentes — `orange-*` (fora da regex 20.1/23.1)

#### 4. `src/app/p/[slug]/page.tsx`

| Linha | Tokens | Trecho |
|-------|--------|--------|
| 160 | `bg-orange-500` | `? { bg: "bg-orange-500", label: "BOOST" }` |

Faz parte do `PLAN_BADGE` map ad-hoc (linha 78–82) que já mistura tokens canônicos (`bg-coral`, `bg-foreground`, `bg-black/60`) com o crú `bg-orange-500` para o caso "BOOST".

**Sugestão de migração para 21.2** (informativa):
- Esse `PLAN_BADGE` é um data structure local que escapa do `<Badge>` primitivo; deve ser refatorado para `statusToBadgeVariant` (`src/lib/ui/status.ts` da task 2.1). Adicionar nova variante `boost` em 2.1 ou reusar `coral` se a marca aceitar; alternativamente usar `<Badge variant="coral">` ou `<Badge variant="premium">` (`bg-purple-soft text-accent-purple`).
- Decisão sobre adicionar variante `boost` é de spec design — consultar usuário em 21.2 antes de criar token novo.

---

## Uso de primitivos (`Card`, `Badge`, `Button`) por surface

Resultado do grep `from "@/components/ui/(card|badge|button|tabs|kpi-card|input|select|textarea|toggle-chip|switch)"` no escopo público:

| Surface | Primitivos importados |
|---------|----------------------|
| `src/app/cadastro/cliente/client-register-form.tsx` | `Input`, `Button` |
| `src/app/cadastro/acompanhante/provider-register-form.tsx` | `Input`, `Textarea`, `Select`, `Button`, `ToggleChip`, `Card`, `Switch` |
| `src/app/conta/onboarding/valores/valores-form.tsx` | `Switch` |
| **Demais surfaces** | **nenhum** (HTML cru + Tailwind tokens canônicos) |

### Padrões repetidos que poderiam virar primitivos (informativo, **fora do escopo de 21.1/21.2**)

Esses casos NÃO violam a regex 20.1/23.1, mas são divergências do design system que valem registrar para o checkpoint da Fase E ou para uma future task de refactor:

| Padrão | Onde aparece | Sugestão |
|--------|--------------|----------|
| `<button>`/`<Link>` com `rounded-lg bg-foreground py-3 text-white shadow-sm transition hover:brightness-110 active:scale-[0.97]` | `src/app/planos/page.tsx` linhas 55, 91, 124; `src/app/descobrir/[citySlug]/page.tsx` linhas 215, 242, 302; `src/app/p/[slug]/page.tsx` linhas 296, 449, 478 | Trocar por `<Button variant="primary">` / `<Button variant="coral">` / `<Button variant="outline">` |
| `<div className="rounded-2xl border border-black/[0.06] bg-white p-N shadow-[...]">` | `src/app/page.tsx` linha 82, 499; `src/app/cadastro/sucesso/page.tsx` linha 132; `src/app/conta/onboarding/valores/valores-form.tsx` linhas 101, 150 | Trocar por `<Card variant="solid" padding="md">` (hairline + sombra já aplicadas pelo primitivo) |
| Pílulas `rounded-full border border-black/[0.08] bg-white px-3.5 py-1.5 ...` | `src/app/page.tsx` linhas 113–119 (top cidades) | Candidato a primitivo `<Chip>`/`<Pill>` ou `<Button variant="pill">` (não existe ainda; apenas notar) |
| Status pílulas inline `flex items-center gap-1.5 rounded-full bg-{success\|blue}/10 px-2.5 py-[3px] text-xs font-semibold ...` | `src/app/p/[slug]/page.tsx` linhas 215, 220 (Online, Verificada) | Trocar por `<Badge variant="success">` / `<Badge variant="info">` (variants existentes pós-3.1) |
| Banner de erro inline `<div className="rounded-xl border border-coral/30 bg-coral/5 px-4 py-3 text-sm text-coral">` | `src/app/conta/onboarding/perfil/perfil-form.tsx` linha 80; `src/app/conta/onboarding/valores/valores-form.tsx` linha 97 | Não usa Tailwind cru — tokens canônicos `coral`. Mantém-se como está (não-issue). |

---

## Hairlines `border-black/[0.06]` — consistência

Resultado do grep `border-black/\[0\.0\d+\]` no escopo público:

| Arquivo | Ocorrências |
|---------|-------------|
| `src/app/page.tsx` | 6 (`/[0.06]` × 4, `/[0.05]` × 2, `/[0.08]` × 1) |
| `src/app/p/[slug]/page.tsx` | 12 (`/[0.06]` × 5, `/[0.05]` × 6, `/[0.07]` × 1) |
| `src/app/descobrir/[citySlug]/page.tsx` | 3 (`/[0.06]` × 3) |
| `src/app/cadastro/sucesso/page.tsx` | 1 (`/[0.06]`) |
| `src/app/conta/onboarding/valores/valores-form.tsx` | 4 (`/[0.06]` × 4) |
| `src/app/conta/onboarding/fotos/photo-uploader.tsx` | 1 (`/[0.12]`) + `bg-black/[0.04]` |

**Observação:** a opacidade canônica é `border-black/[0.06]`. Variantes `0.05`, `0.07`, `0.08`, `0.12` aparecem dispersas sem racional documentado. A task 21.2 pode normalizar em `0.06` exceto onde houver intenção explícita (ex.: divisores internos com `0.05`). Hairline padrão respeitada na maioria dos casos.

---

## `prefers-reduced-motion` — neutralização de animações

### Cobertura global

`src/app/globals.css` (linhas 368–387) declara:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-delay: 0.01ms !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0.01ms !important;
  }

  ::view-transition-old(*),
  ::view-transition-new(*),
  ::view-transition-group(*) {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
  }
}
```

A regra é **global** (`*, *::before, *::after`), então cobre **todas** as classes Tailwind `animate-*` e `transition-*` usadas em qualquer surface — inclusive o age-gate banner e as transições de View Transitions API.

### Validação por testes

| Teste | Cobertura | Status |
|-------|-----------|--------|
| `src/__tests__/globals-css-reduced-motion.test.ts` (Property 3, fase-5) | Estática: confere existência do bloco e regras balanceadas em `globals.css` | ✅ existente |
| `src/app/globals.reduced-motion.test.ts` (Property 4, redesign-macos) | Comportamental: jsdom + `matchMedia` mock + injeção das regras internas; assere `animationDuration === "0.01ms"` em `.animate-fade-in`, `.animate-scale-in`, `view-transition-old/new(*)` | ✅ existente |

### Animações usadas em páginas públicas

| Surface | Animação | Notas |
|---------|----------|-------|
| Age-gate (`src/components/age-gate.tsx`) | Apenas `transition` em `<button>` (line 56) e `<a>` (line 63), `active:scale-[0.97]` | ✅ Coberto pelo bloco global. Não tem `animate-*` explícito. |
| `src/app/cadastro/acompanhante/provider-register-form.tsx` | `animate-fade-in` em 5 lugares (linhas 253, 260, 322, 443, 500, 547) | ✅ Coberto. |
| `src/app/descobrir/[citySlug]/page.tsx` | `animate-scale-in` em dropdown de ordenação (line 151) | ✅ Coberto. |
| `src/app/conta/onboarding/onboarding-nav.tsx` | Comentários referenciam `<ViewTransition enter/exit>`; usa `view-transition-name` via CSS | ✅ Coberto pelo seletor `::view-transition-old/new/group(*)` no bloco global. |
| Demais páginas | Apenas microinterações `transition`/`hover:`/`active:` Tailwind | ✅ Coberto. |

> ✅ **Conclusão:** `prefers-reduced-motion: reduce` neutraliza animações em **todas** as surfaces públicas. Nenhuma ação adicional é exigida em 21.2 para esta sub-cláusula. AC 11.4 (mapeada via Requirement 2.2) está coberta.

---

## Próximos passos

- ✅ **21.1 (este task):** auditoria concluída.
  - **2 matches in-scope da regex 20.1/23.1** (`amber-*` em `cadastro/sucesso/page.tsx`).
  - **6 matches adjacentes** (`red-*` × 5 em `cadastro/{cliente,acompanhante}`, `orange-*` × 1 em `p/[slug]`).
  - **3 arquivos afetados** (1 in-scope + 2 adjacentes), de ~37 arquivos varridos.
  - **Hairlines:** maioria respeita `border-black/[0.06]`; pequenas variações (`0.05`, `0.07`, `0.08`, `0.12`) podem ser normalizadas em 21.2.
  - **`prefers-reduced-motion`:** neutralização global cobre 100% das animações públicas (validado por 2 testes existentes). Nenhuma ação requerida para AC 11.4.

- ▶️ **21.2:**
  1. Substituir banner `timeout` em `cadastro/sucesso/page.tsx` por `<Card variant="warning-subtle">` (in-scope, prioritário).
  2. Substituir banners de erro `bg-red-50 border-red-200` em `cadastro/{cliente,acompanhante}` por `<Card variant="danger-subtle">` + `text-danger`.
  3. Decidir com usuário se `bg-orange-500` em `PLAN_BADGE` (BOOST) deve virar variante `<Badge>` nova ou reusar `coral`/`premium`.
  4. (Opcional, fora de 21.2) Normalizar variantes hairline para `border-black/[0.06]` onde não há intenção explícita.
