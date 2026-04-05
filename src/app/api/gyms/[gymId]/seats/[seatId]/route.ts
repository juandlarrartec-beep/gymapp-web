import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

interface RouteParams {
  params: Promise<{ gymId: string; seatId: string }>
}

// PATCH /api/gyms/[gymId]/seats/[seatId] — editar sede
export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { orgId } = await auth()
  if (!orgId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { gymId, seatId } = await params

  const gym = await db.gym.findFirst({
    where: { id: gymId, clerkOrgId: orgId },
    select: { id: true },
  })
  if (!gym) return NextResponse.json({ error: "Gym no encontrado" }, { status: 404 })

  const seat = await db.gymSeat.findFirst({ where: { id: seatId, gymId } })
  if (!seat) return NextResponse.json({ error: "Sede no encontrada" }, { status: 404 })

  const body = (await req.json()) as {
    name?: string
    address?: string | null
    isMain?: boolean
    nfcReaderId?: string | null
  }

  // Si se marca como principal, desmarcar la anterior
  if (body.isMain) {
    await db.gymSeat.updateMany({
      where: { gymId, isMain: true, id: { not: seatId } },
      data: { isMain: false },
    })
  }

  const updated = await db.gymSeat.update({
    where: { id: seatId },
    data: {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.address !== undefined && { address: body.address }),
      ...(typeof body.isMain === "boolean" && { isMain: body.isMain }),
      ...(body.nfcReaderId !== undefined && { nfcReaderId: body.nfcReaderId }),
    },
  })

  return NextResponse.json({ data: updated, error: null })
}

// DELETE /api/gyms/[gymId]/seats/[seatId] — eliminar sede
// No se puede eliminar si es la única sede del gym
export async function DELETE(
  _req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { orgId } = await auth()
  if (!orgId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { gymId, seatId } = await params

  const gym = await db.gym.findFirst({
    where: { id: gymId, clerkOrgId: orgId },
    select: { id: true },
  })
  if (!gym) return NextResponse.json({ error: "Gym no encontrado" }, { status: 404 })

  // Verificar que no es la única sede
  const seatCount = await db.gymSeat.count({ where: { gymId } })
  if (seatCount <= 1) {
    return NextResponse.json(
      { error: "No se puede eliminar la única sede del gym" },
      { status: 400 }
    )
  }

  const seat = await db.gymSeat.findFirst({ where: { id: seatId, gymId } })
  if (!seat) return NextResponse.json({ error: "Sede no encontrada" }, { status: 404 })

  await db.gymSeat.delete({ where: { id: seatId } })

  return NextResponse.json({ data: { id: seatId }, error: null })
}
