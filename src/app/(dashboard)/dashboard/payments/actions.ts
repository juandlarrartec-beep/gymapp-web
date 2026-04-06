"use server"

import { revalidatePath } from "next/cache"
import { db, requireGymScope, MemberStatus, PaymentProvider, PaymentStatus } from "@/lib/db"
import type { ApiResponse } from "@/lib/db"
import { addDays } from "date-fns"
import { z } from "zod"

export async function markPaymentSucceededAction(
  paymentId: string
): Promise<{ error: string | null }> {
  try {
    const { gymId } = await requireGymScope()

    const payment = await db.payment.findFirst({
      where: { id: paymentId, gymId },
      include: { member: true },
    })
    if (!payment) return { error: "Pago no encontrado" }

    await db.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.SUCCEEDED },
    })

    // Reactivar socio si estaba suspendido
    if (payment.member.status === MemberStatus.SUSPENDED) {
      const plan = await db.membershipPlan.findFirst({
        where: { id: payment.member.membershipPlanId },
        select: { durationDays: true },
      })
      const durationDays = plan?.durationDays ?? 30

      await db.member.update({
        where: { id: payment.memberId },
        data: {
          status: MemberStatus.ACTIVE,
          nextPaymentDate: addDays(new Date(), durationDays),
        },
      })
    }

    revalidatePath("/dashboard/payments")
    revalidatePath("/dashboard/members")
    return { error: null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error interno" }
  }
}

const registerPaymentSchema = z.object({
  memberId: z.string().min(1, "Seleccioná un socio"),
  amount: z
    .number({ invalid_type_error: "Ingresá un monto válido" })
    .positive("El monto debe ser mayor a 0"),
  periodStart: z.string().min(1, "Indicá la fecha de inicio"),
  periodEnd: z.string().min(1, "Indicá la fecha de fin"),
  notes: z.string().optional().nullable(),
})

export async function registerManualPaymentAction(
  formData: FormData
): Promise<{ error: string | null }> {
  try {
    const { gymId } = await requireGymScope()

    const raw = {
      memberId: formData.get("memberId") as string,
      amount: parseFloat(formData.get("amount") as string),
      periodStart: formData.get("periodStart") as string,
      periodEnd: formData.get("periodEnd") as string,
      notes: (formData.get("notes") as string) || null,
    }

    const parsed = registerPaymentSchema.safeParse(raw)
    if (!parsed.success) {
      return { error: parsed.error.errors[0]?.message ?? "Datos inválidos" }
    }

    const data = parsed.data

    const member = await db.member.findFirst({
      where: { id: data.memberId, gymId },
      include: { membershipPlan: true },
    })
    if (!member) return { error: "Socio no encontrado" }

    const gym = await db.gym.findUnique({
      where: { id: gymId },
      select: { currency: true, paymentProvider: true },
    })

    const periodEnd = new Date(data.periodEnd)

    await db.payment.create({
      data: {
        gymId,
        memberId: data.memberId,
        amount: Math.round(data.amount * 100), // pesos → centavos
        currency: gym?.currency ?? member.membershipPlan.currency,
        status: PaymentStatus.SUCCEEDED,
        provider: gym?.paymentProvider ?? PaymentProvider.MERCADOPAGO,
        periodStart: new Date(data.periodStart),
        periodEnd,
        attemptNumber: 1,
      },
    })

    // Actualizar nextPaymentDate y reactivar si estaba suspendido
    await db.member.update({
      where: { id: data.memberId },
      data: {
        nextPaymentDate: periodEnd,
        ...(member.status === MemberStatus.SUSPENDED
          ? { status: MemberStatus.ACTIVE }
          : {}),
      },
    })

    revalidatePath("/dashboard/payments")
    revalidatePath("/dashboard/members")
    return { error: null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error interno" }
  }
}

export async function getGymMembersForPaymentAction(): Promise<
  ApiResponse<Array<{
    id: string
    firstName: string
    lastName: string
    email: string
    membershipPlan: { priceAmount: number; currency: string; durationDays: number; name: string }
  }>>
> {
  try {
    const { gymId } = await requireGymScope()

    const members = await db.member.findMany({
      where: {
        gymId,
        status: { not: MemberStatus.CANCELLED },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        membershipPlan: {
          select: {
            priceAmount: true,
            currency: true,
            durationDays: true,
            name: true,
          },
        },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    })

    return { data: members, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Error interno" }
  }
}
