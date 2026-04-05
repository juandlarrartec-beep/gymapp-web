"use client"

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

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r flex flex-col">
        <div className="h-16 flex items-center px-6 border-b">
          <span className="font-bold text-xl text-primary">GymApp</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href as "/dashboard"}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
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

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
