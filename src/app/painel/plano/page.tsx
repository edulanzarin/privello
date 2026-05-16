import { redirect } from "next/navigation";
import { Check, Zap } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UpgradeButton, BoostButton, FreeBoostButton } from "./upgrade-button";

export const dynamic = "force-dynamic";

const PLANS = [
  {
    tier: "ESSENCIAL",
    name: "Basic",
    price: "R$ 39,90",
    features: ["Perfil completo", "Aparece em buscas", "Botão WhatsApp", "Selo verificado"],
  },
  {
    tier: "DESTAQUE",
    name: "Plus",
    price: "R$ 89",
    features: ["Tudo do Basic", "Até 20 fotos", "Badge Plus", "Estatísticas de views"],
  },
  {
    tier: "PREMIUM",
    name: "Premium",
    price: "R$ 189",
    features: ["Tudo do Plus", "Fotos privadas", "Posição destaque na home", "1 boost grátis/mês"],
  },
] as const;

export default async function PainelPlanoPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { planTier: true, planExpiresAt: true, featuredUntil: true, slug: true },
  });
  if (!profile) redirect("/conta/onboarding/perfil");

  const now = new Date();
  const isBoosted = profile.featuredUntil != null && new Date(profile.featuredUntil) > now;
  const hasPlan = profile.planExpiresAt != null && new Date(profile.planExpiresAt) > now;
  const currentName = { ESSENCIAL: "Essencial", DESTAQUE: "Destaque", PREMIUM: "Premium" }[profile.planTier] ?? profile.planTier;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Plano</h1>
        {hasPlan ? (
          <p className="mt-1 text-[14px] text-muted">
            Plano <span className="font-semibold text-foreground">{currentName}</span> ativo até{" "}
            <span className="font-semibold text-foreground">
              {new Date(profile.planExpiresAt!).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </p>
        ) : (
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-amber-200/60 bg-amber-50 px-4 py-3">
            <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
            <p className="text-[13px] text-amber-800 font-medium">Nenhum plano ativo — você não aparece nas buscas.</p>
          </div>
        )}
      </div>

      {/* Boost card */}
      <div className={`rounded-2xl border p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ${
        isBoosted
          ? "border-[#ff9500]/25 bg-[#ff9500]/[0.05]"
          : "border-black/[0.06] bg-white"
      }`}>
        <div className="flex items-center gap-2">
          <Zap className={`h-4 w-4 ${isBoosted ? "text-[#ff9500]" : "text-muted"}`} strokeWidth={1.5} />
          <p className="text-[14px] font-semibold">Boost de 24h</p>
          {hasPlan && profile.planTier === "PREMIUM" && (
            <span className="ml-auto rounded-full bg-coral/10 px-2 py-0.5 text-[10px] font-semibold text-coral">1 grátis/mês · Premium</span>
          )}
        </div>
        {isBoosted ? (
          <p className="mt-2 text-[13px] text-[#b36200]">
            Boost ativo — expira em{" "}
            {new Date(profile.featuredUntil!).toLocaleString("pt-BR", {
              day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
            })}
          </p>
        ) : (
          <>
            <p className="mt-1.5 text-[13px] text-muted">
              Sobe seu perfil ao topo por 24h.{" "}
              {hasPlan && profile.planTier === "PREMIUM" ? "Grátis para Premium — use 1x por mês." : "R$ 89 por disparo."}
            </p>
            <div className="mt-3">
              {hasPlan && profile.planTier === "PREMIUM" ? <FreeBoostButton /> : <BoostButton />}
            </div>
          </>
        )}
      </div>

      {/* Plan cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {PLANS.map((plan) => {
          const isActive = hasPlan && profile.planTier === plan.tier;
          return (
            <div
              key={plan.tier}
              className={`relative rounded-2xl border p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition ${
                isActive
                  ? "border-coral/25 bg-coral/[0.04]"
                  : "border-black/[0.06] bg-white"
              }`}
            >
              {isActive && (
                <span className="mb-3 inline-flex items-center rounded-full bg-coral/10 px-2.5 py-0.5 text-[11px] font-semibold text-coral">
                  Plano atual
                </span>
              )}
              <p className="text-[15px] font-semibold">{plan.name}</p>
              <p className="mt-1">
                <span className="text-[22px] font-semibold tabular-nums tracking-tight">{plan.price}</span>
                <span className="ml-1 text-[12px] text-muted">/mês</span>
              </p>
              <ul className="mt-4 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[13px] text-muted">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#30d158]" strokeWidth={2.5} />
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

      <p className="text-[12px] text-muted">
        Pagamentos via PIX, cartão ou boleto. Sem comissão sobre encontros. Cancele quando quiser.
      </p>
    </div>
  );
}
