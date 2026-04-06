import { auth, clerkClient } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import SettingsClient from "./SettingsClient"

async function getGymSettings(clerkOrgId: string) {
  return db.gym.findUnique({
    where: { clerkOrgId },
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
  const { userId, orgId } = await auth()
  if (!userId) redirect("/sign-in")

  // Fallback: el JWT puede estar desactualizado después de setActive (Clerk race condition)
  let clerkOrgId = orgId
  if (!clerkOrgId) {
    const clerk = await clerkClient()
    const memberships = await clerk.users.getOrganizationMembershipList({ userId })
    if (memberships.data.length > 0 && memberships.data[0]) {
      clerkOrgId = memberships.data[0].organization.id
    }
  }
  if (!clerkOrgId) redirect("/sign-up/gym")

  const gym = await getGymSettings(clerkOrgId)
  if (!gym) redirect("/sign-up/gym")

  return <SettingsClient gym={gym} />
}
