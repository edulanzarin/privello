import { z } from "zod";

/** `POST /api/stories/like`. */
export const StoriesLikeBodySchema = z.object({
    storyId: z.string().cuid(),
});
export type StoriesLikeBody = z.infer<typeof StoriesLikeBodySchema>;

/** `POST /api/stories/view`. */
export const StoriesViewBodySchema = z.object({
    storyId: z.string().cuid(),
});
export type StoriesViewBody = z.infer<typeof StoriesViewBodySchema>;
