import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import BrandingClient from "./BrandingClient"

async function getGymBranding(orgId: string) {
  return db.gym.findUnique({
    where: { clerkOrgId: orgId },
    select: {
      id: true,
      plan: true,
      name: true,
      appName: true,
      primaryColor: true,
      logoUrl: true,
    },
  })
}

export default async function BrandingPage() {
  const { orgId } = await auth()
  if (!orgId) redirect("/sign-in")

  const gym = await getGymBranding(orgId)
  if (!gym) redirect("/sign-in")

  return <BrandingClient gym={gym} />
}
