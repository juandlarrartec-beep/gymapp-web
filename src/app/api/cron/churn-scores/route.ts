import { MemberStatus, PaymentStatus, BookingStatus } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { calculateChurnScore } from "@/lib/churn/score"
import type { ApiResponse } from "@/lib/db"
import { subDays, differenceInDays } from "date-fns"

// Cron diario 6am — calcular churn scores para todos los socios activos
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ data: null, error: "No autorizado" }, { status: 401 })
  }

  const now = new Date()
  const ninetyDaysAgo = subDays(now, 90)
  const thirtyDaysAgo = subDays(now, 30)
  const prevMonthStart = subDays(now, 60)

  // Obtener todos los socios activos de todos los gyms
  const members = await db.member.findMany({
    where: { status: MemberStatus.ACTIVE },
    select: {
      id: true,
      gymId: true,
      startDate: true,
      gym: { select: { id: true } },
    },
  })

  let processed = 0
  let highRiskNew = 0
  const errors: string[] = []

  for (const member of members) {
    try {
      // Calcular factors en paralelo
      const [lastAccess, failedPayments, thisMonthAccess, prevMonthAccess, noShows] =
        await Promise.all([
          db.accessLog.findFirst({
            where: { memberId: member.id, gymId: member.gymId, success: true },
            orderBy: { timestamp: "desc" },
            select: { timestamp: true },
          }),
          db.payment.count({
            where: {
              memberId: member.id,
              gymId: member.gymId,
              status: PaymentStatus.FAILED,
              createdAt: { gte: ninetyDaysAgo },
            },
          }),
          db.accessLog.count({
            where: {
              memberId: member.id,
              gymId: member.gymId,
              success: true,
              timestamp: { gte: thirtyDaysAgo },
            },
          }),
          db.accessLog.count({
            where: {
              memberId: member.id,
              gymId: member.gymId,
              success: true,
              timestamp: { gte: prevMonthStart, lt: thirtyDaysAgo },
            },
          }),
          db.classBooking.count({
            where: {
              memberId: member.id,
              gymId: member.gymId,
              status: BookingStatus.NO_SHOW,
              bookedAt: { gte: ninetyDaysAgo },
            },
          }),
        ])

      const daysSinceLastVisit = lastAccess
        ? differenceInDays(now, lastAccess.timestamp)
        : differenceInDays(now, member.startDate)

      // Tasa de caída de asistencia: (prev - current) / prev * 100
      const attendanceDropRate =
        prevMonthAccess > 0
          ? Math.max(0, ((prevMonthAccess - thisMonthAccess) / prevMonthAccess) * 100)
          : 0

      const membershipAgeDays = differenceInDays(now, member.startDate)

      const result = calculateChurnScore({
        daysSinceLastVisit,
        paymentFailCount: failedPayments,
        attendanceDropRate,
        appInactiveDays: daysSinceLastVisit, // proxy: usamos días sin visita como inactividad de app
        classNoShowCount: noShows,
        membershipAgeDays,
      })

      // Obtener score anterior para detectar cambio a HIGH
      const previousScore = await db.churnScore.findUnique({
        where: { memberId: member.id },
        select: { riskLevel: true },
      })

      const wasHigh = previousScore?.riskLevel === "HIGH"
      const isNowHigh = result.riskLevel === "HIGH"
      const newlyHigh = !wasHigh && isNowHigh

      if (newlyHigh) highRiskNew++

      // Upsert en ChurnScore
      await db.churnScore.upsert({
        where: { memberId: member.id },
        create: {
          gymId: member.gymId,
          memberId: member.id,
          daysSinceLastVisit,
          attendanceDropRate,
          paymentFailCount: failedPayments,
          appInactiveDays: daysSinceLastVisit,
          classNoShowCount: noShows,
          membershipAgeDays,
          riskLevel: result.riskLevel,
          riskScore: result.riskScore,
          suggestedAction: result.suggestedAction,
          calculatedAt: now,
          updatedAt: now,
        },
        update: {
          daysSinceLastVisit,
          attendanceDropRate,
          paymentFailCount: failedPayments,
          appInactiveDays: daysSinceLastVisit,
          classNoShowCount: noShows,
          membershipAgeDays,
          riskLevel: result.riskLevel,
          riskScore: result.riskScore,
          suggestedAction: result.suggestedAction,
          calculatedAt: now,
          updatedAt: now,
        },
      })

      // Si cambió a HIGH → notificar al dueño del gym via push
      if (newlyHigh) {
        const gymPushTokens = await db.pushToken.findMany({
          where: { gymId: member.gymId, memberId: null, isActive: true },
          select: { token: true },
          take: 5,
        })
        for (const pt of gymPushTokens) {
          // TODO: enviar push al dueño del gym via Firebase Admin SDK
          void pt
        }
      }

      processed++
    } catch (e) {
      errors.push(`Member ${member.id}: ${e instanceof Error ? e.message : "Error"}`)
    }
  }

  return NextResponse.json({
    data: { processed, highRiskNew, errors: errors.slice(0, 10) },
    error: null,
  })
}
