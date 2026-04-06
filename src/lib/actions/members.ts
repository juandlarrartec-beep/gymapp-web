"use server"
import { MemberStatus } from "@prisma/client"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { requireGymScope } from "@/lib/db"
import type { ApiResponse } from "@/lib/db"
import { updateWalletPassStatus } from "@/lib/wallet/update"
import { addDays } from "date-fns"
import { z } from "zod"

const createMemberSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  membershipPlanId: z.string(),
  startDate: z.string().optional(),
  notes: z.string().optional().nullable(),
})

// Versión con redirect — para uso en MemberForm (crear)
export async function createMemberAction(
  formData: FormData
): Promise<{ error: string | null }> {
  let memberId: string | null = null

  try {
    const { gymId } = await requireGymScope()

    const raw = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      phone: (formData.get("phone") as string) || null,
      birthDate: (formData.get("birthDate") as string) || null,
      membershipPlanId: formData.get("membershipPlanId") as string,
      startDate: (formData.get("startDate") as string) || undefined,
      notes: (formData.get("notes") as string) || null,
    }

    const parsed = createMemberSchema.safeParse(raw)
    if (!parsed.success) {
      return { error: parsed.error.errors[0]?.message ?? "Datos inválidos" }
    }

    const data = parsed.data
    const plan = await db.membershipPlan.findFirst({
      where: { id: data.membershipPlanId, gymId, isActive: true },
    })
    if (!plan) return { error: "Plan no válido" }

    const emailExists = await db.member.findFirst({
      where: { gymId, email: data.email.toLowerCase() },
    })
    if (emailExists) return { error: "Ya existe un socio con ese email" }

    const startDate = data.startDate ? new Date(data.startDate) : new Date()
    const nextPaymentDate = addDays(startDate, plan.durationDays)

    const member = await db.member.create({
      data: {
        gymId,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.toLowerCase().trim(),
        phone: data.phone || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        membershipPlanId: data.membershipPlanId,
        startDate,
        nextPaymentDate,
      },
    })

    revalidatePath(`/dashboard/members`)
    memberId = member.id
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error interno" }
  }

  if (memberId) redirect(`/dashboard/members/${memberId}`)
  return { error: null }
}

// Versión original sin redirect — para compatibilidad interna
export async function createMember(
  formData: FormData
): Promise<ApiResponse<unknown>> {
  try {
    const { gymId } = await requireGymScope()

    const raw = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string | null,
      birthDate: formData.get("birthDate") as string | null,
      membershipPlanId: formData.get("membershipPlanId") as string,
      startDate: formData.get("startDate") as string | undefined,
    }

    const parsed = createMemberSchema.safeParse(raw)
    if (!parsed.success) {
      return { data: null, error: parsed.error.errors[0]?.message ?? "Datos inválidos" }
    }

    const data = parsed.data
    const plan = await db.membershipPlan.findFirst({
      where: { id: data.membershipPlanId, gymId, isActive: true },
    })
    if (!plan) return { data: null, error: "Plan no válido" }

    const emailExists = await db.member.findFirst({
      where: { gymId, email: data.email.toLowerCase() },
    })
    if (emailExists) return { data: null, error: "Ya existe un socio con ese email" }

    const startDate = data.startDate ? new Date(data.startDate) : new Date()
    const nextPaymentDate = addDays(startDate, plan.durationDays)

    const member = await db.member.create({
      data: {
        gymId,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.toLowerCase().trim(),
        phone: data.phone || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        membershipPlanId: data.membershipPlanId,
        startDate,
        nextPaymentDate,
      },
    })

    revalidatePath(`/dashboard/members`)
    return { data: member, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Error interno" }
  }
}

export async function updateMember(
  memberId: string,
  updates: {
    firstName?: string
    lastName?: string
    phone?: string | null
    status?: MemberStatus
    membershipPlanId?: string
  }
): Promise<ApiResponse<unknown>> {
  try {
    const { gymId } = await requireGymScope()

    const existing = await db.member.findFirst({ where: { id: memberId, gymId } })
    if (!existing) return { data: null, error: "Socio no encontrado" }

    const updated = await db.member.update({
      where: { id: memberId },
      data: {
        ...updates,
        ...(updates.status === MemberStatus.CANCELLED ? { cancellationDate: new Date() } : {}),
      },
    })

    // Sincronizar Wallet pass cuando cambia el status
    if (updates.status === MemberStatus.ACTIVE || updates.status === MemberStatus.SUSPENDED) {
      void updateWalletPassStatus(memberId, updates.status === MemberStatus.ACTIVE ? "ACTIVE" : "SUSPENDED")
    }

    revalidatePath(`/dashboard/members`)
    revalidatePath(`/dashboard/members/${memberId}`)
    return { data: updated, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Error interno" }
  }
}

export async function suspendMember(memberId: string): Promise<ApiResponse<unknown>> {
  try {
    const { gymId } = await requireGymScope()

    const existing = await db.member.findFirst({ where: { id: memberId, gymId } })
    if (!existing) return { data: null, error: "Socio no encontrado" }

    const updated = await db.member.update({
      where: { id: memberId },
      data: { status: MemberStatus.SUSPENDED },
    })

    // Suspender Wallet pass
    void updateWalletPassStatus(memberId, "SUSPENDED")

    revalidatePath(`/dashboard/members`)
    revalidatePath(`/dashboard/members/${memberId}`)
    return { data: updated, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Error interno" }
  }
}

export async function reactivateMember(memberId: string): Promise<ApiResponse<unknown>> {
  try {
    const { gymId } = await requireGymScope()

    const existing = await db.member.findFirst({ where: { id: memberId, gymId } })
    if (!existing) return { data: null, error: "Socio no encontrado" }

    const updated = await db.member.update({
      where: { id: memberId },
      data: { status: MemberStatus.ACTIVE },
    })

    // Reactivar Wallet pass cuando el dueño desbloquea manualmente
    void updateWalletPassStatus(memberId, "ACTIVE")

    revalidatePath(`/dashboard/members`)
    revalidatePath(`/dashboard/members/${memberId}`)
    return { data: updated, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Error interno" }
  }
}

// Cambiar estado con soporte para todos los estados
export async function changeMemberStatus(
  memberId: string,
  status: MemberStatus
): Promise<{ error: string | null }> {
  try {
    const { gymId } = await requireGymScope()

    const existing = await db.member.findFirst({ where: { id: memberId, gymId } })
    if (!existing) return { error: "Socio no encontrado" }

    await db.member.update({
      where: { id: memberId },
      data: {
        status,
        ...(status === MemberStatus.CANCELLED ? { cancellationDate: new Date() } : {}),
        ...(status !== MemberStatus.FROZEN ? { frozenUntil: null } : {}),
      },
    })

    if (status === MemberStatus.ACTIVE || status === MemberStatus.SUSPENDED) {
      void updateWalletPassStatus(memberId, status === MemberStatus.ACTIVE ? "ACTIVE" : "SUSPENDED")
    }

    revalidatePath(`/dashboard/members`)
    revalidatePath(`/dashboard/members/${memberId}`)
    return { error: null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error interno" }
  }
}

const updateMemberSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  membershipPlanId: z.string(),
  startDate: z.string().optional(),
  notes: z.string().optional().nullable(),
})

// Update desde MemberForm (modo edición)
export async function updateMemberAction(
  memberId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  try {
    const { gymId } = await requireGymScope()

    const existing = await db.member.findFirst({ where: { id: memberId, gymId } })
    if (!existing) return { error: "Socio no encontrado" }

    const raw = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      phone: (formData.get("phone") as string) || null,
      birthDate: (formData.get("birthDate") as string) || null,
      membershipPlanId: formData.get("membershipPlanId") as string,
      startDate: (formData.get("startDate") as string) || undefined,
      notes: (formData.get("notes") as string) || null,
    }

    const parsed = updateMemberSchema.safeParse(raw)
    if (!parsed.success) {
      return { error: parsed.error.errors[0]?.message ?? "Datos inválidos" }
    }

    const data = parsed.data

    // Verificar email único si cambió
    if (data.email.toLowerCase() !== existing.email) {
      const emailExists = await db.member.findFirst({
        where: { gymId, email: data.email.toLowerCase(), NOT: { id: memberId } },
      })
      if (emailExists) return { error: "Ya existe un socio con ese email" }
    }

    // Si cambia el plan, recalcular nextPaymentDate
    let nextPaymentDate: Date | undefined
    if (data.membershipPlanId !== existing.membershipPlanId) {
      const plan = await db.membershipPlan.findFirst({
        where: { id: data.membershipPlanId, gymId, isActive: true },
      })
      if (!plan) return { error: "Plan no válido" }
      const startDate = data.startDate ? new Date(data.startDate) : existing.startDate
      nextPaymentDate = addDays(startDate, plan.durationDays)
    }

    await db.member.update({
      where: { id: memberId },
      data: {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.toLowerCase().trim(),
        phone: data.phone || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        membershipPlanId: data.membershipPlanId,
        ...(data.startDate ? { startDate: new Date(data.startDate) } : {}),
        ...(nextPaymentDate ? { nextPaymentDate } : {}),
      },
    })

    revalidatePath(`/dashboard/members`)
    revalidatePath(`/dashboard/members/${memberId}`)
    return { error: null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error interno" }
  }
}
