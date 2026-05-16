import { z } from "zod";

/** Regex slug (URL-safe lowercase), espelho do que o action usa hoje. */
const SLUG_REGEX = /^[a-z0-9][a-z0-9-]*$/;

/** Documentos de identidade aceitos no signup de provider. */
const DOCUMENT_TYPE = z.enum(["RG", "CNH", "PASSAPORTE"]).default("RG");

/** Linha de duração em signup de provider — espelha `OnboardingValoresSchema`. */
const SignupDurationSchema = z.object({
    minutes: z.number().int().min(15).max(2880),
    label: z.string().trim().max(120).optional(),
    priceBrl: z.number().int().nonnegative(),
});

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────────────────
export const LoginActionSchema = z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1, "Senha obrigatória"),
    callbackUrl: z.string().optional(),
});
export type LoginAction = z.infer<typeof LoginActionSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// SIGNUP — CLIENT
// ─────────────────────────────────────────────────────────────────────────────
export const SignupClientSchema = z.object({
    name: z.string().trim().min(2).max(60),
    slug: z.string().trim().toLowerCase().regex(SLUG_REGEX).min(3).max(30),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8),
});
export type SignupClient = z.infer<typeof SignupClientSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// SIGNUP — PROVIDER (FormData espalhado)
// ─────────────────────────────────────────────────────────────────────────────
export const SignupProviderSchema = z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8),
    displayName: z.string().trim().min(2).max(80),
    slug: z.string().trim().toLowerCase().regex(SLUG_REGEX).min(3).max(30),
    age: z.coerce.number().int().min(18).max(99),
    citySlug: z.string().trim().toLowerCase().regex(SLUG_REGEX),
    cityQuery: z.string().trim().min(1).max(120),
    bio: z.string().trim().min(1).max(2000),
    tagline: z.string().trim().max(160).optional(),
    whatsapp: z.string().trim().max(40).optional(),
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
    paymentMethods: z.string().trim().max(500).optional(),
    durations: z.array(SignupDurationSchema).min(1),
    documentType: DOCUMENT_TYPE,
    photo: z.instanceof(File),
});
export type SignupProvider = z.infer<typeof SignupProviderSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// PASSWORD RESET
// ─────────────────────────────────────────────────────────────────────────────
export const RequestPasswordResetSchema = z.object({
    email: z.string().trim().toLowerCase().email(),
});
export type RequestPasswordReset = z.infer<typeof RequestPasswordResetSchema>;

export const ResetPasswordSchema = z
    .object({
        token: z.string().min(1),
        password: z.string().min(8),
        confirm: z.string().min(8),
    })
    .refine((d) => d.password === d.confirm, {
        path: ["confirm"],
        message: "As senhas não coincidem",
    });
export type ResetPassword = z.infer<typeof ResetPasswordSchema>;
