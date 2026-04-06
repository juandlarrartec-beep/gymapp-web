"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
  type TooltipProps,
} from "recharts"

export interface ClassOccupancyDataPoint {
  name: string
  occupancyPct: number
  booked: number
  capacity: number
}

interface ClassOccupancyChartProps {
  data: ClassOccupancyDataPoint[]
}

function getBarColor(pct: number): string {
  if (pct >= 70) return "#10b981"
  if (pct >= 40) return "#f59e0b"
  return "#f43f5e"
}

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null

  const item = payload[0]?.payload as ClassOccupancyDataPoint | undefined
  if (!item) return null

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-lg text-sm">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{item.name}</p>
      <p className="text-slate-500 dark:text-slate-400">
        {item.booked} / {item.capacity} reservas
      </p>
      <p
        className="font-medium mt-0.5"
        style={{ color: getBarColor(item.occupancyPct) }}
      >
        {item.occupancyPct.toFixed(0)}% ocupación
      </p>
    </div>
  )
}

export function ClassOccupancyChart({ data }: ClassOccupancyChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Ocupación por clase</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Reservas activas</p>
        </div>
        <div className="h-[280px] flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
          <span className="text-3xl">📅</span>
          <span>No hay clases programadas</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Ocupación por clase</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Reservas activas</p>
      </div>

      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 44)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 48, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            width={90}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="occupancyPct" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.occupancyPct)} />
            ))}
            <LabelList
              dataKey="occupancyPct"
              position="right"
              formatter={(value: number) => `${value.toFixed(0)}%`}
              style={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Leyenda */}
      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          Alta ≥70%
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          Media ≥40%
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          Baja &lt;40%
        </div>
      </div>
    </div>
  )
}
