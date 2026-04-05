import { db } from "@/lib/db"
import { subDays } from "date-fns"

export type AttendanceHeatmap = Record<string, Record<string, number>>
// { "MONDAY": { "8": 15, "9": 22, ... }, ... }

export interface AttendanceReport {
  heatmap: AttendanceHeatmap
  totalVisits: number
  uniqueVisitors: number
  absentMembers7d: number
  absentMembers14d: number
  absentMembers30d: number
  peakHour: string
  peakDay: string
}

// seatId opcional: filtra AccessLog por lector NFC de esa sede
export async function getAttendanceReport(
  gymId: string,
  from: Date,
  to: Date,
  seatId?: string
): Promise<AttendanceReport> {
  const now = new Date()

  // Si se filtra por sede, obtener el nfcReaderId de esa sede para filtrar por deviceInfo
  let deviceInfoFilter: string | undefined
  if (seatId) {
    const seat = await db.gymSeat.findFirst({
      where: { id: seatId, gymId },
      select: { nfcReaderId: true },
    })
    deviceInfoFilter = seat?.nfcReaderId ?? undefined
  }

  const baseWhere = {
    gymId,
    success: true,
    timestamp: { gte: from, lte: to },
    ...(deviceInfoFilter ? { deviceInfo: deviceInfoFilter } : {}),
  }

  const logs = await db.accessLog.findMany({
    where: baseWhere,
    select: { timestamp: true, memberId: true },
  })

  const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]

  // Construir heatmap
  const heatmap: AttendanceHeatmap = {}
  let peakCount = 0
  let peakHour = "0"
  let peakDay = "MONDAY"

  for (const log of logs) {
    const day = dayNames[log.timestamp.getDay()] ?? "MONDAY"
    const hour = String(log.timestamp.getHours())

    if (!heatmap[day]) heatmap[day] = {}
    heatmap[day]![hour] = (heatmap[day]![hour] ?? 0) + 1

    const count = heatmap[day]![hour] ?? 0
    if (count > peakCount) {
      peakCount = count
      peakHour = hour
      peakDay = day
    }
  }

  const uniqueVisitors = new Set(logs.map((l) => l.memberId)).size

  // Socios ausentes
  const activeMembers = await db.member.findMany({
    where: { gymId, status: "ACTIVE" },
    select: { id: true },
  })

  const membersWithVisit7d = new Set(
    (await db.accessLog.findMany({
      where: {
        gymId,
        success: true,
        timestamp: { gte: subDays(now, 7) },
        ...(deviceInfoFilter ? { deviceInfo: deviceInfoFilter } : {}),
      },
      select: { memberId: true },
    })).map((l) => l.memberId)
  )

  const membersWithVisit14d = new Set(
    (await db.accessLog.findMany({
      where: {
        gymId,
        success: true,
        timestamp: { gte: subDays(now, 14) },
        ...(deviceInfoFilter ? { deviceInfo: deviceInfoFilter } : {}),
      },
      select: { memberId: true },
    })).map((l) => l.memberId)
  )

  const membersWithVisit30d = new Set(
    (await db.accessLog.findMany({
      where: {
        gymId,
        success: true,
        timestamp: { gte: subDays(now, 30) },
        ...(deviceInfoFilter ? { deviceInfo: deviceInfoFilter } : {}),
      },
      select: { memberId: true },
    })).map((l) => l.memberId)
  )

  const absentMembers7d = activeMembers.filter((m) => !membersWithVisit7d.has(m.id)).length
  const absentMembers14d = activeMembers.filter((m) => !membersWithVisit14d.has(m.id)).length
  const absentMembers30d = activeMembers.filter((m) => !membersWithVisit30d.has(m.id)).length

  return {
    heatmap,
    totalVisits: logs.length,
    uniqueVisitors,
    absentMembers7d,
    absentMembers14d,
    absentMembers30d,
    peakHour,
    peakDay,
  }
}
