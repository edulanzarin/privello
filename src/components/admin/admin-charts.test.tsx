// @vitest-environment jsdom

/**
 * Teste unit do `ChartCard` (recipe interna) e fallback de empty state.
 *
 * Caminho: src/components/admin/admin-charts.test.tsx
 *
 * Objetivo: cobrir os 4 charts públicos exportados por
 * `src/components/admin/admin-charts.tsx` (`ProfilesChart`, `MediaChart`,
 * `SubscriptionsChart`, `ReelsChart`) garantindo:
 *   1. Render do título canônico (ex.: "Novos perfis · 30 dias") com data não vazia.
 *   2. Fallback `<EmptyState>` (título "Sem dados no período.") com `data=[]`.
 *   3. Wrapper externo carrega a assinatura visual do `<Card variant="solid">`
 *      (`bg-white` + `rounded-2xl` + `border-black/[0.06]` + `p-5`).
 *
 * Por que mockar `recharts`?
 * - jsdom não roda layout, então `ResponsiveContainer` mede 0×0 e emite
 *   warnings barulhentos. Substituímos apenas o `ResponsiveContainer` por um
 *   `<div>` passthrough — o resto do recharts (Bar, AreaChart etc.) continua
 *   real e renderiza SVG inerte. Isto é suficiente para verificar a recipe
 *   `ChartCard` (título + empty state + wrapper Card), que é o foco do task.
 *
 * Cross-refs:
 * - .kiro/specs/redesign-macos-system/tasks.md — task 18.2.
 * - .kiro/specs/redesign-macos-system/requirements.md — Requirement 3.7.
 * - src/components/admin/admin-charts.tsx — recipe `ChartCard`.
 * - src/components/ui/card.tsx — variante `solid`.
 * - src/components/ui/empty-state.tsx — título "Sem dados no período.".
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("recharts", async () => {
    const actual = await vi.importActual<typeof import("recharts")>("recharts");
    return {
        ...actual,
        // Substitui ResponsiveContainer por passthrough — evita warnings de 0×0
        // em jsdom sem mascarar o restante do pipeline de render.
        ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
            <div data-testid="rc-mock">{children}</div>
        ),
    };
});

import {
    MediaChart,
    ProfilesChart,
    ReelsChart,
    SubscriptionsChart,
} from "./admin-charts";

afterEach(() => {
    cleanup();
});

const SAMPLE_DAY = [
    { date: "2025-01-01", count: 3 },
    { date: "2025-01-02", count: 5 },
    { date: "2025-01-03", count: 2 },
];

const SAMPLE_WEEK = [
    { week: "S1", count: 12 },
    { week: "S2", count: 18 },
];

const EMPTY_TITLE = "Sem dados no período.";

/**
 * Recupera o wrapper externo (Card) a partir de um nó interno do chart.
 * O `ChartCard` renderiza `<Card variant="solid" padding="md">` na raiz,
 * então o ancestral mais externo dentro do mountNode é o Card.
 */
function getWrapperCard(container: HTMLElement): HTMLElement {
    const el = container.firstElementChild as HTMLElement | null;
    expect(el, "wrapper Card ausente no container").not.toBeNull();
    return el!;
}

function assertSolidCardSignature(el: HTMLElement) {
    const cls = el.className;
    expect(cls).toContain("bg-white");
    expect(cls).toContain("rounded-2xl");
    expect(cls).toContain("border-black/[0.06]");
    // padding="md" → p-5
    expect(cls).toContain("p-5");
}

describe("admin-charts — ProfilesChart", () => {
    it("renderiza título canônico com data não vazia", () => {
        const { container } = render(<ProfilesChart data={SAMPLE_DAY} />);
        expect(screen.getByText("Novos perfis · 30 dias")).toBeDefined();
        // Empty state NÃO deve aparecer quando há dados.
        expect(screen.queryByText(EMPTY_TITLE)).toBeNull();
        // Sanity: o wrapper renderizado tem assinatura do Card variant="solid".
        assertSolidCardSignature(getWrapperCard(container));
    });

    it("renderiza EmptyState quando data=[]", () => {
        render(<ProfilesChart data={[]} />);
        // Título do chart continua presente (acima do empty state).
        expect(screen.getByText("Novos perfis · 30 dias")).toBeDefined();
        expect(screen.getByText(EMPTY_TITLE)).toBeDefined();
    });
});

describe("admin-charts — MediaChart", () => {
    it("renderiza título canônico com data não vazia", () => {
        const { container } = render(<MediaChart data={SAMPLE_DAY} />);
        expect(screen.getByText("Mídias postadas · 30 dias")).toBeDefined();
        expect(screen.queryByText(EMPTY_TITLE)).toBeNull();
        assertSolidCardSignature(getWrapperCard(container));
    });

    it("renderiza EmptyState quando data=[]", () => {
        render(<MediaChart data={[]} />);
        expect(screen.getByText("Mídias postadas · 30 dias")).toBeDefined();
        expect(screen.getByText(EMPTY_TITLE)).toBeDefined();
    });
});

describe("admin-charts — SubscriptionsChart", () => {
    it("renderiza título canônico com data não vazia", () => {
        const { container } = render(<SubscriptionsChart data={SAMPLE_WEEK} />);
        expect(screen.getByText("Assinaturas ativas · 8 semanas")).toBeDefined();
        expect(screen.queryByText(EMPTY_TITLE)).toBeNull();
        assertSolidCardSignature(getWrapperCard(container));
    });

    it("renderiza EmptyState quando data=[]", () => {
        render(<SubscriptionsChart data={[]} />);
        expect(screen.getByText("Assinaturas ativas · 8 semanas")).toBeDefined();
        expect(screen.getByText(EMPTY_TITLE)).toBeDefined();
    });
});

describe("admin-charts — ReelsChart", () => {
    it("renderiza título canônico com data não vazia", () => {
        const { container } = render(<ReelsChart data={SAMPLE_DAY} />);
        expect(screen.getByText("Reels postados · 30 dias")).toBeDefined();
        expect(screen.queryByText(EMPTY_TITLE)).toBeNull();
        assertSolidCardSignature(getWrapperCard(container));
    });

    it("renderiza EmptyState quando data=[]", () => {
        render(<ReelsChart data={[]} />);
        expect(screen.getByText("Reels postados · 30 dias")).toBeDefined();
        expect(screen.getByText(EMPTY_TITLE)).toBeDefined();
    });
});
