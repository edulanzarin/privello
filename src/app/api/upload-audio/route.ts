import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_SIZE = 20 * 1024 * 1024; // 20 MB
const ALLOWED = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/mp4", "audio/webm", "audio/x-m4a"];

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

  if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });

  // Some browsers send audio/mpeg for .mp3, check both type and name
  const isAudio = ALLOWED.includes(file.type) || file.name.match(/\.(mp3|wav|ogg|m4a|webm)$/i);
  if (!isAudio) {
    return NextResponse.json({ error: "Formato inválido. Use MP3, WAV, OGG ou M4A." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Arquivo muito grande. Máximo 20 MB." }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const dir = join(process.cwd(), "public", "uploads", profile.id);
  await mkdir(dir, { recursive: true });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "mp3";
  const filename = `audio-${Date.now()}.${ext}`;
  await writeFile(join(dir, filename), buffer);

  const url = `/uploads/${profile.id}/${filename}`;

  await prisma.profile.update({
    where: { id: profile.id },
    data: { audioUrl: url },
  });

  return NextResponse.json({ ok: true, url });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  await prisma.profile.updateMany({
    where: { userId: session.user.id },
    data: { audioUrl: null },
  });

  return NextResponse.json({ ok: true });
}
