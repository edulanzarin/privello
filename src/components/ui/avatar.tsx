import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Primitivo `Avatar` — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/ui/avatar.tsx
 * Steering: `.kiro/steering/design-system.md` §3 + §7 (mídia).
 *
 * Avatar circular com fallback de iniciais. Suporta ring colorido para
 * indicar estado (online, verificada). Aspect ratio fixo `1/1`.
 *
 * Sizes: `xs` 28px → `xl` 96px. Cada size mantém touch-target adequado
 * quando usado em link clicável (envolva em `<Link>` com padding).
 */

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface AvatarProps {
    src?: string | null;
    alt?: string;
    size?: AvatarSize;
    fallback?: string;
    className?: string;
    ring?: boolean;
    /**
     * Cor do ring quando `ring={true}`.
     * `coral` é alias legado de `rose` (compat com call-sites pré-v2).
     */
    ringColor?: "rose" | "success" | "ink" | "muted" | "cream" | "coral";
}

const sizeStyles: Record<AvatarSize, { container: string; text: string; imgSize: number }> = {
    xs: { container: "h-7 w-7", text: "text-2xs", imgSize: 28 },
    sm: { container: "h-9 w-9", text: "text-xs", imgSize: 36 },
    md: { container: "h-12 w-12", text: "text-sm", imgSize: 48 },
    lg: { container: "h-16 w-16", text: "text-lg", imgSize: 64 },
    xl: { container: "h-24 w-24", text: "text-2xl", imgSize: 96 },
};

const ringColors = {
    rose: "ring-rose",
    success: "ring-success",
    ink: "ring-ink",
    muted: "ring-line",
    cream: "ring-cream",
    /** alias legado de `rose`. Não use em código novo. */
    coral: "ring-rose",
};

function getInitials(name?: string | null): string {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
    src,
    alt,
    size = "md",
    fallback,
    className,
    ring,
    ringColor = "rose",
}: AvatarProps) {
    const s = sizeStyles[size];

    return (
        <div
            className={cn(
                "relative shrink-0 overflow-hidden rounded-full bg-line",
                s.container,
                ring && `ring-2 ring-offset-2 ring-offset-background ${ringColors[ringColor]}`,
                className,
            )}
        >
            {src ? (
                <Image
                    src={src}
                    alt={alt || ""}
                    width={s.imgSize}
                    height={s.imgSize}
                    className="h-full w-full object-cover"
                />
            ) : (
                <div
                    className={cn(
                        "flex h-full w-full items-center justify-center bg-ink/10 font-semibold text-ink/60",
                        s.text,
                    )}
                >
                    {getInitials(fallback || alt)}
                </div>
            )}
        </div>
    );
}
