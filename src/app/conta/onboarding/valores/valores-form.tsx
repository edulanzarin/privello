"use client";

import { useState, useTransition } from "react";
import { saveOnboardingValores } from "@/app/_actions/onboarding";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { ToggleChip } from "@/components/ui/toggle-chip";
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

const PAYMENT_OPTIONS = [
  "Pix",
  "Dinheiro",
  "Cartão de crédito",
  "Transferência",
  "Cripto",
];

type DurationKey = (typeof DURATIONS)[number]["key"];

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
    overnight: byMin.has(720) || !!profile.priceOvernight,
    travel: byMin.has(1440) || !!profile.priceTravelDay,
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
    overnight: byMin.get(720)?.priceBrl || profile.priceOvernight || 0,
    travel: byMin.get(1440)?.priceBrl || profile.priceTravelDay || 0,
  };
}

/**
 * ValoresForm — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/app/conta/onboarding/valores/valores-form.tsx
 * Steering: `.kiro/steering/design-system.md` §6 (forms).
 *
 * Editor de durações + preços + métodos de pagamento. Reusa primitivos
 * Card, Button, Switch, Input, ToggleChip.
 */
export function ValoresForm({ profile }: { profile: Profile }) {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const [enabled, setEnabled] = useState<Record<DurationKey, boolean>>(() =>
    initEnabled(profile),
  );
  const [prices, setPrices] = useState<Record<DurationKey, number>>(() =>
    initPrices(profile),
  );
  const [payments, setPayments] = useState<string[]>(() =>
    profile.paymentMethods
      ? profile.paymentMethods.split(" · ").map((s) => s.trim())
      : [],
  );

  function togglePayment(p: string) {
    setPayments((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
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
        <Card variant="danger-subtle" padding="sm" className="text-sm text-danger">
          {err}
        </Card>
      )}

      {/* ── Durações e preços ── */}
      <Card variant="solid" padding="none" className="overflow-hidden">
        <div className="border-b border-line px-6 py-4">
          <p className="text-md font-semibold text-ink">Durações e valores</p>
          <p className="mt-1 text-xs text-ink-dim">
            Ative as durações que você oferece e defina o valor de cada uma.
          </p>
        </div>

        <div className="divide-y divide-line">
          {DURATIONS.map((d) => (
            <div key={d.key} className="flex items-center gap-4 px-6 py-4">
              <Switch
                checked={!!enabled[d.key]}
                onChange={(c) =>
                  !d.required &&
                  setEnabled((p) => ({ ...p, [d.key]: c }))
                }
                disabled={d.required}
                size="md"
              />

              <span
                className={cn(
                  "w-20 shrink-0 text-sm font-semibold",
                  enabled[d.key] ? "text-ink" : "text-ink-dim",
                )}
              >
                {d.label}
                {d.required && <span className="ml-1 text-rose">*</span>}
              </span>

              <div className="max-w-[180px]">
                <Input
                  type="number"
                  min={50}
                  step={50}
                  disabled={!enabled[d.key]}
                  value={prices[d.key] || ""}
                  onChange={(e) =>
                    setPrices((p) => ({
                      ...p,
                      [d.key]: Number(e.target.value),
                    }))
                  }
                  prefix="R$"
                  placeholder="0"
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Formas de pagamento ── */}
      <Card variant="solid" padding="none" className="overflow-hidden">
        <div className="border-b border-line px-6 py-4">
          <p className="text-md font-semibold text-ink">Formas de pagamento</p>
        </div>
        <div className="flex flex-wrap gap-2 px-6 py-5">
          {PAYMENT_OPTIONS.map((p) => (
            <ToggleChip
              key={p}
              active={payments.includes(p)}
              onClick={() => togglePayment(p)}
            >
              {p}
            </ToggleChip>
          ))}
        </div>
      </Card>

      <div className="flex items-center justify-between pt-2">
        <Button href="/conta/onboarding/fotos" variant="outline" size="lg">
          ← Voltar
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={pending}
          className="min-h-[44px]"
        >
          {pending ? "Salvando…" : "Continuar →"}
        </Button>
      </div>
    </form>
  );
}
