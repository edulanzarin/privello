import { z } from "zod";

export const GiveWarningSchema = z.object({
    profileId: z.string().cuid(),
    reason: z.string().trim().min(1).max(500),
});
export type GiveWarning = z.infer<typeof GiveWarningSchema>;

export const SuspendProfileSchema = z.object({
    profileId: z.string().cuid(),
    note: z.string().trim().max(500),
});
export type SuspendProfile = z.infer<typeof SuspendProfileSchema>;

export const UnsuspendProfileSchema = z.object({
    profileId: z.string().cuid(),
});
export type UnsuspendProfile = z.infer<typeof UnsuspendProfileSchema>;

export const DeleteAdminMediaSchema = z.object({
    mediaId: z.string().cuid(),
});
export type DeleteAdminMedia = z.infer<typeof DeleteAdminMediaSchema>;

export const ToggleMediaVisibilitySchema = z.object({
    mediaId: z.string().cuid(),
});
export type ToggleMediaVisibility = z.infer<typeof ToggleMediaVisibilitySchema>;
