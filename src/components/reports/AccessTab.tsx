"use client"

import { useState } from "react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import type { AccessReport } from "@/lib/reports/access"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import clsx from "clsx"
import { CheckCircle, XCircle, Search } from "lucide-react"

interface AccessLog {
  id: string
  memberName: string
  method: string
  success: boolean
  failReason: string | null
  timestamp: string
}

interface AccessTabProps {
  access: AccessReport
  recentLogs: AccessLog[]
}

function KPI({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  )
}

const METHOD_LABELS: Record<string, string> = {
  QR: "QR",
  NFC: "NFC",
  MANUAL: "Manual",
}

export function AccessTab({ access, recentLogs }: AccessTabProps) {
  const [search, setSearch] = useState("")
  const [filterSuccess, setFilterSuccess] = useState<"all" | "ok" | "fail">("all")

  const filteredLogs = recentLogs.filter((log) => {
    const matchName = log.memberName.toLowerCase().includes(search.toLowerCase())
    const matchStatus =
      filterSuccess === "all"
        ? true
        : filterSuccess === "ok"
        ? log.success
        : !log.success
    return matchName && matchStatus
  })

  // Por hora para el gráfico
  const byHourData = access.byHour.filter((d) => d.count > 0).map((d) => ({
    hora: `${d.hour}h`,
    count: d.count,
  }))

  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPI label="Total accesos (30d)" value={access.totalAccesses} />
        <KPI label="Tasa de éxito" value={`${access.successRate.toFixed(1)}%`} />
        <KPI label="Visitantes únicos" value={access.uniqueMembers} />
        <KPI label="Visitas por socio" value={access.avgVisitsPerMember.toFixed(1)} />
      </div>

      {/* Métodos */}
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(access.byMethod).map(([method, count]) => (
          <div key={method} className="bg-white rounded-xl border shadow-sm p-4 text-center">
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-xs text-slate-400 mt-1">{METHOD_LABELS[method] ?? method}</p>
          </div>
        ))}
      </div>

      {/* Gráfico accesos por hora */}
      {byHourData.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h2 className="font-semibold text-sm mb-4">Accesos por hora del día</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={byHourData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="hora" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number) => [value, "Accesos"]}
                labelStyle={{ fontWeight: 600 }}
              />
              <Line
                type="monotone"
                dataKey="count"
                name="Accesos"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Fallos por razón */}
      {access.failedByReason.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h2 className="font-semibold text-sm mb-4">Accesos denegados por razón</h2>
          <div className="space-y-2">
            {access.failedByReason.map((r) => (
              <div
                key={r.reason}
                className="flex items-center justify-between py-2 px-3 bg-red-50 rounded-lg"
              >
                <span className="text-xs font-mono text-slate-600">{r.reason}</span>
                <span className="font-semibold text-red-600 text-sm">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla últimos 100 accesos */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between gap-4">
          <h2 className="font-semibold text-sm shrink-0">Últimos accesos</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar socio..."
                className="pl-8 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44"
              />
            </div>
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
              {(["all", "ok", "fail"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterSuccess(f)}
                  className={clsx(
                    "px-2.5 py-1 rounded text-xs font-medium transition-colors",
                    filterSuccess === f
                      ? "bg-white shadow-sm text-slate-800"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {f === "all" ? "Todos" : f === "ok" ? "Exitosos" : "Fallidos"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 text-left font-medium">Socio</th>
                <th className="px-6 py-3 text-left font-medium">Método</th>
                <th className="px-6 py-3 text-left font-medium">Estado</th>
                <th className="px-6 py-3 text-left font-medium">Razón de fallo</th>
                <th className="px-6 py-3 text-left font-medium">Fecha y hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.slice(0, 100).map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 font-medium">{log.memberName}</td>
                  <td className="px-6 py-3 text-slate-500">
                    {METHOD_LABELS[log.method] ?? log.method}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={clsx(
                        "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium",
                        log.success
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      )}
                    >
                      {log.success ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {log.success ? "Exitoso" : "Denegado"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-xs text-slate-400 font-mono">
                    {log.failReason ?? "—"}
                  </td>
                  <td className="px-6 py-3 text-slate-500 text-xs">
                    {format(new Date(log.timestamp), "d MMM yyyy · HH:mm", { locale: es })}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Sin resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
