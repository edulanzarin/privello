// @vitest-environment jsdom

/**
 * Property 1 — Rollback idempotente em `useOptimisticToggle`.
 *
 * **Validates: Requirements 5.1, 5.4, 5.5, 5.7**
 *
 * Para todo estado inicial `s0` ∈ boolean e toda sequência de toggles
 * `[(t_i, success_i)]` com i ∈ [1, k]:
 *
 *   committed_final = última posição com success_i === true
 *                     (ou s0 se nenhuma tiver sucesso)
 *   value_final     = committed_final
 *
 * Geradores: `fc.boolean()` para `s0`; `fc.array(fc.tuple(fc.boolean(), fc.boolean()))`
 * para sequência. Mock de `action` que resolve/rejeita conforme bit.
 *
 * `numRuns: 100` — default herdado de `fase-2-testes`.
 */

import { describe, beforeEach, afterEach, expect } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { createElement } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
    useOptimisticToggle,
    type UseOptimisticToggleReturn,
} from "./use-optimistic-toggle";

type Step = readonly [next: boolean, success: boolean];

let root: Root | null = null;
let mountNode: HTMLDivElement | null = null;

beforeEach(() => {
    mountNode = document.createElement("div");
    document.body.appendChild(mountNode);
    root = createRoot(mountNode);
});

afterEach(() => {
    act(() => {
        root?.unmount();
    });
    mountNode?.remove();
    mountNode = null;
    root = null;
});

function flushPromises(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

function Harness({
    initialValue,
    actionRef,
    capture,
}: {
    initialValue: boolean;
    actionRef: { current: (next: boolean) => Promise<boolean> };
    capture: (state: UseOptimisticToggleReturn<boolean>) => void;
}) {
    const state = useOptimisticToggle<boolean>({
        initialValue,
        action: (next) => actionRef.current(next),
    });
    capture(state);
    return null;
}

/**
 * Modelo de referência: aplica a mesma lógica que o hook deve seguir.
 * `committed` é o último `next` com sucesso; se nenhum, mantém `s0`.
 */
function expectedFinalCommitted(s0: boolean, steps: readonly Step[]): boolean {
    let committed = s0;
    for (const [next, success] of steps) {
        if (success) committed = next;
    }
    return committed;
}

describe("useOptimisticToggle — Property 1 (rollback idempotente)", () => {
    test.prop([
        fc.boolean(),
        fc.array(
            fc.tuple(fc.boolean(), fc.boolean()),
            { minLength: 1, maxLength: 10 },
        ),
    ], { numRuns: 100 })(
        "committed_final = último success; value_final = committed",
        async (s0, rawSteps) => {
            const steps = rawSteps as readonly Step[];
            const expected = expectedFinalCommitted(s0, steps);

            let last: UseOptimisticToggleReturn<boolean> | null = null;
            const actionRef = {
                current: async (_next: boolean) => _next,
            };

            await act(async () => {
                root!.render(
                    createElement(Harness, {
                        initialValue: s0,
                        actionRef,
                        capture: (s) => {
                            last = s;
                        },
                    }),
                );
            });

            for (const [next, success] of steps) {
                actionRef.current = async (n: boolean) => {
                    if (!success) throw new Error("action failed");
                    return n;
                };
                await act(async () => {
                    last!.toggle(next);
                    await flushPromises();
                });
            }

            expect(last!.committed).toBe(expected);
            expect(last!.value).toBe(expected);
            expect(last!.pending).toBe(false);
        },
    );
});
