/**
 * Route Handler — Upload de documento/selfie/vídeo de verificação de identidade.
 *
 * Endpoint: `POST /api/upload/verification`
 *
 * Recebe um arquivo (imagem ou vídeo) e salva em
 * `public/verification/<profileId>/`. A criação da `VerificationCase` que
 * referencia essas URLs é feita pela server action `submitVerificationCase`
 * — este endpoint só persiste o arquivo e devolve a URL.
 *
 * Convenções:
 * - Autenticação: sessão NextAuth válida.
 * - Rate limit: n/a (gateado pelo fluxo de verificação no painel).
 * - Validação Zod: `UploadVerificationBodySchema` em
 *   `src/lib/validation/upload.schema.ts`. MIME e tamanho são checados
 *   manualmente (per spec — Zod só verifica `instanceof File`).
 *
 * Cross-refs:
 * - .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.1
 *   (`/api/upload/verification`).
 * - src/app/_actions/verification.ts — `submitVerificationCase` consome as URLs.
 */
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

/**
 * Recebe `multipart/form-data` com o arquivo e devolve a URL persistida.
 *
 * Body esperado (`UploadVerificationBodySchema`):
 *   - `file` (File, required): JPG/PNG/WebP/HEIC/HEIF (≤10 MB) ou
 *     MP4/MOV/WebM/AVI (≤150 MB).
 *
 * @returns
 *   - 200: `{ ok: true, url }`.
 *   - 400: validation error (`flatten()`), MIME inválido ou arquivo > limite.
 *   - 401: não autenticado.
 *   - 404: profile não encontrado para o user.
 *
 * Side effects:
 * - FS: `public/verification/<profileId>/<timestamp>-<rand>.<ext>`.
 *
 * @see .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.1
 * @see src/app/_actions/verification.ts
 */
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
