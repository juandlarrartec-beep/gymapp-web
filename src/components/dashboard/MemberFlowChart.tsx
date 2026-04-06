"use client"

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts"

export interface MemberFlowDataPoint {
  month: string
  altas: number
  bajas: number
  neto: number
}

interface MemberFlowChartProps {
  data: MemberFlowDataPoint[]
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
            {entry.name}: {entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function MemberFlowChart({ data }: MemberFlowChartProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Flujo de socios</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Altas y bajas últimos 6 meses</p>
      </div>

      {data.length === 0 ? (
        <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm">
          Sin datos de flujo
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
              iconType="circle"
              iconSize={8}
            />
            <Bar
              dataKey="altas"
              name="Altas"
              fill="#10b981"
              radius={[3, 3, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              dataKey="bajas"
              name="Bajas"
              fill="#f43f5e"
              radius={[3, 3, 0, 0]}
              maxBarSize={28}
            />
            <Line
              type="monotone"
              dataKey="neto"
              name="Neto"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 3, fill: "#6366f1" }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
