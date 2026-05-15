import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";

const IMAGE_MAX = 8 * 1024 * 1024;  // 8 MB
const VIDEO_MAX = 200 * 1024 * 1024; // 200 MB
const ALLOWED_IMAGES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEOS = ["video/mp4", "video/webm", "video/quicktime"];

export async function POST(req: NextRequest) {
  // Rejeitar requests com Content-Length absurdo antes de processar o body
  const contentLength = parseInt(req.headers.get("content-length") ?? "0");
  if (contentLength > VIDEO_MAX + 1024) {
    return NextResponse.json({ error: "Arquivo muito grande." }, { status: 413 });
  }

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
  const caption = (formData.get("caption") as string | null)?.trim() || null;
  const mediaType = (formData.get("mediaType") as string | null) ?? "IMAGE";

  if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });

  const isVideoFile = ALLOWED_VIDEOS.includes(file.type);
  const isImageFile = ALLOWED_IMAGES.includes(file.type);
  if (!isImageFile && !isVideoFile) {
    return NextResponse.json({ error: "Formato inválido. Use JPG, PNG, WebP ou MP4/WebM." }, { status: 400 });
  }
  const maxSize = isVideoFile ? VIDEO_MAX : IMAGE_MAX;
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: `Arquivo muito grande. Máximo ${isVideoFile ? "200" : "8"} MB.` },
      { status: 400 },
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Save to /public/uploads/<profileId>/
  const dir = join(process.cwd(), "public", "uploads", profile.id);
  await mkdir(dir, { recursive: true });

  const extMap: Record<string, string> = {
    "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
    "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov",
  };
  const ext = extMap[file.type] ?? "bin";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  await writeFile(join(dir, filename), buffer);

  const url = `/uploads/${profile.id}/${filename}`;

  // REEL and story uploads: the caller (createReel action / createStory action) handles
  // the DB record — don't create a Media row here or we get duplicates.
  const purpose = (formData.get("purpose") as string | null) ?? "";
  if (mediaType === "REEL" || purpose === "story") {
    return NextResponse.json({ ok: true, url });
  }

  // Count existing photos to set sortOrder
  const count = await prisma.media.count({ where: { profileId: profile.id, isPublic } });
  const isCover = isPublic && count === 0;

  const media = await prisma.media.create({
    data: { profileId: profile.id, url, isPublic, sortOrder: count, isCover, caption, mediaType },
  });

  return NextResponse.json({ ok: true, media });
}
