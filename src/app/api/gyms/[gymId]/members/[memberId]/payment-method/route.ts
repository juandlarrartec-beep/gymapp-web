import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { getGymId, ok, err } from "@/lib/db"
import type { ApiResponse } from "@/lib/db"
import { getPaymentProvider } from "@/lib/payments"
import { z } from "zod"

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ gymId: string; memberId: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json(err("No autenticado"), { status: 401 })

  const { gymId, memberId } = await params
  const callerGymId = await getGymId().catch(() => null)
  if (callerGymId !== gymId) return NextResponse.json(err("Sin acceso"), { status: 403 })

  const member = await db.member.findFirst({
    where: { id: memberId, gymId },
    include: { gym: { select: { country: true, paymentProvider: true } } },
  })
  if (!member) return NextResponse.json(err("Socio no encontrado"), { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json(err("Datos inválidos"), { status: 400 })

  const provider = getPaymentProvider(member.gym.country)

  // Crear o recuperar customer en el proveedor
  const { customerId } = await provider.createCustomer({
    email: parsed.data.email,
    name: parsed.data.name,
    gymId,
    memberId,
  })

  // Crear SetupIntent para que el socio ingrese su tarjeta
  const setupIntent = await provider.createSetupIntent({
    customerId,
    metadata: { gymId, memberId },
  })

  // Guardar customerId en el miembro
  const isStripe = member.gym.paymentProvider === "STRIPE"
  await db.member.update({
    where: { id: memberId },
    data: isStripe
      ? { stripeCustomerId: customerId }
      : { mercadopagoCustomerId: customerId },
  })

  return NextResponse.json(ok({ clientSecret: setupIntent.clientSecret, setupIntentId: setupIntent.setupIntentId, customerId }))
}
