"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid,
} from "recharts";

type DayPoint = { date: string; count: number };
type WeekPoint = { week: string; count: number };

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-line bg-white p-4 shadow-sm">
      <p className="mb-3 text-xs font-medium text-muted">{title}</p>
      {children}
    </div>
  );
}

/**
 * Gráfico de barras "Novos perfis · 30 dias" usado no painel admin de moderação.
 *
 * Props:
 * - `data` (DayPoint[]): pontos `{ date, count }` agrupados por dia.
 *
 * Consumidores conhecidos:
 * - src/app/admin/moderacao/page.tsx
 */
export function ProfilesChart({ data }: { data: DayPoint[] }) {
  return (
    <ChartCard title="Novos perfis · 30 dias">
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} barSize={6}>
          <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval={4} />
          <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={20} />
          <Tooltip
            contentStyle={{ fontSize: 11, padding: "4px 8px", border: "1px solid #e5e5e3" }}
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
          />
          <Bar dataKey="count" name="Perfis" fill="#1a1a1a" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/**
 * Gráfico de barras "Mídias postadas · 30 dias" usado no painel admin de moderação.
 *
 * Props:
 * - `data` (DayPoint[]): pontos `{ date, count }` agrupados por dia.
 *
 * Consumidores conhecidos:
 * - src/app/admin/moderacao/page.tsx
 */
export function MediaChart({ data }: { data: DayPoint[] }) {
  return (
    <ChartCard title="Mídias postadas · 30 dias">
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} barSize={6}>
          <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval={4} />
          <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={20} />
          <Tooltip
            contentStyle={{ fontSize: 11, padding: "4px 8px", border: "1px solid #e5e5e3" }}
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
          />
          <Bar dataKey="count" name="Mídias" fill="#e05c5c" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/**
 * Gráfico de área "Assinaturas ativas · 8 semanas" usado no painel admin de moderação.
 *
 * Props:
 * - `data` (WeekPoint[]): pontos `{ week, count }` agrupados por semana.
 *
 * Consumidores conhecidos:
 * - src/app/admin/moderacao/page.tsx
 */
export function SubscriptionsChart({ data }: { data: WeekPoint[] }) {
  return (
    <ChartCard title="Assinaturas ativas · 8 semanas">
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e3" />
          <XAxis dataKey="week" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={20} />
          <Tooltip
            contentStyle={{ fontSize: 11, padding: "4px 8px", border: "1px solid #e5e5e3" }}
          />
          <Area
            type="monotone"
            dataKey="count"
            name="Assinantes"
            stroke="#1a1a1a"
            fill="rgba(26,26,26,0.06)"
            strokeWidth={1.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/**
 * Gráfico de barras "Reels postados · 30 dias" usado no painel admin de moderação.
 *
 * Props:
 * - `data` (DayPoint[]): pontos `{ date, count }` agrupados por dia.
 *
 * Consumidores conhecidos:
 * - src/app/admin/moderacao/page.tsx
 */
export function ReelsChart({ data }: { data: DayPoint[] }) {
  return (
    <ChartCard title="Reels postados · 30 dias">
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} barSize={6}>
          <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval={4} />
          <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={20} />
          <Tooltip
            contentStyle={{ fontSize: 11, padding: "4px 8px", border: "1px solid #e5e5e3" }}
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
          />
          <Bar dataKey="count" name="Reels" fill="#7c6af7" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
