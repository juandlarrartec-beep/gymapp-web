import { MemberStatus } from "@prisma/client"
import { db } from "@/lib/db"

export interface MembersReport {
  activeCount: number
  newCount: number
  cancelledCount: number
  retentionRate: number
  byPlan: Array<{ planName: string; count: number; revenue: number }>
  atRiskCount: number
  frozenCount: number
}

// seatId opcional — para reportes de socios, no aplica filtro por sede (los socios son del gym)
export async function getMembersReport(
  gymId: string,
  from: Date,
  to: Date,
  seatId?: string
): Promise<MembersReport> {
  void seatId // el parámetro está disponible para consistencia de interfaz
  const [active, newMembers, cancelled, frozen, prevPeriodActive] = await Promise.all([
    db.member.count({ where: { gymId, status: MemberStatus.ACTIVE } }),
    db.member.count({ where: { gymId, createdAt: { gte: from, lte: to } } }),
    db.member.count({ where: { gymId, cancellationDate: { gte: from, lte: to } } }),
    db.member.count({ where: { gymId, status: MemberStatus.FROZEN } }),
    db.member.count({
      where: {
        gymId,
        status: MemberStatus.ACTIVE,
        createdAt: {
          lt: from,
        },
      },
    }),
  ])

  // Retención = activos que ya estaban antes / total activos antes
  const retentionRate = prevPeriodActive > 0 ? ((active - newMembers) / prevPeriodActive) * 100 : 100

  // Por plan
  const membersByPlan = await db.member.groupBy({
    by: ["membershipPlanId"],
    where: { gymId, status: MemberStatus.ACTIVE },
    _count: true,
  })

  const planIds = membersByPlan.map((m) => m.membershipPlanId)
  const plans = await db.membershipPlan.findMany({
    where: { id: { in: planIds } },
    select: { id: true, name: true, priceAmount: true },
  })

  const planMap = new Map(plans.map((p) => [p.id, p]))

  const byPlan = membersByPlan.map((m) => {
    const plan = planMap.get(m.membershipPlanId)
    return {
      planName: plan?.name ?? "Plan eliminado",
      count: m._count,
      revenue: ((plan?.priceAmount ?? 0) * m._count) / 100,
    }
  })

  const atRiskCount = await db.churnScore.count({
    where: { gymId, riskLevel: { in: ["HIGH", "MEDIUM"] } },
  })

  return {
    activeCount: active,
    newCount: newMembers,
    cancelledCount: cancelled,
    retentionRate: Math.max(0, Math.min(100, retentionRate)),
    byPlan,
    atRiskCount,
    frozenCount: frozen,
  }
}
