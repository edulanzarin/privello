/**
 * Tokens visuais para charts (recharts)
 *
 * Caminho: src/lib/chart-tokens.ts
 *
 * Centraliza a paleta e os estilos canônicos consumidos pelos componentes de
 * chart do admin (`src/components/admin/admin-charts.tsx`) e por qualquer
 * gráfico futuro. Todos os valores apontam para tokens CSS já declarados em
 * `:root` (ver `src/app/globals.css`), garantindo coerência com o restante do
 * design system macOS-inspired e permitindo trocar a paleta em um único ponto.
 *
 * Convenções:
 * - Strings `var(--privello-*)` em vez de hex literais — recharts 3.x aceita
 *   variáveis CSS como `fill`/`stroke` em SVG, herdando do contexto.
 * - Objetos `as const` para preservar tipos literais e impedir mutação
 *   acidental (`CHART_PALETTE.coral = "..."` falha em type-check).
 * - Sem dependência de runtime: módulo puro, importável por server e client
 *   components.
 *
 * Anti-patterns:
 * - Não inserir hex novos aqui. Se uma cor faltar, declarar primeiro o token
 *   em `globals.css` (`:root` + `@theme inline`) e mapear neste arquivo.
 * - Não consumir classes Tailwind cruas (`bg-emerald-500` etc.) em charts —
 *   recharts não interpreta classes, apenas valores SVG.
 *
 * Cross-refs:
 * - src/app/globals.css — declaração canônica dos tokens `--privello-*` e
 *   `--shadow-sm`.
 * - src/components/admin/admin-charts.tsx — consumidor primário.
 * - .kiro/specs/redesign-macos-system/design.md (seção 8) — origem dos valores.
 */

/**
 * Paleta canônica para séries em charts.
 *
 * Cada chave aponta para um token CSS `--privello-*`. A ordem reflete a
 * hierarquia de uso recomendada: `primary` para a série dominante (preto
 * Privello), `coral` apenas para destaques pontuais, demais para séries
 * secundárias e categorias semânticas (success/warning).
 */
export const CHART_PALETTE = {
    primary: "var(--privello-ink)", // #1d1d1f
    coral: "var(--privello-coral)", // #ff375f
    blue: "var(--privello-blue)", // #0a84ff
    purple: "var(--privello-accent-purple)", // #5856d6
    success: "var(--privello-green)", // #30d158
    warning: "var(--privello-warning)", // #ff9500
} as const;

/**
 * Stroke do grid (linhas de fundo) em charts. Mais sutil que `--privello-line`
 * para não competir com as séries.
 */
export const CHART_GRID_STROKE = "var(--privello-chart-grid)";

/**
 * Cor preenchimento dos ticks (rótulos de eixo). Usa o cinza médio da
 * paleta — mantém contraste AA em corpo de gráfico ≥ 12px.
 */
export const CHART_TICK_FILL = "var(--privello-muted)";

/**
 * Opacidade padrão para áreas em `<Area>`/`<AreaChart>`. Mantém a área
 * presente sem dominar a linha do topo.
 */
export const CHART_AREA_OPACITY = 0.08;

/**
 * Estilo inline para o `contentStyle` de `<Tooltip>` do recharts.
 *
 * recharts não aceita classes Tailwind no tooltip nativo, então o estilo
 * canônico fica aqui em formato CSS-in-JS — alinhado com a estética hairline
 * + sombra leve do design system.
 */
export const CHART_TOOLTIP_STYLE = {
    fontSize: 12,
    padding: "6px 10px",
    border: "0.5px solid var(--privello-line)",
    borderRadius: 8,
    background: "#ffffff",
    boxShadow: "var(--shadow-sm)",
} as const;
