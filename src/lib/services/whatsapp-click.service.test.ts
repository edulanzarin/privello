// src/lib/services/whatsapp-click.service.test.ts
//
// Wave 7.3 (Requirement 5.2) — paridade pre/post migração para
// `listWhatsAppClicksRecent` e `countWhatsAppClicksToday`. Migração foi
// pura reorganização (mesma chamada Prisma); o teste captura os args e
// confirma o shape.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        whatsAppClick: {
            findMany: vi.fn(),
            count: vi.fn(),
        },
    },
}));

import { prisma } from "@/lib/prisma";
import {
    listWhatsAppClicksRecent,
    countWhatsAppClicksToday,
} from "./whatsapp-click.service";

const mocked = prisma as unknown as {
    whatsAppClick: {
        findMany: ReturnType<typeof vi.fn>;
        count: ReturnType<typeof vi.fn>;
    };
};

beforeEach(() => {
    mocked.whatsAppClick.findMany.mockReset();
    mocked.whatsAppClick.count.mockReset();
});

describe("listWhatsAppClicksRecent", () => {
    it("emite findMany com where.profileId, orderBy clickedAt desc e take", async () => {
        mocked.whatsAppClick.findMany.mockResolvedValue([]);
        await listWhatsAppClicksRecent("p1", 5);
        expect(mocked.whatsAppClick.findMany).toHaveBeenCalledWith({
            where: { profileId: "p1" },
            orderBy: { clickedAt: "desc" },
            take: 5,
        });
    });

    it("default take = 8", async () => {
        mocked.whatsAppClick.findMany.mockResolvedValue([]);
        await listWhatsAppClicksRecent("p1");
        expect(mocked.whatsAppClick.findMany).toHaveBeenCalledWith({
            where: { profileId: "p1" },
            orderBy: { clickedAt: "desc" },
            take: 8,
        });
    });
});

describe("countWhatsAppClicksToday", () => {
    it("emite count com clickedAt >= meia-noite local de hoje", async () => {
        mocked.whatsAppClick.count.mockResolvedValue(7);
        const out = await countWhatsAppClicksToday("p1");
        expect(out).toBe(7);

        const args = mocked.whatsAppClick.count.mock.calls[0]?.[0] as {
            where: { profileId: string; clickedAt: { gte: Date } };
        };
        expect(args.where.profileId).toBe("p1");
        const start = args.where.clickedAt.gte;
        expect(start.getHours()).toBe(0);
        expect(start.getMinutes()).toBe(0);
        expect(start.getSeconds()).toBe(0);
        expect(start.getMilliseconds()).toBe(0);
    });
});
