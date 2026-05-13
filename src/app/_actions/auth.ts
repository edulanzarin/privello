"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { getOrCreateCityBySlug } from "@/lib/queries";
import { sendVerificationEmail } from "@/app/_actions/email-verification";

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
  const name     = (formData.get("name") as string).trim();
  const email    = (formData.get("email") as string).trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!name || !email || !password) return { error: "Preencha todos os campos." };
  if (password.length < 8) return { error: "Senha deve ter ao menos 8 caracteres." };

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { error: "Este e-mail já está cadastrado." };

  const hash = await bcrypt.hash(password, 12);

  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const slug = base;
  const slugTaken = await prisma.user.findUnique({ where: { slug } });
  if (slugTaken) return { error: `O @ "${slug}" já está em uso. Tente um nome diferente.` };

  const newClient = await prisma.user.create({
    data: { name, email, password: hash, role: "CLIENT", slug },
  });

  await sendVerificationEmail(newClient.id).catch(() => {});

  // Auto-login after register
  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (err) {
    throw err;
  }
}

// ── Cadastro acompanhante ─────────────────────────────────────────────────────
export async function registerProviderAction(formData: FormData) {
  const email       = (formData.get("email") as string).trim().toLowerCase();
  const password    = formData.get("password") as string;
  const displayName = (formData.get("displayName") as string).trim();
  const ageStr      = formData.get("age") as string;
  const citySlug    = (formData.get("citySlug")  as string | null)?.trim() ?? "";
  const cityQuery   = (formData.get("cityQuery") as string | null)?.trim() ?? "";

  if (!email || !password || !displayName || !ageStr) {
    return { error: "Preencha todos os campos obrigatórios." };
  }
  if (!citySlug) return { error: "Selecione a cidade onde você atende." };
  if (password.length < 8) return { error: "Senha deve ter ao menos 8 caracteres." };

  const age = parseInt(ageStr, 10);
  if (isNaN(age) || age < 18) return { error: "Você deve ter ao menos 18 anos." };

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { error: "Este e-mail já está cadastrado." };

  const hash = await bcrypt.hash(password, 12);

  // Generate a unique slug from displayName
  const base = displayName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const slug = base;
  const slugTaken = await prisma.profile.findUnique({ where: { slug } });
  if (slugTaken) return { error: `O @ "${slug}" já está em uso. Tente outro nome artístico.` };

  // Generate unique publicCode
  const count = await prisma.profile.count();
  const publicCode = `PRV-${String(count + 1).padStart(3, "0")}`;

  // Resolve city from user selection
  const city = await getOrCreateCityBySlug(citySlug);
  if (!city) return { error: "Cidade não encontrada. Tente novamente." };

  // Use "Centro" as default district, creating if not present
  const district = await prisma.district.upsert({
    where: { cityId_slug: { cityId: city.id, slug: "centro" } },
    update: {},
    create: { name: cityQuery.split(",")[0].trim() || "Centro", slug: "centro", cityId: city.id },
  });

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
          bio: "",
          cityId: city.id,
          districtId: district.id,
          priceHour: 0,
          planTier: "ESSENCIAL",
        },
      },
    },
  });

  await sendVerificationEmail(newProvider.id).catch(() => {});

  // Auto-login and redirect to onboarding step 1
  try {
    await signIn("credentials", { email, password, redirectTo: "/conta/onboarding/perfil" });
  } catch (err) {
    throw err;
  }
}
