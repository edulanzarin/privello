"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { buildWhatsAppBookingMessage, buildWhatsAppUrl, whatsappDigits } from "@/lib/whatsapp-booking";
import { formatBrl } from "@/lib/money";

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
 * Painel lateral do fluxo `/solicitar/[slug]` com resumo da reserva
 * (data, horário, duração, local, total) + textarea de observações + CTA
 * "Marcar no WhatsApp" que abre `wa.me/<digits>` com mensagem pronta gerada
 * por `buildWhatsAppBookingMessage`.
 *
 * Props:
 * - `profile` (ProfileBits): dados resumidos do perfil-alvo (id, slug, displayName, age, cidade, bairro,
 *   isOnline, whatsappPhone, imageUrl).
 * - `summary` (Summary): resumo do agendamento já formatado (dateLabel, startTime, endTime, durationLabel,
 *   locationLabel, totalBrl, isOvernight).
 *
 * Consumidores conhecidos:
 * - src/app/solicitar/[slug]/page.tsx
 *
 * Side effects:
 * - No clique do CTA, dispara `fetch("/api/wa-click", { method: "POST" })` com `{ profileId, source: "solicitar" }`
 *   antes do navegador abrir o link `wa.me`.
 * - Helpers `buildWhatsAppBookingMessage` / `buildWhatsAppUrl` / `whatsappDigits` em `@/lib/whatsapp-booking`.
 */
export function SolicitarWhatsAppPanel({ profile, summary }: { profile: ProfileBits; summary: Summary }) {
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
    <aside className="h-fit rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] lg:sticky lg:top-24">
      <div className="flex gap-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-black/[0.04]">
          {profile.imageUrl ? (
            <Image src={profile.imageUrl} alt="" fill className="object-cover" sizes="56px" />
          ) : null}
        </div>
        <div>
          <p className="font-semibold">
            {profile.displayName}, {profile.age}
          </p>
          <p className="text-base text-muted">
            {profile.cityName}
          </p>
          {profile.isOnline ? (
            <p className="mt-1 text-xs font-semibold text-success">Online agora</p>
          ) : null}
        </div>
      </div>

      <h2 className="mt-6 text-xs font-medium text-muted">Resumo</h2>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-muted">Dia</dt>
          <dd className="text-right">{summary.dateLabel}</dd>
        </div>
        {summary.isOvernight ? (
          <div className="flex justify-between gap-2">
            <dt className="text-muted">Horário</dt>
            <dd className="text-right text-muted italic">a combinar</dd>
          </div>
        ) : (
          <div className="flex justify-between gap-2">
            <dt className="text-muted">Horário</dt>
            <dd className="text-right">
              {summary.startTime} → {summary.endTime}
            </dd>
          </div>
        )}
        <div className="flex justify-between gap-2">
          <dt className="text-muted">Duração</dt>
          <dd className="text-right">{summary.durationLabel}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted">Local</dt>
          <dd className="text-right">{summary.locationLabel}</dd>
        </div>
      </dl>
      <p className="mt-6 text-3xl font-semibold tracking-tight">{formatBrl(summary.totalBrl)}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        Pagamento direto à anunciante. A Privello não intermedia valores neste fluxo.
      </p>

      <label className="mt-6 block text-xs font-medium text-muted">Observações</label>
      <textarea
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="mt-2 w-full rounded-lg border border-black/10 bg-white p-3 text-md shadow-[inset_0_0.5px_2px_rgba(0,0,0,0.04)] transition-shadow focus:border-blue focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)] focus:outline-none"
        placeholder="Ex.: primeira vez, preferência de roupa, chegada discreta…"
      />

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
        className={`mt-6 flex w-full items-center justify-center rounded-full bg-coral py-3 text-md font-semibold text-white transition hover:brightness-110 active:scale-[0.97] ${disabled ? "pointer-events-none opacity-40" : ""
          }`}
      >
        Marcar no WhatsApp
      </a>
      {disabled ? (
        <p className="mt-2 text-2xs text-coral">Cadastre um WhatsApp no perfil ou escolha um horário válido.</p>
      ) : (
        <p className="mt-2 text-2xs leading-relaxed text-muted">
          Abre o aplicativo com a mensagem pronta. A confirmação final é direto entre vocês — sem fila de ocupação
          visível no site.
        </p>
      )}

      <p className="mt-6 text-center text-xs">
        <Link href={`/p/${profile.slug}`} className="underline">
          Voltar ao perfil
        </Link>
      </p>
    </aside>
  );
}
