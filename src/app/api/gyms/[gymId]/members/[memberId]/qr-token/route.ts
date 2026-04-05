import { MemberStatus } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { getGymId, ok, err } from "@/lib/db"
import type { ApiResponse } from "@/lib/db"
import { generateQRToken } from "@/lib/qr"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ gymId: string; memberId: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json(err("No autenticado"), { status: 401 })

  const { gymId, memberId } = await params
  const callerGymId = await getGymId().catch(() => null)
  if (callerGymId !== gymId) return NextResponse.json(err("Sin acceso"), { status: 403 })

  const member = await db.member.findFirst({
    where: { id: memberId, gymId },
    select: { id: true, status: true, firstName: true, lastName: true },
  })
  if (!member) return NextResponse.json(err("Socio no encontrado"), { status: 404 })

  if (member.status === MemberStatus.SUSPENDED) {
    return NextResponse.json(err("Membresía suspendida — no se puede generar QR"), { status: 403 })
  }

  if (member.status === MemberStatus.CANCELLED) {
    return NextResponse.json(err("Membresía cancelada"), { status: 403 })
  }

  // Generar token — NUNCA se persiste en DB
  const token = generateQRToken(gymId, memberId)

  // El token expira en ~60 segundos (ventana del reloj)
  const expiresAt = new Date(Math.ceil(Date.now() / 60000) * 60000)

  return NextResponse.json(
    ok({
      token,
      expiresAt: expiresAt.toISOString(),
      memberName: `${member.firstName} ${member.lastName}`,
    })
  )
}
