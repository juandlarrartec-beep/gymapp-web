import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { getGymId, ok, err } from "@/lib/db"
import type { ApiResponse } from "@/lib/db"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ gymId: string; memberId: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json(err("No autenticado"), { status: 401 })

  const { gymId, memberId } = await params
  const callerGymId = await getGymId().catch(() => null)
  if (callerGymId !== gymId) return NextResponse.json(err("Sin acceso"), { status: 403 })

  const member = await db.member.findFirst({ where: { id: memberId, gymId } })
  if (!member) return NextResponse.json(err("Socio no encontrado"), { status: 404 })

  const bookings = await db.classBooking.findMany({
    where: { memberId, gymId },
    include: {
      classSchedule: {
        select: {
          name: true,
          startTime: true,
          durationMin: true,
          location: true,
          trainer: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { classSchedule: { startTime: "desc" } },
    take: 50,
  })

  return NextResponse.json(ok(bookings))
}
