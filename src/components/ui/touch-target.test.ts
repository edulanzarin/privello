// @vitest-environment jsdom

/**
 * Teste de touch target (Requirement 12.1, 12.2 — Property 1).
 *
 * Caminho: src/components/ui/touch-target.test.ts
 *
 * Objetivo: garantir que `Button` (size sm/md) e cada item de `Tabs`
 * renderizam controles com hit area ≥ 44×44px (WCAG 2.5.5).
 *
 * Por que checagem por classe e não `getBoundingClientRect()`?
 * - jsdom não executa layout do CSS: `getBoundingClientRect()` retorna `0`
 *   para qualquer elemento sem inline-style ou layout shim. Asserir width/
 *   height por bounding rect daria falsos negativos.
 * - A garantia de touch target é estática nos primitivos: a base aplica
 *   `min-h-[44px] min-w-[44px]` em todas as variantes/sizes. A regressão
 *   real seria alguém remover essas classes — exatamente o que este teste
 *   detecta.
 * - Como sanity extra, parseamos a classe `min-h-[Npx]` / `min-w-[Npx]`
 *   para confirmar `N ≥ 44`. Isso protege contra alguém trocar para
 *   `min-h-[40px]` (que ainda casaria um regex frouxo).
 *
 * Cross-refs:
 * - .kiro/specs/redesign-macos-system/tasks.md — task 7.5.
 * - .kiro/specs/redesign-macos-system/requirements.md — Requirements 12.1, 12.2.
 * - .kiro/specs/redesign-macos-system/design.md — Property 1.
 */

import { describe, it, expect, afterEach } from "vitest";
import { createElement } from "react";
import { render, cleanup } from "@testing-library/react";

import { Button } from "./button";
import { Tabs, type TabItem } from "./tabs";

afterEach(() => {
    cleanup();
});

const MIN_TOUCH_TARGET_PX = 44;

/**
 * Extrai o valor numérico de uma utility do tipo `min-h-[Npx]` ou
 * `min-w-[Npx]` presente em `classList`. Retorna `null` se nenhuma utility
 * desse formato existir — neste teste isso é uma falha intencional.
 */
function extractMinSizePx(
    classList: DOMTokenList,
    axis: "min-h" | "min-w",
): number | null {
    // Aceita `min-h-[44px]`, `min-w-[48px]` etc. Apenas px arbitrário —
    // basta cobrir o que os primitivos do design system emitem hoje.
    const re = new RegExp(`^${axis}-\\[(\\d+)px\\]$`);
    for (const cls of classList) {
        const m = cls.match(re);
        if (m) return Number.parseInt(m[1], 10);
    }
    return null;
}

function assertTouchTarget(el: Element, label: string) {
    const minH = extractMinSizePx(el.classList, "min-h");
    const minW = extractMinSizePx(el.classList, "min-w");

    expect(minH, `${label}: min-height utility ausente`).not.toBeNull();
    expect(minW, `${label}: min-width utility ausente`).not.toBeNull();
    expect(
        minH!,
        `${label}: min-height ${minH}px < ${MIN_TOUCH_TARGET_PX}px`,
    ).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX);
    expect(
        minW!,
        `${label}: min-width ${minW}px < ${MIN_TOUCH_TARGET_PX}px`,
    ).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX);
}

describe("Touch target ≥ 44×44 — Button", () => {
    it("size=\"sm\" garante hit area de 44×44 via min-h/min-w", () => {
        const { getByRole } = render(
            createElement(Button, { size: "sm" }, "Salvar"),
        );
        const btn = getByRole("button", { name: "Salvar" });
        assertTouchTarget(btn, 'Button size="sm"');
    });

    it("size=\"md\" garante hit area de 44×44 via min-h/min-w", () => {
        const { getByRole } = render(
            createElement(Button, { size: "md" }, "Confirmar"),
        );
        const btn = getByRole("button", { name: "Confirmar" });
        assertTouchTarget(btn, 'Button size="md"');
    });

    it("size=\"lg\" também atende ao alvo (sanity)", () => {
        const { getByRole } = render(
            createElement(Button, { size: "lg" }, "Continuar"),
        );
        const btn = getByRole("button", { name: "Continuar" });
        assertTouchTarget(btn, 'Button size="lg"');
    });
});

describe("Touch target ≥ 44×44 — Tabs", () => {
    const items: TabItem[] = [
        { key: "novo", label: "Novo" },
        { key: "revisao", label: "Revisão", badge: 3 },
        { key: "aprovado", label: "Aprovado" },
    ];

    it("variant=\"pills\" — todos os tabs garantem hit area ≥ 44×44", () => {
        const { getAllByRole } = render(
            createElement(Tabs, {
                items,
                activeKey: "novo",
                variant: "pills",
                size: "sm",
                onChange: () => { },
            }),
        );
        const tabs = getAllByRole("tab");
        expect(tabs).toHaveLength(items.length);
        for (const [i, tab] of tabs.entries()) {
            assertTouchTarget(tab, `Tabs[pills] item #${i} (${items[i].key})`);
        }
    });

    it("variant=\"underline\" — todos os tabs garantem hit area ≥ 44×44", () => {
        const { getAllByRole } = render(
            createElement(Tabs, {
                items,
                activeKey: "revisao",
                variant: "underline",
                size: "md",
                onChange: () => { },
            }),
        );
        const tabs = getAllByRole("tab");
        expect(tabs).toHaveLength(items.length);
        for (const [i, tab] of tabs.entries()) {
            assertTouchTarget(tab, `Tabs[underline] item #${i} (${items[i].key})`);
        }
    });

    it("modo navegação por URL (item.href) também atende ao alvo", () => {
        const linkItems: TabItem[] = [
            { key: "queue", label: "Fila", href: "/admin/moderacao?tab=queue" },
            { key: "done", label: "Concluídas", href: "/admin/moderacao?tab=done" },
        ];
        const { getAllByRole } = render(
            createElement(Tabs, {
                items: linkItems,
                activeKey: "queue",
                variant: "pills",
                size: "sm",
            }),
        );
        const tabs = getAllByRole("tab");
        expect(tabs).toHaveLength(linkItems.length);
        for (const [i, tab] of tabs.entries()) {
            // Em modo Link, cada tab é um <a> — mesmas classes-base.
            expect(tab.tagName).toBe("A");
            assertTouchTarget(tab, `Tabs[link] item #${i} (${linkItems[i].key})`);
        }
    });
});
