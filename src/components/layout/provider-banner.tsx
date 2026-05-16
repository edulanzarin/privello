import Link from "next/link";
import { Eye } from "lucide-react";

type Props = {
  variant: "own-profile" | "other-profile" | "search";
};

/**
 * Banner contextual exibido no topo de páginas para sinalizar que o visitante
 * é um provider e que algumas interações (curtir, ver contato, contar views)
 * estão restritas.
 *
 * Props:
 * - `variant` ("own-profile" | "other-profile" | "search"):
 *   - `own-profile`: provider visualizando o próprio perfil (CTA "Ir ao painel").
 *   - `other-profile`: provider em perfil de outro provider.
 *   - `search`: provider em listagens/busca.
 *
 * Consumidores conhecidos:
 * - src/app/p/[slug]/page.tsx
 * - src/app/buscar/page.tsx (busca)
 * - src/app/descobrir/[citySlug]/page.tsx
 */
export function ProviderBanner({ variant }: Props) {
  if (variant === "own-profile") {
    return (
      <div className="border-b border-coral/20 bg-coral/5 px-4 py-2.5">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-coral">
            <Eye className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            <span>Você está visualizando seu próprio perfil — visualizações não são contadas.</span>
          </div>
          <Link href="/painel" className="shrink-0 text-xs font-semibold text-coral underline underline-offset-2">
            Ir ao painel
          </Link>
        </div>
      </div>
    );
  }

  if (variant === "other-profile") {
    return (
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 text-xs text-amber-700">
          <Eye className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          <span>Você está navegando como acompanhante — curtidas, contato e visualizações não estão disponíveis.</span>
        </div>
      </div>
    );
  }

  if (variant === "search") {
    return (
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5">
        <div className="mx-auto flex max-w-6xl items-center gap-2 text-xs text-amber-700">
          <Eye className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          <span>Você está navegando como acompanhante — visualizações de outros perfis não são contadas.</span>
        </div>
      </div>
    );
  }

  return null;
}
