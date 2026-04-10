"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { clsx } from "clsx"
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart3,
  CalendarDays,
  Settings,
  Home,
  Menu,
  X,
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
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex flex-col h-screen">
      {/* Banner fijo demo */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-indigo-600 text-white text-sm flex items-center justify-center gap-2 px-4 py-2">
        <span className="font-medium text-center">
          Modo Demo — CrossFit Impulso &nbsp;|&nbsp; ¿Querés GymApp para tu gym?
        </span>
        <a
          href="mailto:hola@gymapp.com"
          className="inline-flex items-center gap-1 bg-white text-indigo-700 font-semibold px-3 py-1 rounded-full text-xs hover:bg-indigo-50 transition-colors whitespace-nowrap"
        >
          Contactar →
        </a>
      </div>

      {/* Layout principal — desplazado por el banner (32px = h-8) */}
      <div className="flex flex-1 overflow-hidden pt-8">
        {/* Overlay mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={clsx(
            "fixed md:static top-8 left-0 h-[calc(100%-2rem)] w-64 border-r flex flex-col bg-white dark:bg-slate-900 z-40 transition-transform duration-300 ease-in-out flex-shrink-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
        >
          <div className="h-16 flex items-center px-6 border-b">
            <span className="font-bold text-xl text-indigo-600">GymApp</span>
            <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
              Demo
            </span>
            {/* Botón cerrar solo en mobile */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto p-1 rounded-lg text-slate-500 hover:bg-slate-100 md:hidden"
              aria-label="Cerrar menú"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {demoNavItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={clsx(
                  "flex items-center gap-3 px-3 py-3 md:py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px]",
                  pathname === href
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors min-h-[44px]"
            >
              <Home size={16} />
              Volver al inicio
            </Link>
          </div>
        </aside>

        {/* Columna derecha: header mobile + contenido */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Header mobile — solo visible en mobile */}
          <header className="h-14 flex items-center px-4 border-b bg-white dark:bg-slate-900 md:hidden flex-shrink-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Abrir menú"
            >
              <Menu size={22} />
            </button>
            <span className="font-bold text-lg text-indigo-600 ml-3">GymApp</span>
            <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
              Demo
            </span>
          </header>

          {/* Contenido */}
          <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
