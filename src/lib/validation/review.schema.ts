import { z } from "zod";

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]*$/;

/** `POST /api/review`. */
export const ReviewBodySchema = z.object({
    profileSlug: z.string().trim().toLowerCase().regex(SLUG_REGEX),
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().max(1000).nullable().optional(),
});
export type ReviewBody = z.infer<typeof ReviewBodySchema>;
