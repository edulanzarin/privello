import { z } from "zod";

const SLUG_REGEX_FULL = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

/**
 * Upload do avatar do cliente. Checks de MIME/size existentes no handler
 * permanecem (Tarefa 4.4 não duplica validação de mídia em Zod).
 */
export const UploadClientAvatarSchema = z.object({
    avatar: z.instanceof(File),
});
export type UploadClientAvatar = z.infer<typeof UploadClientAvatarSchema>;

export const UpdateClientNameSchema = z.object({
    name: z.string().trim().min(2).max(60),
});
export type UpdateClientName = z.infer<typeof UpdateClientNameSchema>;

export const UpdateClientSlugSchema = z.object({
    slug: z.string().trim().toLowerCase().regex(SLUG_REGEX_FULL).min(3).max(30),
});
export type UpdateClientSlug = z.infer<typeof UpdateClientSlugSchema>;
