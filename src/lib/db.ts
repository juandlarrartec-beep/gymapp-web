import { PrismaClient } from "@prisma/client"
import { auth } from "@clerk/nextjs/server"

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
  if (!orgId) throw new Error("No hay organización activa en la sesión")

  const gym = await db.gym.findUnique({
    where: { clerkOrgId: orgId },
    select: { id: true },
  })

  if (!gym) throw new Error(`Gym no encontrado para orgId: ${orgId}`)
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
