import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

interface RouteParams {
  params: Promise<{ gymId: string }>
}

export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { orgId } = await auth()
  if (!orgId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { gymId } = await params
  const gym = await db.gym.findFirst({
    where: { id: gymId, clerkOrgId: orgId },
    select: { id: true },
  })
  if (!gym) return NextResponse.json({ error: "Gym no encontrado" }, { status: 404 })

  const body = (await req.json()) as {
    name?: string
    country?: string
    timezone?: string
    email?: string | null
    phone?: string | null
    address?: string | null
  }

  const updated = await db.gym.update({
    where: { id: gymId },
    data: {
      ...(body.name?.trim() && { name: body.name.trim() }),
      ...(body.country && { country: body.country }),
      ...(body.timezone && { timezone: body.timezone }),
      ...(body.email !== undefined && { email: body.email || null }),
      ...(body.phone !== undefined && { phone: body.phone || null }),
      ...(body.address !== undefined && { address: body.address || null }),
    },
    select: { id: true, name: true, country: true, timezone: true, email: true, phone: true, address: true },
  })

  return NextResponse.json({ data: updated, error: null })
}
