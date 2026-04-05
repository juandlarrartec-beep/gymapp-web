"use server"

import { revalidatePath } from "next/cache"
import { db, RoutineDay } from "@/lib/db"
import { requireGymScope } from "@/lib/db"
import type { ApiResponse } from "@/lib/db"

export async function createRoutine(params: {
  name: string
  description?: string | null
  trainerId: string
  day?: RoutineDay | null
  isTemplate?: boolean
  exercises: Array<{
    exerciseId: string
    order: number
    sets: number
    reps?: number | null
    durationSec?: number | null
    restSec?: number
    weightKg?: number | null
    notes?: string | null
  }>
}): Promise<ApiResponse<unknown>> {
  try {
    const { gymId } = await requireGymScope()

    const trainer = await db.trainer.findFirst({ where: { id: params.trainerId, gymId } })
    if (!trainer) return { data: null, error: "Trainer no pertenece a este gym" }

    const routine = await db.routine.create({
      data: {
        gymId,
        name: params.name,
        description: params.description ?? null,
        trainerId: params.trainerId,
        day: params.day ?? null,
        isTemplate: params.isTemplate ?? false,
        exercises: {
          create: params.exercises.map((ex) => ({
            exerciseId: ex.exerciseId,
            order: ex.order,
            sets: ex.sets,
            reps: ex.reps ?? null,
            durationSec: ex.durationSec ?? null,
            restSec: ex.restSec ?? 60,
            weightKg: ex.weightKg ?? null,
            notes: ex.notes ?? null,
          })),
        },
      },
    })

    revalidatePath(`/dashboard/training`)
    return { data: routine, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Error interno" }
  }
}

export async function assignRoutine(memberId: string, routineId: string, validUntil?: Date): Promise<ApiResponse<unknown>> {
  try {
    const { gymId } = await requireGymScope()

    const [member, routine] = await Promise.all([
      db.member.findFirst({ where: { id: memberId, gymId } }),
      db.routine.findFirst({ where: { id: routineId, gymId } }),
    ])

    if (!member) return { data: null, error: "Socio no encontrado" }
    if (!routine) return { data: null, error: "Rutina no encontrada" }

    // Desactivar asignaciones anteriores
    await db.routineAssignment.updateMany({
      where: { gymId, memberId, isActive: true },
      data: { isActive: false },
    })

    const assignment = await db.routineAssignment.create({
      data: {
        gymId,
        memberId,
        routineId,
        validUntil: validUntil ?? null,
        isActive: true,
      },
    })

    revalidatePath(`/dashboard/members/${memberId}`)
    revalidatePath(`/dashboard/training`)
    return { data: assignment, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Error interno" }
  }
}

export async function updateRoutineExercise(
  routineExerciseId: string,
  updates: {
    sets?: number
    reps?: number | null
    durationSec?: number | null
    restSec?: number
    weightKg?: number | null
    notes?: string | null
    order?: number
  }
): Promise<ApiResponse<unknown>> {
  try {
    const { gymId } = await requireGymScope()

    // Verificar que el ejercicio de rutina pertenece a una rutina del gym
    const routineExercise = await db.routineExercise.findFirst({
      where: { id: routineExerciseId },
      include: { routine: { select: { gymId: true } } },
    })

    if (!routineExercise || routineExercise.routine.gymId !== gymId) {
      return { data: null, error: "Ejercicio no encontrado" }
    }

    const updated = await db.routineExercise.update({
      where: { id: routineExerciseId },
      data: updates,
    })

    revalidatePath(`/dashboard/training`)
    return { data: updated, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Error interno" }
  }
}
