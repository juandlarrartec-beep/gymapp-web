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
    enabled?: boolean
    discount1?: number
    discount3?: number
    discount5?: number
  }

  const clamp = (v: number) => Math.max(0, Math.min(50, v))

  const updated = await db.gym.update({
    where: { id: gymId },
    data: {
      ...(typeof body.enabled === "boolean" && { instagramProgramEnabled: body.enabled }),
      ...(typeof body.discount1 === "number" && { instagramDiscount1: clamp(body.discount1) }),
      ...(typeof body.discount3 === "number" && { instagramDiscount3: clamp(body.discount3) }),
      ...(typeof body.discount5 === "number" && { instagramDiscount5: clamp(body.discount5) }),
    },
    select: {
      instagramProgramEnabled: true,
      instagramDiscount1: true,
      instagramDiscount3: true,
      instagramDiscount5: true,
    },
  })

  return NextResponse.json({ data: updated, error: null })
}
