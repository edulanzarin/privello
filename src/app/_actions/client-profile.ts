"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLAN_DURATION_MS } from "@/lib/constants";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// ── Upload foto de perfil do cliente ──────────────────────────────────────────
export async function uploadClientAvatarAction(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Não autorizado." };

    const file = formData.get("avatar") as File | null;
    if (!file || file.size === 0) return { error: "Selecione uma foto." };

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
export async function updateClientNameAction(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Não autorizado." };

    const name = (formData.get("name") as string)?.trim();
    if (!name || name.length < 2) return { error: "Nome deve ter ao menos 2 caracteres." };
    if (name.length > 60) return { error: "Nome deve ter no máximo 60 caracteres." };

    await prisma.user.update({
        where: { id: session.user.id },
        data: { name },
    });

    return { ok: true };
}

// ── Alterar @ do cliente (1x por mês) ────────────────────────────────────────
export async function updateClientSlugAction(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Não autorizado." };

    const newSlug = (formData.get("slug") as string)?.trim().toLowerCase();
    if (!newSlug || newSlug.length < 3) return { error: "O @ deve ter ao menos 3 caracteres." };
    if (newSlug.length > 30) return { error: "O @ deve ter no máximo 30 caracteres." };
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(newSlug) && newSlug.length > 2) {
        return { error: "O @ deve conter apenas letras minúsculas, números e hífens." };
    }

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
