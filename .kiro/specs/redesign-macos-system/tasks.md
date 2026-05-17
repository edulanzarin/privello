# Implementation Plan: Redesign macOS System

## Overview

Implementação incremental do design language macOS Sonoma-inspired do Privello em batches pequenos, sem regressão. A spec está em modo light-único (decisão travada) e segue as Fases A–F do `design.md`: tokens + primitivos novos (A), chrome admin (B), migração de `/admin/*` (C), revisão de `/painel/*` (D), revisão pública (E), polimento + docs + lint guard (F).

Stack: TypeScript + React 19 + Next 16 (App Router) + Tailwind v4 (`@theme inline`) + Vitest + `@fast-check/vitest` + Playwright. Sem novas dependências (Constraint 5.7).

Cada task escreve, modifica ou testa código. Sub-tasks de teste estão marcadas com `*` e são opcionais para um MVP rápido — porém todas as Property-Based Tests (P2, P5, P7) e example/integration (P1, P3, P4, P6, P8, P9) estão listadas separadamente para rastreabilidade. P10 é gate via lint na Fase F.

## Tasks

- [x] 1. Fase A — Tokens base e infraestrutura visual
  - [x] 1.1 Adicionar tokens novos em `src/app/globals.css`
    - Declarar `--privello-success-soft`, `--privello-warning-soft`, `--privello-danger-soft`, `--privello-info-soft`, `--privello-purple-soft` em `:root`.
    - Declarar `--privello-chart-grid` e `--shadow-hairline`, `--shadow-sm`, `--shadow-md`.
    - Mapear todos os tokens novos no bloco `@theme inline` (`--color-success-soft`, `--color-chart-grid` etc.).
    - Preservar exatamente os hex existentes para `--privello-cream` (`#f5f5f7`), `--privello-ink` (`#1d1d1f`), `--privello-coral` (`#ff375f`), `--privello-muted` (`#86868b`), `--privello-line` (`#d2d2d7`).
    - _Requirements: 1.1, 1.6, 1.10, 4.2, 5.3, 5.5_

  - [x] 1.2 Teste de integração de tokens CSS resolvendo do `:root`
    - **Property 9: Tokens CSS resolvem para os valores definidos em `:root`**
    - **Validates: Requirements 1.6, 4.2**
    - jsdom integration test em `src/app/globals.css.test.ts` (ou `src/lib/design/tokens.test.ts`) cobrindo `--privello-coral`, `--privello-cream`, `--privello-ink`, `--privello-muted`, `--privello-line`, `--privello-blue`, `--privello-green` e os novos `*-soft` + `--privello-chart-grid`.

  - [x] 1.3 Teste de contraste WCAG AA dos pares primários
    - **Property 3: Contraste WCAG AA mínimo nos pares de tokens primários**
    - **Validates: Requirements 1.4, 1.5**
    - Util `contrastRatio(fg, bg)` em `src/lib/a11y/contrast.ts` + teste em `contrast.test.ts` cobrindo `text-foreground × bg-background` ≥ 4.5:1, `text-white × bg-foreground` ≥ 4.5:1, `text-coral × bg-background` ≥ 4.5:1 (large) e `text-muted × bg-background` ≥ 3:1 (large).

- [x] 2. Fase A — Util de status e classNames determinísticos
  - [x] 2.1 Implementar `statusToBadgeVariant` em `src/lib/ui/status.ts`
    - Tipo `StatusBadgeVariant = "info" | "warning" | "success" | "muted" | "danger" | "premium" | "coral"`.
    - Mapeamento canônico documentado no design (NOVO/OPEN→info, REVISAO/IN_PROGRESS→warning, APROVADO→success, REJEITADO/CLOSED→muted, BANIDO/SUSPENSO→danger, PREMIUM→premium, DESTAQUE→coral, ESSENCIAL→info).
    - Fallback determinístico `"muted"` para qualquer string fora do domínio.
    - _Requirements: 3.1, 3.7_

  - [x] 2.2 Property test para `statusToBadgeVariant`
    - **Property 2: `statusToBadgeVariant` é função total no domínio de status conhecidos**
    - **Validates: Requirements 3.1, 3.7**
    - `src/lib/ui/status.pbt.ts` com fast-check garantindo totalidade no domínio conhecido, equivalência (NOVO≡OPEN, REVISAO≡IN_PROGRESS) e fallback `"muted"` para strings arbitrárias.

  - [x] 2.3 Property test para determinismo de className
    - **Property 5: Build de className em Badge/Tabs/KPICard é determinístico**
    - **Validates: Requirements 3.7**
    - `src/lib/ui/cn.pbt.ts` (ou colocar dentro de cada `*.pbt.ts` de primitivo) chamando `cn(buildClass(variant))` N vezes para variantes válidas e verificando idempotência.

- [ ] 3. Fase A — Estender primitivos `Badge` e `Card`
  - [x] 3.1 Estender `Badge` com variantes `info`, `danger`, `premium`
    - Adicionar variantes em `src/components/ui/badge.tsx` consumindo `bg-info-soft text-blue`, `bg-danger-soft text-danger`, `bg-purple-soft text-accent-purple`.
    - Manter API backwards-compatible (variantes existentes intactas).
    - Garantir contraste ≥ 4.5:1 em cada variante.
    - _Requirements: 3.1, 3.7, 3.8, 5.4_

  - [x] 3.2 Testes unit do `Badge`
    - Criar `src/components/ui/badge.test.tsx` cobrendo render de cada variante (default, coral, success, warning, muted, dark, info, danger, premium) e snapshot de classes.
    - _Requirements: 3.1, 3.8_

  - [x] 3.3 Estender `Card` com variantes `success-subtle`, `warning-subtle`, `danger-subtle`
    - Em `src/components/ui/card.tsx`, adicionar as três variantes com `bg-{state}-soft` + `border-{state}/30` + hairline.
    - Variantes `default | glass | solid | dark` permanecem intactas.
    - _Requirements: 3.1, 3.7, 3.8_

  - [x] 3.4 Testes unit do `Card`
    - Atualizar/criar `src/components/ui/card.test.tsx` para cobrir as três novas variantes.
    - _Requirements: 3.1_

- [ ] 4. Fase A — Novo primitivo `Tabs`
  - [x] 4.1 Criar `src/components/ui/tabs.tsx`
    - Tipos `TabItem = { key; label; href?; badge? }` e `TabsProps = { items; activeKey; variant?: "pills" | "underline"; size?: "sm" | "md"; onChange?; className? }`.
    - Variante `pills` (default): ativo `bg-foreground text-white`, inativo `text-muted hover:bg-black/[0.04]`.
    - Variante `underline`: linha 2px `bg-coral` sob o ativo, sem fundo.
    - ARIA: `role="tablist" | role="tab" | role="tabpanel"`, `aria-selected`, `aria-controls`, `aria-labelledby`, roving tabindex.
    - Quando `item.href` setado e `onChange` ausente: renderizar `<Link>` com `aria-current="page"` no ativo.
    - Focus ring `focus-visible:ring-2 focus-visible:ring-blue/40 focus-visible:ring-offset-2`.
    - _Requirements: 2.1, 2.3, 3.2, 3.7, 3.8_

  - [-] 4.2 Testes unit do `Tabs`
    - `src/components/ui/tabs.test.tsx` cobrindo render, troca de `activeKey`, render de `href` vs `onChange`, ARIA básica e roving tabindex.
    - _Requirements: 2.3, 3.2_

  - [-] 4.3 Property test do `Tabs` — invariante de seleção única
    - **Property 7: ARIA roles do `Tabs` mantêm invariante de seleção única**
    - **Validates: Requirements 2.3**
    - `src/components/ui/tabs.pbt.ts` com fast-check gerando arrays arbitrários de `items` (length ≥ 1) e `activeKey` válido, asserindo: 1 `role="tablist"`, N `role="tab"`, exatamente 1 `aria-selected="true"`.

- [ ] 5. Fase A — Novo primitivo `Table`
  - [x] 5.1 Criar `src/components/ui/table.tsx`
    - Exportar `Table`, `THead`, `TR`, `TH`, `TD`.
    - Wrapper `Card variant="solid" padding="none"` + `<div overflow-x-auto>` + `min-w-[Npx]` (prop `minWidth`, default 640).
    - `<thead>`: `border-b border-line`, `text-2xs font-semibold uppercase tracking-wider text-muted`.
    - `<tbody> tr`: `border-b border-line last:border-0 hover:bg-line/20 transition`.
    - Padding `px-3 py-2.5` (head) / `px-3 py-2` (body).
    - Props `TR.hover`, `TH.align`, `TD.align`, `TD.numeric` (aplica `tabular-nums text-right`).
    - Renderizar `<th scope="col">`.
    - _Requirements: 3.5, 3.7, 3.8_

  - [-] 5.2 Testes unit do `Table`
    - `src/components/ui/table.test.tsx` cobrindo render básico, `TD numeric` aplica `tabular-nums text-right`, `TR hover={false}` não aplica hover, `<th scope="col">` presente.
    - **Property 8: `Table` com TD `numeric` aplica `tabular-nums text-right`**
    - **Validates: Requirements 3.5**

- [ ] 6. Fase A — Novo primitivo `KPICard`
  - [x] 6.1 Criar `src/components/ui/kpi-card.tsx`
    - Props `{ label; value; icon?; subtitle?; alert?; delta?: { value; direction: "up" | "down" | "flat" }; href?; className? }`.
    - Container: `Card variant="solid" padding="md"`, rounded-2xl, hairline.
    - Label: `text-2xs font-semibold uppercase tracking-wider text-muted`.
    - Valor: `text-2xl font-semibold tabular-nums tracking-tight`.
    - `alert={true}` aplica `border-warning/40 bg-warning-soft` + ícone `text-warning`.
    - `href` envelopa em `<Link>` com `aria-label`.
    - _Requirements: 3.7, 3.8_

  - [-] 6.2 Testes unit do `KPICard`
    - **Property 6: `KPICard` com `alert={true}` aplica classes de warning sem quebrar shape**
    - **Validates: Requirements 3.7, 3.8**
    - `src/components/ui/kpi-card.test.tsx` render com/sem `alert`, com/sem `href`, com/sem `delta`.

- [ ] 7. Fase A — Tokens de chart e focus rings globais
  - [x] 7.1 Criar `src/lib/chart-tokens.ts`
    - Exportar `CHART_PALETTE = { primary, coral, blue, purple, success, warning }` apontando para `var(--privello-*)`.
    - Exportar `CHART_GRID_STROKE`, `CHART_TICK_FILL`, `CHART_AREA_OPACITY`, `CHART_TOOLTIP_STYLE`.
    - _Requirements: 3.7, 5.3, 5.5_

  - [x] 7.2 Teste do `chart-tokens`
    - `src/lib/chart-tokens.test.ts` validando que cada chave de `CHART_PALETTE` é uma string `var(--privello-...)` e que o objeto é `as const` (sem mutações).
    - _Requirements: 3.7_

  - [x] 7.3 Adicionar focus rings consistentes em primitivos interativos
    - Em `Button`, `Input`, `Select`, `Textarea`, `Switch`, `ToggleChip`, `Dropdown`, `Tabs`, `Sidebar items`: aplicar `focus-visible:ring-2 focus-visible:ring-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background`.
    - Não introduzir `outline: none` sem ring substituto.
    - _Requirements: 2.1, 2.9_

  - [-] 7.4 Auditoria de touch targets em controles interativos
    - **Property 1: Touch target ≥ 44×44 em todos os controles interativos**
    - **Validates: Requirements 2.1**
    - Medir `Button size="sm"`, `IconButton`, links de nav `Tabs`, sidebar e bottom-nav. Ajustar paddings se `getBoundingClientRect()` retornar `< 44`.

  - [x] 7.5 Teste example de touch target em `Button` e `Tabs`
    - Em jsdom (`@testing-library/react`), render `<Button size="sm">`, `<Button size="md">`, `<Tabs items=[...] activeKey>` e asserir `width ≥ 44 && height ≥ 44`.
    - _Requirements: 2.1_

  - [x] 7.6 Teste de neutralização de animações com `prefers-reduced-motion`
    - **Property 4: `prefers-reduced-motion: reduce` neutraliza animações**
    - **Validates: Requirements 2.2**
    - jsdom mockando `matchMedia("(prefers-reduced-motion: reduce)")` → asserir `getComputedStyle(el).animationDuration === "0.01ms"` (ou `"0s"`) em `.animate-fade-in`, `.animate-scale-in`, `view-transition-old/new(*)`.

- [x] 8. Checkpoint — Fase A completa
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Fase B — Chrome compartilhado: `DarkSidebarShell`
  - [x] 9.1 Extrair `DarkSidebarShell` em `src/components/layout/dark-sidebar-shell.tsx`
    - Props `{ logoHref; nav: NavItem[]; pathname; footer; children; contentClassName? }`.
    - Layout `<aside>` desktop fixo `w-56 bg-sidebar text-white` + `<header>` mobile `h-14` + drawer mobile com overlay.
    - Item ativo recebe `aria-current="page"`.
    - _Requirements: 2.7, 3.1, 3.7_

  - [x] 9.2 Refatorar `PainelSidebar` para consumir `DarkSidebarShell`
    - Manter `NAV` e footer (avatar + role + Sair).
    - Sem breaking changes em props públicas (Constraint Req 3.1).
    - _Requirements: 3.1_

  - [-] 9.3 Testes unit do `DarkSidebarShell` e do `PainelSidebar` refatorado
    - `src/components/layout/dark-sidebar-shell.test.tsx`: render desktop vs mobile drawer, `aria-current` no item ativo.

- [ ] 10. Fase B — Refatorar `AdminShell` para sidebar lateral
  - [-] 10.1 Refatorar `src/components/admin/admin-shell.tsx`
    - Substituir topbar `bg-zinc-950` por `DarkSidebarShell` consumindo `NAV_ADMIN` (Moderação, Suporte, Perfis, Mídias, Financeiro, Verificações).
    - Footer com avatar + role + botão Sair.
    - Mobile drawer ativo a partir do header `h-14`.
    - _Requirements: 3.1, 3.7, 5.4_

  - [x] 10.2 Smoke E2E `/admin/moderacao` (Playwright)
    - `tests/e2e/admin-shell.spec.ts`: nav lateral renderiza, drawer mobile abre/fecha, item ativo tem `aria-current`.
    - _Requirements: 2.7_

- [x] 11. Checkpoint — Fase B completa
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Fase C — Migrar `/admin/moderacao`
  - [x] 12.1 Refatorar `src/app/admin/moderacao/page.tsx`
    - 6× KPIs ad-hoc → `<KPICard>`.
    - Tabs inline (`TABS.map(...)`) → `<Tabs variant="pills" size="sm">`.
    - Tabela queue → `<Table>/<THead>/<TR>/<TH>/<TD>`.
    - `STATUS_COLORS` hardcoded → `<Badge variant={statusToBadgeVariant(row.status)}>`.
    - Botão "Buscar" → `<Button size="sm" variant="primary">`.
    - `<input>` cru de busca → `<Input>`.
    - Remover qualquer `bg-{zinc,amber,sky,emerald}-*` cru.
    - _Requirements: 3.1, 3.7, 3.8_

  - [x] 12.2 Testes de regressão visual leves para `/admin/moderacao`
    - Asserts ARIA + presença de `<Badge>` por status, sem cores cruas (grep no DOM renderizado).
    - _Requirements: 3.7_

- [x] 13. Fase C — Migrar `/admin/perfis`
  - [x] 13.1 Refatorar `src/app/admin/perfis/page.tsx`
    - `PLAN_COLORS` hardcoded → `<Badge variant>` (premium/coral/info conforme tier).
    - `<input>`/`<select>` crus → `<Input>`, `<Select>`.
    - Botão "Filtrar" → `<Button>`.
    - Tabela → `<Table>`.
    - _Requirements: 3.1, 3.7_

- [x] 14. Fase C — Migrar `/admin/midias`
  - [x] 14.1 Refatorar `src/app/admin/midias/page.tsx`
    - `bg-zinc-50` em `<thead>` → `<THead>` (tokens).
    - `bg-zinc-100`/`bg-zinc-900` em placeholders → `bg-line` + `bg-foreground`.
    - Verified mark `text-emerald-600 ✓` → `<BadgeCheck className="h-3 w-3 text-success" />` (lucide).
    - Pública/Privada → `<Badge variant="success" | "muted">`.
    - Toggle grid/list → `<Tabs variant="pills">` ou `<ToggleChip>`.
    - _Requirements: 3.1, 3.7_

- [x] 15. Fase C — Migrar `/admin/financeiro`
  - [x] 15.1 Refatorar `src/app/admin/financeiro/page.tsx`
    - 3 tiles MRR + 3 tiles plano → `<KPICard>` (com `subtitle` "R$/mês").
    - Tabela assinantes → `<Table>` com `<TD numeric>` em valores.
    - Status → `<Badge variant>`.
    - _Requirements: 3.1, 3.7_

- [x] 16. Fase C — Migrar `/admin/suporte`
  - [x] 16.1 Refatorar `src/app/admin/suporte/page.tsx`
    - `statusClass` hardcoded (`bg-sky-100`, `bg-amber-100` etc.) → `<Badge variant={statusToBadgeVariant(...)}>`.
    - Lista tickets → `<Card variant="solid">` em grid OU `<Table>`.
    - _Requirements: 3.1, 3.7_

- [x] 17. Fase C — Migrar `/admin/verificacoes/[id]`
  - [x] 17.1 Refatorar `src/app/admin/verificacoes/[id]/page.tsx`
    - Painel "Aprovar" `bg-emerald-50 border-emerald-200` → `<Card variant="success-subtle">`.
    - Painel "Rejeitar" → `<Card variant="danger-subtle">`.
    - Botões `bg-emerald-600` → `<Button variant="primary">` (azul do sistema) — confirmar com user antes de codar caso queira variante `success` dedicada.
    - _Requirements: 3.1, 3.7_

- [x] 18. Fase C — Refatorar `admin-charts.tsx` para usar `chart-tokens`
  - [x] 18.1 Substituir hex literais em `src/components/admin/admin-charts.tsx`
    - Trocar `#1a1a1a`, `#e05c5c`, `#7c6af7`, `#e5e5e3` por `CHART_PALETTE.primary`, `.coral`, `.purple`, e `CHART_GRID_STROKE`.
    - `<ChartCard>` interno passa a usar `Card variant="solid" padding="md"` + título `text-xs font-medium text-muted mb-3`.
    - Adicionar fallback `<EmptyState>` quando `data.length === 0`.
    - _Requirements: 3.7, 5.5_

  - [x] 18.2 Teste unit do `ChartCard` e fallback de empty state
    - `src/components/admin/admin-charts.test.tsx` cobrindo render com data e fallback empty.
    - _Requirements: 3.7_

- [x] 19. Checkpoint — Fase C completa
  - Ensure all tests pass, ask the user if questions arise.

- [x] 20. Fase D — Revisão `/painel/*`
  - [x] 20.1 Auditar `src/app/painel/**/*.tsx` por classes Tailwind cruas
    - Grep `\b(bg|text|border)-(zinc|amber|sky|emerald|fuchsia|indigo|rose|pink|purple|teal|gray|neutral)-\d+\b`.
    - Listar arquivos afetados como pré-requisito antes de migrar.
    - _Requirements: 3.7_

  - [x] 20.2 Migrar painel pages remanescentes para primitivos
    - `/painel/financeiro`, `/painel/avaliacoes`, `/painel/midias`, `/painel/overview`, `/painel/valores`, `/painel/plano`, `/painel/disponibilidade`, `/painel/reels`, `/painel/stories`, `/painel/suporte`, `/painel/perfil`: substituir KPIs ad-hoc por `<KPICard>`, tabelas por `<Table>`, badges por variantes corretas.
    - Validar `PainelSidebar` pós-refactor da Fase B sem regressão.
    - _Requirements: 3.1, 3.7, 4.7_

- [x] 21. Fase E — Revisão de páginas públicas
  - [x] 21.1 Auditar páginas públicas alinhadas
    - Home, perfil público (`/p/[slug]`), descobrir, planos, em-alta, em-destaque, novidades, onboarding, cadastro, termos-de-uso, política-de-privacidade.
    - Garantir uso consistente de `Card`, `Badge`, `Button`, hairlines `border-black/[0.06]`.
    - Validar que `prefers-reduced-motion` neutraliza animações no banner age-gate e nas transições.
    - _Requirements: 2.2, 3.1, 4.3_

  - [x] 21.2 Aplicar correções pontuais identificadas na auditoria
    - Substituir qualquer cor crua remanescente, normalizar variantes de Card.
    - _Requirements: 3.7_

- [x] 22. Checkpoint — Fases D e E completas
  - Ensure all tests pass, ask the user if questions arise.

- [x] 23. Fase F — Lint guard contra cores cruas (Property 10)
  - [x] 23.1 Adicionar regra de lint banindo cores cruas Tailwind fora de `src/components/ui/` e `src/lib/chart-tokens.ts`
    - **Property 10: Nenhuma página fora de `src/components/ui/` ou `src/lib/chart-tokens.ts` usa classes Tailwind cruas de paleta**
    - **Validates: Requirements 3.7, 4.8**
    - Implementar como ESLint custom rule OU script `scripts/check-no-raw-palette.mjs` no CI usando regex `\b(bg|text|border|ring|from|to|via)-(zinc|amber|sky|emerald|fuchsia|indigo|rose|pink|purple|teal|lime|stone|slate|gray|neutral)-\d+\b`.
    - Plugar no script `lint` ou step de CI em `.github/workflows/ci.yml`.
    - Adicionar regra anti-`outline: none` sem ring substituto (Req 2.9).

  - [x] 23.2 Remover/substituir últimas ocorrências antes de ativar gate
    - Rodar a regra em modo report-only, corrigir matches restantes, então mover para `error`.
    - _Requirements: 3.7, 4.8_

- [x] 24. Fase F — Documentação `docs/design-system.md`
  - [x] 24.1 Criar `docs/design-system.md`
    - Princípios (calma, coral parcimonioso, glass discreto, movimento serve hierarquia, Inter exclusiva).
    - Tabela de tokens canônicos (cor, espaço, sombra, raio, easing).
    - Guia por componente (`Button`, `Badge`, `Card`, `Tabs`, `Table`, `KPICard`, `Input`, `Select`, etc.) com props, variantes e exemplos do/don't.
    - Mapa `status → Badge variant`.
    - Anti-patterns: cores cruas, bordas duras, glass agressivo, Inter alternativo.
    - Nota sobre `text-muted` ≥ 18px (large text AA).
    - _Requirements: 3.1, 3.7, 5.4_

  - [x] 24.2 Atualizar `CHANGELOG.md`
    - Entry para o redesign macOS system (tokens novos, primitivos novos, migração admin/painel, lint guard).
    - _Requirements: 4.1_

- [x] 25. Fase F — Validação final e gate de CI
  - [x] 25.1 Rodar pipeline completo localmente
    - `npm run lint && npm run test && npm run build`.
    - Conferir 0 lint problems, 305+ testes verdes, 0 erros TS, build OK (Req 4.1).
    - Conferir `coverage/coverage-summary.json` sem regressão.
    - _Requirements: 4.1_

  - [x] 25.2 Smoke E2E desktop em `/admin/moderacao`, `/admin/financeiro`, `/admin/perfis`
    - Playwright: páginas carregam, KPIs e tabelas renderizam, sem erro de console.
    - _Requirements: 4.6_

- [x] 26. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Sub-tasks marcadas com `*` são opcionais e podem ser puladas para um MVP rápido. Em particular: testes (unit, PBT, integration, E2E).
- Cada task referencia subcláusulas específicas dos requirements (não apenas a user story) para rastreabilidade.
- Checkpoints (8, 11, 19, 22, 26) garantem validação incremental — são pontos naturais para abrir PRs separados.
- Property-Based Tests cobrem propriedades universais (P2, P5, P7); examples e integration tests cobrem propriedades específicas (P1, P3, P4, P6, P8, P9); P10 é gate via lint estático na Fase F.
- A spec respeita as constraints permanentes do Req 5: zero alteração em `prisma/schema.prisma`, Inter como única fonte, coral `#ff375f` como accent, light-mode primário, Tailwind v4 mantido, sem novas dependências, textos pt-BR.
- Light mode é primário; dark mode é apenas infraestrutura opt-in. Nenhuma task adiciona toggle UI de tema.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.2", "2.3", "3.1", "3.3", "7.1", "9.1"] },
    { "id": 2, "tasks": ["3.2", "3.4", "4.1", "5.1", "6.1", "7.2", "7.3", "9.2"] },
    { "id": 3, "tasks": ["4.2", "4.3", "5.2", "6.2", "7.4", "9.3", "10.1"] },
    { "id": 4, "tasks": ["7.5", "7.6", "10.2", "12.1", "13.1", "14.1", "15.1", "16.1", "17.1", "18.1"] },
    { "id": 5, "tasks": ["12.2", "18.2", "20.1"] },
    { "id": 6, "tasks": ["20.2", "21.1"] },
    { "id": 7, "tasks": ["21.2", "23.1"] },
    { "id": 8, "tasks": ["23.2", "24.1"] },
    { "id": 9, "tasks": ["24.2", "25.1"] },
    { "id": 10, "tasks": ["25.2"] }
  ]
}
```
