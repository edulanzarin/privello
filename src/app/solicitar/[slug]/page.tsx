/**
 * Página RSC — Solicitar encontro: monta horário, duração, local.
 *
 * Rota: `/solicitar/[slug]`.
 * Tipo: Server Component.
 * Auth: público — clientes não-logados podem montar; provider logado é
 *  redirecionado para `/p/[slug]` (read-only).
 * Cache: `force-dynamic` (estado vive em searchParams + lê `auth()`).
 *
 * Calendário do mês, slots de 30min dentro da janela do dia, durações,
 * local (próprio ou domicílio) e painel lateral com resumo + CTA que
 * abre o WhatsApp com mensagem pronta.
 *
 * Visual:
 * - Tahoe Sensual v2 — `<SiteHeader>` global + main `max-w-7xl` (steering
 *   §5.1: dashboard archetype, fluxo cheio de inputs em duas colunas).
 * - Cards step-by-step em `rounded-2xl border-line bg-white shadow-sm`,
 *   eyebrow uppercase ink-dim por step, estado active em `bg-rose text-white`
 *   (substitui `bg-foreground` da v1).
 * - Calendário: dia selecionado em `bg-rose`, dot do "hoje" em `bg-rose`,
 *   indisponíveis em `text-ink-faint line-through`.
 *
 * Cross-refs:
 * - src/lib/booking-slots.ts
 * - src/lib/time-utils.ts
 * - src/lib/services/profile.service.ts (getProfileBySlug)
 * - src/components/solicitar/solicitar-whatsapp-panel.tsx
 *
 * dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 12 (solicitar lê auth() + searchParams).
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  calendarMonthCells,
  computeEndTimeLabel,
  filterStartsForDuration,
  generateHalfHourStarts,
  getWindowForWeekday,
  isDateBeforeToday,
  isDateSelectable,
  resolveDurationOptions,
} from "@/lib/booking-slots";
import { formatYearMonth, parseMonthParam } from "@/lib/time-utils";
import { formatBrl } from "@/lib/money";
import { getProfileBySlug } from "@/lib/services";
import { cn } from "@/lib/utils";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SolicitarWhatsAppPanel } from "@/components/solicitar/solicitar-whatsapp-panel";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DAYS_PT } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function buildSolicitarHref(
  slug: string,
  next: Record<string, string | null>,
  current: URLSearchParams,
) {
  const p = new URLSearchParams(current.toString());
  for (const [k, v] of Object.entries(next)) {
    if (v === null) p.delete(k);
    else p.set(k, v);
  }
  const q = p.toString();
  return q ? `/solicitar/${slug}?${q}` : `/solicitar/${slug}`;
}

function firstSelectableYmd(
  rules: Parameters<typeof isDateSelectable>[1],
  year: number,
  month: number,
): string | null {
  const last = new Date(year, month, 0).getDate();
  for (let d = 1; d <= last; d++) {
    const date = new Date(year, month - 1, d);
    if (isDateSelectable(date, rules)) {
      return `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
  }
  return null;
}

/** Eyebrow padrão dos passos do fluxo. */
function StepEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-2xs font-semibold uppercase tracking-wider text-ink-dim">
      {children}
    </p>
  );
}

export default async function SolicitarPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const raw = await searchParams;
  const get = (k: string) => {
    const v = raw[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const profile = await getProfileBySlug(slug);
  if (!profile) notFound();

  // Block providers from accessing booking page
  const session = await auth();
  if (session?.user?.id) {
    const viewerProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (viewerProfile) redirect(`/p/${slug}`);
  }

  const sp = new URLSearchParams();
  Object.entries(raw).forEach(([k, v]) => {
    if (v === undefined) return;
    if (Array.isArray(v)) v.forEach((x) => sp.append(k, x));
    else sp.set(k, v);
  });

  const mes = get("mes");
  const { year, month } = parseMonthParam(mes ?? undefined);
  const mesStr = formatYearMonth(year, month);

  const rules = profile.availabilityRules;
  const pick = firstSelectableYmd(rules, year, month);
  if (!get("dia") && pick) {
    redirect(buildSolicitarHref(slug, { dia: pick, mes: mesStr }, sp));
  }
  const diaResolved = get("dia") ?? pick;

  const durations = resolveDurationOptions(profile);
  const durMinRaw = get("durMin");
  const durMin = durMinRaw ? Number(durMinRaw) : durations[0]?.minutes ?? 60;
  const durationPick = durations.find((d) => d.minutes === durMin) ?? durations[0]!;
  const durationMinutes = durationPick.minutes;
  const isOvernight = durationPick.isOvernight;

  const local = get("local") ?? "proprio";

  const selectedDate = diaResolved
    ? new Date(`${diaResolved}T12:00:00`)
    : new Date(year, month - 1, 1);
  const window = diaResolved ? getWindowForWeekday(rules, selectedDate.getDay()) : null;
  const allStarts = window ? generateHalfHourStarts(window) : [];
  const starts = isOvernight
    ? []
    : window
      ? filterStartsForDuration(allStarts, durationMinutes, window)
      : [];

  let hora = get("hora");
  if (!isOvernight) {
    if (!hora && starts.length) hora = starts[0];
    if (hora && !starts.includes(hora)) hora = starts[0] ?? "";
  } else {
    hora = undefined;
  }

  const cells = calendarMonthCells(year, month);
  const today = new Date();

  const prev = new Date(year, month - 2, 1);
  const next = new Date(year, month, 1);
  const prevMes = formatYearMonth(prev.getFullYear(), prev.getMonth() + 1);
  const nextMes = formatYearMonth(next.getFullYear(), next.getMonth() + 1);

  const dateLabelFull = selectedDate.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const endTime = hora ? computeEndTimeLabel(hora, durationMinutes) : "";
  const locationLabel =
    local === "proprio"
      ? "No local da anunciante"
      : "A domicílio (endereço e taxa combinados direto com ela)";

  let total = durationPick.priceBrl;
  if (local === "domicilio") {
    total += 100;
  }

  const pubImg = profile.media.find((m) => m.isPublic);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 pb-32 sm:px-6 lg:px-8">
        <Link
          href={`/p/${profile.slug}`}
          className="mt-8 inline-flex items-center gap-1.5 text-base text-ink-dim transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Voltar ao perfil
        </Link>

        <div className="mt-6">
          <p className="text-2xs font-semibold uppercase tracking-wider text-rose">
            Marcar horário
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-[1.1] tracking-[-0.025em] text-ink sm:text-4xl">
            Combinar com {profile.displayName}
            <span className="text-rose">.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-dim">
            Escolha dia e horário em intervalos de 30 minutos conforme a disponibilidade
            cadastrada por ela. Ao clicar em{" "}
            <strong className="text-ink">Marcar no WhatsApp</strong>, abrimos o WhatsApp com
            uma mensagem já montada — sem exibir ocupação de outros clientes no site.
          </p>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
          <div className="space-y-12">
            {/* 01 — Calendário */}
            <section>
              <StepEyebrow>01 · Escolha um dia</StepEyebrow>
              <div className="mt-4 rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-sm)]">
                <div className="flex items-center justify-between text-md font-medium">
                  <Link
                    href={buildSolicitarHref(slug, { mes: prevMes }, sp)}
                    scroll={false}
                    className="inline-flex h-9 min-w-[36px] items-center justify-center rounded-lg px-2 text-ink-dim transition-all duration-150 hover:bg-line/40 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    aria-label="Mês anterior"
                  >
                    ←
                  </Link>
                  <span className="text-lg font-semibold capitalize tracking-[-0.015em] text-ink">
                    {selectedDate.toLocaleDateString("pt-BR", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <Link
                    href={buildSolicitarHref(slug, { mes: nextMes }, sp)}
                    scroll={false}
                    className="inline-flex h-9 min-w-[36px] items-center justify-center rounded-lg px-2 text-ink-dim transition-all duration-150 hover:bg-line/40 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    aria-label="Próximo mês"
                  >
                    →
                  </Link>
                </div>
                <div className="mt-4 grid grid-cols-7 gap-1 text-center text-2xs font-semibold uppercase tracking-wider text-ink-dim">
                  {DAYS_PT.map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-7 gap-1 text-center text-md">
                  {cells.map((c, idx) => {
                    if (!c.date) return <span key={idx} />;
                    const ymd = `${c.date.getFullYear()}-${String(c.date.getMonth() + 1).padStart(2, "0")}-${String(c.date.getDate()).padStart(2, "0")}`;
                    const selectable = isDateSelectable(c.date, rules);
                    const past = isDateBeforeToday(c.date);
                    const isSel = diaResolved === ymd;
                    const isToday = today.toDateString() === c.date.toDateString();
                    return (
                      <Link
                        key={ymd}
                        href={
                          selectable
                            ? buildSolicitarHref(slug, { dia: ymd, mes: mesStr }, sp)
                            : "#"
                        }
                        scroll={false}
                        className={cn(
                          "relative block min-h-[2.5rem] rounded-lg py-2 transition-all duration-150 tabular-nums",
                          !selectable && "pointer-events-none text-ink-faint line-through",
                          past && "text-ink-faint",
                          isSel && selectable && "bg-rose text-white shadow-[var(--shadow-sm)]",
                          selectable && !isSel && "text-ink hover:bg-line/40",
                        )}
                        aria-disabled={!selectable}
                      >
                        {c.date.getDate()}
                        {isToday && !isSel ? (
                          <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-rose" />
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-ink-dim">
                  Dias riscados: fora do período cadastrado ou indisponíveis. Horários são gerados
                  de 30 em 30 minutos dentro da janela (ex.: 12:00–17:00 → 12:00, 12:30, …).
                </p>
              </div>
            </section>

            {/* 02 — Horário e duração */}
            <section>
              <StepEyebrow>02 · Horário e duração</StepEyebrow>
              {!isOvernight && (
                <>
                  <p className="mt-4 text-2xs font-semibold uppercase tracking-wider text-ink-dim">
                    Horários disponíveis
                  </p>
                  {starts.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {starts.map((h) => (
                        <Link
                          key={h}
                          href={buildSolicitarHref(slug, { hora: h }, sp)}
                          scroll={false}
                          className={cn(
                            "inline-flex min-h-[44px] items-center justify-center rounded-xl border px-4 text-base font-medium tabular-nums transition-all duration-150 ease-[var(--ease-tahoe)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                            hora === h
                              ? "border-rose bg-rose text-white shadow-[var(--shadow-sm)]"
                              : "border-line bg-white text-ink hover:border-rose/30 hover:bg-rose-soft",
                          )}
                        >
                          {h}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-md text-ink-dim">
                      Não há horários para este dia — escolha outra data.
                    </p>
                  )}
                </>
              )}
              {isOvernight && (
                <p className="mt-3 text-md text-ink-dim">
                  Pernoite não tem horário fixo — o início será combinado diretamente pelo WhatsApp.
                </p>
              )}

              <p className="mt-6 text-2xs font-semibold uppercase tracking-wider text-ink-dim">
                Duração
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {durations.map((d) => (
                  <Link
                    key={d.minutes}
                    href={buildSolicitarHref(slug, { durMin: String(d.minutes) }, sp)}
                    scroll={false}
                    className={cn(
                      "rounded-2xl border p-4 text-center transition-all duration-150 ease-[var(--ease-tahoe)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      "shadow-[var(--shadow-sm)]",
                      durationMinutes === d.minutes
                        ? "border-rose bg-rose text-white"
                        : "border-line bg-white text-ink hover:border-rose/30 hover:bg-rose-soft",
                    )}
                  >
                    <p className="text-md font-semibold">{d.label}</p>
                    <p
                      className={cn(
                        "mt-1 text-sm tabular-nums",
                        durationMinutes === d.minutes ? "opacity-90" : "text-ink-dim",
                      )}
                    >
                      {formatBrl(d.priceBrl)}
                    </p>
                  </Link>
                ))}
              </div>
            </section>

            {/* 03 — Local */}
            <section>
              <StepEyebrow>03 · Onde será?</StepEyebrow>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Link
                  href={buildSolicitarHref(slug, { local: "proprio" }, sp)}
                  scroll={false}
                  className={cn(
                    "rounded-2xl border p-5 transition-all duration-150 ease-[var(--ease-tahoe)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    "shadow-[var(--shadow-sm)]",
                    local === "proprio"
                      ? "border-rose bg-rose text-white"
                      : "border-line bg-white text-ink hover:border-rose/30 hover:bg-rose-soft",
                  )}
                >
                  <p className="text-md font-semibold">Local próprio</p>
                  <p
                    className={cn(
                      "mt-2 text-sm leading-relaxed",
                      local === "proprio" ? "opacity-90" : "text-ink-dim",
                    )}
                  >
                    Atendimento no espaço dela. Valor conforme duração acima.
                  </p>
                </Link>
                <Link
                  href={buildSolicitarHref(slug, { local: "domicilio" }, sp)}
                  scroll={false}
                  className={cn(
                    "rounded-2xl border p-5 transition-all duration-150 ease-[var(--ease-tahoe)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    "shadow-[var(--shadow-sm)]",
                    local === "domicilio"
                      ? "border-rose bg-rose text-white"
                      : "border-line bg-white text-ink hover:border-rose/30 hover:bg-rose-soft",
                  )}
                >
                  <p className="text-md font-semibold">A domicílio</p>
                  <p
                    className={cn(
                      "mt-2 text-sm leading-relaxed",
                      local === "domicilio" ? "opacity-90" : "text-ink-dim",
                    )}
                  >
                    Endereço e taxa de deslocamento combinados no WhatsApp.
                  </p>
                  <p
                    className={cn(
                      "mt-2 text-sm font-semibold",
                      local === "domicilio" ? "text-white" : "text-rose",
                    )}
                  >
                    + estimativa R$ 100 no resumo (ajustável)
                  </p>
                </Link>
              </div>
            </section>

            <section>
              <StepEyebrow>04 · Observações (opcional)</StepEyebrow>
              <p className="mt-2 text-base text-ink-dim">
                Serão incluídas na mensagem do WhatsApp ao clicar em Marcar — não ficam salvas
                no servidor.
              </p>
            </section>
          </div>

          <SolicitarWhatsAppPanel
            profile={{
              id: profile.id,
              slug: profile.slug,
              displayName: profile.displayName,
              age: profile.age,
              cityName: profile.city.name,
              districtName: profile.district?.name ?? "",
              isOnline: profile.isOnline,
              whatsappPhone: profile.whatsappPhone,
              imageUrl: pubImg?.url ?? null,
            }}
            summary={{
              dateLabel: dateLabelFull,
              startTime: hora || "—",
              endTime: hora ? endTime : "—",
              durationLabel: durationPick.label,
              locationLabel,
              totalBrl: total,
              isOvernight,
            }}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
