import { z } from "zod";

export const CreateReelSchema = z.object({
    url: z.string().url(),
    caption: z.string().trim().max(500).nullable().optional(),
    isPrivate: z.coerce.boolean().default(false),
});
export type CreateReel = z.infer<typeof CreateReelSchema>;

export const DeleteReelSchema = z.object({
    mediaId: z.string().cuid(),
});
export type DeleteReel = z.infer<typeof DeleteReelSchema>;

export const ToggleReelPrivacySchema = z.object({
    mediaId: z.string().cuid(),
});
export type ToggleReelPrivacy = z.infer<typeof ToggleReelPrivacySchema>;
