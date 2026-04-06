"use client"

import { useState, useTransition, useMemo } from "react"
import Link from "next/link"
import { PaymentStatus } from "@prisma/client"
import { format, startOfMonth, isWithinInterval, endOfMonth, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import { Search, Download, CheckCircle, ExternalLink } from "lucide-react"
import clsx from "clsx"
import { toast } from "sonner"
import { markPaymentSucceededAction } from "@/app/(dashboard)/dashboard/payments/actions"

interface PaymentRow {
  id: string
  amount: number
  currency: string
  status: PaymentStatus
  provider: string
  attemptNumber: number
  periodStart: Date | string
  periodEnd: Date | string
  createdAt: Date | string
  member: {
    id?: string
    firstName: string
    lastName: string
    email: string
  }
}

interface PaymentsTableProps {
  payments: PaymentRow[]
}

const STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pendiente",
  SUCCEEDED: "Exitoso",
  FAILED: "Fallido",
  REFUNDED: "Reembolsado",
}

const STATUS_CLASS: Record<PaymentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  SUCCEEDED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-slate-100 text-slate-500",
}

const PROVIDER_LABELS: Record<string, string> = {
  MERCADOPAGO: "MercadoPago",
  STRIPE: "Stripe",
  PAYPAL: "PayPal",
}

// Genera los últimos 6 meses para el selector
function getLastMonths(count: number): Array<{ value: string; label: string }> {
  const months = []
  for (let i = 0; i < count; i++) {
    const date = subMonths(new Date(), i)
    months.push({
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: format(date, "MMMM yyyy", { locale: es }),
    })
  }
  return months
}

function exportToCSV(payments: PaymentRow[]) {
  const header = "Fecha,Socio,Email,Monto,Moneda,Estado,Proveedor,Período inicio,Período fin"
  const rows = payments.map((p) => {
    const date = format(new Date(p.createdAt), "dd/MM/yyyy")
    const name = `${p.member.firstName} ${p.member.lastName}`
    const amount = (p.amount / 100).toFixed(2)
    const status = STATUS_LABELS[p.status]
    const provider = PROVIDER_LABELS[p.provider] ?? p.provider
    const periodStart = format(new Date(p.periodStart), "dd/MM/yyyy")
    const periodEnd = format(new Date(p.periodEnd), "dd/MM/yyyy")
    return [date, name, p.member.email, amount, p.currency, status, provider, periodStart, periodEnd]
      .map((v) => `"${v}"`)
      .join(",")
  })

  const csv = [header, ...rows].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `pagos-${format(new Date(), "yyyy-MM-dd")}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function PaymentsTable({ payments }: PaymentsTableProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "ALL">("ALL")
  const [monthFilter, setMonthFilter] = useState<string>("ALL")
  const [isPending, startTransition] = useTransition()

  const months = useMemo(() => getLastMonths(6), [])

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      // Búsqueda por nombre/email
      if (search.trim()) {
        const q = search.toLowerCase()
        const name = `${p.member.firstName} ${p.member.lastName}`.toLowerCase()
        if (!name.includes(q) && !p.member.email.toLowerCase().includes(q)) return false
      }

      // Filtro por estado
      if (statusFilter !== "ALL" && p.status !== statusFilter) return false

      // Filtro por mes
      if (monthFilter !== "ALL") {
        const [year, month] = monthFilter.split("-").map(Number)
        if (!year || !month) return true
        const date = new Date(p.createdAt)
        const ref = new Date(year, month - 1, 1)
        if (!isWithinInterval(date, { start: startOfMonth(ref), end: endOfMonth(ref) })) {
          return false
        }
      }

      return true
    })
  }, [payments, search, statusFilter, monthFilter])

  function handleMarkPaid(paymentId: string) {
    startTransition(async () => {
      const result = await markPaymentSucceededAction(paymentId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Pago marcado como exitoso")
      }
    })
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      {/* Filtros */}
      <div className="px-5 py-3 border-b flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar socio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | "ALL")}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="ALL">Todos los estados</option>
          {(Object.keys(STATUS_LABELS) as PaymentStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white capitalize"
        >
          <option value="ALL">Todos los meses</option>
          {months.map((m) => (
            <option key={m.value} value={m.value} className="capitalize">
              {m.label}
            </option>
          ))}
        </select>

        <button
          onClick={() => exportToCSV(filtered)}
          className="flex items-center gap-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Socio</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Monto</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Fecha</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Proveedor</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Intentos</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-400 text-sm">
                  No hay pagos que coincidan con los filtros
                </td>
              </tr>
            ) : (
              filtered.map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">
                      {payment.member.firstName} {payment.member.lastName}
                    </p>
                    <p className="text-xs text-slate-400">{payment.member.email}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    ${(payment.amount / 100).toLocaleString("es-AR")}
                    <span className="text-xs text-slate-400 font-normal ml-1">
                      {payment.currency}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={clsx(
                        "inline-flex px-2 py-0.5 rounded-full text-xs font-medium",
                        STATUS_CLASS[payment.status]
                      )}
                    >
                      {STATUS_LABELS[payment.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {format(new Date(payment.createdAt), "dd MMM yyyy", { locale: es })}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {PROVIDER_LABELS[payment.provider] ?? payment.provider}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-center">
                    {payment.attemptNumber}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      {payment.status === "FAILED" && (
                        <button
                          onClick={() => handleMarkPaid(payment.id)}
                          disabled={isPending}
                          title="Marcar como pagado"
                          className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium disabled:opacity-50 transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Pagado
                        </button>
                      )}
                      {payment.member.id && (
                        <Link
                          href={`/dashboard/members/${payment.member.id}`}
                          className="text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Ver socio"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {filtered.length > 0 && (
        <div className="px-5 py-2 border-t bg-slate-50 text-xs text-slate-400">
          {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
          {filtered.length !== payments.length && ` de ${payments.length}`}
        </div>
      )}
    </div>
  )
}
