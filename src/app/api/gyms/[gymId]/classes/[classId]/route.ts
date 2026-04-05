import { ClassStatus } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { getGymId, ok, err } from "@/lib/db"
import type { ApiResponse } from "@/lib/db"
import { z } from "zod"

const updateClassSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  description: z.string().optional().nullable(),
  trainerId: z.string().optional().nullable(),
  maxCapacity: z.number().int().positive().optional(),
  durationMin: z.number().int().positive().optional(),
  location: z.string().optional().nullable(),
  startTime: z.string().optional(),
  status: z.nativeEnum(ClassStatus).optional(),
  cancelReason: z.string().optional().nullable(),
})

async function verifyAccess(gymId: string): Promise<boolean> {
  const callerGymId = await getGymId().catch(() => null)
  return callerGymId === gymId
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ gymId: string; classId: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json(err("No autenticado"), { status: 401 })

  const { gymId, classId } = await params
  if (!(await verifyAccess(gymId))) return NextResponse.json(err("Sin acceso"), { status: 403 })

  const classSchedule = await db.classSchedule.findFirst({
    where: { id: classId, gymId },
    include: {
      trainer: { select: { firstName: true, lastName: true } },
      bookings: {
        include: {
          member: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { bookedAt: "asc" },
      },
    },
  })

  if (!classSchedule) return NextResponse.json(err("Clase no encontrada"), { status: 404 })

  return NextResponse.json(ok(classSchedule))
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ gymId: string; classId: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json(err("No autenticado"), { status: 401 })

  const { gymId, classId } = await params
  if (!(await verifyAccess(gymId))) return NextResponse.json(err("Sin acceso"), { status: 403 })

  const existing = await db.classSchedule.findFirst({ where: { id: classId, gymId } })
  if (!existing) return NextResponse.json(err("Clase no encontrada"), { status: 404 })

  const body = await req.json()
  const parsed = updateClassSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(err(parsed.error.errors[0]?.message ?? "Datos inválidos"), { status: 400 })
  }

  const data = parsed.data
  const updated = await db.classSchedule.update({
    where: { id: classId },
    data: {
      ...data,
      ...(data.startTime ? { startTime: new Date(data.startTime) } : {}),
    },
  })

  return NextResponse.json(ok(updated))
}
