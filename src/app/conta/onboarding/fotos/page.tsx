import Link from "next/link";
import { Check, ImagePlus, Lock } from "lucide-react";

export const dynamic = "force-dynamic";

const steps = [
  { n: "01", label: "Identidade", done: true },
  { n: "02", label: "Perfil", done: true },
  { n: "03", label: "Fotos", current: true },
  { n: "04", label: "Valores", done: false },
  { n: "05", label: "Verificação", done: false },
  { n: "06", label: "Publicar", done: false },
];

export default function OnboardingFotosPage() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="w-full bg-sidebar px-8 py-10 text-white md:max-w-xs md:min-h-screen">
        <p className="font-serif text-lg">
          privello<span className="text-coral">.</span>
        </p>
        <p className="mt-10 font-serif text-2xl">Seis passos.</p>
        <p className="text-sm text-white/50">~12 minutos.</p>
        <ol className="mt-8 space-y-2 text-sm">
          {steps.map((s) => (
            <li
              key={s.n}
              className={`flex items-center gap-3 rounded-md px-3 py-2 ${
                s.current ? "bg-white/10" : ""
              }`}
            >
              {s.done ? <Check className="h-4 w-4 text-success" strokeWidth={2} /> : <span className="w-4" />}
              <span className="text-white/50">{s.n}</span>
              <span className={s.current ? "font-semibold" : "text-white/70"}>{s.label}</span>
            </li>
          ))}
        </ol>
        <p className="mt-auto hidden pt-10 text-xs text-white/40 md:block">
          Suas informações são criptografadas. Saiba mais.
        </p>
      </aside>
      <main className="flex-1 bg-background px-6 py-10 md:px-14">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Passo 03 de 06</p>
        <h1 className="mt-2 font-serif text-3xl md:text-4xl">
          Suas fotos<span className="text-coral">.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
          Mínimo de 4 fotos públicas e até 18 no total. A primeira é a capa do anúncio. Fotos privadas ficam bloqueadas
          até liberação.
        </p>

        <section className="mt-10">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Fotos públicas · 5 de 18</p>
          <p className="mt-1 text-xs text-muted">Arraste para reordenar — a primeira é a capa.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="relative h-28 w-28 border border-line bg-line">
                {i === 1 ? (
                  <span className="absolute left-1 top-1 bg-foreground px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                    Capa
                  </span>
                ) : null}
                <span className="absolute right-1 top-1 text-xs text-muted">×</span>
              </div>
            ))}
            <button
              type="button"
              className="flex h-28 w-28 flex-col items-center justify-center gap-1 border border-dashed border-line bg-white text-[10px] font-semibold uppercase text-muted"
            >
              <ImagePlus className="h-6 w-6" strokeWidth={1.25} />
              Arrastar ou clicar
            </button>
          </div>
        </section>

        <section className="mt-12">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
            <Lock className="h-3.5 w-3.5" strokeWidth={1.5} />
            Fotos privadas · 0 de 24
          </p>
          <div className="mt-4 border border-foreground bg-sidebar px-6 py-8 text-white">
            <h2 className="font-serif text-xl">Galeria privada</h2>
            <p className="mt-2 max-w-md text-sm text-white/70">
              Liberação manual ou automática para clientes verificados. Ideal para conteúdo adicional.
            </p>
            <button type="button" className="mt-6 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-foreground">
              Adicionar fotos privadas
            </button>
          </div>
        </section>

        <section className="mt-10 border border-line bg-[#faf8f4] p-6 text-sm text-muted">
          <p className="font-semibold text-foreground">Diretrizes de fotos</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Fotos atuais (últimos 6 meses), sem marca d&apos;água de terceiros.</li>
            <li>Sem rostos de terceiros ou menores de idade.</li>
            <li>Fotos públicas sem nudez explícita; privadas seguem regras da moderação.</li>
            <li>Recomendamos ao menos um corpo inteiro.</li>
          </ul>
        </section>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/conta/verificacao" className="border border-line bg-white px-4 py-3 text-center text-sm">
            ← Voltar · perfil
          </Link>
          <span className="text-center text-xs text-muted underline">Salvar e continuar depois</span>
          <Link href="/planos" className="bg-foreground px-6 py-3 text-center text-sm font-semibold text-white">
            Continuar · valores →
          </Link>
        </div>
      </main>
    </div>
  );
}
