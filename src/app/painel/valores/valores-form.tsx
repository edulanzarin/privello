"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveDurationOptions } from "@/app/painel/_actions/provider-settings";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { ToggleChip } from "@/components/ui/toggle-chip";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const DURATIONS = [
  { minutes: 30, label: "30 min", required: false },
  { minutes: 60, label: "1 hora", required: true },
  { minutes: 120, label: "2 horas", required: false },
  { minutes: 180, label: "3 horas", required: false },
  { minutes: 240, label: "4 horas", required: false },
  { minutes: 720, label: "Pernoite", required: false },
  { minutes: 1440, label: "Diária", required: false },
] as const;

const PAYMENT_OPTIONS = ["Pix", "Dinheiro", "Cartão de crédito", "Transferência", "Cripto"];

type DurationOption = { minutes: number; priceBrl: number };
type Profile = {
  priceHour: number;
  priceTwoHours: number | null;
  priceOvernight: number | null;
  priceTravelDay: number | null;
  paymentMethods: string | null;
  durationOptions: DurationOption[];
};

export function ValoresForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const byMin = new Map(profile.durationOptions.map((o) => [o.minutes, o]));

  const [enabled, setEnabled] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(DURATIONS.map((d) => [
      d.minutes,
      d.required || byMin.has(d.minutes),
    ]))
  );
  const [prices, setPrices] = useState<Record<number, number>>(() =>
    Object.fromEntries(DURATIONS.map((d) => [
      d.minutes,
      byMin.get(d.minutes)?.priceBrl
      ?? (d.minutes === 60 ? profile.priceHour : 0)
      ?? 0,
    ]))
  );
  const [payments, setPayments] = useState<string[]>(() =>
    profile.paymentMethods ? profile.paymentMethods.split(" · ").map((s) => s.trim()) : []
  );

  function togglePayment(p: string) {
    setPayments((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData();
    let idx = 0;
    DURATIONS.forEach((d) => {
      if (!enabled[d.minutes] || !prices[d.minutes]) return;
      fd.set(`dur_${idx}_minutes`, String(d.minutes));
      fd.set(`dur_${idx}_label`, d.label);
      fd.set(`dur_${idx}_price`, String(prices[d.minutes]));
      idx++;
    });
    fd.set("paymentMethods", payments.join(" · "));
    startTransition(async () => {
      await saveDurationOptions(fd);
      toast("Valores salvos.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Durações */}
      <div className="rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="border-b border-black/[0.06] px-6 py-4">
          <p className="text-md font-semibold">Durações e valores</p>
          <p className="mt-1 text-sm text-muted">Ative as durações que você oferece e defina o valor.</p>
        </div>
        <div className="divide-y divide-black/[0.04]">
          {DURATIONS.map((d) => (
            <div key={d.minutes} className="flex items-center gap-4 px-6 py-4">
              <Switch
                checked={!!enabled[d.minutes]}
                onChange={(c) =>
                  !d.required &&
                  setEnabled((p) => ({ ...p, [d.minutes]: c }))
                }
                disabled={d.required}
                size="md"
              />
              <span className={cn(
                "w-20 shrink-0 text-md font-medium",
                !enabled[d.minutes] && "text-muted",
              )}>
                {d.label}
                {d.required && <span className="ml-1 text-coral">*</span>}
              </span>
              <div className="relative max-w-[160px]">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-base text-muted">R$</span>
                <input
                  type="number"
                  min={50}
                  step={50}
                  disabled={!enabled[d.minutes]}
                  value={prices[d.minutes] || ""}
                  onChange={(e) => setPrices((p) => ({ ...p, [d.minutes]: Number(e.target.value) }))}
                  placeholder="0"
                  className="w-full rounded-lg border border-black/10 bg-white py-[7px] pl-9 pr-3 text-md shadow-[inset_0_0.5px_2px_rgba(0,0,0,0.04)] outline-none focus-visible:ring-2 focus-visible:ring-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all hover:border-black/20 focus:border-blue focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)] disabled:bg-black/[0.03] disabled:text-muted"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagamentos */}
      <div className="rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="border-b border-black/[0.06] px-6 py-4">
          <p className="text-md font-semibold">Formas de pagamento</p>
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
      </div>

      <Button type="submit" variant="coral" size="lg" loading={pending}>
        {pending ? "Salvando…" : "Salvar valores"}
      </Button>
    </form>
  );
}
