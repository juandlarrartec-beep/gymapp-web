import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

interface RouteParams {
  params: Promise<{ gymId: string }>
}

// PATCH /api/gyms/[gymId]/nfc — actualizar configuración NFC del gym
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
    return NextResponse.json({ error: "NFC requiere plan PRO" }, { status: 403 })
  }

  const body = (await req.json()) as { nfcEnabled?: boolean; nfcReaderId?: string | null }

  const updated = await db.gym.update({
    where: { id: gymId },
    data: {
      ...(typeof body.nfcEnabled === "boolean" && { nfcEnabled: body.nfcEnabled }),
      ...(body.nfcReaderId !== undefined && { nfcReaderId: body.nfcReaderId }),
    },
    select: { id: true, nfcEnabled: true, nfcReaderId: true },
  })

  return NextResponse.json({ data: updated, error: null })
}
