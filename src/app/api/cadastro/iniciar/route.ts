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
