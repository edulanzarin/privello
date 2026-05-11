import Image from "next/image";
import Link from "next/link";
import { listModerationQueue } from "@/lib/queries";

export const dynamic = "force-dynamic";

function statusClass(s: string) {
  switch (s) {
    case "REVISAO":
      return "bg-pink-100 text-red-900";
    case "NOVO":
      return "bg-sky-100 text-sky-900";
    case "APROVADO":
      return "bg-emerald-100 text-emerald-900";
    case "REJEITADO":
      return "bg-zinc-200 text-zinc-800";
    default:
      return "bg-zinc-100 text-zinc-700";
  }
}

export default async function AdminModeracaoPage() {
  let rows: Awaited<ReturnType<typeof listModerationQueue>> = [];
  try {
    rows = await listModerationQueue();
  } catch {
    rows = [];
  }

  return (
    <div className="min-h-screen bg-[#f6f6f4]">
      <header className="bg-foreground px-6 py-4 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <p className="font-serif text-lg">
            privello<span className="text-coral">.</span>
          </p>
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success" />
              Equipe · 4 online
            </span>
            <div className="h-8 w-8 rounded-full bg-white/10" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="font-serif text-3xl sm:text-4xl">
            Fila de moderação<span className="text-coral">.</span>
          </h1>
          <div className="grid grid-cols-2 gap-4 text-right sm:grid-cols-4">
            {[
              ["Novos · 24h", "142"],
              ["Em revisão", "38"],
              ["Aguardando doc", "12"],
              ["Tempo médio", "6h 24m"],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{k}</p>
                <p className="text-xl font-semibold tabular-nums">{v}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex gap-6 border-b border-line text-sm">
          {["Verificações", "Denúncias 9", "Fotos sinalizadas 4", "Aprovados (mês) 1843"].map((t, i) => (
            <button
              key={t}
              type="button"
              className={`border-b-2 pb-3 text-xs font-semibold uppercase tracking-wide ${
                i === 0 ? "border-foreground" : "border-transparent text-muted"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-6 overflow-x-auto rounded border border-line bg-white shadow-sm">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[10px] font-semibold uppercase tracking-wider text-muted">
                <th className="px-3 py-3">Foto</th>
                <th className="px-3 py-3">Acompanhante · cidade</th>
                <th className="px-3 py-3">Documento</th>
                <th className="px-3 py-3">Selfie</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Aguardando</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted">
                    Nenhum registro. Execute o seed com Postgres para popular a fila.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const thumb = row.profile.media[0]?.url;
                  const waitMin = Math.max(1, Math.floor((Date.now() - row.waitingSince.getTime()) / 60000));
                  return (
                    <tr key={row.id} className="border-b border-line">
                      <td className="px-3 py-3">
                        <div className="relative h-12 w-12 overflow-hidden bg-line">
                          {thumb ? <Image src={thumb} alt="" width={48} height={48} className="object-cover" /> : null}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-semibold">
                          {row.profile.displayName}, {row.profile.age}
                        </p>
                        <p className="text-xs text-muted">
                          {row.profile.city.name} · {row.profile.district.name}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-xs text-muted">
                        {row.documentType ?? "—"}
                        {row.documentNote ? <span className="block">{row.documentNote}</span> : null}
                      </td>
                      <td className="px-3 py-3 text-xs">
                        {row.selfieMatch != null ? (
                          <span className="text-success">match · {row.selfieMatch}%</span>
                        ) : (
                          <span className="text-muted">{row.selfieNote ?? "—"}</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${statusClass(row.status)}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-muted">{waitMin} min</td>
                      <td className="px-3 py-3">
                        <div className="flex gap-2">
                          <Link href={`/p/${row.profile.slug}`} className="bg-foreground px-2 py-1 text-[10px] font-bold uppercase text-white">
                            Abrir
                          </Link>
                          <button type="button" className="border border-coral px-2 py-1 text-[10px] font-bold uppercase text-coral">
                            Rejeitar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col justify-between gap-2 text-xs text-muted sm:flex-row">
          <span>0 selecionados · ações em lote disponíveis</span>
          <span>
            Mostrando {rows.length} de {rows.length || "—"}
          </span>
        </div>

        <p className="mt-10 text-center text-xs text-muted">
          <Link href="/" className="underline">
            Voltar ao site
          </Link>
          {" · "}
          Conteúdo adulto (+18).
        </p>
      </main>
    </div>
  );
}
