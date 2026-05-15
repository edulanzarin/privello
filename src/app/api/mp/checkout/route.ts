import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMPClient, Preference } from "@/lib/mercadopago";

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

  const body = await req.json() as { type: string; tier?: string };
  const { type, tier } = body;

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
  const result = await preference.create({
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

  return NextResponse.json({ url: result.init_point });
}
