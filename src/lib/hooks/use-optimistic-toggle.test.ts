// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createElement } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
    useOptimisticToggle,
    type UseOptimisticToggleOptions,
    type UseOptimisticToggleReturn,
} from "./use-optimistic-toggle";

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

type Captured<T> = UseOptimisticToggleReturn<T>;

function Harness<T>({
    opts,
    capture,
}: {
    opts: UseOptimisticToggleOptions<T>;
    capture: (state: Captured<T>) => void;
}) {
    const state = useOptimisticToggle(opts);
    capture(state);
    return null;
}

function flushPromises(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("useOptimisticToggle — comportamento determinístico", () => {
    it("toggle com sucesso atualiza committed para o valor retornado pelo servidor", async () => {
        let last: Captured<boolean> | null = null;
        const action = vi.fn(async (next: boolean) => next);
        act(() => {
            root!.render(
                createElement(Harness<boolean>, {
                    opts: { initialValue: false, action },
                    capture: (s) => {
                        last = s;
                    },
                }),
            );
        });
        expect(last!.value).toBe(false);
        expect(last!.committed).toBe(false);

        await act(async () => {
            last!.toggle(true);
            await flushPromises();
        });

        expect(action).toHaveBeenCalledWith(true);
        expect(last!.committed).toBe(true);
        expect(last!.value).toBe(true);
        expect(last!.pending).toBe(false);
    });

    it("toggle com falha preserva committed e dispara onError", async () => {
        let last: Captured<boolean> | null = null;
        const onError = vi.fn();
        const action = vi.fn(async () => {
            throw new Error("network down");
        });
        act(() => {
            root!.render(
                createElement(Harness<boolean>, {
                    opts: { initialValue: false, action, onError },
                    capture: (s) => {
                        last = s;
                    },
                }),
            );
        });

        await act(async () => {
            last!.toggle(true);
            await flushPromises();
        });

        expect(action).toHaveBeenCalledWith(true);
        expect(last!.committed).toBe(false);
        expect(last!.value).toBe(false);
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
        expect((onError.mock.calls[0][0] as Error).message).toBe("network down");
    });

    it("converte rejeição não-Error em Error", async () => {
        let last: Captured<boolean> | null = null;
        const onError = vi.fn();
        const action = vi.fn(async () => {
            throw "string error";
        });
        act(() => {
            root!.render(
                createElement(Harness<boolean>, {
                    opts: { initialValue: false, action, onError },
                    capture: (s) => {
                        last = s;
                    },
                }),
            );
        });
        await act(async () => {
            last!.toggle(true);
            await flushPromises();
        });
        expect(onError).toHaveBeenCalled();
        expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    });

    it("sequência [success, fail] termina com committed = primeiro success, value = committed", async () => {
        let last: Captured<boolean> | null = null;
        const onError = vi.fn();
        let callIdx = 0;
        const action = vi.fn(async (next: boolean) => {
            const idx = callIdx++;
            if (idx === 1) throw new Error("falha 2");
            return next;
        });
        act(() => {
            root!.render(
                createElement(Harness<boolean>, {
                    opts: { initialValue: false, action, onError },
                    capture: (s) => {
                        last = s;
                    },
                }),
            );
        });

        await act(async () => {
            last!.toggle(true);
            await flushPromises();
        });
        expect(last!.committed).toBe(true);

        await act(async () => {
            last!.toggle(false);
            await flushPromises();
        });
        // O segundo toggle falhou; committed permanece em true.
        expect(last!.committed).toBe(true);
        expect(last!.value).toBe(true);
        expect(onError).toHaveBeenCalledTimes(1);
    });
});
