import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getMPClient, Preference } from "@/lib/mercadopago";

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
  const body = await req.json() as {
    email: string;
    password: string;
    displayName: string;
    slug: string;
    age: number;
    citySlug: string;
    cityQuery: string;
    bio: string;
    tagline?: string;
    whatsapp?: string;
    heightCm?: number;
    dressSize?: string;
    hair?: string;
    eyes?: string;
    languages: string;
    servesMen: boolean;
    servesWomen: boolean;
    servesCouples: boolean;
    hasOwnPlace: boolean;
    homeVisit: boolean;
    travelsNational: boolean;
    travelsInternational: boolean;
    paymentMethods?: string;
    durations: Array<{ minutes: number; label: string; priceBrl: number; sortOrder: number }>;
    tier: string;
  };

  const { email, password, displayName, slug, age, citySlug, bio, tier, durations } = body;

  // Validate required fields
  if (!email || !password || !displayName || !slug || !age || !citySlug || !bio) {
    return NextResponse.json({ error: "Preencha todos os campos obrigatórios." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Senha deve ter ao menos 8 caracteres." }, { status: 400 });
  }
  if (age < 18 || age > 99) {
    return NextResponse.json({ error: "Idade inválida." }, { status: 400 });
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug) || slug.length < 3) {
    return NextResponse.json({ error: "@ inválido." }, { status: 400 });
  }
  if (!PLAN_PRICES[tier]) {
    return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
  }

  const oneHour = durations?.find((d) => d.minutes === 60);
  if (!oneHour || oneHour.priceBrl < 50) {
    return NextResponse.json({ error: "Informe o valor para 1 hora (mínimo R$50)." }, { status: 400 });
  }

  // Check uniqueness
  const [emailExists, slugTaken] = await Promise.all([
    prisma.user.findUnique({ where: { email: email.toLowerCase() } }),
    prisma.profile.findUnique({ where: { slug } }),
  ]);
  if (emailExists) return NextResponse.json({ error: "Este e-mail já está cadastrado." }, { status: 409 });
  if (slugTaken) return NextResponse.json({ error: `O @ "@${slug}" já está em uso.` }, { status: 409 });

  const client = getMPClient();
  if (!client) {
    return NextResponse.json({ error: "Pagamentos não configurados. Tente mais tarde." }, { status: 503 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const pending = await prisma.pendingRegistration.create({
    data: {
      data: { ...body, password: undefined, passwordHash },
      expiresAt,
    },
  });

  const preference = new Preference(client);
  const result = await preference.create({
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

  return NextResponse.json({ url: result.init_point });
}
