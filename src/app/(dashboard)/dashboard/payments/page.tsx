import { MemberStatus, PaymentStatus } from "@prisma/client"
import { requireGymScope } from "@/lib/db"
import { db } from "@/lib/db"
import { format } from "date-fns"
import { es } from "date-fns/locale"

const statusLabel: Record<PaymentStatus, string> = {
  PENDING: "Pendiente",
  SUCCEEDED: "Exitoso",
  FAILED: "Fallido",
  REFUNDED: "Reembolsado",
}

const statusClass: Record<PaymentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  SUCCEEDED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  REFUNDED: "bg-slate-100 text-slate-600",
}

export default async function PaymentsPage() {
  const { gymId } = await requireGymScope()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [payments, debtors, stats] = await Promise.all([
    db.payment.findMany({
      where: { gymId },
      include: {
        member: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.member.findMany({
      where: {
        gymId,
        status: MemberStatus.SUSPENDED,
      },
      include: {
        payments: {
          where: { status: PaymentStatus.FAILED },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
    db.payment.aggregate({
      where: { gymId, status: PaymentStatus.SUCCEEDED, createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
      _count: true,
    }),
  ])

  const mrr = (stats._sum.amount ?? 0) / 100

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Pagos y cobros</h1>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <p className="text-sm text-slate-400">Recaudado este mes</p>
          <p className="text-3xl font-bold mt-1">${mrr.toLocaleString("es-AR")}</p>
          <p className="text-xs text-slate-400 mt-1">{stats._count} cobros exitosos</p>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <p className="text-sm text-slate-400">Deudores</p>
          <p className="text-3xl font-bold mt-1 text-red-600">{debtors.length}</p>
          <p className="text-xs text-slate-400 mt-1">Socios con acceso bloqueado</p>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <p className="text-sm text-slate-400">Tasa de cobro</p>
          <p className="text-3xl font-bold mt-1">
            {payments.length > 0
              ? `${Math.round((payments.filter((p) => p.status === PaymentStatus.SUCCEEDED).length / payments.length) * 100)}%`
              : "—"}
          </p>
          <p className="text-xs text-slate-400 mt-1">Últimos {payments.length} cobros</p>
        </div>
      </div>

      {/* Semáforo de deudores */}
      {debtors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-red-800 mb-3">Socios con cobros pendientes</h2>
          <div className="space-y-2">
            {debtors.map((debtor) => (
              <div key={debtor.id} className="flex items-center justify-between bg-white rounded-lg border border-red-100 px-4 py-2">
                <div>
                  <p className="text-sm font-medium">{debtor.firstName} {debtor.lastName}</p>
                  <p className="text-xs text-slate-400">{debtor.email}</p>
                </div>
                <div className="text-right">
                  {debtor.payments[0] && (
                    <p className="text-sm font-medium text-red-600">
                      {(debtor.payments[0].amount / 100).toLocaleString("es-AR")} {debtor.payments[0].currency}
                    </p>
                  )}
                  <p className="text-xs text-red-400">
                    Intento {debtor.payments[0]?.attemptNumber ?? 1}/3
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla de cobros */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b">
          <h2 className="font-semibold">Historial de cobros</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Socio</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Monto</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Fecha</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Proveedor</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-medium">{payment.member.firstName} {payment.member.lastName}</p>
                  <p className="text-xs text-slate-400">{payment.member.email}</p>
                </td>
                <td className="px-4 py-3 font-medium">
                  {(payment.amount / 100).toLocaleString("es-AR")} {payment.currency}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusClass[payment.status]}`}>
                    {statusLabel[payment.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {format(new Date(payment.createdAt), "dd MMM yyyy", { locale: es })}
                </td>
                <td className="px-4 py-3 text-slate-500 uppercase text-xs">{payment.provider}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
