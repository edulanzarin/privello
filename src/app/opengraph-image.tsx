/**
 * Open Graph image — Home (`/`).
 *
 * Caminho: src/app/opengraph-image.tsx
 * Next docs: app/opengraph-image
 *
 * Imagem 1200×630 em PNG renderizada com `next/og` ImageResponse. Mesmo
 * design language do site:
 *  - Background ambient pastel (peach/rose/dourado) sobre cream off-white.
 *  - Hero "privello." em Inter Bold tracking apertado.
 *  - Headline "Acompanhantes verificadas, perto de você." com acento rose
 *    no segmento final.
 *  - Footer com pílulas selo de verificada/online/cidades.
 *
 * Cacheado por padrão; só re-renderiza no build ou quando esse arquivo muda.
 */
import { ImageResponse } from "next/og";
import { OG_AMBIENT_BG, OG_SIZE, OG_TOKENS, loadInterFonts } from "@/lib/og-fonts";

export const alt = "Privello — Acompanhantes verificadas no Brasil";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OpengraphImage() {
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
                {/* Logo */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        fontSize: 36,
                        fontWeight: 700,
                        letterSpacing: "-0.025em",
                    }}
                >
                    privello
                    <span style={{ color: OG_TOKENS.rose }}>.</span>
                </div>

                {/* Headline */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 18,
                    }}
                >
                    <div
                        style={{
                            fontSize: 92,
                            fontWeight: 700,
                            lineHeight: 1.04,
                            letterSpacing: "-0.04em",
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        <span>Acompanhantes verificadas,</span>
                        <span style={{ color: OG_TOKENS.rose }}>perto de você.</span>
                    </div>
                    <div
                        style={{
                            fontSize: 26,
                            color: OG_TOKENS.inkDim,
                            maxWidth: 880,
                            lineHeight: 1.4,
                        }}
                    >
                        Fotos reais, áudio e vídeo · Identidade verificada · Diretório por cidade.
                    </div>
                </div>

                {/* Footer pills */}
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <Pill bg="rgba(232,90,122,0.12)" color={OG_TOKENS.rose} text="Identidade verificada" />
                    <Pill bg="rgba(77,155,110,0.12)" color="#4d9b6e" text="Online agora" />
                    <Pill bg="rgba(156,68,116,0.12)" color={OG_TOKENS.plum} text="+18 · Conteúdo adulto" />
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
