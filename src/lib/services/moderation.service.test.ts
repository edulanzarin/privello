// src/lib/services/moderation.service.test.ts
//
// Wave 7.7 (Requirement 5.2) — paridade pre/post de `listModerationQueue`.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        verificationCase: { findMany: vi.fn() },
    },
}));

import { prisma } from "@/lib/prisma";
import { listModerationQueue } from "./moderation.service";

const mocked = prisma as unknown as {
    verificationCase: { findMany: ReturnType<typeof vi.fn> };
};

beforeEach(() => {
    mocked.verificationCase.findMany.mockReset();
});

describe("listModerationQueue", () => {
    it("emite findMany com take 80, orderBy waitingSince asc e profile include", async () => {
        mocked.verificationCase.findMany.mockResolvedValue([]);
        await listModerationQueue();
        expect(mocked.verificationCase.findMany).toHaveBeenCalledWith({
            orderBy: { waitingSince: "asc" },
            take: 80,
            include: {
                profile: {
                    include: {
                        city: { select: { name: true } },
                        district: { select: { name: true } },
                        media: {
                            take: 1,
                            orderBy: { sortOrder: "asc" },
                            select: { url: true },
                        },
                    },
                },
            },
        });
    });
});
