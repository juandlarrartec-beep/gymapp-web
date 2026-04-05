import { PrismaClient } from "@prisma/client"
import { auth } from "@clerk/nextjs/server"
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

// Re-exportar tipos de Prisma
export * from "@prisma/client"

export function assertGymScope(filter: { gymId?: string | null }): asserts filter is { gymId: string } {
  if (!filter.gymId) {
    throw new Error("[SECURITY] Query sin gymId — violación de tenant isolation")
  }
}

export async function getGymId(): Promise<string> {
  const { orgId } = await auth()

  // Si no tiene org activa, redirigir a onboarding
  if (!orgId) {
    redirect("/sign-up/gym")
  }

  const gym = await db.gym.findUnique({
    where: { clerkOrgId: orgId },
    select: { id: true },
  })

  // Si la org existe en Clerk pero no en nuestra DB, onboarding
  if (!gym) {
    redirect("/sign-up/gym")
  }

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
