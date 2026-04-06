"use server"

import { revalidatePath } from "next/cache"
import { db, requireGymScope } from "@/lib/db"
import type { ApiResponse } from "@/lib/db"
import { z } from "zod"

const planSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(100),
  description: z.string().optional().nullable(),
  priceAmount: z
    .number({ invalid_type_error: "Ingresá un precio válido" })
    .int()
    .positive("El precio debe ser mayor a 0"),
  currency: z.enum(["ARS", "COP", "MXN"]).default("ARS"),
  durationDays: z
    .number({ invalid_type_error: "Ingresá una duración válida" })
    .int()
    .positive("La duración debe ser mayor a 0"),
  accessDays: z.array(z.string()).optional().default([]),
  accessHourStart: z.number().int().min(0).max(23).optional().nullable(),
  accessHourEnd: z.number().int().min(0).max(23).optional().nullable(),
})

export async function createPlanAction(
  formData: FormData
): Promise<{ error: string | null }> {
  try {
    const { gymId } = await requireGymScope()

    // Precio viene en pesos — convertir a centavos
    const priceRaw = parseFloat(formData.get("priceAmount") as string)
    const durationRaw = parseInt(formData.get("durationDays") as string)

    const accessDaysRaw = formData.getAll("accessDays") as string[]
    const accessHourStartRaw = formData.get("accessHourStart")
    const accessHourEndRaw = formData.get("accessHourEnd")

    const raw = {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      priceAmount: Math.round(priceRaw * 100),
      currency: (formData.get("currency") as string) || "ARS",
      durationDays: durationRaw,
      accessDays: accessDaysRaw,
      accessHourStart: accessHourStartRaw ? parseInt(accessHourStartRaw as string) : null,
      accessHourEnd: accessHourEndRaw ? parseInt(accessHourEndRaw as string) : null,
    }

    const parsed = planSchema.safeParse(raw)
    if (!parsed.success) {
      return { error: parsed.error.errors[0]?.message ?? "Datos inválidos" }
    }

    const data = parsed.data

    await db.membershipPlan.create({
      data: {
        gymId,
        name: data.name.trim(),
        description: data.description,
        priceAmount: data.priceAmount,
        currency: data.currency,
        durationDays: data.durationDays,
        isActive: true,
        accessDays: data.accessDays,
        accessHourStart: data.accessHourStart ?? null,
        accessHourEnd: data.accessHourEnd ?? null,
      },
    })

    revalidatePath("/dashboard/plans")
    revalidatePath("/dashboard/members")
    return { error: null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error interno" }
  }
}

export async function updatePlanAction(
  planId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  try {
    const { gymId } = await requireGymScope()

    const existing = await db.membershipPlan.findFirst({ where: { id: planId, gymId } })
    if (!existing) return { error: "Plan no encontrado" }

    const priceRaw = parseFloat(formData.get("priceAmount") as string)
    const durationRaw = parseInt(formData.get("durationDays") as string)
    const accessDaysRaw = formData.getAll("accessDays") as string[]
    const accessHourStartRaw = formData.get("accessHourStart")
    const accessHourEndRaw = formData.get("accessHourEnd")

    const raw = {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      priceAmount: Math.round(priceRaw * 100),
      currency: (formData.get("currency") as string) || existing.currency,
      durationDays: durationRaw,
      accessDays: accessDaysRaw,
      accessHourStart: accessHourStartRaw ? parseInt(accessHourStartRaw as string) : null,
      accessHourEnd: accessHourEndRaw ? parseInt(accessHourEndRaw as string) : null,
    }

    const parsed = planSchema.safeParse(raw)
    if (!parsed.success) {
      return { error: parsed.error.errors[0]?.message ?? "Datos inválidos" }
    }

    const data = parsed.data

    await db.membershipPlan.update({
      where: { id: planId },
      data: {
        name: data.name.trim(),
        description: data.description,
        priceAmount: data.priceAmount,
        currency: data.currency,
        durationDays: data.durationDays,
        accessDays: data.accessDays,
        accessHourStart: data.accessHourStart ?? null,
        accessHourEnd: data.accessHourEnd ?? null,
      },
    })

    revalidatePath("/dashboard/plans")
    return { error: null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error interno" }
  }
}

export async function togglePlanStatusAction(
  planId: string
): Promise<{ error: string | null }> {
  try {
    const { gymId } = await requireGymScope()

    const plan = await db.membershipPlan.findFirst({ where: { id: planId, gymId } })
    if (!plan) return { error: "Plan no encontrado" }

    await db.membershipPlan.update({
      where: { id: planId },
      data: { isActive: !plan.isActive },
    })

    revalidatePath("/dashboard/plans")
    return { error: null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error interno" }
  }
}

export async function deletePlanAction(
  planId: string
): Promise<ApiResponse<unknown>> {
  try {
    const { gymId } = await requireGymScope()

    const plan = await db.membershipPlan.findFirst({
      where: { id: planId, gymId },
      include: { _count: { select: { members: true } } },
    })
    if (!plan) return { data: null, error: "Plan no encontrado" }

    if (plan._count.members > 0) {
      return {
        data: null,
        error: `No se puede eliminar: ${plan._count.members} socio(s) usan este plan. Desactivalo en su lugar.`,
      }
    }

    await db.membershipPlan.delete({ where: { id: planId } })

    revalidatePath("/dashboard/plans")
    revalidatePath("/dashboard/members")
    return { data: true, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Error interno" }
  }
}
