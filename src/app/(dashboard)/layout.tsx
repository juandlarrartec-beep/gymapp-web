"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserButton } from "@clerk/nextjs"
import { clsx } from "clsx"
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart3,
  Dumbbell,
  CalendarDays,
  DoorOpen,
  Settings,
  TrendingDown,
  Menu,
  X,
} from "lucide-react"

const navItems = [
  { href: "/dashboard",          label: "Dashboard",   icon: LayoutDashboard },
  { href: "/dashboard/members",  label: "Socios",      icon: Users },
  { href: "/dashboard/payments", label: "Pagos",       icon: CreditCard },
  { href: "/dashboard/classes",  label: "Clases",      icon: CalendarDays },
  { href: "/dashboard/training", label: "Rutinas",     icon: Dumbbell },
  { href: "/dashboard/access",   label: "Acceso",      icon: DoorOpen },
  { href: "/dashboard/churn",    label: "Riesgo fuga", icon: TrendingDown },
  { href: "/dashboard/reports",  label: "Reportes",    icon: BarChart3 },
  { href: "/dashboard/settings", label: "Ajustes",     icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background">
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
          "fixed md:static top-0 left-0 h-full w-64 border-r flex flex-col z-40 bg-background transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="h-16 flex items-center px-6 border-b">
          <span className="font-bold text-xl text-primary">GymApp</span>
          {/* Botón cerrar solo en mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto p-1 rounded-lg text-muted-foreground hover:bg-muted md:hidden"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href as "/dashboard"}
              onClick={() => setSidebarOpen(false)}
              className={clsx(
                "flex items-center gap-3 px-3 py-3 md:py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px]",
                pathname === href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <UserButton afterSignOutUrl="/" />
        </div>
      </aside>

      {/* Columna derecha: header mobile + contenido */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header mobile — solo visible en mobile */}
        <header className="h-14 flex items-center px-4 border-b bg-background md:hidden flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Abrir menú"
          >
            <Menu size={22} />
          </button>
          <span className="font-bold text-lg text-primary ml-3">GymApp</span>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
