import { MemberStatus, PaymentStatus, PaymentProvider, GymPlan } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { db } from "@/lib/db"
import type { ApiResponse } from "@/lib/db"

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error("STRIPE_SECRET_KEY no configurado")
  return new Stripe(key, { apiVersion: "2024-06-20" })
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<{ processed: boolean }>>> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ data: null, error: "STRIPE_WEBHOOK_SECRET no configurado" }, { status: 500 })
  }

  const body = await req.text()
  const signature = req.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ data: null, error: "Sin firma stripe" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch {
    return NextResponse.json({ data: null, error: "Firma inválida" }, { status: 401 })
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const intent = event.data.object as Stripe.PaymentIntent
      const { gymId, memberId, paymentId } = intent.metadata

      if (paymentId) {
        // Actualizar pago existente (reintento exitoso)
        await db.payment.update({
          where: { id: paymentId },
          data: {
            status: PaymentStatus.SUCCEEDED,
            providerPaymentId: intent.id,
            nextRetryAt: null,
            failureReason: null,
          },
        })
      } else if (gymId && memberId) {
        // Nuevo pago vía payment link
        const member = await db.member.findFirst({
          where: { id: memberId, gymId },
          include: { membershipPlan: { select: { durationDays: true, priceAmount: true, currency: true } } },
        })
        if (member) {
          const now = new Date()
          await db.payment.create({
            data: {
              gymId,
              memberId,
              amount: intent.amount,
              currency: intent.currency.toUpperCase(),
              status: PaymentStatus.SUCCEEDED,
              provider: PaymentProvider.STRIPE,
              providerPaymentId: intent.id,
              attemptNumber: 1,
              periodStart: now,
              periodEnd: new Date(now.getTime() + member.membershipPlan.durationDays * 86400000),
            },
          })
          await db.member.update({
            where: { id: memberId },
            data: { status: MemberStatus.ACTIVE },
          })
        }
      }
      break
    }

    case "payment_intent.payment_failed": {
      const intent = event.data.object as Stripe.PaymentIntent
      const { paymentId } = intent.metadata
      if (paymentId) {
        await db.payment.update({
          where: { id: paymentId },
          data: {
            status: PaymentStatus.FAILED,
            failureReason: intent.last_payment_error?.message ?? "Pago fallido",
          },
        })
      }
      break
    }

    case "setup_intent.succeeded": {
      const intent = event.data.object as Stripe.SetupIntent
      const { memberId, gymId } = intent.metadata ?? {}
      if (memberId && gymId) {
        await db.member.update({
          where: { id: memberId },
          data: {
            paymentMethodId: intent.payment_method as string,
            paymentMethodLast4: null, // se actualiza por separado si se necesita
          },
        })
      }
      break
    }

    // Upgrade de plan SaaS — cuando el checkout de billing se completa
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const { gymId, targetPlan, type } = session.metadata ?? {}

      if (type === "gym_plan_upgrade" && gymId && targetPlan) {
        const validPlans: string[] = Object.values(GymPlan)
        if (validPlans.includes(targetPlan)) {
          await db.gym.update({
            where: { id: gymId },
            data: { plan: targetPlan as GymPlan },
          })
        }
      }
      break
    }

    default:
      // Ignorar eventos no manejados
      break
  }

  return NextResponse.json({ data: { processed: true }, error: null })
}
