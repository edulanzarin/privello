"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function DiscoverError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <ErrorState
            variant="page"
            title="Erro ao carregar"
            description="Não foi possível carregar os perfis desta cidade."
            onRetry={reset}
            digest={error.digest}
        />
    );
}
