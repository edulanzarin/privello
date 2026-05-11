import Link from "next/link";
import { Check, MessageCircle } from "lucide-react";
import { DEMO_PROVIDER_SLUG } from "@/lib/constants";
import { formatBrl } from "@/lib/money";
import { getProfileBySlugForPainel, listPendingMeetingRequests } from "@/lib/queries";

export const dynamic = "force-dynamic";

function formatExpiry(expiresAt: Date) {
  const ms = expiresAt.getTime() - Date.now();
  if (ms <= 0) return "Expirado";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}min`;
}

export default async function PainelSolicitacoesPage() {
  let pending: Awaited<ReturnType<typeof listPendingMeetingRequests>> = [];
  let profileSlug = DEMO_PROVIDER_SLUG;
  try {
    const p = await getProfileBySlugForPainel(DEMO_PROVIDER_SLUG);
    if (p) {
      pending = await listPendingMeetingRequests(p.id);
      profileSlug = p.slug;
    }
  } catch {
    /* */
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted">Solicitações pendentes</p>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl">
            {pending.length} pedidos. <em className="font-serif text-2xl font-normal text-muted not-italic">esperando você</em>
          </h1>
        </div>
        <div className="flex gap-2">
          <button type="button" className="border border-line bg-white px-3 py-2 text-xs font-medium">
            Preferências
          </button>
          <button type="button" className="border border-line bg-white px-3 py-2 text-xs font-medium">
            Histórico
          </button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-line text-sm">
        {[
          ["Pendentes", pending.length],
          ["Confirmados", 12],
          ["Recusados", 3],
          ["Realizados (mês)", 28],
        ].map(([label, n], i) => (
          <button
            key={String(label)}
            type="button"
            className={`border-b-2 px-1 pb-3 text-xs font-semibold uppercase tracking-wide ${
              i === 0 ? "border-foreground text-foreground" : "border-transparent text-muted"
            }`}
          >
            {label} ({n})
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {pending.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma solicitação pendente no momento.</p>
        ) : (
          pending.map((req) => (
            <article key={req.id} className="grid gap-6 border border-line bg-white p-6 shadow-sm lg:grid-cols-3">
              <div>
                <p className="flex items-center gap-2 font-semibold">
                  {req.client.name ?? "Cliente"},{" "}
                  <span className="text-muted font-normal">32</span>
                  {req.client.verified ? <Check className="h-4 w-4 text-success" strokeWidth={2} /> : null}
                </p>
                <p className="mt-2 inline-block rounded border border-coral/40 px-2 py-0.5 text-[10px] font-semibold uppercase text-coral">
                  Cliente verificado
                </p>
                <p className="mt-3 text-xs text-muted">
                  Cliente há {Math.max(1, Math.floor((Date.now() - req.client.createdAt.getTime()) / 86400000 / 30))}{" "}
                  meses · 0 encontros
                </p>
                {req.notes ? (
                  <blockquote className="mt-4 border-l-2 border-line bg-[#fafafa] p-3 text-sm italic text-muted">
                    {req.notes}
                  </blockquote>
                ) : null}
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-[10px] font-semibold uppercase text-muted">Dia</p>
                  <p className="font-medium">
                    {req.date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "short" })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase text-muted">Horário</p>
                  <p className="font-medium">
                    {req.startTime} → {req.endTime}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase text-muted">Duração</p>
                  <p className="font-medium">{req.duration}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase text-muted">Local</p>
                  <p className="font-medium">{req.location}</p>
                </div>
              </div>
              <div className="flex flex-col justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase text-muted">Você recebe</p>
                  <p className="font-serif text-3xl font-semibold">{formatBrl(req.totalBrl)}</p>
                  <p className="mt-2 text-[10px] font-semibold uppercase text-coral">
                    Expira em {formatExpiry(req.expiresAt)}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <button type="button" className="flex items-center justify-center gap-2 bg-foreground py-3 text-xs font-semibold uppercase tracking-wider text-white">
                    <Check className="h-4 w-4" strokeWidth={2} />
                    Confirmar
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 border border-foreground py-3 text-xs font-semibold uppercase tracking-wider"
                  >
                    <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
                    Pedir info no WhatsApp
                  </button>
                  <button type="button" className="text-center text-xs text-muted underline">
                    Recusar com cordialidade
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="flex gap-3 border border-line bg-[#fafafa] p-4 text-sm text-muted">
        <span className="text-coral">🛡</span>
        <p>
          O cliente preenche dia, horário e local. Você tem até o tempo de expiração para confirmar. Quando confirma, o
          WhatsApp dele aparece para fecharem os últimos detalhes. Conteúdo adulto (+18).
        </p>
      </div>

      <p className="text-center text-sm">
        <Link href={`/p/${profileSlug}`} className="underline">
          Voltar ao perfil público
        </Link>
      </p>
    </div>
  );
}
