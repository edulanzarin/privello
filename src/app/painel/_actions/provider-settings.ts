"use server";

/**
 * Server Actions — Configurações do painel do acompanhante
 *
 * Caminho: src/app/painel/_actions/provider-settings.ts
 *
 * Cobre as ações disparadas pelo painel do acompanhante:
 * - Stories do painel (`createStory`, `deleteStory`) — gateadas por plano
 *   `DESTAQUE`/`PREMIUM`.
 * - `saveAvailabilityWindows` — janelas de disponibilidade (7 dias × abrir/
 *   horário inicial/final).
 * - `saveDurationOptions` — recria as durações + métodos de pagamento.
 * - Financeiro: `addFinancialRecord`, `updateFinancialRecord`,
 *   `deleteFinancialRecord`.
 * - `changeHandle` — troca o `@` (slug) do perfil.
 * - `claimFreeBoost` — boost grátis 24 h, exclusivo do plano Premium e
 *   limitado a 1 boost ativo por vez.
 * - `devActivatePlan` — ativa plano sem pagamento (apenas em
 *   `NODE_ENV !== "production"`).
 *
 * Convenções:
 * - Server actions Next.js 16 (`"use server"` no topo).
 * - Validação via Zod (`PainelCreateStorySchema`, `PainelDeleteStorySchema`,
 *   `SaveAvailabilityWindowsSchema`, `SaveDurationOptionsSchema`,
 *   `AddFinancialRecordSchema`, `UpdateFinancialRecordSchema`,
 *   `DeleteFinancialRecordSchema`, `ChangeHandleSchema`,
 *   `DevActivatePlanSchema` em `src/lib/validation/painel-provider-settings.schema.ts`).
 * - Autenticação requerida via `auth()`; sem perfil → redirect para
 *   `/conta/onboarding/perfil`.
 * - Revalidação de cache via `revalidatePath` em `/painel/*` e `/p/<slug>`.
 *
 * Cross-refs:
 * - .kiro/specs/fase-1-seguranca/endpoints-zod.md §3.1
 * - src/lib/validation/painel-provider-settings.schema.ts
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  PainelCreateStorySchema,
  PainelDeleteStorySchema,
  SaveAvailabilityWindowsSchema,
  SaveDurationOptionsSchema,
  UpdateFinancialRecordSchema,
  DeleteFinancialRecordSchema,
  AddFinancialRecordSchema,
  ChangeHandleSchema,
  DevActivatePlanSchema,
  formDataToObject,
} from "@/lib/validation";

/**
 * Cria um story de painel (24 h de duração). Disponível apenas para perfis
 * com plano `DESTAQUE` ou `PREMIUM`.
 *
 * @param formData - FormData com:
 *   - `mediaUrl` (URL).
 *   - `caption?` (trim, ≤500 chars, nullable — `PainelCreateStorySchema`).
 * @returns `void` (silencioso em gating de plano ou validation fail).
 *
 * Side effects:
 * - `prisma.story.create` (`mediaType: "IMAGE"`, `expiresAt = now + 24h`).
 * - `revalidatePath("/painel/stories")`.
 *
 * @see src/lib/validation/painel-provider-settings.schema.ts (`PainelCreateStorySchema`)
 */
export async function createStory(formData: FormData) {
  const profile = await getSessionProfile();
  if (profile.planTier !== "DESTAQUE" && profile.planTier !== "PREMIUM") {
    return;
  }
  const parsed = PainelCreateStorySchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return;
  const { mediaUrl, caption } = parsed.data;

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.story.create({
    data: { profileId: profile.id, mediaUrl, mediaType: "IMAGE", caption: caption ?? null, expiresAt },
  });
  revalidatePath("/painel/stories");
}

/**
 * Remove um story do perfil logado.
 *
 * @param formData - FormData com:
 *   - `storyId` (cuid — `PainelDeleteStorySchema`).
 * @returns `void` (silencioso em validation fail).
 *
 * Side effects:
 * - `prisma.story.deleteMany` filtrado por `profileId`.
 * - `revalidatePath("/painel/stories")`.
 *
 * @see src/lib/validation/painel-provider-settings.schema.ts (`PainelDeleteStorySchema`)
 */
export async function deleteStory(formData: FormData) {
  const profile = await getSessionProfile();
  const parsed = PainelDeleteStorySchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return;
  await prisma.story.deleteMany({ where: { id: parsed.data.storyId, profileId: profile.id } });
  revalidatePath("/painel/stories");
}

async function getSessionProfile() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");
  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } });
  if (!profile) redirect("/conta/onboarding/perfil");
  return profile;
}

/**
 * Recria a tabela `AvailabilityRule` do perfil com 7 dias da semana, cada um
 * com `open` (`AVAILABLE`/`CLOSED`), `startTime` e `endTime`.
 *
 * @param formData - FormData com, para cada `weekday` em `0..6`:
 *   - `wd_<weekday>_open` (checkbox `"on"`).
 *   - `wd_<weekday>_start` (HH:MM, default `"09:00"` quando aberto).
 *   - `wd_<weekday>_end` (HH:MM, default `"18:00"` quando aberto).
 *   `SaveAvailabilityWindowsSchema` valida regex e `end > start` quando aberto.
 * @returns `{ error, issues? }` em validation fail; `void` em sucesso.
 *
 * Side effects:
 * - `prisma.$transaction`:
 *   - `AvailabilityRule.deleteMany` para o perfil.
 *   - `AvailabilityRule.createMany` com 7 linhas.
 * - `revalidatePath("/painel/disponibilidade")` e `("/p/<slug>")`.
 *
 * @see src/lib/validation/painel-provider-settings.schema.ts (`SaveAvailabilityWindowsSchema`)
 */
export async function saveAvailabilityWindows(formData: FormData) {
  const profile = await getSessionProfile();

  // Build the typed `windows` array the schema expects from the flat
  // `wd_<weekday>_<field>` form.
  const windows: { weekday: number; open: boolean; startTime: string; endTime: string }[] = [];
  for (let weekday = 0; weekday <= 6; weekday++) {
    const open = formData.get(`wd_${weekday}_open`) === "on";
    const startTime = open ? String(formData.get(`wd_${weekday}_start`) ?? "09:00").trim() : "00:00";
    const endTime = open ? String(formData.get(`wd_${weekday}_end`) ?? "18:00").trim() : "00:00";
    windows.push({ weekday, open, startTime, endTime });
  }

  const parsed = SaveAvailabilityWindowsSchema.safeParse({ windows });
  if (!parsed.success) return { error: "Validation failed", issues: parsed.error.issues };

  const rows = parsed.data.windows.map((w) => ({
    weekday: w.weekday,
    startTime: w.startTime,
    endTime: w.endTime,
    status: w.open ? "AVAILABLE" : "CLOSED",
  }));

  await prisma.$transaction([
    prisma.availabilityRule.deleteMany({ where: { profileId: profile.id } }),
    prisma.availabilityRule.createMany({
      data: rows.map((r) => ({ ...r, profileId: profile.id })),
    }),
  ]);

  revalidatePath("/painel/disponibilidade");
  revalidatePath(`/p/${profile.slug}`);
}

/**
 * Recria a tabela `ProfileDurationOption` do perfil a partir das linhas
 * preenchidas no painel (até 12 slots `dur_<i>_*`). Atualiza `priceHour` e
 * `paymentMethods` no `Profile` quando aplicável.
 *
 * @param formData - FormData com, para cada slot `i` em `0..11`:
 *   - `dur_<i>_minutes` (number, 15–2880).
 *   - `dur_<i>_label?` (string, default `"<minutes> min"`).
 *   - `dur_<i>_price` (number ≥ 0).
 *   E também:
 *   - `paymentMethods?` (string).
 *   `SaveDurationOptionsSchema` valida o array final agregado.
 * @returns `{ error, issues? }` em validation fail; `void` em sucesso.
 *
 * Side effects:
 * - `prisma.$transaction`:
 *   - `Profile.update` (atualiza `priceHour` se houver opção 60 min e
 *     `paymentMethods` se enviado).
 *   - `ProfileDurationOption.deleteMany` + `createMany` (recria do zero).
 * - `revalidatePath("/painel/valores")` e `("/p/<slug>")`.
 *
 * @see src/lib/validation/painel-provider-settings.schema.ts (`SaveDurationOptionsSchema`)
 */
export async function saveDurationOptions(formData: FormData) {
  const profile = await getSessionProfile();

  // Collect candidate rows from the indexed form fields (`dur_0_minutes`, etc.).
  const candidate: { minutes: number; label?: string; priceBrl: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const minutesRaw = formData.get(`dur_${i}_minutes`);
    if (minutesRaw == null || String(minutesRaw).trim() === "") continue;
    const minutes = Number(minutesRaw);
    if (!Number.isFinite(minutes)) continue;

    const priceRaw = formData.get(`dur_${i}_price`);
    if (!priceRaw || String(priceRaw).trim() === "") continue;
    const price = Number(priceRaw);
    if (!Number.isFinite(price)) continue;

    const label = String(formData.get(`dur_${i}_label`) ?? "").trim() || `${minutes} min`;
    candidate.push({ minutes, label, priceBrl: Math.round(price) });
  }

  const parsed = SaveDurationOptionsSchema.safeParse({
    durations: candidate,
    paymentMethods: formData.get("paymentMethods") ?? undefined,
  });
  if (!parsed.success) return { error: "Validation failed", issues: parsed.error.issues };

  const { durations, paymentMethods } = parsed.data;
  const options = durations.map((o, sortOrder) => ({ ...o, sortOrder, label: o.label ?? `${o.minutes} min` }));
  const oneHour = options.find((o) => o.minutes === 60);

  await prisma.$transaction([
    prisma.profile.update({
      where: { id: profile.id },
      data: {
        ...(oneHour ? { priceHour: oneHour.priceBrl } : {}),
        ...(paymentMethods !== undefined ? { paymentMethods } : {}),
      },
    }),
    prisma.profileDurationOption.deleteMany({ where: { profileId: profile.id } }),
    ...(options.length > 0 ? [prisma.profileDurationOption.createMany({
      data: options.map((o) => ({
        profileId: profile.id,
        minutes: o.minutes,
        label: o.label,
        priceBrl: o.priceBrl,
        sortOrder: o.sortOrder,
        active: true,
      })),
    })] : []),
  ]);

  revalidatePath("/painel/valores");
  revalidatePath(`/p/${profile.slug}`);
}

/**
 * Atualiza um registro financeiro existente do perfil logado.
 *
 * @param formData - FormData com:
 *   - `recordId` (cuid).
 *   - `clientLabel` (trim, 1–120 chars).
 *   - `durationLabel`/`locationLabel`/`paymentLabel` (trim, ≤120 chars; quando
 *     vazios, persistidos como `"—"`).
 *   - `amountBrl` (int positivo).
 *   - `isNoShow?` (boolean coerced) — `UpdateFinancialRecordSchema`.
 * @returns `{ error, issues? }` em validation fail; `void` em sucesso.
 *
 * Side effects:
 * - `prisma.financialRecord.updateMany` filtrado por `profileId`.
 * - `revalidatePath("/painel/financeiro")` e `("/painel")`.
 *
 * @see src/lib/validation/painel-provider-settings.schema.ts (`UpdateFinancialRecordSchema`)
 */
export async function updateFinancialRecord(formData: FormData) {
  const profile = await getSessionProfile();
  const parsed = UpdateFinancialRecordSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { error: "Validation failed", issues: parsed.error.issues };
  const d = parsed.data;

  await prisma.financialRecord.updateMany({
    where: { id: d.recordId, profileId: profile.id },
    data: {
      clientLabel: d.clientLabel,
      durationLabel: d.durationLabel || "—",
      locationLabel: d.locationLabel || "—",
      paymentLabel: d.paymentLabel || "—",
      amountBrl: d.amountBrl,
      isNoShow: d.isNoShow,
    },
  });

  revalidatePath("/painel/financeiro");
  revalidatePath("/painel");
}

/**
 * Remove um registro financeiro do perfil logado.
 *
 * @param formData - FormData com:
 *   - `recordId` (cuid — `DeleteFinancialRecordSchema`).
 * @returns `{ error, issues? }` em validation fail; `void` em sucesso.
 *
 * Side effects:
 * - `prisma.financialRecord.deleteMany` filtrado por `profileId`.
 * - `revalidatePath("/painel/financeiro")` e `("/painel")`.
 *
 * @see src/lib/validation/painel-provider-settings.schema.ts (`DeleteFinancialRecordSchema`)
 */
export async function deleteFinancialRecord(formData: FormData) {
  const profile = await getSessionProfile();
  const parsed = DeleteFinancialRecordSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { error: "Validation failed", issues: parsed.error.issues };

  await prisma.financialRecord.deleteMany({
    where: { id: parsed.data.recordId, profileId: profile.id },
  });

  revalidatePath("/painel/financeiro");
  revalidatePath("/painel");
}

/**
 * Troca o `@` (slug) do perfil logado. Strip de `@` e lowercase aplicados
 * antes da validação Zod.
 *
 * @param formData - FormData com:
 *   - `handle` (string, regex `^[a-z0-9_-]{3,30}$` após normalização —
 *     `ChangeHandleSchema`).
 * @returns `{ error, issues? }` em falha (validação ou colisão);
 *   `undefined` em sucesso.
 *
 * Side effects:
 * - `prisma.profile.update({ slug: handle })`.
 * - `revalidatePath` em `/painel`, `/painel/perfil`, `/p/<oldSlug>`,
 *   `/p/<newHandle>`.
 *
 * @see src/lib/validation/painel-provider-settings.schema.ts (`ChangeHandleSchema`)
 */
export async function changeHandle(formData: FormData): Promise<{ error: string; issues?: import("zod").ZodIssue[] } | undefined> {
  const profile = await getSessionProfile();
  const raw = (formData.get("handle") as string ?? "").trim().toLowerCase().replace(/^@/, "");

  const parsed = ChangeHandleSchema.safeParse({ handle: raw });
  if (!parsed.success) return { error: "Validation failed", issues: parsed.error.issues };
  const handle = parsed.data.handle;

  const existing = await prisma.profile.findFirst({ where: { slug: handle, NOT: { id: profile.id } } });
  if (existing) return { error: `@${handle} já está em uso.` };

  const oldSlug = profile.slug;
  await prisma.profile.update({ where: { id: profile.id }, data: { slug: handle } });

  revalidatePath("/painel");
  revalidatePath("/painel/perfil");
  revalidatePath(`/p/${oldSlug}`);
  revalidatePath(`/p/${handle}`);
}

/**
 * Adiciona um registro financeiro manual ao perfil logado.
 *
 * @param formData - FormData com:
 *   - `clientLabel`, `durationLabel`, `locationLabel`, `paymentLabel` (mesma
 *     política do `updateFinancialRecord`).
 *   - `amountBrl` (int positivo).
 *   - `isNoShow?` (boolean coerced).
 *   - `notes?` (trim, ≤2000 chars, nullable).
 *   `AddFinancialRecordSchema`.
 * @returns `void`. Em validation fail, **lança** `Error("Preencha cliente e
 *   valor.")` — diferente das demais ações deste arquivo, que retornam
 *   silenciosamente.
 *
 * Side effects:
 * - `prisma.financialRecord.create` (`origin: "MANUAL"`, `occurredAt: now`).
 * - `revalidatePath("/painel/financeiro")`.
 *
 * @see src/lib/validation/painel-provider-settings.schema.ts (`AddFinancialRecordSchema`)
 */
export async function addFinancialRecord(formData: FormData) {
  const profile = await getSessionProfile();
  const parsed = AddFinancialRecordSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) throw new Error("Preencha cliente e valor.");
  const d = parsed.data;

  await prisma.financialRecord.create({
    data: {
      profileId: profile.id,
      occurredAt: new Date(),
      clientLabel: d.clientLabel,
      durationLabel: d.durationLabel || "—",
      locationLabel: d.locationLabel || "—",
      paymentLabel: d.paymentLabel || "—",
      origin: "MANUAL",
      amountBrl: d.amountBrl,
      isNoShow: d.isNoShow,
      notes: d.notes ?? null,
    },
  });

  revalidatePath("/painel/financeiro");
}

// ── Boost grátis para Premium (1x por mês) ────────────────────────────────────
/**
 * Ativa um boost grátis de 24 horas para perfis Premium com plano vigente.
 * Bloqueia se já existe boost ativo (`featuredUntil > now`).
 *
 * @returns Em sucesso, redireciona para `/painel/plano`.
 *   Em falha: `{ error }` (perfil não-Premium, plano expirado ou boost já ativo).
 *
 * Side effects:
 * - `prisma.profile.update({ featuredUntil: now+24h, boostLabel: "Em destaque" })`.
 * - `revalidatePath("/painel/plano")` e `("/painel")`.
 * - Redirect para `/painel/plano`.
 */
export async function claimFreeBoost() {
  const profile = await getSessionProfile();

  const now = new Date();
  const hasPlan = profile.planExpiresAt != null && new Date(profile.planExpiresAt) > now;
  if (!hasPlan || profile.planTier !== "PREMIUM") {
    return { error: "Boost grátis disponível apenas no plano Premium." };
  }

  const isBoosted = profile.featuredUntil != null && new Date(profile.featuredUntil) > now;
  if (isBoosted) {
    return { error: "Você já tem um boost ativo." };
  }

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      featuredUntil: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      boostLabel: "Em destaque",
    },
  });

  revalidatePath("/painel/plano");
  revalidatePath("/painel");
  redirect("/painel/plano");
}

// ── Dev only: ativar plano sem pagamento ───────────────────────────────────────
/**
 * Ativa um plano por 30 dias sem passar por pagamento. **No-op em produção**
 * (`NODE_ENV === "production"`).
 *
 * @param formData - FormData com:
 *   - `tier` (`"ESSENCIAL" | "DESTAQUE" | "PREMIUM"` — `DevActivatePlanSchema`).
 * @returns `void`. Em validation fail ou em produção, retorna silenciosamente.
 *   Em sucesso, redireciona para `/painel/plano`.
 *
 * Side effects:
 * - `prisma.profile.update({ planTier, planExpiresAt: now+30d, isOnline: true })`.
 * - `revalidatePath("/painel/plano")` e `("/painel")`.
 * - Redirect para `/painel/plano`.
 *
 * @see src/lib/validation/painel-provider-settings.schema.ts (`DevActivatePlanSchema`)
 */
export async function devActivatePlan(formData: FormData) {
  if (process.env.NODE_ENV === "production") return;

  const parsed = DevActivatePlanSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return;

  const profile = await getSessionProfile();
  const planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      planTier: parsed.data.tier,
      planExpiresAt,
      isOnline: true,
    },
  });

  revalidatePath("/painel/plano");
  revalidatePath("/painel");
  redirect("/painel/plano");
}
