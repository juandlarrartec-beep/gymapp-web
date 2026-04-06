"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { PaymentStatus, PaymentProvider, AccessMethod, RoutineDay } from "@prisma/client"
import clsx from "clsx"

interface Payment {
  id: string
  amount: number
  currency: string
  status: PaymentStatus
  provider: PaymentProvider
  createdAt: Date | string
}

interface AccessLog {
  id: string
  method: AccessMethod
  success: boolean
  failReason?: string | null
  timestamp: Date | string
}

interface RoutineAssignment {
  id: string
  routine: {
    name: string
    day?: RoutineDay | null
  }
}

interface MemberProfileTabsProps {
  payments: Payment[]
  accessLogs: AccessLog[]
  routineAssignments: RoutineAssignment[]
}

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pendiente",
  SUCCEEDED: "Exitoso",
  FAILED: "Fallido",
  REFUNDED: "Reembolsado",
}

const PAYMENT_STATUS_CLASS: Record<PaymentStatus, string> = {
  PENDING: "text-amber-600",
  SUCCEEDED: "text-green-600",
  FAILED: "text-red-500",
  REFUNDED: "text-slate-500",
}

const PROVIDER_LABELS: Record<PaymentProvider, string> = {
  STRIPE: "Stripe",
  MERCADOPAGO: "MercadoPago",
  PAYPAL: "PayPal",
}

const ACCESS_METHOD_LABELS: Record<AccessMethod, string> = {
  QR: "QR",
  NFC: "NFC",
  MANUAL: "Manual",
}

const ROUTINE_DAY_LABELS: Record<RoutineDay, string> = {
  MONDAY: "Lunes",
  TUESDAY: "Martes",
  WEDNESDAY: "Miércoles",
  THURSDAY: "Jueves",
  FRIDAY: "Viernes",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
}

type Tab = "payments" | "access" | "routines"

export function MemberProfileTabs({
  payments,
  accessLogs,
  routineAssignments,
}: MemberProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("payments")

  const tabs: { key: Tab; label: string }[] = [
    { key: "payments", label: `Pagos (${payments.length})` },
    { key: "access", label: `Accesos (${accessLogs.length})` },
    { key: "routines", label: `Rutinas (${routineAssignments.length})` },
  ]

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      {/* Tab headers */}
      <div className="flex border-b">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={clsx(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === key
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Pagos */}
      {activeTab === "payments" && (
        <div className="divide-y">
          {payments.length === 0 ? (
            <p className="text-center py-8 text-sm text-slate-400">Sin pagos registrados</p>
          ) : (
            payments.map((p) => (
              <div key={p.id} className="px-4 py-3 flex justify-between items-center text-sm">
                <div>
                  <p className="font-medium">
                    {(p.amount / 100).toLocaleString("es-AR")} {p.currency}
                  </p>
                  <p className="text-xs text-slate-400">
                    {format(new Date(p.createdAt), "dd MMM yyyy", { locale: es })} ·{" "}
                    {PROVIDER_LABELS[p.provider]}
                  </p>
                </div>
                <span className={clsx("text-xs font-medium", PAYMENT_STATUS_CLASS[p.status])}>
                  {PAYMENT_STATUS_LABELS[p.status]}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Accesos */}
      {activeTab === "access" && (
        <div className="divide-y">
          {accessLogs.length === 0 ? (
            <p className="text-center py-8 text-sm text-slate-400">Sin accesos registrados</p>
          ) : (
            accessLogs.map((log) => (
              <div key={log.id} className="px-4 py-3 flex justify-between items-center text-sm">
                <div>
                  <p className="font-medium">{ACCESS_METHOD_LABELS[log.method]}</p>
                  <p className="text-xs text-slate-400">
                    {format(new Date(log.timestamp), "dd MMM yyyy HH:mm", { locale: es })}
                  </p>
                </div>
                <span
                  className={clsx(
                    "text-xs font-medium",
                    log.success ? "text-green-600" : "text-red-500"
                  )}
                >
                  {log.success ? "OK" : log.failReason ?? "Denegado"}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Rutinas */}
      {activeTab === "routines" && (
        <div className="divide-y">
          {routineAssignments.length === 0 ? (
            <p className="text-center py-8 text-sm text-slate-400">Sin rutinas asignadas</p>
          ) : (
            routineAssignments.map((ra) => (
              <div key={ra.id} className="px-4 py-3 text-sm">
                <p className="font-medium">{ra.routine.name}</p>
                {ra.routine.day && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {ROUTINE_DAY_LABELS[ra.routine.day]}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
