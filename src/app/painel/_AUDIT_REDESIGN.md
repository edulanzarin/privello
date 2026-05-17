# Auditoria — classes Tailwind cruas em `src/app/painel/**/*.tsx`

> **Task:** `20.1 Auditar src/app/painel/**/*.tsx por classes Tailwind cruas`
> **Spec:** `redesign-macos-system`
> **Requirement:** `3.7` (sem cores cruas fora de `src/components/ui/` e `src/lib/chart-tokens.ts`)
> **Pré-requisito de:** `20.2 Migrar painel pages remanescentes para primitivos`

---

## Regex auditado

```regex
\b(bg|text|border|ring|from|to|via)-(zinc|amber|sky|emerald|fuchsia|indigo|rose|pink|purple|teal|lime|stone|slate|gray|neutral)-\d+\b
```

(Mesma regex usada em `tasks.md` 20.1 e 23.1 — fonte canônica do gate de CI futuro.)

---

## Sumário

- **Total de matches (in-scope):** 8 ocorrências
- **Total de arquivos afetados (in-scope):** 2
- **Cor crua única detectada:** `amber` (paleta Tailwind padrão)
- **Arquivos varridos:** 42 `.tsx` em `src/app/painel/**`

### Arquivos afetados

| # | Arquivo | Matches | Tokens distintos |
|---|---------|---------|------------------|
| 1 | `src/app/painel/page.tsx` | 5 linhas / 7 tokens | `border-amber-200`, `bg-amber-50`, `text-amber-500`, `text-amber-700`, `text-amber-800`, `bg-amber-500`, `bg-amber-600` |
| 2 | `src/app/painel/plano/page.tsx` | 3 linhas / 4 tokens | `border-amber-200`, `bg-amber-50`, `bg-amber-400`, `text-amber-800` |

### Arquivos limpos (40)

Os demais arquivos sob `src/app/painel/**/*.tsx` não contêm matches da regex auditada. Listagem:

```
src/app/painel/error.tsx
src/app/painel/layout.tsx
src/app/painel/loading.tsx
src/app/painel/avaliacoes/{error,loading,page}.tsx
src/app/painel/disponibilidade/{availability-form,error,loading,page}.tsx
src/app/painel/financeiro/{error,financial-table,loading,page}.tsx
src/app/painel/midias/{error,loading,midias-manager,page}.tsx
src/app/painel/perfil/{error,loading,page,perfil-editor}.tsx
src/app/painel/plano/{error,loading,upgrade-button}.tsx
src/app/painel/reels/{error,loading,page}.tsx
src/app/painel/stories/{error,loading,page,stories-manager}.tsx
src/app/painel/suporte/{error,loading,page}.tsx
src/app/painel/suporte/[id]/{error,loading,page}.tsx
src/app/painel/valores/{error,loading,page,valores-form}.tsx
```

---

## Detalhamento por arquivo (in-scope)

### 1. `src/app/painel/page.tsx`

Banner "Perfil desabilitado / Sem plano" (lines 138–157).

| Linha | Tokens crus | Trecho |
|-------|-------------|--------|
| 139 | `border-amber-200`, `bg-amber-50` | `<div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200/60 bg-amber-50 px-5 py-4">` |
| 141 | `text-amber-500` | `<AlertCircle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" strokeWidth={1.5} />` |
| 143 | `text-amber-800` | `<p className="text-base font-semibold text-amber-800">Perfil desabilitado</p>` |
| 144 | `text-amber-700` | `<p className="mt-0.5 text-sm text-amber-700">` |
| 151 | `bg-amber-500`, `bg-amber-600` | `className="shrink-0 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 active:scale-[0.97]"` |

**Sugestão de migração para 20.2** (informativa, não aplicar agora):
- Bloco inteiro → `<Card variant="warning-subtle">` ou `<KPICard alert={true} ...>` conforme design system (Requirements 3.1, 3.7, 3.8).
- CTA "Ativar plano" → `<Button variant="primary">` (azul do sistema) ou variante `warning` se existir; alinhar com decisão tomada em `/admin/verificacoes/[id]` (task 17, que deixou em aberto criação de variante `success` dedicada).

### 2. `src/app/painel/plano/page.tsx`

Inline "sem plano ativo" (lines 74–77).

| Linha | Tokens crus | Trecho |
|-------|-------------|--------|
| 74 | `border-amber-200`, `bg-amber-50` | `<div className="mt-2 flex items-center gap-2 rounded-xl border border-amber-200/60 bg-amber-50 px-4 py-3">` |
| 75 | `bg-amber-400` | `<span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />` |
| 76 | `text-amber-800` | `<p className="text-base text-amber-800 font-medium">Nenhum plano ativo — você não aparece nas buscas.</p>` |

**Sugestão de migração para 20.2** (informativa):
- Pílula → `<Badge variant="warning">` ou `<Card variant="warning-subtle" padding="sm">` com `Dot` (status indicator). Mesmo padrão do banner do dashboard para consistência visual.

---

## Achados adjacentes (fora do escopo da regex 20.1, mas relevantes para 20.2 / 23.x)

A regex de 20.1 cobre 15 cores específicas do Tailwind. Outros tokens crus de paleta Tailwind também aparecem em `src/app/painel/**` e provavelmente devem entrar na limpeza geral feita em 20.2 (e serão capturados pelo gate de CI da task 23.1, que usa a mesma lista). Documentado aqui apenas para que 20.2 não seja surpreendido:

| Arquivo | Linha | Tokens |
|---------|-------|--------|
| `src/app/painel/page.tsx` | 160 | `border-red-300`, `bg-red-50` |
| `src/app/painel/page.tsx` | 161 | `text-red-600` |
| `src/app/painel/page.tsx` | 163 | `text-red-700` |
| `src/app/painel/page.tsx` | 164 | `text-red-600` |
| `src/app/painel/page.tsx` | 175 | `border-yellow-300`, `bg-yellow-50` |
| `src/app/painel/page.tsx` | 176 | `text-yellow-600` |
| `src/app/painel/page.tsx` | 177 | `text-yellow-700` |
| `src/app/painel/perfil/perfil-editor.tsx` | 155 | `bg-red-50`, `border-red-200` |

> ⚠️ **Nota:** A regex oficial de 20.1 e 23.1 NÃO inclui `red`, `yellow`, `orange`, `green`, `blue`, `cyan`, `violet`. Se a intenção do design system é também banir esses tokens, considerar atualizar a regex em 23.1 antes de virar `error` no CI. Decisão fica para o usuário (não alterar AC sem input).

---

## Próximos passos

- ✅ **20.1 (este task):** auditoria concluída — 2 arquivos, 8 ocorrências in-scope.
- ▶️ **20.2:** consumir esta lista, substituir os blocos amber por `<Card variant="warning-subtle">` / `<Badge variant="warning">` conforme design system. Reavaliar achados adjacentes (red/yellow) com o usuário antes de incluir no escopo.
