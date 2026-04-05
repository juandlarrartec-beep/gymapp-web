// Resolución de tenant para rutas API
// Estrategia:
//   1. Por subdominio: {slug}.gymapp.com → buscar Gym por slug
//   2. Fallback: usar Clerk orgId del header inyectado por el middleware
//   3. Resultado cacheado en headers para no hacer 2 queries por request

import { db } from "@/lib/db"
import type { NextRequest } from "next/server"

const GYMAPP_ROOT_DOMAIN = process.env["NEXT_PUBLIC_ROOT_DOMAIN"] ?? "gymapp.com"

// Header que el middleware inyecta con el gymId resuelto
const GYM_ID_HEADER = "x-gymapp-gym-id"

// Obtiene el gymId desde el header ya resuelto por el middleware
// Usar esto en rutas API para evitar una query extra a la DB
export function getGymIdFromHeaders(req: NextRequest): string | null {
  return req.headers.get(GYM_ID_HEADER)
}

// Resuelve el gymId a partir del host del request
// 1. Intenta por subdominio
// 2. Fallback: por Clerk orgId (pasado como header por el middleware)
export async function getGymFromRequest(req: NextRequest): Promise<string | null> {
  // Primero intentar el header cacheado (ya resuelto por middleware)
  const cached = req.headers.get(GYM_ID_HEADER)
  if (cached) return cached

  const host = req.headers.get("host") ?? ""

  // Detectar si es subdominio de gymapp.com
  const isSubdomain =
    host.endsWith(`.${GYMAPP_ROOT_DOMAIN}`) &&
    host !== GYMAPP_ROOT_DOMAIN &&
    host !== `www.${GYMAPP_ROOT_DOMAIN}`

  if (isSubdomain) {
    const slug = host.split(".")[0]
    if (!slug) return null

    const gym = await db.gym.findUnique({
      where: { slug },
      select: { id: true },
    })
    return gym?.id ?? null
  }

  // Fallback: buscar por Clerk orgId inyectado como header
  const clerkOrgId = req.headers.get("x-clerk-org-id")
  if (clerkOrgId) {
    const gym = await db.gym.findUnique({
      where: { clerkOrgId },
      select: { id: true },
    })
    return gym?.id ?? null
  }

  return null
}

// Verifica que el gymId del request coincide con el gymId del parámetro de ruta
// Previene acceso cross-tenant
export function assertTenantMatch(
  resolvedGymId: string | null,
  routeGymId: string
): asserts resolvedGymId is string {
  if (!resolvedGymId) {
    throw new Error("Tenant no resuelto — gymId no encontrado en el request")
  }
  if (resolvedGymId !== routeGymId) {
    throw new Error(`Cross-tenant access denegado: ${resolvedGymId} !== ${routeGymId}`)
  }
}
