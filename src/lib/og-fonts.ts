/**
 * og-fonts.ts — fonts shared by every `opengraph-image.tsx`.
 *
 * Caminho: src/lib/og-fonts.ts
 *
 * Carrega Inter Bold + Regular via Google Fonts (resolvendo o CSS endpoint
 * para extrair a URL final do arquivo). O resultado é cacheado em memória
 * do processo e usado por `next/og` ImageResponse para renderizar cards
 * compartilháveis (OG / Twitter card).
 *
 * Por que via fetch e não arquivo local:
 * - Não temos `assets/Inter-*.ttf` no repo (Inter chega via `next/font` no client,
 *   formato woff2 não-Edge-compatível).
 * - `ImageResponse` cacheia o resultado da rota por padrão (file convention) — o
 *   fetch acontece uma vez por build/cold-start e nunca mais.
 *
 * Por que CSS endpoint vs URL hardcoded:
 * - URLs diretas em `fonts.gstatic.com` mudam de versão (`v20` → `v22` etc.)
 *   e quebram silenciosamente. O CSS endpoint sempre devolve a URL atual.
 * - O User-Agent é importante: sem UA "moderna", Google Fonts devolve TTF;
 *   com UA Chrome devolve WOFF2 (não suportado por Satori). Forçamos UA
 *   antigo pra obter TTF que é o formato seguro.
 *
 * Cf. https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
 */

/** Tamanho canônico Open Graph + Twitter Card "summary_large_image". */
export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png" as const;

type Weight = "regular" | "bold";

const WEIGHT_TO_NUMBER: Record<Weight, 400 | 700> = {
    regular: 400,
    bold: 700,
};

const fontCache = new Map<Weight, ArrayBuffer>();

/** Resolve a URL TTF atual de Inter para um peso via CSS endpoint do Google Fonts. */
async function resolveFontUrl(weight: Weight): Promise<string> {
    const cssRes = await fetch(
        `https://fonts.googleapis.com/css2?family=Inter:wght@${WEIGHT_TO_NUMBER[weight]}`,
        {
            // UA antigo força TTF (Satori/og não suporta WOFF2 com features novas).
            headers: { "User-Agent": "Mozilla/4.0" },
        },
    );
    if (!cssRes.ok) {
        throw new Error(`og-fonts: CSS endpoint failed (${cssRes.status})`);
    }
    const css = await cssRes.text();
    const match = css.match(/src:\s*url\((https:[^)]+\.ttf)\)/);
    if (!match) {
        throw new Error(`og-fonts: could not extract TTF URL from CSS`);
    }
    return match[1]!;
}

async function fetchFont(weight: Weight): Promise<ArrayBuffer> {
    const cached = fontCache.get(weight);
    if (cached) return cached;
    const url = await resolveFontUrl(weight);
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(
            `og-fonts: failed to fetch Inter ${weight} TTF (${res.status})`,
        );
    }
    const buf = await res.arrayBuffer();
    fontCache.set(weight, buf);
    return buf;
}

/**
 * Retorna array de fonts para `ImageResponse({ fonts })`. Nomes (`Inter`) e pesos
 * (400 / 700) batem com o que o JSX usa em `style={{ fontFamily: "Inter" }}`.
 */
export async function loadInterFonts(
    weights: ReadonlyArray<Weight> = ["regular", "bold"],
) {
    const data = await Promise.all(weights.map((w) => fetchFont(w)));
    return weights.map((w, i) => ({
        name: "Inter",
        data: data[i]!,
        weight: WEIGHT_TO_NUMBER[w],
        style: "normal" as const,
    }));
}

/**
 * Tokens de cor do Tahoe Sensual usados nos OG cards. Espelham `globals.css §3` —
 * `next/og` não suporta CSS variables nem oklch, então valores ficam aqui em hex.
 */
export const OG_TOKENS = {
    /** ink (`text-ink`) */
    ink: "#1a1517",
    /** ink-dim (`text-ink-dim`) */
    inkDim: "#6b5d63",
    /** ink-faint (`text-ink-faint`) */
    inkFaint: "#a89ba2",
    /** rose (`bg-rose`, marca) */
    rose: "#e85a7a",
    /** peach (boost ativo) */
    peach: "#f4a275",
    /** plum (premium) */
    plum: "#9c4474",
    /** cream (selo verificada) */
    cream: "#f1d9c0",
    /** off-white base (`--background-solid`) */
    surface: "#fdfcfb",
    /** hairline 8% sobre ink */
    line: "rgba(26,21,23,0.08)",
} as const;

/**
 * Background ambient gradient padrão (peach + rosa-empoeirado + dourado claro
 * sobre cream). Mesma fórmula de `body` em `globals.css`, traduzida pra hex porque
 * `next/og` não tem `oklch()`.
 */
export const OG_AMBIENT_BG =
    "radial-gradient(1200px 800px at 20% 0%, rgba(244,162,117,0.40), transparent 60%), " +
    "radial-gradient(900px 700px at 90% 30%, rgba(232,90,122,0.25), transparent 65%), " +
    "radial-gradient(1000px 600px at 50% 100%, rgba(244,210,165,0.30), transparent 70%), " +
    "#fdfcfb";
