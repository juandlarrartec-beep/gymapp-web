"use client"

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import type { AttendanceReport } from "@/lib/reports/attendance"

interface AttendanceTabProps {
  attendance: AttendanceReport
}

function KPI({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  )
}

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Lun",
  TUESDAY: "Mar",
  WEDNESDAY: "Mié",
  THURSDAY: "Jue",
  FRIDAY: "Vie",
  SATURDAY: "Sáb",
  SUNDAY: "Dom",
}

const DAY_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]

export function AttendanceTab({ attendance }: AttendanceTabProps) {
  // Construir datos por día de la semana (promedio)
  const byDayData = DAY_ORDER.map((day) => {
    const hours = attendance.heatmap[day] ?? {}
    const total = Object.values(hours).reduce((sum, v) => sum + v, 0)
    return { day: DAY_LABELS[day] ?? day, total }
  })

  // Construir datos por hora (suma de todos los días)
  const hourTotals: Record<number, number> = {}
  for (let h = 0; h < 24; h++) hourTotals[h] = 0
  for (const hours of Object.values(attendance.heatmap)) {
    for (const [h, count] of Object.entries(hours)) {
      hourTotals[parseInt(h)] = (hourTotals[parseInt(h)] ?? 0) + count
    }
  }
  const byHourData = Object.entries(hourTotals)
    .map(([h, count]) => ({ hora: `${h}h`, count }))
    .filter((d) => d.count > 0)

  const peakDayLabel = DAY_LABELS[attendance.peakDay] ?? attendance.peakDay

  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPI label="Total visitas (30d)" value={attendance.totalVisits} />
        <KPI label="Visitantes únicos" value={attendance.uniqueVisitors} />
        <KPI label="Ausentes 7 días" value={attendance.absentMembers7d} />
        <KPI label="Ausentes 30 días" value={attendance.absentMembers30d} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <KPI label="Hora pico" value={`${attendance.peakHour}:00`} />
        <KPI label="Día más concurrido" value={peakDayLabel} />
      </div>

      {/* Barras: accesos por día de la semana */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <h2 className="font-semibold text-sm mb-4">Accesos por día de la semana</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={byDayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value: number) => [value, "Accesos"]}
              labelStyle={{ fontWeight: 600 }}
            />
            <Bar dataKey="total" name="Accesos" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Línea: accesos por hora del día */}
      {byHourData.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h2 className="font-semibold text-sm mb-4">Distribución por hora del día</h2>
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

      {/* Ausentes — tabla de resumen */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <h2 className="font-semibold text-sm mb-4">Socios ausentes</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-amber-50 rounded-xl border border-amber-100">
            <p className="text-2xl font-bold text-amber-600">{attendance.absentMembers7d}</p>
            <p className="text-xs text-amber-500 mt-1">Sin visitar en 7 días</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-100">
            <p className="text-2xl font-bold text-orange-600">{attendance.absentMembers14d}</p>
            <p className="text-xs text-orange-500 mt-1">Sin visitar en 14 días</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-xl border border-red-100">
            <p className="text-2xl font-bold text-red-600">{attendance.absentMembers30d}</p>
            <p className="text-xs text-red-500 mt-1">Sin visitar en 30 días</p>
          </div>
        </div>
      </div>
    </>
  )
}
