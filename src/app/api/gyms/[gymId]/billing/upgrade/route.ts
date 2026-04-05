// POST /api/gyms/[gymId]/billing/upgrade
// Crea un Stripe Checkout Session para upgrade de plan SaaS
// Al completar el pago, el webhook de Stripe actualiza Gym.plan

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import Stripe from "stripe"

interface RouteParams {
  params: Promise<{ gymId: string }>
}

// Stripe Price IDs por plan — configurar en env vars
// STRIPE_PRICE_STARTER_ID, STRIPE_PRICE_GROWTH_ID, STRIPE_PRICE_PRO_ID
const PLAN_PRICE_IDS: Record<string, string | undefined> = {
  STARTER: process.env["STRIPE_PRICE_STARTER_ID"],
  GROWTH: process.env["STRIPE_PRICE_GROWTH_ID"],
  PRO: process.env["STRIPE_PRICE_PRO_ID"],
}

const VALID_PLAN_ORDER = ["FREE", "STARTER", "GROWTH", "PRO"]

export async function POST(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { orgId } = await auth()
  if (!orgId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { gymId } = await params
  const gym = await db.gym.findFirst({
    where: { id: gymId, clerkOrgId: orgId },
    select: { id: true, plan: true, email: true, name: true },
  })
  if (!gym) return NextResponse.json({ error: "Gym no encontrado" }, { status: 404 })

  const body = (await req.json()) as { targetPlan?: string }
  const { targetPlan } = body

  if (!targetPlan || !VALID_PLAN_ORDER.includes(targetPlan)) {
    return NextResponse.json({ error: "Plan no válido" }, { status: 400 })
  }

  // Solo se puede hacer upgrade (no downgrade)
  const currentIndex = VALID_PLAN_ORDER.indexOf(gym.plan)
  const targetIndex = VALID_PLAN_ORDER.indexOf(targetPlan)
  if (targetIndex <= currentIndex) {
    return NextResponse.json(
      { error: "Solo se puede actualizar a un plan superior" },
      { status: 400 }
    )
  }

  const priceId = PLAN_PRICE_IDS[targetPlan]
  if (!priceId) {
    return NextResponse.json(
      { error: `STRIPE_PRICE_${targetPlan}_ID no configurada` },
      { status: 500 }
    )
  }

  const stripeSecretKey = process.env["STRIPE_SECRET_KEY"]
  if (!stripeSecretKey) {
    return NextResponse.json({ error: "Stripe no configurado" }, { status: 500 })
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" })

  const appUrl = process.env["NEXT_PUBLIC_APP_URL"] ?? "https://gymapp.com"

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/billing?upgraded=1`,
    cancel_url: `${appUrl}/dashboard/billing`,
    customer_email: gym.email ?? undefined,
    metadata: {
      gymId: gym.id,
      targetPlan,
      type: "gym_plan_upgrade",
    },
  })

  return NextResponse.json({ data: { checkoutUrl: session.url }, error: null })
}
