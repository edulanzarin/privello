"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function ProfileError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <ErrorState
            variant="page"
            title="Perfil indisponível"
            description="Não foi possível carregar este perfil."
            onRetry={reset}
            homeHref="/"
            digest={error.digest}
        />
    );
}
