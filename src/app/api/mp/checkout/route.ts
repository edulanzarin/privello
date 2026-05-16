/**
 * Route Handler — Criação de checkout MercadoPago.
 *
 * Endpoint: `POST /api/mp/checkout`
 *
 * Cria uma `Preference` no MercadoPago para os três tipos de cobrança
 * recorrente do app:
 *   - `subscription` (R$19,90/mês) — assinatura do cliente comum.
 *   - `plan` + `tier` (`ESSENCIAL` | `DESTAQUE` | `PREMIUM`) — upgrade de
 *     plano de provider.
 *   - `boost` (R$89, 24h) — destaque temporário para provider.
 *
 * O retorno é `{ url }` com o `init_point` para o front redirecionar.
 *
 * Convenções:
 * - Autenticação: sessão NextAuth válida.
 * - Rate limit: n/a (gateado pela autenticação e pelo próprio MercadoPago).
 * - Validação Zod: `CheckoutBodySchema` em `src/lib/validation/mp.schema.ts`
 *   (refinement obriga `tier` quando `type === "plan"`).
 *
 * Cross-refs:
 * - .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.1 (`/api/mp/checkout`).
 * - src/app/api/mp/webhook/route.ts — consome o callback do pagamento.
 * - src/lib/validation/mp.schema.ts — schema do body.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMPClient, Preference } from "@/lib/mercadopago";
import { CheckoutBodySchema } from "@/lib/validation";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ??
  process.env.NEXTAUTH_URL ??
  "http://localhost:3000";

const PRICES: Record<string, number> = {
  subscription: 19.90,
  ESSENCIAL: 39.90,
  DESTAQUE: 89.00,
  PREMIUM: 189.00,
  boost: 89.00,
};

const LABELS: Record<string, string> = {
  subscription: "Assinatura Privello · R$19,90/mês",
  ESSENCIAL: "Plano Basic · R$39,90/mês",
  DESTAQUE: "Plano Plus · R$89/mês",
  PREMIUM: "Plano Premium · R$189/mês",
  boost: "Boost 24h · R$89",
};

/**
 * Cria uma Preference no MercadoPago e devolve `init_point` para checkout.
 *
 * Body esperado:
 *   - `type` (enum `"subscription" | "plan" | "boost"`, required).
 *   - `tier` (enum `"ESSENCIAL" | "DESTAQUE" | "PREMIUM"`, optional;
 *     obrigatório quando `type === "plan"` por refinement do schema).
 *
 * @returns
 *   - 200: `{ url: string }` com `init_point` da Preference.
 *   - 400: validation error (`flatten()`) ou combinação `type/tier` inválida.
 *   - 401: não autenticado.
 *   - 404: usuário não encontrado.
 *   - 503: cliente MercadoPago não configurado (sem credentials).
 *
 * Side effects:
 * - MercadoPago: cria `Preference` com `external_reference`
 *   `<userId>|<type>|<tier>|<timestamp>` e `notification_url` apontando para
 *   `/api/mp/webhook`.
 *
 * @see .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.1
 * @see src/app/api/mp/webhook/route.ts
 */
export async function POST(req: NextRequest) {
  const client = getMPClient();
  if (!client) {
    return NextResponse.json({ error: "Pagamentos não configurados." }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true },
  });
  if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

  const result = CheckoutBodySchema.safeParse(await req.json());
  if (!result.success) {
    return NextResponse.json(result.error.flatten(), { status: 400 });
  }
  const { type, tier } = result.data;

  const key = type === "plan" ? (tier ?? "") : type;
  const unitPrice = PRICES[key];
  const title = LABELS[key];

  if (!unitPrice || !title) {
    return NextResponse.json({ error: "Tipo de pagamento inválido." }, { status: 400 });
  }

  const successUrl = type === "subscription"
    ? `${BASE_URL}/assinar/sucesso`
    : `${BASE_URL}/painel/plano?upgraded=1`;

  const preference = new Preference(client);
  const preferenceResult = await preference.create({
    body: {
      items: [{ id: key, title, quantity: 1, unit_price: unitPrice, currency_id: "BRL" }],
      payer: { email: user.email, name: user.name ?? undefined },
      back_urls: {
        success: successUrl,
        failure: type === "subscription" ? `${BASE_URL}/assinar` : `${BASE_URL}/painel/plano`,
        pending: successUrl,
      },
      auto_return: "approved",
      external_reference: `${session.user.id}|${type}|${tier ?? ""}|${Date.now()}`,
      metadata: { user_id: session.user.id, type, tier: tier ?? "" },
      notification_url: `${BASE_URL}/api/mp/webhook`,
    },
  });

  return NextResponse.json({ url: preferenceResult.init_point });
}
