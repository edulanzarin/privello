import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { n: "01", label: "Perfil", href: "/conta/onboarding/perfil" },
  { n: "02", label: "Fotos", href: "/conta/onboarding/fotos" },
  { n: "03", label: "Valores", href: "/conta/onboarding/valores" },
  { n: "04", label: "Publicar", href: "/conta/onboarding/publicar" },
];

type Props = { current: "perfil" | "fotos" | "valores" | "publicar" };

/**
 * OnboardingSidebar — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/onboarding/onboarding-sidebar.tsx
 * Steering: `.kiro/steering/design-system.md` §13.5.
 *
 * Sidebar com timeline de 4 passos (Perfil / Fotos / Valores / Publicar) usada
 * em todas as páginas do fluxo `/conta/onboarding/*`. Marca passos anteriores
 * como concluídos (com check verde) e destaca o atual com `bg-white/10`.
 *
 * Visual:
 *  - Fundo `bg-ink` (preto ameixa) — branding panel.
 *  - Logo `privello.` no topo (ponto rose).
 *  - Lista de passos com numeração + label + check de conclusão.
 *
 * Props:
 *  - `current`: identifica o passo atual da rota.
 */
export function OnboardingSidebar({ current }: Props) {
  const currentIdx = STEPS.findIndex((s) => s.href.endsWith(current));

  return (
    <aside className="flex w-full flex-col justify-between bg-ink px-8 py-10 text-white md:min-h-screen md:max-w-xs">
      <div>
        <Link
          href="/"
          className="text-xl font-bold tracking-[-0.025em] text-white"
        >
          privello<span className="text-rose">.</span>
        </Link>
        <p className="mt-10 text-2xl font-bold tracking-[-0.022em]">
          Criar perfil.
        </p>
        <p className="text-sm text-white/50">~10 minutos</p>
        <ol className="mt-8 space-y-2 text-sm">
          {STEPS.map((s, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            return (
              <li
                key={s.n}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                  active && "bg-white/10",
                )}
              >
                {done ? (
                  <Check className="h-4 w-4 shrink-0 text-success" strokeWidth={2.4} />
                ) : (
                  <span className="w-4" />
                )}
                <span className="tabular-nums text-white/40">{s.n}</span>
                <span
                  className={cn(
                    active
                      ? "font-bold text-white"
                      : done
                        ? "text-white/70"
                        : "text-white/40",
                  )}
                >
                  {s.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      <p className="mt-10 hidden text-xs text-white/30 md:block">
        Suas informações são privadas e seguras.
      </p>
    </aside>
  );
}
