import { z } from "zod";

const PLAN_TIER = z.enum(["ESSENCIAL", "DESTAQUE", "PREMIUM"]);
const CHECKOUT_TYPE = z.enum(["subscription", "plan", "boost"]);

/**
 * `POST /api/mp/checkout`. Quando `type === "plan"`, `tier` é obrigatório.
 */
export const CheckoutBodySchema = z
    .object({
        type: CHECKOUT_TYPE,
        tier: PLAN_TIER.optional(),
    })
    .refine((d) => d.type !== "plan" || !!d.tier, {
        path: ["tier"],
        message: "tier é obrigatório quando type=plan",
    });
export type CheckoutBody = z.infer<typeof CheckoutBodySchema>;
