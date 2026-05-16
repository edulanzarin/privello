/**
 * Página RSC — Pricing público dos planos para acompanhantes.
 *
 * Rota: `/planos`.
 * Tipo: Server Component.
 * Auth: público.
 * Cache: `revalidate = 900` (Route Segment Config — janela de 15min).
 *
 * Cards de Basic/Plus/Premium + bloco À la carte (boost 24h) + FAQ.
 * `SiteHeader` chama `auth()` então a rota não é fully static.
 */
import Link from "next/link";
import { Check, X } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

// Cache strategy: revalidate=900 (legacy Route Segment Config).
// Cf. .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 9.
// Página estática mas SiteHeader chama auth(); janela 15min aceitável; refactor static fica para fase-5.
export const revalidate = 900;

export default function PlanosPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen pb-20">
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="text-2xs font-semibold uppercase tracking-[0.25em] text-muted">Planos para acompanhantes</p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight sm:text-5xl">
            Sua presença, <em className="not-italic text-foreground/80">com o peso que merece</em>
            <span className="text-coral">.</span>
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted">
            Todos os planos incluem perfil verificado e acesso à plataforma. Sem comissão sobre encontros —
            cancele quando quiser.
          </p>

          <div className="mt-10 inline-flex rounded-full border border-line bg-white p-1 text-xs font-semibold">
            <span className="rounded-full bg-foreground px-4 py-2 text-white">Mensal</span>
            <span className="px-4 py-2 text-muted">Trimestral -10%</span>
            <span className="px-4 py-2 text-muted">Anual -20%</span>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">

            {/* Aura */}
            <article className="flex flex-col border border-line bg-white p-8">
              <h2 className="font-serif text-2xl">Basic</h2>
              <p className="mt-1 text-sm italic text-muted">pra começar com o pé direito</p>
              <p className="mt-6 font-sans text-3xl font-semibold">
                R$ 39,90 <span className="text-lg font-normal text-muted">/ mês</span>
              </p>
              <Link
                href="/entrar"
                className="mt-8 block w-full rounded-lg bg-foreground py-3 text-center text-base font-semibold text-white hover:bg-foreground/80 active:scale-[0.97] transition"
              >
                Assinar Basic
              </Link>
              <ul className="mt-8 space-y-3 text-sm">
                {[
                  "Perfil completo com até 6 fotos",
                  "Aparece em busca e cidades",
                  "Botão direto pro WhatsApp",
                  "Selo verificado após aprovação",
                ].map((t) => (
                  <li key={t} className="flex gap-2">
                    <Check className="h-4 w-4 shrink-0 text-foreground" strokeWidth={2} />
                    {t}
                  </li>
                ))}
                {["Agenda no site", "Gestão financeira", "Boosts de listagem", "Estatísticas detalhadas"].map((t) => (
                  <li key={t} className="flex gap-2 text-muted">
                    <X className="h-4 w-4 shrink-0" strokeWidth={2} />
                    {t}
                  </li>
                ))}
              </ul>
            </article>

            {/* Encanto */}
            <article className="relative flex flex-col border-2 border-foreground bg-foreground p-8 text-white">
              <span className="absolute right-4 top-0 -translate-y-1/2 bg-coral px-2 py-1 text-2xs font-bold uppercase tracking-wide">
                Mais escolhido
              </span>
              <h2 className="font-serif text-2xl">Plus</h2>
              <p className="mt-1 text-sm italic text-white/70">pra aparecer mais e converter mais</p>
              <p className="mt-6 text-3xl font-semibold">R$ 89 / mês</p>
              <Link
                href="/entrar"
                className="mt-8 block w-full rounded-lg bg-white py-3 text-center text-base font-semibold text-foreground hover:bg-white/90 active:scale-[0.97] transition"
              >
                Assinar Plus
              </Link>
              <ul className="mt-8 space-y-3 text-sm">
                {[
                  "Tudo do Basic",
                  "Até 20 fotos + 3 vídeos",
                  "Topo da cidade em rodízio editorial",
                  "Badge Plus",
                  "Estatísticas de views",
                  "Pedidos de encontro pelo site",
                ].map((t) => (
                  <li key={t} className="flex gap-2">
                    <Check className="h-4 w-4 shrink-0" strokeWidth={2} />
                    {t}
                  </li>
                ))}
                {["Gestão financeira", "Suporte prioritário"].map((t) => (
                  <li key={t} className="flex gap-2 text-white/50">
                    <X className="h-4 w-4 shrink-0" strokeWidth={2} />
                    {t}
                  </li>
                ))}
              </ul>
            </article>

            {/* Ícone */}
            <article className="flex flex-col bg-coral p-8 text-white">
              <h2 className="font-serif text-2xl">Premium</h2>
              <p className="mt-1 text-sm italic text-white/85">controle total do seu negócio</p>
              <p className="mt-6 text-3xl font-semibold">R$ 189 / mês</p>
              <Link
                href="/entrar"
                className="mt-8 block w-full rounded-lg bg-white py-3 text-center text-base font-semibold text-coral hover:bg-white/90 active:scale-[0.97] transition"
              >
                Assinar Premium
              </Link>
              <ul className="mt-8 space-y-3 text-sm">
                {[
                  "Tudo do Plus",
                  "Fotos privadas sob liberação",
                  "Destaque na home da plataforma",
                  "Financeiro completo + histórico",
                  "Ranking de clientes recorrentes",
                  "1 boost 24h grátis / mês",
                  "Suporte WhatsApp prioritário",
                ].map((t) => (
                  <li key={t} className="flex gap-2">
                    <Check className="h-4 w-4 shrink-0" strokeWidth={2} />
                    {t}
                  </li>
                ))}
              </ul>
            </article>
          </div>

          {/* Boost */}
          <div className="mt-12 grid gap-6 border border-line bg-white p-8 lg:grid-cols-[1fr_auto_auto] lg:items-center">
            <div>
              <p className="text-xs font-medium text-coral">À la carte</p>
              <h3 className="mt-2 font-serif text-xl">Boost de 24 horas</h3>
              <p className="mt-2 text-sm text-muted">
                Sobe seu perfil ao topo da listagem por um dia. Disparo único, sem mensalidade extra.
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xs font-semibold uppercase text-muted">Aumento médio</p>
              <p className="text-2xl font-bold">+340% views</p>
            </div>
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <div className="text-center">
                <p className="text-2xs font-semibold uppercase text-muted">Disparo único</p>
                <p className="text-2xl font-bold">R$ 89</p>
              </div>
              <Link
                href="/painel"
                className="rounded-lg bg-coral px-6 py-3 text-base font-semibold text-white hover:brightness-110 active:scale-[0.97] transition"
              >
                Disparar boost
              </Link>
            </div>
          </div>

          <p className="mx-auto mt-12 max-w-2xl text-center text-xs leading-relaxed text-muted">
            A Privello não cobra comissão sobre encontros. Pagamentos de plano via PIX, cartão ou boleto. Serviço
            destinado a maiores de 18 anos.
          </p>

          <section className="mx-auto mt-20 max-w-2xl">
            <p className="text-xs font-medium text-muted">Dúvidas frequentes</p>
            <h2 className="mt-2 font-serif text-3xl">
              Tudo que perguntam<span className="text-coral">.</span>
            </h2>
            <details className="mt-8 border-t border-line py-6" open>
              <summary className="cursor-pointer list-none font-medium">Posso cancelar quando quiser?</summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Sim. Sem fidelidade — cancela em um clique e mantém seu perfil no plano Basic, se desejar.
              </p>
            </details>
            <details className="border-t border-line py-6">
              <summary className="cursor-pointer list-none font-medium">Posso mudar de plano depois?</summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Sempre. Suba ou desça de plano a qualquer momento. O valor é cobrado proporcionalmente.
              </p>
            </details>
            <details className="border-t border-line py-6">
              <summary className="cursor-pointer list-none font-medium">Os dados do financeiro ficam seguros?</summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Sim. Apenas você tem acesso ao seu financeiro. Nenhum dado é compartilhado com terceiros.
              </p>
            </details>
          </section>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
