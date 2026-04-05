"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function saveGymToDb(
  formData: FormData,
  clerkOrgId: string
): Promise<{ error: string | null }> {
  const { userId } = await auth()
  if (!userId) return { error: "No autenticado" }

  const name = formData.get("name") as string
  const slug = formData.get("slug") as string
  const country = formData.get("country") as string

  if (!name || name.trim().length < 2) return { error: "Nombre muy corto" }
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return { error: "Slug inválido" }
  if (!["AR", "CO", "MX"].includes(country)) return { error: "País no válido" }
  if (!clerkOrgId) return { error: "ID de organización inválido" }

  const existing = await db.gym.findUnique({ where: { slug } })
  if (existing) return { error: "Ese slug ya está en uso, elegí otro" }

  const countryConfig: Record<string, { currency: string; timezone: string }> = {
    AR: { currency: "ARS", timezone: "America/Argentina/Buenos_Aires" },
    CO: { currency: "COP", timezone: "America/Bogota" },
    MX: { currency: "MXN", timezone: "America/Mexico_City" },
  }
  const config = countryConfig[country] ?? { currency: "ARS", timezone: "America/Argentina/Buenos_Aires" }

  await db.gym.create({
    data: {
      name: name.trim(),
      slug,
      country,
      currency: config.currency,
      timezone: config.timezone,
      clerkOrgId,
    },
  })

  revalidatePath("/dashboard")
  return { error: null }
}
