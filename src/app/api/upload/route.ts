/**
 * Route Handler — Upload de mídia (foto/vídeo) do provider.
 *
 * Endpoint: `POST /api/upload`
 *
 * Recebe um `File` em `multipart/form-data` e salva em
 * `public/uploads/<profileId>/`. Para mídias normais (`mediaType` `IMAGE`/
 * `VIDEO`), também cria a `Media` no banco; para `REEL` ou `purpose === "story"`
 * só devolve a URL — o caller (action `createReel` / `createStory`) cria o
 * registro DB para evitar duplicidade.
 *
 * **Atenção:** uploads em filesystem local (`public/uploads`) não funcionam
 * em deploy serverless. Migração para storage externo (Vercel Blob/R2/S3)
 * está documentada em `docs/deploy-vercel.md` como bloqueante para
 * produção real.
 *
 * Convenções:
 * - Autenticação: sessão NextAuth válida.
 * - Rate limit: `upload` (20 req / 1h por `userId`) via
 *   `rateLimitConfigFor("upload", userId)`.
 * - Validação Zod: `UploadBodySchema` em `src/lib/validation/upload.schema.ts`.
 *   MIME e tamanho são checados manualmente no handler (per spec — Zod só
 *   verifica `instanceof File`).
 *
 * Cross-refs:
 * - .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.1 (`/api/upload`).
 * - .kiro/specs/fase-1-seguranca/rate-limits.md §"Tabela canônica" (linha
 *   `/api/upload`).
 * - docs/deploy-vercel.md — followup de storage externo.
 */
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UploadBodySchema, formDataToObject } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { rateLimitConfigFor } from "@/lib/rate-limit-config";

const IMAGE_MAX = 8 * 1024 * 1024;  // 8 MB
const VIDEO_MAX = 200 * 1024 * 1024; // 200 MB
const ALLOWED_IMAGES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEOS = ["video/mp4", "video/webm", "video/quicktime"];

/**
 * Recebe `multipart/form-data`, persiste o arquivo em disco e (quando
 * aplicável) cria a `Media` correspondente.
 *
 * Body esperado (`UploadBodySchema`):
 *   - `file` (File, required): JPG/PNG/WebP/GIF (≤8 MB) ou
 *     MP4/WebM/QuickTime (≤200 MB).
 *   - `isPublic` (boolean, optional, default `true`).
 *   - `caption` (string, optional, trim, max 500 chars).
 *   - `mediaType` (enum `"IMAGE" | "VIDEO" | "REEL"`, optional, default
 *     `IMAGE`).
 *   - `purpose` (enum `"" | "story"`, optional): quando `"story"`, pula a
 *     criação da `Media`.
 *
 * @returns
 *   - 200 (REEL/story): `{ ok: true, url }` — caller cria a `Media`.
 *   - 200 (image/video normal): `{ ok: true, media: Media }`.
 *   - 400: validation error (`flatten()`), MIME inválido ou arquivo > limite.
 *   - 401: não autenticado.
 *   - 404: profile não encontrado para o user.
 *   - 413: `Content-Length` ultrapassa o teto absoluto (200 MB + 1 KB).
 *   - 429: rate limited (`Retry-After` header + log de auditoria).
 *
 * Side effects:
 * - FS: `public/uploads/<profileId>/<timestamp>-<rand>.<ext>`.
 * - DB: `Media.create` (somente quando `mediaType !== "REEL"` e
 *   `purpose !== "story"`); a primeira foto pública pelo perfil é marcada
 *   como `isCover`.
 * - Log: linha estruturada `{ ts, endpoint, key, retryAfter }` em rate-limit hit.
 *
 * @see .kiro/specs/fase-1-seguranca/rate-limits.md (`upload`)
 */
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

  // Rate limit: 20 uploads per hour per userId. Excess returns 429 with
  // Retry-After plus a structured audit log line.
  const rl = await rateLimit(rateLimitConfigFor("upload", session.user.id));
  if (!rl.allowed) {
    console.warn({
      ts: Date.now(),
      endpoint: "upload",
      key: session.user.id,
      retryAfter: rl.retryAfter,
    });
    return NextResponse.json(
      { error: "Limite de uploads atingido. Tente novamente mais tarde." },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfter ?? 3600) },
      },
    );
  }

  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } });
  if (!profile) {
    return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
  }

  const formData = await req.formData();
  const parsed = UploadBodySchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten(), { status: 400 });
  }
  const { file, isPublic, caption, mediaType, purpose } = parsed.data;

  // KEEP existing MIME/size validation (per spec: file uploads keep
  // handler-side checks; the schema only verifies File presence).
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
  if (mediaType === "REEL" || purpose === "story") {
    return NextResponse.json({ ok: true, url });
  }

  // Count existing photos to set sortOrder
  const count = await prisma.media.count({ where: { profileId: profile.id, isPublic } });
  const isCover = isPublic && count === 0;

  const media = await prisma.media.create({
    data: { profileId: profile.id, url, isPublic, sortOrder: count, isCover, caption: caption ?? null, mediaType },
  });

  return NextResponse.json({ ok: true, media });
}
