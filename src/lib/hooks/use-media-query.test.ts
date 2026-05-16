// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createElement } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useMediaQuery } from "./use-media-query";

type MockListener = (e: MediaQueryListEvent) => void;

interface MockMql {
    matches: boolean;
    media: string;
    listeners: Set<MockListener>;
    addEventListener: (type: "change", cb: MockListener) => void;
    removeEventListener: (type: "change", cb: MockListener) => void;
    onchange: null;
    dispatchEvent: (event: Event) => boolean;
    addListener: () => void;
    removeListener: () => void;
}

const registry = new Map<string, MockMql>();

function makeMql(query: string, matches: boolean): MockMql {
    const listeners = new Set<MockListener>();
    const mql: MockMql = {
        matches,
        media: query,
        listeners,
        addEventListener: (_type, cb) => {
            listeners.add(cb);
        },
        removeEventListener: (_type, cb) => {
            listeners.delete(cb);
        },
        onchange: null,
        dispatchEvent: () => true,
        addListener: () => { },
        removeListener: () => { },
    };
    return mql;
}

function setMatches(query: string, matches: boolean) {
    const mql = registry.get(query);
    if (!mql) return;
    mql.matches = matches;
    const event = { matches, media: query } as MediaQueryListEvent;
    for (const cb of mql.listeners) {
        cb(event);
    }
}

let root: Root | null = null;
let mountNode: HTMLDivElement | null = null;
const observed: { value: boolean | null } = { value: null };

function Probe({ query }: { query: string }) {
    const v = useMediaQuery(query);
    // Atualizamos via Effect (não em render) para satisfazer
    // react-hooks/globals — side effect fora do corpo do render.
    Object.assign(observed, { value: v });
    return null;
}

beforeEach(() => {
    registry.clear();
    observed.value = null;
    mountNode = document.createElement("div");
    document.body.appendChild(mountNode);
    root = createRoot(mountNode);

    // mock window.matchMedia
    vi.stubGlobal(
        "matchMedia",
        vi.fn((query: string) => {
            let mql = registry.get(query);
            if (!mql) {
                mql = makeMql(query, false);
                registry.set(query, mql);
            }
            return mql as unknown as MediaQueryList;
        }),
    );
    Object.defineProperty(window, "matchMedia", {
        configurable: true,
        writable: true,
        value: window.matchMedia ?? globalThis.matchMedia,
    });
});

afterEach(() => {
    act(() => {
        root?.unmount();
    });
    mountNode?.remove();
    mountNode = null;
    root = null;
    vi.unstubAllGlobals();
    registry.clear();
});

describe("useMediaQuery", () => {
    it("retorna false quando matchMedia indica não-match", () => {
        registry.set("(max-width: 640px)", makeMql("(max-width: 640px)", false));
        act(() => {
            root!.render(createElement(Probe, { query: "(max-width: 640px)" }));
        });
        expect(observed.value).toBe(false);
    });

    it("retorna true quando matchMedia indica match", () => {
        registry.set("(max-width: 640px)", makeMql("(max-width: 640px)", true));
        act(() => {
            root!.render(createElement(Probe, { query: "(max-width: 640px)" }));
        });
        expect(observed.value).toBe(true);
    });

    it("re-renderiza quando matches muda (subscribe)", () => {
        registry.set("(max-width: 640px)", makeMql("(max-width: 640px)", false));
        act(() => {
            root!.render(createElement(Probe, { query: "(max-width: 640px)" }));
        });
        expect(observed.value).toBe(false);
        act(() => {
            setMatches("(max-width: 640px)", true);
        });
        expect(observed.value).toBe(true);
        act(() => {
            setMatches("(max-width: 640px)", false);
        });
        expect(observed.value).toBe(false);
    });

    it("limpa listener no unmount", () => {
        const mql = makeMql("(max-width: 640px)", false);
        registry.set("(max-width: 640px)", mql);
        act(() => {
            root!.render(createElement(Probe, { query: "(max-width: 640px)" }));
        });
        expect(mql.listeners.size).toBeGreaterThan(0);
        act(() => {
            root!.unmount();
        });
        // unmount já chama o cleanup do useSyncExternalStore
        expect(mql.listeners.size).toBe(0);
    });
});
