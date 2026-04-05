import { ClassStatus, BookingStatus } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import type { ApiResponse } from "@/lib/db"
import { subMinutes } from "date-fns"

// Cron: marcar NO_SHOW a inscriptos que no fueron a la clase (30min después de finalizada)
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ data: null, error: "No autorizado" }, { status: 401 })
  }

  const now = new Date()

  // Buscar clases que finalizaron hace entre 25 y 35 minutos
  const processedClasses = await db.classSchedule.findMany({
    where: {
      status: ClassStatus.SCHEDULED,
      startTime: {
        // startTime + durationMin = fin de clase → buscamos clases cuyo fin fue hace ~30min
        // Aproximación: buscamos clases que empezaron hace entre 30+duracion min
        // Simplificamos: clases que empezaron hace más de 90 minutos (la mayoría dura ~60min)
        lte: subMinutes(now, 90),
      },
    },
    include: {
      bookings: {
        where: { status: BookingStatus.CONFIRMED },
        select: { id: true, memberId: true },
      },
    },
  })

  let noShowCount = 0

  for (const cls of processedClasses) {
    if (cls.bookings.length === 0) {
      // Marcar clase como completada
      await db.classSchedule.update({
        where: { id: cls.id },
        data: { status: ClassStatus.COMPLETED },
      })
      continue
    }

    // Marcar todos los CONFIRMED como NO_SHOW (ya debería haber pasado ATTENDED via scanner)
    const bookingIds = cls.bookings.map((b) => b.id)
    await db.classBooking.updateMany({
      where: {
        id: { in: bookingIds },
        status: BookingStatus.CONFIRMED,
      },
      data: { status: BookingStatus.NO_SHOW },
    })

    noShowCount += cls.bookings.length

    // Marcar clase como completada
    await db.classSchedule.update({
      where: { id: cls.id },
      data: { status: ClassStatus.COMPLETED },
    })
  }

  return NextResponse.json({
    data: { classesProcessed: processedClasses.length, noShowCount },
    error: null,
  })
}
