/**
 * Open Graph image — `/descobrir/[citySlug]`.
 *
 * Caminho: src/app/descobrir/[citySlug]/opengraph-image.tsx
 *
 * Card dinâmico por cidade: "Acompanhantes em <Cidade>." em hero grande +
 * selos de marca. Render via `next/og` ImageResponse.
 *
 * **Dado mínimo**: só usamos `citySlug` do path, derivando o display name
 * por humanização do slug. Não consultamos Prisma aqui — `next/og` em
 * Next 16 + Turbopack roda em Edge runtime por padrão e Prisma client é
 * Node-only. Adicionar contadores via DB exigiria fetch HTTP interno e o
 * trade-off de complexidade não compensa o ganho visual.
 */
import { ImageResponse } from "next/og";
import {
    OG_AMBIENT_BG,
    OG_SIZE,
    OG_TOKENS,
    loadInterFonts,
} from "@/lib/og-fonts";

export const alt = "Acompanhantes verificadas — Privello";
export const size = OG_SIZE;
export const contentType = "image/png";

/**
 * Humaniza um citySlug ("sao-paulo-sp") para um display name
 * ("São Paulo, SP"). Heurística:
 *  - Underscores e hífens viram espaços.
 *  - Última palavra com 2 letras → uppercase (UF: SP, RJ, MG…).
 *  - Resto em title case.
 */
function humanizeCitySlug(slug: string): string {
    const parts = slug.replace(/_/g, "-").split("-").filter(Boolean);
    if (parts.length === 0) return "Brasil";
    const lastIndex = parts.length - 1;
    return parts
        .map((p, i) => {
            if (i === lastIndex && p.length === 2) return p.toUpperCase();
            return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
        })
        .join(" ")
        .replace(/(\w) (\w{2})$/, "$1, $2"); // "São Paulo SP" → "São Paulo, SP"
}

export default async function OpengraphImage({
    params,
}: {
    params: Promise<{ citySlug: string }>;
}) {
    const { citySlug } = await params;
    const cityName = humanizeCitySlug(citySlug);
    const fonts = await loadInterFonts(["regular", "bold"]);

    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    background: OG_AMBIENT_BG,
                    padding: "72px 80px",
                    fontFamily: "Inter",
                    color: OG_TOKENS.ink,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            fontSize: 32,
                            fontWeight: 700,
                            letterSpacing: "-0.025em",
                        }}
                    >
                        privello
                        <span style={{ color: OG_TOKENS.rose }}>.</span>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            background: "rgba(232,90,122,0.12)",
                            color: OG_TOKENS.rose,
                            fontSize: 18,
                            fontWeight: 600,
                            padding: "8px 18px",
                            borderRadius: 9999,
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                        }}
                    >
                        Diretório · cidade
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    <div
                        style={{
                            fontSize: 30,
                            fontWeight: 600,
                            color: OG_TOKENS.inkDim,
                            letterSpacing: "-0.011em",
                        }}
                    >
                        Acompanhantes em
                    </div>
                    <div
                        style={{
                            display: "flex",
                            fontSize: 110,
                            fontWeight: 700,
                            lineHeight: 1.0,
                            letterSpacing: "-0.045em",
                        }}
                    >
                        {cityName}
                        <span style={{ color: OG_TOKENS.rose }}>.</span>
                    </div>
                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                    }}
                >
                    <Pill
                        bg="rgba(232,90,122,0.12)"
                        color={OG_TOKENS.rose}
                        text="Identidade verificada"
                    />
                    <Pill
                        bg="rgba(77,155,110,0.12)"
                        color="#4d9b6e"
                        text="Online agora"
                    />
                    <Pill
                        bg="rgba(244,162,117,0.16)"
                        color={OG_TOKENS.peach}
                        text="Fotos reais · áudio · vídeo"
                    />
                </div>
            </div>
        ),
        { ...size, fonts },
    );
}

function Pill({ bg, color, text }: { bg: string; color: string; text: string }) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                background: bg,
                color,
                fontSize: 20,
                fontWeight: 600,
                padding: "10px 20px",
                borderRadius: 9999,
            }}
        >
            {text}
        </div>
    );
}
