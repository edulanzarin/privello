import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for the iOS-mobile-interactions-fix bugfix spec.
 *
 * The exploratory bug-condition test (tests/e2e/ios-bug-condition.spec.ts)
 * targets a non-secure-context dev origin (http://192.168.1.96:3000) where
 * `window.isSecureContext === false`, which is required to reproduce the
 * four broken iOS Safari interactions per the design's `isBugCondition`.
 *
 * Two projects:
 *   - "ios-safari": WebKit + iPhone 14 device descriptor. Expected to FAIL on
 *     unfixed code (failure confirms the bug exists).
 *   - "desktop-chrome": Chromium with stubbed `navigator.clipboard.writeText`
 *     so the share-button clipboard branch fires. Expected to PASS, confirming
 *     the bug is iOS-Safari-specific.
 */

const DEV_ORIGIN = process.env.E2E_BASE_URL ?? "http://192.168.1.96:3000";

export default defineConfig({
    testDir: "./tests/e2e",
    timeout: 60_000,
    expect: { timeout: 5_000 },
    fullyParallel: false,
    retries: 0,
    workers: 1,
    reporter: [["list"], ["json", { outputFile: "tests/e2e/diagnostics/last-run.json" }]],
    use: {
        baseURL: DEV_ORIGIN,
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
        video: "retain-on-failure",
        ignoreHTTPSErrors: true,
    },
    projects: [
        {
            name: "ios-safari",
            use: {
                ...devices["iPhone 14"],
                // ensure WebKit; iPhone 14 already maps to webkit but be explicit
                browserName: "webkit",
            },
        },
        {
            name: "desktop-chrome",
            use: {
                ...devices["Desktop Chrome"],
                browserName: "chromium",
            },
        },
    ],
    webServer: {
        // Bind to 0.0.0.0 so 192.168.1.96 is reachable; the npm script already does
        // that via `next dev --hostname 0.0.0.0`.
        command: "npm run dev",
        url: DEV_ORIGIN,
        reuseExistingServer: true,
        timeout: 180_000,
        stdout: "pipe",
        stderr: "pipe",
    },
});
