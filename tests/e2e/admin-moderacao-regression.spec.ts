/**
 * Regression-light E2E — `/admin/moderacao` mantém invariantes de design
 * system após o refactor da Task 12.1.
 *
 * **Validates: Requirements 4.4, 4.5, 10.1, 10.7, 17.2** (Tabs com 1 ativo
 * único; `<Badge>` consumido para coluna de status do queue; nenhuma classe
 * Tailwind de paleta crua no DOM renderizado).
 *
 * Esta NÃO é uma suite de regressão visual com screenshots — é uma checagem
 * leve do DOM, alinhada ao que o Lint_Guard (Task 23.1) ainda fará estático.
 * Aqui validamos o DOM realmente entregue ao browser, capturando drift que
 * vier de sub-componentes server/client renderizados juntos da página.
 *
 * Asserções:
 *   1. O `[role="tablist"]` da página possui exatamente um link
 *      `aria-current="page"` (status filter Tabs em modo navegação por URL).
 *   2. Pelo menos um `<Badge>` renderiza dentro de `<tbody>` (coluna Status
 *      do queue de verificação).
 *   3. Nenhum elemento do DOM possui classes que casem com a regex de paleta
 *      Tailwind crua: `\b(bg|text|border|ring|from|to|via)-(zinc|amber|sky|
 *      emerald|fuchsia|indigo|rose|pink|purple|teal|lime|stone|slate|gray|
 *      neutral)-\d+\b`.
 *
 * ── Auth ──
 * Mesmo padrão de `admin-shell.spec.ts`: login real em `/entrar` com o admin
 * semeado por `prisma/seed.ts` (`admin@privello.com / Admin@privello2025`),
 * `requestSubmit()` para evitar o race em que o submit nativo do `<form>`
 * dispara antes do `handleSubmit` React (em Next 16/Turbopack dev). O helper
 * é duplicado aqui para manter o spec self-contained — extrair para
 * `tests/e2e/lib/` é refactor fora do escopo da Task 12.2.
 *
 * ── Project scoping ──
 * Roda apenas em `desktop-chrome` (mirror de `admin-shell.spec.ts`):
 * `ios-safari` aponta para origin não-secure por causa do spec
 * iOS-mobile-interactions-fix, e este teste não tem aspecto iOS-específico.
 */

import { test, expect, type Page } from "@playwright/test";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@privello.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "Admin@privello2025";

/** Regex de paleta Tailwind crua banida fora de `ui/` e `chart-tokens.ts`. */
const RAW_PALETTE_RE =
    /\b(bg|text|border|ring|from|to|via)-(zinc|amber|sky|emerald|fuchsia|indigo|rose|pink|purple|teal|lime|stone|slate|gray|neutral)-\d+\b/;

/**
 * Faz login como admin via `/entrar` e aguarda o redirect para
 * `/admin/moderacao`. Reusa a página corrente. Idêntico ao helper de
 * `admin-shell.spec.ts` (mantemos a duplicação intencional para manter o
 * spec autocontido — ver header-comment).
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

test.describe("/admin/moderacao — regression-light de design system (Task 12.2)", () => {
    test.beforeEach(async ({ }, testInfo) => {
        test.skip(
            testInfo.project.name !== "desktop-chrome",
            "Regression-light roda apenas em desktop-chrome (mirror do admin-shell smoke).",
        );
    });

    test("ARIA do Tabs, presença de <Badge> no tbody e DOM sem paleta crua", async ({
        page,
    }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await loginAsAdmin(page);

        // ── 1) Tabs: exatamente um link com aria-current="page" ─────────────
        // O Tabs em modo URL renderiza `<Link role="tab" aria-current="page">`
        // no item ativo. A página `/admin/moderacao` usa um único <Tabs>
        // com items contendo `href`, então a contagem global no [role=tablist]
        // alvo é 1.
        const tablist = page.locator('[role="tablist"]').first();
        await expect(tablist).toBeVisible();

        const tabs = tablist.locator('[role="tab"]');
        // Sanidade: ≥ 1 tab renderizado (a página define 6: pending, all,
        // NOVO, REVISAO, APROVADO, REJEITADO).
        const tabCount = await tabs.count();
        expect(tabCount).toBeGreaterThanOrEqual(2);

        const activeTab = tablist.locator('[role="tab"][aria-current="page"]');
        await expect(activeTab).toHaveCount(1);
        // Confirma também `aria-selected="true"` no ativo (invariante do Req 4.4).
        await expect(activeTab.first()).toHaveAttribute("aria-selected", "true");

        // ── 2) Badge no tbody ────────────────────────────────────────────────
        // O Badge primitive renderiza:
        //   <span class="inline-flex items-center gap-1 rounded-full
        //                px-2 py-[2px] text-xs font-semibold ...">
        // Na página, ele aparece na coluna Status de cada linha do queue.
        // Para isolar do badge `text-2xs` interno do Tabs (counter), filtramos
        // por `text-xs` + `font-semibold` + `rounded-full` dentro de <tbody>.
        const tbodyRows = page.locator("tbody tr");
        const rowCount = await tbodyRows.count();
        expect(
            rowCount,
            "queue da Task 12.1 deveria expor ao menos uma linha (seed cria casos NOVO/REVISAO).",
        ).toBeGreaterThan(0);

        const badges = page.locator(
            "tbody span.inline-flex.rounded-full.text-xs.font-semibold",
        );
        const badgeCount = await badges.count();
        expect(
            badgeCount,
            "ao menos um <Badge> deve renderizar na coluna Status do queue.",
        ).toBeGreaterThan(0);

        // ── 3) DOM sem classes Tailwind cruas de paleta ────────────────────
        // Varre todo `[class]` da página, captura matches da regex e falha
        // listando origem + classe ofensora. Tratamos `className` SVG como
        // `SVGAnimatedString.baseVal`.
        const violations = await page.evaluate((reSource: string) => {
            const re = new RegExp(reSource);
            const out: { tag: string; match: string; snippet: string }[] = [];
            const els = document.querySelectorAll<HTMLElement>("[class]");
            for (const el of els) {
                const cls = (el as unknown as { className: unknown }).className;
                let text = "";
                if (typeof cls === "string") {
                    text = cls;
                } else if (
                    cls &&
                    typeof (cls as { baseVal?: unknown }).baseVal === "string"
                ) {
                    text = (cls as { baseVal: string }).baseVal;
                }
                const m = text.match(re);
                if (m) {
                    out.push({
                        tag: el.tagName.toLowerCase(),
                        match: m[0],
                        snippet: text.slice(0, 160),
                    });
                }
            }
            return out;
        }, RAW_PALETTE_RE.source);

        expect(
            violations,
            `DOM contém classes Tailwind cruas de paleta — esperado vazio, recebido:\n${JSON.stringify(violations, null, 2)}`,
        ).toEqual([]);
    });
});
