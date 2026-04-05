import { MemberStatus, ClassStatus, BookingStatus } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { getGymId, ok, err } from "@/lib/db"
import type { ApiResponse } from "@/lib/db"
import { notifyBookingConfirmed } from "@/lib/notifications/booking"
import { z } from "zod"
import { differenceInHours } from "date-fns"

const bookSchema = z.object({
  memberId: z.string(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ gymId: string; classId: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json(err("No autenticado"), { status: 401 })

  const { gymId, classId } = await params
  const callerGymId = await getGymId().catch(() => null)
  if (callerGymId !== gymId) return NextResponse.json(err("Sin acceso"), { status: 403 })

  const body = await req.json()
  const parsed = bookSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json(err("memberId requerido"), { status: 400 })

  const { memberId } = parsed.data

  // Verificar que el miembro pertenece al gym y está activo
  const member = await db.member.findFirst({
    where: { id: memberId, gymId, status: MemberStatus.ACTIVE },
  })
  if (!member) return NextResponse.json(err("Socio no encontrado o suspendido"), { status: 400 })

  // Verificar que la clase existe y está programada
  const classSchedule = await db.classSchedule.findFirst({
    where: { id: classId, gymId, status: ClassStatus.SCHEDULED },
    include: {
      bookings: {
        where: { status: { in: [BookingStatus.CONFIRMED] } },
        select: { id: true },
      },
    },
  })
  if (!classSchedule) return NextResponse.json(err("Clase no disponible"), { status: 404 })

  // Verificar cupo
  if (classSchedule.bookings.length >= classSchedule.maxCapacity) {
    return NextResponse.json(err("La clase está llena"), { status: 409 })
  }

  // Verificar que no está ya inscripto
  const existingBooking = await db.classBooking.findFirst({
    where: { classScheduleId: classId, memberId, gymId },
  })
  if (existingBooking && existingBooking.status === BookingStatus.CONFIRMED) {
    return NextResponse.json(err("Ya está inscripto en esta clase"), { status: 409 })
  }

  // Si tenía una reserva cancelada, reactivarla; sino crear nueva
  let booking
  if (existingBooking) {
    booking = await db.classBooking.update({
      where: { id: existingBooking.id },
      data: { status: BookingStatus.CONFIRMED, cancelledAt: null },
    })
  } else {
    booking = await db.classBooking.create({
      data: {
        gymId,
        classScheduleId: classId,
        memberId,
        status: BookingStatus.CONFIRMED,
      },
    })
  }

  // Notificar confirmación por WhatsApp (fire-and-forget)
  const memberWithPhone = await db.member.findUnique({
    where: { id: memberId },
    select: { firstName: true, phone: true },
  })
  if (memberWithPhone) {
    void notifyBookingConfirmed(memberWithPhone, classSchedule)
  }

  return NextResponse.json(ok(booking), { status: 201 })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ gymId: string; classId: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json(err("No autenticado"), { status: 401 })

  const { gymId, classId } = await params
  const callerGymId = await getGymId().catch(() => null)
  if (callerGymId !== gymId) return NextResponse.json(err("Sin acceso"), { status: 403 })

  const body = await req.json()
  const parsed = bookSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json(err("memberId requerido"), { status: 400 })

  const { memberId } = parsed.data

  const booking = await db.classBooking.findFirst({
    where: { classScheduleId: classId, memberId, gymId, status: BookingStatus.CONFIRMED },
    include: { classSchedule: { select: { startTime: true } } },
  })
  if (!booking) return NextResponse.json(err("Reserva no encontrada"), { status: 404 })

  // Validar que faltan al menos 1 hora para la clase
  const hoursUntilClass = differenceInHours(booking.classSchedule.startTime, new Date())
  if (hoursUntilClass < 1) {
    return NextResponse.json(
      err("No se puede cancelar con menos de 1 hora de anticipación"),
      { status: 400 }
    )
  }

  const updated = await db.classBooking.update({
    where: { id: booking.id },
    data: {
      status: BookingStatus.CANCELLED,
      cancelledAt: new Date(),
    },
  })

  return NextResponse.json(ok(updated))
}
