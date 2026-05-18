/**
 * Open Graph image — `/p/[slug]`.
 *
 * Caminho: src/app/p/[slug]/opengraph-image.tsx
 *
 * Card 1200×630 com nome do perfil em hero + selos de marca. Render via
 * `next/og` ImageResponse.
 *
 * **Dado mínimo**: só usamos o `slug` do path, derivando o display name por
 * humanização (`fulana-da-silva` → `Fulana da Silva`). Não consultamos Prisma
 * aqui — `next/og` em Next 16 + Turbopack roda em Edge runtime por padrão e
 * Prisma client é Node-only. Mostrar foto + idade + cidade exigiria fetch
 * HTTP interno e o trade-off de complexidade não compensa o ganho visual em
 * preview de link compartilhado.
 *
 * Se quisermos no futuro: criar endpoint `/api/og/profile/[slug]` que devolva
 * `{ name, age, city, coverDataUrl }` e consumir via `fetch()` aqui.
 */
import { ImageResponse } from "next/og";
import {
    OG_AMBIENT_BG,
    OG_SIZE,
    OG_TOKENS,
    loadInterFonts,
} from "@/lib/og-fonts";

export const alt = "Perfil — Privello";
export const size = OG_SIZE;
export const contentType = "image/png";

/** "fulana-da-silva" → "Fulana da Silva". */
function humanizeSlug(slug: string): string {
    const lower = new Set(["da", "de", "do", "das", "dos", "e"]);
    return slug
        .replace(/_/g, "-")
        .split("-")
        .filter(Boolean)
        .map((p, i) =>
            i > 0 && lower.has(p)
                ? p
                : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase(),
        )
        .join(" ");
}

export default async function OpengraphImage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const displayName = humanizeSlug(slug);
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
                        Perfil verificado
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div
                        style={{
                            fontSize: 26,
                            fontWeight: 600,
                            color: OG_TOKENS.inkDim,
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                        }}
                    >
                        Acompanhante
                    </div>
                    <div
                        style={{
                            display: "flex",
                            fontSize: 120,
                            fontWeight: 700,
                            lineHeight: 1.0,
                            letterSpacing: "-0.045em",
                        }}
                    >
                        {displayName}
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
                        text="Verificada"
                    />
                    <Pill
                        bg="rgba(77,155,110,0.12)"
                        color="#4d9b6e"
                        text="Fotos reais"
                    />
                    <Pill
                        bg="rgba(91,141,184,0.12)"
                        color="#5b8db8"
                        text="Áudio · vídeo"
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
                fontSize: 22,
                fontWeight: 600,
                padding: "10px 22px",
                borderRadius: 9999,
            }}
        >
            {text}
        </div>
    );
}
