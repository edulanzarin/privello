import { z } from "zod";

export const CreateStorySchema = z.object({
    mediaUrl: z.string().url(),
    caption: z.string().trim().max(500).nullable().optional(),
    mediaType: z.enum(["IMAGE", "VIDEO"]).default("IMAGE"),
});
export type CreateStory = z.infer<typeof CreateStorySchema>;

export const DeleteStorySchema = z.object({
    storyId: z.string().cuid(),
});
export type DeleteStory = z.infer<typeof DeleteStorySchema>;

/** Variante usada em `painel/_actions/provider-settings.ts`. */
export const PainelCreateStorySchema = z.object({
    mediaUrl: z.string().url(),
    caption: z.string().trim().max(500).nullable().optional(),
});
export type PainelCreateStory = z.infer<typeof PainelCreateStorySchema>;

export const PainelDeleteStorySchema = z.object({
    storyId: z.string().cuid(),
});
export type PainelDeleteStory = z.infer<typeof PainelDeleteStorySchema>;
