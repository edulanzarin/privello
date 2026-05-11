import Link from "next/link";
import { Bell, Eye } from "lucide-react";
import { DEMO_PROVIDER_SLUG } from "@/lib/constants";
import {
  countWhatsAppClicksToday,
  getProfileBySlugForPainel,
  listConfirmedAgenda,
  listWhatsAppClicksRecent,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function PainelOverviewPage() {
  let profile: Awaited<ReturnType<typeof getProfileBySlugForPainel>> = null;
  let agenda: Awaited<ReturnType<typeof listConfirmedAgenda>> = [];
  let clicks: Awaited<ReturnType<typeof listWhatsAppClicksRecent>> = [];
  let clicksToday = 0;
  try {
    profile = await getProfileBySlugForPainel(DEMO_PROVIDER_SLUG);
    if (profile) {
      [agenda, clicks, clicksToday] = await Promise.all([
        listConfirmedAgenda(profile.id, 5),
        listWhatsAppClicksRecent(profile.id, 6),
        countWhatsAppClicksToday(profile.id),
      ]);
    }
  } catch {
    /* demo offline */
  }

  const name = profile?.displayName ?? "Helena";
  const views = profile?.viewsThisMonth ?? 8412;
  const rank = profile?.rankPosition ?? 7;
  const uniqueVisitors = new Set(clicks.map((c) => c.visitor)).size || 3;

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted">
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl">
            Bom dia, {name}
            <span className="text-coral">.</span>
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-medium text-success">
            <span className="h-2 w-2 rounded-full bg-success" />
            Perfil online
          </span>
          <button
            type="button"
            className="inline-flex items-center gap-2 border border-line bg-white px-3 py-1.5 text-xs font-medium"
          >
            <Bell className="h-4 w-4" strokeWidth={1.5} />
            Pausar perfil
          </button>
          <Link
            href={`/p/${DEMO_PROVIDER_SLUG}`}
            className="inline-flex items-center gap-2 bg-foreground px-3 py-1.5 text-xs font-medium text-white"
          >
            <Eye className="h-4 w-4" strokeWidth={1.5} />
            Ver perfil público
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Visualizações", views.toLocaleString("pt-BR"), "+24%"],
          ["Cliques no WhatsApp", "217", "+12%"],
          ["Favoritada por", "148", "+9"],
          ["Posição no ranking", `#${rank}`, "+3"],
        ].map(([t, v, d]) => (
          <div key={t} className="border border-line bg-white p-5 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{t}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{v}</p>
            <p className="mt-1 text-xs font-medium text-success">{d}</p>
            <p className="mt-1 text-[10px] text-muted">Últimos 30 dias</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div id="cliques" className="border border-line bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted">Visualizações por dia</h2>
            <div className="flex gap-1 text-[10px] font-semibold">
              <span className="rounded bg-black/5 px-2 py-1 text-muted">7d</span>
              <span className="rounded bg-foreground px-2 py-1 text-white">30d</span>
              <span className="rounded bg-black/5 px-2 py-1 text-muted">90d</span>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted">Últimos 30 dias (placeholder de gráfico)</p>
          <div className="mt-6 flex h-40 items-end justify-between gap-1 border-b border-line pb-0">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-gradient-to-t from-coral/30 to-coral/5"
                style={{ height: `${30 + ((i * 17) % 55)}%` }}
              />
            ))}
          </div>
        </div>

        <div className="border border-foreground bg-sidebar p-6 text-white shadow-lg">
          <h2 className="font-serif text-xl">Topo da lista</h2>
          <p className="mt-2 text-sm text-white/70">Disparo único — até 3× mais views nas próximas 24h.</p>
          <p className="mt-4 text-2xl font-semibold">R$ 89 / disparo</p>
          <button type="button" className="mt-6 w-full bg-white py-3 text-xs font-semibold uppercase tracking-wider text-foreground">
            Disparar boost agora
          </button>
          <p className="mt-4 text-xs text-white/50">Último disparo: 28/04 · +127 visualizações</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border border-line bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted">Agenda · próximos</h2>
            <button type="button" className="text-xs font-medium underline">
              Gerenciar
            </button>
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            {agenda.length ? (
              agenda.map((row) => (
                <li key={row.id} className="flex items-center justify-between border-b border-line py-2">
                  <span>
                    {(row.client.name ?? "Cliente").slice(0, 1)}. ·{" "}
                    {row.date.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })}{" "}
                    {row.startTime} – {row.endTime}
                  </span>
                  <span className="rounded border border-success/40 px-2 py-0.5 text-[10px] font-semibold uppercase text-success">
                    Confirmado
                  </span>
                </li>
              ))
            ) : (
              <li className="text-sm text-muted">Nenhum agendamento confirmado nos próximos dias.</li>
            )}
          </ul>
        </div>

        <div className="border border-line bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Cliques no WhatsApp · hoje · {clicksToday} cliques · {uniqueVisitors} visitantes únicos
            </h2>
            <button type="button" className="text-xs font-medium underline">
              Histórico
            </button>
          </div>
          <div className="mt-4 flex items-center justify-between border border-line bg-[#fafafa] px-3 py-2 text-sm">
            <span className="font-mono text-muted">+55 11 9****-**42</span>
            <button type="button" className="text-xs underline">
              Editar
            </button>
          </div>
          <ul className="mt-4 space-y-2 text-xs">
            {clicks.map((c) => (
              <li key={c.id} className="flex justify-between text-muted">
                <span>
                  {c.clickedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · {c.visitor}
                </span>
                <span>{c.source}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex gap-2 text-[10px] leading-relaxed text-muted">
            <span className="text-coral">ⓘ</span>
            Conversas acontecem no WhatsApp. A Privello não armazena mensagens.
          </p>
        </div>
      </div>
    </div>
  );
}
