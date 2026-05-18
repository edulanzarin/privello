/**
 * Página RSC — Painel do provider: avaliações recebidas.
 *
 * Rota: `/painel/avaliacoes`.
 * Tipo: Server Component.
 * Auth: acompanhante (PROVIDER) — gate em `src/app/painel/layout.tsx`.
 * Cache: `force-dynamic`.
 *
 * Visual v2 (Tahoe Sensual):
 * - 3 KPI cards `rounded-2xl border-line bg-white shadow-sm` com eyebrow uppercase.
 * - Estrelas via `<RatingStars>` primitivo (cream fill, line vazio).
 * - Lista de reviews em cards com border-l-2 rose/30 no comentário.
 *
 * Cross-refs:
 * - src/app/painel/layout.tsx
 * - src/app/api/review/route.ts
 * - src/components/ui/rating-stars.tsx
 */
import { redirect } from "next/navigation";
import { MessageSquare, Star, TrendingUp } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/ui/empty-state";
import { RatingStars } from "@/components/ui/rating-stars";

export const dynamic = "force-dynamic";

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

  const dist = [5, 4, 3, 2, 1].map((n) => ({
    star: n,
    count: reviews.filter((r) => r.rating === n).length,
  }));

  const pct = (n: number) =>
    profile.ratingCount > 0 ? Math.round((n / profile.ratingCount) * 100) : 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-[-0.025em] text-ink sm:text-4xl">
          Avaliações
        </h1>
        <p className="mt-2 text-md text-ink-dim">
          O que os clientes dizem sobre você. Visível para assinantes no seu
          perfil.
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-sm)]">
          <p className="text-2xs font-semibold uppercase tracking-wider text-ink-dim">
            Média geral
          </p>
          <p className="mt-2 text-4xl font-bold tabular-nums tracking-[-0.025em] text-ink">
            {profile.ratingAvg > 0 ? profile.ratingAvg.toFixed(1) : "—"}
          </p>
          {profile.ratingAvg > 0 && (
            <div className="mt-2">
              <RatingStars
                value={Math.round(profile.ratingAvg)}
                size="sm"
              />
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-sm)]">
          <p className="text-2xs font-semibold uppercase tracking-wider text-ink-dim">
            Total
          </p>
          <p className="mt-2 text-4xl font-bold tabular-nums tracking-[-0.025em] text-ink">
            {profile.ratingCount}
          </p>
          <p className="mt-1 text-xs text-ink-dim">
            avaliação{profile.ratingCount !== 1 ? "ões" : ""}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-sm)]">
          <p className="inline-flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-ink-dim">
            <TrendingUp className="h-3.5 w-3.5" strokeWidth={1.75} />
            Distribuição
          </p>
          <ul className="mt-3 space-y-1.5">
            {dist.map(({ star, count }) => (
              <li key={star} className="flex items-center gap-2 text-xs">
                <span className="w-4 shrink-0 text-right tabular-nums text-ink-dim">
                  {star}
                </span>
                <Star
                  className="h-3 w-3 shrink-0 fill-cream text-cream"
                  strokeWidth={0}
                />
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line/50">
                  <div
                    className="h-full rounded-full bg-rose"
                    style={{ width: `${pct(count)}%` }}
                  />
                </div>
                <span className="w-5 shrink-0 text-right tabular-nums text-ink-dim">
                  {count}
                </span>
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
          <p className="text-2xs font-semibold uppercase tracking-wider text-ink-dim">
            {reviews.length} avaliação{reviews.length !== 1 ? "ões" : ""}
          </p>
          {reviews.map((r) => (
            <article
              key={r.id}
              className="rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-sm)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
                    {(r.user.name ?? "?")[0].toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-semibold leading-tight text-ink">
                      {r.user.slug
                        ? `@${r.user.slug}`
                        : r.user.name ?? "Usuário"}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <RatingStars value={r.rating} size="xs" />
                      <span className="text-xs text-ink-dim">
                        {ratingLabel(r.rating)}
                      </span>
                    </div>
                  </div>
                </div>
                <time className="shrink-0 text-xs tabular-nums text-ink-faint">
                  {r.createdAt.toLocaleDateString("pt-BR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </time>
              </div>
              {r.comment && (
                <blockquote className="mt-4 border-l-2 border-rose/30 pl-4 text-sm italic leading-relaxed text-ink-dim">
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
