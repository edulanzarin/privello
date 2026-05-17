/**
 * Property 2: Preservation — Non-Bug-Condition Interactions Are Byte-Identical
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 *
 * GOAL (per task 2): Capture, on the UNFIXED code, the observable result of
 * every interaction where `isBugCondition` is FALSE, then re-run the same
 * tests after the fix and assert the post-fix observation matches.
 *
 * Per the design (`design.md` §"Preservation Checking"):
 *   - Desktop browsers continue to behave exactly as today.
 *   - iOS Safari behaves exactly as today on every interaction OTHER than
 *     the four listed touch points.
 *   - iOS Safari over a SECURE context continues to use the existing
 *     native paths.
 *
 * ── Test-harness choice ──
 *
 * Per `tests/e2e/diagnostics/COUNTEREXAMPLES.md` §"Note on the desktop-chrome
 * control", the bug-condition harness's capture-phase `click` listener and
 * `Object.defineProperty(navigator, "clipboard", …)` override slow React 19's
 * post-click render past the 1–2s deadlines used by Property 1. That is fine
 * for the bug-condition control case but FATAL for preservation, which must
 * pass on unfixed desktop code.
 *
 * Mitigation chosen: this spec uses a SEPARATE harness
 * (`./lib/preservation-harness.ts`) that
 *   (a) does NOT install a capture-phase click counter (it is unnecessary
 *       — preservation does not need click-routing diagnostics),
 *   (b) does NOT override `navigator.clipboard`; instead, the clipboard
 *       branch test grants real chromium clipboard permissions and reads
 *       the actual platform clipboard,
 *   (c) installs `navigator.share` only as a NEW writable, configurable
 *       property on chromium (where `navigator.share` is otherwise
 *       undefined), avoiding any interference with an existing platform
 *       accessor, and
 *   (d) uses generous (default 5s) deadlines that are far above the ~200ms
 *       observed render budget for the mounts under test, but well below
 *       any threshold a real regression would silently slip past.
 *
 * Each test documents the choice inline.
 *
 * ── Property scoping ──
 *
 * The design's preservation properties are universally quantified over the
 * full input domain. We scope them to representative samples per `design.md`
 * §"Test Plan / Test Cases" — that is exactly the same scoping the
 * bug-condition spec uses (one concrete payload per `kind`). For the
 * autocomplete-merge property we additionally generate a small batch of
 * random query strings and assert the merge invariant on each, to satisfy
 * task 2's "small batch of property samples" wording.
 */

import {
    test,
    expect,
    type BrowserContext,
    type Locator,
    type Page,
    type TestInfo,
} from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";
import {
    grantClipboardPermissions,
    installShareStub,
    readClipboardText,
    readShareCalls,
} from "./lib/preservation-harness";

const FIXTURE_PROFILE_SLUG = process.env.E2E_PROFILE_SLUG ?? "helena";
const FIXTURE_CITY_PATH = process.env.E2E_STORY_PATH ?? "/descobrir/sao-paulo-sp";

const SNAPSHOT_DIR = path.join(__dirname, "diagnostics", "preservation");
function snapshotPath(name: string, project: string) {
    return path.join(SNAPSHOT_DIR, `${project}__${name}.json`);
}

type Snapshot = Record<string, unknown>;

/**
 * Persist a snapshot under `tests/e2e/diagnostics/preservation/`.
 * On the unfixed-code run this writes the baseline. On the fixed-code
 * re-run (task 3.6) the same persistence overwrites the baseline; the
 * equality oracle is the in-process comparison the test asserts inline,
 * not the file-on-disk diff (which would couple the test to file order).
 */
function persistSnapshot(testInfo: TestInfo, name: string, snap: Snapshot) {
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
    fs.writeFileSync(
        snapshotPath(name, testInfo.project.name),
        JSON.stringify(snap, null, 2),
    );
}

function readBaseline(testInfo: TestInfo, name: string): Snapshot | null {
    const p = snapshotPath(name, testInfo.project.name);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf-8"));
}

function userActivate(locator: Locator, testInfo: TestInfo): Promise<void> {
    return testInfo.project.name === "ios-safari" ? locator.tap() : locator.click();
}

/**
 * Wait briefly for a `navigator.clipboard.readText`-able value. We poll
 * because chromium's clipboard write is async on some channels.
 */
async function waitForClipboardText(page: Page, expected: string, deadlineMs = 2_000): Promise<string | null> {
    const stop = Date.now() + deadlineMs;
    while (Date.now() < stop) {
        const t = await readClipboardText(page);
        if (t === expected) return t;
        await page.waitForTimeout(50);
    }
    return await readClipboardText(page);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3.1 — Desktop Chrome — city autocomplete merge property (preservation)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Property: for any query string of length >= 2 that hits at least one
 * cached city, the rendered options on desktop equal
 * `merge(localMatches, ibgeMatches)[0..8]` with local first, IBGE second,
 * dedup by slug, capped at 8.
 *
 * We discharge this scoped to a small batch of representative queries.
 * This corresponds to the design's autocomplete-merge property under
 * "Property-Based Tests".
 */
test.describe("Preservation 3.1 — desktop city autocomplete still shows suggestions", () => {
    test.beforeEach(({ }, testInfo) => {
        test.skip(
            testInfo.project.name !== "desktop-chrome",
            "preservation 3.1 only runs on desktop-chrome",
        );
    });

    const QUERIES = ["São P", "Rio", "Belo H", "Curitib"];

    for (const q of QUERIES) {
        test(`renders dropdown options for query "${q}"`, async ({ page }, testInfo) => {
            // /buscar foi consolidada em /descobrir em 2026-05-17.
            await page.goto("/descobrir", { waitUntil: "domcontentloaded" });

            // Wait for the IBGE prewarm so the first query doesn't race.
            await Promise.race([
                page.waitForResponse(
                    (r) =>
                        r.url().includes("servicodados.ibge.gov.br/api/v1/localidades/municipios") &&
                        r.ok(),
                    { timeout: 8_000 },
                ).catch(() => null),
                page.waitForTimeout(8_000),
            ]);

            const input = page
                .locator(
                    'input[placeholder*="Cidade"], input[placeholder*="Trocar cidade"], input[placeholder*="Ex: São Paulo"]',
                )
                .first();
            await expect(input).toBeVisible({ timeout: 10_000 });
            await input.click();
            await input.fill("");
            await input.type(q, { delay: 60 });

            // Wait for at least one option to appear OR a confident miss
            // (the design says queries that match nothing should not open
            // the dropdown). We assert the visible-with-options branch
            // for these representative queries which all match cached cities.
            const optionsLi = page.locator('ul[class*="absolute"] > li, ul[role="listbox"] > li');
            await expect(optionsLi.first()).toBeVisible({ timeout: 5_000 });

            // Read the rendered option labels in order.
            const labels = await page.evaluate(() => {
                const ul = document.querySelector(
                    'ul[role="listbox"], ul[class*="absolute"]',
                );
                if (!ul) return [] as string[];
                return Array.from(ul.querySelectorAll("li > button")).map((b) =>
                    (b.textContent ?? "").trim().replace(/\s+/g, " "),
                );
            });

            // Property invariants per design.md autocomplete-merge property:
            //   1. count is capped at 8
            //   2. all labels are non-empty
            //   3. labels are unique (dedup by slug → dedup by label is a
            //      necessary but weaker condition; we assert the necessary one)
            //   4. each label contains a comma followed by a 2-letter UF
            //      (the rendered shape "<City Name>, <UF>")
            expect(labels.length).toBeGreaterThanOrEqual(1);
            expect(labels.length).toBeLessThanOrEqual(8);
            for (const lbl of labels) expect(lbl).not.toEqual("");
            expect(new Set(labels).size).toBe(labels.length);
            for (const lbl of labels) {
                expect(lbl).toMatch(/,\s+[A-Z]{2}$/);
            }

            // Persist the rendered labels so a regression on the fixed-code
            // re-run shows up as either label-set inequality or an order
            // change.
            const snap: Snapshot = { query: q, labels };
            const previous = readBaseline(testInfo, `citySuggest__${q}`);
            persistSnapshot(testInfo, `citySuggest__${q}`, snap);

            if (previous) {
                // Re-run after fix: assert byte-identical labels (order matters
                // because the merge order is part of the property).
                expect(snap.labels).toEqual(previous.labels);
            }
        });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3.2 — Desktop Chrome — story viewer click still opens the overlay
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Preservation 3.2 — desktop story click still opens viewer", () => {
    test.beforeEach(({ }, testInfo) => {
        test.skip(
            testInfo.project.name !== "desktop-chrome",
            "preservation 3.2 only runs on desktop-chrome",
        );
    });

    test("clicking a story circle mounts the viewer overlay with progress + top bar + image", async ({
        page,
    }, testInfo) => {
        await page.goto(FIXTURE_CITY_PATH, { waitUntil: "domcontentloaded" });

        const storyCircle = page
            .locator('button:has([class*="h-[62px]"][class*="w-[62px]"])')
            .first();

        const circleCount = await storyCircle.count();
        if (circleCount === 0) {
            test.skip(
                true,
                `[story preservation] no story circle on ${FIXTURE_CITY_PATH} — set E2E_STORY_PATH to a route that has stories.`,
            );
            return;
        }

        await expect(storyCircle).toBeVisible({ timeout: 10_000 });
        await userActivate(storyCircle, testInfo);

        // Per the design's preservation test plan §2, snapshot the overlay
        // structure: progress bars, top bar, image element, tap zones, bottom bar.
        const overlay = page.locator(
            '[class*="fixed"][class*="inset-0"][class*="z-[100]"]',
        );
        await expect(overlay).toBeVisible({ timeout: 5_000 });

        const structure = await page.evaluate(() => {
            const overlayEl = document.querySelector(
                '[class*="fixed"][class*="inset-0"][class*="z-\\[100\\]"]',
            );
            if (!overlayEl) return null;
            return {
                hasProgressBars: !!overlayEl.querySelector('[class*="rounded-full"][class*="bg-white/30"]'),
                progressBarCount: overlayEl.querySelectorAll('[class*="rounded-full"][class*="bg-white/30"]').length,
                hasCloseButton: !!overlayEl.querySelector('button > svg.lucide-x, button > svg[class*="lucide-x"]'),
                hasImage: !!overlayEl.querySelector("img"),
                tapZoneCount: overlayEl.querySelectorAll('button[aria-label="Anterior"], button[aria-label="Próximo"]').length,
                hasViewCount: !!overlayEl.querySelector('svg.lucide-eye, svg[class*="lucide-eye"]'),
            };
        });

        expect(structure).not.toBeNull();
        expect(structure!.hasProgressBars).toBe(true);
        expect(structure!.progressBarCount).toBeGreaterThanOrEqual(1);
        expect(structure!.hasCloseButton).toBe(true);
        expect(structure!.hasImage).toBe(true);
        expect(structure!.tapZoneCount).toBe(2);
        expect(structure!.hasViewCount).toBe(true);

        const previous = readBaseline(testInfo, "storyOverlay");
        persistSnapshot(testInfo, "storyOverlay", structure as Snapshot);
        if (previous) expect(structure).toEqual(previous);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3.3 — Desktop Chrome — comments click still opens the panel
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Preservation 3.3 — desktop comments click still opens panel", () => {
    test.beforeEach(({ }, testInfo) => {
        test.skip(
            testInfo.project.name !== "desktop-chrome",
            "preservation 3.3 only runs on desktop-chrome",
        );
    });

    test("clicking the comments icon mounts the panel with header, list region, and footer", async ({
        page,
    }, testInfo) => {
        await page.goto(`/reels/${FIXTURE_PROFILE_SLUG}`, { waitUntil: "domcontentloaded" });

        const commentsTrigger = page
            .locator('button:has(svg[class*="message-circle"])')
            .first();

        const triggerCount = await commentsTrigger.count();
        if (triggerCount === 0) {
            test.skip(
                true,
                `[comments preservation] no comments trigger on /reels/${FIXTURE_PROFILE_SLUG}`,
            );
            return;
        }

        await expect(commentsTrigger).toBeVisible({ timeout: 10_000 });
        await userActivate(commentsTrigger, testInfo);

        const panel = page.locator('div[class*="rounded-t-2xl"][class*="bg-white"]').first();
        await expect(panel).toBeVisible({ timeout: 5_000 });

        const structure = await page.evaluate(() => {
            const p = document.querySelector('div[class*="rounded-t-2xl"][class*="bg-white"]');
            if (!p) return null;
            const headerText = p.querySelector("p")?.textContent?.trim() ?? "";
            // Header text should match "<n> comentários"
            const headerMatches = /^\d+\s+coment[aá]rios$/.test(headerText);
            return {
                headerMatches,
                hasCloseButton: !!p.querySelector('button > svg.lucide-x, button > svg[class*="lucide-x"]'),
                // Either a comments list, an "empty" placeholder, or a "loading" placeholder
                hasListRegion: !!p.querySelector('[class*="overflow-y-auto"]'),
                hasFooterRegion: !!p.querySelector('[class*="border-t"]'),
            };
        });

        expect(structure).not.toBeNull();
        expect(structure!.headerMatches).toBe(true);
        expect(structure!.hasCloseButton).toBe(true);
        expect(structure!.hasListRegion).toBe(true);
        expect(structure!.hasFooterRegion).toBe(true);

        const previous = readBaseline(testInfo, "commentsPanel");
        persistSnapshot(testInfo, "commentsPanel", structure as Snapshot);
        if (previous) expect(structure).toEqual(previous);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3.4 — Desktop Chrome — share button native + clipboard paths
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Preservation 3.4 — desktop share button still triggers existing flow", () => {
    test.beforeEach(({ }, testInfo) => {
        test.skip(
            testInfo.project.name !== "desktop-chrome",
            "preservation 3.4 only runs on desktop-chrome",
        );
    });

    test("native-share path: pressing share invokes navigator.share exactly once with the expected payload", async ({
        browser,
    }, testInfo) => {
        // Per design: install navigator.share as a NEW property (chromium has
        // no native navigator.share), confirm exactly-one invocation with the
        // expected `{ title, url }` payload. We use a fresh context here so
        // the stub is scoped to this single test.
        const ctx: BrowserContext = await browser.newContext();
        await installShareStub(ctx);
        const page = await ctx.newPage();
        try {
            await page.goto(`/p/${FIXTURE_PROFILE_SLUG}`, { waitUntil: "domcontentloaded" });

            const shareButton = page.locator('button[title="Compartilhar perfil"]').first();
            const btnCount = await shareButton.count();
            if (btnCount === 0) {
                test.skip(
                    true,
                    `[share preservation native] no share button on /p/${FIXTURE_PROFILE_SLUG}`,
                );
                return;
            }

            await expect(shareButton).toBeVisible({ timeout: 10_000 });
            await shareButton.click();

            // Wait up to 5s for the call to land. Generous deadline (per the
            // file-level harness comment) — well above the observed ~50–200ms
            // ceiling for this state update on chromium.
            const stop = Date.now() + 5_000;
            let calls: Awaited<ReturnType<typeof readShareCalls>> = [];
            while (Date.now() < stop) {
                calls = await readShareCalls(page);
                if (calls.length > 0) break;
                await page.waitForTimeout(50);
            }

            expect(calls.length).toBe(1);
            expect(calls[0].url).toBe(`http://192.168.1.96:3000/p/${FIXTURE_PROFILE_SLUG}`);
            expect(calls[0].title).toContain("Privello");

            const snap: Snapshot = {
                callCount: calls.length,
                payloadShape: {
                    titleEndsWithPrivello: /Privello$/.test(calls[0].title ?? ""),
                    urlMatches: calls[0].url === `http://192.168.1.96:3000/p/${FIXTURE_PROFILE_SLUG}`,
                },
            };
            const previous = readBaseline(testInfo, "shareNative");
            persistSnapshot(testInfo, "shareNative", snap);
            if (previous) expect(snap).toEqual(previous);
        } finally {
            await ctx.close();
        }
    });

    test("clipboard path: with no navigator.share, the URL is copied and the button reads 'Copiado!'", async ({
        browser,
    }, testInfo) => {
        // Use the REAL chromium clipboard (granted via permissions) — the
        // bug-condition harness's `Object.defineProperty(navigator, "clipboard",
        // ...)` override interacts with React 19 microtask scheduling badly
        // enough to silently slow renders past short deadlines on chromium
        // (see COUNTEREXAMPLES.md §"Note on the desktop-chrome control").
        // Granting real clipboard permissions reproduces what the user
        // experiences on desktop today and is the strictest preservation
        // signal we can capture.
        const ctx: BrowserContext = await browser.newContext();
        await grantClipboardPermissions(ctx);
        const page = await ctx.newPage();
        try {
            await page.goto(`/p/${FIXTURE_PROFILE_SLUG}`, { waitUntil: "domcontentloaded" });

            const shareButton = page.locator('button[title="Compartilhar perfil"]').first();
            const btnCount = await shareButton.count();
            if (btnCount === 0) {
                test.skip(
                    true,
                    `[share preservation clipboard] no share button on /p/${FIXTURE_PROFILE_SLUG}`,
                );
                return;
            }
            await expect(shareButton).toBeVisible({ timeout: 10_000 });

            // Sanity-check the platform: we expect navigator.share to be
            // undefined on plain chromium so the clipboard branch runs.
            const sharePresent = await page.evaluate(
                () => typeof (navigator as Navigator & { share?: unknown }).share === "function",
            );
            expect(sharePresent).toBe(false);

            await shareButton.click();

            // The expected URL is the one the production code computes
            // from `window.location.origin + /p/${slug}`.
            const expectedUrl = `http://192.168.1.96:3000/p/${FIXTURE_PROFILE_SLUG}`;
            const clipboardText = await waitForClipboardText(page, expectedUrl, 5_000);
            expect(clipboardText).toBe(expectedUrl);

            await expect(shareButton).toContainText(/Copiado!/i, { timeout: 5_000 });

            const snap: Snapshot = {
                clipboardEqualsExpected: clipboardText === expectedUrl,
                feedbackShown: true,
            };
            const previous = readBaseline(testInfo, "shareClipboard");
            persistSnapshot(testInfo, "shareClipboard", snap);
            if (previous) expect(snap).toEqual(previous);
        } finally {
            await ctx.close();
        }
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3.5 — iOS Safari — unrelated features unchanged (smoke)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The design's preservation list calls out three specific iOS Safari
 * non-bug interactions: feed scroll, bottom-nav navigation, and login form.
 * The task brief says "a small smoke check is sufficient — e.g. feed
 * scrolling or navigation". We test both feed scrolling and bottom-nav
 * navigation, plus a light login-page smoke (that the form renders and
 * accepts focus), to cover §3.5 without exceeding the smoke-check scope.
 */
test.describe("Preservation 3.5 — iOS Safari unrelated features unchanged", () => {
    test.beforeEach(({ }, testInfo) => {
        test.skip(
            testInfo.project.name !== "ios-safari",
            "preservation 3.5 only runs on ios-safari",
        );
    });

    test("home feed renders and is scrollable", async ({ page }, testInfo) => {
        await page.goto("/", { waitUntil: "domcontentloaded" });

        // The home page renders profile sections (hot, optionally boosted)
        // and a top hero. We assert the sections exist and that
        // window.scrollY changes after a deliberate scroll, which is the
        // simplest non-flaky preservation signal for "feed scrolling works".
        await page.waitForSelector("h1", { timeout: 10_000 });
        const beforeScroll = await page.evaluate(() => window.scrollY);
        await page.evaluate(() => window.scrollTo({ top: 600 }));
        await page.waitForTimeout(150);
        const afterScroll = await page.evaluate(() => window.scrollY);

        expect(afterScroll).toBeGreaterThan(beforeScroll);

        const snap: Snapshot = {
            scrolled: afterScroll > beforeScroll,
            mainHeadingPresent: true,
        };
        const previous = readBaseline(testInfo, "iosFeedScroll");
        persistSnapshot(testInfo, "iosFeedScroll", snap);
        if (previous) expect(snap).toEqual(previous);
    });

    test("bottom-nav 'Reels' link navigates to /reels", async ({ page }, testInfo) => {
        await page.goto("/", { waitUntil: "domcontentloaded" });

        // Bottom nav is fixed at the bottom; the Reels link is one of the
        // four (or five for admins) items. Find it by its visible label.
        const reelsLink = page.locator('a:has-text("Reels")').first();
        await expect(reelsLink).toBeVisible({ timeout: 10_000 });
        await userActivate(reelsLink, testInfo);

        await page.waitForURL("**/reels", { timeout: 10_000 });
        const url = new URL(page.url());
        expect(url.pathname).toBe("/reels");

        const snap: Snapshot = { resolvedPath: url.pathname };
        const previous = readBaseline(testInfo, "iosBottomNav");
        persistSnapshot(testInfo, "iosBottomNav", snap);
        if (previous) expect(snap).toEqual(previous);
    });

    test("login page renders the email + password form", async ({ page }, testInfo) => {
        // We don't submit (would couple the test to credentials and the
        // auth backend) — we assert the form is present and focusable,
        // which is the smallest preservation signal for §3.5's login
        // mention without making the test flaky against environment.
        await page.goto("/entrar", { waitUntil: "domcontentloaded" });

        const emailInput = page.locator('input[name="email"]').first();
        const passwordInput = page.locator('input[name="password"]').first();
        const submitButton = page.locator('button[type="submit"]').first();

        await expect(emailInput).toBeVisible({ timeout: 10_000 });
        await expect(passwordInput).toBeVisible();
        await expect(submitButton).toBeVisible();

        await emailInput.tap();
        const focused = await page.evaluate(
            () => (document.activeElement as HTMLElement | null)?.getAttribute("name"),
        );
        expect(focused).toBe("email");

        const snap: Snapshot = {
            emailVisible: true,
            passwordVisible: true,
            submitVisible: true,
            emailFocusable: focused === "email",
        };
        const previous = readBaseline(testInfo, "iosLoginForm");
        persistSnapshot(testInfo, "iosLoginForm", snap);
        if (previous) expect(snap).toEqual(previous);
    });
});
