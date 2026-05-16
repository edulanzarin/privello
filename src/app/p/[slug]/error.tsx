"use client";

import Link from "next/link";

export default function ProfileError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
            <div className="text-center">
                <p className="text-lg font-medium text-foreground">Perfil indisponível</p>
                <p className="mt-1 text-base text-muted">
                    Não foi possível carregar este perfil.
                </p>
            </div>
            <div className="flex gap-3">
                <button
                    onClick={reset}
                    className="rounded-lg bg-foreground px-5 py-2.5 text-base font-medium text-white transition-opacity hover:opacity-90"
                >
                    Tentar novamente
                </button>
                <Link
                    href="/"
                    className="rounded-lg border border-black/[0.08] px-5 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-black/[0.02]"
                >
                    Voltar ao início
                </Link>
            </div>
        </div>
    );
}
