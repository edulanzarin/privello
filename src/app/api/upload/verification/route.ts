/**
 * Route Handler — Upload de documento/selfie/vídeo de verificação de identidade.
 *
 * Endpoint: `POST /api/upload/verification`
 *
 * Recebe um arquivo (imagem ou vídeo) e persiste via `Storage_Module`
 * (`src/lib/storage.ts`) sob a Object_Key
 * `verification/<profileId>/<timestamp>-<rand>.<ext>`. Em produção o módulo
 * faz `PutObjectCommand` contra o Cloudflare R2; em dev sem credenciais
 * cai no `Storage_Local_Fallback` e escreve em
 * `public/verification/<profileId>/`. A criação da `VerificationCase` que
 * referencia essas URLs é feita pela server action `submitVerificationCase`
 * — este endpoint só persiste o arquivo e devolve a URL via `{ ok: true, url }`.
 *
 * **TODO (blocker pré-go-live, task 7.1):** documentos de verificação são
 * sensíveis (KYC). Esta fase usa URL pública composta com `R2_PUBLIC_URL`
 * como fallback temporário aceito (Requirement 4.4); migrar para
 * `Presigned_URL` + bucket privado dedicado para `verification/*` antes
 * do go-live real está documentado como blocker em
 * `docs/deploy-railway.md`.
 *
 * Convenções:
 * - Autenticação: sessão NextAuth válida.
 * - Rate limit: n/a (gateado pelo fluxo de verificação no painel).
 * - Validação Zod: `UploadVerificationBodySchema` em
 *   `src/lib/validation/upload.schema.ts`. MIME e tamanho são checados
 *   manualmente (per spec — Zod só verifica `instanceof File`).
 * - Falha do `putObject`: HTTP 500 com mensagem pt-BR e log estruturado;
 *   o log é envolto em try/catch para que falha do logger (stdout
 *   indisponível) não propague exception ao cliente — o 500 sempre é
 *   retornado (Requirement 4.6).
 *
 * Cross-refs:
 * - .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.1
 *   (`/api/upload/verification`).
 * - .kiro/specs/migracao-infra-producao/requirements.md > Requirement 4.
 * - .kiro/specs/migracao-infra-producao/design.md > Components and
 *   Interfaces > 4.
 * - src/app/_actions/verification.ts — `submitVerificationCase` consome as URLs.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { putObject } from "@/lib/storage";
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
 *   - 200: `{ ok: true, url }` — `url` é a Persisted_URL composta pelo
 *     `Storage_Module` (absoluta em produção R2, relativa em fallback dev).
 *   - 400: validation error (`flatten()`), MIME inválido ou arquivo > limite.
 *   - 401: não autenticado.
 *   - 404: profile não encontrado para o user.
 *   - 500: falha do `putObject` (rede, credenciais, R2 indisponível); log
 *     estruturado emitido em best-effort.
 *
 * Side effects:
 * - Storage: `verification/<profileId>/<timestamp>-<rand>.<ext>` via
 *   `putObject` (R2 em produção, `public/` em dev fallback).
 * - Log: linha estruturada `console.info` no sucesso e `console.warn`
 *   (envolto em try/catch) na falha.
 *
 * @see .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.1
 * @see .kiro/specs/migracao-infra-producao/requirements.md > Requirement 4
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

  const extMap: Record<string, string> = {
    "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
    "image/heic": "jpg", "image/heif": "jpg",
    "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm", "video/x-msvideo": "avi",
  };
  const ext = extMap[file.type] ?? "bin";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const key = `verification/${profile.id}/${filename}`;

  let url: string;
  try {
    url = await putObject(key, buffer, file.type);
  } catch (err) {
    // Log envolto em try/catch — Requirement 4.6: HTTP 500 deve ser
    // retornado mesmo se o logger lançar (stdout indisponível, etc.).
    try {
      console.warn({
        ts: Date.now(),
        endpoint: "upload-verification",
        key,
        ownerId: profile.id,
        contentType: file.type,
        size: file.size,
        error: err instanceof Error ? err.message : String(err),
      });
    } catch {
      // logger indisponível; ainda assim retornar 500 (Requirement 4.6).
    }
    return NextResponse.json({ error: "Falha ao enviar documento." }, { status: 500 });
  }

  console.info({
    ts: Date.now(),
    endpoint: "upload-verification",
    key,
    ownerId: profile.id,
    contentType: file.type,
    size: file.size,
    ok: true,
  });

  return NextResponse.json({ ok: true, url });
}
