import { z } from "zod";

export const TrackProfileViewSchema = z.object({
    profileId: z.string().cuid(),
});
export type TrackProfileView = z.infer<typeof TrackProfileViewSchema>;
