// src/lib/services/reels.service.test.ts
//
// Wave 7.6 (Requirement 5.2) — paridade pre/post migração de `listReels`.
// Cursor pagination + filtragem por cityId/profileId + lock de privados
// para não-assinantes/não-donos.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        media: { findMany: vi.fn() },
    },
}));

import { prisma } from "@/lib/prisma";
import { listReels } from "./reels.service";

const mocked = prisma as unknown as {
    media: { findMany: ReturnType<typeof vi.fn> };
};

beforeEach(() => {
    mocked.media.findMany.mockReset();
});

const baseReel = (id: string, isPublic = true, profileOverride: Record<string, unknown> = {}) => ({
    id,
    url: `url-${id}`,
    caption: `cap-${id}`,
    isPublic,
    createdAt: new Date(),
    profile: {
        id: "prof-1",
        slug: "prof-1",
        displayName: "Prof",
        city: { name: "City", slug: "city" },
        media: [{ url: "cover" }],
        ...profileOverride,
    },
    _count: { likes: 0, comments: 0 },
    likes: [],
});

describe("listReels", () => {
    it("emite mediaType REEL, take = limit + 1, orderBy createdAt desc", async () => {
        mocked.media.findMany.mockResolvedValue([baseReel("r1")]);
        await listReels({ limit: 5 });
        const args = mocked.media.findMany.mock.calls[0]?.[0] as {
            where: { mediaType: string };
            take: number;
            orderBy: { createdAt: "desc" };
        };
        expect(args.where.mediaType).toBe("REEL");
        expect(args.take).toBe(6);
        expect(args.orderBy).toEqual({ createdAt: "desc" });
    });

    it("usa cursor.id e skip 1 quando cursor é fornecido", async () => {
        mocked.media.findMany.mockResolvedValue([]);
        await listReels({ cursor: "abc", limit: 3 });
        const args = mocked.media.findMany.mock.calls[0]?.[0] as {
            cursor?: { id: string };
            skip?: number;
        };
        expect(args.cursor).toEqual({ id: "abc" });
        expect(args.skip).toBe(1);
    });

    it("hasMore=true quando retorna limit+1, e descarta o último", async () => {
        const items = [baseReel("a"), baseReel("b"), baseReel("c"), baseReel("d")];
        mocked.media.findMany.mockResolvedValue(items);
        const out = await listReels({ limit: 3 });
        expect(out.hasMore).toBe(true);
        expect(out.reels).toHaveLength(3);
        expect(out.nextCursor).toBe("c");
    });

    it("hasMore=false e nextCursor=null quando retorna ≤ limit", async () => {
        mocked.media.findMany.mockResolvedValue([baseReel("a"), baseReel("b")]);
        const out = await listReels({ limit: 3 });
        expect(out.hasMore).toBe(false);
        expect(out.nextCursor).toBeNull();
    });

    it("reel privado fica locked=true para viewer não-assinante e não-dono", async () => {
        mocked.media.findMany.mockResolvedValue([baseReel("r1", false)]);
        const out = await listReels({ limit: 1, viewerIsSubscriber: false });
        expect(out.reels[0].isPrivate).toBe(true);
        expect(out.reels[0].isLocked).toBe(true);
        expect(out.reels[0].url).toBe("");
        expect(out.reels[0].caption).toBeNull();
    });

    it("reel privado NÃO fica locked para o dono (ownerId === profile.id)", async () => {
        mocked.media.findMany.mockResolvedValue([baseReel("r1", false)]);
        const out = await listReels({
            limit: 1,
            viewerIsSubscriber: false,
            ownerId: "prof-1",
        });
        expect(out.reels[0].isLocked).toBe(false);
        expect(out.reels[0].url).toBe("url-r1");
    });

    it("reel privado NÃO fica locked para assinante", async () => {
        mocked.media.findMany.mockResolvedValue([baseReel("r1", false)]);
        const out = await listReels({ limit: 1, viewerIsSubscriber: true });
        expect(out.reels[0].isLocked).toBe(false);
    });
});
