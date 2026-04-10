import { db } from "@/lib/db"
import { subMonths, startOfMonth, endOfMonth, subDays, format } from "date-fns"
import { es } from "date-fns/locale"
import { getFinancialReport } from "@/lib/reports/financial"
import { getMembersReport } from "@/lib/reports/members"
import { getAttendanceReport } from "@/lib/reports/attendance"
import { getAccessReport } from "@/lib/reports/access"
import { ReportsClient } from "@/components/reports/ReportsClient"
import type { ReportsData } from "@/app/(dashboard)/dashboard/reports/page"

export default async function DemoReportsPage() {
  const gymId = process.env.DEMO_GYM_ID!
  const now = new Date()
  const from30 = subDays(now, 30)
  const from12m = subMonths(now, 12)

  const financialTrendPromises = Array.from({ length: 12 }, (_, i) => {
    const month = subMonths(now, 11 - i)
    const start = startOfMonth(month)
    const end = endOfMonth(month)
    const label = format(month, "MMM yy", { locale: es })
    return Promise.all([
      db.payment.aggregate({ where: { gymId, status: "SUCCEEDED", createdAt: { gte: start, lte: end } }, _sum: { amount: true }, _count: true }),
      db.payment.aggregate({ where: { gymId, status: "FAILED", createdAt: { gte: start, lte: end } }, _count: true }),
    ]).then(([succeeded, failed]) => ({
      month: label,
      succeeded: (succeeded._sum.amount ?? 0) / 100,
      failed: failed._count,
      count: succeeded._count,
    }))
  })

  const membersTrendPromises = Array.from({ length: 12 }, (_, i) => {
    const month = subMonths(now, 11 - i)
    const start = startOfMonth(month)
    const end = endOfMonth(month)
    const label = format(month, "MMM yy", { locale: es })
    return Promise.all([
      db.member.count({ where: { gymId, status: "ACTIVE", createdAt: { lte: end } } }),
      db.member.count({ where: { gymId, createdAt: { gte: start, lte: end } } }),
      db.member.count({ where: { gymId, cancellationDate: { gte: start, lte: end } } }),
    ]).then(([active, newM, cancelled]) => ({ month: label, active, new: newM, cancelled }))
  })

  const [financialTrendRaw, membersTrendRaw, financial, members, attendance, access, recentLogs] = await Promise.all([
    Promise.all(financialTrendPromises),
    Promise.all(membersTrendPromises),
    getFinancialReport(gymId, from12m, now),
    getMembersReport(gymId, from30, now),
    getAttendanceReport(gymId, from30, now),
    getAccessReport(gymId, from30, now),
    db.accessLog.findMany({
      where: { gymId },
      include: { member: { select: { firstName: true, lastName: true } } },
      orderBy: { timestamp: "desc" },
      take: 100,
    }),
  ])

  const data: ReportsData = {
    financial,
    financialTrend: financialTrendRaw,
    members,
    membersTrend: membersTrendRaw,
    attendance,
    access,
    accessRecent: recentLogs.map((log) => ({
      id: log.id,
      memberName: `${log.member.firstName} ${log.member.lastName}`,
      method: log.method,
      success: log.success,
      failReason: log.failReason,
      timestamp: log.timestamp.toISOString(),
    })),
  }

  return (
    <div className="p-6 bg-slate-50 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reportes</h1>
          <p className="text-sm text-slate-500 mt-1">Análisis detallado del gimnasio</p>
        </div>
        <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-3 py-1.5 rounded-full">
          Modo Demo — solo lectura
        </span>
      </div>
      <ReportsClient data={data} gymId={gymId} />
    </div>
  )
}
