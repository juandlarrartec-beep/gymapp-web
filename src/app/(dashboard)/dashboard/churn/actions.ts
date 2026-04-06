"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireGymScope } from "@/lib/db"
import { calculateChurnScore } from "@/lib/churn/score"
import { differenceInDays } from "date-fns"
import type { ApiResponse } from "@/lib/db"

export async function recalculateChurnAction(): Promise<ApiResponse<{ updated: number }>> {
  try {
    const { gymId } = await requireGymScope()

    const members = await db.member.findMany({
      where: { gymId, status: "ACTIVE" },
      select: {
        id: true,
        createdAt: true,
        accessLogs: {
          orderBy: { timestamp: "desc" },
          take: 1,
          select: { timestamp: true },
        },
        payments: {
          where: {
            status: "FAILED",
            createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
          },
          select: { id: true },
        },
        classBookings: {
          where: { status: "NO_SHOW" },
          select: { id: true },
        },
      },
    })

    const now = new Date()

    // Para calcular attendanceDropRate necesitamos comparar mes actual vs anterior
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    const attendanceCurrentMonth = await db.accessLog.groupBy({
      by: ["memberId"],
      where: {
        gymId,
        timestamp: { gte: thirtyDaysAgo, lte: now },
        success: true,
      },
      _count: { id: true },
    })

    const attendancePrevMonth = await db.accessLog.groupBy({
      by: ["memberId"],
      where: {
        gymId,
        timestamp: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        success: true,
      },
      _count: { id: true },
    })

    const currentMap = new Map(attendanceCurrentMonth.map((r) => [r.memberId, r._count.id]))
    const prevMap = new Map(attendancePrevMonth.map((r) => [r.memberId, r._count.id]))

    const upserts = members.map(async (member) => {
      const lastVisit = member.accessLogs[0]?.timestamp
      const daysSinceLastVisit = lastVisit ? differenceInDays(now, new Date(lastVisit)) : 999

      const paymentFailCount = member.payments.length
      const classNoShowCount = member.classBookings.length
      const membershipAgeDays = differenceInDays(now, new Date(member.createdAt))

      // Calcular caída de asistencia
      const currentCount = currentMap.get(member.id) ?? 0
      const prevCount = prevMap.get(member.id) ?? 0
      const attendanceDropRate =
        prevCount > 0 ? Math.max(0, ((prevCount - currentCount) / prevCount) * 100) : 0

      const result = calculateChurnScore({
        daysSinceLastVisit,
        paymentFailCount,
        attendanceDropRate,
        appInactiveDays: daysSinceLastVisit, // proxy: días sin acceso = días sin usar app
        classNoShowCount,
        membershipAgeDays,
      })

      return db.churnScore.upsert({
        where: { memberId: member.id },
        create: {
          gymId,
          memberId: member.id,
          daysSinceLastVisit,
          paymentFailCount,
          attendanceDropRate,
          appInactiveDays: daysSinceLastVisit,
          classNoShowCount,
          membershipAgeDays,
          riskLevel: result.riskLevel,
          riskScore: result.riskScore,
          suggestedAction: result.suggestedAction,
          calculatedAt: now,
        },
        update: {
          daysSinceLastVisit,
          paymentFailCount,
          attendanceDropRate,
          appInactiveDays: daysSinceLastVisit,
          classNoShowCount,
          membershipAgeDays,
          riskLevel: result.riskLevel,
          riskScore: result.riskScore,
          suggestedAction: result.suggestedAction,
          calculatedAt: now,
        },
      })
    })

    await Promise.all(upserts)

    revalidatePath("/dashboard/churn")
    return { data: { updated: members.length }, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Error interno" }
  }
}

export async function dismissChurnAlert(memberId: string): Promise<ApiResponse<{ ok: boolean }>> {
  try {
    const { gymId } = await requireGymScope()

    const score = await db.churnScore.findFirst({ where: { memberId, gymId } })
    if (!score) return { data: null, error: "Score no encontrado" }

    await db.churnScore.update({
      where: { memberId },
      data: {
        riskLevel: "LOW",
        riskScore: 5,
        suggestedAction: "Alerta descartada manualmente.",
        calculatedAt: new Date(),
      },
    })

    revalidatePath("/dashboard/churn")
    return { data: { ok: true }, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Error interno" }
  }
}
