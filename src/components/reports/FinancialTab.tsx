"use client"

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import type { FinancialReport } from "@/lib/reports/financial"

interface MonthlyFinancial {
  month: string
  succeeded: number
  failed: number
  count: number
}

interface FinancialTabProps {
  financial: FinancialReport
  trend: MonthlyFinancial[]
}

function KPI({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  )
}

function formatARS(value: number) {
  return `$${value.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`
}

export function FinancialTab({ financial, trend }: FinancialTabProps) {
  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPI label="MRR (12 meses)" value={formatARS(financial.mrr)} />
        <KPI label="ARPU" value={formatARS(financial.arpu)} />
        <KPI label="Retención de ingresos" value={`${financial.revenueRetentionRate.toFixed(1)}%`} />
        <KPI label="Deuda total" value={formatARS(financial.totalDebt)} />
      </div>

      {/* Gráfico de línea: MRR mensual */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <h2 className="font-semibold text-sm mb-4">MRR mensual — últimos 12 meses</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(value: number) => [formatARS(value), "Ingresos"]}
              labelStyle={{ fontWeight: 600 }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="succeeded"
              name="Cobrado"
              stroke="#6366f1"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de barras: éxito vs fallidos */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <h2 className="font-semibold text-sm mb-4">Pagos exitosos vs fallidos por mes</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip labelStyle={{ fontWeight: 600 }} />
            <Legend />
            <Bar dataKey="count" name="Exitosos" fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="failed" name="Fallidos" fill="#f87171" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla resumen */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-sm">Resumen por mes</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="px-6 py-3 text-left font-medium">Mes</th>
              <th className="px-6 py-3 text-right font-medium">Cobrado</th>
              <th className="px-6 py-3 text-right font-medium">Pagos exitosos</th>
              <th className="px-6 py-3 text-right font-medium">Fallidos</th>
              <th className="px-6 py-3 text-right font-medium">% Éxito</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {trend.map((row) => {
              const total = row.count + row.failed
              const pct = total > 0 ? ((row.count / total) * 100).toFixed(1) : "—"
              return (
                <tr key={row.month} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 font-medium capitalize">{row.month}</td>
                  <td className="px-6 py-3 text-right">{formatARS(row.succeeded)}</td>
                  <td className="px-6 py-3 text-right text-indigo-600">{row.count}</td>
                  <td className="px-6 py-3 text-right text-red-500">{row.failed}</td>
                  <td className="px-6 py-3 text-right text-slate-600">{pct}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
