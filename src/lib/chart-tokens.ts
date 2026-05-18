/**
 * Tokens visuais para charts (recharts) — v2 (Tahoe Sensual).
 *
 * Caminho: src/lib/chart-tokens.ts
 *
 * Centraliza a paleta e os estilos canônicos consumidos pelos componentes de
 * chart do admin (`src/components/admin/admin-charts.tsx`) e por qualquer
 * gráfico futuro. Aponta para tokens CSS v2 declarados em `globals.css`
 * (`:root` §3 do design-system steering), garantindo coerência com o restante
 * do design system Tahoe Sensual.
 *
 * Convenções:
 * - Strings `var(--*)` em vez de hex literais — recharts 3.x aceita variáveis
 *   CSS como `fill`/`stroke` em SVG, herdando do contexto.
 * - Objetos `as const` para preservar tipos literais e impedir mutação
 *   acidental.
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
 * - src/app/globals.css — declaração canônica dos tokens v2.
 * - src/components/admin/admin-charts.tsx — consumidor primário.
 * - .kiro/steering/design-system.md §3 (cor + glass).
 */

/**
 * Paleta canônica para séries em charts (v2 Tahoe Sensual).
 *
 * Cada chave aponta para um token CSS v2. Ordem de uso recomendada:
 *  - `primary` (rose) para a série dominante — ação/marca
 *  - `peach` para destaques pontuais (boost)
 *  - `plum` para premium/secundárias quentes
 *  - `info` / `success` / `warning` para categorias semânticas
 */
export const CHART_PALETTE = {
    /** Série dominante — rose (`#e85a7a`) */
    primary: "var(--rose)",
    /** Alias legado (`coral` mapeado pra `rose`); manter por compat */
    coral: "var(--rose)",
    /** Boost / quente */
    peach: "var(--peach)",
    /** Premium / accent secundário */
    purple: "var(--plum)",
    /** Categoria info */
    blue: "var(--info)",
    /** Sucesso */
    success: "var(--success)",
    /** Aviso */
    warning: "var(--warning)",
} as const;

/**
 * Stroke do grid (linhas de fundo) em charts. Mais sutil que `--line` (8%)
 * para não competir com as séries — usa 6%.
 */
export const CHART_GRID_STROKE = "var(--privello-chart-grid)";

/**
 * Cor preenchimento dos ticks (rótulos de eixo). `ink-dim` mantém contraste
 * AA em corpo de gráfico ≥ 12px.
 */
export const CHART_TICK_FILL = "var(--ink-dim)";

/**
 * Opacidade padrão para áreas em `<Area>`/`<AreaChart>`. Mantém a área
 * presente sem dominar a linha do topo.
 */
export const CHART_AREA_OPACITY = 0.12;

/**
 * Estilo inline para o `contentStyle` de `<Tooltip>` do recharts.
 *
 * recharts não aceita classes Tailwind no tooltip nativo, então o estilo
 * canônico fica aqui em formato CSS-in-JS — alinhado com a estética
 * `rounded-xl` + hairline + sombra suave do Tahoe Sensual.
 */
export const CHART_TOOLTIP_STYLE = {
    fontSize: 12,
    padding: "6px 10px",
    border: "0.5px solid var(--line)",
    borderRadius: 12,
    background: "#ffffff",
    boxShadow: "var(--shadow-sm)",
    color: "var(--ink)",
} as const;
