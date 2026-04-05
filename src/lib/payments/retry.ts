import { MemberStatus, PaymentStatus, PaymentProvider } from "@prisma/client"
import { db } from "@/lib/db"
import { getPaymentProvider } from "./index"
import { notifyPaymentFailed } from "@/lib/notifications/payment"
import { updateWalletPassStatus } from "@/lib/wallet/update"
import { addHours } from "date-fns"

// Intervalos de reintento: intento 1 → 24h, intento 2 → 72h, intento 3 → bloquear
const RETRY_DELAYS: Record<number, number> = {
  1: 24, // horas hasta el 2do intento
  2: 72, // horas hasta el 3er intento
}

const MAX_RETRIES = 3

interface RetryResult {
  processed: number
  succeeded: number
  blocked: number
  errors: string[]
}

export async function runSmartRetry(): Promise<RetryResult> {
  const result: RetryResult = { processed: 0, succeeded: 0, blocked: 0, errors: [] }
  const now = new Date()

  // Buscar todos los pagos fallidos con retry pendiente
  const pendingRetries = await db.payment.findMany({
    where: {
      status: PaymentStatus.FAILED,
      nextRetryAt: { lte: now },
      attemptNumber: { lt: MAX_RETRIES },
    },
    include: {
      member: {
        select: {
          id: true,
          gymId: true,
          email: true,
          firstName: true,
          lastName: true,
          stripeCustomerId: true,
          mercadopagoCustomerId: true,
          paymentMethodId: true,
          membershipPlanId: true,
        },
      },
      gym: {
        select: {
          id: true,
          country: true,
          currency: true,
          paymentProvider: true,
        },
      },
    },
  })

  for (const payment of pendingRetries) {
    result.processed++
    const { member, gym } = payment

    // Si no tiene método de pago, no se puede reintentar
    if (!member.paymentMethodId) {
      result.errors.push(`Pago ${payment.id}: sin método de pago`)
      continue
    }

    const customerId =
      gym.paymentProvider === PaymentProvider.STRIPE
        ? member.stripeCustomerId
        : member.mercadopagoCustomerId

    if (!customerId) {
      result.errors.push(`Pago ${payment.id}: sin customerId para ${gym.paymentProvider}`)
      continue
    }

    const provider = getPaymentProvider(gym.country)
    const nextAttempt = payment.attemptNumber + 1

    try {
      const chargeResult = await provider.chargeCard({
        customerId,
        paymentMethodId: member.paymentMethodId,
        amount: payment.amount,
        currency: payment.currency,
        description: `GymApp — reintento ${nextAttempt}`,
        metadata: {
          gymId: gym.id,
          memberId: member.id,
          paymentId: payment.id,
        },
      })

      if (chargeResult.status === "succeeded") {
        // Marcar pago como exitoso
        await db.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.SUCCEEDED,
            providerPaymentId: chargeResult.paymentId,
            providerChargeId: chargeResult.chargeId,
            nextRetryAt: null,
            failureReason: null,
          },
        })
        // Reactivar socio si estaba suspendido
        await db.member.update({
          where: { id: member.id },
          data: { status: MemberStatus.ACTIVE },
        })
        // Actualizar Wallet pass a ACTIVE
        void updateWalletPassStatus(member.id, "ACTIVE")
        result.succeeded++
      } else {
        // Cobro fallido — programar siguiente intento o bloquear
        if (nextAttempt >= MAX_RETRIES) {
          // 3er intento fallido → suspender
          await db.payment.update({
            where: { id: payment.id },
            data: {
              attemptNumber: nextAttempt,
              status: PaymentStatus.FAILED,
              nextRetryAt: null,
              failureReason: chargeResult.failureMessage ?? "Máximos reintentos alcanzados",
            },
          })
          await db.member.update({
            where: { id: member.id },
            data: { status: MemberStatus.SUSPENDED },
          })
          // Actualizar Wallet pass a SUSPENDED
          void updateWalletPassStatus(member.id, "SUSPENDED")
          result.blocked++

          // Notificar al socio por WhatsApp en el 3er intento fallido
          const memberFull = await db.member.findUnique({
            where: { id: member.id },
            select: { firstName: true, phone: true },
          })
          if (memberFull) {
            void notifyPaymentFailed(
              memberFull,
              `https://gymapp.vercel.app/pay/${payment.id}`, // link de pago
              payment.amount,
              payment.currency
            )
          }
        } else {
          const delayHours = RETRY_DELAYS[nextAttempt] ?? 72
          await db.payment.update({
            where: { id: payment.id },
            data: {
              attemptNumber: nextAttempt,
              nextRetryAt: addHours(now, delayHours),
              failureReason: chargeResult.failureMessage,
            },
          })
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido"
      result.errors.push(`Pago ${payment.id}: ${msg}`)
    }
  }

  return result
}
