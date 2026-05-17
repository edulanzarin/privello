/**
 * Route Handler — Upload e remoção de áudio do profile.
 *
 * Endpoint: `POST, DELETE /api/upload-audio`
 *
 * Permite ao provider configurar (`POST`) ou remover (`DELETE`) o áudio
 * pessoal exibido no perfil público (mensagem de voz). O `POST` persiste o
 * arquivo via `Storage_Module` (`src/lib/storage.ts`) sob a Object_Key
 * `audio/<profileId>/audio-<timestamp>.<ext>` e grava a URL pública
 * resultante em `Profile.audioUrl`. O `DELETE` apenas zera `audioUrl` no
 * banco — **não** remove o objeto no R2 (retenção permanente intencional,
 * espelhando a paridade com o comportamento atual em disco; sem job de
 * orphan cleanup nesta fase, conforme Requirement 3.4).
 *
 * Convenções:
 * - Autenticação: sessão NextAuth válida.
 * - Rate limit: n/a (operação rara por usuário).
 * - Validação Zod: `UploadAudioBodySchema` em
 *   `src/lib/validation/upload.schema.ts` (somente `instanceof File`). MIME
 *   e tamanho são checados manualmente.
 *
 * Cross-refs:
 * - .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.1 (`POST`) e §4.3
 *   (`DELETE` — sem input).
 * - .kiro/specs/migracao-infra-producao/requirements.md > Requirement 3.
 * - .kiro/specs/migracao-infra-producao/design.md > Components and
 *   Interfaces > 3.
 * - src/lib/constants.ts — `MAX_AUDIO_BYTES`.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_AUDIO_BYTES } from "@/lib/constants";
import { putObject } from "@/lib/storage";
import { UploadAudioBodySchema, formDataToObject } from "@/lib/validation";

const ALLOWED = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/mp4", "audio/webm", "audio/x-m4a"];

/**
 * Persiste o áudio via `Storage_Module` e atualiza `Profile.audioUrl`.
 *
 * Body esperado (`UploadAudioBodySchema`):
 *   - `file` (File, required): MP3/WAV/OGG/M4A/WebM, ≤ `MAX_AUDIO_BYTES`
 *     (20 MB).
 *
 * @returns
 *   - 200: `{ ok: true, url }`.
 *   - 400: validation error (`flatten()`), MIME inválido ou arquivo > limite.
 *   - 401: não autenticado.
 *   - 404: profile não encontrado para o user.
 *   - 413: `Content-Length` ultrapassa o teto absoluto (`MAX_AUDIO_BYTES + 1 KB`).
 *   - 500: falha ao persistir o objeto no Storage_Module.
 *
 * Side effects:
 * - Storage: `audio/<profileId>/audio-<timestamp>.<ext>` via `putObject`.
 * - DB: `Profile.update` → `audioUrl`.
 *
 * @see .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.1
 * @see .kiro/specs/migracao-infra-producao/requirements.md §"Requirement 3"
 */
export async function POST(req: NextRequest) {
  // Rejeitar requests com Content-Length absurdo
  const contentLength = parseInt(req.headers.get("content-length") ?? "0");
  if (contentLength > MAX_AUDIO_BYTES + 1024) {
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
  const parsed = UploadAudioBodySchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten(), { status: 400 });
  }
  const { file } = parsed.data;

  // KEEP existing MIME/size validation (per spec).
  // Some browsers send audio/mpeg for .mp3, check both type and name.
  const isAudio = ALLOWED.includes(file.type) || file.name.match(/\.(mp3|wav|ogg|m4a|webm)$/i);
  if (!isAudio) {
    return NextResponse.json({ error: "Formato inválido. Use MP3, WAV, OGG ou M4A." }, { status: 400 });
  }
  if (file.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: "Arquivo muito grande. Máximo 20 MB." }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "mp3";
  const filename = `audio-${Date.now()}.${ext}`;
  const key = `audio/${profile.id}/${filename}`;

  let url: string;
  try {
    url = await putObject(key, buffer, file.type);
  } catch (err) {
    console.warn({
      ts: Date.now(),
      endpoint: "upload-audio",
      key,
      ownerId: profile.id,
      contentType: file.type,
      size: file.size,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Falha ao enviar áudio." }, { status: 500 });
  }

  console.info({
    ts: Date.now(),
    endpoint: "upload-audio",
    key,
    ownerId: profile.id,
    contentType: file.type,
    size: file.size,
    ok: true,
  });

  await prisma.profile.update({
    where: { id: profile.id },
    data: { audioUrl: url },
  });

  return NextResponse.json({ ok: true, url });
}

/**
 * Remove a referência de áudio do profile (não apaga o objeto no R2).
 *
 * Body/query: nenhum.
 *
 * @returns
 *   - 200: `{ ok: true }`.
 *   - 401: não autenticado.
 *
 * Side effects:
 * - DB: `Profile.updateMany` → `audioUrl = null`.
 *
 * **Retenção permanente:** este handler **não** chama `deleteObject` no
 * Storage_Module. O objeto fica retido no bucket (mesmo comportamento
 * histórico em disco, onde o arquivo permanecia em `public/uploads/`).
 * Cleanup de órfãos é Non-Goal desta fase (Requirement 3.4).
 *
 * @see .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.3
 * @see .kiro/specs/migracao-infra-producao/requirements.md §"Requirement 3.4"
 */
export async function DELETE(_req: NextRequest) {
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
