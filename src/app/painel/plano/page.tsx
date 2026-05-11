import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Zap } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PLANS = [
  {
    tier: "ESSENCIAL",
    name: "Essencial",
    price: "R$ 39,90",
    features: ["Perfil completo", "Aparece em buscas", "Botão WhatsApp", "Selo verificado"],
  },
  {
    tier: "DESTAQUE",
    name: "Destaque",
    price: "R$ 89",
    features: ["Tudo do Essencial", "Até 20 fotos", "Badge Destaque", "Estatísticas de views"],
  },
  {
    tier: "PREMIUM",
    name: "Premium",
    price: "R$ 189",
    features: ["Tudo do Destaque", "Fotos privadas", "Posição premium", "1 boost grátis/mês"],
  },
] as const;

export default async function PainelPlanoPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { planTier: true, featuredUntil: true, slug: true },
  });
  if (!profile) redirect("/conta/onboarding/perfil");

  const isBoosted = profile.featuredUntil != null && new Date(profile.featuredUntil) > new Date();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plano</h1>
        <p className="mt-1 text-sm text-muted">
          Plano atual: <span className="font-semibold text-foreground">{profile.planTier}</span>
        </p>
      </div>

      {/* Boost status */}
      <div className={`border p-5 ${isBoosted ? "border-orange-500/30 bg-orange-50" : "border-line bg-white"}`}>
        <div className="flex items-center gap-2">
          <Zap className={`h-5 w-5 ${isBoosted ? "text-orange-500" : "text-muted"}`} strokeWidth={1.5} />
          <p className="font-semibold">Boost de 24h</p>
        </div>
        {isBoosted ? (
          <p className="mt-2 text-sm text-orange-600">
            Boost ativo — expira em{" "}
            {new Date(profile.featuredUntil!).toLocaleString("pt-BR", {
              day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
            })}
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted">Sobe seu perfil ao topo da listagem por 24h. R$ 89 por disparo.</p>
            <Link href="/planos" className="mt-3 inline-block bg-coral px-5 py-2 text-xs font-bold uppercase tracking-wider text-white">
              Disparar boost
            </Link>
          </>
        )}
      </div>

      {/* Plan cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = profile.planTier === plan.tier;
          return (
            <div key={plan.tier} className={`border p-6 ${isCurrent ? "border-coral bg-coral/5" : "border-line bg-white"}`}>
              {isCurrent && (
                <span className="mb-3 inline-block bg-coral px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                  Plano atual
                </span>
              )}
              <p className="text-lg font-bold">{plan.name}</p>
              <p className="mt-1 text-2xl font-bold">{plan.price}<span className="text-sm font-normal text-muted"> /mês</span></p>
              <ul className="mt-4 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted">
                    <Check className="h-3.5 w-3.5 shrink-0 text-success" strokeWidth={2} />
                    {f}
                  </li>
                ))}
              </ul>
              {!isCurrent && (
                <Link href="/planos" className="mt-5 block w-full border border-foreground py-2 text-center text-xs font-bold uppercase tracking-wider text-foreground transition hover:bg-foreground hover:text-white">
                  Fazer upgrade
                </Link>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted">
        Pagamentos via PIX, cartão ou boleto. Sem comissão sobre encontros. Cancele quando quiser.
      </p>
    </div>
  );
}
