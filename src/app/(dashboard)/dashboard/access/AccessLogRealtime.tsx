"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"

interface AccessLogEntry {
  id: string
  success: boolean
  method: string
  failReason: string | null
  timestamp: Date | string
  member: {
    firstName: string
    lastName: string
  }
}

interface AccessLogRealtimeProps {
  gymId: string
  initialLogs: AccessLogEntry[]
}

export default function AccessLogRealtime({ gymId, initialLogs }: AccessLogRealtimeProps) {
  const [logs, setLogs] = useState<AccessLogEntry[]>(initialLogs)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  useEffect(() => {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    async function poll() {
      try {
        const res = await fetch(
          `/api/gyms/${gymId}/access-logs?from=${startOfDay.toISOString()}&pageSize=100`
        )
        if (res.ok) {
          const json = (await res.json()) as { data: { logs: AccessLogEntry[] } | null }
          if (json.data?.logs) {
            setLogs(json.data.logs)
            setLastUpdated(new Date())
          }
        }
      } catch {
        // Silencioso — el usuario ve los datos anteriores
      }
    }

    // Poll cada 5 segundos
    const interval = setInterval(() => { void poll() }, 5000)
    return () => clearInterval(interval)
  }, [gymId])

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400 text-right">
        Actualizado: {format(lastUpdated, "HH:mm:ss")} · Actualizando cada 5s
      </p>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Socio</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Método</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Hora</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-slate-400">
                  Sin accesos registrados hoy
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className={`hover:bg-slate-50 ${!log.success ? "bg-red-50/30" : ""}`}>
                  <td className="px-4 py-3 font-medium">
                    {log.member.firstName} {log.member.lastName}
                  </td>
                  <td className="px-4 py-3 text-slate-500 uppercase text-xs">{log.method}</td>
                  <td className="px-4 py-3">
                    {log.success ? (
                      <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                        OK
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-500 text-xs font-medium">
                        <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                        {log.failReason ?? "Denegado"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {format(new Date(log.timestamp), "HH:mm:ss")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
