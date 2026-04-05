import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { generateApplePass } from "@/lib/wallet/apple"

interface RouteParams {
  params: Promise<{ gymId: string; memberId: string }>
}

// GET /api/gyms/[gymId]/members/[memberId]/wallet/apple
// Genera y devuelve el .pkpass — solo plan PRO
export async function GET(
  _req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { orgId } = await auth()
  if (!orgId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { gymId, memberId } = await params

  // Verificar que el gym pertenece a esta org
  const gym = await db.gym.findFirst({
    where: { id: gymId, clerkOrgId: orgId },
    select: { id: true, plan: true },
  })

  if (!gym) {
    return NextResponse.json({ error: "Gym no encontrado" }, { status: 404 })
  }

  if (gym.plan !== "PRO") {
    return NextResponse.json(
      { error: "Esta función requiere el plan PRO" },
      { status: 403 }
    )
  }

  // Verificar que el socio pertenece al gym
  const member = await db.member.findFirst({
    where: { id: memberId, gymId },
    select: { id: true },
  })

  if (!member) {
    return NextResponse.json({ error: "Socio no encontrado" }, { status: 404 })
  }

  try {
    const passBuffer = await generateApplePass(memberId, gymId)

    // Guardar walletPassId y timestamp en el Member
    await db.member.update({
      where: { id: memberId },
      data: {
        walletPassId: `${gymId}-${memberId}`,
        walletPassUpdatedAt: new Date(),
      },
    })

    return new NextResponse(passBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="gymapp.pkpass"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error generando el pass"
    console.error("[wallet/apple] Error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
