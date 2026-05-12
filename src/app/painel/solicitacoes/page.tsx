import { redirect } from "next/navigation";
import { Check, X } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatBrl } from "@/lib/money";
import { confirmRequest, declineRequest } from "@/app/painel/_actions/provider-settings";

export const dynamic = "force-dynamic";

function formatExpiry(expiresAt: Date) {
  const ms = expiresAt.getTime() - Date.now();
  if (ms <= 0) return "Expirado";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}min` : `${m} min`;
}

export default async function PainelSolicitacoesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/painel/solicitacoes");

  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } });
  if (!profile) redirect("/conta/onboarding/perfil");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [pending, confirmedCount, rejectedCount, completedCount] = await Promise.all([
    prisma.meetingRequest.findMany({
      where: { profileId: profile.id, status: "PENDING" },
      include: { client: { select: { name: true, verified: true, createdAt: true } } },
      orderBy: { expiresAt: "asc" },
    }),
    prisma.meetingRequest.count({ where: { profileId: profile.id, status: "CONFIRMED" } }),
    prisma.meetingRequest.count({ where: { profileId: profile.id, status: "REJECTED" } }),
    prisma.meetingRequest.count({
      where: { profileId: profile.id, status: "COMPLETED", date: { gte: monthStart } },
    }),
  ]);

  const tabs = [
    { label: "Pendentes", count: pending.length, active: true },
    { label: "Confirmados", count: confirmedCount, active: false },
    { label: "Recusados", count: rejectedCount, active: false },
    { label: "Realizados (mês)", count: completedCount, active: false },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted">
          Solicitações de encontro
        </p>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl">
          {pending.length > 0 ? (
            <>
              {pending.length} {pending.length === 1 ? "pedido" : "pedidos"}.{" "}
              <em className="font-serif text-2xl font-normal text-muted not-italic">
                aguardando resposta
              </em>
            </>
          ) : (
            <span className="text-muted font-normal font-serif text-2xl">Nenhum pedido pendente.</span>
          )}
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-line text-sm">
        {tabs.map(({ label, count, active }) => (
          <button
            key={label}
            type="button"
            className={`border-b-2 px-1 pb-3 text-xs font-semibold uppercase tracking-wide transition ${
              active
                ? "border-foreground text-foreground"
                : "border-transparent text-muted"
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {pending.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">
            Nenhuma solicitação pendente no momento.
          </p>
        ) : (
          pending.map((req) => {
            const memberMonths = Math.max(
              1,
              Math.floor((Date.now() - req.client.createdAt.getTime()) / 86400000 / 30),
            );
            const isExpired = req.expiresAt.getTime() < Date.now();

            return (
              <article
                key={req.id}
                className={`grid gap-6 border bg-white p-6 shadow-sm lg:grid-cols-3 ${
                  isExpired ? "border-line opacity-60" : "border-line"
                }`}
              >
                {/* Cliente */}
                <div>
                  <p className="flex items-center gap-2 font-semibold">
                    {req.client.name ?? "Cliente"}
                    {req.client.verified && (
                      <Check className="h-4 w-4 text-success" strokeWidth={2} />
                    )}
                  </p>
                  {req.client.verified && (
                    <p className="mt-2 inline-block rounded border border-coral/40 px-2 py-0.5 text-[10px] font-semibold uppercase text-coral">
                      Cliente verificado
                    </p>
                  )}
                  <p className="mt-3 text-xs text-muted">
                    Membro há {memberMonths} {memberMonths === 1 ? "mês" : "meses"}
                  </p>
                  {req.notes && (
                    <blockquote className="mt-4 border-l-2 border-line bg-[#fafafa] p-3 text-sm italic text-muted">
                      {req.notes}
                    </blockquote>
                  )}
                </div>

                {/* Detalhes */}
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-muted">Dia</p>
                    <p className="font-medium">
                      {req.date.toLocaleDateString("pt-BR", {
                        weekday: "long",
                        day: "numeric",
                        month: "short",
                      })}
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

                {/* Ações */}
                <div className="flex flex-col justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-muted">Você recebe</p>
                    <p className="font-serif text-3xl font-semibold">{formatBrl(req.totalBrl)}</p>
                    <p
                      className={`mt-2 text-[10px] font-semibold uppercase ${
                        isExpired ? "text-muted" : "text-coral"
                      }`}
                    >
                      {isExpired ? "Expirado" : `Expira em ${formatExpiry(req.expiresAt)}`}
                    </p>
                  </div>

                  {!isExpired && (
                    <div className="flex flex-col gap-2">
                      <form action={confirmRequest}>
                        <input type="hidden" name="requestId" value={req.id} />
                        <button
                          type="submit"
                          className="flex w-full items-center justify-center gap-2 bg-foreground py-3 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-foreground/80"
                        >
                          <Check className="h-4 w-4" strokeWidth={2} />
                          Confirmar
                        </button>
                      </form>
                      <form action={declineRequest}>
                        <input type="hidden" name="requestId" value={req.id} />
                        <button
                          type="submit"
                          className="flex w-full items-center justify-center gap-2 border border-line py-3 text-xs font-semibold uppercase tracking-wider text-muted transition hover:border-foreground/30 hover:text-foreground"
                        >
                          <X className="h-4 w-4" strokeWidth={1.5} />
                          Recusar
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="flex gap-3 border border-line bg-[#fafafa] p-4 text-sm text-muted">
        <span className="text-coral shrink-0">🛡</span>
        <p>
          Ao confirmar, o contato do cliente fica disponível para vocês alinharem os últimos
          detalhes. Conteúdo adulto (+18). Apenas maiores de idade.
        </p>
      </div>
    </div>
  );
}
