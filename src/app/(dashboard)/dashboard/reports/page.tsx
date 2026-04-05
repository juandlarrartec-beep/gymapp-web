"use client"

import { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"

type ReportModule = "financial" | "members" | "attendance" | "training" | "access"

const TABS: { id: ReportModule; label: string }[] = [
  { id: "financial", label: "Financiero" },
  { id: "members", label: "Socios" },
  { id: "attendance", label: "Asistencia" },
  { id: "training", label: "Rutinas" },
  { id: "access", label: "Acceso" },
]

const PIE_COLORS = ["#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe", "#e0e7ff"]

interface GymSeat {
  id: string
  name: string
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportModule>("financial")
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [gymId, setGymId] = useState<string | null>(null)
  const [seats, setSeats] = useState<GymSeat[]>([])
  const [selectedSeatId, setSelectedSeatId] = useState<string>("all")

  // Obtener gymId y sedes
  useEffect(() => {
    void fetch("/api/me/gym").then(async (r) => {
      if (r.ok) {
        const json = (await r.json()) as { data: { gymId: string; plan?: string } | null }
        if (json.data?.gymId) {
          setGymId(json.data.gymId)
          // Cargar sedes si es plan PRO
          void fetch(`/api/gyms/${json.data.gymId}/seats`).then(async (sr) => {
            if (sr.ok) {
              const sj = (await sr.json()) as { data: GymSeat[] | null }
              if (sj.data && sj.data.length > 1) setSeats(sj.data)
            }
          })
        }
      }
    })
  }, [])

  useEffect(() => {
    if (!gymId) return
    setLoading(true)
    setData(null)

    const seatParam = selectedSeatId !== "all" ? `?seatId=${selectedSeatId}` : ""
    void fetch(`/api/gyms/${gymId}/reports/${activeTab}${seatParam}`)
      .then((r) => r.json())
      .then((json: { data: Record<string, unknown> | null }) => {
        setData(json.data)
      })
      .finally(() => setLoading(false))
  }, [activeTab, gymId, selectedSeatId])

  function handleExport() {
    if (!gymId) return
    window.open(`/api/gyms/${gymId}/reports/${activeTab}/export`, "_blank")
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Reportes</h1>
        <div className="flex items-center gap-3">
          {/* Dropdown de sede — solo visible si hay más de 1 sede */}
          {seats.length > 0 && (
            <select
              value={selectedSeatId}
              onChange={(e) => setSelectedSeatId(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todas las sedes</option>
              {seats.map((seat) => (
                <option key={seat.id} value={seat.id}>
                  {seat.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={handleExport}
            disabled={!data || loading}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      )}

      {!loading && data && (
        <div className="space-y-6">
          {/* Módulo Financiero */}
          {activeTab === "financial" && (
            <FinancialCharts data={data as Record<string, unknown>} />
          )}

          {/* Módulo Socios */}
          {activeTab === "members" && (
            <MembersCharts data={data as Record<string, unknown>} />
          )}

          {/* Módulo Asistencia */}
          {activeTab === "attendance" && (
            <AttendanceCharts data={data as Record<string, unknown>} />
          )}

          {/* Módulo Training */}
          {activeTab === "training" && (
            <TrainingCharts data={data as Record<string, unknown>} />
          )}

          {/* Módulo Acceso */}
          {activeTab === "access" && (
            <AccessCharts data={data as Record<string, unknown>} />
          )}
        </div>
      )}
    </div>
  )
}

function KPI({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="bg-white rounded-xl border p-5 shadow-sm">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="text-3xl font-bold mt-1">
        {value}
        {unit && <span className="text-base font-normal text-slate-400 ml-1">{unit}</span>}
      </p>
    </div>
  )
}

function FinancialCharts({ data }: { data: Record<string, unknown> }) {
  const mrr = Number(data.mrr ?? 0)
  const arpu = Number(data.arpu ?? 0)
  const rrr = Number(data.revenueRetentionRate ?? 0)
  const paymentsByMonth = (data.paymentsByMonth ?? []) as Array<{ month: string; amount: number; count: number }>

  return (
    <>
      <div className="grid grid-cols-4 gap-4">
        <KPI label="MRR" value={`$${mrr.toLocaleString("es-AR")}`} />
        <KPI label="ARPU" value={`$${arpu.toLocaleString("es-AR")}`} />
        <KPI label="Revenue Retention" value={`${rrr.toFixed(1)}%`} />
        <KPI label="Deuda total" value={`$${Number(data.totalDebt ?? 0).toLocaleString("es-AR")}`} />
      </div>

      {paymentsByMonth.length > 0 && (
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h2 className="font-semibold mb-4 text-sm">Ingresos por mes</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={paymentsByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(v) => [`$${Number(v).toLocaleString("es-AR")}`, "Ingresos"]} />
              <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </>
  )
}

function MembersCharts({ data }: { data: Record<string, unknown> }) {
  const byPlan = (data.byPlan ?? []) as Array<{ planName: string; count: number }>

  return (
    <>
      <div className="grid grid-cols-4 gap-4">
        <KPI label="Activos" value={Number(data.activeCount ?? 0)} />
        <KPI label="Nuevos" value={Number(data.newCount ?? 0)} />
        <KPI label="Bajas" value={Number(data.cancelledCount ?? 0)} />
        <KPI label="Retención" value={`${Number(data.retentionRate ?? 0).toFixed(1)}%`} />
      </div>

      {byPlan.length > 0 && (
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h2 className="font-semibold mb-4 text-sm">Socios por plan</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={byPlan} dataKey="count" nameKey="planName" cx="50%" cy="50%" outerRadius={100} label>
                {byPlan.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </>
  )
}

function AttendanceCharts({ data }: { data: Record<string, unknown> }) {
  const byHour = (data.byHour ?? []) as Array<{ hour: number; count: number }>

  return (
    <>
      <div className="grid grid-cols-4 gap-4">
        <KPI label="Total visitas" value={Number(data.totalVisits ?? 0)} />
        <KPI label="Visitantes únicos" value={Number(data.uniqueVisitors ?? 0)} />
        <KPI label="Ausentes 7d" value={Number(data.absentMembers7d ?? 0)} />
        <KPI label="Ausentes 30d" value={Number(data.absentMembers30d ?? 0)} />
      </div>

      {byHour.length > 0 && (
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h2 className="font-semibold mb-4 text-sm">Accesos por hora del día</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={byHour}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tickFormatter={(h) => `${h}h`} />
              <YAxis />
              <Tooltip labelFormatter={(h) => `${h}:00`} />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </>
  )
}

function TrainingCharts({ data }: { data: Record<string, unknown> }) {
  const topExercises = (data.topExercises ?? []) as Array<{ exerciseName: string; usageCount: number }>

  return (
    <>
      <div className="grid grid-cols-4 gap-4">
        <KPI label="Rutinas totales" value={Number(data.totalRoutines ?? 0)} />
        <KPI label="Asignaciones" value={Number(data.totalAssignments ?? 0)} />
        <KPI label="Adherencia" value={`${Number(data.adherenceRate ?? 0).toFixed(1)}%`} />
        <KPI label="Sin rutina" value={Number(data.membersWithoutRoutine ?? 0)} />
      </div>

      {topExercises.length > 0 && (
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h2 className="font-semibold mb-4 text-sm">Top 10 ejercicios más usados</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topExercises} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="exerciseName" width={150} />
              <Tooltip />
              <Bar dataKey="usageCount" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </>
  )
}

function AccessCharts({ data }: { data: Record<string, unknown> }) {
  const byHour = (data.byHour ?? []) as Array<{ hour: number; count: number }>
  const failedByReason = (data.failedByReason ?? []) as Array<{ reason: string; count: number }>

  return (
    <>
      <div className="grid grid-cols-4 gap-4">
        <KPI label="Total accesos" value={Number(data.totalAccesses ?? 0)} />
        <KPI label="Tasa de éxito" value={`${Number(data.successRate ?? 0).toFixed(1)}%`} />
        <KPI label="Visitantes únicos" value={Number(data.uniqueMembers ?? 0)} />
        <KPI label="Visitas/socio" value={Number(data.avgVisitsPerMember ?? 0).toFixed(1)} />
      </div>

      {byHour.length > 0 && (
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h2 className="font-semibold mb-4 text-sm">Accesos por hora</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={byHour}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tickFormatter={(h) => `${h}h`} />
              <YAxis />
              <Tooltip labelFormatter={(h) => `${h}:00`} />
              <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {failedByReason.length > 0 && (
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h2 className="font-semibold mb-4 text-sm">Accesos denegados por razón</h2>
          <div className="space-y-2">
            {failedByReason.map((r) => (
              <div key={r.reason} className="flex items-center justify-between text-sm">
                <span className="font-mono text-xs text-slate-500">{r.reason}</span>
                <span className="font-medium text-red-600">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
