"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid,
} from "recharts";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  CHART_AREA_OPACITY,
  CHART_GRID_STROKE,
  CHART_PALETTE,
  CHART_TICK_FILL,
  CHART_TOOLTIP_STYLE,
} from "@/lib/chart-tokens";

type DayPoint = { date: string; count: number };
type WeekPoint = { week: string; count: number };

/**
 * Recipe interna `ChartCard`
 *
 * Wrapper canônico para os charts do painel admin. Consome `<Card variant="solid"* padding="md">` (rounded-2xl + hairline + sombra suave) e renderiza um título
 * em `text-xs font-medium text-ink-dim` acima do conteúdo.
 *
 * Quando `isEmpty` é `true`, renderiza `<EmptyState>` no lugar do `children` —
 * fallback determinístico para datasets vazios (ex.: nenhuma criação no período).
 *
 * Cross-refs:
 * - src/components/ui/card.tsx (variant="solid"padding="md")
 * - src/components/ui/empty-state.tsx
 * - .kiro/specs/redesign-macos-system/design.md (seção 9 — ChartCard recipe)
 */
function ChartCard({
  title,
  isEmpty,
  emptyMessage = "Sem dados no período.",
  children,
}: {
  title: string;
  isEmpty?: boolean;
  emptyMessage?: string;
  children: React.ReactNode;
}) {
  return (
    <Card variant="solid"padding="md">
      <p className="mb-3 text-xs font-medium text-ink-dim">{title}</p>
      {isEmpty ? (
        <EmptyState title={emptyMessage} className="px-3 py-6"/>
      ) : (
        children
      )}
    </Card>
  );
}

// Cursor de hover sobre as barras: overlay translúcido neutro (não é cor de
// série, portanto não consome um token de paleta de chart). Mantido como rgba
// para não introduzir um token novo só para isso.
const BAR_HOVER_CURSOR = { fill: "rgba(0, 0, 0, 0.04)"} as const;

const AXIS_TICK = { fontSize: 9, fill: CHART_TICK_FILL } as const;

/**
 * Gráfico de barras "Novos perfis · 30 dias"usado no painel admin de moderação.
 *
 * Props:
 * - `data` (DayPoint[]): pontos `{ date, count }` agrupados por dia.
 *
 * Consumidores conhecidos:
 * - src/app/admin/moderacao/page.tsx
 */
export function ProfilesChart({ data }: { data: DayPoint[] }) {
  return (
    <ChartCard title="Novos perfis · 30 dias"isEmpty={data.length === 0}>
      <ResponsiveContainer width="100%"height={140}>
        <BarChart data={data} barSize={6}>
          <XAxis dataKey="date"tick={AXIS_TICK} tickLine={false} axisLine={false} interval={4} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={20} />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={BAR_HOVER_CURSOR} />
          <Bar dataKey="count"name="Perfis"fill={CHART_PALETTE.primary} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/**
 * Gráfico de barras "Mídias postadas · 30 dias"usado no painel admin de moderação.
 *
 * Props:
 * - `data` (DayPoint[]): pontos `{ date, count }` agrupados por dia.
 *
 * Consumidores conhecidos:
 * - src/app/admin/moderacao/page.tsx
 */
export function MediaChart({ data }: { data: DayPoint[] }) {
  return (
    <ChartCard title="Mídias postadas · 30 dias"isEmpty={data.length === 0}>
      <ResponsiveContainer width="100%"height={140}>
        <BarChart data={data} barSize={6}>
          <XAxis dataKey="date"tick={AXIS_TICK} tickLine={false} axisLine={false} interval={4} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={20} />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={BAR_HOVER_CURSOR} />
          <Bar dataKey="count"name="Mídias"fill={CHART_PALETTE.coral} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/**
 * Gráfico de área "Assinaturas ativas · 8 semanas"usado no painel admin de moderação.
 *
 * Props:
 * - `data` (WeekPoint[]): pontos `{ week, count }` agrupados por semana.
 *
 * Consumidores conhecidos:
 * - src/app/admin/moderacao/page.tsx
 */
export function SubscriptionsChart({ data }: { data: WeekPoint[] }) {
  return (
    <ChartCard title="Assinaturas ativas · 8 semanas"isEmpty={data.length === 0}>
      <ResponsiveContainer width="100%"height={140}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3"stroke={CHART_GRID_STROKE} />
          <XAxis dataKey="week"tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={20} />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
          <Area
            type="monotone"dataKey="count"name="Assinantes"stroke={CHART_PALETTE.primary}
            fill={CHART_PALETTE.primary}
            fillOpacity={CHART_AREA_OPACITY}
            strokeWidth={1.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/**
 * Gráfico de barras "Reels postados · 30 dias"usado no painel admin de moderação.
 *
 * Props:
 * - `data` (DayPoint[]): pontos `{ date, count }` agrupados por dia.
 *
 * Consumidores conhecidos:
 * - src/app/admin/moderacao/page.tsx
 */
export function ReelsChart({ data }: { data: DayPoint[] }) {
  return (
    <ChartCard title="Reels postados · 30 dias"isEmpty={data.length === 0}>
      <ResponsiveContainer width="100%"height={140}>
        <BarChart data={data} barSize={6}>
          <XAxis dataKey="date"tick={AXIS_TICK} tickLine={false} axisLine={false} interval={4} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={20} />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={BAR_HOVER_CURSOR} />
          <Bar dataKey="count"name="Reels"fill={CHART_PALETTE.purple} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
