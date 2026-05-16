"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
    title: string;
    description?: string;
    onRetry: () => void;
    homeHref?: string;
    variant?: "inline" | "page";
    digest?: string;
    className?: string;
}

export function ErrorState({
    title,
    description,
    onRetry,
    homeHref,
    variant = "page",
    digest,
    className,
}: ErrorStateProps) {
    const isPage = variant === "page";
    return (
        <div
            role={isPage ? "alert" : "status"}
            aria-live={isPage ? "assertive" : "polite"}
            className={cn(
                "flex flex-col items-center justify-center gap-4 px-4 text-center",
                isPage ? "min-h-[60vh]" : "min-h-[20vh]",
                className,
            )}
        >
            <div>
                <p className="text-lg font-medium text-foreground">{title}</p>
                {description ? (
                    <p className="mt-1 text-md text-muted">{description}</p>
                ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                    type="button"
                    onClick={onRetry}
                    className="rounded-lg bg-foreground px-5 py-2.5 text-md font-medium text-white transition-opacity hover:opacity-90"
                >
                    Tentar novamente
                </button>
                {homeHref ? (
                    <Link
                        href={homeHref}
                        className="rounded-lg border border-black/[0.08] px-5 py-2.5 text-md font-medium text-foreground transition-colors hover:bg-black/[0.02]"
                    >
                        Voltar ao início
                    </Link>
                ) : null}
            </div>
            {isPage && digest ? (
                <p className="mt-2 text-2xs text-muted">ref: {digest}</p>
            ) : null}
        </div>
    );
}
