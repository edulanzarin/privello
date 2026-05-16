import { z } from "zod";

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]*$/;
const PLAN_TIER = z.enum(["ESSENCIAL", "DESTAQUE", "PREMIUM"]);

const CadastroDurationSchema = z.object({
    minutes: z.number().int().min(15).max(2880),
    label: z.string().trim().max(120).optional(),
    priceBrl: z.number().int().nonnegative(),
});

/**
 * `POST /api/cadastro/iniciar`. Refinement: precisa existir uma duração de
 * 60 minutos com `priceBrl ≥ 50` (regra de negócio replicada do handler).
 */
export const SignupBodySchema = z
    .object({
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
        servesMen: z.boolean(),
        servesWomen: z.boolean(),
        servesCouples: z.boolean(),
        hasOwnPlace: z.boolean(),
        homeVisit: z.boolean(),
        travelsNational: z.boolean(),
        travelsInternational: z.boolean(),
        paymentMethods: z.string().trim().max(500).optional(),
        durations: z.array(CadastroDurationSchema).min(1),
        tier: PLAN_TIER,
    })
    .refine(
        (d) =>
            d.durations.some(
                (dur) => dur.minutes === 60 && dur.priceBrl >= 50,
            ),
        {
            path: ["durations"],
            message: "É obrigatório ter uma duração de 60 minutos com preço ≥ R$ 50",
        },
    );
export type SignupBody = z.infer<typeof SignupBodySchema>;

/** `GET /api/cadastro/verificar`. */
export const VerificarCadastroQuerySchema = z.object({
    s: z.string().trim().toLowerCase().regex(SLUG_REGEX),
});
export type VerificarCadastroQuery = z.infer<typeof VerificarCadastroQuerySchema>;
