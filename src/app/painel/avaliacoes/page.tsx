/**
 * Página RSC — Painel do provider: avaliações recebidas.
 *
 * Rota: `/painel/avaliacoes`.
 * Tipo: Server Component.
 * Auth: acompanhante (PROVIDER) — gate em `src/app/painel/layout.tsx`.
 * Cache: `force-dynamic` (lista pode mudar a qualquer momento).
 *
 * Sumário (média, total, distribuição) + lista cronológica de `Review`s.
 *
 * Cross-refs:
 * - src/app/painel/layout.tsx
 * - src/app/api/review/route.ts
 */
import { redirect } from "next/navigation";
import { Star, MessageSquare, TrendingUp } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 31 (avaliações recebidas).
export const dynamic = "force-dynamic";

const STARS = [1, 2, 3, 4, 5];

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {STARS.map((n) => (
        <Star
          key={n}
          className={cn(
            "h-3.5 w-3.5",
            n <= rating ? "fill-coral text-coral" : "text-line",
          )}
          strokeWidth={0}
        />
      ))}
    </span>
  );
}

function ratingLabel(r: number) {
  return ["", "Muito ruim", "Ruim", "Regular", "Boa", "Excelente"][r] ?? "";
}

export default async function PainelAvaliacoesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, ratingAvg: true, ratingCount: true },
  });
  if (!profile) redirect("/conta/onboarding/perfil");

  const reviews = await prisma.review.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, slug: true } },
    },
  });

  // Distribution
  const dist = [5, 4, 3, 2, 1].map((n) => ({
    star: n,
    count: reviews.filter((r) => r.rating === n).length,
  }));

  const pct = (n: number) =>
    profile.ratingCount > 0 ? Math.round((n / profile.ratingCount) * 100) : 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Avaliações</h1>
        <p className="mt-1 text-md text-muted">
          O que os clientes dizem sobre você. Visível para assinantes no seu perfil.
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-xs font-medium text-muted">Média geral</p>
          <p className="mt-2 text-4xl font-bold tabular-nums">
            {profile.ratingAvg > 0 ? profile.ratingAvg.toFixed(1) : "—"}
          </p>
          {profile.ratingAvg > 0 && (
            <div className="mt-2">
              <StarRow rating={Math.round(profile.ratingAvg)} />
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-xs font-medium text-muted">Total</p>
          <p className="mt-2 text-4xl font-bold tabular-nums">{profile.ratingCount}</p>
          <p className="mt-1 text-xs text-muted">
            avaliação{profile.ratingCount !== 1 ? "ões" : ""}
          </p>
        </div>

        <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-xs font-medium text-muted flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" strokeWidth={1.5} />
            Distribuição
          </p>
          <ul className="mt-3 space-y-1.5">
            {dist.map(({ star, count }) => (
              <li key={star} className="flex items-center gap-2 text-xs">
                <span className="w-4 shrink-0 text-right text-muted">{star}</span>
                <Star className="h-3 w-3 fill-coral text-coral shrink-0" strokeWidth={0} />
                <div className="flex-1 h-1.5 rounded-full bg-line overflow-hidden">
                  <div
                    className="h-full rounded-full bg-coral"
                    style={{ width: `${pct(count)}%` }}
                  />
                </div>
                <span className="w-5 shrink-0 text-right text-muted">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <EmptyState
          title="Nenhuma avaliação ainda"
          description="As avaliações aparecem aqui depois que clientes assinantes visitarem seu perfil."
          icon={<MessageSquare className="h-10 w-10" strokeWidth={1.5} />}
        />
      ) : (
        <div className="space-y-3">
          <p className="text-base font-medium text-muted">
            {reviews.length} avaliação{reviews.length !== 1 ? "ões" : ""}
          </p>
          {reviews.map((r) => (
            <article key={r.id} className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-white">
                    {(r.user.name ?? "?")[0].toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-semibold leading-tight">
                      {r.user.slug ? `@${r.user.slug}` : (r.user.name ?? "Usuário")}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <StarRow rating={r.rating} />
                      <span className="text-xs text-muted">{ratingLabel(r.rating)}</span>
                    </div>
                  </div>
                </div>
                <time className="shrink-0 text-xs text-muted">
                  {r.createdAt.toLocaleDateString("pt-BR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </time>
              </div>
              {r.comment && (
                <blockquote className="mt-4 border-l-2 border-coral/30 pl-4 text-sm italic leading-relaxed text-muted">
                  {r.comment}
                </blockquote>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
