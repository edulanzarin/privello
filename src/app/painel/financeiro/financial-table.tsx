"use client";

import React, { useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { formatBrl } from "@/lib/money";
import { updateFinancialRecord, deleteFinancialRecord } from "@/app/painel/_actions/provider-settings";
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

const DURATION_OPTIONS = ["30 minutos", "1 hora", "1h30", "2 horas", "3 horas", "4 horas", "Pernoite", "Diária"];
const LOCATION_OPTIONS = ["Local próprio", "A domicílio", "Motel / hotel"];
const PAYMENT_OPTIONS  = ["Pix", "Dinheiro", "Cartão", "Pix · Dinheiro"];

function originBadge(origin: FinancialOrigin) {
  switch (origin) {
    case "SITE":     return "bg-ink text-white";
    case "WHATSAPP": return "bg-rose/15 text-rose";
    default:         return "bg-black/10 text-ink-dim";
  }
}

const inp = "w-full rounded-lg border border-line bg-white px-3 py-[7px] text-md text-ink shadow-[inset_0_0.5px_2px_rgba(0,0,0,0.04)] outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background hover:border-black/20 focus:border-rose focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)] transition-all";
const sel = `${inp} cursor-pointer`;
const lbl = "block text-base font-medium text-ink mb-1.5";

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
          <tr className="border-b border-line text-2xs font-semibold text-ink-dim">
            <th className="px-4 py-3">Data</th>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Duração</th>
            <th className="px-4 py-3">Local</th>
            <th className="px-4 py-3">Pagamento</th>
            <th className="px-4 py-3">Origem</th>
            <th className="px-4 py-3 text-right">Valor</th>
            <th className="px-4 py-3 w-16" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <React.Fragment key={r.id}>
              <tr className={`border-b border-line group transition ${deletingId === r.id ? "opacity-40" : ""}`}>
                <td className="px-4 py-3 whitespace-nowrap text-ink-dim">
                  {r.occurredAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}{" "}
                  {r.occurredAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-4 py-3 font-medium">{r.clientLabel}</td>
                <td className="px-4 py-3 text-ink-dim">{r.durationLabel}</td>
                <td className="px-4 py-3 text-ink-dim">{r.locationLabel}</td>
                <td className="px-4 py-3 text-ink-dim">{r.paymentLabel}</td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-2xs font-bold uppercase ${originBadge(r.origin)}`}>
                    {r.origin}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold">
                  {r.isNoShow ? (
                    <span className="text-ink-dim line-through">{formatBrl(r.amountBrl)}</span>
                  ) : (
                    formatBrl(r.amountBrl)
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      title="Editar"
                      onClick={() => setEditingId(editingId === r.id ? null : r.id)}
                      className="text-ink-dim hover:text-ink"
                    >
                      <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      title="Excluir"
                      onClick={() => handleDelete(r.id)}
                      disabled={deletingId === r.id}
                      className="text-ink-dim hover:text-rose disabled:opacity-30"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                </td>
              </tr>

              {editingId === r.id && (
                <tr className="border-b border-rose/20 bg-rose/5">
                  <td colSpan={8} className="px-4 py-4">
                    <form
                      action={async (fd: FormData) => {
                        await updateFinancialRecord(fd);
                        setEditingId(null);
                      }}
                      className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6"
                    >
                      <input type="hidden" name="recordId" value={r.id} />

                      <div className="col-span-2">
                        <label className={lbl}>Cliente</label>
                        <input name="clientLabel" defaultValue={r.clientLabel} required className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Valor (R$)</label>
                        <input name="amountBrl" type="number" defaultValue={r.amountBrl} required min={1} className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Duração</label>
                        <select name="durationLabel" defaultValue={r.durationLabel} className={sel}>
                          {DURATION_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={lbl}>Local</label>
                        <select name="locationLabel" defaultValue={r.locationLabel} className={sel}>
                          {LOCATION_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={lbl}>Pagamento</label>
                        <select name="paymentLabel" defaultValue={r.paymentLabel} className={sel}>
                          {PAYMENT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                        </select>
                      </div>

                      <div className="col-span-2 sm:col-span-4 lg:col-span-6 flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" name="isNoShow" defaultChecked={r.isNoShow} className="h-4 w-4 accent-coral" />
                          No-show
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="flex items-center gap-1.5 rounded-lg border border-line px-4 py-2 text-xs font-semibold text-ink-dim hover:text-ink transition"
                          >
                            <X className="h-3.5 w-3.5" /> Cancelar
                          </button>
                          <button
                            type="submit"
                            className="flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-white hover:bg-ink/80 transition"
                          >
                            <Check className="h-3.5 w-3.5" /> Salvar
                          </button>
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
