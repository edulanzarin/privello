import { z } from "zod";

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]*$/;

/** Linha de duração coletada em `OnboardingValoresSchema`. */
const DurationOptionSchema = z.object({
    minutes: z.number().int().min(15).max(2880),
    label: z.string().trim().max(120).optional(),
    priceBrl: z.number().int().min(1),
    enabled: z.boolean().default(true),
});

export const OnboardingPerfilSchema = z.object({
    cityQuery: z.string().trim().min(1).max(120),
    citySlug: z.string().trim().toLowerCase().regex(SLUG_REGEX),
    bio: z.string().trim().min(1).max(2000),
    tagline: z.string().trim().max(160).optional(),
    whatsappPhone: z.string().trim().max(40).optional(),
    heightCm: z.coerce.number().int().min(120).max(230).optional(),
    dressSize: z.string().trim().max(20).optional(),
    hair: z.string().trim().max(40).optional(),
    eyes: z.string().trim().max(40).optional(),
    languages: z.string().trim().max(200).optional(),
    servesMen: z.coerce.boolean().default(false),
    servesWomen: z.coerce.boolean().default(false),
    servesCouples: z.coerce.boolean().default(false),
    hasOwnPlace: z.coerce.boolean().default(false),
    homeVisit: z.coerce.boolean().default(false),
    travelsNational: z.coerce.boolean().default(false),
    travelsInternational: z.coerce.boolean().default(false),
    _from: z.string().trim().max(120).optional(),
});
export type OnboardingPerfil = z.infer<typeof OnboardingPerfilSchema>;

export const AddPhotoByUrlSchema = z.object({
    url: z.string().url(),
    isPublic: z.coerce.boolean().default(true),
});
export type AddPhotoByUrl = z.infer<typeof AddPhotoByUrlSchema>;

export const RemovePhotoSchema = z.object({
    mediaId: z.string().cuid(),
});
export type RemovePhoto = z.infer<typeof RemovePhotoSchema>;

export const SetCoverPhotoSchema = z.object({
    mediaId: z.string().cuid(),
});
export type SetCoverPhoto = z.infer<typeof SetCoverPhotoSchema>;

export const UpdateMediaCaptionSchema = z.object({
    mediaId: z.string().cuid(),
    caption: z.string().trim().max(500),
});
export type UpdateMediaCaption = z.infer<typeof UpdateMediaCaptionSchema>;

/**
 * Schema de valores no onboarding. Recebe a lista já coletada das tuplas
 * `(key, enabled, priceBrl, label?)` que o action constrói a partir do
 * `FormData` (campos `enabled_<key>` e `price_<key>`). Validação básica
 * exige ao menos uma duração habilitada com preço ≥ 1.
 */
export const OnboardingValoresSchema = z.object({
    paymentMethods: z.string().trim().max(500).optional(),
    durations: z
        .array(DurationOptionSchema)
        .refine((arr) => arr.some((d) => d.enabled), {
            message: "Selecione ao menos uma duração",
        }),
});
export type OnboardingValores = z.infer<typeof OnboardingValoresSchema>;
