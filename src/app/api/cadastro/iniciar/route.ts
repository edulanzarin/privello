/**
 * Route Handler — Início do cadastro pago de provider.
 *
 * Endpoint: `POST /api/cadastro/iniciar`
 *
 * Recebe os dados de cadastro de uma acompanhante (provider), armazena tudo
 * em `PendingRegistration` (TTL 24h) e cria uma `Preference` no MercadoPago
 * para cobrar o plano escolhido. O usuário só é efetivamente criado quando
 * o pagamento é aprovado e processado pelo webhook `/api/mp/webhook`.
 *
 * Convenções:
 * - Autenticação: público (cadastro de novo usuário).
 * - Rate limit: n/a (gateado pelo fluxo de pagamento — só cria pendência).
 * - Validação Zod: `SignupBodySchema` em `src/lib/validation/cadastro.schema.ts`.
 *
 * Cross-refs:
 * - .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.1 (`/api/cadastro/iniciar`).
 * - src/lib/validation/cadastro.schema.ts — schema do body.
 * - src/app/api/mp/webhook/route.ts — consome `pending_id` para finalizar o
 *   cadastro quando o pagamento é aprovado.
 */
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getMPClient, Preference } from "@/lib/mercadopago";
import { SignupBodySchema } from "@/lib/validation";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ??
  process.env.NEXTAUTH_URL ??
  "http://localhost:3000";

const PLAN_PRICES: Record<string, number> = {
  ESSENCIAL: 39.90,
  DESTAQUE: 89.00,
  PREMIUM: 189.00,
};

const PLAN_LABELS: Record<string, string> = {
  ESSENCIAL: "Plano Essencial · R$39,90/mês",
  DESTAQUE: "Plano Destaque · R$89/mês",
  PREMIUM: "Plano Premium · R$189/mês",
};

/**
 * Cria a pendência de cadastro e retorna a URL de checkout do MercadoPago.
 *
 * Body esperado (validado por `SignupBodySchema`):
 *   - `email` (string, required): e-mail único do futuro provider.
 *   - `password` (string, required, min 8): hash gerado em servidor antes de
 *     persistir; o original não é guardado.
 *   - `slug` (string, required, regex slug): handle público único.
 *   - `displayName`, `age`, `bio`, `citySlug`, `cityQuery` (required): dados
 *     do perfil.
 *   - `tagline`, `whatsapp`, `heightCm`, `dressSize`, `hair`, `eyes`,
 *     `languages`, `paymentMethods` (optional).
 *   - `servesMen`/`servesWomen`/`servesCouples`/`hasOwnPlace`/`homeVisit`/
 *     `travelsNational`/`travelsInternational` (boolean, required): toggles de
 *     atendimento.
 *   - `durations` (array, required): opções de duração; **deve incluir** uma
 *     entry `minutes === 60` com `priceBrl ≥ 50`.
 *   - `tier` (enum `"ESSENCIAL" | "DESTAQUE" | "PREMIUM"`, required): plano a
 *     ser cobrado.
 *
 * @returns
 *   - 200: `{ url }` com o `init_point` da Preference.
 *   - 400: validation error (`flatten()`) ou ausência de duração de 1h.
 *   - 409: `{ error }` quando e-mail ou slug já estão em uso.
 *   - 503: `{ error }` quando o cliente MercadoPago não está configurado.
 *
 * Side effects:
 * - DB: cria `PendingRegistration` com TTL de 24h carregando o `passwordHash`.
 * - MercadoPago: cria uma `Preference` com `external_reference` no formato
 *   `registration|<pendingId>|<slug>|<tier>` e `notification_url` apontando
 *   para `/api/mp/webhook`.
 *
 * @see .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.1
 * @see src/app/api/mp/webhook/route.ts (finaliza o cadastro)
 */
export async function POST(req: NextRequest) {
  const raw = await req.json();
  const result = SignupBodySchema.safeParse(raw);
  if (!result.success) {
    return NextResponse.json(result.error.flatten(), { status: 400 });
  }
  const body = result.data;
  const { email, slug, tier, durations } = body;

  const oneHour = durations.find((d) => d.minutes === 60);
  if (!oneHour || oneHour.priceBrl < 50) {
    return NextResponse.json({ error: "Informe o valor para 1 hora (mínimo R$50)." }, { status: 400 });
  }

  // Check uniqueness
  const [emailExists, slugTaken] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.profile.findUnique({ where: { slug } }),
  ]);
  if (emailExists) return NextResponse.json({ error: "Este e-mail já está cadastrado." }, { status: 409 });
  if (slugTaken) return NextResponse.json({ error: `O @ "@${slug}" já está em uso.` }, { status: 409 });

  const client = getMPClient();
  if (!client) {
    return NextResponse.json({ error: "Pagamentos não configurados. Tente mais tarde." }, { status: 503 });
  }

  const passwordHash = await bcrypt.hash(body.password, 12);

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const pending = await prisma.pendingRegistration.create({
    data: {
      data: { ...body, password: undefined, passwordHash },
      expiresAt,
    },
  });

  const preference = new Preference(client);
  const preferenceResult = await preference.create({
    body: {
      items: [{
        id: `registration-${tier}`,
        title: PLAN_LABELS[tier],
        quantity: 1,
        unit_price: PLAN_PRICES[tier],
        currency_id: "BRL",
      }],
      back_urls: {
        success: `${BASE_URL}/cadastro/sucesso?s=${slug}`,
        failure: `${BASE_URL}/cadastro/acompanhante`,
        pending: `${BASE_URL}/cadastro/sucesso?s=${slug}`,
      },
      auto_return: "approved",
      external_reference: `registration|${pending.id}|${slug}|${tier}`,
      metadata: {
        type: "registration",
        pending_id: pending.id,
        tier,
      },
      notification_url: `${BASE_URL}/api/mp/webhook`,
    },
  });

  return NextResponse.json({ url: preferenceResult.init_point });
}
