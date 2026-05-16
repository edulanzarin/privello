"use server";

/**
 * Server Actions — Perfil do cliente
 *
 * Caminho: src/app/_actions/client-profile.ts
 *
 * Cobre as ações que um usuário `CLIENT` (logado) pode disparar para gerenciar
 * a própria conta: upload de avatar, alteração de nome e troca do `@` (slug)
 * com cooldown de 30 dias.
 *
 * Convenções:
 * - Server actions Next.js 16 (`"use server"` no topo).
 * - Validação via Zod (`UploadClientAvatarSchema`, `UpdateClientNameSchema`,
 *   `UpdateClientSlugSchema` em `src/lib/validation/client-profile.schema.ts`).
 * - Autenticação requerida via `auth()`; sem sessão → `{ error: "Não autorizado." }`.
 * - Validação de MIME/size do avatar permanece no handler (o schema só garante
 *   `z.instanceof(File)`).
 * - Foto persistida em `public/uploads/<userId>/`.
 * - Cooldown de 30 dias para troca de `@` controlado por `User.slugChangedAt`.
 *
 * Cross-refs:
 * - .kiro/specs/fase-1-seguranca/endpoints-zod.md §2.3
 * - src/lib/validation/client-profile.schema.ts
 * - src/lib/constants.ts (`PLAN_DURATION_MS`)
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLAN_DURATION_MS } from "@/lib/constants";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import {
    UploadClientAvatarSchema,
    UpdateClientNameSchema,
    UpdateClientSlugSchema,
    formDataToObject,
} from "@/lib/validation";

// ── Upload foto de perfil do cliente ──────────────────────────────────────────
/**
 * Salva a foto de perfil do cliente no disco e atualiza `User.image`.
 *
 * @param formData - FormData com:
 *   - `avatar` (File, required): JPG/PNG/WebP, ≤5MB.
 * @returns `{ ok: true, url }` em sucesso ou `{ error, issues? }` em falha.
 *
 * Side effects:
 * - Escreve em `public/uploads/<userId>/<timestamp>-<rand>.<ext>`.
 * - `prisma.user.update({ image: url })`.
 *
 * @see src/lib/validation/client-profile.schema.ts (`UploadClientAvatarSchema`)
 */
export async function uploadClientAvatarAction(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Não autorizado." };

    const parsed = UploadClientAvatarSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) return { error: "Validation failed", issues: parsed.error.issues };
    const file = parsed.data.avatar;

    if (file.size === 0) return { error: "Selecione uma foto." };

    // KEEP existing MIME/size validation (per spec: file uploads keep handler-side checks).
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) return { error: "A foto deve ter no máximo 5MB." };

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) return { error: "Formato inválido. Use JPG, PNG ou WebP." };

    const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", session.user.id);
    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const url = `/uploads/${session.user.id}/${filename}`;

    await prisma.user.update({
        where: { id: session.user.id },
        data: { image: url },
    });

    return { ok: true, url };
}

// ── Alterar nome do cliente ───────────────────────────────────────────────────
/**
 * Atualiza o nome de exibição do usuário cliente.
 *
 * @param formData - FormData com:
 *   - `name` (string, trim, 2–60 chars — `UpdateClientNameSchema`).
 * @returns `{ ok: true }` em sucesso ou `{ error, issues? }` em falha.
 *
 * @see src/lib/validation/client-profile.schema.ts (`UpdateClientNameSchema`)
 */
export async function updateClientNameAction(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Não autorizado." };

    const parsed = UpdateClientNameSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) return { error: "Validation failed", issues: parsed.error.issues };

    await prisma.user.update({
        where: { id: session.user.id },
        data: { name: parsed.data.name },
    });

    return { ok: true };
}

// ── Alterar @ do cliente (1x por mês) ────────────────────────────────────────
/**
 * Troca o `@` (slug) do usuário, respeitando cooldown de 30 dias e
 * verificando colisão tanto em `User.slug` quanto em `Profile.slug`.
 *
 * @param formData - FormData com:
 *   - `slug` (string, trim, lowercase, regex
 *     `^[a-z0-9][a-z0-9-]*[a-z0-9]$`, 3–30 chars — `UpdateClientSlugSchema`).
 * @returns `{ ok: true }` em sucesso (inclui no-op quando o slug não muda)
 *   ou `{ error, issues? }` em falha (cooldown ativo, slug em uso, etc.).
 *
 * Side effects:
 * - `prisma.user.update({ slug, slugChangedAt: new Date() })` em troca real.
 *
 * @see src/lib/validation/client-profile.schema.ts (`UpdateClientSlugSchema`)
 */
export async function updateClientSlugAction(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Não autorizado." };

    const parsed = UpdateClientSlugSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) return { error: "Validation failed", issues: parsed.error.issues };
    const newSlug = parsed.data.slug;

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { slug: true, slugChangedAt: true },
    });
    if (!user) return { error: "Usuário não encontrado." };

    // If same slug, no-op
    if (user.slug === newSlug) return { ok: true };

    // Check 30-day cooldown
    if (user.slugChangedAt) {
        const thirtyDaysAgo = new Date(Date.now() - PLAN_DURATION_MS);
        if (user.slugChangedAt > thirtyDaysAgo) {
            const nextDate = new Date(user.slugChangedAt.getTime() + PLAN_DURATION_MS);
            return {
                error: `Você só pode alterar o @ uma vez por mês. Próxima alteração disponível em ${nextDate.toLocaleDateString("pt-BR")}.`,
            };
        }
    }

    // Check if slug is taken by another user
    const taken = await prisma.user.findFirst({
        where: { slug: newSlug, id: { not: session.user.id } },
    });
    if (taken) return { error: `O @ "@${newSlug}" já está em uso.` };

    // Also check profile slugs
    const profileTaken = await prisma.profile.findUnique({ where: { slug: newSlug } });
    if (profileTaken) return { error: `O @ "@${newSlug}" já está em uso.` };

    await prisma.user.update({
        where: { id: session.user.id },
        data: { slug: newSlug, slugChangedAt: new Date() },
    });

    return { ok: true };
}
