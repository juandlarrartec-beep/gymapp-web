import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db, RoutineDay } from "@/lib/db"
import { getGymId, ok, err } from "@/lib/db"
import type { ApiResponse } from "@/lib/db"
import { z } from "zod"

const createRoutineSchema = z.object({
  name: z.string().min(2).max(150),
  description: z.string().optional().nullable(),
  trainerId: z.string(),
  day: z.nativeEnum(RoutineDay).optional().nullable(),
  isTemplate: z.boolean().optional().default(false),
  exercises: z.array(
    z.object({
      exerciseId: z.string(),
      order: z.number().int().positive(),
      sets: z.number().int().positive(),
      reps: z.number().int().positive().optional().nullable(),
      durationSec: z.number().int().positive().optional().nullable(),
      restSec: z.number().int().default(60),
      weightKg: z.number().positive().optional().nullable(),
      notes: z.string().optional().nullable(),
    })
  ).optional().default([]),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ gymId: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json(err("No autenticado"), { status: 401 })

  const { gymId } = await params
  const callerGymId = await getGymId().catch(() => null)
  if (callerGymId !== gymId) return NextResponse.json(err("Sin acceso"), { status: 403 })

  const searchParams = req.nextUrl.searchParams
  const trainerId = searchParams.get("trainerId")
  const isTemplate = searchParams.get("isTemplate") === "true"

  const routines = await db.routine.findMany({
    where: {
      gymId,
      ...(trainerId ? { trainerId } : {}),
      ...(isTemplate ? { isTemplate: true } : {}),
    },
    include: {
      trainer: { select: { firstName: true, lastName: true } },
      exercises: {
        include: { exercise: { select: { name: true, muscleGroups: true } } },
        orderBy: { order: "asc" },
      },
      _count: { select: { assignments: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(ok(routines))
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ gymId: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json(err("No autenticado"), { status: 401 })

  const { gymId } = await params
  const callerGymId = await getGymId().catch(() => null)
  if (callerGymId !== gymId) return NextResponse.json(err("Sin acceso"), { status: 403 })

  const body = await req.json()
  const parsed = createRoutineSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(err(parsed.error.errors[0]?.message ?? "Datos inválidos"), { status: 400 })
  }

  const data = parsed.data

  // Verificar que el trainer pertenece al gym
  const trainer = await db.trainer.findFirst({ where: { id: data.trainerId, gymId } })
  if (!trainer) return NextResponse.json(err("Trainer no encontrado en este gym"), { status: 400 })

  const routine = await db.routine.create({
    data: {
      gymId,
      name: data.name,
      description: data.description ?? null,
      trainerId: data.trainerId,
      day: data.day ?? null,
      isTemplate: data.isTemplate,
      exercises: {
        create: data.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          order: ex.order,
          sets: ex.sets,
          reps: ex.reps ?? null,
          durationSec: ex.durationSec ?? null,
          restSec: ex.restSec,
          weightKg: ex.weightKg ?? null,
          notes: ex.notes ?? null,
        })),
      },
    },
    include: {
      exercises: {
        include: { exercise: { select: { name: true } } },
        orderBy: { order: "asc" },
      },
    },
  })

  return NextResponse.json(ok(routine), { status: 201 })
}
