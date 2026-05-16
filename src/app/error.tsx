"use client";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
            <div className="text-center">
                <p className="text-lg font-medium text-foreground">Algo deu errado</p>
                <p className="mt-1 text-base text-muted">
                    Ocorreu um erro inesperado. Tente novamente.
                </p>
            </div>
            <button
                onClick={reset}
                className="rounded-lg bg-foreground px-5 py-2.5 text-base font-medium text-white transition-opacity hover:opacity-90"
            >
                Tentar novamente
            </button>
        </div>
    );
}
