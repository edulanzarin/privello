import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { VerificarCadastroQuerySchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const result = VerificarCadastroQuerySchema.safeParse({
    s: req.nextUrl.searchParams.get("s"),
  });
  if (!result.success) {
    return NextResponse.json(result.error.flatten(), { status: 400 });
  }

  const profile = await prisma.profile.findUnique({
    where: { slug: result.data.s },
    select: { id: true },
  });

  return NextResponse.json({ exists: !!profile });
}
