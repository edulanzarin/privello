# Requirements Document

## Introduction

Este documento captura os requisitos do redesign do design language do Privello (inspiração macOS Sonoma, light mode, Inter, accent coral). Os requisitos são derivados do `design.md` aprovado e descrevem capacidades observáveis e invariantes verificáveis: tokens canônicos, primitivos novos (Tabs, Table, KPICard, DarkSidebarShell, chart-tokens), extensões de Badge/Card, refactor do AdminShell para sidebar, migração das páginas `/admin/*` (e revisão de `/painel/*` e públicas), garantias de acessibilidade (WCAG 2.1 AA), lint guard contra paleta crua e documentação do sistema.

Out of scope (ratificado no design): dark mode, troca de fonte, troca do accent, Storybook, troca de biblioteca de charts, mudanças em `prisma/schema.prisma`, i18n.

## Glossary

- **Design_System**: superfície agregada de tokens em `src/app/globals.css`, primitivos em `src/components/ui/*` e utilidades em `src/lib/*` que materializam o design language do Privello.
- **Tailwind**: pipeline `tailwindcss ^4` com mapeamento via `@theme inline` em `globals.css`.
- **Badge**: primitivo `src/components/ui/badge.tsx`.
- **Card**: primitivo `src/components/ui/card.tsx`.
- **Tabs**: primitivo a criar em `src/components/ui/tabs.tsx`.
- **Table**: primitivo a criar em `src/components/ui/table.tsx`, exportando `Table`, `THead`, `TR`, `TH`, `TD`.
- **KPICard**: primitivo a criar em `src/components/ui/kpi-card.tsx`.
- **DarkSidebarShell**: layout compartilhado a criar em `src/components/layout/dark-sidebar-shell.tsx`.
- **AdminShell**: shell em `src/components/admin/admin-shell.tsx` (refatorado para consumir DarkSidebarShell).
- **PainelSidebar**: shell em `src/components/painel/painel-sidebar.tsx` (refatorado para consumir DarkSidebarShell).
- **statusToBadgeVariant**: utilitário puro a criar em `src/lib/ui/status.ts` que mapeia status do domínio para variantes de Badge.
- **Chart_Tokens**: módulo a criar em `src/lib/chart-tokens.ts` exportando `CHART_PALETTE`, `CHART_GRID_STROKE`, `CHART_TICK_FILL`, `CHART_AREA_OPACITY`, `CHART_TOOLTIP_STYLE`.
- **Admin_Pages**: páginas em `src/app/admin/**/*.tsx`.
- **Painel_Pages**: páginas em `src/app/painel/**/*.tsx`.
- **Public_Pages**: páginas em `src/app/**/*.tsx` que não são `Admin_Pages` nem `Painel_Pages`.
- **Lint_Guard**: regra de lint OU script de CI que detecta uso de classes Tailwind de paleta crua fora de `src/components/ui/**` e `src/lib/chart-tokens.ts`.
- **BadgeVariant**: union type `"default" | "coral" | "success" | "warning" | "muted" | "dark" | "info" | "danger" | "premium"`.
- **CardVariant**: union type `"default" | "glass" | "solid" | "dark" | "success-subtle" | "warning-subtle" | "danger-subtle"`.
- **Cn**: helper `cn()` em `src/lib/utils` (combinação de `clsx` + `tailwind-merge`).
- **Documentation**: arquivo `docs/design-system.md` (a criar) e `CHANGELOG.md` (a atualizar).

## Requirements

### Requirement 1: Tokens canônicos do design system

**User Story:** Como desenvolvedor de UI, eu quero tokens canônicos definidos em `globals.css` e mapeados para Tailwind, para que possa construir componentes sem hardcodar cores ou sombras.

#### Acceptance Criteria

1. THE Design_System SHALL expor em `:root` os tokens canônicos existentes com os valores `--privello-cream: #f5f5f7`, `--privello-ink: #1d1d1f`, `--privello-muted: #86868b`, `--privello-line: #d2d2d7`, `--privello-coral: #ff375f`, `--privello-blue: #0a84ff`, `--privello-green: #30d158`, `--privello-warning: #ff9500`, `--privello-danger: #ff3b30` e `--privello-accent-purple: #5856d6`.
2. THE Design_System SHALL expor em `:root` os tokens novos `--privello-success-soft`, `--privello-warning-soft`, `--privello-danger-soft`, `--privello-info-soft`, `--privello-purple-soft`, `--privello-chart-grid`, `--shadow-hairline`, `--shadow-sm` e `--shadow-md` com valores documentados no design.
3. THE Tailwind SHALL expor utilitários equivalentes para os tokens novos via `@theme inline` (`bg-success-soft`, `bg-warning-soft`, `bg-danger-soft`, `bg-info-soft`, `bg-purple-soft`, `stroke-chart-grid`).
4. WHILE um documento HTML carrega `globals.css`, THE Design_System SHALL fazer com que `getComputedStyle(document.documentElement).getPropertyValue(token).trim()` retorne valor não-vazio para cada token canônico listado em 1 e 2.

### Requirement 2: Variantes de Badge para status do domínio

**User Story:** Como desenvolvedor de UI, eu quero variantes de Badge cobrindo todos os status do domínio, para que páginas não reimplementem mapas de cor inline.

#### Acceptance Criteria

1. THE Badge SHALL aceitar a prop `variant` com union `BadgeVariant`.
2. WHEN `variant="info"`, THE Badge SHALL aplicar classes `bg-info-soft` e `text-blue`.
3. WHEN `variant="danger"`, THE Badge SHALL aplicar classes `bg-danger-soft` e `text-danger`.
4. WHEN `variant="premium"`, THE Badge SHALL aplicar classes `bg-purple-soft` e `text-accent-purple`.
5. THE Badge SHALL preservar as variantes pré-existentes `default`, `coral`, `success`, `warning`, `muted` e `dark` sem alteração de classes.

### Requirement 3: Mapeador determinístico statusToBadgeVariant

**User Story:** Como desenvolvedor de UI, eu quero um único utilitário que mapeia status do domínio para `BadgeVariant`, para que `STATUS_COLORS` e `PLAN_COLORS` espalhados em páginas sejam eliminados.

#### Acceptance Criteria

1. THE statusToBadgeVariant SHALL aceitar uma `string` e retornar um valor pertencente ao tipo `BadgeVariant`.
2. WHEN o argumento pertence ao conjunto `{"NOVO", "OPEN"}`, THE statusToBadgeVariant SHALL retornar `"info"`.
3. WHEN o argumento pertence ao conjunto `{"REVISAO", "IN_PROGRESS", "pending"}`, THE statusToBadgeVariant SHALL retornar `"warning"`.
4. WHEN o argumento pertence ao conjunto `{"APROVADO", "verificado"}`, THE statusToBadgeVariant SHALL retornar `"success"`.
5. WHEN o argumento pertence ao conjunto `{"REJEITADO", "CLOSED", "cancelled"}`, THE statusToBadgeVariant SHALL retornar `"muted"`.
6. WHEN o argumento pertence ao conjunto `{"BANIDO", "SUSPENSO"}`, THE statusToBadgeVariant SHALL retornar `"danger"`.
7. WHEN o argumento é igual a `"PREMIUM"`, THE statusToBadgeVariant SHALL retornar `"premium"`.
8. WHEN o argumento é igual a `"DESTAQUE"`, THE statusToBadgeVariant SHALL retornar `"coral"`.
9. WHEN o argumento é igual a `"ESSENCIAL"`, THE statusToBadgeVariant SHALL retornar `"info"`.
10. IF o argumento não pertence a nenhum dos conjuntos cobertos por 2–9, THEN THE statusToBadgeVariant SHALL retornar `"muted"`.

### Requirement 4: Componente Tabs

**User Story:** Como desenvolvedor de UI, eu quero um primitivo Tabs reutilizável, para que `/admin/moderacao` (e qualquer página com sub-navegação) deixe de inlinear `<Link>` estilizado.

#### Acceptance Criteria

1. THE Tabs SHALL aceitar as props `items`, `activeKey`, `variant` (`"pills"` default ou `"underline"`), `size` (`"sm"` ou `"md"`), `onChange?` e `className?`.
2. THE Tabs SHALL renderizar exatamente um nó com atributo `role="tablist"`.
3. THE Tabs SHALL renderizar um nó com atributo `role="tab"` para cada elemento de `items`.
4. WHILE `activeKey` está presente em `items`, THE Tabs SHALL marcar exatamente um tab com `aria-selected="true"` (o de `key === activeKey`) e os demais com `aria-selected="false"`.
5. WHEN um item possui `href`, THE Tabs SHALL renderizar o tab como componente `Link` do Next.js e aplicar `aria-current="page"` quando o item é o ativo.
6. WHEN `onChange` é provido e o usuário aciona um tab inativo, THE Tabs SHALL invocar `onChange(key)` com a chave do tab acionado.
7. WHERE `variant="pills"`, THE Tabs SHALL aplicar fundo `bg-foreground text-white` no tab ativo e `text-muted hover:bg-black/[0.04]` nos inativos.
8. WHERE `variant="underline"`, THE Tabs SHALL aplicar uma linha de 2px na cor `coral` abaixo do tab ativo, sem fundo.
9. WHEN um item possui `badge` numérico, THE Tabs SHALL renderizar o número adjacente ao label do tab.

### Requirement 5: Componente Table

**User Story:** Como desenvolvedor de UI, eu quero um primitivo Table com cabeçalho, linhas e células padronizados, para que páginas administrativas deixem de reescrever `<table>` com classes cruas.

#### Acceptance Criteria

1. THE Table SHALL exportar `Table`, `THead`, `TR`, `TH`, `TD` a partir de `src/components/ui/table.tsx`.
2. THE Table SHALL renderizar wrapper com `overflow-x-auto` e `min-width` configurável via prop `minWidth` (default 640).
3. THE Table SHALL aplicar no `<thead>` as classes `border-b border-line` e nos `<th>` filhos `text-2xs font-semibold uppercase tracking-wider text-muted`.
4. WHILE a prop `hover` de TR é `true` ou ausente, THE Table SHALL aplicar `hover:bg-line/20` no `<tr>` correspondente.
5. WHEN a prop `numeric` de TD é `true`, THE Table SHALL aplicar simultaneamente as classes `tabular-nums` e `text-right` na célula.
6. WHEN a prop `numeric` de TD é falsy, THE Table SHALL não aplicar `tabular-nums` nem `text-right` na célula.
7. THE Table SHALL aplicar padding `px-3 py-2.5` em células de cabeçalho e `px-3 py-2` em células de corpo.

### Requirement 6: Componente KPICard

**User Story:** Como desenvolvedor de UI, eu quero um primitivo KPICard para tiles de dashboard, para que páginas como `/admin/moderacao` e `/admin/financeiro` parem de reimplementar `rounded border bg-white shadow-sm`.

#### Acceptance Criteria

1. THE KPICard SHALL aceitar as props `label`, `value`, `icon?`, `subtitle?`, `alert?`, `delta?`, `href?` e `className?`.
2. THE KPICard SHALL renderizar `label` em `text-2xs font-semibold uppercase tracking-wider text-muted` e `value` em `text-2xl font-semibold tabular-nums tracking-tight`.
3. WHEN `alert` é `true`, THE KPICard SHALL aplicar a classe `border-warning/40` na borda do tile e a classe `bg-warning-soft` no fundo, e quando há `icon`, aplicar `text-warning` no ícone.
4. WHEN `alert` é `false` ou ausente, THE KPICard SHALL aplicar borda hairline (`border-line` ou `border-black/[0.06]`) e quando há `icon`, aplicar `text-muted` no ícone.
5. WHEN `href` é provido, THE KPICard SHALL envolver o tile em um componente `Link` do Next.js com o destino `href`.
6. WHEN `delta` é provido, THE KPICard SHALL renderizar `delta.value` com indicação visual de direção (`up`, `down` ou `flat`).

### Requirement 7: Variantes subtle de Card

**User Story:** Como desenvolvedor de UI, eu quero variantes de Card para painéis de status discretos, para que `/admin/verificacoes/[id]` deixe de usar `bg-emerald-50 border-emerald-200`.

#### Acceptance Criteria

1. THE Card SHALL aceitar a prop `variant` com union `CardVariant`.
2. WHEN `variant="success-subtle"`, THE Card SHALL aplicar classes `bg-success-soft` e `border-success/30`.
3. WHEN `variant="warning-subtle"`, THE Card SHALL aplicar classes `bg-warning-soft` e `border-warning/30`.
4. WHEN `variant="danger-subtle"`, THE Card SHALL aplicar classes `bg-danger-soft` e `border-danger/30`.
5. THE Card SHALL preservar as variantes pré-existentes `default`, `glass`, `solid` e `dark` sem alteração de classes.

### Requirement 8: Tokens de chart e adoção em admin-charts

**User Story:** Como desenvolvedor de UI, eu quero uma paleta canônica de chart consumida pelos gráficos administrativos, para que recharts deixe de usar hex literais (`#1a1a1a`, `#e05c5c`, `#7c6af7`).

#### Acceptance Criteria

1. THE Chart_Tokens SHALL exportar uma constante `CHART_PALETTE` com as chaves `primary`, `coral`, `blue`, `purple`, `success` e `warning`, cada chave referenciando o token CSS correspondente via `var(--privello-*)`.
2. THE Chart_Tokens SHALL exportar `CHART_GRID_STROKE`, `CHART_TICK_FILL`, `CHART_AREA_OPACITY` e `CHART_TOOLTIP_STYLE` com os valores definidos no design.
3. THE `src/components/admin/admin-charts.tsx` SHALL referenciar séries, eixos, grid e tooltip exclusivamente via `Chart_Tokens`, sem hex literais.
4. THE Chart_Tokens SHALL renderizar fallback `<EmptyState>` na recipe `ChartCard` quando `data.length === 0`.

### Requirement 9: AdminShell adota o layout sidebar do Painel

**User Story:** Como administrador, eu quero a área `/admin` com a mesma sidebar lateral do `/painel`, para que a navegação seja consistente entre roles.

#### Acceptance Criteria

1. THE DarkSidebarShell SHALL aceitar as props `logoHref`, `nav`, `pathname`, `footer`, `children` e `contentClassName?`.
2. THE DarkSidebarShell SHALL renderizar em desktop um `<aside>` fixo com largura `w-56`, fundo `bg-sidebar` e texto `text-white`.
3. THE DarkSidebarShell SHALL renderizar em mobile um `<header>` de altura `h-14` com fundo `bg-sidebar` e um drawer com overlay backdrop blur.
4. THE PainelSidebar SHALL consumir DarkSidebarShell e preservar os mesmos itens de nav, status do plano e logout do estado atual.
5. THE AdminShell SHALL consumir DarkSidebarShell com `NAV_ADMIN` (Moderação, Suporte, Perfis, Mídias, Financeiro, Verificações).
6. WHILE um item de nav corresponde ao `pathname` corrente, THE DarkSidebarShell SHALL aplicar `aria-current="page"` no link correspondente.

### Requirement 10: Migração das páginas /admin/* para primitivos do sistema

**User Story:** Como mantenedor de UI, eu quero todas as páginas `/admin/*` consumindo somente primitivos do design system, para que o drift atual (paletas zinc/amber/sky/emerald cruas) seja eliminado.

#### Acceptance Criteria

1. THE `src/app/admin/moderacao/page.tsx` SHALL renderizar KPIs via `KPICard`, abas via `Tabs`, listagem via `Table`, status via `Badge` (mapeado por `statusToBadgeVariant`), ações via `Button` e busca via `Input`, sem classes Tailwind cruas de paleta.
2. THE `src/app/admin/perfis/page.tsx` SHALL renderizar filtros via `Input` e `Select`, ações via `Button`, listagem via `Table` e badges de plano via `Badge` (mapeado por `statusToBadgeVariant`).
3. THE `src/app/admin/midias/page.tsx` SHALL renderizar grids/listas via `Card` e `Table`, status público/privado via `Badge`, e remover toda ocorrência de `bg-zinc-*`, `bg-emerald-600`, `text-emerald-600` na superfície de página.
4. THE `src/app/admin/financeiro/page.tsx` SHALL renderizar tiles MRR e tiles por plano via `KPICard`, e a tabela de assinantes via `Table`.
5. THE `src/app/admin/suporte/page.tsx` SHALL renderizar status via `Badge` (mapeado por `statusToBadgeVariant`), e listagens via `Card` ou `Table`.
6. THE `src/app/admin/verificacoes/[id]/page.tsx` SHALL renderizar o painel de aprovação via `Card variant="success-subtle"`, o painel de rejeição via `Card variant="danger-subtle"`, e ações via `Button`, sem classes `bg-emerald-*` ou `border-emerald-*`.
7. IF um arquivo em `src/app/admin/**/*.tsx` contém uma classe Tailwind de paleta crua (regex `\b(bg|text|border|ring|from|to|via)-(zinc|amber|sky|emerald|fuchsia|indigo|rose|pink|purple|teal|lime|stone|slate|gray|neutral)-\d+\b`), THEN THE Lint_Guard SHALL falhar o pipeline de CI conforme Requirement 17.

### Requirement 11: Revisão de /painel/* e Public_Pages

**User Story:** Como mantenedor de UI, eu quero que `/painel/*` e páginas públicas estejam alinhadas aos tokens e primitivos, para que não haja drift residual após o redesign.

#### Acceptance Criteria

1. THE Painel_Pages SHALL renderizar tiles via `KPICard`, listagens tabulares via `Table` e status via `Badge` (mapeado por `statusToBadgeVariant`).
2. THE PainelSidebar refatorado SHALL preservar os itens de nav, badges, status do plano e mobile drawer existentes (sem regressão funcional).
3. THE Public_Pages SHALL renderizar superfícies via `Card`, status via `Badge` e ações via `Button`, sem classes Tailwind cruas de paleta.
4. WHEN o banner de age-gate é renderizado em Public_Pages, THE banner SHALL respeitar `prefers-reduced-motion: reduce` conforme Requirement 14.

### Requirement 12: Touch targets ≥ 44×44 em controles interativos

**User Story:** Como usuário com limitações motoras, eu quero que todos os controles interativos atendam ao alvo mínimo de toque WCAG 2.5.5, para que possa interagir com a aplicação sem dificuldade.

#### Acceptance Criteria

1. THE Button SHALL renderizar com `getBoundingClientRect().width ≥ 44` e `height ≥ 44` em todas as variantes e tamanhos (`sm`, `md`, `lg`).
2. THE Tabs SHALL renderizar cada item de tab com `getBoundingClientRect().width ≥ 44` e `height ≥ 44`.
3. THE DarkSidebarShell SHALL renderizar cada link de nav (desktop e drawer mobile) com `getBoundingClientRect().width ≥ 44` e `height ≥ 44`.
4. WHERE existe `IconButton` em qualquer página migrada, THE IconButton SHALL renderizar com `width ≥ 44` e `height ≥ 44`.

### Requirement 13: Contraste WCAG AA dos pares de tokens primários

**User Story:** Como usuário com baixa visão, eu quero que os pares texto/fundo do design system atendam a WCAG 2.1 AA, para que o conteúdo seja legível.

#### Acceptance Criteria

1. THE Design_System SHALL garantir que `text-foreground` (`#1d1d1f`) sobre `bg-background` (`#f5f5f7`) tenha razão de contraste ≥ 4.5:1.
2. THE Design_System SHALL garantir que `text-white` (`#ffffff`) sobre `bg-foreground` (`#1d1d1f`) tenha razão de contraste ≥ 4.5:1.
3. WHERE `text-coral` é aplicado em texto regular ≥ 18px ou texto bold ≥ 14px, THE Design_System SHALL garantir razão de contraste ≥ 4.5:1 sobre `bg-background`.
4. WHILE `text-muted` (`#86868b`) é utilizado, THE Documentation SHALL restringir seu uso a texto ≥ 18px (large text AA, ≥ 3:1 sobre `bg-background`).

### Requirement 14: prefers-reduced-motion neutraliza animações

**User Story:** Como usuário com preferência por menos movimento, eu quero que `prefers-reduced-motion: reduce` desligue animações e transições, para que a interface não cause desconforto.

#### Acceptance Criteria

1. WHEN `window.matchMedia("(prefers-reduced-motion: reduce)").matches` é `true`, THE Design_System SHALL fazer com que elementos com classes `.animate-fade-in` ou `.animate-scale-in` tenham `getComputedStyle(el).animationDuration` de no máximo `0.01ms`.
2. WHEN `prefers-reduced-motion: reduce` está ativo, THE Design_System SHALL fazer com que pseudo-elementos `::view-transition-old(*)` e `::view-transition-new(*)` tenham duração efetiva igual a `0s`.

### Requirement 15: Focus rings visíveis em primitivos interativos

**User Story:** Como usuário de teclado, eu quero focus rings visíveis em todos os controles interativos, para que possa navegar a aplicação sem mouse.

#### Acceptance Criteria

1. WHEN um Button recebe foco via teclado, THE Button SHALL aplicar classes `focus-visible:ring-2 focus-visible:ring-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background`.
2. WHEN um Input ou Select recebe foco via teclado, THE Design_System SHALL aplicar focus ring equivalente ao do Button.
3. WHEN um item de Tabs ou um link de nav da DarkSidebarShell recebe foco via teclado, THE Design_System SHALL aplicar focus ring equivalente ao do Button.

### Requirement 16: Determinismo de className em primitivos com variantes

**User Story:** Como desenvolvedor de UI, eu quero que builders de className em primitivos com variantes sejam determinísticos e idempotentes, para que renderizações repetidas produzam exatamente as mesmas classes.

#### Acceptance Criteria

1. WHEN `Cn` é invocado N vezes (N ≥ 2) com a mesma sequência de argumentos para um Badge, Tabs ou KPICard, THE Cn SHALL retornar exatamente a mesma string em todas as N chamadas.
2. THE Badge, Tabs e KPICard SHALL consolidar variantes condicionais via `Cn` de forma idempotente, isto é, `Cn(x)` e `Cn(x, x)` SHALL produzir strings semanticamente equivalentes (mesmas classes Tailwind aplicadas).

### Requirement 17: Lint guard contra classes Tailwind de paleta crua

**User Story:** Como mantenedor de UI, eu quero o pipeline de CI falhar quando classes Tailwind de paleta crua vazam para fora de `src/components/ui/**` e `src/lib/chart-tokens.ts`, para que o drift não ressurja após a migração.

#### Acceptance Criteria

1. THE Lint_Guard SHALL ser implementado como regra ESLint custom OU como script de grep executado em CI.
2. IF um arquivo em `src/app/**/*.tsx` ou `src/components/**/*.tsx` (excetuados `src/components/ui/**` e `src/lib/chart-tokens.ts`) contém match para a regex `\b(bg|text|border|ring|from|to|via)-(zinc|amber|sky|emerald|fuchsia|indigo|rose|pink|purple|teal|lime|stone|slate|gray|neutral)-\d+\b`, THEN THE Lint_Guard SHALL falhar com código de saída diferente de zero.
3. THE Lint_Guard SHALL ser executado pelo workflow `.github/workflows/ci.yml` em todo push e pull request.
4. WHERE o repositório contém um teste automatizado para o Lint_Guard, THE teste SHALL cobrir tanto um caso positivo (arquivo violador → falha) quanto um caso negativo (arquivo limpo → sucesso).

### Requirement 18: Documentação do design system

**User Story:** Como futuro mantenedor, eu quero um documento de referência do design language, para que decisões de uso e anti-patterns fiquem registrados.

#### Acceptance Criteria

1. THE Documentation SHALL prover o arquivo `docs/design-system.md`.
2. THE `docs/design-system.md` SHALL documentar princípios visuais, tokens canônicos (incluindo os novos do Requirement 1), guia por componente (Badge, Card, Tabs, Table, KPICard, DarkSidebarShell), anti-patterns e o mapeamento canônico status→variante consumido por `statusToBadgeVariant`.
3. THE `docs/design-system.md` SHALL conter ao menos um exemplo "do" e um exemplo "don't" para cada primitivo listado em 2.
4. THE `CHANGELOG.md` SHALL ser atualizado com uma entrada descrevendo o redesign, listando primitivos novos, tokens novos e a regra Lint_Guard.
