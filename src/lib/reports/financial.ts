import { PaymentStatus } from "@prisma/client"
import { db } from "@/lib/db"

export interface FinancialReport {
  mrr: number
  arpu: number
  totalDebt: number
  projectedMrr: number
  successfulPayments: number
  failedPayments: number
  revenueRetentionRate: number
  paymentsByMonth: Array<{ month: string; amount: number; count: number }>
}

// seatId opcional: si se provee, filtra AccessLog por sede; si no, datos consolidados de todas las sedes
export async function getFinancialReport(
  gymId: string,
  from: Date,
  to: Date,
  seatId?: string
): Promise<FinancialReport> {
  // Nota: los pagos no tienen seatId — el filtro por sede aplica a los reportes de acceso.
  // Para reportes financieros, seatId se ignora (los pagos son a nivel gym, no sede).
  void seatId
  const [succeeded, failed, activeMembers, previousPeriodPayments] = await Promise.all([
    db.payment.aggregate({
      where: { gymId, status: PaymentStatus.SUCCEEDED, createdAt: { gte: from, lte: to } },
      _sum: { amount: true },
      _count: true,
    }),
    db.payment.aggregate({
      where: { gymId, status: PaymentStatus.FAILED, createdAt: { gte: from, lte: to } },
      _sum: { amount: true },
      _count: true,
    }),
    db.member.count({ where: { gymId, status: "ACTIVE" } }),
    // Periodo anterior para calcular revenue retention
    db.payment.aggregate({
      where: {
        gymId,
        status: PaymentStatus.SUCCEEDED,
        createdAt: {
          gte: new Date(from.getTime() - (to.getTime() - from.getTime())),
          lt: from,
        },
      },
      _sum: { amount: true },
    }),
  ])

  const mrrCents = succeeded._sum.amount ?? 0
  const mrr = mrrCents / 100
  const arpu = activeMembers > 0 ? mrr / activeMembers : 0
  const prevMrr = (previousPeriodPayments._sum.amount ?? 0) / 100
  const totalDebt = ((failed._sum.amount ?? 0) / 100)
  const projectedMrr = mrr // simplificado — en prod sería basado en renovaciones esperadas
  const revenueRetentionRate = prevMrr > 0 ? (mrr / prevMrr) * 100 : 100

  // Pagos agrupados por mes
  const rawPayments = await db.payment.findMany({
    where: { gymId, status: PaymentStatus.SUCCEEDED, createdAt: { gte: from, lte: to } },
    select: { amount: true, createdAt: true },
  })

  const byMonth = rawPayments.reduce<Record<string, { amount: number; count: number }>>((acc, p) => {
    const key = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, "0")}`
    if (!acc[key]) acc[key] = { amount: 0, count: 0 }
    acc[key]!.amount += p.amount / 100
    acc[key]!.count += 1
    return acc
  }, {})

  const paymentsByMonth = Object.entries(byMonth)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month))

  return {
    mrr,
    arpu,
    totalDebt,
    projectedMrr,
    successfulPayments: succeeded._count,
    failedPayments: failed._count,
    revenueRetentionRate,
    paymentsByMonth,
  }
}
