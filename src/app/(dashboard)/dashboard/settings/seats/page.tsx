import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import SeatsClient from "./SeatsClient"

async function getGymSeats(orgId: string) {
  const gym = await db.gym.findUnique({
    where: { clerkOrgId: orgId },
    select: {
      id: true,
      plan: true,
      gymSeats: {
        orderBy: [{ isMain: "desc" }, { createdAt: "asc" }],
      },
    },
  })
  return gym
}

export default async function SeatsPage() {
  const { orgId } = await auth()
  if (!orgId) redirect("/sign-in")

  const gym = await getGymSeats(orgId)
  if (!gym) redirect("/sign-in")

  return <SeatsClient gym={gym} />
}
