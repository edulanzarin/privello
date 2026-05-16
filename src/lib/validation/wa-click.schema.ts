import { z } from "zod";

/** `POST /api/wa-click`. */
export const WaClickBodySchema = z.object({
    profileId: z.string().cuid(),
    source: z.string().trim().max(50).default("perfil"),
});
export type WaClickBody = z.infer<typeof WaClickBodySchema>;
