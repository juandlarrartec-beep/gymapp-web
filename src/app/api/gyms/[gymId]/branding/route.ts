import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

interface RouteParams {
  params: Promise<{ gymId: string }>
}

// PATCH /api/gyms/[gymId]/branding — actualizar branding white-label (solo plan PRO)
export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { orgId } = await auth()
  if (!orgId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { gymId } = await params

  const gym = await db.gym.findFirst({
    where: { id: gymId, clerkOrgId: orgId },
    select: { id: true, plan: true },
  })

  if (!gym) return NextResponse.json({ error: "Gym no encontrado" }, { status: 404 })
  if (gym.plan !== "PRO") {
    return NextResponse.json({ error: "White-label requiere plan PRO" }, { status: 403 })
  }

  const body = (await req.json()) as {
    logoUrl?: string | null
    primaryColor?: string
    appName?: string | null
  }

  // Validar primaryColor si se provee
  if (body.primaryColor !== undefined) {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/
    if (!hexRegex.test(body.primaryColor)) {
      return NextResponse.json(
        { error: "primaryColor debe ser un color hex válido (#RRGGBB)" },
        { status: 400 }
      )
    }
  }

  const updated = await db.gym.update({
    where: { id: gymId },
    data: {
      ...(body.logoUrl !== undefined && { logoUrl: body.logoUrl }),
      ...(body.primaryColor !== undefined && { primaryColor: body.primaryColor }),
      ...(body.appName !== undefined && { appName: body.appName }),
    },
    select: { id: true, logoUrl: true, primaryColor: true, appName: true },
  })

  return NextResponse.json({ data: updated, error: null })
}
