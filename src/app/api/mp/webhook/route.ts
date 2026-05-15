import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getMPClient, Payment } from "@/lib/mercadopago";
import { PLAN_DURATION_MS, BOOST_DURATION_MS } from "@/lib/constants";

/**
 * Verifica a assinatura do webhook do MercadoPago.
 * Retorna true se a assinatura é válida ou se não há secret configurado (dev).
 */
function verifyMPSignature(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // Em dev, aceitar sem verificação

  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");

  if (!xSignature || !xRequestId) return false;

  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => {
      const [key, ...rest] = p.split("=");
      return [key.trim(), rest.join("=").trim()];
    }),
  );

  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  // Extrair data.id do body para o manifest
  let dataId = "";
  try {
    const parsed = JSON.parse(rawBody);
    dataId = parsed?.data?.id ?? "";
  } catch {
    return false;
  }

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const client = getMPClient();
  if (!client) return NextResponse.json({ ok: true });

  const rawBody = await req.text();

  // Verificar assinatura do webhook
  if (!verifyMPSignature(req, rawBody)) {
    console.error("[MP webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody) as { type?: string; data?: { id?: string } };

  if (body.type !== "payment" || !body.data?.id) {
    return NextResponse.json({ ok: true });
  }

  let paymentData;
  try {
    const payment = new Payment(client);
    paymentData = await payment.get({ id: body.data.id });
  } catch (err) {
    console.error("[MP webhook] Failed to fetch payment:", body.data.id, err);
    return NextResponse.json({ error: "Failed to fetch payment" }, { status: 500 });
  }

  if (paymentData.status !== "approved") {
    return NextResponse.json({ ok: true });
  }

  const paymentId = String(paymentData.id);

  // Idempotency: skip if already processed
  const already = await prisma.subscription.findUnique({ where: { mpPaymentId: paymentId } });
  if (already) return NextResponse.json({ ok: true });

  const meta = paymentData.metadata as { user_id?: string; type?: string; tier?: string } | undefined;
  const userId = meta?.user_id;
  const type = meta?.type;
  const tier = meta?.tier;

  if (!userId) {
    console.error("[MP webhook] Missing user_id in metadata, paymentId:", paymentId);
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  }

  const now = Date.now();

  try {
    if (type === "subscription") {
      const expiresAt = new Date(now + PLAN_DURATION_MS);
      await prisma.$transaction([
        prisma.subscription.updateMany({
          where: { userId, status: "ACTIVE" },
          data: { status: "CANCELLED" },
        }),
        prisma.subscription.create({
          data: { userId, status: "ACTIVE", expiresAt, mpPaymentId: paymentId },
        }),
      ]);

    } else if (type === "plan" && tier) {
      const validTiers = ["ESSENCIAL", "DESTAQUE", "PREMIUM"] as const;
      if (!validTiers.includes(tier as (typeof validTiers)[number])) {
        return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
      }
      const planExpiresAt = new Date(now + PLAN_DURATION_MS);
      await prisma.profile.updateMany({
        where: { userId },
        data: {
          planTier: tier as (typeof validTiers)[number],
          planExpiresAt,
        },
      });

    } else if (type === "boost") {
      const featuredUntil = new Date(now + BOOST_DURATION_MS);
      await prisma.profile.updateMany({
        where: { userId },
        data: { featuredUntil },
      });
    }
  } catch (err) {
    console.error("[MP webhook] DB error for payment", paymentId, err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
