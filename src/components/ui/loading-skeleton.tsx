import { cn } from "@/lib/utils";

/**
 * Primitivo `LoadingSkeleton` — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/ui/loading-skeleton.tsx
 * Steering: `.kiro/steering/design-system.md` §3 + §7 (mídia).
 *
 * Skeleton placeholders para diferentes shapes de página. Cor base
 * `bg-line/60` (hairline + alpha) com `animate-pulse` discreto sobre o
 * ambient gradient.
 *
 * Variantes refletem os arquétipos de tela:
 *  - `card`: grid de ProfileCard 3:4 (listings, /descobrir, /em-alta).
 *  - `list`: linhas horizontais (admin lists, suporte).
 *  - `detail`: skeleton de página de perfil público (foto + meta + bio).
 *  - `form`: campos empilhados (cadastro, /entrar).
 *  - `gallery`: grid 1:1 (mídia do perfil).
 *  - `text-block`: parágrafos (legal, descrição).
 */

export type LoadingSkeletonVariant =
    | "card"
    | "list"
    | "detail"
    | "form"
    | "gallery"
    | "text-block";

export interface LoadingSkeletonProps {
    variant: LoadingSkeletonVariant;
    /** Quantidade de itens renderizados. Cada variante tem um default. */
    count?: number;
    className?: string;
    /** pt-BR; default "Carregando…" */
    ariaLabel?: string;
}

const DEFAULT_COUNTS: Record<LoadingSkeletonVariant, number> = {
    card: 9,
    list: 6,
    detail: 1,
    form: 5,
    gallery: 9,
    "text-block": 3,
};

// Placeholder canônico — hairline `bg-line` com pulse discreto.
const PLACEHOLDER = "animate-pulse rounded-xl bg-line/60";

function CardItem({ index }: { index: number }) {
    return (
        <div className="space-y-2" data-testid={`skeleton-card-${index}`}>
            <div className={cn(PLACEHOLDER, "aspect-[3/4] rounded-2xl")} />
            <div className={cn(PLACEHOLDER, "h-4 w-24 rounded-md")} />
            <div className={cn(PLACEHOLDER, "h-3 w-16 rounded-md")} />
        </div>
    );
}

function ListItem({ index }: { index: number }) {
    return (
        <div
            className={cn(PLACEHOLDER, "h-14 w-full rounded-2xl")}
            data-testid={`skeleton-list-${index}`}
        />
    );
}

function DetailItem({ index }: { index: number }) {
    return (
        <div className="space-y-4" data-testid={`skeleton-detail-${index}`}>
            <div className={cn(PLACEHOLDER, "aspect-[4/5] w-full rounded-2xl")} />
            <div className="space-y-2">
                <div className={cn(PLACEHOLDER, "h-7 w-40 rounded-md")} />
                <div className={cn(PLACEHOLDER, "h-4 w-64 rounded-md")} />
                <div className={cn(PLACEHOLDER, "h-4 w-32 rounded-md")} />
            </div>
            <div className="space-y-1.5">
                <div className={cn(PLACEHOLDER, "h-3.5 w-full rounded-md")} />
                <div className={cn(PLACEHOLDER, "h-3.5 w-full rounded-md")} />
                <div className={cn(PLACEHOLDER, "h-3.5 w-3/4 rounded-md")} />
            </div>
        </div>
    );
}

function FormItem({ index }: { index: number }) {
    return (
        <div className="space-y-2" data-testid={`skeleton-form-${index}`}>
            <div className={cn(PLACEHOLDER, "h-3 w-24 rounded-md")} />
            <div className={cn(PLACEHOLDER, "h-11 w-full rounded-xl")} />
        </div>
    );
}

function GalleryItem({ index }: { index: number }) {
    return (
        <div
            className={cn(PLACEHOLDER, "aspect-square rounded-lg")}
            data-testid={`skeleton-gallery-${index}`}
        />
    );
}

function TextBlockItem({ index }: { index: number }) {
    return (
        <div className="space-y-1.5" data-testid={`skeleton-text-${index}`}>
            <div className={cn(PLACEHOLDER, "h-3.5 w-full rounded-md")} />
            <div className={cn(PLACEHOLDER, "h-3.5 w-full rounded-md")} />
            <div className={cn(PLACEHOLDER, "h-3.5 w-3/4 rounded-md")} />
        </div>
    );
}

export function LoadingSkeleton({
    variant,
    count,
    className,
    ariaLabel,
}: LoadingSkeletonProps) {
    const items = count ?? DEFAULT_COUNTS[variant];

    let containerClass = "space-y-4 p-4";
    let renderItem: (i: number) => React.ReactNode;

    switch (variant) {
        case "card":
            containerClass = "grid grid-cols-1 gap-5 p-4 md:grid-cols-2 lg:grid-cols-3";
            renderItem = (i) => <CardItem key={i} index={i} />;
            break;
        case "list":
            containerClass = "space-y-2 p-4";
            renderItem = (i) => <ListItem key={i} index={i} />;
            break;
        case "detail":
            containerClass = "mx-auto max-w-4xl space-y-4 p-4";
            renderItem = (i) => <DetailItem key={i} index={i} />;
            break;
        case "form":
            containerClass = "mx-auto max-w-2xl space-y-4 p-4";
            renderItem = (i) => <FormItem key={i} index={i} />;
            break;
        case "gallery":
            containerClass = "grid grid-cols-3 gap-1 p-4";
            renderItem = (i) => <GalleryItem key={i} index={i} />;
            break;
        case "text-block":
            containerClass = "space-y-4 p-4";
            renderItem = (i) => <TextBlockItem key={i} index={i} />;
            break;
        default: {
            const _exhaustive: never = variant;
            void _exhaustive;
            renderItem = () => null;
        }
    }

    return (
        <div
            role="status"
            aria-busy="true"
            aria-label={ariaLabel ?? "Carregando…"}
            data-variant={variant}
            className={cn(containerClass, className)}
        >
            {Array.from({ length: items }).map((_, i) => renderItem(i))}
        </div>
    );
}
