"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <ErrorState
            variant="page"
            title="Algo deu errado"
            description="Ocorreu um erro inesperado. Tente novamente."
            onRetry={reset}
            digest={error.digest}
        />
    );
}
