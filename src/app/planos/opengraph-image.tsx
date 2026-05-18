/**
 * Open Graph image — `/planos`.
 *
 * Caminho: src/app/planos/opengraph-image.tsx
 *
 * Card de pricing: 3 colunas (Essencial / Plus / Premium) com badge "ESCOLHIDO"
 * no Plus e CTA "Privello Assinante" no rodapé.
 */
import { ImageResponse } from "next/og";
import { OG_AMBIENT_BG, OG_SIZE, OG_TOKENS, loadInterFonts } from "@/lib/og-fonts";

export const alt = "Privello — Planos & preços";
export const size = OG_SIZE;
export const contentType = "image/png";

const PLANS = [
    { name: "Essencial", price: "Grátis", tone: "muted" as const },
    { name: "Plus", price: "R$ 19,90", tone: "ink" as const, highlighted: true },
    { name: "Premium", price: "R$ 39,90", tone: "rose" as const },
];

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
                    background: OG_AMBIENT_BG,
                    fontFamily: "Inter",
                    color: OG_TOKENS.ink,
                    padding: "60px 70px",
                    gap: 36,
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
                        Planos & preços
                    </div>
                </div>

                <div
                    style={{
                        fontSize: 72,
                        fontWeight: 700,
                        lineHeight: 1.05,
                        letterSpacing: "-0.04em",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <span>Comece grátis,</span>
                    <span style={{ color: OG_TOKENS.rose }}>ganhe destaque depois.</span>
                </div>

                <div style={{ display: "flex", gap: 18, marginTop: "auto" }}>
                    {PLANS.map((p) => (
                        <PlanCard
                            key={p.name}
                            name={p.name}
                            price={p.price}
                            tone={p.tone}
                            highlighted={p.highlighted ?? false}
                        />
                    ))}
                </div>
            </div>
        ),
        { ...size, fonts },
    );
}

function PlanCard({
    name,
    price,
    tone,
    highlighted,
}: {
    name: string;
    price: string;
    tone: "muted" | "ink" | "rose";
    highlighted: boolean;
}) {
    const tones = {
        muted: { bg: "#ffffff", border: OG_TOKENS.line, accent: OG_TOKENS.ink },
        ink: { bg: OG_TOKENS.ink, border: OG_TOKENS.ink, accent: "#ffffff" },
        rose: { bg: "#ffffff", border: OG_TOKENS.rose, accent: OG_TOKENS.rose },
    } as const;
    const t = tones[tone];
    const textColor = tone === "ink" ? "#ffffff" : OG_TOKENS.ink;
    const dimColor = tone === "ink" ? "rgba(255,255,255,0.65)" : OG_TOKENS.inkDim;

    return (
        <div
            style={{
                flex: 1,
                background: t.bg,
                border: `2px solid ${t.border}`,
                borderRadius: 24,
                padding: "32px 28px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                position: "relative",
                color: textColor,
                boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 12px 32px rgba(0,0,0,0.06)",
            }}
        >
            {highlighted ? (
                <div
                    style={{
                        position: "absolute",
                        top: -16,
                        right: 24,
                        background: OG_TOKENS.rose,
                        color: "#ffffff",
                        fontSize: 14,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        padding: "6px 14px",
                        borderRadius: 9999,
                    }}
                >
                    Mais escolhido
                </div>
            ) : null}
            <div
                style={{
                    fontSize: 16,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: dimColor,
                }}
            >
                {name}
            </div>
            <div
                style={{
                    fontSize: 50,
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                    color: t.accent,
                    fontVariantNumeric: "tabular-nums",
                }}
            >
                {price}
            </div>
            <div style={{ fontSize: 18, color: dimColor }}>
                {name === "Essencial"
                    ? "Cadastro + perfil público"
                    : name === "Plus"
                        ? "+ destaque rotativo"
                        : "+ topo permanente"}
            </div>
        </div>
    );
}
