import Link from "next/link"
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart3,
  CalendarDays,
  Settings,
  Home,
} from "lucide-react"

const demoNavItems = [
  { href: "/demo",          label: "Dashboard", icon: LayoutDashboard },
  { href: "/demo/members",  label: "Socios",    icon: Users },
  { href: "/demo/payments", label: "Pagos",     icon: CreditCard },
  { href: "/demo/classes",  label: "Clases",    icon: CalendarDays },
  { href: "/demo/reports",  label: "Reportes",  icon: BarChart3 },
  { href: "/demo/settings", label: "Ajustes",   icon: Settings },
]

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen">
      {/* Banner fijo demo */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-indigo-600 text-white text-sm flex items-center justify-center gap-4 px-4 py-2">
        <span className="font-medium">
          🎯 Modo Demo — CrossFit Impulso &nbsp;|&nbsp; ¿Querés GymApp para tu gym?
        </span>
        <a
          href="mailto:hola@gymapp.com"
          className="inline-flex items-center gap-1 bg-white text-indigo-700 font-semibold px-3 py-1 rounded-full text-xs hover:bg-indigo-50 transition-colors"
        >
          Contactar →
        </a>
      </div>

      {/* Layout principal — desplazado por el banner (32px = h-8) */}
      <div className="flex flex-1 overflow-hidden pt-8">
        {/* Sidebar */}
        <aside className="w-64 border-r flex flex-col bg-white dark:bg-slate-900 flex-shrink-0">
          <div className="h-16 flex items-center px-6 border-b">
            <span className="font-bold text-xl text-indigo-600">GymApp</span>
            <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
              Demo
            </span>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {demoNavItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <Home size={16} />
              Volver al inicio
            </Link>
          </div>
        </aside>

        {/* Contenido */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  )
}
