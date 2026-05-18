"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function PainelError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <ErrorState
            variant="page"
            title="Erro no painel"
            description="Não foi possível carregar esta página. Tente novamente."
            onRetry={reset}
            digest={error.digest}
        />
    );
}
