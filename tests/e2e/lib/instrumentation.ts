import type { BrowserContext, Page, Request, Response } from "@playwright/test";

/**
 * Diagnostic data shape captured per interaction `kind`. This is the
 * counter-example payload we surface when the property test fails on
 * unfixed iOS Safari, used to discriminate among the five hypothesised
 * root causes from design.md.
 */
export type Diagnostics = {
    isSecureContext: boolean | null;
    userAgent: string;
    navigatorShare: "function" | "undefined" | "other";
    navigatorClipboardWriteText: "function" | "undefined" | "other";
    /** click-event counts captured by capture-phase listener, keyed by selector */
    clickCounts: Record<string, number>;
    /** Network responses captured for the relevant endpoints */
    network: Array<{
        url: string;
        method: string;
        status: number | null;
        ok: boolean;
        failureReason?: string;
    }>;
    /** Free-form notes (e.g. dropdown DOM state, results length, etc.) */
    notes: Record<string, unknown>;
};

const SELECTORS = {
    storyCircle: "story-circle",
    commentsTrigger: "comments-trigger",
    shareButton: "share-button",
    cityAutocompleteOption: "city-option",
} as const;

/**
 * Install a capture-phase document-level click counter and a navigator
 * capability inspector. We avoid touching production components: the
 * counter is purely observational, hooked at the document level so we
 * see every `click` event delivered to any descendant.
 *
 * The counter buckets clicks by a heuristic match on the target's chain
 * (we walk up the DOM looking for a recognisable selector).
 */
export async function installInstrumentation(
    context: BrowserContext,
    opts: { stubClipboardForDesktop?: boolean } = {},
) {
    await context.addInitScript(({ stubClipboardForDesktop, selectors }) => {
        const w = window as unknown as {
            __privelloDiag?: {
                clickCounts: Record<string, number>;
            };
        };
        if (!w.__privelloDiag) {
            w.__privelloDiag = { clickCounts: {} };
            const counts = w.__privelloDiag.clickCounts;
            counts[selectors.storyCircle] = 0;
            counts[selectors.commentsTrigger] = 0;
            counts[selectors.shareButton] = 0;
            counts[selectors.cityAutocompleteOption] = 0;

            // Capture-phase click counter. Walks the target chain to bucket the click.
            document.addEventListener(
                "click",
                (e) => {
                    let el: Element | null = e.target as Element | null;
                    while (el && el !== document.body) {
                        // Story circles row: a button inside `.scrollbar-hide` flex row
                        // We rely on the DOM structure of StoryBar (see story-bar.tsx).
                        // Heuristic: the story-circle <button> contains an Image with
                        // a 62px square wrapper.
                        if (
                            el instanceof HTMLElement &&
                            el.tagName === "BUTTON" &&
                            el.querySelector('[class*="rounded-full"][class*="h-[62px]"]')
                        ) {
                            counts[selectors.storyCircle] += 1;
                            return;
                        }
                        // Comments trigger: button containing the MessageCircle icon
                        // and a numeric sibling span (commentCount in reels-feed.tsx).
                        if (
                            el instanceof HTMLElement &&
                            el.tagName === "BUTTON" &&
                            el.querySelector('svg.lucide-message-circle, svg[class*="message-circle"]')
                        ) {
                            counts[selectors.commentsTrigger] += 1;
                            return;
                        }
                        // Share button: the only button with title "Compartilhar perfil"
                        if (
                            el instanceof HTMLElement &&
                            el.tagName === "BUTTON" &&
                            el.getAttribute("title") === "Compartilhar perfil"
                        ) {
                            counts[selectors.shareButton] += 1;
                            return;
                        }
                        // City autocomplete option: button inside <ul role implicit>
                        // child of the autocomplete container. Heuristic: button inside
                        // an <li> inside an absolute-positioned <ul> with a MapPin svg.
                        if (
                            el instanceof HTMLElement &&
                            el.tagName === "BUTTON" &&
                            el.parentElement?.tagName === "LI" &&
                            el.closest("ul")?.classList.contains("absolute")
                        ) {
                            counts[selectors.cityAutocompleteOption] += 1;
                            return;
                        }
                        el = el.parentElement;
                    }
                },
                true, // capture phase — see every click before app handlers can stop propagation
            );
        }

        // Optional clipboard stub (desktop Chrome control case). The bug
        // condition test does NOT install this on iOS Safari — that's the whole
        // point of running on a non-secure origin.
        if (stubClipboardForDesktop) {
            const stub = {
                writeText: async (_text: string) => {
                    // resolve immediately
                },
            } as Partial<Clipboard>;
            try {
                Object.defineProperty(navigator, "clipboard", {
                    configurable: true,
                    get: () => stub,
                });
            } catch {
                // some browsers freeze navigator; ignore — the un-stubbed value will be used
            }
        }
    }, { stubClipboardForDesktop: !!opts.stubClipboardForDesktop, selectors: SELECTORS });
}

export async function snapshotCapabilities(page: Page): Promise<{
    isSecureContext: boolean;
    userAgent: string;
    navigatorShare: Diagnostics["navigatorShare"];
    navigatorClipboardWriteText: Diagnostics["navigatorClipboardWriteText"];
}> {
    return page.evaluate(() => {
        const t = (v: unknown): "function" | "undefined" | "other" => {
            if (typeof v === "function") return "function";
            if (typeof v === "undefined") return "undefined";
            return "other";
        };
        return {
            isSecureContext: window.isSecureContext,
            userAgent: navigator.userAgent,
            navigatorShare: t((navigator as Navigator & { share?: unknown }).share),
            navigatorClipboardWriteText: t(
                (navigator as Navigator & { clipboard?: { writeText?: unknown } }).clipboard?.writeText,
            ),
        };
    });
}

export async function readClickCounts(page: Page): Promise<Record<string, number>> {
    return page.evaluate(() => {
        const w = window as unknown as { __privelloDiag?: { clickCounts: Record<string, number> } };
        return w.__privelloDiag?.clickCounts ?? {};
    });
}

/**
 * Attach network listeners for the endpoints we want to discriminate
 * hypothesis 5 (autocomplete network failure). Returns a stop-and-collect
 * function.
 */
export function attachNetworkRecorder(page: Page): () => Diagnostics["network"] {
    const events: Diagnostics["network"] = [];
    const seen = new Set<Request>();
    const matches = (url: string) =>
        url.includes("/api/cities") || url.includes("servicodados.ibge.gov.br");

    page.on("request", (req: Request) => {
        if (matches(req.url())) seen.add(req);
    });
    page.on("response", (res: Response) => {
        const req = res.request();
        if (!matches(req.url())) return;
        events.push({
            url: req.url(),
            method: req.method(),
            status: res.status(),
            ok: res.ok(),
        });
    });
    page.on("requestfailed", (req: Request) => {
        if (!matches(req.url())) return;
        events.push({
            url: req.url(),
            method: req.method(),
            status: null,
            ok: false,
            failureReason: req.failure()?.errorText ?? "unknown",
        });
    });

    return () => events;
}

export const SELECTOR_KEYS = SELECTORS;
