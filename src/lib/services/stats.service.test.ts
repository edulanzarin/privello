// src/lib/services/stats.service.test.ts
//
// Wave 7.1 (Requirement 5.2) — paridade pre/post migração para
// `getPlatformStats` e `getHotPeriodStart`. Como ambas são puras
// reorganizações sem mudança de comportamento, testamos paridade
// estrutural: o service novo deve emitir EXATAMENTE as mesmas
// chamadas Prisma (mesmo método, mesmos args) que o oráculo em
// `src/lib/queries.ts`, e produzir o mesmo retorno para os mesmos
// inputs mockados.

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock unificado do prisma client. Cada chamada é capturada.
vi.mock("@/lib/prisma", () => {
    const mock = {
        prisma: {
            profile: { count: vi.fn() },
            city: { count: vi.fn() },
            hotPeriodConfig: { findUnique: vi.fn() },
        },
    };
    return mock;
});

import { prisma } from "@/lib/prisma";
import * as oracle from "@/lib/queries";
import * as svc from "./stats.service";

const mocked = prisma as unknown as {
    profile: { count: ReturnType<typeof vi.fn> };
    city: { count: ReturnType<typeof vi.fn> };
    hotPeriodConfig: { findUnique: ReturnType<typeof vi.fn> };
};

beforeEach(() => {
    mocked.profile.count.mockReset();
    mocked.city.count.mockReset();
    mocked.hotPeriodConfig.findUnique.mockReset();
});

describe("stats.service.getPlatformStats — paridade com queries.getPlatformStats", () => {
    it("emite as mesmas 3 chamadas Prisma (count profile, count profile verified, count city)", async () => {
        mocked.profile.count.mockResolvedValue(0);
        mocked.city.count.mockResolvedValue(0);

        await oracle.getPlatformStats();
        const oracleCalls = [
            ...mocked.profile.count.mock.calls,
            ...mocked.city.count.mock.calls,
        ];

        mocked.profile.count.mockReset();
        mocked.city.count.mockReset();
        mocked.profile.count.mockResolvedValue(0);
        mocked.city.count.mockResolvedValue(0);

        await svc.getPlatformStats();
        const svcCalls = [
            ...mocked.profile.count.mock.calls,
            ...mocked.city.count.mock.calls,
        ];

        expect(svcCalls).toEqual(oracleCalls);
    });

    it("retorna o mesmo shape com profiles=10 verified=4 cities=3", async () => {
        const setup = () => {
            mocked.profile.count.mockReset();
            mocked.city.count.mockReset();
            // ordem: count() / count({where: verified}) / city.count()
            mocked.profile.count.mockResolvedValueOnce(10).mockResolvedValueOnce(4);
            mocked.city.count.mockResolvedValue(3);
        };
        setup();
        const a = await oracle.getPlatformStats();
        setup();
        const b = await svc.getPlatformStats();
        expect(b).toEqual(a);
        expect(b).toEqual({ profiles: 10, verified: 4, cities: 3, verifiedPct: 40 });
    });

    it("verifiedPct === 0 quando profiles === 0 (não divide por zero)", async () => {
        mocked.profile.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
        mocked.city.count.mockResolvedValue(0);
        const out = await svc.getPlatformStats();
        expect(out.verifiedPct).toBe(0);
    });
});

describe("stats.service.getHotPeriodStart — paridade com queries.getHotPeriodStart", () => {
    it("emite a mesma chamada hotPeriodConfig.findUnique({ where: { id: 'hot' } })", async () => {
        mocked.hotPeriodConfig.findUnique.mockResolvedValue(null);
        await oracle.getHotPeriodStart();
        const oracleArgs = mocked.hotPeriodConfig.findUnique.mock.calls[0];

        mocked.hotPeriodConfig.findUnique.mockReset();
        mocked.hotPeriodConfig.findUnique.mockResolvedValue(null);
        await svc.getHotPeriodStart();
        const svcArgs = mocked.hotPeriodConfig.findUnique.mock.calls[0];

        expect(svcArgs).toEqual(oracleArgs);
    });

    it("retorna `startedAt` quando registro existe, `null` quando não existe", async () => {
        const date = new Date("2026-05-10T00:00:00Z");
        mocked.hotPeriodConfig.findUnique.mockResolvedValueOnce({ id: "hot", startedAt: date });
        await expect(svc.getHotPeriodStart()).resolves.toEqual(date);

        mocked.hotPeriodConfig.findUnique.mockResolvedValueOnce(null);
        await expect(svc.getHotPeriodStart()).resolves.toBeNull();
    });
});
