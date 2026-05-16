import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Lock, ImageIcon, Film, Star } from "lucide-react";
import { auth } from "@/lib/auth";
import { isSubscriber } from "@/lib/services";
import { SubscribeButton } from "./subscribe-button";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 22 (assinar verifica subscription via auth()).
export const dynamic = "force-dynamic";

const PERKS = [
  { icon: ImageIcon, label: "Fotos privadas desbloqueadas", sub: "Veja as fotos exclusivas de todas as acompanhantes" },
  { icon: Film, label: "Reels privados", sub: "Acesso a vídeos exclusivos para assinantes" },
  { icon: Star, label: "Avaliações completas", sub: "Veja e deixe comentários nas avaliações" },
  { icon: Lock, label: "Comentar nas fotos", sub: "Interaja diretamente com as acompanhantes" },
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
    const callbackUrl = from ? `/assinar?from=${encodeURIComponent(from)}` : "/assinar";
    redirect(`/entrar?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  // Already subscribed — send them back to where they came from
  if (alreadySubscribed) {
    redirect(returnTo);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center">
          <p className="text-base font-semibold text-coral">Privello Assinante</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Acesso total</h1>
          <p className="mt-2 text-md text-muted">Desbloqueie conteúdo exclusivo em todo o site.</p>
        </div>

        {/* Pricing card */}
        <div className="mt-8 rounded-2xl border border-black/[0.06] bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]">
          <div className="flex items-end gap-1">
            <span className="text-5xl font-semibold tracking-tight">R$&nbsp;19</span>
            <span className="mb-1 text-2xl font-semibold tracking-tight">,90</span>
            <span className="mb-2 ml-1 text-md text-muted">/mês</span>
          </div>
          <p className="mt-1 text-base text-muted">Cancele quando quiser · Renovação mensal</p>

          <ul className="mt-6 space-y-3">
            {PERKS.map((p) => (
              <li key={p.label} className="flex gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-coral/10">
                  <Check className="h-3 w-3 text-coral" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-md font-medium">{p.label}</p>
                  <p className="text-base text-muted">{p.sub}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            {isClient ? (
              <SubscribeButton redirectTo={returnTo} />
            ) : (
              <p className="text-center text-sm text-muted">
                Somente clientes podem assinar.{" "}
                <Link href="/cadastro/cliente" className="text-coral hover:underline">Criar conta de cliente</Link>
              </p>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-base text-muted">
          Integração de pagamento em breve · Assinatura ativada para demonstração
        </p>
      </div>
    </div>
  );
}
