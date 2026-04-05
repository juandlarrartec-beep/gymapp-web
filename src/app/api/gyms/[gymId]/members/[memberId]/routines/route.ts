import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { getGymId, ok, err } from "@/lib/db"
import type { ApiResponse } from "@/lib/db"
import { z } from "zod"

const assignSchema = z.object({
  routineId: z.string(),
  validUntil: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ gymId: string; memberId: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json(err("No autenticado"), { status: 401 })

  const { gymId, memberId } = await params
  const callerGymId = await getGymId().catch(() => null)
  if (callerGymId !== gymId) return NextResponse.json(err("Sin acceso"), { status: 403 })

  const assignments = await db.routineAssignment.findMany({
    where: { gymId, memberId },
    include: {
      routine: {
        include: {
          exercises: {
            include: { exercise: { select: { name: true, muscleGroups: true } } },
            orderBy: { order: "asc" },
          },
          trainer: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { assignedAt: "desc" },
  })

  return NextResponse.json(ok(assignments))
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ gymId: string; memberId: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json(err("No autenticado"), { status: 401 })

  const { gymId, memberId } = await params
  const callerGymId = await getGymId().catch(() => null)
  if (callerGymId !== gymId) return NextResponse.json(err("Sin acceso"), { status: 403 })

  const member = await db.member.findFirst({ where: { id: memberId, gymId } })
  if (!member) return NextResponse.json(err("Socio no encontrado"), { status: 404 })

  const body = await req.json()
  const parsed = assignSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(err(parsed.error.errors[0]?.message ?? "Datos inválidos"), { status: 400 })
  }

  const data = parsed.data

  // Verificar que la rutina pertenece al gym
  const routine = await db.routine.findFirst({ where: { id: data.routineId, gymId } })
  if (!routine) return NextResponse.json(err("Rutina no encontrada en este gym"), { status: 400 })

  // Desactivar asignaciones anteriores activas si es necesario
  await db.routineAssignment.updateMany({
    where: { gymId, memberId, isActive: true },
    data: { isActive: false },
  })

  const assignment = await db.routineAssignment.create({
    data: {
      gymId,
      memberId,
      routineId: data.routineId,
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      notes: data.notes ?? null,
      isActive: true,
    },
    include: {
      routine: { select: { name: true } },
    },
  })

  return NextResponse.json(ok(assignment), { status: 201 })
}
