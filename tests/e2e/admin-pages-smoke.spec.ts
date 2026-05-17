/**
 * Smoke E2E desktop — `/admin/moderacao`, `/admin/financeiro`, `/admin/perfis`
 *
 * **Validates: Requirement 4.6** (páginas admin migradas para o design system
 * carregam sem regressão visível, KPIs e tabelas renderizam, e nenhum
 * `console.error` é emitido durante a navegação).
 *
 * Para cada rota o teste:
 *   1. Faz login como admin (helper local — mesma estratégia do
 *      `admin-shell.spec.ts` e `admin-moderacao-regression.spec.ts`,
 *      `requestSubmit()` para evitar o race com o submit nativo do `<form>`
 *      em Next 16/Turbopack dev).
 *   2. Navega para a rota.
 *   3. Asserta que o `<aside>` desktop renderiza (Tailwind `md:flex`).
 *   4. Asserta que pelo menos um marker conhecido de KPICard/Table está
 *      visível: `Card variant="solid"` produz `bg-white rounded-2xl ...`
 *      (envelopa tanto `KPICard` quanto `Table`), então a class signature
 *      `.bg-white.rounded-2xl` cobre ambos. `table` cobre tabelas
 *      diretamente caso a query CSS combine seja necessária.
 *   5. Coleta `console.error` via `page.on('console')` filtrando
 *      `type() === 'error'` e exige array vazio ao final.
 *
 * ── Auth ──
 * Mesmo padrão dos outros admin specs: login real em `/entrar` com o admin
 * semeado por `prisma/seed.ts` (`admin@privello.com / Admin@privello2025`),
 * sobrescritível via `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`. Helper
 * duplicado intencionalmente para manter o spec self-contained — a
 * extração para `tests/e2e/lib/` é refactor fora do escopo da Task 25.2.
 *
 * ── Project scoping ──
 * Roda apenas em `desktop-chrome` (mirror dos demais admin specs):
 * `ios-safari`/`android-chrome`/`desktop-firefox` apontam para origin
 * iOS-specific ou não acrescentam cobertura para esta smoke.
 */

import { test, expect, type Page } from "@playwright/test";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@privello.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "Admin@privello2025";

const ROUTES = [
    "/admin/moderacao",
    "/admin/financeiro",
    "/admin/perfis",
] as const;

/**
 * Mensagens de `console.error` conhecidas e benignas que não devem falhar
 * o smoke. Cada entrada deve estar acompanhada de justificativa.
 *
 * - CSP report-only `upgrade-insecure-requests`: o app envia
 *   `Content-Security-Policy-Report-Only` por decisão da `fase-1-seguranca`
 *   (ver `next.config.ts > buildCSP` e `docs/deploy-railway.md > Próximos
 *   passos`). Chromium emite um aviso a nível de documento informando que a
 *   diretiva `upgrade-insecure-requests` é ignorada em modo report-only —
 *   é uma mensagem do browser, não do app, e desaparece quando o header
 *   for promovido para enforcement (item 2 dos próximos passos do deploy).
 */
const KNOWN_BENIGN_CONSOLE_ERRORS: readonly RegExp[] = [
    /upgrade-insecure-requests.*report-only policy/i,
];

/**
 * Faz login como admin via `/entrar` e aguarda o redirect para
 * `/admin/moderacao`. Reusa a página corrente. Idêntico aos helpers de
 * `admin-shell.spec.ts` e `admin-moderacao-regression.spec.ts`.
 */
async function loginAsAdmin(page: Page): Promise<void> {
    await page.goto("/entrar", { waitUntil: "domcontentloaded" });

    await page.waitForFunction(
        () => {
            const form = document.querySelector("form");
            if (!form) return false;
            const propsKey = Object.keys(form).find((k) =>
                k.startsWith("__reactProps$"),
            );
            if (!propsKey) return false;
            const props = (form as unknown as Record<string, unknown>)[propsKey];
            return (
                typeof (props as { onSubmit?: unknown } | undefined)?.onSubmit ===
                "function"
            );
        },
        null,
        { timeout: 20_000 },
    );

    await page.fill('input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);

    await Promise.all([
        page.waitForURL("**/admin/moderacao", { timeout: 30_000 }),
        page.evaluate(() => {
            const form = document.querySelector("form");
            form?.requestSubmit();
        }),
    ]);
}

test.describe("Admin pages smoke (desktop) — Task 25.2", () => {
    test.beforeEach(async ({ }, testInfo) => {
        test.skip(
            testInfo.project.name !== "desktop-chrome",
            "Smoke admin roda apenas em desktop-chrome.",
        );
    });

    for (const route of ROUTES) {
        test(`${route} carrega, renderiza KPIs/Table e não emite console.error`, async ({
            page,
        }) => {
            await page.setViewportSize({ width: 1280, height: 800 });
            await loginAsAdmin(page);

            // Coletor de console.error — registrado APÓS o login para isolar
            // erros emitidos durante a navegação à rota sob teste. Login envolve
            // Server Actions e redirects que podem logar warnings de dev mode
            // não relacionados ao smoke da página.
            const consoleErrors: { text: string; location: string }[] = [];
            const onConsole = (msg: import("@playwright/test").ConsoleMessage) => {
                if (msg.type() !== "error") return;
                const text = msg.text();
                if (KNOWN_BENIGN_CONSOLE_ERRORS.some((re) => re.test(text))) {
                    return;
                }
                const loc = msg.location();
                consoleErrors.push({
                    text,
                    location: `${loc.url}:${loc.lineNumber}:${loc.columnNumber}`,
                });
            };
            page.on("console", onConsole);

            try {
                await page.goto(route, { waitUntil: "domcontentloaded" });
                await page.waitForLoadState("networkidle", { timeout: 15_000 });

                // 1) Sidebar desktop (Tailwind `md:flex` ≥ 768px) deve renderizar.
                const desktopAside = page.locator("aside.md\\:flex").first();
                await expect(
                    desktopAside,
                    `sidebar desktop deveria renderizar em ${route}`,
                ).toBeVisible();

                // 2) Pelo menos um marker conhecido de KPICard ou Table deve
                // estar visível. `Card variant="solid"` (consumido por
                // `KPICard` e wrapper de `Table`) produz a signature
                // `.bg-white.rounded-2xl` — combinamos com `table` direto
                // para cobrir variações futuras.
                const kpiOrTable = page
                    .locator(".bg-white.rounded-2xl, table")
                    .first();
                await expect(
                    kpiOrTable,
                    `KPICard ou Table deveria renderizar em ${route}`,
                ).toBeVisible();
            } finally {
                page.off("console", onConsole);
            }

            // 3) Nenhum `console.error` durante a navegação.
            expect(
                consoleErrors,
                `console.error(s) emitido(s) em ${route}:\n${JSON.stringify(consoleErrors, null, 2)}`,
            ).toEqual([]);
        });
    }
});
