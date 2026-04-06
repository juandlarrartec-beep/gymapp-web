import { MemberStatus, PaymentStatus } from "@prisma/client"
import { requireGymScope } from "@/lib/db"
import { db } from "@/lib/db"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { PaymentsTable } from "@/components/payments/PaymentsTable"
import { RegisterPaymentButton } from "@/components/payments/RegisterPaymentButton"

export default async function PaymentsPage() {
  const { gymId } = await requireGymScope()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [payments, debtors, monthStats, failedCount] = await Promise.all([
    db.payment.findMany({
      where: { gymId },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    db.member.aggregate({
      where: { gymId, status: MemberStatus.SUSPENDED },
      _count: true,
    }),
    db.payment.aggregate({
      where: {
        gymId,
        status: PaymentStatus.SUCCEEDED,
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
      _count: true,
    }),
    db.payment.count({
      where: { gymId, status: PaymentStatus.FAILED },
    }),
  ])

  // KPI: Deuda total estimada (socios suspendidos × pago promedio del mes)
  const avgPayment =
    monthStats._count > 0 ? (monthStats._sum.amount ?? 0) / monthStats._count : 0
  const totalDebt = debtors._count * avgPayment

  const mrrAmount = (monthStats._sum.amount ?? 0) / 100
  const cobradoHoy = payments
    .filter((p) => {
      const today = new Date()
      const pDate = new Date(p.createdAt)
      return (
        p.status === PaymentStatus.SUCCEEDED &&
        pDate.getDate() === today.getDate() &&
        pDate.getMonth() === today.getMonth() &&
        pDate.getFullYear() === today.getFullYear()
      )
    })
    .reduce((acc, p) => acc + p.amount, 0)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Pagos</h1>
        <RegisterPaymentButton />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <p className="text-sm text-slate-400">MRR este mes</p>
          <p className="text-2xl font-bold mt-1">
            ${mrrAmount.toLocaleString("es-AR")}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {monthStats._count} cobro{monthStats._count !== 1 ? "s" : ""} exitoso
            {monthStats._count !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <p className="text-sm text-slate-400">Cobrado hoy</p>
          <p className="text-2xl font-bold mt-1">
            ${(cobradoHoy / 100).toLocaleString("es-AR")}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {format(now, "dd 'de' MMMM", { locale: es })}
          </p>
        </div>

        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <p className="text-sm text-slate-400">Pagos fallidos</p>
          <p className="text-2xl font-bold mt-1 text-red-600">{failedCount}</p>
          <p className="text-xs text-slate-400 mt-1">Total acumulado</p>
        </div>

        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <p className="text-sm text-slate-400">Deuda estimada</p>
          <p className="text-2xl font-bold mt-1 text-amber-600">
            ${(totalDebt / 100).toLocaleString("es-AR")}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {debtors._count} socio{debtors._count !== 1 ? "s" : ""} suspendido
            {debtors._count !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Tabla con filtros */}
      <PaymentsTable payments={payments} />
    </div>
  )
}
