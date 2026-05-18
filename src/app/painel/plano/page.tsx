/**
 * Página RSC — Painel do provider: gestão de plano e boost.
 *
 * Rota: `/painel/plano`.
 * Tipo: Server Component (botões são Client).
 * Auth: acompanhante (PROVIDER) — gate em `src/app/painel/layout.tsx`.
 * Cache: `force-dynamic` (lê `planTier`, `planExpiresAt`, `featuredUntil`).
 *
 * Visual v2 (Tahoe Sensual):
 * - Cards `<Card variant="solid">` (rounded-2xl, border-line, shadow-sm via tokens).
 * - Boost ativo: `<Card variant="warning-subtle">` em vez de border/bg ad-hoc.
 * - Plan ativo: `<Card variant="solid">` com border rose + bg rose-soft (anel sutil).
 * - Pills "Plano atual" / "Premium · grátis 1×" usando rose-soft + tracking-wider.
 *
 * Cross-refs:
 * - src/app/painel/plano/upgrade-button.tsx
 * - src/app/_actions/subscription.ts (boost / upgrade)
 * - src/app/api/mp/checkout/route.ts
 */
import { redirect } from "next/navigation";
import { Check, Zap } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BoostButton, FreeBoostButton, UpgradeButton } from "./upgrade-button";

export const dynamic = "force-dynamic";

const PLANS = [
  {
    tier: "ESSENCIAL",
    name: "Basic",
    price: "R$ 39,90",
    features: [
      "Perfil completo",
      "Aparece em buscas",
      "Botão WhatsApp",
      "Selo verificado",
    ],
  },
  {
    tier: "DESTAQUE",
    name: "Plus",
    price: "R$ 89",
    features: [
      "Tudo do Basic",
      "Até 20 fotos",
      "Badge Plus",
      "Estatísticas de views",
    ],
  },
  {
    tier: "PREMIUM",
    name: "Premium",
    price: "R$ 189",
    features: [
      "Tudo do Plus",
      "Fotos privadas",
      "Posição destaque na home",
      "1 boost grátis/mês",
    ],
  },
] as const;

export default async function PainelPlanoPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: {
      planTier: true,
      planExpiresAt: true,
      featuredUntil: true,
      slug: true,
    },
  });
  if (!profile) redirect("/conta/onboarding/perfil");

  const now = new Date();
  const isBoosted =
    profile.featuredUntil != null && new Date(profile.featuredUntil) > now;
  const hasPlan =
    profile.planExpiresAt != null && new Date(profile.planExpiresAt) > now;
  const currentName =
    { ESSENCIAL: "Essencial", DESTAQUE: "Destaque", PREMIUM: "Premium" }[
    profile.planTier
    ] ?? profile.planTier;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-[-0.025em] text-ink sm:text-4xl">
          Plano
        </h1>
        {hasPlan ? (
          <p className="mt-2 text-md text-ink-dim">
            Plano{" "}
            <span className="font-semibold text-ink">{currentName}</span>{" "}
            ativo até{" "}
            <span className="font-semibold text-ink">
              {new Date(profile.planExpiresAt!).toLocaleDateString("pt-BR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </p>
        ) : (
          <Card
            variant="warning-subtle"
            padding="none"
            className="mt-3 flex items-center gap-2.5 px-4 py-3"
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-warning" />
            <p className="text-base font-medium text-warning">
              Nenhum plano ativo — você não aparece nas buscas.
            </p>
          </Card>
        )}
      </div>

      {/* Boost card */}
      <Card
        variant={isBoosted ? "warning-subtle" : "solid"}
        padding="md"
      >
        <div className="flex items-center gap-2">
          <Zap
            className={cn(
              "h-4 w-4",
              isBoosted ? "text-warning" : "text-ink-dim",
            )}
            strokeWidth={1.75}
          />
          <p className="text-md font-semibold tracking-[-0.011em] text-ink">
            Boost de 24h
          </p>
          {hasPlan && profile.planTier === "PREMIUM" && (
            <span className="ml-auto inline-flex items-center rounded-full bg-rose-soft px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider text-rose">
              1 grátis/mês · Premium
            </span>
          )}
        </div>
        {isBoosted ? (
          <p className="mt-2 text-base text-warning">
            Boost ativo — expira em{" "}
            <span className="font-semibold tabular-nums">
              {new Date(profile.featuredUntil!).toLocaleString("pt-BR", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </p>
        ) : (
          <>
            <p className="mt-2 text-base text-ink-dim">
              Sobe seu perfil ao topo por 24h.{" "}
              {hasPlan && profile.planTier === "PREMIUM"
                ? "Grátis para Premium — use 1× por mês."
                : "R$ 89 por disparo."}
            </p>
            <div className="mt-3">
              {hasPlan && profile.planTier === "PREMIUM" ? (
                <FreeBoostButton />
              ) : (
                <BoostButton />
              )}
            </div>
          </>
        )}
      </Card>

      {/* Plan cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {PLANS.map((plan) => {
          const isActive = hasPlan && profile.planTier === plan.tier;
          return (
            <div
              key={plan.tier}
              className={cn(
                "relative rounded-2xl border bg-white p-5 shadow-[var(--shadow-sm)] transition-colors duration-150",
                isActive
                  ? "border-rose ring-2 ring-rose/20"
                  : "border-line hover:border-rose/30",
              )}
            >
              {isActive && (
                <span className="mb-3 inline-flex items-center rounded-full bg-rose-soft px-2.5 py-0.5 text-2xs font-semibold uppercase tracking-wider text-rose">
                  Plano atual
                </span>
              )}
              <p className="text-lg font-semibold tracking-[-0.011em] text-ink">
                {plan.name}
              </p>
              <p className="mt-1">
                <span className="text-3xl font-bold tabular-nums tracking-[-0.022em] text-ink">
                  {plan.price}
                </span>
                <span className="ml-1 text-sm text-ink-dim">/mês</span>
              </p>
              <ul className="mt-4 space-y-2.5">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-base text-ink-dim"
                  >
                    <Check
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success"
                      strokeWidth={2.5}
                    />
                    {f}
                  </li>
                ))}
              </ul>
              {!isActive && (
                <div className="mt-5">
                  <UpgradeButton tier={plan.tier} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-sm text-ink-dim">
        Pagamentos via PIX, cartão ou boleto. Sem comissão sobre encontros.
        Cancele quando quiser.
      </p>
    </div>
  );
}
