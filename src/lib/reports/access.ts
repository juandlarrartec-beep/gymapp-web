import { AccessMethod } from "@prisma/client"
import { db } from "@/lib/db"

export interface AccessReport {
  totalAccesses: number
  successRate: number
  byHour: Array<{ hour: number; count: number }>
  byMethod: Record<AccessMethod, number>
  failedByReason: Array<{ reason: string; count: number }>
  uniqueMembers: number
  avgVisitsPerMember: number
}

// seatId opcional: filtra AccessLog por lector NFC de esa sede
export async function getAccessReport(
  gymId: string,
  from: Date,
  to: Date,
  seatId?: string
): Promise<AccessReport> {
  let deviceInfoFilter: string | undefined
  if (seatId) {
    const seat = await db.gymSeat.findFirst({
      where: { id: seatId, gymId },
      select: { nfcReaderId: true },
    })
    deviceInfoFilter = seat?.nfcReaderId ?? undefined
  }

  const logs = await db.accessLog.findMany({
    where: {
      gymId,
      timestamp: { gte: from, lte: to },
      ...(deviceInfoFilter ? { deviceInfo: deviceInfoFilter } : {}),
    },
    select: {
      success: true,
      method: true,
      failReason: true,
      timestamp: true,
      memberId: true,
    },
  })

  const totalAccesses = logs.length
  const successCount = logs.filter((l) => l.success).length
  const successRate = totalAccesses > 0 ? (successCount / totalAccesses) * 100 : 0
  const uniqueMembers = new Set(logs.map((l) => l.memberId)).size
  const avgVisitsPerMember = uniqueMembers > 0 ? successCount / uniqueMembers : 0

  // Por hora (0-23)
  const hourCounts: Record<number, number> = {}
  for (let h = 0; h < 24; h++) hourCounts[h] = 0
  for (const log of logs.filter((l) => l.success)) {
    const hour = log.timestamp.getHours()
    hourCounts[hour] = (hourCounts[hour] ?? 0) + 1
  }
  const byHour = Object.entries(hourCounts).map(([h, count]) => ({
    hour: parseInt(h),
    count,
  }))

  // Por método
  const byMethod: Record<AccessMethod, number> = {
    QR: 0,
    NFC: 0,
    MANUAL: 0,
  }
  for (const log of logs) {
    byMethod[log.method] = (byMethod[log.method] ?? 0) + 1
  }

  // Fallos por razón
  const failReasonCounts: Record<string, number> = {}
  for (const log of logs.filter((l) => !l.success && l.failReason)) {
    const reason = log.failReason ?? "UNKNOWN"
    failReasonCounts[reason] = (failReasonCounts[reason] ?? 0) + 1
  }
  const failedByReason = Object.entries(failReasonCounts)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)

  return {
    totalAccesses,
    successRate,
    byHour,
    byMethod,
    failedByReason,
    uniqueMembers,
    avgVisitsPerMember,
  }
}
