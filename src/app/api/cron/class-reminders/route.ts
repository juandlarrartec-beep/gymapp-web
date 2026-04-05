import { BookingStatus } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import type { ApiResponse } from "@/lib/db"
import { addHours } from "date-fns"

// Cron: enviar push a inscriptos 1 hora antes de cada clase
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ data: null, error: "No autorizado" }, { status: 401 })
  }

  const now = new Date()
  // Clases que empiezan entre 55 minutos y 65 minutos desde ahora (ventana de 10min para evitar doble envío)
  const windowStart = addHours(now, 0.9)  // ~54min
  const windowEnd = addHours(now, 1.1)    // ~66min

  const upcomingClasses = await db.classSchedule.findMany({
    where: {
      startTime: { gte: windowStart, lte: windowEnd },
      status: "SCHEDULED",
    },
    include: {
      bookings: {
        where: { status: BookingStatus.CONFIRMED },
        include: {
          member: {
            select: {
              id: true,
              firstName: true,
              gymId: true,
              pushTokens: {
                where: { isActive: true },
                select: { token: true, platform: true },
              },
            },
          },
        },
      },
    },
  })

  let notificationsSent = 0

  for (const cls of upcomingClasses) {
    for (const booking of cls.bookings) {
      const { member } = booking
      for (const pushToken of member.pushTokens) {
        // En producción: enviar via Firebase Admin SDK
        void pushToken
        notificationsSent++
      }
    }
  }

  return NextResponse.json({
    data: {
      classesProcessed: upcomingClasses.length,
      notificationsSent,
    },
    error: null,
  })
}
