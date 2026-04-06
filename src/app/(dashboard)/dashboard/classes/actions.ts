"use server"

import { revalidatePath } from "next/cache"
import { db, requireGymScope } from "@/lib/db"
import { addDays } from "date-fns"
import { z } from "zod"

const createClassSchema = z.object({
  name: z.string().min(2).max(150),
  description: z.string().optional().nullable(),
  trainerId: z.string().optional().nullable(),
  maxCapacity: z.coerce.number().int().positive().default(20),
  durationMin: z.coerce.number().int().positive().default(60),
  location: z.string().optional().nullable(),
  startTime: z.string().min(1, "Fecha requerida"),
})

export type CreateClassState = {
  success: boolean
  error: string | null
}

export async function createClassAction(
  _prev: CreateClassState | null,
  formData: FormData
): Promise<CreateClassState> {
  const { gymId } = await requireGymScope()

  const raw = {
    name: formData.get("name"),
    description: formData.get("description") || null,
    trainerId: formData.get("trainerId") || null,
    maxCapacity: formData.get("maxCapacity"),
    durationMin: formData.get("durationMin"),
    location: formData.get("location") || null,
    startTime: formData.get("startTime"),
  }

  const parsed = createClassSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Datos inválidos" }
  }

  const data = parsed.data

  if (data.trainerId) {
    const trainer = await db.trainer.findFirst({ where: { id: data.trainerId, gymId } })
    if (!trainer) return { success: false, error: "Trainer no encontrado" }
  }

  await db.classSchedule.create({
    data: {
      gymId,
      name: data.name,
      description: data.description ?? null,
      trainerId: data.trainerId ?? null,
      maxCapacity: data.maxCapacity,
      durationMin: data.durationMin,
      location: data.location ?? null,
      startTime: new Date(data.startTime),
    },
  })

  revalidatePath("/dashboard/classes")
  return { success: true, error: null }
}

export async function cancelClassAction(classId: string, reason?: string): Promise<{ error: string | null }> {
  const { gymId } = await requireGymScope()

  const cls = await db.classSchedule.findFirst({ where: { id: classId, gymId } })
  if (!cls) return { error: "Clase no encontrada" }

  await db.classSchedule.update({
    where: { id: classId },
    data: { status: "CANCELLED", cancelReason: reason ?? "Cancelada por el administrador" },
  })

  revalidatePath("/dashboard/classes")
  return { error: null }
}

export async function duplicateClassAction(classId: string): Promise<{ error: string | null }> {
  const { gymId } = await requireGymScope()

  const cls = await db.classSchedule.findFirst({ where: { id: classId, gymId } })
  if (!cls) return { error: "Clase no encontrada" }

  const newStartTime = addDays(cls.startTime, 7)

  await db.classSchedule.create({
    data: {
      gymId,
      name: cls.name,
      description: cls.description,
      trainerId: cls.trainerId,
      maxCapacity: cls.maxCapacity,
      durationMin: cls.durationMin,
      location: cls.location,
      startTime: newStartTime,
      status: "SCHEDULED",
    },
  })

  revalidatePath("/dashboard/classes")
  return { error: null }
}

export async function markAttendanceAction(
  bookingId: string,
  attended: boolean
): Promise<{ error: string | null }> {
  const { gymId } = await requireGymScope()

  const booking = await db.classBooking.findFirst({
    where: { id: bookingId, gymId },
  })
  if (!booking) return { error: "Reserva no encontrada" }

  await db.classBooking.update({
    where: { id: bookingId },
    data: {
      status: attended ? "ATTENDED" : "CONFIRMED",
      attendedAt: attended ? new Date() : null,
    },
  })

  revalidatePath(`/dashboard/classes`)
  return { error: null }
}
