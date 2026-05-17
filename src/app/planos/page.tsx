/**
 * Página RSC — Pricing público dos planos para acompanhantes — Design System v2.
 *
 * Rota: `/planos`.
 * Tipo: Server Component.
 * Auth: público.
 * Cache: `revalidate = 900` (Route Segment Config — janela de 15min).
 *
 * Estrutura:
 *  1. ListingHeader com eyebrow rose + headline "Sua presença"
 *  2. Pílulas Mensal / Trimestral / Anual (estáticas — comunicam estrutura)
 *  3. Grid 3-col com plans (Basic neutro / Plus highlighted / Premium rose)
 *  4. Boost à la carte em Card glass
 *  5. FAQ em <details> com divisores hairline
 */
import { Check, X, Zap, Crown } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ListingHeader } from "@/components/ui/listing-header";
import { cn } from "@/lib/utils";

// Cache strategy: revalidate=900 (legacy Route Segment Config).
// Cf. .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 9.
export const revalidate = 900;

type Plan = {
  key: "basic" | "plus" | "premium";
  name: string;
  tagline: string;
  /** Preço em reais inteiros (BRL). Use 89 para "R$ 89". */
  priceBrl: number;
  /** Sufixo decimal opcional (ex.: ",90"). Mostrado pequeno depois do valor. */
  priceDecimals?: string;
  highlight?: "popular" | "premium";
  included: string[];
  notIncluded: string[];
  cta: { label: string; href: string };
};

const PLANS: Plan[] = [
  {
    key: "basic",
    name: "Basic",
    tagline: "Pra começar com o pé direito.",
    priceBrl: 39,
    priceDecimals: ",90",
    included: [
      "Perfil completo com até 6 fotos",
      "Aparece em busca e cidades",
      "Botão direto pro WhatsApp",
      "Selo verificado após aprovação",
    ],
    notIncluded: [
      "Agenda no site",
      "Gestão financeira",
      "Boosts de listagem",
      "Estatísticas detalhadas",
    ],
    cta: { label: "Assinar Basic", href: "/entrar" },
  },
  {
    key: "plus",
    name: "Plus",
    tagline: "Pra aparecer mais e converter mais.",
    priceBrl: 89,
    highlight: "popular",
    included: [
      "Tudo do Basic",
      "Até 20 fotos + 3 vídeos",
      "Topo da cidade em rodízio editorial",
      "Badge Plus",
      "Estatísticas de views",
      "Pedidos de encontro pelo site",
    ],
    notIncluded: ["Gestão financeira", "Suporte prioritário"],
    cta: { label: "Assinar Plus", href: "/entrar" },
  },
  {
    key: "premium",
    name: "Premium",
    tagline: "Controle total do seu negócio.",
    priceBrl: 189,
    highlight: "premium",
    included: [
      "Tudo do Plus",
      "Fotos privadas sob liberação",
      "Destaque na home da plataforma",
      "Financeiro completo + histórico",
      "Ranking de clientes recorrentes",
      "1 boost 24h grátis / mês",
      "Suporte WhatsApp prioritário",
    ],
    notIncluded: [],
    cta: { label: "Assinar Premium", href: "/entrar" },
  },
];

const FAQ = [
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. Sem fidelidade — cancela em um clique e mantém seu perfil no plano Basic, se desejar.",
    open: true,
  },
  {
    q: "Posso mudar de plano depois?",
    a: "Sempre. Suba ou desça de plano a qualquer momento. O valor é cobrado proporcionalmente.",
    open: false,
  },
  {
    q: "Os dados do financeiro ficam seguros?",
    a: "Sim. Apenas você tem acesso ao seu financeiro. Nenhum dado é compartilhado com terceiros.",
    open: false,
  },
];

export default function PlanosPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen pb-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ListingHeader
            eyebrow="Planos para acompanhantes"
            eyebrowVariant="rose"
            title={
              <>
                Sua presença,{" "}
                <span className="text-rose">com o peso que merece.</span>
              </>
            }
            subtitle={
              <>
                Todos os planos incluem perfil verificado e acesso à plataforma.
                Sem comissão sobre encontros — cancele quando quiser.
              </>
            }
          />

          {/* Toggle de período (estático — comunica estrutura) */}
          <div className="inline-flex rounded-full border border-line bg-white p-1 text-xs font-semibold shadow-[var(--shadow-sm)]">
            <span className="rounded-full bg-rose px-4 py-2 text-white">
              Mensal
            </span>
            <span className="px-4 py-2 text-ink-dim">Trimestral · -10%</span>
            <span className="px-4 py-2 text-ink-dim">Anual · -20%</span>
          </div>

          {/* Plans grid */}
          <div className="mt-10 grid gap-6 sm:mt-14 lg:grid-cols-3">
            {PLANS.map((p) => (
              <PlanCard key={p.key} plan={p} />
            ))}
          </div>

          {/* Boost à la carte */}
          <Card variant="glass" padding="lg" className="mt-12">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <Badge variant="rose" className="text-2xs">
                  À la carte
                </Badge>
                <h3 className="mt-3 text-2xl font-bold tracking-[-0.022em] text-ink sm:text-3xl">
                  <Zap
                    className="mr-2 inline-block h-5 w-5 text-peach"
                    strokeWidth={2}
                    aria-hidden
                  />
                  Boost de 24 horas
                </h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-dim">
                  Sobe seu perfil ao topo da listagem por um dia. Disparo
                  único, sem mensalidade extra.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <Stat label="Aumento médio" value="+340%" sub="views" />
                <Stat
                  label="Disparo único"
                  value="R$ 89"
                  sub="por boost"
                  emphasized
                />
                <Button href="/painel" variant="primary" size="lg">
                  Disparar boost
                </Button>
              </div>
            </div>
          </Card>

          <p className="mx-auto mt-12 max-w-2xl text-center text-xs leading-relaxed text-ink-dim">
            A Privello não cobra comissão sobre encontros. Pagamentos de plano
            via PIX, cartão ou boleto. Serviço destinado a maiores de 18 anos.
          </p>

          {/* FAQ */}
          <section className="mx-auto mt-20 max-w-2xl">
            <p className="text-2xs font-semibold uppercase tracking-wider text-ink-dim">
              Dúvidas frequentes
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.022em] text-ink sm:text-4xl">
              Tudo que perguntam.
            </h2>
            <div className="mt-8 divide-y divide-line border-t border-line">
              {FAQ.map((f) => (
                <details
                  key={f.q}
                  open={f.open}
                  className="group py-6"
                >
                  <summary className="cursor-pointer list-none text-md font-semibold text-ink">
                    {f.q}
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-ink-dim">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

// ── PlanCard inline (uso único nesta página) ──────────────────────────────

function PlanCard({ plan }: { plan: Plan }) {
  const isPlus = plan.highlight === "popular";
  const isPremium = plan.highlight === "premium";

  return (
    <article
      className={cn(
        "relative flex flex-col overflow-hidden rounded-2xl p-8",
        "transition-all duration-200 ease-[var(--ease-tahoe)]",
        // Basic: card neutro
        !isPlus &&
        !isPremium &&
        "border border-line bg-white shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]",
        // Plus: ink (preto ameixa) — destaque editorial
        isPlus &&
        "bg-ink text-white shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)]",
        // Premium: rose (rose primary)
        isPremium &&
        "bg-rose text-white shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)]",
      )}
    >
      {isPlus && (
        <span className="absolute right-4 top-0 -translate-y-1/2 inline-flex items-center gap-1 rounded-full bg-rose px-2.5 py-1 text-2xs font-bold uppercase tracking-wider text-white shadow-[var(--shadow-sm)]">
          <Crown className="h-2.5 w-2.5" strokeWidth={2.4} aria-hidden />
          Mais escolhido
        </span>
      )}

      <h2
        className={cn(
          "text-2xl font-bold tracking-[-0.022em]",
          !isPlus && !isPremium && "text-ink",
        )}
      >
        {plan.name}
      </h2>
      <p
        className={cn(
          "mt-1 text-sm",
          isPlus || isPremium ? "text-white/70" : "text-ink-dim",
        )}
      >
        {plan.tagline}
      </p>

      <div className="mt-6 flex items-baseline gap-3">
        <span
          className={cn(
            "text-4xl font-bold tabular-nums tracking-[-0.02em]",
            isPlus || isPremium ? "text-white" : "text-rose",
          )}
        >
          R$ {plan.priceBrl.toLocaleString("pt-BR")}
          {plan.priceDecimals && (
            <span className="text-2xl">{plan.priceDecimals}</span>
          )}
        </span>
        <span
          className={cn(
            "text-md",
            isPlus || isPremium ? "text-white/70" : "text-ink-dim",
          )}
        >
          / mês
        </span>
      </div>

      <Button
        href={plan.cta.href}
        variant={isPremium || isPlus ? "outline" : "primary"}
        size="lg"
        className={cn(
          "mt-6 w-full",
          // Em cards escuros, botão outline precisa virar branco com texto colorido
          isPlus &&
          "!border-white !bg-white !text-ink hover:!bg-white/90",
          isPremium &&
          "!border-white !bg-white !text-rose hover:!bg-white/90",
        )}
      >
        {plan.cta.label}
      </Button>

      <ul className="mt-8 space-y-3 text-sm">
        {plan.included.map((t) => (
          <li
            key={t}
            className={cn(
              "flex items-start gap-2",
              isPlus || isPremium ? "text-white" : "text-ink",
            )}
          >
            <Check
              className={cn(
                "h-4 w-4 shrink-0 mt-0.5",
                isPlus || isPremium ? "text-white" : "text-rose",
              )}
              strokeWidth={2.4}
            />
            {t}
          </li>
        ))}
        {plan.notIncluded.map((t) => (
          <li
            key={t}
            className={cn(
              "flex items-start gap-2",
              isPlus || isPremium ? "text-white/40" : "text-ink-faint",
            )}
          >
            <X
              className="mt-0.5 h-4 w-4 shrink-0"
              strokeWidth={2}
            />
            {t}
          </li>
        ))}
      </ul>
    </article>
  );
}

function Stat({
  label,
  value,
  sub,
  emphasized,
}: {
  label: string;
  value: string;
  sub?: string;
  emphasized?: boolean;
}) {
  return (
    <div className="text-center">
      <p className="text-2xs font-semibold uppercase tracking-wider text-ink-dim">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-2xl font-bold tabular-nums tracking-[-0.022em]",
          emphasized ? "text-rose" : "text-ink",
        )}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-ink-dim">{sub}</p>}
    </div>
  );
}
