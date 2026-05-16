import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UploadVerificationBodySchema, formDataToObject } from "@/lib/validation";

const MAX_SIZE_IMG = 10 * 1024 * 1024;  // 10 MB for images
const MAX_SIZE_VIDEO = 150 * 1024 * 1024; // 150 MB for video
const ALLOWED_IMG = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const ALLOWED_VIDEO = ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"];

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
  const parsed = UploadVerificationBodySchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten(), { status: 400 });
  }
  const { file } = parsed.data;

  // KEEP existing MIME/size validation (per spec).
  const isVideo = ALLOWED_VIDEO.includes(file.type);
  const isImage = ALLOWED_IMG.includes(file.type);

  if (!isVideo && !isImage) {
    return NextResponse.json({ error: "Formato inválido. Imagens: JPG/PNG/WebP. Vídeos: MP4/MOV/WebM." }, { status: 400 });
  }
  if (isVideo && file.size > MAX_SIZE_VIDEO) {
    return NextResponse.json({ error: "Vídeo muito grande. Máximo 150 MB." }, { status: 400 });
  }
  if (isImage && file.size > MAX_SIZE_IMG) {
    return NextResponse.json({ error: "Imagem muito grande. Máximo 10 MB." }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const dir = join(process.cwd(), "public", "verification", profile.id);
  await mkdir(dir, { recursive: true });

  const extMap: Record<string, string> = {
    "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
    "image/heic": "jpg", "image/heif": "jpg",
    "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm", "video/x-msvideo": "avi",
  };
  const ext = extMap[file.type] ?? "bin";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  await writeFile(join(dir, filename), buffer);

  const url = `/verification/${profile.id}/${filename}`;
  return NextResponse.json({ ok: true, url });
}
