import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

interface RouteParams {
  params: Promise<{ gymId: string }>
}

// GET /api/gyms/[gymId]/seats — listar sedes del gym
export async function GET(
  _req: NextRequest,
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

  const seats = await db.gymSeat.findMany({
    where: { gymId },
    orderBy: [{ isMain: "desc" }, { createdAt: "asc" }],
  })

  return NextResponse.json({ data: seats, error: null })
}

// POST /api/gyms/[gymId]/seats — crear sede
export async function POST(
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
    return NextResponse.json({ error: "Multi-sede requiere plan PRO" }, { status: 403 })
  }

  const body = (await req.json()) as {
    name: string
    address?: string
    isMain?: boolean
    nfcReaderId?: string
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "El nombre de la sede es requerido" }, { status: 400 })
  }

  // Si se marca como principal, desmarcar la anterior
  if (body.isMain) {
    await db.gymSeat.updateMany({
      where: { gymId, isMain: true },
      data: { isMain: false },
    })
  }

  const seat = await db.gymSeat.create({
    data: {
      gymId,
      name: body.name.trim(),
      address: body.address?.trim() ?? null,
      isMain: body.isMain ?? false,
      nfcReaderId: body.nfcReaderId?.trim() ?? null,
    },
  })

  return NextResponse.json({ data: seat, error: null }, { status: 201 })
}
