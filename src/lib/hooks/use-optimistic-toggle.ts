"use client";

import { useCallback, useOptimistic, useState, useTransition } from "react";

export interface UseOptimisticToggleOptions<T> {
    /** Valor inicial confirmado (server-side ou prop). */
    initialValue: T;
    /** Ação async — recebe o valor candidato e resolve com o valor confirmado pelo servidor. */
    action: (next: T) => Promise<T>;
    /** Handler chamado quando `action` rejeita; estado committed é preservado. */
    onError?: (err: Error) => void;
}

export interface UseOptimisticToggleReturn<T> {
    /** Valor exibido no UI (otimista durante a transition; committed após). */
    value: T;
    /** Valor confirmado pelo servidor — só muda em sucesso. */
    committed: T;
    /** Aplica o valor otimista e dispara `action(next)`. */
    toggle: (next: T) => void;
    /** True enquanto há transition em andamento. */
    pending: boolean;
}

/**
 * Hook genérico para UI otimista de toggle (curtir, favoritar, marcar visto).
 *
 * Em sucesso: `committed` recebe o valor retornado pela `action`.
 * Em erro: `committed` permanece inalterado, `onError` é chamado, e o valor
 * otimista é descartado automaticamente quando a transition encerra
 * (`useOptimistic` reverte para `committed`).
 *
 * Suporta sequências de toggles em fila — cada `toggle()` dispara uma transition
 * independente; o último sucesso vence.
 */
export function useOptimisticToggle<T>({
    initialValue,
    action,
    onError,
}: UseOptimisticToggleOptions<T>): UseOptimisticToggleReturn<T> {
    const [committed, setCommitted] = useState<T>(initialValue);
    const [optimistic, applyOptimistic] = useOptimistic<T, T>(
        committed,
        (_current, next) => next,
    );
    const [pending, startTransition] = useTransition();

    const toggle = useCallback(
        (next: T) => {
            startTransition(async () => {
                applyOptimistic(next);
                try {
                    const result = await action(next);
                    setCommitted(result);
                } catch (err) {
                    onError?.(err instanceof Error ? err : new Error(String(err)));
                    // committed permanece; useOptimistic descarta o valor após a transition.
                }
            });
        },
        [action, applyOptimistic, onError],
    );

    return {
        value: optimistic,
        committed,
        toggle,
        pending,
    };
}
