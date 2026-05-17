/**
 * Property 1: Bug Condition — iOS Safari Touch Interactions Fail On Non-Secure Origin
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4
 *
 * GOAL (per task 1): surface counter-examples for each of the four broken
 * interactions on iOS Safari (WebKit + iPhone 14 device descriptor) over a
 * non-secure-context origin (http://192.168.1.96:3000), so that the failure
 * confirms the bug exists and the captured diagnostics discriminate among
 * the five hypothesised root causes from design.md.
 *
 * Scoped PBT approach: the property domain is the four `kind` values, each
 * exercised with a deterministic concrete case the design says reproduces
 * the bug. Per kind:
 *   - citySuggest: type "São Pa" on /descobrir; assert a dropdown <ul> with
 *     at least one option <li> is mounted within 1s.
 *   - storyTap: tap the first story circle on /; assert an overlay
 *     `[class*="fixed inset-0"]` with `[class*="z-[100]"]` is mounted within 1s.
 *   - commentsTap: open a profile reels feed at /reels/<slug>, tap the
 *     comments icon; assert the comments panel is mounted within 1s.
 *   - sharePress: visit /p/<slug>, press "Compartilhar"; assert within 2s
 *     either page visibility is lost (native share sheet), or the button
 *     text is "Copiado!", or a fallback popover with the share URL appears.
 *
 * Per task 1, the test MUST FAIL on unfixed code on iOS Safari (this is
 * the success case for the exploratory phase) and MUST PASS on desktop
 * Chrome to confirm the bug is iOS-Safari-specific.
 */

import { test, expect, type Locator, type Page, type TestInfo } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";
import {
    installInstrumentation,
    snapshotCapabilities,
    readClickCounts,
    attachNetworkRecorder,
    SELECTOR_KEYS,
    type Diagnostics,
} from "./lib/instrumentation";

/**
 * Trigger the user's "tap or click" gesture in a way that matches what a real
 * user would do on each platform:
 *   - iOS Safari (WebKit, hasTouch=true): use locator.tap() to exercise the
 *     iOS synthetic-click pipeline that the design hypothesises is broken.
 *   - Desktop Chrome (no touch support): use locator.click() because Desktop
 *     Chrome has no touchscreen; the bug we're characterising is "iOS Safari's
 *     synthetic click after touch is not delivered", which is meaningless on
 *     a desktop mouse path.
 *
 * This branching is essential to credibly demonstrate the bug is iOS-Safari-
 * specific: if we forced .tap() on desktop Chrome we'd hit Playwright's "page
 * does not support tap" error, which is an infra failure, not a property one.
 */
async function userActivate(locator: Locator, testInfo: TestInfo) {
    if (testInfo.project.name === "ios-safari") {
        await locator.tap();
    } else {
        await locator.click();
    }
}

// Fixture profile slugs from prisma/seed.ts. `helena` is a PREMIUM-tier
// profile in São Paulo / Jardins with stories (premium = 2 stories) and
// reels (reels: 2). The bug-condition matchers don't depend on a specific
// slug; we just need any slug that resolves to a profile with at least one
// story and one reel so the relevant DOM mounts.
const FIXTURE_PROFILE_SLUG = process.env.E2E_PROFILE_SLUG ?? "helena";

// Cached city query that matches multiple cities from the local DB and IBGE.
const FIXTURE_CITY_QUERY = "São Pa";

const DIAG_DIR = path.join(__dirname, "diagnostics");
function persistDiagnostics(testInfo: TestInfo, kind: string, payload: unknown) {
    try {
        fs.mkdirSync(DIAG_DIR, { recursive: true });
        const safe = `${testInfo.project.name}__${kind}.json`;
        fs.writeFileSync(path.join(DIAG_DIR, safe), JSON.stringify(payload, null, 2));
    } catch {
        // best-effort
    }
}

async function buildBaseDiagnostics(
    page: Page,
    network: () => Diagnostics["network"],
    notes: Record<string, unknown> = {},
): Promise<Diagnostics> {
    const caps = await snapshotCapabilities(page);
    const clicks = await readClickCounts(page);
    return {
        isSecureContext: caps.isSecureContext,
        userAgent: caps.userAgent,
        navigatorShare: caps.navigatorShare,
        navigatorClipboardWriteText: caps.navigatorClipboardWriteText,
        clickCounts: clicks,
        network: network(),
        notes,
    };
}

test.describe("Property 1: iOS Safari touch interactions on non-secure origin", () => {
    test.beforeEach(async ({ context }, testInfo) => {
        // Stub the clipboard ONLY on the desktop control project so the share
        // button's clipboard branch fires successfully there. On iOS Safari we
        // deliberately leave clipboard untouched so the bug condition reproduces.
        await installInstrumentation(context, {
            stubClipboardForDesktop: testInfo.project.name === "desktop-chrome",
        });
    });

    // ─── citySuggest ───────────────────────────────────────────────────────
    test("citySuggest mounts a dropdown with options after typing >= 2 chars", async ({
        page,
    }, testInfo) => {
        // Attach BEFORE goto so the autocomplete's prewarm requests
        // (`/api/cities` on mount and the IBGE municipality list) are recorded.
        const collectNetwork = attachNetworkRecorder(page);
        // /buscar foi consolidada em /descobrir em 2026-05-17. A nova rota
        // monta o mesmo CityAutocomplete via DiscoverHubForm.
        await page.goto("/descobrir", { waitUntil: "domcontentloaded" });

        // The CityAutocomplete is rendered inside the discover-hub-form.
        // Find its input by placeholder (matches both compact and non-compact variants).
        const input = page
            .locator(
                'input[placeholder*="Cidade"], input[placeholder*="Trocar cidade"], input[placeholder*="Ex: São Paulo"]',
            )
            .first();
        await expect(input, "city autocomplete input must be present on /descobrir").toBeVisible({
            timeout: 10_000,
        });

        // Wait for the autocomplete's prewarm caches to populate before typing.
        // The component fires both fetches on mount; on a cold cache the IBGE
        // payload (all Brazilian municipalities) can take several seconds.
        // A real user would also wait this long before tapping the input.
        // We give up to 8s but proceed sooner if both responses land.
        await Promise.race([
            page.waitForResponse(
                (r) =>
                    r.url().includes("servicodados.ibge.gov.br/api/v1/localidades/municipios") &&
                    r.ok(),
                { timeout: 8_000 },
            ).catch(() => null),
            page.waitForTimeout(8_000),
        ]);

        await input.click();
        await input.fill("");
        await input.type(FIXTURE_CITY_QUERY, { delay: 80 });

        // Property assertion: within 1s of typing, the dropdown <ul> is mounted
        // with at least one option <li>. We accept either the role="listbox"
        // form (design's Property 1 ideal) or the current absolute-positioned
        // <ul> form (the actual rendered structure today).
        const dropdownOption = page.locator(
            'ul[role="listbox"] > li, ul.absolute > li, ul[class*="absolute"] > li',
        ).first();

        let propertyHeld = false;
        let resultsLength: number | null = null;
        let dropdownHtml: string | null = null;
        try {
            await expect(dropdownOption).toBeVisible({ timeout: 1_000 });
            propertyHeld = true;
        } catch {
            propertyHeld = false;
        }

        // Capture autocomplete-specific diagnostics regardless of pass/fail.
        resultsLength = await page.evaluate(() => {
            const ul = document.querySelector(
                'ul[role="listbox"], ul[class*="absolute"]',
            );
            return ul ? ul.querySelectorAll("li").length : 0;
        });
        dropdownHtml = await page.evaluate(() => {
            const ul = document.querySelector(
                'ul[role="listbox"], ul[class*="absolute"]',
            );
            return ul ? ul.outerHTML.slice(0, 600) : null;
        });

        const diag = await buildBaseDiagnostics(page, collectNetwork, {
            query: FIXTURE_CITY_QUERY,
            resultsLength,
            dropdownHtml,
            propertyHeld,
        });
        persistDiagnostics(testInfo, "citySuggest", diag);

        expect(
            propertyHeld,
            `[citySuggest] dropdown <ul>...<li> not mounted within 1s after typing "${FIXTURE_CITY_QUERY}". ` +
            `Diagnostics: ${JSON.stringify(diag, null, 2)}`,
        ).toBe(true);
    });

    // ─── storyTap ──────────────────────────────────────────────────────────
    test("storyTap mounts the story viewer overlay within 1s of tapping a circle", async ({
        page,
    }, testInfo) => {
        const collectNetwork = attachNetworkRecorder(page);
        // The StoryBar component is mounted on /descobrir/[citySlug], not on /.
        // Per the design's bug-condition definition, what matters is that a
        // story circle is tapped on iOS Safari over a non-secure origin —
        // the route that exposes the StoryBar is incidental.
        const storyPath = process.env.E2E_STORY_PATH ?? "/descobrir/sao-paulo-sp";
        await page.goto(storyPath, { waitUntil: "domcontentloaded" });

        // Find the first story circle button. StoryBar renders each circle as
        // a <button> containing a 62px square wrapper Image. We match by the
        // structure to avoid coupling to display name text.
        const storyCircle = page
            .locator('button:has([class*="h-[62px]"][class*="w-[62px]"])')
            .first();

        // If no story circle is rendered, the page has empty groups (edge case
        // handled in design test 6). Skip with a clear note rather than failing
        // ambiguously.
        const circleCount = await storyCircle.count();
        if (circleCount === 0) {
            const diag = await buildBaseDiagnostics(page, collectNetwork, {
                skipped: true,
                reason: `no story circles rendered on ${storyPath} — fixture has no stories`,
            });
            persistDiagnostics(testInfo, "storyTap", diag);
            test.skip(
                true,
                `[storyTap] no story circles on ${storyPath} for this fixture. ` +
                `Seed at least one PREMIUM/DESTAQUE profile with a story so the StoryBar mounts, ` +
                `or set E2E_STORY_PATH to a route that does.`,
            );
            return;
        }

        await expect(storyCircle).toBeVisible({ timeout: 10_000 });
        await userActivate(storyCircle, testInfo);

        const overlay = page.locator(
            '[class*="fixed"][class*="inset-0"][class*="z-[100]"]',
        );

        let propertyHeld = false;
        try {
            await expect(overlay).toBeVisible({ timeout: 1_000 });
            propertyHeld = true;
        } catch {
            propertyHeld = false;
        }

        const diag = await buildBaseDiagnostics(page, collectNetwork, {
            propertyHeld,
            circleCount,
        });
        persistDiagnostics(testInfo, "storyTap", diag);

        expect(
            propertyHeld,
            `[storyTap] story-viewer overlay not mounted within 1s of tap. ` +
            `Click delivery count on story circle: ${diag.clickCounts[SELECTOR_KEYS.storyCircle] ?? 0}. ` +
            `Diagnostics: ${JSON.stringify(diag, null, 2)}`,
        ).toBe(true);
    });

    // ─── commentsTap ───────────────────────────────────────────────────────
    test("commentsTap mounts the comments panel within 1s of tapping the comments icon", async ({
        page,
    }, testInfo) => {
        const collectNetwork = attachNetworkRecorder(page);
        await page.goto(`/reels/${FIXTURE_PROFILE_SLUG}`, { waitUntil: "domcontentloaded" });

        // The MessageCircle icon button in the right rail of the active reel.
        // The lucide icon class is `lucide lucide-message-circle`.
        const commentsTrigger = page
            .locator('button:has(svg[class*="message-circle"])')
            .first();

        const triggerCount = await commentsTrigger.count();
        if (triggerCount === 0) {
            const diag = await buildBaseDiagnostics(page, collectNetwork, {
                skipped: true,
                reason: `no comments trigger rendered on /reels/${FIXTURE_PROFILE_SLUG}`,
            });
            persistDiagnostics(testInfo, "commentsTap", diag);
            test.skip(
                true,
                `[commentsTap] no reel + comments trigger rendered for slug "${FIXTURE_PROFILE_SLUG}". ` +
                `Set E2E_PROFILE_SLUG to a profile with at least one reel.`,
            );
            return;
        }

        await expect(commentsTrigger).toBeVisible({ timeout: 10_000 });
        await userActivate(commentsTrigger, testInfo);

        // Comments panel: the rounded-top white sheet that mounts inside the
        // reel container when showComments is true (see reels-feed.tsx).
        const commentsPanel = page.locator(
            'div[class*="rounded-t-2xl"][class*="bg-white"]',
        ).first();

        let propertyHeld = false;
        try {
            await expect(commentsPanel).toBeVisible({ timeout: 1_000 });
            propertyHeld = true;
        } catch {
            propertyHeld = false;
        }

        const diag = await buildBaseDiagnostics(page, collectNetwork, {
            propertyHeld,
            triggerCount,
        });
        persistDiagnostics(testInfo, "commentsTap", diag);

        expect(
            propertyHeld,
            `[commentsTap] comments panel not mounted within 1s of tap. ` +
            `Click delivery count on comments icon: ${diag.clickCounts[SELECTOR_KEYS.commentsTrigger] ?? 0}. ` +
            `Diagnostics: ${JSON.stringify(diag, null, 2)}`,
        ).toBe(true);
    });

    // ─── sharePress ────────────────────────────────────────────────────────
    test("sharePress shows native share, copy feedback, or fallback popover within 2s", async ({
        page,
    }, testInfo) => {
        const collectNetwork = attachNetworkRecorder(page);
        await page.goto(`/p/${FIXTURE_PROFILE_SLUG}`, { waitUntil: "domcontentloaded" });

        // The share button has title="Compartilhar perfil" and visible label
        // "Compartilhar" (or "Copiado!" after success).
        const shareButton = page.locator('button[title="Compartilhar perfil"]').first();

        const btnCount = await shareButton.count();
        if (btnCount === 0) {
            const diag = await buildBaseDiagnostics(page, collectNetwork, {
                skipped: true,
                reason: `share button not present on /p/${FIXTURE_PROFILE_SLUG}`,
            });
            persistDiagnostics(testInfo, "sharePress", diag);
            test.skip(
                true,
                `[sharePress] no share button on /p/${FIXTURE_PROFILE_SLUG}. ` +
                `Set E2E_PROFILE_SLUG to a public profile slug that renders the share button.`,
            );
            return;
        }

        await expect(shareButton).toBeVisible({ timeout: 10_000 });

        // Suppress any window.prompt the unfixed code might trigger so it
        // doesn't hang the test. Note: capturing whether prompt was *attempted*
        // is itself a useful diagnostic for hypothesis 3.
        let promptAttempted = false;
        page.on("dialog", async (dialog) => {
            promptAttempted = true;
            await dialog.dismiss().catch(() => { });
        });

        const startedAt = Date.now();
        await userActivate(shareButton, testInfo);

        // Property assertion: within 2s, ANY of:
        //   (a) page visibility lost (document.hidden) — native share sheet
        //   (b) button text === "Copiado!"
        //   (c) a fallback popover with the share URL appears
        // AND a user-visible feedback state is present.
        const fallbackPopover = page.locator(
            '[role="dialog"], [data-share-fallback], [class*="share-popover"]',
        );

        let propertyHeld = false;
        let pathTaken: "native-share" | "clipboard-copied" | "fallback-popover" | "none" =
            "none";
        const deadline = Date.now() + 2_000;
        while (Date.now() < deadline) {
            const hidden = await page.evaluate(() => document.hidden);
            if (hidden) {
                propertyHeld = true;
                pathTaken = "native-share";
                break;
            }
            const text = (await shareButton.textContent())?.trim() ?? "";
            if (/copiado/i.test(text)) {
                propertyHeld = true;
                pathTaken = "clipboard-copied";
                break;
            }
            const popoverVisible = await fallbackPopover.first().isVisible().catch(() => false);
            if (popoverVisible) {
                const popoverText = (await fallbackPopover.first().textContent()) ?? "";
                if (popoverText.includes("/p/") || popoverText.includes("http")) {
                    propertyHeld = true;
                    pathTaken = "fallback-popover";
                    break;
                }
            }
            await page.waitForTimeout(100);
        }

        const elapsed = Date.now() - startedAt;
        const finalText = (await shareButton.textContent())?.trim() ?? "";

        const diag = await buildBaseDiagnostics(page, collectNetwork, {
            propertyHeld,
            pathTaken,
            elapsedMs: elapsed,
            finalButtonText: finalText,
            promptAttempted,
        });
        persistDiagnostics(testInfo, "sharePress", diag);

        expect(
            propertyHeld,
            `[sharePress] no native share, no "Copiado!" feedback, and no fallback popover within 2s. ` +
            `final button text: "${finalText}". ` +
            `navigator.share=${diag.navigatorShare}, navigator.clipboard.writeText=${diag.navigatorClipboardWriteText}, ` +
            `isSecureContext=${diag.isSecureContext}, promptAttempted=${promptAttempted}. ` +
            `Click count on share button: ${diag.clickCounts[SELECTOR_KEYS.shareButton] ?? 0}.`,
        ).toBe(true);
    });
});
