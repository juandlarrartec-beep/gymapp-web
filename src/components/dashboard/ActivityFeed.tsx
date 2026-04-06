import { clsx } from "clsx"

export type ActivityEventType =
  | "access_success"
  | "payment_success"
  | "payment_failed"
  | "member_new"
  | "class_completed"

export interface ActivityEvent {
  type: ActivityEventType
  description: string
  memberName?: string
  time: Date
  amount?: number
}

interface ActivityFeedProps {
  events: ActivityEvent[]
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHours = Math.floor(diffMin / 60)

  if (diffSec < 60) return "hace un momento"
  if (diffMin < 60) return `hace ${diffMin} min`
  if (diffHours < 24) return `hace ${diffHours}h`
  return `hace ${Math.floor(diffHours / 24)}d`
}

const EVENT_CONFIG: Record<
  ActivityEventType,
  { dot: string; label: string }
> = {
  access_success: { dot: "bg-green-500", label: "Acceso" },
  payment_success: { dot: "bg-emerald-500", label: "Pago" },
  payment_failed: { dot: "bg-rose-500", label: "Pago fallido" },
  member_new: { dot: "bg-indigo-500", label: "Nuevo socio" },
  class_completed: { dot: "bg-slate-400", label: "Clase" },
}

export function ActivityFeed({ events }: ActivityFeedProps) {
  const visible = events.slice(0, 10)

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Actividad reciente</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Últimas acciones del gimnasio</p>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-slate-400 text-sm gap-2">
          <span className="text-3xl">💤</span>
          <span>No hay actividad reciente</span>
        </div>
      ) : (
        <ul className="space-y-0">
          {visible.map((event, i) => {
            const config = EVENT_CONFIG[event.type]
            return (
              <li
                key={i}
                className={clsx(
                  "flex items-start gap-3 py-2.5",
                  i < visible.length - 1 && "border-b border-slate-100 dark:border-slate-800"
                )}
              >
                {/* Dot con línea vertical */}
                <div className="flex flex-col items-center flex-shrink-0 pt-1">
                  <span className={clsx("w-2 h-2 rounded-full", config.dot)} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">
                    {event.description}
                    {event.amount !== undefined && (
                      <span className="font-medium text-emerald-600 dark:text-emerald-400 ml-1">
                        ${event.amount.toLocaleString("es-AR")}
                      </span>
                    )}
                  </p>
                  {event.memberName && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {event.memberName}
                    </p>
                  )}
                </div>

                <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0 pt-0.5">
                  {formatRelativeTime(event.time)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
