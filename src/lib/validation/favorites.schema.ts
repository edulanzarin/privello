import { z } from "zod";

export const ToggleFavoriteSchema = z.object({
    profileId: z.string().cuid(),
});
export type ToggleFavorite = z.infer<typeof ToggleFavoriteSchema>;

export const GetFavoriteStatusSchema = z.object({
    profileId: z.string().cuid(),
});
export type GetFavoriteStatus = z.infer<typeof GetFavoriteStatusSchema>;
