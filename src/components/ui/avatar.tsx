import Image from "next/image";
import { cn } from "@/lib/utils";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface AvatarProps {
    src?: string | null;
    alt?: string;
    size?: AvatarSize;
    fallback?: string;
    className?: string;
    ring?: boolean;
    ringColor?: "coral" | "success" | "foreground" | "muted";
}

const sizeStyles: Record<AvatarSize, { container: string; text: string; imgSize: number }> = {
    xs: { container: "h-7 w-7", text: "text-2xs", imgSize: 28 },
    sm: { container: "h-9 w-9", text: "text-xs", imgSize: 36 },
    md: { container: "h-12 w-12", text: "text-sm", imgSize: 48 },
    lg: { container: "h-16 w-16", text: "text-lg", imgSize: 64 },
    xl: { container: "h-24 w-24", text: "text-2xl", imgSize: 96 },
};

const ringColors = {
    coral: "ring-coral",
    success: "ring-success",
    foreground: "ring-foreground",
    muted: "ring-line",
};

function getInitials(name?: string | null): string {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ src, alt, size = "md", fallback, className, ring, ringColor = "coral" }: AvatarProps) {
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
                <div className={cn("flex h-full w-full items-center justify-center bg-foreground/10 font-semibold text-foreground/60", s.text)}>
                    {getInitials(fallback || alt)}
                </div>
            )}
        </div>
    );
}
