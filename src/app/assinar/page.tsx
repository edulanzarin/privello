/**
 * Página RSC — Pricing de assinatura para clientes (R$19,90/mês).
 *
 * Rota: `/assinar`.
 * Tipo: Server Component.
 * Auth: cliente logado (não-cliente é redirecionado para `/entrar`; já
 *  assinante é redirecionado para `from` ou `/`).
 * Cache: `force-dynamic` (lê `auth()` + `isSubscriber`).
 *
 * Visual:
 * - Tahoe Sensual v2 — `<SiteHeader>` + `<SiteFooter>`, container
 *   `max-w-md` (form/payment archetype), card `rounded-2xl border-line bg-white`
 *   com pricing + perks list em rose-soft check pills.
 * - Steering: §3.3 (rose accent), §4.3 (display Inter Bold tracking apertado),
 *   §5.1 (max-w-md form/payment), §3.4 (rose-soft soft surface).
 *
 * Cross-refs:
 * - src/lib/services/subscription.service.ts (isSubscriber)
 * - src/app/assinar/subscribe-button.tsx
 * - src/app/api/mp/checkout/route.ts
 *
 * dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 22 (assinar verifica subscription via auth()).
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Film, ImageIcon, Lock, Star } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { auth } from "@/lib/auth";
import { isSubscriber } from "@/lib/services";
import { SubscribeButton } from "./subscribe-button";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Privello Assinante · Acesso total",
  description:
    "Assine o Privello (R$19,90/mês) e desbloqueie fotos privadas, reels exclusivos e avaliações completas.",
};

const PERKS = [
  {
    icon: ImageIcon,
    label: "Fotos privadas desbloqueadas",
    sub: "Veja as fotos exclusivas de todas as acompanhantes",
  },
  {
    icon: Film,
    label: "Reels privados",
    sub: "Acesso a vídeos exclusivos para assinantes",
  },
  {
    icon: Star,
    label: "Avaliações completas",
    sub: "Veja e deixe comentários nas avaliações",
  },
  {
    icon: Lock,
    label: "Comentar nas fotos",
    sub: "Interaja diretamente com as acompanhantes",
  },
];

type Props = { searchParams: Promise<{ from?: string }> };

export default async function AssinarPage({ searchParams }: Props) {
  const { from } = await searchParams;
  const returnTo = from && from.startsWith("/") ? from : "/";

  const session = await auth();
  const isLoggedIn = !!session?.user?.id;
  const isClient = isLoggedIn && session?.user?.role === "CLIENT";

  const alreadySubscribed = isClient ? await isSubscriber(session!.user!.id!) : false;

  if (!isLoggedIn) {
    const callbackUrl = from
      ? `/assinar?from=${encodeURIComponent(from)}`
      : "/assinar";
    redirect(`/entrar?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  if (alreadySubscribed) {
    redirect(returnTo);
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col items-center px-4 py-12 sm:px-6 sm:py-16">
        <div className="text-center">
          <p className="text-2xs font-semibold uppercase tracking-wider text-rose">
            Privello Assinante
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-[1.05] tracking-[-0.025em] text-ink sm:text-5xl">
            Acesso total
          </h1>
          <p className="mt-3 text-base leading-relaxed text-ink-dim">
            Desbloqueie conteúdo exclusivo em todo o site.
          </p>
        </div>

        <div className="mt-8 w-full rounded-2xl border border-line bg-white p-6 shadow-[var(--shadow-sm)] sm:p-8">
          <div className="flex items-end gap-1 tabular-nums">
            <span className="text-5xl font-bold leading-none tracking-[-0.03em] text-ink">
              R$&nbsp;19
            </span>
            <span className="mb-1 text-2xl font-bold tracking-[-0.022em] text-ink">
              ,90
            </span>
            <span className="mb-2 ml-1 text-md text-ink-dim">/mês</span>
          </div>
          <p className="mt-1 text-sm text-ink-dim">
            Cancele quando quiser · Renovação mensal
          </p>

          <ul className="mt-6 space-y-3">
            {PERKS.map((p) => (
              <li key={p.label} className="flex gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-soft">
                  <Check className="h-3 w-3 text-rose" strokeWidth={2.5} aria-hidden />
                </div>
                <div>
                  <p className="text-md font-semibold tracking-[-0.011em] text-ink">
                    {p.label}
                  </p>
                  <p className="text-sm text-ink-dim">{p.sub}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            {isClient ? (
              <SubscribeButton redirectTo={returnTo} />
            ) : (
              <p className="text-center text-sm text-ink-dim">
                Somente clientes podem assinar.{" "}
                <Link
                  href="/cadastro/cliente"
                  className="text-rose underline-offset-2 hover:underline"
                >
                  Criar conta de cliente
                </Link>
              </p>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-xs leading-relaxed text-ink-faint">
          Integração de pagamento em breve · Assinatura ativada para demonstração
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
