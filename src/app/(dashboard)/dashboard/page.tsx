import { MemberStatus } from "@prisma/client"
import { clsx } from "clsx"
import { requireGymScope, db } from "@/lib/db"

async function getDashboardKPIs(gymId: string) {

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const [
    activeMembers,
    suspendedMembers,
    newThisMonth,
    cancelledThisMonth,
    paymentsThisMonth,
    paymentsLastMonth,
    highRiskChurn,
  ] = await Promise.all([
    db.member.count({ where: { gymId, status: MemberStatus.ACTIVE } }),
    db.member.count({ where: { gymId, status: MemberStatus.SUSPENDED } }),
    db.member.count({ where: { gymId, createdAt: { gte: startOfMonth } } }),
    db.member.count({ where: { gymId, cancellationDate: { gte: startOfMonth } } }),
    db.payment.aggregate({
      where: { gymId, status: "SUCCEEDED", createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
      _count: true,
    }),
    db.payment.aggregate({
      where: { gymId, status: "SUCCEEDED", createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      _sum: { amount: true },
    }),
    db.churnScore.count({ where: { gymId, riskLevel: "HIGH" } }),
  ])

  const mrr = (paymentsThisMonth._sum.amount ?? 0) / 100
  const lastMrr = (paymentsLastMonth._sum.amount ?? 0) / 100
  const mrrGrowth = lastMrr > 0 ? ((mrr - lastMrr) / lastMrr) * 100 : 0

  return {
    activeMembers,
    suspendedMembers,
    newThisMonth,
    cancelledThisMonth,
    mrr,
    mrrGrowth,
    highRiskChurn,
  }
}

export default async function DashboardPage() {
  const { gymId } = await requireGymScope()
  const kpis = await getDashboardKPIs(gymId)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard
          title="Socios activos"
          value={kpis.activeMembers.toString()}
          subtitle={`${kpis.newThisMonth} nuevos este mes`}
          trend="neutral"
        />
        <KPICard
          title="MRR"
          value={`$${kpis.mrr.toLocaleString("es-AR")}`}
          subtitle={`${kpis.mrrGrowth > 0 ? "+" : ""}${kpis.mrrGrowth.toFixed(1)}% vs mes anterior`}
          trend={kpis.mrrGrowth >= 0 ? "up" : "down"}
        />
        <KPICard
          title="Acceso bloqueado"
          value={kpis.suspendedMembers.toString()}
          subtitle="Pago pendiente"
          trend={kpis.suspendedMembers > 0 ? "down" : "neutral"}
        />
        <KPICard
          title="Riesgo de fuga"
          value={kpis.highRiskChurn.toString()}
          subtitle="Socios en riesgo alto"
          trend={kpis.highRiskChurn > 0 ? "down" : "neutral"}
        />
      </div>
    </div>
  )
}

function KPICard({
  title,
  value,
  subtitle,
  trend,
}: {
  title: string
  value: string
  subtitle: string
  trend: "up" | "down" | "neutral"
}) {
  return (
    <div className="bg-white rounded-xl border p-6 shadow-sm">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      <p
        className={clsx("text-xs mt-2", {
          "text-green-600": trend === "up",
          "text-red-500": trend === "down",
          "text-muted-foreground": trend === "neutral",
        })}
      >
        {subtitle}
      </p>
    </div>
  )
}
