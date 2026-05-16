/**
 * Preservation-test harness for `Property 2 - Non-Bug-Condition Interactions
 * Are Byte-Identical` (bugfix.md §3.1–3.5).
 *
 * ── Why a SEPARATE harness from `instrumentation.ts` ──
 *
 * The bug-condition harness in `./instrumentation.ts` installs a document-
 * level capture-phase `click` listener AND, on desktop control runs, a
 * full `Object.defineProperty(navigator, "clipboard", { get: () => stub })`
 * override. Both run inside `addInitScript`, which makes them run before
 * any app code (including React 19's hydration).
 *
 * The Task 1 counter-example log
 * (`tests/e2e/diagnostics/COUNTEREXAMPLES.md` — §"Note on the desktop-chrome
 * control") records that this combination measurably delays React 19's
 * microtask-driven post-click render on chromium past the 1–2s assertion
 * deadlines, producing FALSE counter-examples on desktop. That is fine for
 * the bug-condition test (its desktop run is a control, not a property),
 * but it is FATAL for preservation, where the test must pass on the
 * unfixed desktop code.
 *
 * Mitigations chosen here, and why:
 *   1. **No capture-phase click counter.** Preservation does not need
 *      click-routing diagnostics — the property is "the user-visible
 *      result is identical to today" — so we drop the counter entirely.
 *      This eliminates the first source of test-harness slowdown.
 *   2. **No `Object.defineProperty(navigator, "clipboard", …)` override.**
 *      Instead, for the clipboard preservation test we grant the real
 *      chromium clipboard permission via `context.grantPermissions`. The
 *      production code is then driven by the actual `navigator.clipboard`
 *      object the user would use in their browser, which is closer to
 *      "byte-identical to today" than any stub could be.
 *   3. **`navigator.share` is added by `Object.defineProperty(window.navigator,
 *      "share", { value, configurable: true, writable: true })` only.**
 *      Desktop chromium has `navigator.share === undefined`, so this is a
 *      property *addition*, not an override of an existing platform-defined
 *      accessor. It does not interfere with any existing getter/setter.
 *   4. **Generous deadlines (default 5s).** Desktop chromium routinely
 *      finishes a state-update-driven re-render in well under 200ms for the
 *      mounts under test (story viewer overlay, comments panel, share
 *      "Copiado!" feedback). 5s is comfortably above that ceiling without
 *      silently weakening the test — if a real preservation regression
 *      stalled the render past 5s, the property would still fail.
 *
 * Each preservation test documents which mitigation it uses inline so the
 * choice is auditable when we re-run the same tests against the fixed code.
 */

import type { BrowserContext, Page } from "@playwright/test";

export type ShareCall = { title?: string; url?: string; text?: string };

/**
 * Add a `navigator.share` stub to the page that records every call into
 * `window.__privelloShareCalls`. This is used by the desktop-chrome share
 * native-path preservation test only; iOS Safari preservation tests do
 * NOT install this (we want the real iOS Safari capability set there).
 *
 * Note: defineProperty is safe here because desktop chromium has
 * `navigator.share === undefined` — we are adding a new property on the
 * concrete `navigator` instance, not overriding an existing accessor.
 */
export async function installShareStub(context: BrowserContext): Promise<void> {
    await context.addInitScript(() => {
        const w = window as unknown as { __privelloShareCalls?: ShareCall[] };
        w.__privelloShareCalls = [];
        try {
            Object.defineProperty(window.navigator, "share", {
                configurable: true,
                writable: true,
                value: async (data: ShareCall) => {
                    (w.__privelloShareCalls as ShareCall[]).push({
                        title: data?.title,
                        url: data?.url,
                        text: data?.text,
                    });
                    return undefined;
                },
            });
        } catch {
            // If the platform froze navigator (older WebKit), the test
            // run will skip via the navigator.share === "undefined" check.
        }
    });
}

export async function readShareCalls(page: Page): Promise<ShareCall[]> {
    return page.evaluate(() => {
        const w = window as unknown as { __privelloShareCalls?: ShareCall[] };
        return w.__privelloShareCalls ?? [];
    });
}

/**
 * Grant the real chromium clipboard permissions for the share-button
 * clipboard-branch preservation test. We deliberately avoid stubbing
 * `navigator.clipboard` so the production code path runs against the
 * platform's real clipboard implementation — this is what users
 * experience today on desktop, and it is what we must preserve.
 */
export async function grantClipboardPermissions(context: BrowserContext): Promise<void> {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
}

export async function readClipboardText(page: Page): Promise<string | null> {
    try {
        return await page.evaluate(() => navigator.clipboard.readText());
    } catch {
        return null;
    }
}
