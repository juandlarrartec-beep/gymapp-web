import { PrismaClient } from "@prisma/client"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db

export * from "@prisma/client"

export function assertGymScope(filter: { gymId?: string | null }): asserts filter is { gymId: string } {
  if (!filter.gymId) {
    throw new Error("[SECURITY] Query sin gymId — violación de tenant isolation")
  }
}

export async function getGymId(): Promise<string> {
  const { userId, orgId } = await auth()
  if (!userId) redirect("/sign-in")

  // Intentar con el orgId del JWT primero (camino rápido)
  let clerkOrgId = orgId

  // Fallback: el JWT puede estar desactualizado después de setActive (Clerk race condition)
  // Consultar la API de Clerk directamente para obtener las memberships del usuario
  if (!clerkOrgId) {
    const clerk = await clerkClient()
    const memberships = await clerk.users.getOrganizationMembershipList({ userId })
    if (memberships.data.length > 0 && memberships.data[0]) {
      clerkOrgId = memberships.data[0].organization.id
    }
  }

  if (!clerkOrgId) redirect("/sign-up/gym")

  const gym = await db.gym.findUnique({
    where: { clerkOrgId },
    select: { id: true },
  })

  if (!gym) redirect("/sign-up/gym")

  return gym.id
}

export async function requireGymScope() {
  const gymId = await getGymId()
  assertGymScope({ gymId })
  return { gymId, db }
}

export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: string }

export function ok<T>(data: T): ApiResponse<T> {
  return { data, error: null }
}

export function err(message: string): ApiResponse<never> {
  return { data: null, error: message }
}
