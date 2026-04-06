"use client"

import { useState } from "react"
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts"

export interface RevenueDataPoint {
  month: string
  mrr: number
  members: number
}

interface RevenueChartProps {
  data: RevenueDataPoint[]
  currency: string
}

function formatMRR(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`
  return `$${value}`
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-lg text-sm">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1.5">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-500 dark:text-slate-400">
            {entry.name === "MRR"
              ? `MRR: $${(entry.value ?? 0).toLocaleString("es-AR")}`
              : `Socios: ${entry.value}`}
          </span>
        </div>
      ))}
    </div>
  )
}

export function RevenueChart({ data, currency }: RevenueChartProps) {
  const [period, setPeriod] = useState<6 | 12>(12)
  const visibleData = data.slice(-period)

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Ingresos y socios</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">MRR en {currency}</p>
        </div>
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          {([6, 12] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                period === p
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              {p}m
            </button>
          ))}
        </div>
      </div>

      {visibleData.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">
          Sin datos de ingresos
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={visibleData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              tickFormatter={formatMRR}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
              iconType="circle"
              iconSize={8}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="mrr"
              name="MRR"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#mrrGradient)"
              dot={false}
              activeDot={{ r: 4, fill: "#6366f1" }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="members"
              name="Socios"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#10b981" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
