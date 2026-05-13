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
    <aside className="h-fit border border-line bg-white p-6 shadow-sm lg:sticky lg:top-24">
      <div className="flex gap-3">
        <div className="relative h-14 w-14 shrink-0 bg-line">
          {profile.imageUrl ? (
            <Image src={profile.imageUrl} alt="" fill className="object-cover" sizes="56px" />
          ) : null}
        </div>
        <div>
          <p className="font-semibold">
            {profile.displayName}, {profile.age}
          </p>
          <p className="text-xs text-muted">
            {profile.cityName} · {profile.districtName}
          </p>
          {profile.isOnline ? (
            <p className="mt-1 text-[10px] font-semibold uppercase text-success">Online agora</p>
          ) : null}
        </div>
      </div>

      <h2 className="mt-6 text-[10px] font-semibold uppercase tracking-wider text-muted">Resumo</h2>
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
      <p className="mt-6 font-serif text-3xl font-semibold">{formatBrl(summary.totalBrl)}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        Pagamento direto à anunciante. A Privello não intermedia valores neste fluxo.
      </p>

      <label className="mt-6 block text-[10px] font-semibold uppercase tracking-wider text-muted">Observações</label>
      <textarea
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="mt-2 w-full border border-line bg-[#fdfcfa] p-3 text-sm"
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
          }).catch(() => {});
        }}
        className={`mt-6 flex w-full items-center justify-center bg-foreground py-3 text-xs font-semibold uppercase tracking-wider text-white ${
          disabled ? "pointer-events-none opacity-40" : ""
        }`}
      >
        Marcar no WhatsApp
      </a>
      {disabled ? (
        <p className="mt-2 text-[10px] text-coral">Cadastre um WhatsApp no perfil ou escolha um horário válido.</p>
      ) : (
        <p className="mt-2 text-[10px] leading-relaxed text-muted">
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
