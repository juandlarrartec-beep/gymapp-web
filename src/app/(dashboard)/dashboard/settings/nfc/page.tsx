import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import NfcSettingsClient from "./NfcSettingsClient"

async function getGymData(orgId: string) {
  const gym = await db.gym.findUnique({
    where: { clerkOrgId: orgId },
    select: {
      id: true,
      slug: true,
      plan: true,
      nfcEnabled: true,
      nfcReaderId: true,
    },
  })
  return gym
}

export default async function NfcSettingsPage() {
  const { orgId } = await auth()
  if (!orgId) redirect("/sign-in")

  const gym = await getGymData(orgId)
  if (!gym) redirect("/sign-in")

  return <NfcSettingsClient gym={gym} />
}
