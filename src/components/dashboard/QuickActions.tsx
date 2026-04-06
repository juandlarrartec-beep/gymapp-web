import Link from "next/link"
import {
  UserPlus,
  CreditCard,
  CalendarPlus,
  BarChart3,
  MessageSquare,
  Search,
} from "lucide-react"

interface QuickActionItem {
  icon: React.ReactNode
  label: string
  href: string
  description: string
}

const ACTIONS: QuickActionItem[] = [
  {
    icon: <UserPlus size={22} />,
    label: "Nuevo socio",
    href: "/dashboard/members/new",
    description: "Registrar",
  },
  {
    icon: <CreditCard size={22} />,
    label: "Registrar pago",
    href: "/dashboard/payments",
    description: "Cobrar",
  },
  {
    icon: <CalendarPlus size={22} />,
    label: "Nueva clase",
    href: "/dashboard/classes",
    description: "Programar",
  },
  {
    icon: <BarChart3 size={22} />,
    label: "Ver reportes",
    href: "/dashboard/reports",
    description: "Analizar",
  },
  {
    icon: <MessageSquare size={22} />,
    label: "WhatsApp masivo",
    href: "/dashboard/communications",
    description: "Comunicar",
  },
  {
    icon: <Search size={22} />,
    label: "Buscar socio",
    href: "/dashboard/members",
    description: "Encontrar",
  },
]

export function QuickActions() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Acciones rápidas</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Atajos frecuentes</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all duration-150 hover:scale-[1.03] active:scale-[0.97]"
          >
            <span className="text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {action.icon}
            </span>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 text-center leading-tight transition-colors">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
