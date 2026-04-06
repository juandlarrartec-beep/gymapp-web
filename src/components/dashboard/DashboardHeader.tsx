import Link from "next/link"
import { UserPlus, Zap } from "lucide-react"

interface DashboardHeaderProps {
  gymName: string
  lastAccessMemberName: string | null
  lastAccessTime: Date | null
}

function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 13) return "Buenos días"
  if (hour >= 13 && hour < 20) return "Buenas tardes"
  return "Buenas noches"
}

function formatLastAccess(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMin / 60)

  if (diffMin < 1) return "ahora mismo"
  if (diffMin < 60) return `hace ${diffMin} min`
  if (diffHours < 24) return `hace ${diffHours}h`
  return `hace ${Math.floor(diffHours / 24)}d`
}

export function DashboardHeader({ gymName, lastAccessMemberName, lastAccessTime }: DashboardHeaderProps) {
  const hour = new Date().getHours()
  const greeting = getGreeting(hour)

  return (
    <div className="flex items-start justify-between flex-wrap gap-4">
      {/* Izquierda */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {greeting},{" "}
          <span className="text-indigo-600 dark:text-indigo-400">{gymName}</span>
        </h1>

        {lastAccessMemberName && lastAccessTime ? (
          <div className="flex items-center gap-2 mt-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Último acceso:{" "}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {formatLastAccess(lastAccessTime)}
              </span>
              {" — "}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {lastAccessMemberName}
              </span>
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Sin accesos registrados hoy</p>
        )}
      </div>

      {/* Derecha — CTAs */}
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/members/new"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
        >
          <UserPlus size={16} />
          Nuevo socio
        </Link>
        <Link
          href="/dashboard/payments"
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
        >
          <Zap size={16} />
          Cobrar
        </Link>
      </div>
    </div>
  )
}
