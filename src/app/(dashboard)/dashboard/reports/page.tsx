import { requireGymScope, db } from "@/lib/db"
import { subMonths, startOfMonth, endOfMonth, subDays, format } from "date-fns"
import { es } from "date-fns/locale"
import { getFinancialReport } from "@/lib/reports/financial"
import { getMembersReport } from "@/lib/reports/members"
import { getAttendanceReport } from "@/lib/reports/attendance"
import { getAccessReport } from "@/lib/reports/access"
import { ReportsClient } from "@/components/reports/ReportsClient"
import type { FinancialReport } from "@/lib/reports/financial"
import type { MembersReport } from "@/lib/reports/members"
import type { AttendanceReport } from "@/lib/reports/attendance"
import type { AccessReport } from "@/lib/reports/access"

// Datos de los últimos 12 meses para gráficos de tendencia
interface MonthlyFinancial {
  month: string
  succeeded: number
  failed: number
  count: number
}

interface MonthlyMembers {
  month: string
  active: number
  new: number
  cancelled: number
}

export interface ReportsData {
  financial: FinancialReport
  financialTrend: MonthlyFinancial[]
  members: MembersReport
  membersTrend: MonthlyMembers[]
  attendance: AttendanceReport
  access: AccessReport
  accessRecent: Array<{
    id: string
    memberName: string
    method: string
    success: boolean
    failReason: string | null
    timestamp: string
  }>
}

export default async function ReportsPage() {
  const { gymId } = await requireGymScope()

  const now = new Date()
  const from30 = subDays(now, 30)
  const from12m = subMonths(now, 12)

  // Tendencia financiera: 12 meses
  const financialTrendPromises = Array.from({ length: 12 }, (_, i) => {
    const month = subMonths(now, 11 - i)
    const start = startOfMonth(month)
    const end = endOfMonth(month)
    const label = format(month, "MMM yy", { locale: es })
    return Promise.all([
      db.payment.aggregate({
        where: { gymId, status: "SUCCEEDED", createdAt: { gte: start, lte: end } },
        _sum: { amount: true },
        _count: true,
      }),
      db.payment.aggregate({
        where: { gymId, status: "FAILED", createdAt: { gte: start, lte: end } },
        _count: true,
      }),
    ]).then(([succeeded, failed]) => ({
      month: label,
      succeeded: (succeeded._sum.amount ?? 0) / 100,
      failed: failed._count,
      count: succeeded._count,
    }))
  })

  // Tendencia socios: 12 meses
  const membersTrendPromises = Array.from({ length: 12 }, (_, i) => {
    const month = subMonths(now, 11 - i)
    const start = startOfMonth(month)
    const end = endOfMonth(month)
    const label = format(month, "MMM yy", { locale: es })
    return Promise.all([
      db.member.count({ where: { gymId, status: "ACTIVE", createdAt: { lte: end } } }),
      db.member.count({ where: { gymId, createdAt: { gte: start, lte: end } } }),
      db.member.count({
        where: { gymId, cancellationDate: { gte: start, lte: end } },
      }),
    ]).then(([active, newM, cancelled]) => ({
      month: label,
      active,
      new: newM,
      cancelled,
    }))
  })

  // Últimos 100 accesos para tabla
  const recentAccessLogsPromise = db.accessLog.findMany({
    where: { gymId },
    include: { member: { select: { firstName: true, lastName: true } } },
    orderBy: { timestamp: "desc" },
    take: 100,
  })

  const [
    financialTrendRaw,
    membersTrendRaw,
    financial,
    members,
    attendance,
    access,
    recentLogs,
  ] = await Promise.all([
    Promise.all(financialTrendPromises),
    Promise.all(membersTrendPromises),
    getFinancialReport(gymId, from12m, now),
    getMembersReport(gymId, from30, now),
    getAttendanceReport(gymId, from30, now),
    getAccessReport(gymId, from30, now),
    recentAccessLogsPromise,
  ])

  const accessRecent = recentLogs.map((log) => ({
    id: log.id,
    memberName: `${log.member.firstName} ${log.member.lastName}`,
    method: log.method,
    success: log.success,
    failReason: log.failReason,
    timestamp: log.timestamp.toISOString(),
  }))

  const data: ReportsData = {
    financial,
    financialTrend: financialTrendRaw,
    members,
    membersTrend: membersTrendRaw,
    attendance,
    access,
    accessRecent,
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Reportes</h1>
          <p className="text-sm text-slate-400 mt-1">Últimos 30 días · actualizado ahora</p>
        </div>
      </div>
      <ReportsClient data={data} gymId={gymId} />
    </div>
  )
}
