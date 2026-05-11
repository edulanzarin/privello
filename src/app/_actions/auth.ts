"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

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

  // Default redirect: providers go to /painel, clients go to /
  // Never redirect clients to /painel
  let redirectTo = "/";
  if (callbackUrl && !callbackUrl.startsWith("/painel")) {
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
  await prisma.user.create({
    data: { name, email, password: hash, role: "CLIENT" },
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
  const name        = (formData.get("name") as string).trim();
  const email       = (formData.get("email") as string).trim().toLowerCase();
  const password    = formData.get("password") as string;
  const displayName = (formData.get("displayName") as string).trim();
  const ageStr      = formData.get("age") as string;
  const phone       = (formData.get("phone") as string | null)?.trim() ?? "";

  if (!name || !email || !password || !displayName || !ageStr) {
    return { error: "Preencha todos os campos obrigatórios." };
  }
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

  let slug = base;
  let attempt = 0;
  while (await prisma.profile.findUnique({ where: { slug } })) {
    attempt++;
    slug = `${base}-${attempt}`;
  }

  // Generate unique publicCode
  const count = await prisma.profile.count();
  const publicCode = `PRV-${String(count + 1).padStart(3, "0")}`;

  // We need a city — use São Paulo as default, provider can change later
  let city = await prisma.city.findUnique({ where: { slug: "sao-paulo-sp" } });
  if (!city) {
    city = await prisma.city.upsert({
      where: { slug: "sao-paulo-sp" },
      update: {},
      create: { name: "São Paulo", slug: "sao-paulo-sp" },
    });
  }

  // Default district
  let district = await prisma.district.findFirst({ where: { cityId: city.id } });
  if (!district) {
    district = await prisma.district.create({
      data: { name: "Centro", slug: "centro", cityId: city.id },
    });
  }

  await prisma.user.create({
    data: {
      name,
      email,
      password: hash,
      phone: phone || null,
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

  // Auto-login and redirect to onboarding step 1
  try {
    await signIn("credentials", { email, password, redirectTo: "/conta/onboarding/perfil" });
  } catch (err) {
    throw err;
  }
}
