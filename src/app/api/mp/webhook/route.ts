import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMPClient, Payment } from "@/lib/mercadopago";

export async function POST(req: NextRequest) {
  const client = getMPClient();
  if (!client) return NextResponse.json({ ok: true });

  const body = await req.json() as { type?: string; data?: { id?: string } };

  // MP sends { type: "payment", data: { id: "123456" } }
  if (body.type !== "payment" || !body.data?.id) {
    return NextResponse.json({ ok: true });
  }

  const payment = new Payment(client);
  const paymentData = await payment.get({ id: body.data.id });

  if (paymentData.status !== "approved") {
    return NextResponse.json({ ok: true });
  }

  const meta = paymentData.metadata as { user_id?: string; type?: string; tier?: string } | undefined;
  const userId = meta?.user_id;
  const type = meta?.type;
  const tier = meta?.tier;

  if (!userId) return NextResponse.json({ ok: true });

  if (type === "subscription") {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await prisma.subscription.updateMany({
      where: { userId, status: "ACTIVE" },
      data: { status: "CANCELLED" },
    });
    await prisma.subscription.create({
      data: { userId, status: "ACTIVE", expiresAt },
    });
  } else if (type === "plan" && tier) {
    const validTiers = ["ESSENCIAL", "DESTAQUE", "PREMIUM"];
    if (validTiers.includes(tier)) {
      await prisma.profile.updateMany({
        where: { userId },
        data: { planTier: tier as "ESSENCIAL" | "DESTAQUE" | "PREMIUM" },
      });
    }
  } else if (type === "boost") {
    const featuredUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.profile.updateMany({
      where: { userId },
      data: { featuredUntil },
    });
  }

  return NextResponse.json({ ok: true });
}
