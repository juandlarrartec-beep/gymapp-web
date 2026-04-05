import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db, RoutineDay } from "@/lib/db"
import { getGymId, ok, err } from "@/lib/db"
import type { ApiResponse } from "@/lib/db"
import { z } from "zod"

const updateRoutineSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  description: z.string().optional().nullable(),
  day: z.nativeEnum(RoutineDay).optional().nullable(),
  isTemplate: z.boolean().optional(),
})

async function verifyAccess(gymId: string): Promise<boolean> {
  const callerGymId = await getGymId().catch(() => null)
  return callerGymId === gymId
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ gymId: string; routineId: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json(err("No autenticado"), { status: 401 })

  const { gymId, routineId } = await params
  if (!(await verifyAccess(gymId))) return NextResponse.json(err("Sin acceso"), { status: 403 })

  const routine = await db.routine.findFirst({
    where: { id: routineId, gymId },
    include: {
      trainer: { select: { firstName: true, lastName: true } },
      exercises: {
        include: { exercise: true },
        orderBy: { order: "asc" },
      },
      assignments: {
        where: { isActive: true },
        include: { member: { select: { firstName: true, lastName: true } } },
      },
    },
  })

  if (!routine) return NextResponse.json(err("Rutina no encontrada"), { status: 404 })

  return NextResponse.json(ok(routine))
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ gymId: string; routineId: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json(err("No autenticado"), { status: 401 })

  const { gymId, routineId } = await params
  if (!(await verifyAccess(gymId))) return NextResponse.json(err("Sin acceso"), { status: 403 })

  const existing = await db.routine.findFirst({ where: { id: routineId, gymId } })
  if (!existing) return NextResponse.json(err("Rutina no encontrada"), { status: 404 })

  const body = await req.json()
  const parsed = updateRoutineSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(err(parsed.error.errors[0]?.message ?? "Datos inválidos"), { status: 400 })
  }

  const updated = await db.routine.update({
    where: { id: routineId },
    data: parsed.data,
  })

  return NextResponse.json(ok(updated))
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ gymId: string; routineId: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json(err("No autenticado"), { status: 401 })

  const { gymId, routineId } = await params
  if (!(await verifyAccess(gymId))) return NextResponse.json(err("Sin acceso"), { status: 403 })

  const existing = await db.routine.findFirst({ where: { id: routineId, gymId } })
  if (!existing) return NextResponse.json(err("Rutina no encontrada"), { status: 404 })

  await db.routine.delete({ where: { id: routineId } })

  return NextResponse.json(ok({ deleted: true }))
}
