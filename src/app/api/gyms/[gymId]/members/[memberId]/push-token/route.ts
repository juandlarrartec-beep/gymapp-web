import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { getGymId, ok, err } from "@/lib/db"
import type { ApiResponse } from "@/lib/db"
import { z } from "zod"

const pushTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(["ios", "android"]),
})

// POST /api/gyms/[gymId]/members/[memberId]/push-token
// Registra o actualiza el token FCM del dispositivo del socio
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ gymId: string; memberId: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json(err("No autenticado"), { status: 401 })

  const { gymId, memberId } = await params
  const callerGymId = await getGymId().catch(() => null)
  if (callerGymId !== gymId) return NextResponse.json(err("Sin acceso"), { status: 403 })

  const body: unknown = await req.json()
  const parsed = pushTokenSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json(err("Datos inválidos"), { status: 400 })

  const { token, platform } = parsed.data

  // Upsert: si el token ya existe lo actualiza, sino lo crea
  await db.pushToken.upsert({
    where: { token },
    update: {
      gymId,
      memberId,
      platform,
      isActive: true,
    },
    create: {
      gymId,
      memberId,
      token,
      platform,
      isActive: true,
    },
  })

  return NextResponse.json(ok({ ok: true }))
}
