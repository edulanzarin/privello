/**
 * Utilitário puro para cálculo de razão de contraste WCAG 2.1.
 *
 * Implementa o algoritmo definido em WCAG 2.1, seções 1.4.3 (Contrast Minimum)
 * e Relative Luminance (https://www.w3.org/TR/WCAG21/#dfn-relative-luminance):
 *
 *   1. Cada canal sRGB é normalizado para o intervalo [0, 1].
 *   2. Linearização gamma: se c ≤ 0.03928, c_lin = c / 12.92,
 *      caso contrário c_lin = ((c + 0.055) / 1.055) ^ 2.4.
 *   3. Luminância relativa: L = 0.2126·R + 0.7152·G + 0.0722·B (canais lineares).
 *   4. Razão de contraste: (L1 + 0.05) / (L2 + 0.05), com L1 ≥ L2.
 *
 * O resultado é determinístico, simétrico (`contrastRatio(a, b) === contrastRatio(b, a)`)
 * e está sempre no intervalo [1, 21].
 *
 * Limiares WCAG 2.1 AA referenciados pelo design system:
 * - Texto regular  ≥ 4.5:1
 * - Texto grande   ≥ 3:1 (regular ≥ 18px ou bold ≥ 14px)
 *
 * @see Requirement 13 em `.kiro/specs/redesign-macos-system/requirements.md`
 */

/**
 * RGB normalizado (cada canal em [0, 1]).
 */
type RgbNormalized = readonly [r: number, g: number, b: number];

/**
 * Converte uma string hexadecimal de cor para RGB normalizado em [0, 1].
 *
 * Aceita as formas `#RRGGBB`, `#RGB` (forma curta de 3 dígitos), com ou sem
 * o prefixo `#`, em qualquer casing. Rejeita qualquer outra entrada.
 *
 * @param hex - Cor no formato hexadecimal (ex: `"#1d1d1f"`, `"#fff"`).
 * @returns Tripla `[r, g, b]` com cada canal em [0, 1].
 * @throws Se a string não for um hexadecimal válido de 3 ou 6 dígitos.
 */
function hexToRgbNormalized(hex: string): RgbNormalized {
    const cleaned = hex.trim().replace(/^#/, "");

    let full: string;
    if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
        full = cleaned;
    } else if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
        // Expande a forma curta `RGB` para `RRGGBB` duplicando cada dígito.
        full = cleaned
            .split("")
            .map((ch) => ch + ch)
            .join("");
    } else {
        throw new Error(
            `contrastRatio: cor hexadecimal inválida: ${JSON.stringify(hex)}`,
        );
    }

    const r = parseInt(full.slice(0, 2), 16) / 255;
    const g = parseInt(full.slice(2, 4), 16) / 255;
    const b = parseInt(full.slice(4, 6), 16) / 255;

    return [r, g, b] as const;
}

/**
 * Linearização gamma de um canal sRGB normalizado.
 *
 * Implementa a fórmula de WCAG 2.1: canais escuros (≤ 0.03928) ficam em
 * regime linear; canais mais claros entram em regime de potência 2.4.
 */
function linearizeChannel(channel: number): number {
    return channel <= 0.03928
        ? channel / 12.92
        : Math.pow((channel + 0.055) / 1.055, 2.4);
}

/**
 * Calcula a luminância relativa de uma cor sRGB normalizada,
 * conforme WCAG 2.1.
 *
 * Os pesos `0.2126 / 0.7152 / 0.0722` correspondem à resposta do olho humano
 * a cada componente (verde domina, azul é o mais fraco).
 */
function relativeLuminance([r, g, b]: RgbNormalized): number {
    const rl = linearizeChannel(r);
    const gl = linearizeChannel(g);
    const bl = linearizeChannel(b);
    return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

/**
 * Razão de contraste entre duas cores hexadecimais conforme WCAG 2.1.
 *
 * A função é pura, determinística e simétrica: a ordem dos argumentos não
 * altera o resultado (sempre divide a luminância maior pela menor).
 *
 * @param fg - Cor de primeiro plano (texto), em hexadecimal.
 * @param bg - Cor de fundo, em hexadecimal.
 * @returns Razão de contraste no intervalo [1, 21].
 * @throws Se qualquer um dos argumentos não for um hexadecimal válido.
 *
 * @example
 * contrastRatio("#000000", "#ffffff"); // 21
 * contrastRatio("#1d1d1f", "#f5f5f7"); // ≈ 16.7 (passa AA para texto regular)
 */
export function contrastRatio(fg: string, bg: string): number {
    const lFg = relativeLuminance(hexToRgbNormalized(fg));
    const lBg = relativeLuminance(hexToRgbNormalized(bg));

    const lighter = Math.max(lFg, lBg);
    const darker = Math.min(lFg, lBg);

    return (lighter + 0.05) / (darker + 0.05);
}
