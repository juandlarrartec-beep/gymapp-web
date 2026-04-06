import { clsx } from "clsx"
import {
  Users,
  TrendingUp,
  AlertCircle,
  UserPlus,
  UserMinus,
  RefreshCw,
  Brain,
  DoorOpen,
} from "lucide-react"

export interface KPIData {
  activeMembers: number
  activeMembersDelta: number
  mrr: number
  mrrGrowthPct: number
  overdueCount: number
  overdueDelta: number
  newThisMonth: number
  newDelta: number
  cancelledThisMonth: number
  cancelledDelta: number
  retentionRate: number
  retentionDelta: number
  churnHighCount: number
  todayAccess: number
  yesterdayAccessDelta: number
  currency: string
}

interface TrendBadgeProps {
  delta: number
  suffix?: string
  invertColors?: boolean
}

function TrendBadge({ delta, suffix = "", invertColors = false }: TrendBadgeProps) {
  if (delta === 0) {
    return <span className="text-xs text-slate-400">Sin cambios</span>
  }

  const isPositive = delta > 0
  // Para métricas negativas (bajas, vencidos) el verde/rojo se invierte
  const isGood = invertColors ? !isPositive : isPositive

  return (
    <span
      className={clsx("text-xs font-medium", {
        "text-emerald-600 dark:text-emerald-400": isGood,
        "text-rose-600 dark:text-rose-400": !isGood,
      })}
    >
      {isPositive ? "↑" : "↓"} {Math.abs(delta)}
      {suffix} vs mes ant.
    </span>
  )
}

interface KPICardProps {
  title: string
  value: string
  trend: React.ReactNode
  borderColor: "indigo" | "emerald" | "rose" | "amber"
  icon: React.ReactNode
  subtitle?: string
}

function KPICard({ title, value, trend, borderColor, icon, subtitle }: KPICardProps) {
  return (
    <div
      className={clsx(
        "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm",
        "border-l-4",
        {
          "border-l-indigo-500": borderColor === "indigo",
          "border-l-emerald-500": borderColor === "emerald",
          "border-l-rose-500": borderColor === "rose",
          "border-l-amber-500": borderColor === "amber",
        }
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{title}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1 leading-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>
          )}
          <div className="mt-2">{trend}</div>
        </div>
        <div
          className={clsx("p-2 rounded-xl ml-3 flex-shrink-0", {
            "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400": borderColor === "indigo",
            "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400": borderColor === "emerald",
            "bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400": borderColor === "rose",
            "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400": borderColor === "amber",
          })}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}

interface KPICardsProps {
  data: KPIData
  currency: string
}

export function KPICards({ data, currency }: KPICardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Socios activos */}
      <KPICard
        title="Socios activos"
        value={data.activeMembers.toLocaleString("es-AR")}
        borderColor="indigo"
        icon={<Users size={20} />}
        trend={<TrendBadge delta={data.activeMembersDelta} />}
      />

      {/* 2. MRR */}
      <KPICard
        title="MRR"
        value={`$${data.mrr.toLocaleString("es-AR")} ${currency}`}
        borderColor={data.mrrGrowthPct >= 0 ? "emerald" : "rose"}
        icon={<TrendingUp size={20} />}
        trend={
          <span
            className={clsx("text-xs font-medium", {
              "text-emerald-600 dark:text-emerald-400": data.mrrGrowthPct >= 0,
              "text-rose-600 dark:text-rose-400": data.mrrGrowthPct < 0,
            })}
          >
            {data.mrrGrowthPct >= 0 ? "↑" : "↓"} {Math.abs(data.mrrGrowthPct).toFixed(1)}% vs mes ant.
          </span>
        }
      />

      {/* 3. Pagos vencidos */}
      <KPICard
        title="Pagos vencidos"
        value={data.overdueCount.toString()}
        subtitle="Acceso bloqueado"
        borderColor="rose"
        icon={<AlertCircle size={20} />}
        trend={<TrendBadge delta={data.overdueDelta} invertColors={true} />}
      />

      {/* 4. Nuevos este mes */}
      <KPICard
        title="Nuevos este mes"
        value={data.newThisMonth.toString()}
        borderColor="emerald"
        icon={<UserPlus size={20} />}
        trend={<TrendBadge delta={data.newDelta} />}
      />

      {/* 5. Cancelaciones */}
      <KPICard
        title="Cancelaciones"
        value={data.cancelledThisMonth.toString()}
        borderColor={data.cancelledThisMonth > 0 ? "rose" : "indigo"}
        icon={<UserMinus size={20} />}
        trend={<TrendBadge delta={data.cancelledDelta} invertColors={true} />}
      />

      {/* 6. Tasa de retención */}
      <KPICard
        title="Tasa de retención"
        value={`${data.retentionRate.toFixed(1)}%`}
        borderColor={data.retentionRate >= 80 ? "emerald" : data.retentionRate >= 60 ? "amber" : "rose"}
        icon={<RefreshCw size={20} />}
        trend={
          <span
            className={clsx("text-xs font-medium", {
              "text-emerald-600 dark:text-emerald-400": data.retentionDelta >= 0,
              "text-rose-600 dark:text-rose-400": data.retentionDelta < 0,
            })}
          >
            {data.retentionDelta >= 0 ? "↑" : "↓"} {Math.abs(data.retentionDelta).toFixed(1)}pp vs mes ant.
          </span>
        }
      />

      {/* 7. Riesgo churn IA */}
      <KPICard
        title="Riesgo churn IA"
        value={data.churnHighCount.toString()}
        subtitle="Socios en riesgo alto"
        borderColor="amber"
        icon={<Brain size={20} />}
        trend={
          <span className="text-xs text-slate-400">
            {data.churnHighCount === 0 ? "Sin riesgo activo" : "Requiere atención"}
          </span>
        }
      />

      {/* 8. Accesos hoy */}
      <KPICard
        title="Accesos hoy"
        value={data.todayAccess.toString()}
        borderColor="indigo"
        icon={<DoorOpen size={20} />}
        trend={<TrendBadge delta={data.yesterdayAccessDelta} />}
      />
    </div>
  )
}
