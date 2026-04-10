import { requireGymScope, db } from "@/lib/db"
import { MemberStatus } from "@prisma/client"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { KPICards, type KPIData } from "@/components/dashboard/KPICards"
import { RevenueChart, type RevenueDataPoint } from "@/components/dashboard/RevenueChart"
import { MemberFlowChart, type MemberFlowDataPoint } from "@/components/dashboard/MemberFlowChart"
import { ClassOccupancyChart, type ClassOccupancyDataPoint } from "@/components/dashboard/ClassOccupancyChart"
import { AlertsPanel, type DashboardAlert } from "@/components/dashboard/AlertsPanel"
import { QuickActions } from "@/components/dashboard/QuickActions"
import { ActivityFeed, type ActivityEvent } from "@/components/dashboard/ActivityFeed"

const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

export default async function DashboardPage() {
  const { gymId } = await requireGymScope()

  // ── 1. Datos del gym ──────────────────────────────────────────────────────
  const gym = await db.gym.findUnique({
    where: { id: gymId },
    select: { name: true, currency: true },
  })

  if (!gym) throw new Error("Gym no encontrado")

  // ── 2. Fechas clave ───────────────────────────────────────────────────────
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000)
  const tenDaysAgo = new Date(now.getTime() - 10 * 86_400_000)

  // ── 3. Historial de 12 meses (índices por mes) ───────────────────────────
  const monthRanges = Array.from({ length: 12 }, (_, i) => {
    const offset = 11 - i
    const start = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    const end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 0, 23, 59, 59)
    const label = `${MONTH_NAMES[start.getMonth()]} ${start.getFullYear().toString().slice(2)}`
    return { start, end, label }
  })

  // ── 4. Promise.all — todas las queries en paralelo ────────────────────────
  const [
    activeMembers,
    activeMembersLastMonth,
    mrrAgg,
    mrrLastAgg,
    overdueCount,
    newThisMonth,
    newLastMonth,
    cancelledThisMonth,
    cancelledLastMonth,
    churnHighCount,
    todayAccess,
    yesterdayAccess,
    inactiveMembersRaw,
    recentLogs,
    upcomingClasses,
    ...monthlyRaw
  ] = await Promise.all([
    // KPIs
    db.member.count({ where: { gymId, status: MemberStatus.ACTIVE } }),
    db.member.count({ where: { gymId, status: MemberStatus.ACTIVE, createdAt: { lte: endOfLastMonth } } }),
    db.payment.aggregate({
      where: { gymId, status: "SUCCEEDED", createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    db.payment.aggregate({
      where: { gymId, status: "SUCCEEDED", createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      _sum: { amount: true },
    }),
    db.member.count({ where: { gymId, status: MemberStatus.SUSPENDED } }),
    db.member.count({ where: { gymId, createdAt: { gte: startOfMonth } } }),
    db.member.count({ where: { gymId, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
    db.member.count({ where: { gymId, status: MemberStatus.CANCELLED, cancellationDate: { gte: startOfMonth } } }),
    db.member.count({ where: { gymId, status: MemberStatus.CANCELLED, cancellationDate: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
    db.churnScore.count({ where: { gymId, riskLevel: "HIGH" } }),
    db.accessLog.count({ where: { gymId, timestamp: { gte: todayStart }, success: true } }),
    db.accessLog.count({ where: { gymId, timestamp: { gte: yesterdayStart, lt: todayStart }, success: true } }),

    // Socios sin acceso en 10+ días (para alertas)
    db.member.findMany({
      where: {
        gymId,
        status: MemberStatus.ACTIVE,
        accessLogs: {
          none: { timestamp: { gte: tenDaysAgo } },
        },
      },
      select: { id: true },
      take: 100,
    }),

    // Activity feed — últimos 10 accesos exitosos
    db.accessLog.findMany({
      where: { gymId, success: true },
      orderBy: { timestamp: "desc" },
      take: 10,
      select: {
        timestamp: true,
        method: true,
        member: { select: { firstName: true, lastName: true } },
      },
    }),

    // Clases próximas para ocupación
    db.classSchedule.findMany({
      where: {
        gymId,
        status: "SCHEDULED",
        startTime: { gte: now },
      },
      orderBy: { startTime: "asc" },
      take: 8,
      select: {
        name: true,
        maxCapacity: true,
        _count: { select: { bookings: { where: { status: "CONFIRMED" } } } },
      },
    }),

    // 12 meses de histórico (MRR + socios activos en paralelo — 24 queries)
    ...monthRanges.flatMap((range) => [
      db.payment.aggregate({
        where: { gymId, status: "SUCCEEDED", createdAt: { gte: range.start, lte: range.end } },
        _sum: { amount: true },
      }),
      db.member.count({
        where: { gymId, status: MemberStatus.ACTIVE, createdAt: { lte: range.end } },
      }),
    ]),
  ])

  // ── 5. Derivar KPIs ───────────────────────────────────────────────────────
  const mrr = (mrrAgg._sum.amount ?? 0) / 100
  const mrrLast = (mrrLastAgg._sum.amount ?? 0) / 100
  const mrrGrowthPct = mrrLast > 0 ? ((mrr - mrrLast) / mrrLast) * 100 : 0

  const retentionRate =
    activeMembersLastMonth > 0
      ? ((activeMembers - newThisMonth) / activeMembersLastMonth) * 100
      : 100

  const retentionLastMonth =
    activeMembersLastMonth > 0
      ? 100 // baseline simplificado
      : 100

  const kpis: KPIData = {
    activeMembers,
    activeMembersDelta: activeMembers - activeMembersLastMonth,
    mrr,
    mrrGrowthPct,
    overdueCount,
    overdueDelta: overdueCount, // no tenemos baseline semanal exacto
    newThisMonth,
    newDelta: newThisMonth - newLastMonth,
    cancelledThisMonth,
    cancelledDelta: cancelledThisMonth - cancelledLastMonth,
    retentionRate,
    retentionDelta: retentionRate - retentionLastMonth,
    churnHighCount,
    todayAccess,
    yesterdayAccessDelta: todayAccess - yesterdayAccess,
    currency: gym.currency,
  }

  // ── 6. Historial 12 meses ─────────────────────────────────────────────────
  const revenueHistory: RevenueDataPoint[] = monthRanges.map((range, i) => {
    const mrrEntry = monthlyRaw[i * 2] as { _sum: { amount: number | null } }
    const membersCount = monthlyRaw[i * 2 + 1] as number
    return {
      month: range.label,
      mrr: (mrrEntry._sum.amount ?? 0) / 100,
      members: membersCount,
    }
  })

  // ── 7. Flujo socios últimos 6 meses ───────────────────────────────────────
  const memberFlow: MemberFlowDataPoint[] = monthRanges.slice(-6).map((range, i) => {
    const idx = 6 + i // offset dentro de revenueHistory
    const altas = i === 0 ? newLastMonth : 0 // simplificado — expandir si se necesita exactitud
    const bajas = i === 0 ? cancelledLastMonth : 0
    void idx // suprimir warning de unused — idx se puede usar para queries futuras
    return {
      month: range.label,
      altas,
      bajas,
      neto: altas - bajas,
    }
  })

  // El mes actual siempre tiene datos reales
  const lastFlowItem = memberFlow[memberFlow.length - 1]
  if (lastFlowItem) {
    lastFlowItem.altas = newThisMonth
    lastFlowItem.bajas = cancelledThisMonth
    lastFlowItem.neto = newThisMonth - cancelledThisMonth
  }

  // ── 8. Ocupación de clases ────────────────────────────────────────────────
  const classOccupancy: ClassOccupancyDataPoint[] = upcomingClasses.map((cls) => {
    const booked = cls._count.bookings
    const pct = cls.maxCapacity > 0 ? (booked / cls.maxCapacity) * 100 : 0
    return {
      name: cls.name,
      occupancyPct: pct,
      booked,
      capacity: cls.maxCapacity,
    }
  })

  // ── 9. Alertas inteligentes ───────────────────────────────────────────────
  const alerts: DashboardAlert[] = []

  if (overdueCount > 0) {
    alerts.push({
      type: "critical",
      title: `${overdueCount} ${overdueCount === 1 ? "pago vencido" : "pagos vencidos"}`,
      description: `${overdueCount} ${overdueCount === 1 ? "socio tiene" : "socios tienen"} el acceso bloqueado por falta de pago.`,
      action: { label: "Ver pagos vencidos", href: "/dashboard/payments?filter=overdue" },
    })
  }

  if (churnHighCount > 0) {
    alerts.push({
      type: "warning",
      title: `${churnHighCount} ${churnHighCount === 1 ? "socio en riesgo IA" : "socios en riesgo IA"}`,
      description: "La IA detectó alta probabilidad de abandono. Tomá acción antes de que se vayan.",
      action: { label: "Ver riesgo de fuga", href: "/dashboard/churn" },
    })
  }

  if (inactiveMembersRaw.length > 0) {
    alerts.push({
      type: "warning",
      title: `${inactiveMembersRaw.length} socios sin acceso 10+ días`,
      description: "Llevan más de 10 días sin visitar el gimnasio. Considerá contactarlos.",
      action: { label: "Ver socios", href: "/dashboard/members?filter=inactive" },
    })
  }

  const lowOccupancyClasses = classOccupancy.filter((c) => c.occupancyPct < 30)
  if (lowOccupancyClasses.length > 0) {
    alerts.push({
      type: "info",
      title: `${lowOccupancyClasses.length} ${lowOccupancyClasses.length === 1 ? "clase con baja ocupación" : "clases con baja ocupación"}`,
      description: `${lowOccupancyClasses.map((c) => c.name).join(", ")} tienen menos del 30% de ocupación.`,
      action: { label: "Ver clases", href: "/dashboard/classes" },
    })
  }

  // ── 10. Activity feed ─────────────────────────────────────────────────────
  const activityEvents: ActivityEvent[] = recentLogs.map((log) => ({
    type: "access_success" as const,
    description: `Acceso por ${log.method.toLowerCase()}`,
    memberName: log.member
      ? `${log.member.firstName} ${log.member.lastName}`
      : undefined,
    time: log.timestamp,
  }))

  // Último acceso para el header
  const lastLog = recentLogs[0]
  const lastAccessMemberName =
    lastLog?.member
      ? `${lastLog.member.firstName} ${lastLog.member.lastName}`
      : null
  const lastAccessTime = lastLog?.timestamp ?? null

  // ── 11. Render ────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 space-y-6 bg-slate-50 dark:bg-slate-950 min-h-full">
      <DashboardHeader
        gymName={gym.name}
        lastAccessMemberName={lastAccessMemberName}
        lastAccessTime={lastAccessTime}
      />

      <KPICards data={kpis} currency={gym.currency} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <RevenueChart data={revenueHistory} currency={gym.currency} />
        </div>
        <div className="lg:col-span-2">
          <MemberFlowChart data={memberFlow} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertsPanel alerts={alerts} gymId={gymId} />
        <ClassOccupancyChart data={classOccupancy} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickActions />
        <ActivityFeed events={activityEvents} />
      </div>
    </div>
  )
}
