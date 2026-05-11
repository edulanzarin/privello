import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, MapPin, Phone, Star } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ViewTracker } from "@/components/profile/view-tracker";
import { FavoriteButton } from "@/components/profile/favorite-button";
import { auth } from "@/lib/auth";
import { getFavoriteStatus } from "@/app/_actions/favorites";
import { formatBrl } from "@/lib/money";
import { getProfileBySlug } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type PageProps = { params: Promise<{ slug: string }> };

export default async function PublicProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const profile = await getProfileBySlug(slug);
  if (!profile) notFound();

  const session = await auth();
  const isLoggedIn = !!session?.user?.id;
  const initialFavorited = isLoggedIn ? await getFavoriteStatus(profile.id) : false;

  const publicMedia = profile.media.filter((m) => m.isPublic);
  const cover = publicMedia.find((m) => m.isCover) ?? publicMedia[0];
  const thumbs = publicMedia.filter((m) => m.id !== cover?.id).slice(0, 2);
  const privateCount = profile.media.filter((m) => !m.isPublic).length;

  const memberLabel = profile.memberSince.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });

  const rs = profile.reviews;
  const fallback = profile.ratingAvg;
  const avgDim = (get: (r: (typeof rs)[0]) => number) =>
    rs.length ? rs.reduce((a, r) => a + get(r), 0) / rs.length : fallback;
  const dims = [
    ["Pontualidade", avgDim((r) => r.punctuality)],
    ["Descrição", avgDim((r) => r.descriptionScore)],
    ["Conversa", avgDim((r) => r.conversation)],
    ["Experiência", avgDim((r) => r.experience)],
  ] as const;

  const monthsVerified = Math.max(
    0,
    Math.floor((Date.now() - profile.memberSince.getTime()) / (30.44 * 86400000)),
  );

  return (
    <>
      <SiteHeader activeHref={`/descobrir/${profile.city.slug}`} />
      <ViewTracker profileId={profile.id} />
      <main className="min-h-screen pb-16">
        <div className="border-b border-line bg-white">
          <div className="mx-auto max-w-6xl px-4 py-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted sm:px-6">
            <Link href={`/descobrir/${profile.city.slug}`} className="hover:text-foreground">
              Descobrir
            </Link>
            {" / "}
            {profile.city.name} / {profile.district.name} / {profile.displayName}
          </div>
        </div>

        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-wrap gap-2">
            {profile.isVerified ? (
              <span className="border border-success/30 bg-success/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-success">
                Verificada · foto + documento
              </span>
            ) : null}
            {profile.isOnline ? (
              <span className="border border-success/30 bg-success/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-success">
                Online agora
              </span>
            ) : null}
          </div>

          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div>
              <h1 className="font-serif text-4xl sm:text-5xl">
                {profile.displayName}, {profile.age}
              </h1>
              <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" strokeWidth={1.5} />
                  {profile.district.name} · {profile.city.name}
                </span>
                <span>Membro desde {memberLabel}</span>
                <span className="inline-flex items-center gap-1">
                  <Star className="h-4 w-4 fill-coral text-coral" strokeWidth={0} />
                  {profile.ratingAvg.toFixed(1)} · {profile.ratingCount} avaliações
                </span>
              </p>
              {profile.tagline ? <p className="mt-6 font-serif text-lg italic text-foreground/90">{profile.tagline}</p> : null}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href={`/solicitar/${profile.slug}`}
                  className="inline-flex items-center justify-center gap-2 bg-foreground px-6 py-3 text-sm font-semibold text-white"
                >
                  Marcar horário
                </Link>
                <a
                  href={
                    profile.whatsappPhone
                      ? `https://wa.me/${profile.whatsappPhone.replace(/\D/g, "")}`
                      : "#"
                  }
                  className="inline-flex items-center justify-center gap-2 bg-coral px-6 py-3 text-sm font-semibold text-white"
                >
                  Chamar no WhatsApp
                </a>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 border border-foreground px-6 py-3 text-sm font-medium"
                >
                  <Phone className="h-4 w-4" strokeWidth={1.5} />
                  Ver número
                </button>
                <FavoriteButton
                  profileId={profile.id}
                  initialFavorited={initialFavorited}
                  isLoggedIn={isLoggedIn}
                />
              </div>

              <dl className="mt-10 grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Verificada há", `${monthsVerified} meses`],
                  ["Vídeo-verificada", profile.videoVerified ? "Sim" : "Não"],
                  ["Visualizações", `${profile.viewsThisMonth.toLocaleString("pt-BR")} este mês`],
                  ["Última atualização", profile.lastUpdatedAt.toLocaleDateString("pt-BR")],
                ].map(([k, v]) => (
                  <div key={k} className="border border-line bg-white px-3 py-3">
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">{k}</dt>
                    <dd className="mt-1 font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
              <div className="relative aspect-[4/5] w-full bg-line sm:min-h-[420px]">
                {cover ? (
                  <Image src={cover.url} alt="" fill className="object-cover" sizes="(max-width:1024px) 100vw, 50vw" priority />
                ) : null}
                <span className="absolute bottom-3 left-3 rounded bg-black/70 px-2 py-1 text-xs text-white">
                  1 / {publicMedia.length || 1}
                </span>
              </div>
              <div className="flex flex-row gap-3 sm:flex-col">
                {thumbs.map((m) => (
                  <div key={m.id} className="relative aspect-square w-24 shrink-0 bg-line sm:aspect-auto sm:h-32 sm:w-full">
                    <Image src={m.url} alt="" fill className="object-cover" sizes="120px" />
                  </div>
                ))}
                <div className="relative flex flex-1 items-center justify-center border border-dashed border-line bg-black/5 text-center text-xs text-muted">
                  <span className="flex items-center gap-1 px-2">
                    <Lock className="h-4 w-4" strokeWidth={1.5} />+{privateCount || 15} privadas
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-line bg-white py-14">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-10">
              <div>
                <h2 className="font-serif text-2xl">Quem sou</h2>
                <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted">
                  {profile.bio.split("\n").map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>

              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted">Características</h3>
                  <ul className="mt-3 space-y-2 text-sm">
                    <li className="flex justify-between border-b border-line py-2">
                      <span className="text-muted">Altura</span>
                      <span>
                        {profile.heightCm
                          ? `${(profile.heightCm / 100).toFixed(2).replace(".", ",")} m`
                          : "—"}
                      </span>
                    </li>
                    <li className="flex justify-between border-b border-line py-2">
                      <span className="text-muted">Manequim</span>
                      <span>{profile.dressSize ?? "—"}</span>
                    </li>
                    <li className="flex justify-between border-b border-line py-2">
                      <span className="text-muted">Cabelo</span>
                      <span>{profile.hair ?? "—"}</span>
                    </li>
                    <li className="flex justify-between border-b border-line py-2">
                      <span className="text-muted">Olhos</span>
                      <span>{profile.eyes ?? "—"}</span>
                    </li>
                    <li className="flex justify-between border-b border-line py-2">
                      <span className="text-muted">Idiomas</span>
                      <span>{profile.languages ?? "—"}</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted">Valores</h3>
                  <ul className="mt-3 space-y-2 text-sm">
                    <li className="flex justify-between border-b border-line py-2">
                      <span className="text-muted">1 hora</span>
                      <span className="font-medium">{formatBrl(profile.priceHour)}</span>
                    </li>
                    {profile.priceTwoHours ? (
                      <li className="flex justify-between border-b border-line py-2">
                        <span className="text-muted">2 horas</span>
                        <span className="font-medium">{formatBrl(profile.priceTwoHours)}</span>
                      </li>
                    ) : null}
                    {profile.priceOvernight ? (
                      <li className="flex justify-between border-b border-line py-2">
                        <span className="text-muted">Pernoite</span>
                        <span className="font-medium">{formatBrl(profile.priceOvernight)}</span>
                      </li>
                    ) : null}
                    {profile.priceTravelDay ? (
                      <li className="flex justify-between border-b border-line py-2">
                        <span className="text-muted">Viagem (diária)</span>
                        <span className="font-medium">{formatBrl(profile.priceTravelDay)}</span>
                      </li>
                    ) : null}
                    <li className="flex justify-between border-b border-line py-2">
                      <span className="text-muted">Pagamento</span>
                      <span>{profile.paymentMethods ?? "—"}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted">Atende a</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    ["Homens", profile.servesMen],
                    ["Casais", profile.servesCouples],
                    ["Mulheres", profile.servesWomen],
                    ["Local próprio", profile.hasOwnPlace],
                    ["Hotel / domicílio", profile.homeVisit],
                    ["Viagens nacionais", profile.travelsNational],
                    ["Viagens internacionais", profile.travelsInternational],
                  ].map(([label, on]) => (
                    <span
                      key={String(label)}
                      className={cn(
                        "border px-2 py-1 text-xs",
                        on ? "border-foreground bg-foreground text-white" : "border-line text-muted line-through",
                      )}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-serif text-2xl">Esta semana</h2>
              <ul className="mt-6 space-y-3 text-sm">
                {profile.availabilityRules.map((r) => (
                  <li key={r.id} className="flex items-center justify-between border-b border-line py-2">
                    <span>
                      {dias[r.weekday]} · {r.startTime} – {r.endTime}
                    </span>
                    <span className="flex items-center gap-2 text-xs font-medium uppercase">
                      {r.status === "CLOSED" ? (
                        <span className="text-muted">Fechado</span>
                      ) : r.status === "BUSY" ? (
                        <span className="text-coral">Ocupada</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-success">
                          <span className="h-2 w-2 rounded-full bg-success" />
                          Disponível
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[10px] leading-relaxed text-muted">
                Inícios possíveis no agendamento: de 30 em 30 minutos dentro destes intervalos (sem exibir ocupação de
                terceiros).
              </p>
              <Link
                href={`/solicitar/${profile.slug}`}
                className="mt-6 flex w-full items-center justify-center bg-coral py-3 text-sm font-semibold text-white"
              >
                Montar horário e mensagem no WhatsApp
              </Link>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                Você escolhe dia, horário e duração; abrimos o WhatsApp com o texto pronto. A confirmação é direto com
                ela — a Privello não grava a conversa.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-line py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="font-serif text-3xl">
                {profile.ratingAvg.toFixed(1)} · {profile.ratingCount} avaliações
              </h2>
              <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
                {dims.map(([k, v]) => (
                  <div key={k}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{k}</p>
                    <p className="mt-1 text-lg font-medium">{Number.isFinite(v) ? v.toFixed(1) : "—"}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {profile.reviews.map((r) => (
                <article key={r.id} className="border border-line bg-white p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-sm font-medium text-white">
                      {r.reviewerInitials}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{r.reviewerName}</p>
                      <p className="text-xs text-muted">
                        {r.createdAt.toLocaleDateString("pt-BR")} · {r.rating.toFixed(1)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm italic leading-relaxed text-muted">{r.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
