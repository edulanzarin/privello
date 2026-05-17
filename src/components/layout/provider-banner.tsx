import Link from "next/link";
import { Eye, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  variant: "own-profile" | "other-profile" | "search";
};

/**
 * ProviderBanner — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/layout/provider-banner.tsx
 * Steering: `.kiro/steering/design-system.md` §3.4 (surfaces soft).
 *
 * Banner contextual exibido no topo de páginas para sinalizar que o
 * visitante é um provider e que algumas interações (curtir, ver contato,
 * contar views) estão restritas.
 *
 * Visual (v2):
 *  - Fundo `glass` real (`.glass-pill` aplicado no inner) que se assenta
 *    sobre o ambient gradient — segue o padrão dos status pills do site.
 *  - Pill rounded-full em vez de banner full-bleed: respira com o layout
 *    Tahoe e fica visualmente integrado.
 *  - Container `max-w-7xl` consistente com Home/Descobrir.
 *  - `own-profile` usa rose-soft (acolhedor — é seu perfil).
 *  - Demais usam warning-soft (alerta sutil).
 *
 * Consumidores:
 *  - src/app/p/[slug]/page.tsx
 *  - src/app/descobrir/page.tsx (hub sem cidade)
 *  - src/app/descobrir/[citySlug]/page.tsx
 */
export function ProviderBanner({ variant }: Props) {
  if (variant === "own-profile") {
    return (
      <div className="px-4 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-full border border-rose/20 bg-rose-soft px-4 py-2 backdrop-blur-sm">
          <span className="flex min-w-0 items-center gap-2 text-xs text-rose">
            <Eye
              className="h-3.5 w-3.5 shrink-0"
              strokeWidth={2.4}
              aria-hidden
            />
            <span className="truncate">
              Visualizando seu próprio perfil — visitas não são contadas.
            </span>
          </span>
          <Link
            href="/painel"
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-2xs font-semibold uppercase tracking-wider text-rose transition-colors",
              "hover:bg-rose hover:text-white",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
          >
            Ir ao painel
            <ArrowRight className="h-3 w-3" strokeWidth={2.4} aria-hidden />
          </Link>
        </div>
      </div>
    );
  }

  if (variant === "other-profile") {
    return (
      <div className="px-4 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 rounded-full border border-warning/30 bg-warning-soft px-4 py-2 text-xs text-warning backdrop-blur-sm">
          <Eye
            className="h-3.5 w-3.5 shrink-0"
            strokeWidth={2.4}
            aria-hidden
          />
          <span>
            Navegando como acompanhante — curtir, contato e visualizações não
            estão disponíveis.
          </span>
        </div>
      </div>
    );
  }

  if (variant === "search") {
    return (
      <div className="px-4 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 rounded-full border border-warning/30 bg-warning-soft px-4 py-2 text-xs text-warning backdrop-blur-sm">
          <Eye
            className="h-3.5 w-3.5 shrink-0"
            strokeWidth={2.4}
            aria-hidden
          />
          <span>
            Navegando como acompanhante — visualizações de outros perfis não
            são contadas.
          </span>
        </div>
      </div>
    );
  }

  return null;
}
