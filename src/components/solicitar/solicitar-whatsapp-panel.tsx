"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  buildWhatsAppBookingMessage,
  buildWhatsAppUrl,
  whatsappDigits,
} from "@/lib/whatsapp-booking";
import { formatBrl } from "@/lib/money";
import { cn } from "@/lib/utils";

type ProfileBits = {
  id: string;
  slug: string;
  displayName: string;
  age: number;
  cityName: string;
  districtName: string;
  isOnline: boolean;
  whatsappPhone: string | null;
  imageUrl: string | null;
};

type Summary = {
  dateLabel: string;
  startTime: string;
  endTime: string;
  durationLabel: string;
  locationLabel: string;
  totalBrl: number;
  isOvernight: boolean;
};

/**
 * SolicitarWhatsAppPanel — painel lateral do fluxo `/solicitar/[slug]`.
 *
 * Caminho: src/components/solicitar/solicitar-whatsapp-panel.tsx
 * Steering: `.kiro/steering/design-system.md` §3 (tokens), §6.3 (Button
 * variant whatsapp), §3.4 (success-soft para "online").
 *
 * Visual:
 * - Card glass-panel sólido `rounded-2xl border-line bg-white shadow-sm`,
 *   sticky no desktop.
 * - Avatar (Image fill) + nome/cidade + pílula online (success-soft).
 * - Resumo do agendamento (date / horário / duração / local) em `<dl>` com
 *   `text-ink-dim` para labels e `text-ink` para valores.
 * - Total grande em `text-3xl font-bold tabular-nums`.
 * - Textarea v2 (primitivo).
 * - CTA fullwidth verde `bg-whatsapp` (Button variant whatsapp linguagem) com
 *   ícone `MessageCircle`.
 *
 * Side effects:
 * - No clique do CTA, dispara `fetch("/api/wa-click", { method: "POST" })`
 *   antes do navegador abrir o link `wa.me`.
 * - Helpers em `@/lib/whatsapp-booking`.
 *
 * Consumidores:
 * - src/app/solicitar/[slug]/page.tsx
 */
export function SolicitarWhatsAppPanel({
  profile,
  summary,
}: {
  profile: ProfileBits;
  summary: Summary;
}) {
  const [notes, setNotes] = useState("");
  const digits = whatsappDigits(profile.whatsappPhone);
  const disabled = !digits || (!summary.isOvernight && summary.startTime === "—");

  const message = buildWhatsAppBookingMessage({
    displayName: profile.displayName,
    dateLabel: summary.dateLabel,
    startTime: summary.startTime,
    endTime: summary.endTime,
    durationLabel: summary.durationLabel,
    locationLabel: summary.locationLabel,
    totalBrl: summary.totalBrl,
    isOvernight: summary.isOvernight,
    notes,
  });

  const href = digits && !disabled ? buildWhatsAppUrl(digits, message) : "#";

  return (
    <aside className="h-fit rounded-2xl border border-line bg-white p-6 shadow-[var(--shadow-sm)] lg:sticky lg:top-24">
      <div className="flex items-start gap-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-line/30">
          {profile.imageUrl ? (
            <Image
              src={profile.imageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="56px"
            />
          ) : null}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold tracking-[-0.011em] text-ink">
            {profile.displayName}, {profile.age}
          </p>
          <p className="truncate text-sm text-ink-dim">{profile.cityName}</p>
          {profile.isOnline ? (
            <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2 py-0.5 text-2xs font-semibold text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Online agora
            </span>
          ) : null}
        </div>
      </div>

      <p className="mt-6 text-2xs font-semibold uppercase tracking-wider text-ink-dim">
        Resumo
      </p>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-ink-dim">Dia</dt>
          <dd className="text-right text-ink">{summary.dateLabel}</dd>
        </div>
        {summary.isOvernight ? (
          <div className="flex justify-between gap-3">
            <dt className="text-ink-dim">Horário</dt>
            <dd className="text-right italic text-ink-dim">a combinar</dd>
          </div>
        ) : (
          <div className="flex justify-between gap-3">
            <dt className="text-ink-dim">Horário</dt>
            <dd className="text-right tabular-nums text-ink">
              {summary.startTime} → {summary.endTime}
            </dd>
          </div>
        )}
        <div className="flex justify-between gap-3">
          <dt className="text-ink-dim">Duração</dt>
          <dd className="text-right text-ink">{summary.durationLabel}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink-dim">Local</dt>
          <dd className="text-right text-ink">{summary.locationLabel}</dd>
        </div>
      </dl>

      <p className="mt-6 text-3xl font-bold tabular-nums tracking-[-0.022em] text-ink">
        {formatBrl(summary.totalBrl)}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-ink-dim">
        Pagamento direto à anunciante. A Privello não intermedia valores neste fluxo.
      </p>

      <div className="mt-6">
        <Textarea
          label="Observações"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ex.: primeira vez, preferência de roupa, chegada discreta…"
        />
      </div>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          if (disabled) return;
          fetch("/api/wa-click", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profileId: profile.id, source: "solicitar" }),
          }).catch(() => { });
        }}
        aria-disabled={disabled}
        className={cn(
          "mt-6 inline-flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl bg-whatsapp px-6 py-3 text-md font-semibold text-white shadow-[var(--shadow-sm)] transition-all duration-150 ease-[var(--ease-tahoe)] hover:brightness-105 active:brightness-95 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          disabled && "pointer-events-none opacity-40",
        )}
      >
        <MessageCircle className="h-4 w-4" aria-hidden />
        Marcar no WhatsApp
      </a>
      {disabled ? (
        <p className="mt-2 text-2xs leading-relaxed text-danger">
          Cadastre um WhatsApp no perfil ou escolha um horário válido.
        </p>
      ) : (
        <p className="mt-2 text-2xs leading-relaxed text-ink-dim">
          Abre o aplicativo com a mensagem pronta. A confirmação final é direto entre vocês — sem
          fila de ocupação visível no site.
        </p>
      )}

      <p className="mt-6 text-center text-xs">
        <Link
          href={`/p/${profile.slug}`}
          className="text-ink-dim underline-offset-2 hover:text-rose hover:underline"
        >
          Voltar ao perfil
        </Link>
      </p>
    </aside>
  );
}
