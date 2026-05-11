import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveDurationOptions } from "@/app/painel/_actions/provider-settings";

export const dynamic = "force-dynamic";

const ROWS = 8;

export default async function PainelValoresPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    include: { durationOptions: { orderBy: [{ sortOrder: "asc" }, { minutes: "asc" }] } },
  });
  if (!profile) redirect("/conta/onboarding/perfil");

  const existing = profile.durationOptions;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Valores e durações</h1>
        <p className="mt-1 max-w-xl text-sm text-muted">
          Cada linha vira uma opção na página de marcação e na mensagem automática do WhatsApp.
          Use múltiplos de 30 minutos (ex.: 90 = 1h30).
        </p>
      </div>

      <form action={saveDurationOptions} className="space-y-4">
        <div className="overflow-x-auto border border-line bg-white">
          <table className="w-full min-w-[480px] text-sm">
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
                      <input name={`dur_${i}_minutes`} type="number" min={0} step={30}
                        defaultValue={row?.minutes ?? ""} placeholder="120"
                        className="w-24 border border-line px-2 py-1.5 text-sm outline-none focus:border-foreground" />
                    </td>
                    <td className="px-4 py-2">
                      <input name={`dur_${i}_label`} type="text"
                        defaultValue={row?.label ?? ""} placeholder="2 horas"
                        className="w-full max-w-[200px] border border-line px-2 py-1.5 text-sm outline-none focus:border-foreground" />
                    </td>
                    <td className="px-4 py-2">
                      <input name={`dur_${i}_price`} type="number" min={0} step={50}
                        defaultValue={row?.priceBrl ?? ""} placeholder="800"
                        className="w-28 border border-line px-2 py-1.5 text-sm outline-none focus:border-foreground" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="bg-coral px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-coral/90">
            Salvar valores
          </button>
          <Link href={`/solicitar/${profile.slug}`}
            className="border border-line bg-white px-6 py-3 text-xs font-semibold uppercase transition hover:border-foreground">
            Ver como cliente →
          </Link>
        </div>
      </form>
    </div>
  );
}
