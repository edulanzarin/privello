import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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
import {
  formatYearMonth,
  parseMonthParam,
} from "@/lib/time-utils";
import { formatBrl } from "@/lib/money";
import { getProfileBySlug } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SolicitarWhatsAppPanel } from "@/components/solicitar/solicitar-whatsapp-panel";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function buildSolicitarHref(slug: string, next: Record<string, string | null>, current: URLSearchParams) {
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

export default async function SolicitarPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const raw = await searchParams;
  const get = (k: string) => {
    const v = raw[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const profile = await getProfileBySlug(slug);
  if (!profile) notFound();

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

  const local = get("local") ?? "proprio";

  const selectedDate = diaResolved
    ? new Date(`${diaResolved}T12:00:00`)
    : new Date(year, month - 1, 1);
  const window = diaResolved ? getWindowForWeekday(rules, selectedDate.getDay()) : null;
  const allStarts = window ? generateHalfHourStarts(window) : [];
  const starts = window ? filterStartsForDuration(allStarts, durationMinutes, window) : [];

  let hora = get("hora");
  if (!hora && starts.length) hora = starts[0];
  if (hora && !starts.includes(hora)) hora = starts[0] ?? "";

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
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href={`/p/${profile.slug}`} className="text-xs text-muted underline">
            Voltar ao perfil
          </Link>
          <Link href="/" className="font-serif text-lg">
            privello<span className="text-coral">.</span>
          </Link>
          <p className="flex items-center gap-2 text-xs">
            <span className="hidden sm:inline">Cliente</span>
            <Check className="h-3.5 w-3.5 text-success" strokeWidth={2} />
            <span className="text-[10px] uppercase text-muted">fluxo Privello</span>
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted">Marcar horário</p>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl">
          Combinar com {profile.displayName}
          <span className="text-coral">.</span>
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Escolha dia e horário em intervalos de 30 minutos conforme a disponibilidade cadastrada por ela. Ao clicar em{" "}
          <strong className="text-foreground">Marcar no WhatsApp</strong>, abrimos o WhatsApp com uma mensagem já
          montada — sem exibir ocupação de outros clientes no site.
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
          <div className="space-y-12">
            <section>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">01 · Escolha um dia</p>
              <div className="mt-4 border border-line bg-white p-4">
                <div className="flex items-center justify-between text-sm font-medium">
                  <Link
                    href={buildSolicitarHref(slug, { mes: prevMes }, sp)}
                    className="text-muted hover:text-foreground"
                    aria-label="Mês anterior"
                  >
                    ←
                  </Link>
                  <span className="font-serif text-base capitalize">
                    {selectedDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                  </span>
                  <Link
                    href={buildSolicitarHref(slug, { mes: nextMes }, sp)}
                    className="text-muted hover:text-foreground"
                    aria-label="Próximo mês"
                  >
                    →
                  </Link>
                </div>
                <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-muted">
                  {diasSemana.map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-7 gap-1 text-center text-sm">
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
                        href={selectable ? buildSolicitarHref(slug, { dia: ymd, mes: mesStr }, sp) : "#"}
                        className={cn(
                          "relative block min-h-[2.25rem] py-2",
                          !selectable && "pointer-events-none text-muted/50 line-through",
                          past && "text-muted/40",
                          isSel && selectable && "bg-foreground text-white",
                          selectable && !isSel && "hover:bg-black/5",
                        )}
                        aria-disabled={!selectable}
                      >
                        {c.date.getDate()}
                        {isToday ? <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-coral" /> : null}
                      </Link>
                    );
                  })}
                </div>
                <p className="mt-4 text-[10px] leading-relaxed text-muted">
                  Dias riscados: fora do período cadastrado ou indisponíveis. Horários são gerados de 30 em 30 minutos
                  dentro da janela (ex.: 12:00–17:00 → 12:00, 12:30, …).
                </p>
              </div>
            </section>

            <section>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">02 · Horário e duração</p>
              <p className="mt-3 text-[10px] font-semibold uppercase text-muted">Horários disponíveis</p>
              {starts.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {starts.map((h) => (
                    <Link
                      key={h}
                      href={buildSolicitarHref(slug, { hora: h }, sp)}
                      className={cn(
                        "border px-3 py-2 text-sm",
                        hora === h ? "border-foreground bg-foreground text-white" : "border-line bg-white hover:border-foreground/30",
                      )}
                    >
                      {h}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted">Não há horários para este dia — escolha outra data.</p>
              )}

              <p className="mt-6 text-[10px] font-semibold uppercase text-muted">Duração</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {durations.map((d) => (
                  <Link
                    key={d.minutes}
                    href={buildSolicitarHref(slug, { durMin: String(d.minutes) }, sp)}
                    className={cn(
                      "border border-line bg-white p-4 text-center text-sm transition hover:border-foreground/30",
                      durationMinutes === d.minutes && "border-foreground bg-foreground text-white",
                    )}
                  >
                    <p className="font-semibold">{d.label}</p>
                    <p className="mt-1 text-xs opacity-80">{formatBrl(d.priceBrl)}</p>
                  </Link>
                ))}
              </div>
            </section>

            <section>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">03 · Onde será?</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Link
                  href={buildSolicitarHref(slug, { local: "proprio" }, sp)}
                  className={cn(
                    "border p-5 text-sm",
                    local === "proprio" ? "border-foreground" : "border-line bg-white",
                  )}
                >
                  <p className="font-semibold">Local próprio</p>
                  <p className="mt-2 text-xs text-muted">Atendimento no espaço dela. Valor conforme duração acima.</p>
                </Link>
                <Link
                  href={buildSolicitarHref(slug, { local: "domicilio" }, sp)}
                  className={cn(
                    "border p-5 text-sm",
                    local === "domicilio" ? "border-foreground" : "border-line bg-white",
                  )}
                >
                  <p className="font-semibold">A domicílio</p>
                  <p className="mt-2 text-xs text-muted">Endereço e taxa de deslocamento combinados no WhatsApp.</p>
                  <p className="mt-2 text-xs font-medium text-coral">+ estimativa R$ 100 no resumo (ajustável)</p>
                </Link>
              </div>
            </section>

            <section>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">04 · Observações (opcional)</p>
              <p className="mt-2 text-xs text-muted">
                Serão incluídas na mensagem do WhatsApp ao clicar em Marcar — não ficam salvas no servidor.
              </p>
            </section>
          </div>

          <SolicitarWhatsAppPanel
            profile={{
              slug: profile.slug,
              displayName: profile.displayName,
              age: profile.age,
              cityName: profile.city.name,
              districtName: profile.district.name,
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
            }}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
