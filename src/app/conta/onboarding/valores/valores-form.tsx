"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { saveOnboardingValores } from "@/app/_actions/onboarding";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";


const DURATIONS = [
  { key: "30min", label: "30 min", required: false },
  { key: "1h", label: "1 hora", required: true },
  { key: "2h", label: "2 horas", required: false },
  { key: "3h", label: "3 horas", required: false },
  { key: "4h", label: "4 horas", required: false },
  { key: "overnight", label: "Pernoite", required: false },
  { key: "travel", label: "Diária", required: false },
] as const;

const PAYMENT_OPTIONS = ["Pix", "Dinheiro", "Cartão de crédito", "Transferência", "Cripto"];

type DurationKey = typeof DURATIONS[number]["key"];

type DurationOption = { minutes: number; priceBrl: number };
type Profile = {
  priceHour: number;
  priceTwoHours: number | null;
  priceOvernight: number | null;
  priceTravelDay: number | null;
  paymentMethods: string | null;
  durationOptions: DurationOption[];
};

function initEnabled(profile: Profile): Record<DurationKey, boolean> {
  const byMin = new Map(profile.durationOptions.map((o) => [o.minutes, o]));
  return {
    "30min": byMin.has(30) || false,
    "1h": true,
    "2h": byMin.has(120) || !!profile.priceTwoHours,
    "3h": byMin.has(180) || false,
    "4h": byMin.has(240) || false,
    "overnight": byMin.has(720) || !!profile.priceOvernight,
    "travel": byMin.has(1440) || !!profile.priceTravelDay,
  };
}

function initPrices(profile: Profile): Record<DurationKey, number> {
  const byMin = new Map(profile.durationOptions.map((o) => [o.minutes, o]));
  return {
    "30min": byMin.get(30)?.priceBrl || 0,
    "1h": byMin.get(60)?.priceBrl || profile.priceHour || 0,
    "2h": byMin.get(120)?.priceBrl || profile.priceTwoHours || 0,
    "3h": byMin.get(180)?.priceBrl || 0,
    "4h": byMin.get(240)?.priceBrl || 0,
    "overnight": byMin.get(720)?.priceBrl || profile.priceOvernight || 0,
    "travel": byMin.get(1440)?.priceBrl || profile.priceTravelDay || 0,
  };
}

export function ValoresForm({ profile }: { profile: Profile }) {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const [enabled, setEnabled] = useState<Record<DurationKey, boolean>>(() => initEnabled(profile));
  const [prices, setPrices] = useState<Record<DurationKey, number>>(() => initPrices(profile));
  const [payments, setPayments] = useState<string[]>(() =>
    profile.paymentMethods ? profile.paymentMethods.split(" · ").map((s) => s.trim()) : []
  );

  function togglePayment(p: string) {
    setPayments((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    if (!enabled["1h"] || !prices["1h"]) {
      setErr("Selecione um valor para 1 hora (obrigatório).");
      return;
    }
    const fd = new FormData();
    DURATIONS.forEach((d) => {
      fd.set(`enabled_${d.key}`, enabled[d.key] ? "1" : "0");
      fd.set(`price_${d.key}`, String(prices[d.key] ?? 0));
    });
    fd.set("paymentMethods", payments.join(" · "));
    startTransition(async () => {
      const res = await saveOnboardingValores(fd);
      if (res?.error) setErr(res.error);
    });
  }


  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-8">
      {err && (
        <div className="rounded-xl border border-coral/30 bg-coral/5 px-4 py-3 text-sm text-coral">{err}</div>
      )}

      {/* ── Durações e preços ── */}
      <div className="rounded-2xl border border-black/[0.06] bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]">
        <div className="border-b border-black/[0.06] px-6 py-4">
          <p className="text-md font-semibold">Durações e valores</p>
          <p className="mt-1 text-xs text-muted">Ative as durações que você oferece e defina o valor de cada uma.</p>
        </div>

        <div className="divide-y divide-black/[0.06]">
          {DURATIONS.map((d) => (
            <div key={d.key} className="flex items-center gap-4 px-6 py-4">
              {/* Toggle (unificado: visual verde do primitivo Switch) */}
              <Switch
                checked={!!enabled[d.key]}
                onChange={(c) =>
                  !d.required &&
                  setEnabled((p) => ({ ...p, [d.key]: c }))
                }
                disabled={d.required}
                size="md"
              />

              {/* Label */}
              <span className={cn(
                "w-20 shrink-0 text-sm font-semibold",
                !enabled[d.key] && "text-muted",
              )}>
                {d.label}
                {d.required && <span className="ml-1 text-coral">*</span>}
              </span>

              {/* Price input */}
              <div className="relative max-w-[180px]">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted">R$</span>
                <input
                  type="number"
                  min={50}
                  step={50}
                  disabled={!enabled[d.key]}
                  value={prices[d.key] || ""}
                  onChange={(e) => setPrices((p) => ({ ...p, [d.key]: Number(e.target.value) }))}
                  placeholder="0"
                  className="w-full rounded-lg border border-black/10 bg-white py-2.5 pl-9 pr-3 text-sm shadow-[inset_0_0.5px_2px_rgba(0,0,0,0.04)] outline-none hover:border-black/20 focus:border-blue focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)] transition-all disabled:bg-black/[0.03] disabled:text-muted"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Formas de pagamento ── */}
      <div className="rounded-2xl border border-black/[0.06] bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]">
        <div className="border-b border-black/[0.06] px-6 py-4">
          <p className="text-md font-semibold">Formas de pagamento</p>
        </div>
        <div className="flex flex-wrap gap-2 px-6 py-5">
          {PAYMENT_OPTIONS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => togglePayment(p)}
              className={cn(
                "rounded-md border px-4 py-2 text-sm font-medium transition",
                payments.includes(p)
                  ? "border-foreground bg-foreground text-white"
                  : "border-line bg-white text-muted hover:border-foreground/30",
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Link href="/conta/onboarding/fotos" className="rounded-lg border border-line bg-white px-6 py-3 text-base font-medium hover:bg-line active:scale-[0.97] transition">
          ← Voltar
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-coral px-8 py-3 text-md font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.97] disabled:opacity-50"
        >
          {pending ? "Salvando…" : "Continuar →"}
        </button>
      </div>
    </form>
  );
}
