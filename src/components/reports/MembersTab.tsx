"use client"

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import type { MembersReport } from "@/lib/reports/members"

interface MonthlyMembers {
  month: string
  active: number
  new: number
  cancelled: number
}

interface MembersTabProps {
  members: MembersReport
  trend: MonthlyMembers[]
}

function KPI({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  )
}

export function MembersTab({ members, trend }: MembersTabProps) {
  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPI label="Activos" value={members.activeCount} />
        <KPI label="Nuevos (mes)" value={members.newCount} />
        <KPI label="Bajas (mes)" value={members.cancelledCount} />
        <KPI label="Retención" value={`${members.retentionRate.toFixed(1)}%`} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <KPI label="Congelados" value={members.frozenCount} />
        <KPI label="En riesgo churn" value={members.atRiskCount} />
      </div>

      {/* Área: evolución socios activos */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <h2 className="font-semibold text-sm mb-4">Evolución de socios activos — últimos 12 meses</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={trend}>
            <defs>
              <linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip labelStyle={{ fontWeight: 600 }} />
            <Legend />
            <Area
              type="monotone"
              dataKey="active"
              name="Activos"
              stroke="#6366f1"
              strokeWidth={2.5}
              fill="url(#activeGradient)"
              dot={{ r: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Barras: altas vs bajas */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <h2 className="font-semibold text-sm mb-4">Altas vs bajas por mes</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip labelStyle={{ fontWeight: 600 }} />
            <Legend />
            <Bar dataKey="new" name="Altas" fill="#34d399" radius={[4, 4, 0, 0]} />
            <Bar dataKey="cancelled" name="Bajas" fill="#f87171" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla: distribución por plan */}
      {members.byPlan.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold text-sm">Distribución por plan</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 text-left font-medium">Plan</th>
                <th className="px-6 py-3 text-right font-medium">Socios</th>
                <th className="px-6 py-3 text-right font-medium">% del total</th>
                <th className="px-6 py-3 text-right font-medium">Revenue estimado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.byPlan.map((row) => {
                const pct =
                  members.activeCount > 0
                    ? ((row.count / members.activeCount) * 100).toFixed(1)
                    : "0"
                return (
                  <tr key={row.planName} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-medium">{row.planName}</td>
                    <td className="px-6 py-3 text-right">{row.count}</td>
                    <td className="px-6 py-3 text-right text-slate-500">{pct}%</td>
                    <td className="px-6 py-3 text-right text-indigo-600">
                      ${row.revenue.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
