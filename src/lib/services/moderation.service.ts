// src/lib/services/moderation.service.ts
//
// Wave 7.7 (Requirement 5.2) — `listModerationQueue` migrado de
// `src/lib/queries.ts` sem mudança de comportamento.

import { prisma } from "@/lib/prisma";

export async function listModerationQueue() {
    return prisma.verificationCase.findMany({
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
}
