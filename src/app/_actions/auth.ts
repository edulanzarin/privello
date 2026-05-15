"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { getOrCreateCityBySlug } from "@/lib/queries";

// ── Login ─────────────────────────────────────────────────────────────────────
export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const callbackUrl = formData.get("callbackUrl") as string | null;

  // Determine redirect based on user role
  const user = await prisma.user.findUnique({
    where: { email: email?.toLowerCase() },
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
  const name = (formData.get("name") as string).trim();
  const slug = (formData.get("slug") as string)?.trim().toLowerCase();
  const email = (formData.get("email") as string).trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!name || !email || !password) return { error: "Preencha todos os campos." };
  if (!slug || slug.length < 3) return { error: "O @ deve ter ao menos 3 caracteres." };
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) return { error: "O @ deve conter apenas letras minúsculas, números e hífens." };
  if (password.length < 8) return { error: "Senha deve ter ao menos 8 caracteres." };

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { error: "Este e-mail já está cadastrado." };

  const slugTaken = await prisma.user.findUnique({ where: { slug } });
  if (slugTaken) return { error: `O @ "@${slug}" já está em uso. Tente outro.` };

  // Also check profile slugs
  const profileSlugTaken = await prisma.profile.findUnique({ where: { slug } });
  if (profileSlugTaken) return { error: `O @ "@${slug}" já está em uso. Tente outro.` };

  const hash = await bcrypt.hash(password, 12);

  const newClient = await prisma.user.create({
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
  const email = (formData.get("email") as string).trim().toLowerCase();
  const password = formData.get("password") as string;
  const displayName = (formData.get("displayName") as string).trim();
  const slug = (formData.get("slug") as string).trim().toLowerCase();
  const ageStr = formData.get("age") as string;
  const citySlug = (formData.get("citySlug") as string | null)?.trim() ?? "";
  const cityQuery = (formData.get("cityQuery") as string | null)?.trim() ?? "";
  const bio = (formData.get("bio") as string | null)?.trim() ?? "";
  const tagline = (formData.get("tagline") as string | null)?.trim() || null;
  const whatsapp = (formData.get("whatsapp") as string | null)?.trim() || null;
  const heightCm = formData.get("heightCm") ? Number(formData.get("heightCm")) : null;
  const dressSize = (formData.get("dressSize") as string | null)?.trim() || null;
  const hair = (formData.get("hair") as string | null)?.trim() || null;
  const eyes = (formData.get("eyes") as string | null)?.trim() || null;
  const languages = (formData.get("languages") as string | null)?.trim() || null;
  const servesMen = formData.get("servesMen") === "1";
  const servesWomen = formData.get("servesWomen") === "1";
  const servesCouples = formData.get("servesCouples") === "1";
  const hasOwnPlace = formData.get("hasOwnPlace") === "1";
  const homeVisit = formData.get("homeVisit") === "1";
  const travelsNational = formData.get("travelsNational") === "1";
  const travelsInternational = formData.get("travelsInternational") === "1";
  const paymentMethods = (formData.get("paymentMethods") as string | null)?.trim() || null;
  const durationsJson = (formData.get("durationsJson") as string | null) ?? "[]";

  if (!email || !password || !displayName || !slug || !ageStr) {
    return { error: "Preencha todos os campos obrigatórios." };
  }
  if (!citySlug) return { error: "Selecione a cidade onde você atende." };
  if (!bio) return { error: "Escreva uma bio." };
  if (password.length < 8) return { error: "Senha deve ter ao menos 8 caracteres." };

  const age = parseInt(ageStr, 10);
  if (isNaN(age) || age < 18) return { error: "Você deve ter ao menos 18 anos." };

  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    return { error: "O @ deve conter apenas letras minúsculas, números e hífens." };
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { error: "Este e-mail já está cadastrado." };

  const slugTaken = await prisma.profile.findUnique({ where: { slug } });
  if (slugTaken) return { error: `O @ "@${slug}" já está em uso. Escolha outro.` };

  let durations: Array<{ minutes: number; label: string; priceBrl: number; sortOrder: number }> = [];
  try { durations = JSON.parse(durationsJson); } catch { /* ignore */ }

  const oneHour = durations.find((d) => d.minutes === 60);
  if (!oneHour) return { error: "Informe o valor para 1 hora (obrigatório)." };

  const hash = await bcrypt.hash(password, 12);

  const city = await getOrCreateCityBySlug(citySlug);
  if (!city) return { error: "Cidade não encontrada. Tente novamente." };

  const district = await prisma.district.upsert({
    where: { cityId_slug: { cityId: city.id, slug: "centro" } },
    update: {},
    create: { name: cityQuery.split(",")[0].trim() || "Centro", slug: "centro", cityId: city.id },
  });

  const count = await prisma.profile.count();
  const publicCode = `PRV-${String(count + 1).padStart(3, "0")}`;

  const newProvider = await prisma.user.create({
    data: {
      name: displayName,
      email,
      password: hash,
      role: "PROVIDER",
      profile: {
        create: {
          slug,
          publicCode,
          displayName,
          age,
          bio,
          tagline,
          whatsappPhone: whatsapp,
          cityId: city.id,
          districtId: district.id,
          priceHour: oneHour.priceBrl,
          priceTwoHours: durations.find((d) => d.minutes === 120)?.priceBrl ?? null,
          priceOvernight: durations.find((d) => d.minutes === 720)?.priceBrl ?? null,
          priceTravelDay: durations.find((d) => d.minutes === 1440)?.priceBrl ?? null,
          paymentMethods,
          heightCm: heightCm && !isNaN(heightCm) ? heightCm : null,
          dressSize,
          hair,
          eyes,
          languages,
          servesMen,
          servesWomen,
          servesCouples,
          hasOwnPlace,
          homeVisit,
          travelsNational,
          travelsInternational,
          planTier: "ESSENCIAL",
          durationOptions: {
            createMany: {
              data: durations.map((d, i) => ({
                minutes: d.minutes,
                label: d.label,
                priceBrl: d.priceBrl,
                sortOrder: i,
                active: true,
              })),
            },
          },
        },
      },
    },
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/conta/onboarding/fotos" });
  } catch (err) {
    throw err;
  }
}
