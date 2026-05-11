import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_SIZE = 8 * 1024 * 1024; // 8 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } });
  if (!profile) {
    return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const isPublic = formData.get("isPublic") !== "false";

  if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Formato inválido. Use JPG, PNG ou WebP." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Arquivo muito grande. Máximo 8 MB." }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Save to /public/uploads/<profileId>/
  const dir = join(process.cwd(), "public", "uploads", profile.id);
  await mkdir(dir, { recursive: true });

  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  await writeFile(join(dir, filename), buffer);

  const url = `/uploads/${profile.id}/${filename}`;

  // Count existing photos to set sortOrder
  const count = await prisma.media.count({ where: { profileId: profile.id, isPublic } });
  const isCover = isPublic && count === 0;

  const media = await prisma.media.create({
    data: { profileId: profile.id, url, isPublic, sortOrder: count, isCover },
  });

  return NextResponse.json({ ok: true, media });
}
