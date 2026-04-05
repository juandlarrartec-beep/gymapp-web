import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { getGymId, ok, err } from "@/lib/db"
import type { ApiResponse } from "@/lib/db"
import { getPaymentProvider } from "@/lib/payments"

export async function POST(
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
    include: {
      membershipPlan: { select: { priceAmount: true, currency: true, name: true } },
      gym: { select: { country: true, name: true } },
    },
  })
  if (!member) return NextResponse.json(err("Socio no encontrado"), { status: 404 })

  const provider = getPaymentProvider(member.gym.country)

  const link = await provider.createPaymentLink({
    amount: member.membershipPlan.priceAmount,
    currency: member.membershipPlan.currency,
    description: `${member.gym.name} — ${member.membershipPlan.name}`,
    customerEmail: member.email,
    metadata: { gymId, memberId },
    expiresInMinutes: 60 * 48, // 48 horas
  })

  return NextResponse.json(ok(link))
}
