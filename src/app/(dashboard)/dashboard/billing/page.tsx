import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import BillingClient from "./BillingClient"

const PLAN_FEATURES: Record<string, { price: string; maxMembers: string; features: string[] }> = {
  FREE: {
    price: "Gratis",
    maxMembers: "Hasta 30 socios",
    features: ["Gestión básica de socios", "Control de acceso QR", "Reportes básicos"],
  },
  STARTER: {
    price: "$9/mes",
    maxMembers: "Hasta 200 socios",
    features: [
      "Todo lo de Free",
      "Pagos automáticos",
      "Smart retry",
      "WhatsApp notifications",
      "Programa Instagram",
    ],
  },
  GROWTH: {
    price: "$19/mes",
    maxMembers: "Hasta 750 socios",
    features: [
      "Todo lo de Starter",
      "Churn scoring IA",
      "Rutinas y clases",
      "Reportes avanzados",
      "App móvil para socios",
    ],
  },
  PRO: {
    price: "$39/mes",
    maxMembers: "Socios ilimitados",
    features: [
      "Todo lo de Growth",
      "Apple Wallet + Google Wallet",
      "Control de acceso NFC",
      "White-label (marca propia)",
      "Multi-sede",
      "Soporte prioritario",
    ],
  },
}

const PLAN_ORDER = ["FREE", "STARTER", "GROWTH", "PRO"]

async function getGymBilling(orgId: string) {
  return db.gym.findUnique({
    where: { clerkOrgId: orgId },
    select: {
      id: true,
      plan: true,
      stripeAccountId: true,
    },
  })
}

export default async function BillingPage() {
  const { orgId } = await auth()
  if (!orgId) redirect("/sign-in")

  const gym = await getGymBilling(orgId)
  if (!gym) redirect("/sign-in")

  const currentPlanIndex = PLAN_ORDER.indexOf(gym.plan)
  const nextPlan = PLAN_ORDER[currentPlanIndex + 1] ?? null

  return (
    <BillingClient
      gym={gym}
      planFeatures={PLAN_FEATURES}
      planOrder={PLAN_ORDER}
      nextPlan={nextPlan}
    />
  )
}
