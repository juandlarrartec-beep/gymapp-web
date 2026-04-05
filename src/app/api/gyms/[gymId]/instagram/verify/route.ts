import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { getGymId, ok, err } from "@/lib/db"
import type { ApiResponse } from "@/lib/db"
import { z } from "zod"

const verifySchema = z.object({
  memberId: z.string().cuid(),
  instagramHandle: z.string().min(1).max(50),
  postUrl: z.string().url(),
})

// POST /api/gyms/[gymId]/instagram/verify
// Honor system — marca la publicación como verificada y calcula el descuento
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ gymId: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json(err("No autenticado"), { status: 401 })

  const { gymId } = await params
  const callerGymId = await getGymId().catch(() => null)
  if (callerGymId !== gymId) return NextResponse.json(err("Sin acceso"), { status: 403 })

  const body: unknown = await req.json()
  const parsed = verifySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json(err("Datos inválidos"), { status: 400 })

  const { memberId, instagramHandle } = parsed.data

  const member = await db.member.findFirst({
    where: { id: memberId, gymId },
    select: {
      id: true,
      instagramPostCount: true,
      instagramDiscountPct: true,
    },
  })
  if (!member) return NextResponse.json(err("Socio no encontrado"), { status: 404 })

  const gym = await db.gym.findUnique({
    where: { id: gymId },
    select: {
      instagramProgramEnabled: true,
      instagramDiscount1: true,
      instagramDiscount3: true,
      instagramDiscount5: true,
    },
  })
  if (!gym?.instagramProgramEnabled) {
    return NextResponse.json(err("El programa de descuentos Instagram no está activo"), { status: 400 })
  }

  const newPostCount = member.instagramPostCount + 1

  // Calcular descuento según cantidad de publicaciones
  let discountPct: number
  if (newPostCount >= 5) {
    discountPct = gym.instagramDiscount5
  } else if (newPostCount >= 3) {
    discountPct = gym.instagramDiscount3
  } else {
    discountPct = gym.instagramDiscount1
  }

  await db.member.update({
    where: { id: memberId },
    data: {
      instagramHandle,
      instagramPostCount: newPostCount,
      instagramDiscountPct: discountPct,
    },
  })

  return NextResponse.json(ok({ discountPct, postCount: newPostCount }))
}
