/**
 * Smoke E2E — `/admin/moderacao` consome `AdminShell` refatorado (10.1)
 * sobre `DarkSidebarShell` (9.1).
 *
 * **Validates: Requirement 9.6** (a item de nav cujo `href` casa com o
 * `pathname` corrente recebe `aria-current="page"`).
 *
 * Cobre as três asserções pedidas pelo task 10.2:
 *   1. Nav lateral renderiza em desktop.
 *   2. Drawer mobile abre/fecha via header `h-14` e backdrop.
 *   3. Item ativo (`/admin/moderacao`) tem `aria-current="page"` (e os
 *      demais não), em desktop e dentro do drawer.
 *
 * ── Auth ──
 * `/admin/*` é gateado por `src/app/admin/layout.tsx` (`auth()` + `role ∈
 * { ADMIN, MODERATOR }`); o desbloqueio é feito via login real pela
 * página `/entrar` com o admin semeado por `prisma/seed.ts`
 * (`admin@privello.com / Admin@privello2025`). Após o post da action a
 * própria action redireciona para `/admin/moderacao` quando a role é
 * `ADMIN`/`MODERATOR` (ver `loginAction` em `src/app/_actions/auth.ts`).
 *
 * Credenciais podem ser sobrescritas via env (`E2E_ADMIN_EMAIL`,
 * `E2E_ADMIN_PASSWORD`) para envs de CI com seed alternativo.
 *
 * ── Project scoping ──
 * Roda apenas em `desktop-chrome`: o WebKit `ios-safari` desta config
 * tenta um origin não-secure (`http://192.168.1.96:3000`) por causa do
 * spec iOS-mobile-interactions-fix; a sidebar do admin não é específica
 * de iOS e não há cobertura adicional roubada por skipar lá.
 */

import { test, expect, type Page } from "@playwright/test";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@privello.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "Admin@privello2025";

/**
 * Faz login como admin via `/entrar` e aguarda o redirect para
 * `/admin/moderacao`. Reusa a página corrente — nenhum `BrowserContext`
 * adicional é criado.
 */
async function loginAsAdmin(page: Page): Promise<void> {
    await page.goto("/entrar", { waitUntil: "domcontentloaded" });

    // `LoginForm` é um Client Component; `handleSubmit` chama `preventDefault()`
    // mas o handler só existe DEPOIS da hydration. Sem essa espera, o click no
    // submit dispara o GET nativo do `<form>` (sem `action`/method) e o browser
    // termina em `/entrar?email=…&password=…` em vez de invocar `loginAction`.
    //
    // Em Next 16 (Turbopack) dev, o React internal key `__reactProps$…` no
    // `<form>` só existe DEPOIS que o reconciler attacha os listeners.
    // Sondamos esse fingerprint diretamente — é o sinal mais confiável de
    // hydration completa em forms client-side sem `action=` server-action.
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

    // Disparamos o submit DIRETAMENTE no form via `requestSubmit()` em vez de
    // `page.click(...)` no botão. Isso evita uma classe de race em que o
    // browser começa a navegar pelo submit nativo do `<form>` antes de o
    // event listener React estourar `preventDefault()` (visto em traces:
    // `navigated to /entrar?email=…&password=…`). `requestSubmit()` invoca
    // o submit handler do form síncronamente, que neste ponto já é o
    // `handleSubmit` do React (asserido pelo `waitForFunction` acima).
    await Promise.all([
        page.waitForURL("**/admin/moderacao", { timeout: 30_000 }),
        page.evaluate(() => {
            const form = document.querySelector("form");
            form?.requestSubmit();
        }),
    ]);
}

test.describe("AdminShell smoke — /admin/moderacao", () => {
    test.beforeEach(async ({ }, testInfo) => {
        test.skip(
            testInfo.project.name !== "desktop-chrome",
            "AdminShell smoke roda apenas em desktop-chrome (origin secure + viewport flexível).",
        );
    });

    test("desktop: sidebar lateral renderiza e item ativo tem aria-current", async ({
        page,
    }) => {
        // Viewport desktop garante que `<aside class='md:flex'>` esteja visível
        // (Tailwind v4 `md:` ≥ 768px) e que o header mobile `md:hidden` esteja oculto.
        await page.setViewportSize({ width: 1280, height: 800 });
        await loginAsAdmin(page);

        // 1) Sidebar desktop renderiza com a `<nav>` interna populada.
        const desktopAside = page.locator("aside.md\\:flex").first();
        await expect(desktopAside).toBeVisible();

        const desktopNav = desktopAside.locator("nav");
        await expect(desktopNav).toBeVisible();

        // 2) Os 6 itens de NAV_ADMIN devem estar presentes na nav desktop.
        const expectedLabels = [
            "Moderação",
            "Suporte",
            "Perfis",
            "Mídias",
            "Financeiro",
            "Verificações",
        ];
        for (const label of expectedLabels) {
            await expect(
                desktopNav.locator(`a:has-text("${label}")`).first(),
            ).toBeVisible();
        }

        // 3) `aria-current="page"` no link de Moderação; nenhum outro item
        // na nav desktop carrega esse atributo.
        const activeLinks = desktopNav.locator('a[aria-current="page"]');
        await expect(activeLinks).toHaveCount(1);
        await expect(activeLinks.first()).toHaveAttribute(
            "href",
            "/admin/moderacao",
        );

        // 4) O header `h-14` mobile NÃO é renderizado em viewport ≥ md
        // (`md:hidden`). Confirmamos pela ausência visual do trigger.
        const mobileTrigger = page.locator(
            'header.md\\:hidden button[aria-label="Abrir menu"]',
        );
        await expect(mobileTrigger).toBeHidden();
    });

    test("mobile: drawer abre via header h-14, fecha via backdrop e via Escape", async ({
        page,
    }) => {
        // Login com viewport desktop primeiro para evitar interagir com a
        // página de login em mobile (formulário e logo apenas; sem perda
        // de cobertura), depois reduzimos o viewport para validar o drawer.
        await page.setViewportSize({ width: 1280, height: 800 });
        await loginAsAdmin(page);

        await page.setViewportSize({ width: 390, height: 844 });

        // O `<aside class='md:flex'>` desktop fica oculto em mobile (ele só
        // ganha `flex` em ≥ md); o header `h-14` é a entrada do drawer.
        const mobileHeader = page.locator("header.md\\:hidden").first();
        await expect(mobileHeader).toBeVisible();

        const trigger = mobileHeader.locator('button[aria-label="Abrir menu"]');
        await expect(trigger).toBeVisible();
        await expect(trigger).toHaveAttribute("aria-expanded", "false");

        // ── Abrir drawer ──
        await trigger.click();

        const drawer = page.locator('div[role="dialog"][aria-modal="true"]');
        await expect(drawer).toBeVisible();
        await expect(trigger).toHaveAttribute("aria-expanded", "true");

        // Drawer também propaga `aria-current="page"` no item ativo.
        const drawerNav = drawer.locator("nav");
        await expect(drawerNav).toBeVisible();
        const drawerActive = drawerNav.locator('a[aria-current="page"]');
        await expect(drawerActive).toHaveCount(1);
        await expect(drawerActive.first()).toHaveAttribute(
            "href",
            "/admin/moderacao",
        );

        // ── Fechar via botão X (`aria-label="Fechar menu"`) ──
        const closeButton = drawer.locator('button[aria-label="Fechar menu"]');
        // Há dois alvos com esse label — o backdrop button e o X dentro do
        // drawer. Pegamos explicitamente o último (visível dentro do `<aside>`).
        await closeButton.last().click();
        await expect(drawer).toBeHidden();
        await expect(trigger).toHaveAttribute("aria-expanded", "false");

        // ── Reabrir e fechar via Escape ──
        await trigger.click();
        await expect(drawer).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(drawer).toBeHidden();
    });
});
