"use client";

import { useState, useTransition } from "react";
import { saveAvailabilityWindows } from "@/app/painel/_actions/provider-settings";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const TIME_OPTIONS = [
  "00:00", "01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00",
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00",
  "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00", "23:59",
];

const TIME_OPTS = TIME_OPTIONS.map((t) => ({ value: t, label: t }));

type Rule = { weekday: number; status: string; startTime: string; endTime: string };

export function AvailabilityForm({ initialRules }: { initialRules: Rule[] }) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const byWd = new Map(initialRules.map((r) => [r.weekday, r]));

  const [openDays, setOpenDays] = useState<boolean[]>(() =>
    [0, 1, 2, 3, 4, 5, 6].map((wd) => {
      const r = byWd.get(wd);
      return r ? r.status !== "CLOSED" : false;
    })
  );

  const [starts, setStarts] = useState<string[]>(() =>
    [0, 1, 2, 3, 4, 5, 6].map((wd) => {
      const r = byWd.get(wd);
      return r && r.status !== "CLOSED" ? r.startTime : "09:00";
    })
  );

  const [ends, setEnds] = useState<string[]>(() =>
    [0, 1, 2, 3, 4, 5, 6].map((wd) => {
      const r = byWd.get(wd);
      return r && r.status !== "CLOSED" ? r.endTime : "22:00";
    })
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData();
    for (let wd = 0; wd < 7; wd++) {
      if (openDays[wd]) {
        fd.set(`wd_${wd}_open`, "on");
        fd.set(`wd_${wd}_start`, starts[wd]);
        fd.set(`wd_${wd}_end`, ends[wd]);
      }
    }
    startTransition(async () => {
      try {
        await saveAvailabilityWindows(fd);
        toast("Disponibilidade salva.");
      } catch (err: unknown) {
        toast(err instanceof Error ? err.message : "Erro ao salvar.", "error");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card variant="solid" padding="none" className="overflow-hidden divide-y divide-black/[0.06]">
        {[0, 1, 2, 3, 4, 5, 6].map((wd) => (
          <div key={wd} className="flex items-center gap-4 px-5 py-[14px]">
            <span className="w-[76px] text-md font-semibold">{DAYS[wd]}</span>

            <Switch
              checked={openDays[wd]}
              onChange={(c) =>
                setOpenDays((prev) => prev.map((p, i) => (i === wd ? c : p)))
              }
              size="md"
            />

            {openDays[wd] ? (
              <div className="ml-auto flex items-center gap-2">
                <div className="w-24">
                  <Select
                    name={`wd_${wd}_start`}
                    value={starts[wd]}
                    onChange={(e) =>
                      setStarts((prev) => prev.map((v, i) => (i === wd ? e.target.value : v)))
                    }
                    options={TIME_OPTS}
                  />
                </div>
                <span className="text-base text-muted">–</span>
                <div className="w-24">
                  <Select
                    name={`wd_${wd}_end`}
                    value={ends[wd]}
                    onChange={(e) =>
                      setEnds((prev) => prev.map((v, i) => (i === wd ? e.target.value : v)))
                    }
                    options={TIME_OPTS}
                  />
                </div>
              </div>
            ) : (
              <span className="ml-auto text-base text-muted">Fechado</span>
            )}
          </div>
        ))}
      </Card>

      <Button type="submit" variant="coral" size="lg" disabled={pending}>
        {pending ? "Salvando…" : "Salvar disponibilidade"}
      </Button>
    </form>
  );
}
