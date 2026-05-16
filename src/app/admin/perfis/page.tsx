/**
 * Página RSC — Admin lista de perfis (busca, filtros, ações administrativas).
 *
 * Rota: `/admin/perfis`.
 * Tipo: Server Component.
 * Auth: admin/moderator (enforço em `src/app/admin/layout.tsx`).
 * Cache: `force-dynamic` (filtros e paginação por searchParams).
 *
 * Listagem paginada de perfis com filtros (plano, verificação, cidade) e
 * ações inline: toggle de verificação, mudança de plano e advertência/
 * suspensão.
 *
 * Cross-refs:
 * - src/app/admin/layout.tsx
 * - src/components/admin/admin-shell.tsx
 * - src/components/admin/warning-form.tsx
 * - src/app/_actions/verification.ts (adminToggleVerification, adminSetPlan)
 */
import Link from "next/link";
import Image from "next/image";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { WarningForm } from "@/components/admin/warning-form";
import { BadgeCheck, Ban } from "lucide-react";
import { adminToggleVerification, adminSetPlan } from "@/app/_actions/verification";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 37 (admin perfis).
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminPerfisPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const get = (k: string) => { const v = raw[k]; return Array.isArray(v) ? v[0] : v; };

  const q = get("q")?.trim() ?? "";
  const planFilter = get("plan") ?? "";
  const verifiedFilter = get("verified") ?? "";
  const cityFilter = get("city") ?? "";
  const pageNum = Math.max(1, parseInt(get("p") ?? "1", 10));
  const PAGE_SIZE = 30;

  const where: Prisma.ProfileWhereInput = {};
  if (q) where.OR = [
    { displayName: { contains: q, mode: "insensitive" } },
    { slug: { contains: q, mode: "insensitive" } },
  ];
  if (planFilter) where.planTier = planFilter as "ESSENCIAL" | "DESTAQUE" | "PREMIUM";
  if (verifiedFilter === "1") where.isVerified = true;
  if (verifiedFilter === "0") where.isVerified = false;
  if (cityFilter) where.city = { slug: cityFilter };

  const [profiles, total, cities] = await Promise.all([
    prisma.profile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        city: { select: { name: true } },
        media: { where: { isCover: true }, take: 1, select: { url: true } },
        user: { select: { email: true } },
        _count: { select: { warnings: true } },
      },
    }),
    prisma.profile.count({ where }),
    prisma.city.findMany({ select: { name: true, slug: true }, orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function href(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merge = { q, plan: planFilter, verified: verifiedFilter, city: cityFilter, p: String(pageNum), ...overrides };
    for (const [k, v] of Object.entries(merge)) { if (v) p.set(k, v); }
    return `/admin/perfis?${p.toString()}`;
  }

  const PLAN_COLORS: Record<string, string> = {
    PREMIUM: "bg-amber-100 text-amber-800",
    DESTAQUE: "bg-purple-100 text-purple-800",
    ESSENCIAL: "bg-sky-100 text-sky-800",
  };

  return (
    <AdminShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-bold text-lg">Perfis <span className="text-muted font-normal text-sm">({total})</span></h1>
        <form method="get" action="/admin/perfis" className="flex flex-wrap gap-2">
          <input name="q" defaultValue={q} placeholder="Nome ou @handle…" className="rounded-md border border-black/10 px-2.5 py-1.5 text-xs outline-none w-44 hover:border-black/20 focus:border-blue transition-all" />
          <select name="plan" defaultValue={planFilter} className="rounded-md border border-black/10 bg-white px-2.5 py-1.5 text-xs outline-none hover:border-black/20 focus:border-blue transition-all">
            <option value="">Todos os planos</option>
            <option value="PREMIUM">Premium</option>
            <option value="DESTAQUE">Plus</option>
            <option value="ESSENCIAL">Basic</option>
          </select>
          <select name="verified" defaultValue={verifiedFilter} className="rounded-md border border-black/10 bg-white px-2.5 py-1.5 text-xs outline-none hover:border-black/20 focus:border-blue transition-all">
            <option value="">Verificação</option>
            <option value="1">Verificadas</option>
            <option value="0">Não verificadas</option>
          </select>
          <select name="city" defaultValue={cityFilter} className="rounded-md border border-black/10 bg-white px-2.5 py-1.5 text-xs outline-none hover:border-black/20 focus:border-blue transition-all">
            <option value="">Todas as cidades</option>
            {cities.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
          <button type="submit" className="bg-foreground px-3 py-1.5 text-xs font-bold text-white">Filtrar</button>
        </form>
      </div>

      <div className="rounded border border-line bg-white shadow-sm overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-2xs font-bold uppercase tracking-wider text-muted">
              <th className="px-3 py-2.5">Foto</th>
              <th className="px-3 py-2.5">Nome</th>
              <th className="px-3 py-2.5">Cidade</th>
              <th className="px-3 py-2.5">Plano</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => {
              const cover = p.media[0]?.url;
              return (
                <tr key={p.id} className="border-b border-line last:border-0 hover:bg-line/20 transition">
                  <td className="px-3 py-2">
                    <div className="relative h-9 w-7 overflow-hidden rounded bg-line">
                      {cover && <Image src={cover} alt="" fill className="object-cover" sizes="28px" />}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold">{p.displayName}</span>
                      {p.isVerified && <BadgeCheck className="h-3.5 w-3.5 text-success" strokeWidth={2} />}
                    </div>
                    <p className="text-xs text-muted">@{p.slug} · {p.user?.email}</p>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted">{p.city.name}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded px-1.5 py-0.5 text-2xs font-bold uppercase ${PLAN_COLORS[p.planTier] ?? "bg-line text-muted"}`}>
                      {p.planTier}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {p.isSuspended ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
                        <Ban className="h-3 w-3" strokeWidth={2} /> Suspensa
                      </span>
                    ) : (
                      <span className={`text-xs font-semibold ${p.isOnline ? "text-success" : "text-muted"}`}>
                        {p.isOnline ? "● Online" : "○ Offline"}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      {/* Toggle verificação */}
                      <form action={adminToggleVerification.bind(null, p.id)}>
                        <button
                          type="submit"
                          className={`text-2xs font-bold px-2 py-1 border transition ${p.isVerified
                            ? "border-success/30 bg-success/10 text-success hover:bg-success/20"
                            : "border-line text-muted hover:border-foreground/30"
                            }`}
                        >
                          {p.isVerified ? "✓ Verificada" : "Verificar"}
                        </button>
                      </form>
                      {/* Mudar plano */}
                      <form
                        action={async (fd: FormData) => {
                          "use server";
                          await adminSetPlan(p.id, fd.get("plan") as string);
                        }}
                        className="flex items-center gap-1"
                      >
                        <select
                          name="plan"
                          defaultValue={p.planTier}
                          className="border border-line bg-white px-1.5 py-1 text-2xs outline-none"
                        >
                          <option value="ESSENCIAL">Basic</option>
                          <option value="DESTAQUE">Plus</option>
                          <option value="PREMIUM">Premium</option>
                        </select>
                        <button type="submit" className="border border-line px-2 py-1 text-2xs font-bold text-muted hover:text-foreground transition">
                          OK
                        </button>
                      </form>
                      {/* Advertir / Suspender */}
                      <WarningForm
                        profileId={p.id}
                        profileName={p.displayName}
                        warningCount={p._count.warnings}
                        isSuspended={p.isSuspended}
                      />
                      <Link href={`/p/${p.slug}`} target="_blank" className="text-xs text-muted underline hover:text-foreground">
                        ↗
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-3 flex justify-end gap-1 text-xs">
          {pageNum > 1 && <Link href={href({ p: String(pageNum - 1) })} className="border border-line px-2.5 py-1 hover:bg-line">←</Link>}
          {Array.from({ length: totalPages }, (_, i) => i + 1).filter((n) => Math.abs(n - pageNum) <= 2).map((n) => (
            <Link key={n} href={href({ p: String(n) })} className={`border px-2.5 py-1 ${n === pageNum ? "border-foreground bg-foreground text-white" : "border-line hover:bg-line"}`}>{n}</Link>
          ))}
          {pageNum < totalPages && <Link href={href({ p: String(pageNum + 1) })} className="border border-line px-2.5 py-1 hover:bg-line">→</Link>}
        </div>
      )}
    </AdminShell>
  );
}
