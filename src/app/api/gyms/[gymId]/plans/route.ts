import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { getGymId, ok, err } from "@/lib/db"
import type { ApiResponse } from "@/lib/db"
import { z } from "zod"

const planSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  priceAmount: z.number().int().positive(),
  currency: z.string().length(3).optional(),
  durationDays: z.number().int().positive().default(30),
  isActive: z.boolean().optional().default(true),
  accessDays: z.array(z.string()).optional().default([]),
  accessHourStart: z.number().int().min(0).max(23).optional().nullable(),
  accessHourEnd: z.number().int().min(0).max(23).optional().nullable(),
})

type PlanData = z.infer<typeof planSchema>

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ gymId: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json(err("No autenticado"), { status: 401 })

  const { gymId } = await params

  // Verificar que el gym pertenece al usuario
  const callerGymId = await getGymId().catch(() => null)
  if (callerGymId !== gymId) {
    return NextResponse.json(err("Sin acceso a este gym"), { status: 403 })
  }

  const plans = await db.membershipPlan.findMany({
    where: { gymId },
    orderBy: { priceAmount: "asc" },
  })

  return NextResponse.json(ok(plans))
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ gymId: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json(err("No autenticado"), { status: 401 })

  const { gymId } = await params

  const callerGymId = await getGymId().catch(() => null)
  if (callerGymId !== gymId) {
    return NextResponse.json(err("Sin acceso a este gym"), { status: 403 })
  }

  const body = await req.json()
  const parsed = planSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(err(parsed.error.errors[0]?.message ?? "Datos inválidos"), { status: 400 })
  }

  const data: PlanData = parsed.data
  const gym = await db.gym.findUnique({ where: { id: gymId }, select: { currency: true } })

  const plan = await db.membershipPlan.create({
    data: {
      gymId,
      name: data.name,
      description: data.description,
      priceAmount: data.priceAmount,
      currency: data.currency ?? gym?.currency ?? "ARS",
      durationDays: data.durationDays,
      isActive: data.isActive,
      accessDays: data.accessDays,
      accessHourStart: data.accessHourStart ?? null,
      accessHourEnd: data.accessHourEnd ?? null,
    },
  })

  return NextResponse.json(ok(plan), { status: 201 })
}
