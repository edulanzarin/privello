import { z } from "zod";

/**
 * `POST /api/upload`.
 *
 * Validação de MIME/tamanho permanece no handler (ver `endpoints-zod.md > §4.1`).
 * O schema aqui só garante shape do `FormData` parseado: existência do `file`
 * e coerção dos campos textuais.
 */
export const UploadBodySchema = z.object({
    file: z.instanceof(File),
    isPublic: z.coerce.boolean().default(true),
    caption: z.string().trim().max(500).nullable().optional(),
    mediaType: z.enum(["IMAGE", "VIDEO", "REEL"]).default("IMAGE"),
    purpose: z.enum(["", "story"]).optional(),
});
export type UploadBody = z.infer<typeof UploadBodySchema>;

/** `POST /api/upload/verification`. */
export const UploadVerificationBodySchema = z.object({
    file: z.instanceof(File),
});
export type UploadVerificationBody = z.infer<typeof UploadVerificationBodySchema>;

/** `POST /api/upload-audio`. */
export const UploadAudioBodySchema = z.object({
    file: z.instanceof(File),
});
export type UploadAudioBody = z.infer<typeof UploadAudioBodySchema>;
