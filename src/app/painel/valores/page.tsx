import Link from "next/link";
import { DEMO_PROVIDER_SLUG } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { saveDurationOptions } from "@/app/painel/_actions/provider-settings";

export const dynamic = "force-dynamic";

const ROWS = 8;

export default async function PainelValoresPage() {
  const slug = DEMO_PROVIDER_SLUG;
  const profile = await prisma.profile.findUnique({
    where: { slug },
    include: { durationOptions: { orderBy: [{ sortOrder: "asc" }, { minutes: "asc" }] } },
  });

  if (!profile) {
    return <p className="text-sm text-muted">Perfil demo não encontrado. Rode o seed.</p>;
  }

  const existing = profile.durationOptions;

  return (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Valores</p>
      <h1 className="mt-2 font-serif text-3xl">Duração e preço.</h1>
      <p className="mt-3 max-w-xl text-sm text-muted">
        Cada linha vira uma opção na página de marcação e na mensagem automática do WhatsApp. Minutos: use múltiplos
        de 30 para alinhar aos slots (ex.: 90 = 1h30). Linhas com minutos vazios são ignoradas.
      </p>

      <form action={saveDurationOptions} className="mt-10 space-y-4">
        <input type="hidden" name="slug" value={slug} />
        <div className="overflow-x-auto border border-line bg-white">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-line bg-[#faf9f6] text-left text-[10px] font-semibold uppercase tracking-wider text-muted">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Minutos</th>
                <th className="px-4 py-3">Rótulo</th>
                <th className="px-4 py-3">Preço (R$)</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: ROWS }, (_, i) => {
                const row = existing[i];
                return (
                  <tr key={i} className="border-b border-line last:border-0">
                    <td className="px-4 py-2 text-muted">{i + 1}</td>
                    <td className="px-4 py-2">
                      <input
                        name={`dur_${i}_minutes`}
                        type="number"
                        min={0}
                        step={30}
                        defaultValue={row?.minutes ?? ""}
                        placeholder="ex. 120"
                        className="w-24 border border-line px-2 py-1"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        name={`dur_${i}_label`}
                        type="text"
                        defaultValue={row?.label ?? ""}
                        placeholder="2 horas"
                        className="w-full max-w-[200px] border border-line px-2 py-1"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        name={`dur_${i}_price`}
                        type="number"
                        min={0}
                        step={50}
                        defaultValue={row?.priceBrl ?? ""}
                        placeholder="800"
                        className="w-28 border border-line px-2 py-1"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-4">
          <button type="submit" className="bg-foreground px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white">
            Salvar valores
          </button>
          <Link href={`/solicitar/${slug}`} className="border border-line bg-white px-6 py-3 text-xs font-semibold uppercase">
            Ver como cliente
          </Link>
        </div>
      </form>
    </>
  );
}
