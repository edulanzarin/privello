import Link from "next/link";
import { Check } from "lucide-react";

const STEPS = [
  { n: "01", label: "Perfil", href: "/conta/onboarding/perfil" },
  { n: "02", label: "Fotos", href: "/conta/onboarding/fotos" },
  { n: "03", label: "Valores", href: "/conta/onboarding/valores" },
  { n: "04", label: "Publicar", href: "/conta/onboarding/publicar" },
];

type Props = { current: "perfil" | "fotos" | "valores" | "publicar" };

/**
 * Sidebar com timeline de 4 passos (Perfil / Fotos / Valores / Publicar) usada
 * em todas as páginas do fluxo `/conta/onboarding/*`. Marca passos anteriores
 * como concluídos (com check) e destaca o atual.
 *
 * Props:
 * - `current` ("perfil" | "fotos" | "valores" | "publicar"): identifica o passo atual da rota.
 *
 * Consumidores conhecidos:
 * - src/app/conta/onboarding/perfil/page.tsx
 * - src/app/conta/onboarding/valores/page.tsx
 * - src/app/conta/onboarding/publicar/page.tsx
 * - src/app/conta/onboarding/fotos/page.tsx (passo 02)
 */
export function OnboardingSidebar({ current }: Props) {
  const currentIdx = STEPS.findIndex((s) => s.href.endsWith(current));

  return (
    <aside className="flex w-full flex-col justify-between bg-sidebar px-8 py-10 text-white md:max-w-xs md:min-h-screen">
      <div>
        <Link href="/" className="text-xl font-black tracking-tight">
          privello<span className="text-coral">.</span>
        </Link>
        <p className="mt-10 text-2xl font-bold">Criar perfil.</p>
        <p className="text-sm text-white/50">~10 minutos.</p>
        <ol className="mt-8 space-y-2 text-sm">
          {STEPS.map((s, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            return (
              <li
                key={s.n}
                className={`flex items-center gap-3 rounded-md px-3 py-2 ${active ? "bg-white/10" : ""}`}
              >
                {done
                  ? <Check className="h-4 w-4 text-success" strokeWidth={2} />
                  : <span className="w-4" />
                }
                <span className="text-white/40">{s.n}</span>
                <span className={active ? "font-bold" : done ? "text-white/70" : "text-white/40"}>
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
