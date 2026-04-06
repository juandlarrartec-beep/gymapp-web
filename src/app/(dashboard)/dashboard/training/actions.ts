"use server"

import { revalidatePath } from "next/cache"
import { db, RoutineDay } from "@/lib/db"
import { requireGymScope } from "@/lib/db"
import type { ApiResponse } from "@/lib/db"

// ─── Rutinas ────────────────────────────────────────────

export async function createRoutineAction(formData: FormData): Promise<ApiResponse<{ id: string }>> {
  try {
    const { gymId } = await requireGymScope()

    const name = formData.get("name") as string
    const trainerId = formData.get("trainerId") as string
    const day = (formData.get("day") as RoutineDay | null) || null
    const isTemplate = formData.get("isTemplate") === "true"

    if (!name?.trim()) return { data: null, error: "El nombre es obligatorio" }
    if (!trainerId) return { data: null, error: "El trainer es obligatorio" }

    const trainer = await db.trainer.findFirst({ where: { id: trainerId, gymId } })
    if (!trainer) return { data: null, error: "Trainer no pertenece a este gym" }

    const routine = await db.routine.create({
      data: {
        gymId,
        name: name.trim(),
        description: (formData.get("description") as string | null) || null,
        trainerId,
        day,
        isTemplate,
      },
      select: { id: true },
    })

    revalidatePath("/dashboard/training")
    return { data: { id: routine.id }, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Error interno" }
  }
}

export async function updateRoutineAction(
  routineId: string,
  formData: FormData
): Promise<ApiResponse<{ id: string }>> {
  try {
    const { gymId } = await requireGymScope()

    const existing = await db.routine.findFirst({ where: { id: routineId, gymId } })
    if (!existing) return { data: null, error: "Rutina no encontrada" }

    const name = (formData.get("name") as string | null)?.trim()
    const day = (formData.get("day") as RoutineDay | null) || null
    const isTemplate = formData.get("isTemplate") === "true"
    const description = (formData.get("description") as string | null) || null

    await db.routine.update({
      where: { id: routineId },
      data: {
        ...(name ? { name } : {}),
        description,
        day,
        isTemplate,
      },
    })

    revalidatePath("/dashboard/training")
    revalidatePath(`/dashboard/training/${routineId}`)
    return { data: { id: routineId }, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Error interno" }
  }
}

export async function deleteRoutineAction(routineId: string): Promise<ApiResponse<{ ok: boolean }>> {
  try {
    const { gymId } = await requireGymScope()

    const existing = await db.routine.findFirst({ where: { id: routineId, gymId } })
    if (!existing) return { data: null, error: "Rutina no encontrada" }

    await db.routine.delete({ where: { id: routineId } })

    revalidatePath("/dashboard/training")
    return { data: { ok: true }, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Error interno" }
  }
}

// ─── Ejercicios en rutina ────────────────────────────────

export async function addExerciseToRoutineAction(params: {
  routineId: string
  exerciseId: string
  sets: number
  reps?: number | null
  restSec?: number
  order: number
}): Promise<ApiResponse<{ id: string }>> {
  try {
    const { gymId } = await requireGymScope()

    const routine = await db.routine.findFirst({ where: { id: params.routineId, gymId } })
    if (!routine) return { data: null, error: "Rutina no encontrada" }

    const exercise = await db.exercise.findFirst({
      where: { id: params.exerciseId, OR: [{ gymId }, { gymId: null, isPublic: true }] },
    })
    if (!exercise) return { data: null, error: "Ejercicio no encontrado" }

    // Si ya existe un ejercicio con ese order, desplazar
    await db.routineExercise.updateMany({
      where: { routineId: params.routineId, order: { gte: params.order } },
      data: { order: { increment: 1 } },
    })

    const re = await db.routineExercise.create({
      data: {
        routineId: params.routineId,
        exerciseId: params.exerciseId,
        order: params.order,
        sets: params.sets,
        reps: params.reps ?? null,
        restSec: params.restSec ?? 60,
      },
      select: { id: true },
    })

    revalidatePath("/dashboard/training")
    revalidatePath(`/dashboard/training/${params.routineId}`)
    return { data: { id: re.id }, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Error interno" }
  }
}

export async function removeExerciseFromRoutineAction(
  routineExerciseId: string
): Promise<ApiResponse<{ ok: boolean }>> {
  try {
    const { gymId } = await requireGymScope()

    const re = await db.routineExercise.findFirst({
      where: { id: routineExerciseId },
      include: { routine: { select: { gymId: true, id: true } } },
    })

    if (!re || re.routine.gymId !== gymId) {
      return { data: null, error: "Ejercicio no encontrado" }
    }

    await db.routineExercise.delete({ where: { id: routineExerciseId } })

    revalidatePath("/dashboard/training")
    revalidatePath(`/dashboard/training/${re.routine.id}`)
    return { data: { ok: true }, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Error interno" }
  }
}

// ─── Asignaciones ────────────────────────────────────────

export async function assignRoutineToMemberAction(params: {
  routineId: string
  memberId: string
  startDate?: string | null
  validUntil?: string | null
  notes?: string | null
}): Promise<ApiResponse<{ id: string }>> {
  try {
    const { gymId } = await requireGymScope()

    const [member, routine] = await Promise.all([
      db.member.findFirst({ where: { id: params.memberId, gymId } }),
      db.routine.findFirst({ where: { id: params.routineId, gymId } }),
    ])

    if (!member) return { data: null, error: "Socio no encontrado" }
    if (!routine) return { data: null, error: "Rutina no encontrada" }

    // Desactivar asignaciones anteriores de esta misma rutina
    await db.routineAssignment.updateMany({
      where: { gymId, memberId: params.memberId, routineId: params.routineId, isActive: true },
      data: { isActive: false },
    })

    const assignment = await db.routineAssignment.create({
      data: {
        gymId,
        memberId: params.memberId,
        routineId: params.routineId,
        validUntil: params.validUntil ? new Date(params.validUntil) : null,
        notes: params.notes ?? null,
        isActive: true,
      },
      select: { id: true },
    })

    revalidatePath("/dashboard/training")
    revalidatePath(`/dashboard/training/${params.routineId}`)
    revalidatePath(`/dashboard/members/${params.memberId}`)
    return { data: { id: assignment.id }, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Error interno" }
  }
}

export async function unassignRoutineAction(
  assignmentId: string
): Promise<ApiResponse<{ ok: boolean }>> {
  try {
    const { gymId } = await requireGymScope()

    const assignment = await db.routineAssignment.findFirst({
      where: { id: assignmentId, gymId },
    })
    if (!assignment) return { data: null, error: "Asignación no encontrada" }

    await db.routineAssignment.update({
      where: { id: assignmentId },
      data: { isActive: false },
    })

    revalidatePath("/dashboard/training")
    revalidatePath(`/dashboard/members/${assignment.memberId}`)
    return { data: { ok: true }, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Error interno" }
  }
}

// ─── Ejercicios de biblioteca ─────────────────────────────

export async function createExerciseAction(formData: FormData): Promise<ApiResponse<{ id: string }>> {
  try {
    const { gymId } = await requireGymScope()

    const name = (formData.get("name") as string)?.trim()
    const description = (formData.get("description") as string | null) || null
    const muscleGroupsRaw = formData.get("muscleGroups") as string | null
    const muscleGroups = muscleGroupsRaw
      ? muscleGroupsRaw.split(",").map((g) => g.trim()).filter(Boolean)
      : []

    if (!name) return { data: null, error: "El nombre es obligatorio" }

    const exercise = await db.exercise.create({
      data: { gymId, name, description, muscleGroups },
      select: { id: true },
    })

    revalidatePath("/dashboard/training")
    return { data: { id: exercise.id }, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Error interno" }
  }
}
