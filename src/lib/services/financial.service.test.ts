// src/lib/services/financial.service.test.ts
//
// Wave 7.5 (Requirement 5.2) — paridade pre/post migração de
// `listFinancialRecordsForMonth`. Migração pura (mesma chamada Prisma).

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        financialRecord: { findMany: vi.fn() },
    },
}));

import { prisma } from "@/lib/prisma";
import { listFinancialRecordsForMonth } from "./financial.service";

const mocked = prisma as unknown as {
    financialRecord: { findMany: ReturnType<typeof vi.fn> };
};

beforeEach(() => {
    mocked.financialRecord.findMany.mockReset();
});

describe("listFinancialRecordsForMonth", () => {
    it("monta janela [start, end] do mês com orderBy occurredAt desc", async () => {
        mocked.financialRecord.findMany.mockResolvedValue([]);
        await listFinancialRecordsForMonth("p1", 2026, 5);
        const args = mocked.financialRecord.findMany.mock.calls[0]?.[0] as {
            where: { profileId: string; occurredAt: { gte: Date; lte: Date } };
            orderBy: { occurredAt: "desc" };
        };
        expect(args.where.profileId).toBe("p1");
        // Janela: 2026-05-01 00:00:00.000 → 2026-05-31 23:59:59.999 (local)
        expect(args.where.occurredAt.gte).toEqual(new Date(2026, 4, 1));
        expect(args.where.occurredAt.lte).toEqual(new Date(2026, 5, 0, 23, 59, 59, 999));
        expect(args.orderBy).toEqual({ occurredAt: "desc" });
    });

    it("fevereiro com ano bissexto detectado pelo construtor Date(year, month, 0)", async () => {
        mocked.financialRecord.findMany.mockResolvedValue([]);
        await listFinancialRecordsForMonth("p1", 2024, 2);
        const args = mocked.financialRecord.findMany.mock.calls[0]?.[0] as {
            where: { occurredAt: { gte: Date; lte: Date } };
        };
        // 2024 é bissexto: 29 dias.
        expect(args.where.occurredAt.lte.getDate()).toBe(29);
    });
});
