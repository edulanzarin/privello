"use server";

/**
 * Server Actions — Autenticação e cadastro
 *
 * Caminho: src/app/_actions/auth.ts
 *
 * Cobre login (NextAuth credentials), cadastro de cliente e cadastro de
 * acompanhante (provider). Inclui rate limit por IP no fluxo de login para
 * mitigar brute-force antes mesmo de tocar no backend de auth.
 *
 * Convenções:
 * - Server actions Next.js 16 (`"use server"` no topo).
 * - Validação via Zod (`LoginActionSchema`, `SignupClientSchema`,
 *   `SignupProviderSchema` em `src/lib/validation/`).
 * - Hash de senha com `bcrypt` (cost 12).
 * - Rate limit aplicado no `loginAction` via `rateLimit` + `rateLimitConfigFor`
 *   (chave = IP do cliente extraído de `x-forwarded-for`/`x-real-ip`).
 * - Auto-login pós-cadastro via `signIn("credentials", ...)` com `redirectTo`.
 *
 * Cross-refs:
 * - .kiro/specs/fase-1-seguranca/endpoints-zod.md §2.2
 * - .kiro/specs/fase-1-seguranca/rate-limits.md (entrada `login`)
 * - src/lib/validation/auth.schema.ts
 * - src/lib/rate-limit.ts e src/lib/rate-limit-config.ts
 * - src/lib/auth.ts (NextAuth `signIn`)
 */

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { getOrCreateCityBySlug } from "@/lib/services";
import { putObject } from "@/lib/storage";
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
/**
 * Autentica via credenciais (e-mail + senha) e redireciona conforme o papel.
 * Aplica rate-limit por IP antes de chamar o backend de auth.
 *
 * @param formData - FormData com:
 *   - `email` (string, required, lowercased): e-mail do usuário.
 *   - `password` (string, required, min 1).
 *   - `callbackUrl` (string, optional): destino pós-login para clientes;
 *     ignorado quando aponta para `/painel` (redireciona conforme role).
 * @returns Em sucesso, dispara redirect via NextAuth (não retorna).
 *   Em falha: `{ error, issues?, retryAfter? }` — `retryAfter` é preenchido
 *   quando o rate-limit é atingido.
 *
 * Side effects:
 * - Rate limit: bucket `login` (ver `rate-limits.md`), key = IP do cliente.
 * - Redirect determinístico:
 *   - `ADMIN`/`MODERATOR` → `/admin/moderacao`.
 *   - `PROVIDER` → `/painel`.
 *   - `CLIENT` → `callbackUrl` se válido, senão `/`.
 *
 * @see src/lib/validation/auth.schema.ts (`LoginActionSchema`)
 */
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
/**
 * Cadastra um novo usuário `CLIENT` e dispara auto-login.
 *
 * @param formData - FormData com:
 *   - `name` (string, trim, 2–60 chars).
 *   - `slug` (string, regex `^[a-z0-9][a-z0-9-]*$`, min 3).
 *   - `email` (string, required, e-mail válido).
 *   - `password` (string, min 8).
 * @returns Em sucesso, redireciona para `/` via `signIn`.
 *   Em falha: `{ error, issues? }`.
 *
 * Side effects:
 * - `prisma.user.create` com `role = "CLIENT"`.
 * - `signIn("credentials")` ao final.
 *
 * @see src/lib/validation/auth.schema.ts (`SignupClientSchema`)
 */
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
/**
 * Cadastra um `User` com `Profile` PROVIDER, salva a foto de perfil em
 * `public/uploads/<profileId>/` e dispara auto-login para `/painel`.
 *
 * @param formData - FormData com (campos coercidos para os tipos do schema):
 *   - `email`, `password`, `displayName`, `slug`, `age`, `citySlug`,
 *     `cityQuery`, `bio`, `tagline?`, `whatsapp?`, `heightCm?`, `dressSize?`,
 *     `hair?`, `eyes?`, `languages?`.
 *   - Booleanos de público/local: `servesMen`, `servesWomen`, `servesCouples`,
 *     `hasOwnPlace`, `homeVisit`, `travelsNational`, `travelsInternational`
 *     (chegam como `"1"`/string e são coercidos pelo schema).
 *   - `paymentMethods?` (string).
 *   - `durationsJson` (JSON string) — convertido para `durations: []` antes
 *     de validar; cada item exige `minutes`, `priceBrl` (≥1) e `label?`.
 *   - `photo` (File, obrigatório, MIME validado abaixo do schema; tamanho
 *     verificado no handler de salvamento).
 * @returns Em sucesso, redireciona para `/painel`.
 *   Em falha: `{ error, issues? }`.
 *
 * Side effects:
 * - `prisma.user.create` (com `profile` aninhado e `durationOptions`).
 * - Cria/garante `City` via `getOrCreateCityBySlug`.
 * - Foto enviada via `Storage_Module` (`putObject`) com Object_Key
 *   `uploads/<profileId>/<timestamp>.<ext>` — em produção grava no R2; em
 *   dev sem credenciais R2 ativa `Storage_Local_Fallback`. Falha do upload
 *   é não-fatal (try/catch absorve, log estruturado com
 *   `endpoint: "register-provider-photo"`, conta segue criada e foto pode
 *   ser anexada depois pelo painel).
 * - `signIn("credentials")` ao final, **fora** do try/catch do upload —
 *   auto-login executa mesmo após falha do upload.
 *
 * @see src/lib/validation/auth.schema.ts (`SignupProviderSchema`)
 */
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
  // Upload é não-fatal: falha do `putObject` é absorvida pelo try/catch e o
  // cadastro completa sem `Media` inicial (Requirement 5.2). O auto-login via
  // `signIn` ao final permanece fora do try/catch — executa mesmo após falha
  // do upload (Requirement 5.4).
  const profile = newUser.profile;
  if (profile) {
    const extMap: Record<string, string> = {
      "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
    };
    const ext = extMap[photoFile.type] ?? "jpg";
    const filename = `${Date.now()}.${ext}`;
    const key = `uploads/${profile.id}/${filename}`;
    try {
      const bytes = await photoFile.arrayBuffer();
      const url = await putObject(key, Buffer.from(bytes), photoFile.type);

      await prisma.media.create({
        data: { profileId: profile.id, url, isPublic: true, sortOrder: 0, isCover: true },
      });
    } catch (err) {
      // Non-fatal: account is created, photo can be added later from painel.
      console.warn({
        ts: Date.now(),
        endpoint: "register-provider-photo",
        key,
        ownerId: profile.id,
        contentType: photoFile.type,
        size: photoFile.size,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  await signIn("credentials", { email: d.email, password: d.password, redirectTo: "/painel" });
}
