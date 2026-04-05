import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import SettingsClient from "./SettingsClient"

async function getGymSettings(orgId: string) {
  return db.gym.findUnique({
    where: { clerkOrgId: orgId },
    select: {
      id: true,
      plan: true,
      name: true,
      country: true,
      timezone: true,
      email: true,
      phone: true,
      address: true,
      currency: true,
      paymentProvider: true,
      stripeAccountId: true,
      mercadopagoAccountId: true,
      instagramProgramEnabled: true,
      instagramDiscount1: true,
      instagramDiscount3: true,
      instagramDiscount5: true,
      nfcEnabled: true,
      nfcReaderId: true,
      slug: true,
      appName: true,
      logoUrl: true,
      primaryColor: true,
    },
  })
}

export default async function SettingsPage() {
  const { orgId } = await auth()
  if (!orgId) redirect("/sign-in")

  const gym = await getGymSettings(orgId)
  if (!gym) redirect("/sign-in")

  return <SettingsClient gym={gym} />
}
