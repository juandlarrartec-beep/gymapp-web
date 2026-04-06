import Link from "next/link"
import { clsx } from "clsx"

export interface DashboardAlert {
  type: "critical" | "warning" | "info"
  title: string
  description: string
  action?: { label: string; href: string }
}

interface AlertsPanelProps {
  alerts: DashboardAlert[]
  gymId: string
}

const ORDER: Record<DashboardAlert["type"], number> = {
  critical: 0,
  warning: 1,
  info: 2,
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const sorted = [...alerts].sort((a, b) => ORDER[a.type] - ORDER[b.type])

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <span>Alertas del día</span>
        </h3>
        {alerts.length > 0 && (
          <span
            className={clsx(
              "px-2 py-0.5 rounded-full text-xs font-semibold",
              sorted[0]?.type === "critical"
                ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400"
                : sorted[0]?.type === "warning"
                ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            )}
          >
            {alerts.length}
          </span>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-slate-400 text-sm gap-2">
          <span className="text-3xl">✅</span>
          <span>Todo en orden</span>
        </div>
      ) : (
        <ul className="space-y-3">
          {sorted.map((alert, i) => (
            <li
              key={i}
              className={clsx(
                "flex items-start gap-3 p-3 rounded-xl border",
                {
                  "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900": alert.type === "critical",
                  "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900": alert.type === "warning",
                  "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700": alert.type === "info",
                }
              )}
            >
              {/* Dot */}
              <span
                className={clsx("w-2 h-2 rounded-full flex-shrink-0 mt-1.5", {
                  "bg-rose-500": alert.type === "critical",
                  "bg-amber-500": alert.type === "warning",
                  "bg-slate-400": alert.type === "info",
                })}
              />

              <div className="flex-1 min-w-0">
                <p
                  className={clsx("text-sm font-semibold", {
                    "text-rose-800 dark:text-rose-300": alert.type === "critical",
                    "text-amber-800 dark:text-amber-300": alert.type === "warning",
                    "text-slate-700 dark:text-slate-300": alert.type === "info",
                  })}
                >
                  {alert.title}
                </p>
                <p
                  className={clsx("text-xs mt-0.5", {
                    "text-rose-600 dark:text-rose-400": alert.type === "critical",
                    "text-amber-600 dark:text-amber-400": alert.type === "warning",
                    "text-slate-500 dark:text-slate-400": alert.type === "info",
                  })}
                >
                  {alert.description}
                </p>
                {alert.action && (
                  <Link
                    href={alert.action.href}
                    className={clsx(
                      "inline-block mt-1.5 text-xs font-medium underline underline-offset-2 hover:no-underline",
                      {
                        "text-rose-700 dark:text-rose-400": alert.type === "critical",
                        "text-amber-700 dark:text-amber-400": alert.type === "warning",
                        "text-indigo-600 dark:text-indigo-400": alert.type === "info",
                      }
                    )}
                  >
                    {alert.action.label} →
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
