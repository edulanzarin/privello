import { z } from "zod";

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]*$/;

/** `GET /api/cities/[slug]/bairros`. */
export const BairrosParamsSchema = z.object({
    slug: z.string().trim().toLowerCase().regex(SLUG_REGEX),
});
export type BairrosParams = z.infer<typeof BairrosParamsSchema>;
