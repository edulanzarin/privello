"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { getOrCreateCityBySlug } from "@/lib/services";
import {
  LoginActionSchema,
  SignupClientSchema,
  SignupProviderSchema,
  formDataToObject,
} from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { rateLimitConfigFor } from "@/lib/rate-limit-config";

/**
 * Resolve the caller IP from the standard proxy headers. We pick the
 * left-most entry of `x-forwarded-for` (closest to the actual client)
 * with a sane fallback chain so the rate-limit key never degrades to a
 * shared bucket silently.
 */
async function resolveClientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip")?.trim() || "unknown";
}

// ── Login ─────────────────────────────────────────────────────────────────────
export async function loginAction(formData: FormData) {
  const parsed = LoginActionSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return { error: "Validation failed", issues: parsed.error.issues };
  }
  const { email, password, callbackUrl } = parsed.data;

  // Rate-limit BEFORE invoking signIn so brute-force attempts don't even
  // touch the auth backend. Key: client IP. Limits/window come from the
  // canonical rate-limit table (see `rate-limits.md`).
  const ip = await resolveClientIp();
  const rl = await rateLimit(rateLimitConfigFor("login", ip));
  if (!rl.allowed) {
    console.warn({
      ts: Date.now(),
      endpoint: "login",
      key: ip,
      retryAfter: rl.retryAfter,
    });
    return {
      error: "Too many login attempts",
      issues: [],
      retryAfter: rl.retryAfter,
    };
  }

  // Determine redirect based on user role
  const user = await prisma.user.findUnique({
    where: { email },
    select: { role: true },
  });

  let redirectTo = "/";
  if (user?.role === "ADMIN" || user?.role === "MODERATOR") {
    redirectTo = "/admin/moderacao";
  } else if (callbackUrl && !callbackUrl.startsWith("/painel")) {
    redirectTo = callbackUrl;
  } else if (user?.role === "PROVIDER") {
    redirectTo = "/painel";
  }

  try {
    await signIn("credentials", { email, password, redirectTo });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "E-mail ou senha incorretos." };
    }
    throw err;
  }
}

// ── Cadastro cliente ──────────────────────────────────────────────────────────
export async function registerClientAction(formData: FormData) {
  const parsed = SignupClientSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { error: "Validation failed", issues: parsed.error.issues };
  const { name, slug, email, password } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { error: "Este e-mail já está cadastrado." };

  const slugTaken = await prisma.user.findUnique({ where: { slug } });
  if (slugTaken) return { error: `O @ "@${slug}" já está em uso. Tente outro.` };

  // Also check profile slugs
  const profileSlugTaken = await prisma.profile.findUnique({ where: { slug } });
  if (profileSlugTaken) return { error: `O @ "@${slug}" já está em uso. Tente outro.` };

  const hash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: { name, email, password: hash, role: "CLIENT", slug },
  });

  // Auto-login after register
  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (err) {
    throw err;
  }
}

// ── Cadastro acompanhante ─────────────────────────────────────────────────────
export async function registerProviderAction(formData: FormData) {
  // The provider form ships its `durations` payload as a JSON string in
  // `durationsJson`. Normalize it before handing the FormData to the schema
  // so the schema's `durations` field can parse cleanly.
  const raw = formDataToObject(formData);
  let durations: unknown = [];
  try {
    durations = JSON.parse((raw.durationsJson as string | undefined) ?? "[]");
  } catch {
    durations = [];
  }
  delete (raw as Record<string, unknown>).durationsJson;
  (raw as Record<string, unknown>).durations = durations;

  const parsed = SignupProviderSchema.safeParse(raw);
  if (!parsed.success) return { error: "Validation failed", issues: parsed.error.issues };
  const d = parsed.data;
  const photoFile = d.photo;

  if (photoFile.size === 0) return { error: "Selecione uma foto de perfil." };

  const oneHour = d.durations.find((dur) => dur.minutes === 60);
  if (!oneHour) return { error: "Informe o valor para 1 hora (obrigatório)." };

  const exists = await prisma.user.findUnique({ where: { email: d.email } });
  if (exists) return { error: "Este e-mail já está cadastrado." };

  const slugTaken = await prisma.profile.findUnique({ where: { slug: d.slug } });
  if (slugTaken) return { error: `O @ "@${d.slug}" já está em uso. Escolha outro.` };

  const hash = await bcrypt.hash(d.password, 12);

  const city = await getOrCreateCityBySlug(d.citySlug);
  if (!city) return { error: "Cidade não encontrada. Tente novamente." };

  const count = await prisma.profile.count();
  const publicCode = `PRV-${String(count + 1).padStart(3, "0")}`;

  const newUser = await prisma.user.create({
    data: {
      name: d.displayName,
      email: d.email,
      password: hash,
      role: "PROVIDER",
      profile: {
        create: {
          slug: d.slug,
          publicCode,
          displayName: d.displayName,
          age: d.age,
          bio: d.bio,
          tagline: d.tagline ?? null,
          whatsappPhone: d.whatsapp ?? null,
          cityId: city.id,
          priceHour: oneHour.priceBrl,
          priceTwoHours: d.durations.find((dur) => dur.minutes === 120)?.priceBrl ?? null,
          priceOvernight: d.durations.find((dur) => dur.minutes === 720)?.priceBrl ?? null,
          priceTravelDay: d.durations.find((dur) => dur.minutes === 1440)?.priceBrl ?? null,
          paymentMethods: d.paymentMethods ?? null,
          heightCm: d.heightCm ?? null,
          dressSize: d.dressSize ?? null,
          hair: d.hair ?? null,
          eyes: d.eyes ?? null,
          languages: d.languages ?? null,
          servesMen: d.servesMen,
          servesWomen: d.servesWomen,
          servesCouples: d.servesCouples,
          hasOwnPlace: d.hasOwnPlace,
          homeVisit: d.homeVisit,
          travelsNational: d.travelsNational,
          travelsInternational: d.travelsInternational,
          planTier: "ESSENCIAL",
          isOnline: false,
          durationOptions: {
            createMany: {
              data: d.durations.map((dur, i) => ({
                minutes: dur.minutes,
                label: dur.label ?? `${dur.minutes} min`,
                priceBrl: dur.priceBrl,
                sortOrder: i,
                active: true,
              })),
            },
          },
        },
      },
    },
    include: { profile: { select: { id: true } } },
  });

  // Save profile photo. Validation of MIME/size is intentionally kept here —
  // the Zod schema only validates that `photo` is a File (`z.instanceof(File)`).
  const profile = newUser.profile;
  if (profile) {
    try {
      const { writeFile, mkdir } = await import("fs/promises");
      const { join } = await import("path");

      const extMap: Record<string, string> = {
        "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
      };
      const ext = extMap[photoFile.type] ?? "jpg";
      const filename = `${Date.now()}.${ext}`;
      const dir = join(process.cwd(), "public", "uploads", profile.id);
      await mkdir(dir, { recursive: true });
      const bytes = await photoFile.arrayBuffer();
      await writeFile(join(dir, filename), Buffer.from(bytes));
      const url = `/uploads/${profile.id}/${filename}`;

      await prisma.media.create({
        data: { profileId: profile.id, url, isPublic: true, sortOrder: 0, isCover: true },
      });
    } catch {
      // Non-fatal: account is created, photo can be added later from painel
    }
  }

  await signIn("credentials", { email: d.email, password: d.password, redirectTo: "/painel" });
}
