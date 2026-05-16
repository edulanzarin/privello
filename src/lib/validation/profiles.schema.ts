import { z } from "zod";

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]*$/;

/** `GET /api/profiles/check?slug=...`. */
export const ProfilesCheckQuerySchema = z.object({
    slug: z.string().trim().toLowerCase().regex(SLUG_REGEX),
});
export type ProfilesCheckQuery = z.infer<typeof ProfilesCheckQuerySchema>;

/** `GET /api/profiles/section?type=...&offset=...`. */
export const ProfilesSectionQuerySchema = z.object({
    type: z.enum(["hot", "boosted"]),
    offset: z.coerce.number().int().min(0).default(0),
});
export type ProfilesSectionQuery = z.infer<typeof ProfilesSectionQuerySchema>;
