"use client";

import React, { useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { formatBrl } from "@/lib/money";
import {
  deleteFinancialRecord,
  updateFinancialRecord,
} from "@/app/painel/_actions/provider-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { FinancialOrigin } from "@prisma/client";

export type FinancialRow = {
  id: string;
  occurredAt: Date;
  clientLabel: string;
  durationLabel: string;
  locationLabel: string;
  paymentLabel: string;
  origin: FinancialOrigin;
  amountBrl: number;
  isNoShow: boolean;
  notes: string | null;
};

const DURATION_OPTIONS = [
  "30 minutos",
  "1 hora",
  "1h30",
  "2 horas",
  "3 horas",
  "4 horas",
  "Pernoite",
  "Diária",
];
const LOCATION_OPTIONS = ["Local próprio", "A domicílio", "Motel / hotel"];
const PAYMENT_OPTIONS = ["Pix", "Dinheiro", "Cartão", "Pix · Dinheiro"];

const DURATION_OPTS = DURATION_OPTIONS.map((o) => ({ value: o, label: o }));
const LOCATION_OPTS = LOCATION_OPTIONS.map((o) => ({ value: o, label: o }));
const PAYMENT_OPTS = PAYMENT_OPTIONS.map((o) => ({ value: o, label: o }));

function originBadge(origin: FinancialOrigin) {
  switch (origin) {
    case "SITE":
      return "bg-ink text-white";
    case "WHATSAPP":
      return "bg-rose-soft text-rose";
    default:
      return "bg-line/40 text-ink-dim";
  }
}

/**
 * FinancialTable — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/app/painel/financeiro/financial-table.tsx
 * Steering: §3 (cor), §6 (Input/Select primitives), §3.4 (rose-soft surface).
 *
 * Tabela editável de FinancialRecord. Linhas hover-revealing actions
 * (Pencil + Trash). Modo edição expande linha em form grid usando primitivos
 * `<Input>` / `<Select>` v2. Cancelar → secondary, Salvar → primary.
 */
export function FinancialTable({ rows }: { rows: FinancialRow[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const fd = new FormData();
    fd.set("recordId", id);
    await deleteFinancialRecord(fd);
    setDeletingId(null);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-2xs font-semibold uppercase tracking-wider text-ink-dim">
            <th className="px-4 py-3">Data</th>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Duração</th>
            <th className="px-4 py-3">Local</th>
            <th className="px-4 py-3">Pagamento</th>
            <th className="px-4 py-3">Origem</th>
            <th className="px-4 py-3 text-right">Valor</th>
            <th className="w-16 px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <React.Fragment key={r.id}>
              <tr
                className={`group border-b border-line transition-opacity ${deletingId === r.id ? "opacity-40" : ""
                  }`}
              >
                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-ink-dim">
                  {r.occurredAt.toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                  })}{" "}
                  {r.occurredAt.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3 font-medium text-ink">
                  {r.clientLabel}
                </td>
                <td className="px-4 py-3 text-ink-dim">
                  {r.durationLabel}
                </td>
                <td className="px-4 py-3 text-ink-dim">
                  {r.locationLabel}
                </td>
                <td className="px-4 py-3 text-ink-dim">
                  {r.paymentLabel}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-bold uppercase tracking-wider ${originBadge(r.origin)}`}
                  >
                    {r.origin}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink">
                  {r.isNoShow ? (
                    <span className="text-ink-dim line-through">
                      {formatBrl(r.amountBrl)}
                    </span>
                  ) : (
                    formatBrl(r.amountBrl)
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      title="Editar"
                      onClick={() =>
                        setEditingId(editingId === r.id ? null : r.id)
                      }
                      className="rounded-md p-1 text-ink-dim transition-colors hover:bg-line/40 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40"
                    >
                      <Pencil
                        className="h-3.5 w-3.5"
                        strokeWidth={1.75}
                      />
                    </button>
                    <button
                      type="button"
                      title="Excluir"
                      onClick={() => handleDelete(r.id)}
                      disabled={deletingId === r.id}
                      className="rounded-md p-1 text-ink-dim transition-colors hover:bg-danger-soft hover:text-danger disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40"
                    >
                      <Trash2
                        className="h-3.5 w-3.5"
                        strokeWidth={1.75}
                      />
                    </button>
                  </div>
                </td>
              </tr>

              {editingId === r.id && (
                <tr className="border-b border-rose/20 bg-rose-soft/60">
                  <td colSpan={8} className="px-4 py-4">
                    <form
                      action={async (fd: FormData) => {
                        await updateFinancialRecord(fd);
                        setEditingId(null);
                      }}
                      className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6"
                    >
                      <input
                        type="hidden"
                        name="recordId"
                        value={r.id}
                      />

                      <div className="col-span-2">
                        <Input
                          name="clientLabel"
                          label="Cliente"
                          defaultValue={r.clientLabel}
                          required
                        />
                      </div>
                      <div>
                        <Input
                          name="amountBrl"
                          label="Valor (R$)"
                          type="number"
                          defaultValue={r.amountBrl}
                          required
                          min={1}
                        />
                      </div>
                      <div>
                        <Select
                          name="durationLabel"
                          label="Duração"
                          defaultValue={r.durationLabel}
                          options={DURATION_OPTS}
                        />
                      </div>
                      <div>
                        <Select
                          name="locationLabel"
                          label="Local"
                          defaultValue={r.locationLabel}
                          options={LOCATION_OPTS}
                        />
                      </div>
                      <div>
                        <Select
                          name="paymentLabel"
                          label="Pagamento"
                          defaultValue={r.paymentLabel}
                          options={PAYMENT_OPTS}
                        />
                      </div>

                      <div className="col-span-2 flex items-center justify-between sm:col-span-4 lg:col-span-6">
                        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink">
                          <input
                            type="checkbox"
                            name="isNoShow"
                            defaultChecked={r.isNoShow}
                            className="h-4 w-4 rounded accent-rose"
                          />
                          No-show
                        </label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingId(null)}
                          >
                            <X
                              className="h-3.5 w-3.5"
                              strokeWidth={1.75}
                            />
                            Cancelar
                          </Button>
                          <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                          >
                            <Check
                              className="h-3.5 w-3.5"
                              strokeWidth={1.75}
                            />
                            Salvar
                          </Button>
                        </div>
                      </div>
                    </form>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
