import { z } from "zod";

/** `GET /api/reels` — query parametrizada. */
export const ReelsQuerySchema = z.object({
    cityId: z.string().cuid().optional(),
    profileId: z.string().cuid().optional(),
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(10),
});
export type ReelsQuery = z.infer<typeof ReelsQuerySchema>;
